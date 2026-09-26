from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class AdminLogin(BaseModel):
    email: EmailStr
    password: str

class AdminOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    token: str
    admin: AdminOut

class EventBase(BaseModel):
    name: str
    department: str
    link: str
    description: Optional[str] = None
    event_date: Optional[str] = None

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    link: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[str] = None

class EventOut(EventBase):
    id: int
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True
        