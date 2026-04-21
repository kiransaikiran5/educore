from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List
from app.core.database import get_db
from app.models.models import Lesson, Course, User, Enrollment
from app.schemas.lesson import (
    LessonCreate,
    LessonUpdate,
    LessonResponse,
    LessonOrderUpdate,
)
from app.api.auth import get_current_active_user, role_required

router = APIRouter()


# -----------------------------------------------------------------------------
# POST /lessons/ – Create a new lesson
# -----------------------------------------------------------------------------
@router.post("/", response_model=LessonResponse, status_code=status.HTTP_201_CREATED)
async def create_lesson(
    lesson_data: LessonCreate,
    current_user: User = Depends(role_required("INSTRUCTOR")),
    db: Session = Depends(get_db),
):
    # Verify that the instructor owns the course
    course = db.query(Course).filter(
        and_(
            Course.id == lesson_data.course_id,
            Course.instructor_id == current_user.id,
        )
    ).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to add lessons to this course",
        )

    new_lesson = Lesson(**lesson_data.dict())
    db.add(new_lesson)
    db.commit()
    db.refresh(new_lesson)

    # Notify enrolled students (optional)
    from app.services.notification_service import create_notification

    create_notification(
        db,
        course_id=course.id,
        title="New Lesson Added",
        message=f"A new lesson '{lesson_data.title}' was added to {course.title}.",
    )

    return new_lesson


# -----------------------------------------------------------------------------
# GET /lessons/course/{course_id} – Retrieve all lessons for a course
# -----------------------------------------------------------------------------
@router.get("/course/{course_id}", response_model=List[LessonResponse])
async def get_course_lessons(
    course_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    # Check if course exists
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # If student, ensure they are enrolled (or course is free/public – adjust as needed)
    if current_user.role.value == "STUDENT":
        enrollment = (
            db.query(Enrollment)
            .filter(
                Enrollment.user_id == current_user.id,
                Enrollment.course_id == course_id,
            )
            .first()
        )
        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be enrolled to view lessons",
            )

    lessons = (
        db.query(Lesson)
        .filter(Lesson.course_id == course_id)
        .order_by(Lesson.order)
        .all()
    )
    return lessons


# -----------------------------------------------------------------------------
# PUT /lessons/order – Update lesson order (drag & drop)
# MUST be defined BEFORE /{lesson_id} to avoid path capture
# -----------------------------------------------------------------------------
@router.put("/order", response_model=List[LessonResponse])
async def update_lesson_order(
    order_update: LessonOrderUpdate,
    current_user: User = Depends(role_required("INSTRUCTOR")),
    db: Session = Depends(get_db),
):
    # Verify course ownership
    course = db.query(Course).filter(
        and_(
            Course.id == order_update.course_id,
            Course.instructor_id == current_user.id,
        )
    ).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )

    # Update each lesson's order
    for item in order_update.lessons:
        lesson = (
            db.query(Lesson)
            .filter(
                Lesson.id == item.id,
                Lesson.course_id == order_update.course_id,
            )
            .first()
        )
        if lesson:
            lesson.order = item.order

    db.commit()

    # Return the updated list
    return (
        db.query(Lesson)
        .filter(Lesson.course_id == order_update.course_id)
        .order_by(Lesson.order)
        .all()
    )


# -----------------------------------------------------------------------------
# PUT /lessons/{lesson_id} – Update a single lesson
# -----------------------------------------------------------------------------
@router.put("/{lesson_id}", response_model=LessonResponse)
async def update_lesson(
    lesson_id: int,
    lesson_update: LessonUpdate,
    current_user: User = Depends(role_required("INSTRUCTOR")),
    db: Session = Depends(get_db),
):
    # Ensure the instructor owns the course that contains this lesson
    lesson = (
        db.query(Lesson)
        .join(Course)
        .filter(
            and_(
                Lesson.id == lesson_id,
                Course.instructor_id == current_user.id,
            )
        )
        .first()
    )
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found or not authorized",
        )

    # Partial update (only provided fields)
    update_data = lesson_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lesson, field, value)

    db.commit()
    db.refresh(lesson)
    return lesson


# -----------------------------------------------------------------------------
# DELETE /lessons/{lesson_id} – Delete a lesson
# -----------------------------------------------------------------------------
@router.delete("/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lesson(
    lesson_id: int,
    current_user: User = Depends(role_required("INSTRUCTOR")),
    db: Session = Depends(get_db),
):
    # Ensure the instructor owns the course that contains this lesson
    lesson = (
        db.query(Lesson)
        .join(Course)
        .filter(
            and_(
                Lesson.id == lesson_id,
                Course.instructor_id == current_user.id,
            )
        )
        .first()
    )
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found or not authorized",
        )

    db.delete(lesson)
    db.commit()
    return  # No content