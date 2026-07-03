from fastapi import APIRouter, Depends, HTTPException, status
from app.auth import get_current_active_user
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.worker import Worker
from app.schemas.worker import WorkerCreate, WorkerUpdate, WorkerResponse
from app.services.websocket_manager import manager
from app.services.audit import log_audit_event

router = APIRouter(prefix="/workers", tags=["workers"], dependencies=[Depends(get_current_active_user)])

@router.get("", response_model=List[WorkerResponse])
def get_workers(db: Session = Depends(get_db)):
    return db.query(Worker).order_by(Worker.id).all()

@router.get("/{worker_id}", response_model=WorkerResponse)
def get_worker(worker_id: int, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    return worker

from app.models.salary_profile import SalaryProfile

@router.post("", response_model=WorkerResponse, status_code=status.HTTP_201_CREATED)
async def create_worker(worker_in: WorkerCreate, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    data = worker_in.model_dump()
    salary_data = data.pop("salary_profile", None)
    
    worker = Worker(**data)
    if salary_data:
        worker.salary_profile = SalaryProfile(**salary_data)
        
    db.add(worker)
    db.commit()
    db.refresh(worker)
    
    await log_audit_event(
        db, "worker_created", f"Worker {worker.name} created",
        edited_by=getattr(current_user, "username", "System"),
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
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
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
        edited_by=getattr(current_user, "username", "System"),
        reason=reason, old_value=old_data, new_value=new_data, worker_id=worker.id
    )
    
    # Broadcast change
    await manager.broadcast({
        "type": "WORKER_UPDATED",
        "data": new_data
    })
    return worker

from pydantic import BaseModel

class WorkerStatusUpdate(BaseModel):
    status: str
    reason: str

@router.patch("/{worker_id}/status", response_model=WorkerResponse)
async def update_worker_status(worker_id: int, status_update: WorkerStatusUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
        
    old_data = WorkerResponse.model_validate(worker).model_dump()
    worker.status = status_update.status
    db.commit()
    db.refresh(worker)
    
    new_data = WorkerResponse.model_validate(worker).model_dump()
    await log_audit_event(
        db, "worker_status_updated", f"Worker {worker.name} status changed to {worker.status}",
        edited_by=getattr(current_user, "username", "System"),
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
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
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
        edited_by=getattr(current_user, "username", "System"),
        reason=payload.reason, old_value=old_data, new_value=new_data, worker_id=worker.id
    )
    
    await manager.broadcast({
        "type": "WORKER_UPDATED",
        "data": new_data
    })
    return {"message": "Worker archived"}

@router.post("/{worker_id}/reset-password")
async def reset_worker_password(worker_id: int, payload: ReasonPayload, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
        
    # Mocking password reset logic
    await log_audit_event(
        db, "worker_password_reset", f"Password reset for Worker {worker.name}",
        edited_by=getattr(current_user, "username", "System"),
        reason=payload.reason, worker_id=worker.id
    )
    
    return {"message": "Password reset successfully"}
