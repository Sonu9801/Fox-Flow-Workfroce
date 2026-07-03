from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, index=True, nullable=False)
    part_name = Column(String, nullable=False)
    stock_level = Column(Integer, default=0)
    reorder_level = Column(Integer, default=0)
    location = Column(String, nullable=False)
    updated_at = Column(DateTime, nullable=False)
