from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str | None = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str | None = None
    created_at: datetime
    class Config:
        from_attributes = True  # SQLAlchemy -> Pydantic v2

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
