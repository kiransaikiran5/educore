from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.models.models import Course, User, Enrollment, Review
from app.schemas.course import CourseCreate, CourseUpdate, CourseResponse, CourseListResponse
from app.api.auth import get_current_active_user, role_required

router = APIRouter()

@router.post("/", response_model=CourseResponse)
async def create_course(
    course_data: CourseCreate,
    current_user: User = Depends(role_required("INSTRUCTOR")),
    db: Session = Depends(get_db)
):
    """Create a new course (instructor only)"""
    new_course = Course(
        **course_data.dict(),
        instructor_id=current_user.id
    )
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    return new_course

@router.get("/", response_model=CourseListResponse)
async def get_courses(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    category: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    db: Session = Depends(get_db)
):
    """Get all courses with filtering, pagination and sorting"""
    query = db.query(Course)
    
    if category:
        query = query.filter(Course.category == category)
    
    if search:
        query = query.filter(
            Course.title.ilike(f"%{search}%") | 
            Course.description.ilike(f"%{search}%")
        )
    
    total = query.count()
    
    if sort_by == "price":
        order_col = Course.price
    elif sort_by == "rating":
        avg_rating = db.query(
            Review.course_id,
            func.avg(Review.rating).label('avg_rating')
        ).group_by(Review.course_id).subquery()
        query = query.outerjoin(avg_rating, Course.id == avg_rating.c.course_id)
        order_col = func.coalesce(avg_rating.c.avg_rating, 0)
    else:
        order_col = Course.created_at
    
    if sort_order == "asc":
        query = query.order_by(order_col.asc())
    else:
        query = query.order_by(order_col.desc())
    
    courses = query.offset(skip).limit(limit).all()
    
    course_responses = []
    for course in courses:
        instructor = db.query(User).filter(User.id == course.instructor_id).first()
        avg_rating = db.query(func.avg(Review.rating)).filter(Review.course_id == course.id).scalar()
        total_enrollments = db.query(Enrollment).filter(Enrollment.course_id == course.id).count()
        
        # Pydantic v2 style: use model_validate with from_attributes=True
        course_response = CourseResponse.model_validate(course, from_attributes=True)
        course_response.instructor_name = instructor.username if instructor else None
        course_response.average_rating = float(avg_rating) if avg_rating is not None else None
        course_response.total_enrollments = total_enrollments
        course_responses.append(course_response)
    
    return CourseListResponse(courses=course_responses, total=total)

@router.get("/instructor/courses", response_model=List[CourseResponse])
async def get_instructor_courses(
    current_user: User = Depends(role_required("INSTRUCTOR")),
    db: Session = Depends(get_db)
):
    """Get all courses created by the logged-in instructor, with statistics"""
    courses = db.query(Course).filter(Course.instructor_id == current_user.id).all()
    
    # Enhance each course with enrollment count and average rating
    course_responses = []
    for course in courses:
        # Count enrollments
        total_enrollments = db.query(Enrollment).filter(Enrollment.course_id == course.id).count()
        
        # Calculate average rating
        avg_rating = db.query(func.avg(Review.rating)).filter(Review.course_id == course.id).scalar()
        
        # Convert ORM object to response schema
        course_response = CourseResponse.model_validate(course, from_attributes=True)
        course_response.instructor_name = current_user.username  # instructor is the current user
        course_response.average_rating = float(avg_rating) if avg_rating is not None else None
        course_response.total_enrollments = total_enrollments
        
        course_responses.append(course_response)
    
    return course_responses

@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a single course by ID with statistics"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    instructor = db.query(User).filter(User.id == course.instructor_id).first()
    avg_rating = db.query(func.avg(Review.rating)).filter(Review.course_id == course_id).scalar()
    total_enrollments = db.query(Enrollment).filter(Enrollment.course_id == course_id).count()
    
    course_response = CourseResponse.model_validate(course, from_attributes=True)
    course_response.instructor_name = instructor.username if instructor else None
    course_response.average_rating = float(avg_rating) if avg_rating is not None else None
    course_response.total_enrollments = total_enrollments
    
    return course_response

@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: int,
    course_update: CourseUpdate,
    current_user: User = Depends(role_required("INSTRUCTOR")),
    db: Session = Depends(get_db)
):
    """Update a course (only the instructor who created it)"""
    course = db.query(Course).filter(
        and_(Course.id == course_id, Course.instructor_id == current_user.id)
    ).first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or you don't have permission"
        )
    
    for key, value in course_update.dict(exclude_unset=True).items():
        setattr(course, key, value)
    
    db.commit()
    db.refresh(course)
    return course

@router.delete("/{course_id}")
async def delete_course(
    course_id: int,
    current_user: User = Depends(role_required("INSTRUCTOR")),
    db: Session = Depends(get_db)
):
    """Delete a course (only the instructor who created it)"""
    course = db.query(Course).filter(
        and_(Course.id == course_id, Course.instructor_id == current_user.id)
    ).first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or you don't have permission"
        )
    
    db.delete(course)
    db.commit()
    return {"message": "Course deleted successfully"}

@router.get("/categories/all")
async def get_categories(db: Session = Depends(get_db)):
    """Get all distinct course categories"""
    categories = db.query(Course.category).distinct().all()
    return [cat[0] for cat in categories if cat[0]]