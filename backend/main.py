import os
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from database import Base, engine, get_db, SessionLocal
from models import Admin, Event, Project, ProjectRequest
from schemas import (
    AdminLogin, AdminOut, TokenResponse,
    EventCreate, EventUpdate, EventOut,
    ProjectCreate, ProjectOut,
    ProjectRequestCreate, ProjectRequestOut,
)
from auth import (
    hash_password, verify_password,
    create_access_token, get_current_admin,
)

load_dotenv()

# ============================================================
# DATABASE SETUP — Force fresh DB on startup
# ============================================================
_db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hackathon.db")
if os.path.exists(_db_path):
    try:
        os.remove(_db_path)
        print("[DB] Removed old database file")
    except Exception as e:
        print(f"[DB] Could not remove old DB: {e}")

Base.metadata.create_all(bind=engine)
print("[DB] All tables created")


# ============================================================
# SEED ADMIN
# ============================================================
def seed_admin():
    db = SessionLocal()
    try:
        if db.query(Admin).count() == 0:
            email = os.getenv("ADMIN_EMAIL", "admin@college.edu")
            password = os.getenv("ADMIN_PASSWORD", "admin123")
            name = os.getenv("ADMIN_NAME", "College Admin")
            admin = Admin(name=name, email=email, password=hash_password(password))
            db.add(admin)
            db.commit()
            print(f"[OK] Default admin created: {email} / {password}")
    finally:
        db.close()


seed_admin()


# ============================================================
# APP
# ============================================================
app = FastAPI(title="HackTrack API", version="2.0.0")

@app.get("/api/debug")
def debug(db: Session = Depends(get_db)):
    import traceback
    try:
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        project_count = db.query(Project).count()
        return {
            "status": "ok",
            "tables": tables,
            "project_table_exists": "projects" in tables,
            "project_count": project_count,
            "db_file_exists": os.path.exists(_db_path),
        }
    except Exception as e:
        return {
            "error_type": type(e).__name__,
            "error_message": str(e),
            "traceback": traceback.format_exc()
        }

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# AUTH ROUTES
# ============================================================
@app.post("/api/auth/login", response_model=TokenResponse)
def login(payload: AdminLogin, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.email == payload.email).first()
    if not admin or not verify_password(payload.password, admin.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": admin.email, "id": admin.id})
    return {"token": token, "admin": admin}


# ============================================================
# PUBLIC EVENT ROUTES
# ============================================================
@app.get("/api/events", response_model=list[EventOut])
def list_events(department: str | None = Query(None), db: Session = Depends(get_db)):
    q = db.query(Event)
    if department and department != "all":
        q = q.filter(Event.department == department)
    return q.order_by(Event.created_at.desc()).all()


@app.get("/api/events/{event_id}", response_model=EventOut)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


# ============================================================
# ADMIN EVENT ROUTES
# ============================================================
@app.get("/api/admin/me", response_model=AdminOut)
def me(current: Admin = Depends(get_current_admin)):
    return current


@app.post("/api/admin/events", response_model=EventOut, status_code=201)
def create_event(
    payload: EventCreate,
    db: Session = Depends(get_db),
    current: Admin = Depends(get_current_admin),
):
    event = Event(
        name=payload.name,
        department=payload.department,
        link=payload.link,
        description=payload.description,
        event_date=payload.event_date,
        prize=payload.prize,
        mode=payload.mode,
        venue=payload.venue,
        registration_deadline=payload.registration_deadline,
        team_size=payload.team_size,
        organizer=payload.organizer,
        created_by=current.id,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@app.put("/api/admin/events/{event_id}", response_model=EventOut)
def update_event(
    event_id: int,
    payload: EventUpdate,
    db: Session = Depends(get_db),
    current: Admin = Depends(get_current_admin),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
    db.commit()
    db.refresh(event)
    return event


@app.delete("/api/admin/events/{event_id}")
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current: Admin = Depends(get_current_admin),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()
    return {"success": True}


# ============================================================
# PROJECTS
# ============================================================
@app.post("/api/projects", response_model=ProjectOut, status_code=201)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    project = Project(
        title=payload.title,
        owner_name=payload.owner_name,
        owner_email=payload.owner_email,
        team_name=payload.team_name,
        github_link=payload.github_link,
        department=payload.department,
        tech_stack=payload.tech_stack,
        what_done=payload.what_done,
        what_left=payload.what_left,
        roles_needed=payload.roles_needed,
        progress=payload.progress or 0,
        status="pending",
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@app.get("/api/projects", response_model=list[ProjectOut])
def list_projects(department: str | None = Query(None), db: Session = Depends(get_db)):
    q = db.query(Project).filter(Project.status == "approved")
    if department and department != "all":
        q = q.filter(Project.department == department)
    return q.order_by(Project.created_at.desc()).all()


@app.get("/api/admin/projects", response_model=list[ProjectOut])
def admin_list_projects(
    current: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return db.query(Project).order_by(Project.created_at.desc()).all()


@app.put("/api/admin/projects/{project_id}/approve", response_model=ProjectOut)
def approve_project(
    project_id: int,
    current: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.status = "approved"
    db.commit()
    db.refresh(project)
    return project


@app.put("/api/admin/projects/{project_id}/reject", response_model=ProjectOut)
def reject_project(
    project_id: int,
    current: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.status = "rejected"
    db.commit()
    db.refresh(project)
    return project


@app.delete("/api/admin/projects/{project_id}")
def delete_project(
    project_id: int,
    current: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"success": True}


# ============================================================
# PROJECT REQUESTS
# ============================================================
@app.post("/api/project-requests", response_model=ProjectRequestOut, status_code=201)
def create_project_request(payload: ProjectRequestCreate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.status != "approved":
        raise HTTPException(status_code=400, detail="Project is not approved yet")
    req = ProjectRequest(
        project_id=payload.project_id,
        requester_name=payload.requester_name,
        requester_email=payload.requester_email,
        message=payload.message,
        status="pending",
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


@app.get("/api/projects/{project_id}/requests", response_model=list[ProjectRequestOut])
def list_project_requests(project_id: int, db: Session = Depends(get_db)):
    return db.query(ProjectRequest).filter(
        ProjectRequest.project_id == project_id
    ).all()


@app.get("/api/admin/project-requests", response_model=list[ProjectRequestOut])
def admin_list_requests(
    current: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return db.query(ProjectRequest).order_by(ProjectRequest.created_at.desc()).all()


@app.put("/api/admin/project-requests/{req_id}/approve", response_model=ProjectRequestOut)
def approve_request(
    req_id: int,
    current: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    req = db.query(ProjectRequest).filter(ProjectRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    req.status = "approved"
    db.commit()
    db.refresh(req)
    return req


@app.put("/api/admin/project-requests/{req_id}/reject", response_model=ProjectRequestOut)
def reject_request(
    req_id: int,
    current: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    req = db.query(ProjectRequest).filter(ProjectRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    req.status = "rejected"
    db.commit()
    db.refresh(req)
    return req


# ============================================================
# SERVE FRONTEND
# ============================================================
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend")
if os.path.isdir(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
