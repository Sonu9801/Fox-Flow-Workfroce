from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, Token
from app.auth import get_password_hash, verify_password, create_access_token, create_refresh_token, get_current_user, get_current_active_user, RoleChecker
from app.models.worker import Worker
from app.models.device import Device
from jose import JWTError, jwt
from app.config import settings
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/auth", tags=["auth"])

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class DeviceRegistrationRequest(BaseModel):
    device_token: str
    device_type: Optional[str] = None

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(RoleChecker(["admin"]))])
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user_in.username).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    hashed_pwd = get_password_hash(user_in.password)
    user = User(
        username=user_in.username,
        hashed_password=hashed_pwd,
        role=user_in.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    refresh_token = create_refresh_token(data={"sub": user.username, "role": user.role})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "username": user.username,
        "role": user.role
    }

@router.post("/worker-login")
def worker_login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Assuming username field is used for mobile number
    worker = db.query(Worker).filter(Worker.mobile_number == form_data.username).first()
    if not worker or worker.password != form_data.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect mobile number or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if worker.employment_status != "Active":
        raise HTTPException(status_code=400, detail="Inactive worker")
    
    # We prefix worker token sub with 'worker:' to distinguish from admin users if needed
    sub = f"worker:{worker.id}"
    access_token = create_access_token(data={"sub": sub, "role": "worker"})
    refresh_token = create_refresh_token(data={"sub": sub, "role": "worker"})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "worker_id": worker.id,
        "name": worker.name,
        "role": "worker"
    }

@router.post("/refresh")
def refresh_access_token(body: RefreshTokenRequest, db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(body.refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "refresh":
            raise credentials_exception
        username: str = payload.get("sub")
        role: str = payload.get("role", "operator")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    # Check if user still exists/active
    if username.startswith("worker:"):
        worker_id = int(username.split(":")[1])
        user = db.query(Worker).filter(Worker.id == worker_id).first()
        if not user or user.employment_status != "Active":
            raise credentials_exception
    else:
        user = db.query(User).filter(User.username == username).first()
        if not user or not user.is_active:
            raise credentials_exception

    new_access_token = create_access_token(data={"sub": username, "role": role})
    return {"access_token": new_access_token, "token_type": "bearer"}

@router.post("/device", status_code=status.HTTP_201_CREATED)
def register_device(
    request: DeviceRegistrationRequest, 
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    device = db.query(Device).filter(Device.device_token == request.device_token).first()
    
    if hasattr(current_user, "employment_status"):
        worker_id = current_user.id
        user_id = None
    else:
        user_id = current_user.id
        worker_id = None
        
    if device:
        device.user_id = user_id
        device.worker_id = worker_id
        device.device_type = request.device_type
        device.is_active = True
    else:
        device = Device(
            device_token=request.device_token,
            device_type=request.device_type,
            user_id=user_id,
            worker_id=worker_id
        )
        db.add(device)
    db.commit()
    return {"message": "Device registered successfully"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user

