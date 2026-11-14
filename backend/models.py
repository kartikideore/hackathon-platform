from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base


class Admin(Base):
    __tablename__ = "admins"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    department = Column(String, nullable=False)
    link = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    event_date = Column(String, nullable=True)
    prize = Column(String, nullable=True)
    mode = Column(String, nullable=True)          # Online / Offline / Hybrid
    venue = Column(String, nullable=True)
    registration_deadline = Column(String, nullable=True)
    team_size = Column(String, nullable=True)
    organizer = Column(String, nullable=True)
    created_by = Column(Integer, ForeignKey("admins.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    owner_name = Column(String, nullable=False)
    owner_email = Column(String, nullable=False)
    team_name = Column(String, nullable=True)
    github_link = Column(String, nullable=False)
    department = Column(String, nullable=False)
    tech_stack = Column(String, nullable=True)
    what_done = Column(Text, nullable=True)
    what_left = Column(Text, nullable=True)
    roles_needed = Column(Text, nullable=True)
    progress = Column(Integer, default=0)          # 0-100 percent
    status = Column(String, default="pending")     # pending / approved / rejected
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ProjectRequest(Base):
    __tablename__ = "project_requests"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    requester_name = Column(String, nullable=False)
    requester_email = Column(String, nullable=False)
    message = Column(Text, nullable=True)
    status = Column(String, default="pending")     # pending / approved / rejected
    created_at = Column(DateTime(timezone=True), server_default=func.now())
