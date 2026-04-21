from sqlalchemy.orm import Session
from app.models.models import Lesson, Progress

def calculate_course_progress(db: Session, user_id: int, course_id: int) -> float:
    total_lessons = db.query(Lesson).filter(Lesson.course_id == course_id).count()
    if total_lessons == 0:
        return 0.0
    
    completed_lessons = db.query(Progress).join(Lesson).filter(
        Progress.user_id == user_id,
        Progress.completed == True,
        Lesson.course_id == course_id
    ).count()
    
    return (completed_lessons / total_lessons) * 100