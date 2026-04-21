from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CourseBase(BaseModel):
    title: str
    description: str
    category: str
    price: float = 0.0

class CourseCreate(CourseBase):
    pass

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None

class CourseResponse(BaseModel):
    id: int
    instructor_id: int
    title: str
    description: str
    category: str
    price: float = 0.0
    created_at: datetime
    instructor_name: Optional[str] = None
    average_rating: Optional[float] = None
    total_enrollments: Optional[int] = None
    
    class Config:
        from_attributes = True

class CourseListResponse(BaseModel):
    courses: List[CourseResponse]
    total: int