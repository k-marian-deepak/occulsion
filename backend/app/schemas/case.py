import uuid
from datetime import datetime
from typing import Literal, Any
from pydantic import BaseModel, Field


Severity = Literal["critical", "high", "medium", "low"]
CaseStatus = Literal["open", "in_progress", "resolved", "closed"]


class CaseCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=512)
    severity: Severity = "medium"
    workspace_id: uuid.UUID
    assignee_id: uuid.UUID | None = None
    metadata: dict[str, Any] = {}


class CaseUpdate(BaseModel):
    title: str | None = None
    severity: Severity | None = None
    status: CaseStatus | None = None
    assignee_id: uuid.UUID | None = None


class CaseOut(BaseModel):
    id: uuid.UUID
    title: str
    severity: Severity
    status: CaseStatus
    assignee_id: uuid.UUID | None
    workspace_id: uuid.UUID
    created_at: datetime
    resolved_at: datetime | None

    model_config = {"from_attributes": True}


class TimelineEventOut(BaseModel):
    id: uuid.UUID
    case_id: uuid.UUID
    event_type: str
    content: dict[str, Any]
    actor_id: uuid.UUID | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Shift Handover ───────────────────────────────────────────────────────────

class ShiftHandoverCreate(BaseModel):
    workspace_id: uuid.UUID
    incoming_user: uuid.UUID
    open_cases: list[Any] = []
    decisions: list[Any] = []
    watch_items: list[Any] = []
    notes: str | None = None


class ShiftHandoverOut(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    outgoing_user: uuid.UUID | None
    incoming_user: uuid.UUID | None
    handover_time: datetime
    acknowledged: bool

    model_config = {"from_attributes": True}
