from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class LessonProgressResponse(BaseModel):
    lesson_id: int
    title: str
    completed: bool
    completed_at: Optional[datetime] = None

class CourseProgressResponse(BaseModel):
    percentage: float
    lessons: List[LessonProgressResponse]