from sqlalchemy.orm import Session
from app.models.models import Notification, Enrollment

def create_notification(db: Session, course_id: int = None, user_id: int = None, 
                       title: str = "", message: str = ""):
    if course_id and not user_id:
        enrollments = db.query(Enrollment).filter(Enrollment.course_id == course_id).all()
        for enrollment in enrollments:
            notification = Notification(
                user_id=enrollment.user_id,
                title=title,
                message=message
            )
            db.add(notification)
    elif user_id:
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message
        )
        db.add(notification)
    
    db.commit()