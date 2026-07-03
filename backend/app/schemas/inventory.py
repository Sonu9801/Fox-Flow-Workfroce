from datetime import datetime
from app.schemas.base import CamelModel

class InventoryItemBase(CamelModel):
    sku: str
    part_name: str
    stock_level: int = 0
    reorder_level: int = 0
    location: str
    updated_at: datetime

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItemResponse(InventoryItemBase):
    id: int
