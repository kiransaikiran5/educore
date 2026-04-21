from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.core.database import get_db
from app.models.models import Quiz, Question, Result, User, Course, Enrollment
from app.schemas.quiz import QuizCreate, QuizResponse, QuizSubmission, QuizPerformanceSummary
from app.api.auth import get_current_active_user, role_required

router = APIRouter()


@router.post("/", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
async def create_quiz(
    quiz_data: QuizCreate,
    current_user: User = Depends(role_required("INSTRUCTOR")),
    db: Session = Depends(get_db)
):
    """Create a new quiz with questions (instructor only)."""
    # Verify instructor owns the course
    course = db.query(Course).filter(
        Course.id == quiz_data.course_id,
        Course.instructor_id == current_user.id
    ).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to add quiz to this course"
        )
    
    # Create quiz
    quiz = Quiz(course_id=quiz_data.course_id, title=quiz_data.title)
    db.add(quiz)
    db.flush()  # get quiz.id
    
    # Create questions
    for q_data in quiz_data.questions:
        question = Question(
            quiz_id=quiz.id,
            question_text=q_data.question_text,
            options=q_data.options,
            correct_answer=q_data.correct_answer
        )
        db.add(question)
    
    db.commit()
    db.refresh(quiz)
    return quiz


@router.get("/course/{course_id}", response_model=List[QuizResponse])
async def get_course_quizzes(
    course_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all quizzes for a course. Students must be enrolled, and see no correct answers."""
    # Check course exists
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # For students, verify enrollment
    if current_user.role.value == "STUDENT":
        enrollment = db.query(Enrollment).filter(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == course_id
        ).first()
        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be enrolled to view quizzes"
            )
    
    # Fetch quizzes
    quizzes = db.query(Quiz).filter(Quiz.course_id == course_id).all()
    
    # Hide correct answers for students
    if current_user.role.value == "STUDENT":
        response_quizzes = []
        for quiz in quizzes:
            questions_response = []
            for q in quiz.questions:
                questions_response.append({
                    "id": q.id,
                    "quiz_id": q.quiz_id,
                    "question_text": q.question_text,
                    "options": q.options,
                    "correct_answer": None  # hidden
                })
            response_quizzes.append({
                "id": quiz.id,
                "course_id": quiz.course_id,
                "title": quiz.title,
                "questions": questions_response
            })
        return response_quizzes
    
    # Instructors see everything
    return quizzes


@router.get("/{quiz_id}", response_model=QuizResponse)
async def get_quiz(
    quiz_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a single quiz. Students see no correct answers and must be enrolled in the course."""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # For students, verify enrollment in the parent course
    if current_user.role.value == "STUDENT":
        enrollment = db.query(Enrollment).filter(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == quiz.course_id
        ).first()
        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not enrolled in this course"
            )
    
    if current_user.role.value == "STUDENT":
        questions_response = []
        for q in quiz.questions:
            questions_response.append({
                "id": q.id,
                "quiz_id": q.quiz_id,
                "question_text": q.question_text,
                "options": q.options,
                "correct_answer": None
            })
        return {
            "id": quiz.id,
            "course_id": quiz.course_id,
            "title": quiz.title,
            "questions": questions_response
        }
    
    return quiz


@router.post("/{quiz_id}/submit")
async def submit_quiz(
    quiz_id: int,
    submission: QuizSubmission,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Submit answers for a quiz and get score. Student must be enrolled."""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Verify enrollment
    if current_user.role.value == "STUDENT":
        enrollment = db.query(Enrollment).filter(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == quiz.course_id
        ).first()
        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not enrolled in this course"
            )
    
    # Calculate score
    total_questions = len(quiz.questions)
    correct_answers = 0
    for answer in submission.answers:
        question = next((q for q in quiz.questions if q.id == answer.question_id), None)
        if question and question.correct_answer == answer.selected_option:
            correct_answers += 1
    
    score = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
    
    # Save result
    result = Result(
        user_id=current_user.id,
        quiz_id=quiz_id,
        score=score
    )
    db.add(result)
    db.commit()
    
    # Optional: create notification (import only if needed)
    try:
        from app.services.notification_service import create_notification
        create_notification(
            db, None, current_user.id,
            "Quiz Completed",
            f"You scored {score:.1f}% on quiz: {quiz.title}"
        )
    except ImportError:
        pass  # Notification service not implemented
    
    return {
        "score": score,
        "correct_answers": correct_answers,
        "total_questions": total_questions
    }


@router.get("/performance/summary", response_model=QuizPerformanceSummary)
async def get_quiz_performance_summary(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Return average quiz score and last 5 quiz results for the student."""
    results = (
        db.query(Result)
        .options(joinedload(Result.quiz))
        .filter(Result.user_id == current_user.id)
        .order_by(Result.completed_at.desc())
        .all()
    )
    
    if not results:
        return QuizPerformanceSummary(
            average_score=0.0,
            total_quizzes=0,
            recent_results=[]
        )
    
    avg_score = sum(r.score for r in results) / len(results)
    
    recent = []
    for r in results[:5]:
        recent.append({
            "quiz_id": r.quiz_id,
            "quiz_title": r.quiz.title if r.quiz else "Deleted Quiz",
            "score": r.score,
            "completed_at": r.completed_at.isoformat() if r.completed_at else None
        })
    
    return QuizPerformanceSummary(
        average_score=round(avg_score, 1),
        total_quizzes=len(results),
        recent_results=recent
    )