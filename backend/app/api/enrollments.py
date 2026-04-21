from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Enrollment, Course, User
from app.schemas.enrollment import EnrolledCourseResponse
from app.api.auth import get_current_active_user

router = APIRouter()

@router.post("/{course_id}")
async def enroll_course(
    course_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    existing = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == course_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already enrolled")
    
    enrollment = Enrollment(user_id=current_user.id, course_id=course_id)
    db.add(enrollment)
    db.commit()
    
    from app.services.notification_service import create_notification
    course = db.query(Course).filter(Course.id == course_id).first()
    create_notification(
        db, None, current_user.id,
        "Course Enrollment",
        f"You have successfully enrolled in {course.title}"
    )
    
    return {"message": "Enrolled successfully"}

@router.get("/my-courses", response_model=list[EnrolledCourseResponse])
async def get_my_courses(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    enrollments = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id
    ).all()
    
    courses = []
    for enrollment in enrollments:
        course = db.query(Course).filter(Course.id == enrollment.course_id).first()
        if course:
            from app.services.progress_service import calculate_course_progress
            progress = calculate_course_progress(db, current_user.id, course.id)
            
            course_dict = {
                "id": course.id,
                "instructor_id": course.instructor_id,
                "title": course.title,
                "description": course.description,
                "category": course.category,
                "price": course.price,
                "created_at": course.created_at,
                "progress": progress,
                "enrolled_at": enrollment.enrolled_at
            }
            courses.append(course_dict)
    
    return courses

@router.get("/check/{course_id}")
async def check_enrollment(
    course_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == course_id
    ).first()
    return {"enrolled": enrollment is not None}