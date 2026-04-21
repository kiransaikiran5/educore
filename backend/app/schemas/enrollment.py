from typing import Optional

from pydantic import BaseModel
from datetime import datetime
from app.schemas.course import CourseResponse

class EnrollmentResponse(BaseModel):
    id: int
    user_id: int
    course_id: int
    enrolled_at: datetime
    
    class Config:
        from_attributes = True

class EnrolledCourseResponse(CourseResponse):
    progress: Optional[float] = None
    enrolled_at: datetime