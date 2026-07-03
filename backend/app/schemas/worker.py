from app.schemas.base import CamelModel
from typing import Optional

class WorkerBase(CamelModel):
    employee_id: str
    name: str
    status: str = "Offline"
    current_task_id: Optional[str] = None
    hours_today: float = 0.0
    department: str
    performance_score: int = 100
    mobile_number: Optional[str] = None
    email: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    designation: Optional[str] = None
    role: str = "Worker"
    joining_date: Optional[str] = None
    employment_status: str = "Active"
    
    profile_photo_url: Optional[str] = None
    shift_type: str = "General Shift"
    shift_start: str = "09:00:00"
    shift_end: str = "18:00:00"
    
    emergency_contact_name: Optional[str] = None
    emergency_contact_number: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    address: Optional[str] = None
    
    aadhaar_number: Optional[str] = None
    pan_number: Optional[str] = None
    
    face_registration_status: str = "Pending"

class SalaryProfileBase(CamelModel):
    salary_type: str = "Monthly"
    monthly_salary: Optional[float] = None
    daily_wage: Optional[float] = None
    ot_rate_per_hour: float = 0.0
    sunday_rate_per_hour: float = 0.0

class WorkerCreate(WorkerBase):
    salary_profile: Optional[SalaryProfileBase] = None

class WorkerUpdate(WorkerBase):
    salary_profile: Optional[SalaryProfileBase] = None
    reason: str

class WorkerResponse(WorkerBase):
    id: int
    salary_profile: Optional[SalaryProfileBase] = None
