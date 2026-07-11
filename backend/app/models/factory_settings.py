from sqlalchemy import Column, Integer, String, JSON
from app.database import Base

class FactorySettings(Base):
    __tablename__ = "factory_settings"

    id = Column(Integer, primary_key=True, index=True)
    facility_name = Column(String, default="FoxFlow Manufacturing - Unit 1")
    address = Column(String, default="")
    operating_hours = Column(String, default="Mon-Sat 09:00-18:00")
    timezone = Column(String, default="Asia/Kolkata")
    departments = Column(JSON, default=["Fabrication", "Paint", "QC", "Dispatch", "Stores"])
