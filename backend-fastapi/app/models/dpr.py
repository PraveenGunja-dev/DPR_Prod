from pydantic import BaseModel, Json
from typing import List, Optional, Any, Union
from datetime import date, datetime

class DPREntryBase(BaseModel):
    project_id: int
    sheet_type: str
    entry_date: date
    data_json: Any
    status: str = "draft"

class DPREntryCreate(DPREntryBase):
    supervisor_id: int

class DPREntryUpdate(BaseModel):
    data_json: Optional[Any] = None
    status: Optional[str] = None
    rejection_reason: Optional[str] = None

class DPREntryResponse(DPREntryBase):
    id: int
    supervisor_id: int
    supervisor_name: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DPREntryReview(BaseModel):
    status: str
    rejection_reason: Optional[str] = None
