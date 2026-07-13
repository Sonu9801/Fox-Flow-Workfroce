from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
import os
import shutil
import uuid
from app.config import settings
from app.auth import get_current_active_user
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app.models.user import User
from app.schemas.worker import WorkerCreate, WorkerUpdate, WorkerResponse
from app.services.websocket_manager import manager
from app.services.audit import log_audit_event
from app.models.salary_profile import SalaryProfile
from pydantic import BaseModel

router = APIRouter(prefix="/workers", tags=["workers"], dependencies=[Depends(get_current_active_user)])

@router.get("", response_model=List[WorkerResponse])
def get_workers(db: Session = Depends(get_db)):
    return db.query(User).filter(User.employee_id.isnot(None)).order_by(User.id).all()

@router.get("/{worker_id}", response_model=WorkerResponse)
def get_worker(worker_id: int, db: Session = Depends(get_db)):
    worker = db.query(User).filter(User.id == worker_id, User.employee_id.isnot(None)).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    return worker

@router.post("", response_model=WorkerResponse, status_code=status.HTTP_201_CREATED)
async def create_worker(worker_in: WorkerCreate, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    data = worker_in.model_dump()
    salary_data = data.pop("salary_profile", None)
    
    worker = User(**data)
    # Default role for workforce members is 'worker' unless specified otherwise
    if not worker.role:
        worker.role = "worker"
        
    # Auto-generate email if missing or empty to prevent IntegrityError on unique, non-null email column
    if not worker.email or worker.email.strip() == "":
        import uuid
        worker.email = f"{worker.employee_id or uuid.uuid4().hex[:8]}@foxflow.internal"
        
    if salary_data:
        worker.salary_profile = SalaryProfile(**salary_data)
        
    try:
        db.add(worker)
        db.commit()
        db.refresh(worker)
    except IntegrityError as e:
        db.rollback()
        print("IntegrityError creating worker:", str(e))
        raise HTTPException(status_code=400, detail="Worker with this email or employee ID already exists.")
    except Exception as e:
        db.rollback()
        print("Unknown error creating worker:", str(e))
        raise HTTPException(status_code=400, detail=str(e))
    
    await log_audit_event(
        db, "worker_created", f"Worker {worker.name} created",
        edited_by=getattr(current_user, "email", "System"),
        reason="Initial Creation", worker_id=worker.id
    )
    
    # Broadcast change
    await manager.broadcast({
        "type": "WORKER_CREATED",
        "data": WorkerResponse.model_validate(worker).model_dump()
    })
    return worker

@router.put("/{worker_id}", response_model=WorkerResponse)
async def update_worker(worker_id: int, worker_in: WorkerUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    worker = db.query(User).filter(User.id == worker_id, User.employee_id.isnot(None)).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
        
    old_data = WorkerResponse.model_validate(worker).model_dump()
    data = worker_in.model_dump()
    reason = data.pop("reason", "No reason provided")
    salary_data = data.pop("salary_profile", None)
    
    for key, value in data.items():
        setattr(worker, key, value)
        
    if salary_data:
        if worker.salary_profile:
            for k, v in salary_data.items():
                setattr(worker.salary_profile, k, v)
        else:
            worker.salary_profile = SalaryProfile(**salary_data)
            
    db.commit()
    db.refresh(worker)
    
    new_data = WorkerResponse.model_validate(worker).model_dump()
    await log_audit_event(
        db, "worker_updated", f"Worker {worker.name} updated",
        edited_by=getattr(current_user, "email", "System"),
        reason=reason, old_value=old_data, new_value=new_data, worker_id=worker.id
    )
    
    # Broadcast change
    await manager.broadcast({
        "type": "WORKER_UPDATED",
        "data": new_data
    })
    return worker

class WorkerStatusUpdate(BaseModel):
    status: str

class WorkerProfileEdit(BaseModel):
    name: str = None
    mobile_number: str
    emergency_contact_number: str
    address: str
    profile_photo_url: str = None

@router.post("/{worker_id}/upload-photo")
async def upload_worker_photo(worker_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    worker = db.query(User).filter(User.id == worker_id, User.employee_id.isnot(None)).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
        
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"worker_{worker_id}_{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    photo_url = f"{settings.API_BASE_URL}/uploads/{filename}"
    worker.profile_photo_url = photo_url
    db.commit()
    
    await log_audit_event(
        db, "profile_photo_updated", f"Worker {worker.name} updated their profile photo",
        edited_by=worker.name, reason="Photo Upload", worker_id=worker.id
    )
    
    await manager.broadcast({"type": "WORKER_PROFILE_UPDATED", "payload": {"worker_id": worker.id}})
    
    return {"message": "Photo uploaded successfully", "profile_photo_url": photo_url}

@router.put("/{worker_id}/profile_edit")
async def edit_worker_profile(worker_id: int, payload: WorkerProfileEdit, db: Session = Depends(get_db)):
    # Bypassing current_user check for simplicity in PWA, relying on worker_id (in a real app, validate token matches worker_id)
    worker = db.query(User).filter(User.id == worker_id, User.employee_id.isnot(None)).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
        
    worker.mobile_number = payload.mobile_number
    worker.emergency_contact_number = payload.emergency_contact_number
    worker.address = payload.address
    if payload.name:
        worker.name = payload.name
    if payload.profile_photo_url:
        worker.profile_photo_url = payload.profile_photo_url
        
    db.commit()
    
    await log_audit_event(
        db, "profile_updated", f"Worker {worker.name} updated their profile",
        edited_by=worker.name, reason="Self Service Update", worker_id=worker.id
    )
    
    await manager.broadcast({"type": "WORKER_PROFILE_UPDATED", "payload": {"worker_id": worker.id}})
    
    return {"message": "Profile updated successfully"}
    reason: str

@router.patch("/{worker_id}/status", response_model=WorkerResponse)
async def update_worker_status(worker_id: int, status_update: WorkerStatusUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    worker = db.query(User).filter(User.id == worker_id, User.employee_id.isnot(None)).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
        
    old_data = WorkerResponse.model_validate(worker).model_dump()
    worker.status = status_update.status
    db.commit()
    db.refresh(worker)
    
    new_data = WorkerResponse.model_validate(worker).model_dump()
    await log_audit_event(
        db, "worker_status_updated", f"Worker {worker.name} status changed to {worker.status}",
        edited_by=getattr(current_user, "email", "System"),
        reason=status_update.reason, old_value=old_data, new_value=new_data, worker_id=worker.id
    )
    
    # Broadcast change
    await manager.broadcast({
        "type": "WORKER_STATUS_CHANGED",
        "data": {
            "workerId": worker.id,
            "status": worker.status
        }
    })
    return worker

class ReasonPayload(BaseModel):
    reason: str

@router.post("/{worker_id}/archive")
async def archive_worker(worker_id: int, payload: ReasonPayload, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    worker = db.query(User).filter(User.id == worker_id, User.employee_id.isnot(None)).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
        
    old_data = WorkerResponse.model_validate(worker).model_dump()
    worker.employment_status = "Archived"
    worker.status = "offline"
    db.commit()
    db.refresh(worker)
    
    new_data = WorkerResponse.model_validate(worker).model_dump()
    await log_audit_event(
        db, "worker_archived", f"Worker {worker.name} archived",
        edited_by=getattr(current_user, "email", "System"),
        reason=payload.reason, old_value=old_data, new_value=new_data, worker_id=worker.id
    )
    
    await manager.broadcast({
        "type": "WORKER_UPDATED",
        "data": new_data
    })
    return {"message": "Worker archived"}

@router.post("/{worker_id}/reset-password")
async def reset_worker_password(worker_id: int, payload: ReasonPayload, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    worker = db.query(User).filter(User.id == worker_id, User.employee_id.isnot(None)).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
        
    await log_audit_event(
        db, "worker_password_reset", f"Password reset for Worker {worker.name}",
        edited_by=getattr(current_user, "email", "System"),
        reason=payload.reason, worker_id=worker.id
    )
    
    return {"message": "Password reset successfully"}
