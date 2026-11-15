from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# ============================================================
# ADMIN
# ============================================================

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


# ============================================================
# EVENT
# ============================================================

class EventBase(BaseModel):
    name: str
    department: str
    link: str
    description: Optional[str] = None
    event_date: Optional[str] = None
    prize: Optional[str] = None
    mode: Optional[str] = None
    venue: Optional[str] = None
    registration_deadline: Optional[str] = None
    team_size: Optional[str] = None
    organizer: Optional[str] = None


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    link: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[str] = None
    prize: Optional[str] = None
    mode: Optional[str] = None
    venue: Optional[str] = None
    registration_deadline: Optional[str] = None
    team_size: Optional[str] = None
    organizer: Optional[str] = None


class EventOut(EventBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================================
# PROJECT
# ============================================================

class ProjectCreate(BaseModel):
    title: str
    owner_name: str
    owner_email: EmailStr
    team_name: Optional[str] = None
    github_link: str
    department: str
    tech_stack: Optional[str] = None
    what_done: Optional[str] = None
    what_left: Optional[str] = None
    roles_needed: Optional[str] = None
    progress: Optional[int] = 0


class ProjectOut(ProjectCreate):
    id: int
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================================
# PROJECT REQUEST
# ============================================================

class ProjectRequestCreate(BaseModel):
    project_id: int
    requester_name: str
    requester_email: EmailStr
    message: Optional[str] = None


class ProjectRequestOut(ProjectRequestCreate):
    id: int
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
