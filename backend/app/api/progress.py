from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.models.models import Progress, Lesson, User, Enrollment
from app.schemas.progress import CourseProgressResponse
from app.api.auth import get_current_active_user

router = APIRouter()

@router.post("/{lesson_id}/complete")
async def mark_lesson_complete(
    lesson_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verify user is enrolled in the course containing this lesson
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == lesson.course_id
    ).first()
    if not enrollment:
        raise HTTPException(status_code=403, detail="Not enrolled in this course")
    
    progress = db.query(Progress).filter(
        Progress.user_id == current_user.id,
        Progress.lesson_id == lesson_id
    ).first()
    
    if progress:
        progress.completed = True
        progress.completed_at = datetime.utcnow()
    else:
        progress = Progress(
            user_id=current_user.id,
            lesson_id=lesson_id,
            completed=True,
            completed_at=datetime.utcnow()
        )
        db.add(progress)
    
    db.commit()
    return {"message": "Lesson marked as complete"}

@router.get("/course/{course_id}", response_model=CourseProgressResponse)
async def get_course_progress(
    course_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    from app.services.progress_service import calculate_course_progress
    progress_percentage = calculate_course_progress(db, current_user.id, course_id)
    
    lessons = db.query(Lesson).filter(Lesson.course_id == course_id).order_by(Lesson.order).all()
    lesson_progress = []
    
    for lesson in lessons:
        progress = db.query(Progress).filter(
            Progress.user_id == current_user.id,
            Progress.lesson_id == lesson.id
        ).first()
        lesson_progress.append({
            "lesson_id": lesson.id,
            "title": lesson.title,
            "completed": progress.completed if progress else False,
            "completed_at": progress.completed_at if progress else None
        })
    
    return CourseProgressResponse(percentage=progress_percentage, lessons=lesson_progress)