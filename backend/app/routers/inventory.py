from fastapi import APIRouter, Depends, HTTPException, status
from app.auth import get_current_active_user
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.models.inventory import InventoryItem
from app.schemas.inventory import InventoryItemCreate, InventoryItemResponse
from app.services.websocket_manager import manager

router = APIRouter(prefix="/inventory", tags=["inventory"], dependencies=[Depends(get_current_active_user)])

@router.get("", response_model=List[InventoryItemResponse])
def get_inventory(db: Session = Depends(get_db)):
    return db.query(InventoryItem).order_by(InventoryItem.sku).all()

@router.post("", response_model=InventoryItemResponse, status_code=status.HTTP_201_CREATED)
async def create_inventory_item(item_in: InventoryItemCreate, db: Session = Depends(get_db)):
    db_item = db.query(InventoryItem).filter(InventoryItem.sku == item_in.sku).first()
    if db_item:
        raise HTTPException(status_code=400, detail="SKU already exists")
    item = InventoryItem(**item_in.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    
    # Broadcast change
    response_data = InventoryItemResponse.model_validate(item).model_dump()
    await manager.broadcast({
        "type": "INVENTORY_ITEM_CREATED",
        "data": response_data
    })
    return item

@router.put("/{item_id}", response_model=InventoryItemResponse)
async def update_inventory_item(item_id: int, item_in: InventoryItemCreate, db: Session = Depends(get_db)):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    for key, value in item_in.model_dump().items():
        setattr(item, key, value)
    item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(item)
    
    # Broadcast change
    response_data = InventoryItemResponse.model_validate(item).model_dump()
    await manager.broadcast({
        "type": "INVENTORY_ITEM_UPDATED",
        "data": response_data
    })
    return item

@router.patch("/{item_id}/stock", response_model=InventoryItemResponse)
async def adjust_stock_level(item_id: int, quantity: int, db: Session = Depends(get_db)):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    item.stock_level = quantity
    item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(item)
    
    # Broadcast change
    response_data = InventoryItemResponse.model_validate(item).model_dump()
    await manager.broadcast({
        "type": "INVENTORY_STOCK_ADJUSTED",
        "data": response_data
    })
    return item
