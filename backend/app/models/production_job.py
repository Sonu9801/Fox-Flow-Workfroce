from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.associations import job_user_association

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
    supervisor = relationship("User", foreign_keys=[supervisor_id])
    workers = relationship(
        "User", 
        secondary=job_user_association, 
        back_populates="production_jobs"
    )
