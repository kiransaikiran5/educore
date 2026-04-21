from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ReviewBase(BaseModel):
    rating: int
    review_text: str

class ReviewCreate(ReviewBase):
    course_id: int

class ReviewResponse(ReviewBase):
    id: int
    user_id: int
    course_id: int
    created_at: datetime
    username: Optional[str] = None
    
    class Config:
        from_attributes = True