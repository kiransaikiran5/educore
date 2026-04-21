from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import Review, Enrollment, User
from app.schemas.review import ReviewCreate, ReviewResponse
from app.api.auth import get_current_active_user

router = APIRouter()

@router.post("/", response_model=ReviewResponse)
async def create_review(
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == review_data.course_id
    ).first()
    if not enrollment:
        raise HTTPException(status_code=403, detail="Must be enrolled to review")
    
    existing = db.query(Review).filter(
        Review.user_id == current_user.id,
        Review.course_id == review_data.course_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already reviewed this course")
    
    review = Review(
        user_id=current_user.id,
        **review_data.dict()
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review

@router.get("/course/{course_id}", response_model=List[ReviewResponse])
async def get_course_reviews(
    course_id: int,
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    reviews = db.query(Review).filter(
        Review.course_id == course_id
    ).offset(skip).limit(limit).all()
    
    for review in reviews:
        user = db.query(User).filter(User.id == review.user_id).first()
        review.username = user.username if user else "Anonymous"
    
    return reviews