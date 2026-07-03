from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.associations import vehicle_worker_association

class Worker(Base):
    __tablename__ = "workers"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    status = Column(String, default="Offline")  # Active, Break, Offline
    current_task_id = Column(String, nullable=True)
    hours_today = Column(Float, default=0.0)
    department = Column(String, nullable=False)
    performance_score = Column(Integer, default=100)

    # Phase 1: Employee Registration Fields
    mobile_number = Column(String, nullable=True)
    password = Column(String, default="1234")  # Default PIN for worker PWA login
    email = Column(String, nullable=True)
    date_of_birth = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    designation = Column(String, nullable=True)
    role = Column(String, default="Worker")
    joining_date = Column(String, nullable=True)  # Store as Date or ISO String
    employment_status = Column(String, default="Active") # Active, Inactive, On Leave, Resigned
    
    profile_photo_url = Column(String, nullable=True)
    shift_type = Column(String, default="General Shift")
    shift_start = Column(String, default="09:00:00")
    shift_end = Column(String, default="18:00:00")
    
    emergency_contact_name = Column(String, nullable=True)
    emergency_contact_number = Column(String, nullable=True)
    emergency_contact_relationship = Column(String, nullable=True)
    address = Column(String, nullable=True)
    
    aadhaar_number = Column(String, nullable=True)
    pan_number = Column(String, nullable=True)
    
    face_registration_status = Column(String, default="Pending") # Pending, Completed


    # Relationships
    vehicles = relationship(
        "Vehicle",
        secondary=vehicle_worker_association,
        back_populates="workers"
    )
    activities = relationship("ActivityEvent", back_populates="worker", cascade="all, delete-orphan")
    attendance_records = relationship("Attendance", back_populates="worker", cascade="all, delete-orphan")
    attendance_logs = relationship("AttendanceLog", back_populates="worker", cascade="all, delete-orphan")
    salary_profile = relationship("SalaryProfile", back_populates="worker", uselist=False, cascade="all, delete-orphan")
    production_jobs = relationship(
        "ProductionJob",
        secondary="job_worker_association",
        back_populates="workers"
    )
