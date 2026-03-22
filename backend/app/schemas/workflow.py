import uuid
from datetime import datetime
from typing import Literal, Any
from pydantic import BaseModel, Field


# ── Workflow ──────────────────────────────────────────────────────────────────

WorkflowState = Literal["draft", "testing", "published"]


class WorkflowCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    workspace_id: uuid.UUID


class WorkflowUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    state: WorkflowState | None = None


class WorkflowOut(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    state: WorkflowState
    workspace_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Workflow Version ──────────────────────────────────────────────────────────

class PublishRequest(BaseModel):
    commit_msg: str
    tag: str | None = None
    definition: dict[str, Any]


class BranchRequest(BaseModel):
    branch_name: str = Field(..., pattern=r"^[a-zA-Z0-9/_\-]+$")
    from_version_id: uuid.UUID


class WorkflowVersionOut(BaseModel):
    id: uuid.UUID
    workflow_id: uuid.UUID
    version_num: int
    branch: str
    commit_msg: str | None
    author_id: uuid.UUID | None
    parent_id: uuid.UUID | None
    tag: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Execution ─────────────────────────────────────────────────────────────────

class ExecutionCreate(BaseModel):
    workflow_id: uuid.UUID
    version_id: uuid.UUID | None = None
    trigger_data: dict[str, Any] = {}
    triggered_by: str = "on_demand"
    case_id: uuid.UUID | None = None


ExecutionStatus = Literal["pending", "running", "success", "failed", "cancelled"]


class ExecutionOut(BaseModel):
    id: uuid.UUID
    workflow_id: uuid.UUID
    status: ExecutionStatus
    triggered_by: str | None
    started_at: datetime | None
    completed_at: datetime | None
    step_results: list[Any]

    model_config = {"from_attributes": True}
