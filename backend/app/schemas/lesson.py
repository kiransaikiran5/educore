from pydantic import BaseModel
from typing import Optional, List

class LessonBase(BaseModel):
    title: str
    content_url: str
    duration: int
    order: int

class LessonCreate(LessonBase):
    course_id: int

class LessonUpdate(BaseModel):
    title: Optional[str] = None
    content_url: Optional[str] = None
    duration: Optional[int] = None
    order: Optional[int] = None

class LessonResponse(BaseModel):
    id: int
    course_id: int
    title: str
    content_url: str
    duration: int
    order: int
    
    class Config:
        from_attributes = True

class LessonOrderItem(BaseModel):
    id: int
    order: int

class LessonOrderUpdate(BaseModel):
    course_id: int
    lessons: List[LessonOrderItem]