import os
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from database import Base, engine, get_db, SessionLocal
from models import Admin, Event
from schemas import (AdminLogin, AdminOut, TokenResponse,
                     EventCreate, EventUpdate, EventOut)
from auth import (hash_password, verify_password,
                  create_access_token, get_current_admin)

load_dotenv()
Base.metadata.create_all(bind=engine)

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

app = FastAPI(title="HackHub API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/auth/login", response_model=TokenResponse)
def login(payload: AdminLogin, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.email == payload.email).first()
    if not admin or not verify_password(payload.password, admin.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": admin.email, "id": admin.id})
    return {"token": token, "admin": admin}

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

@app.get("/api/admin/me", response_model=AdminOut)
def me(current: Admin = Depends(get_current_admin)):
    return current

@app.post("/api/admin/events", response_model=EventOut, status_code=201)
def create_event(payload: EventCreate, db: Session = Depends(get_db),
                 current: Admin = Depends(get_current_admin)):
    event = Event(name=payload.name, department=payload.department,
                  link=payload.link, description=payload.description,
                  event_date=payload.event_date, created_by=current.id)
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

@app.put("/api/admin/events/{event_id}", response_model=EventOut)
def update_event(event_id: int, payload: EventUpdate,
                 db: Session = Depends(get_db),
                 current: Admin = Depends(get_current_admin)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
    db.commit()
    db.refresh(event)
    return event

@app.delete("/api/admin/events/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db),
                 current: Admin = Depends(get_current_admin)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()
    return {"success": True}

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend")
if os.path.isdir(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
    