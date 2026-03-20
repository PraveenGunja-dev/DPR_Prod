from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import date, datetime

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    status: str = "Active"

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProjectAssignmentBase(BaseModel):
    user_id: int
    project_id: int
    role: str

class ProjectAssignmentCreate(ProjectAssignmentBase):
    pass

class ProjectAssignmentResponse(ProjectAssignmentBase):
    id: int
    assigned_at: datetime

    class Config:
        from_attributes = True
