from pydantic import BaseModel
from typing import List, Optional

class QuestionBase(BaseModel):
    question_text: str
    options: List[str]
    correct_answer: int

class QuestionCreate(QuestionBase):
    pass

class QuestionResponse(BaseModel):
    id: int
    quiz_id: int
    question_text: str
    options: List[str]
    correct_answer: Optional[int] = None   # <-- Allow None for students
    
    class Config:
        from_attributes = True

class QuizBase(BaseModel):
    course_id: int
    title: str

class QuizCreate(QuizBase):
    course_id: int
    questions: List[QuestionCreate]

class QuizResponse(QuizBase):
    id: int
    course_id: int
    questions: List[QuestionResponse] = []
    
    class Config:
        from_attributes = True

class QuizAnswer(BaseModel):
    question_id: int
    selected_option: int

class QuizSubmission(BaseModel):
    answers: List[QuizAnswer]
    
class QuizPerformanceSummary(BaseModel):
    average_score: float
    total_quizzes: int
    recent_results: List[dict]