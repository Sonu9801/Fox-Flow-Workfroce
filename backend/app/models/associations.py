from sqlalchemy import Table, Column, Integer, ForeignKey
from app.database import Base

vehicle_worker_association = Table(
    "vehicle_worker_association",
    Base.metadata,
    Column("vehicle_id", Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), primary_key=True),
    Column("worker_id", Integer, ForeignKey("workers.id", ondelete="CASCADE"), primary_key=True)
)
