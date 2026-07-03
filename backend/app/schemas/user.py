from pydantic import BaseModel
from typing import Optional

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str
    role: Optional[str] = "operator"

class UserResponse(UserBase):
    id: int
    role: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    username: str
    role: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
