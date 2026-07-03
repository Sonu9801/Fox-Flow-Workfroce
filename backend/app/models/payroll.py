from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class AdvanceRequest(Base):
    __tablename__ = "advance_requests"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    amount = Column(Float, nullable=False)
    request_date = Column(DateTime, default=datetime.utcnow)
    reason = Column(String, nullable=True)
    status = Column(String, default="Pending") # Pending, Approved, Rejected
    deducted_in_payroll = Column(Boolean, default=False)
    
    worker = relationship("Worker")

class PayrollRecord(Base):
    __tablename__ = "payroll_records"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    month = Column(String, nullable=False) # e.g. "2026-06"
    status = Column(String, default="Draft") # Draft, Approved, Paid
    
    base_salary = Column(Float, default=0.0)
    ot_amount = Column(Float, default=0.0)
    sunday_amount = Column(Float, default=0.0)
    bonus_amount = Column(Float, default=0.0)
    deductions = Column(Float, default=0.0)
    final_salary = Column(Float, default=0.0)
    
    worker = relationship("Worker")
