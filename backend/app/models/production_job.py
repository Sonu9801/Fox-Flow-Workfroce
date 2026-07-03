from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.database import Base

job_worker_association = Table(
    "job_worker_association",
    Base.metadata,
    Column("job_id", Integer, ForeignKey("production_jobs.id", ondelete="CASCADE"), primary_key=True),
    Column("worker_id", Integer, ForeignKey("workers.id", ondelete="CASCADE"), primary_key=True)
)

class ProductionJob(Base):
    __tablename__ = "production_jobs"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    stage = Column(String, nullable=False)
    status = Column(String, default="not_started") # not_started, assigned, in_progress, paused, completed, rejected, rework
    supervisor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    expected_duration_minutes = Column(Integer, nullable=True)
    photo_proof_url = Column(Text, nullable=True)
    comments = Column(Text, nullable=True)
    
    vehicle = relationship("Vehicle", back_populates="production_jobs")
    supervisor = relationship("User")
    workers = relationship(
        "Worker", 
        secondary=job_worker_association, 
        back_populates="production_jobs"
    )
