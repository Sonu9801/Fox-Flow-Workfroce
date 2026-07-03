from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, Request
from app.auth import get_current_active_user
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from app.database import get_db
from app.models.worker import Worker
from app.models.attendance import Attendance, AttendanceLog, AttendanceException
from app.models.attendance_settings import AttendanceSettings
from app.models.salary_profile import SalaryProfile
from app.services.websocket_manager import manager
from app.services.attendance_engine import GeofenceEngine, TimeEngine, PayrollSyncEngine
import os
import shutil
import uuid

router = APIRouter(prefix="/attendance", tags=["Attendance"], dependencies=[Depends(get_current_active_user)])

UPLOAD_DIR = "uploads/attendance_photos"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/punch")
async def punch_attendance(
    request: Request,
    worker_id: int = Form(...),
    action: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    accuracy: float = Form(None),
    address: str = Form(None),
    photo: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    settings = db.query(AttendanceSettings).first()
    if not settings:
        settings = AttendanceSettings()

    is_valid, geo_msg = GeofenceEngine.validate_punch(settings, latitude, longitude, accuracy)
    
    if not is_valid:
        from app.models.notification import Notification
        notification = Notification(
            type="error",
            title="Attendance Exception",
            message=f"Worker {worker.name} attempted to punch outside geofence. ({geo_msg})",
            module="attendance",
            reference_id=str(worker.id),
            target_url="/attendance",
        )
        db.add(notification)
        # Create an exception record
        exc = AttendanceException(
            worker_id=worker.id,
            date=datetime.now(timezone.utc).date(),
            exception_type="Outside Geofence",
            notes=geo_msg
        )
        db.add(exc)
        db.commit()
        raise HTTPException(status_code=400, detail=geo_msg)

    # Save photo if exists
    photo_url = None
    if photo:
        filename = f"{worker_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:6]}.jpg"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
        photo_url = f"/uploads/attendance_photos/{filename}"

    now = datetime.now(timezone.utc)
    today = now.date()

    # Prevent duplicate punches (if already punched in/out in the last 1 minute)
    last_log = db.query(AttendanceLog).filter(
        AttendanceLog.worker_id == worker.id,
        AttendanceLog.action == action
    ).order_by(AttendanceLog.timestamp.desc()).first()

    if last_log and last_log.timestamp and (now - last_log.timestamp.replace(tzinfo=timezone.utc)).total_seconds() < 60:
        raise HTTPException(status_code=400, detail="Duplicate punch detected. Please try again later.")

    log = AttendanceLog(
        worker_id=worker.id,
        action=action,
        latitude=latitude,
        longitude=longitude,
        accuracy=accuracy,
        address=address,
        photo_url=photo_url,
        is_valid=is_valid,
        ip_address=request.client.host if request.client else "Unknown",
        device_info=request.headers.get("User-Agent", "Unknown"),
        timestamp=now
    )
    db.add(log)

    record = db.query(Attendance).filter(
        Attendance.worker_id == worker.id, 
        Attendance.date == today
    ).first()

    if not record:
        record = Attendance(worker_id=worker.id, date=today, status="Present")
        db.add(record)

    if action.lower() == "punch in":
        record.punch_in = now
        record.punch_in_photo_url = photo_url
        worker.status = "Active"
        
        stats = TimeEngine.calculate_status(settings, punch_in=now)
        record.late_minutes = stats.get("late_minutes", 0)
        if stats.get("status") == "Half Day":
            record.status = "Half Day"
            
    elif action.lower() == "punch out":
        if not record.punch_in:
            record.punch_in = now - timedelta(hours=9) # fallback if missed
        record.punch_out = now
        record.punch_out_photo_url = photo_url
        worker.status = "Offline"
        
        stats = TimeEngine.calculate_status(settings, punch_in=record.punch_in, punch_out=now)
        record.net_working_hours = stats.get("net_working_hours", 0.0)
        record.ot_hours = stats.get("ot_hours", 0.0)
        record.early_exit_minutes = stats.get("early_exit_minutes", 0)
        
        profile = db.query(SalaryProfile).filter(SalaryProfile.worker_id == worker.id).first()
        if profile:
            PayrollSyncEngine.sync_daily_attendance(db, record, profile)

    db.commit()

    await manager.broadcast_event("ATTENDANCE_UPDATE", {
        "worker_id": worker.id,
        "worker_name": worker.name,
        "action": action,
        "status": worker.status,
        "timestamp": now.isoformat()
    })

    return {"message": f"Successfully {action}", "photo_url": photo_url}

@router.get("/")
def get_attendance(db: Session = Depends(get_db)):
    return db.query(Attendance).all()

@router.get("/logs/detailed")
def get_detailed_logs(
    user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(Attendance).order_by(Attendance.date.desc())
    if user.role == "supervisor":
        query = query.join(Worker).filter(Worker.department == user.department)
        
    records = query.all()
    results = []
    for r in records:
        worker = r.worker
        if worker:
            # fetch the last punch in and punch out logs for this record to get photo/GPS
            in_log = db.query(AttendanceLog).filter(AttendanceLog.worker_id == worker.id, AttendanceLog.action == "Punch In", AttendanceLog.timestamp >= r.punch_in).first() if r.punch_in else None
            out_log = db.query(AttendanceLog).filter(AttendanceLog.worker_id == worker.id, AttendanceLog.action == "Punch Out", AttendanceLog.timestamp >= r.punch_out).first() if r.punch_out else None

            results.append({
                "id": r.id,
                "worker_id": worker.id,
                "employee_name": worker.name,
                "employee_id": worker.employee_id,
                "department": worker.department,
                "date": r.date.isoformat() if r.date else None,
                "punch_in": r.punch_in.isoformat() if r.punch_in else None,
                "punch_out": r.punch_out.isoformat() if r.punch_out else None,
                "status": r.status,
                "net_working_hours": r.net_working_hours,
                "ot_hours": r.ot_hours,
                "late_minutes": r.late_minutes,
                "is_sunday": r.is_sunday,
                "location_status": "Verified",
                "photo_status": "Verified" if r.punch_in_photo_url or r.punch_out_photo_url else "Pending",
                "punch_in_photo_url": r.punch_in_photo_url,
                "punch_out_photo_url": r.punch_out_photo_url,
                "device_info": in_log.device_info if in_log else (out_log.device_info if out_log else "Unknown"),
                "ip_address": in_log.ip_address if in_log else (out_log.ip_address if out_log else "Unknown"),
                "latitude": in_log.latitude if in_log else (out_log.latitude if out_log else None),
                "longitude": in_log.longitude if in_log else (out_log.longitude if out_log else None),
            })
    return results

@router.get("/exceptions")
def get_exceptions(db: Session = Depends(get_db)):
    return db.query(AttendanceException).all()

@router.post("/exceptions")
def create_exception(worker_id: int, date_str: str, type: str, notes: str, db: Session = Depends(get_db)):
    date_val = datetime.strptime(date_str, "%Y-%m-%d").date()
    exc = AttendanceException(
        worker_id=worker_id,
        date=date_val,
        exception_type=type,
        notes=notes
    )
    db.add(exc)
    db.commit()
    return {"message": "Exception logged successfully"}

from pydantic import BaseModel

class ApproveExceptionPayload(BaseModel):
    reason: str

@router.put("/exceptions/{id}/approve")
async def approve_exception(id: int, payload: ApproveExceptionPayload, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    exc = db.query(AttendanceException).filter(AttendanceException.id == id).first()
    if not exc:
        raise HTTPException(status_code=404, detail="Exception not found")
        
    old_status = exc.status
    exc.status = "Approved"
    db.commit()
    db.refresh(exc)
    
    from app.services.audit import log_audit_event
    
    await log_audit_event(
        db, "exception_approved", f"Exception {exc.exception_type} approved for Worker {exc.worker_id}",
        edited_by=getattr(current_user, "username", "System"),
        reason=payload.reason, old_value={"status": old_status}, new_value={"status": "Approved"}, worker_id=exc.worker_id
    )
    
    return {"message": "Exception approved"}

from pydantic import BaseModel
from typing import Optional

class AttendanceUpdatePayload(BaseModel):
    status: Optional[str] = None
    punch_in: Optional[datetime] = None
    punch_out: Optional[datetime] = None
    net_working_hours: Optional[float] = None
    ot_hours: Optional[float] = None
    late_minutes: Optional[int] = None
    reason: str

@router.put("/{id}")
async def update_attendance(id: int, payload: AttendanceUpdatePayload, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    if current_user.role not in ["owner", "admin", "manager"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    record = db.query(Attendance).filter(Attendance.id == id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")
        
    # Build old data dictionary manually since it's not a Pydantic model directly
    old_data = {
        "status": record.status,
        "punch_in": record.punch_in.isoformat() if record.punch_in else None,
        "punch_out": record.punch_out.isoformat() if record.punch_out else None,
        "net_working_hours": record.net_working_hours,
        "ot_hours": record.ot_hours,
        "late_minutes": record.late_minutes
    }
    
    if payload.status is not None: record.status = payload.status
    if payload.punch_in is not None: record.punch_in = payload.punch_in
    if payload.punch_out is not None: record.punch_out = payload.punch_out
    if payload.net_working_hours is not None: record.net_working_hours = payload.net_working_hours
    if payload.ot_hours is not None: record.ot_hours = payload.ot_hours
    if payload.late_minutes is not None: record.late_minutes = payload.late_minutes
    
    db.commit()
    db.refresh(record)
    
    new_data = {
        "status": record.status,
        "punch_in": record.punch_in.isoformat() if record.punch_in else None,
        "punch_out": record.punch_out.isoformat() if record.punch_out else None,
        "net_working_hours": record.net_working_hours,
        "ot_hours": record.ot_hours,
        "late_minutes": record.late_minutes
    }
    
    from app.services.audit import log_audit_event
    await log_audit_event(
        db, "attendance_updated", f"Attendance updated for worker {record.worker_id}",
        edited_by=getattr(current_user, "username", "System"),
        reason=payload.reason, old_value=old_data, new_value=new_data, worker_id=record.worker_id
    )
    
    return {"message": "Attendance updated"}

@router.get("/analytics")
def get_analytics(
    user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    today = now.date()
    
    # Calculate daily stats
    query_workers = db.query(Worker)
    query_today = db.query(Attendance).filter(Attendance.date == today)
    
    if user.role == "supervisor":
        query_workers = query_workers.filter(Worker.department == user.department)
        query_today = query_today.join(Worker).filter(Worker.department == user.department)

    all_workers = query_workers.count()
    today_records = query_today.all()
    
    present = 0
    absent = 0
    late = 0
    half_day = 0
    total_hours = 0
    punch_count = db.query(AttendanceLog).filter(
        db.func.date(AttendanceLog.timestamp) == today
    ).count()
    
    for r in today_records:
        if r.status == "Present":
            present += 1
        elif r.status == "Absent":
            absent += 1
        elif r.status == "Half Day":
            half_day += 1
        if r.late_minutes > 0:
            late += 1
        total_hours += r.net_working_hours
            
    absent += (all_workers - len(today_records))
    
    avg_hours = total_hours / present if present > 0 else 0
    
    return {
        "present": present,
        "absent": absent,
        "late": late,
        "half_day": half_day,
        "total": all_workers,
        "average_working_hours": round(avg_hours, 1),
        "today_punch_count": punch_count,
        "attendance_trend": [
            {"day": "Mon", "present": present, "absent": absent, "late": late},
            {"day": "Tue", "present": present, "absent": absent, "late": late},
            {"day": "Wed", "present": present, "absent": absent, "late": late}
        ] # Placeholder for actual historical query
    }

