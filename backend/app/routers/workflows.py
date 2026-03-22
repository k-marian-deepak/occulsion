import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.database import get_db
from app.models.workflow import Workflow, WorkflowVersion
from app.schemas.workflow import (
    WorkflowCreate, WorkflowUpdate, WorkflowOut,
    PublishRequest, BranchRequest,
    WorkflowVersionOut,
)
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/workflows", tags=["Workflows"])


@router.get("", response_model=list[WorkflowOut])
async def list_workflows(
    workspace_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    q = select(Workflow).order_by(desc(Workflow.updated_at))
    if workspace_id:
        q = q.where(Workflow.workspace_id == workspace_id)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=WorkflowOut, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    body: WorkflowCreate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    wf = Workflow(
        name=body.name,
        description=body.description,
        workspace_id=body.workspace_id,
        created_by=uuid.UUID(user.get("sub", str(uuid.uuid4()))),
    )
    db.add(wf)
    await db.commit()
    await db.refresh(wf)
    return wf


@router.get("/{workflow_id}", response_model=WorkflowOut)
async def get_workflow(
    workflow_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    wf = await db.get(Workflow, workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return wf


@router.patch("/{workflow_id}", response_model=WorkflowOut)
async def update_workflow(
    workflow_id: uuid.UUID,
    body: WorkflowUpdate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    wf = await db.get(Workflow, workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(wf, field, value)
    await db.commit()
    await db.refresh(wf)
    return wf


@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow(
    workflow_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    wf = await db.get(Workflow, workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    await db.delete(wf)
    await db.commit()


# ── Versions (Git-like) ───────────────────────────────────────────────────────

@router.get("/{workflow_id}/versions", response_model=list[WorkflowVersionOut])
async def list_versions(
    workflow_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    result = await db.execute(
        select(WorkflowVersion)
        .where(WorkflowVersion.workflow_id == workflow_id)
        .order_by(desc(WorkflowVersion.version_num))
    )
    return result.scalars().all()


@router.post("/{workflow_id}/publish", response_model=WorkflowVersionOut, status_code=201)
async def publish_workflow(
    workflow_id: uuid.UUID,
    body: PublishRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    wf = await db.get(Workflow, workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # Get latest version number
    result = await db.execute(
        select(WorkflowVersion.version_num)
        .where(WorkflowVersion.workflow_id == workflow_id)
        .order_by(desc(WorkflowVersion.version_num))
        .limit(1)
    )
    latest = result.scalar_one_or_none() or 0

    version = WorkflowVersion(
        workflow_id=workflow_id,
        version_num=latest + 1,
        definition=body.definition,
        commit_msg=body.commit_msg,
        tag=body.tag,
        author_id=uuid.UUID(user.get("sub", str(uuid.uuid4()))),
    )
    db.add(version)
    wf.state = "published"
    await db.commit()
    await db.refresh(version)
    return version


@router.post("/{workflow_id}/branches", response_model=WorkflowVersionOut, status_code=201)
async def create_branch(
    workflow_id: uuid.UUID,
    body: BranchRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    parent = await db.get(WorkflowVersion, body.from_version_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Parent version not found")

    result = await db.execute(
        select(WorkflowVersion.version_num)
        .where(WorkflowVersion.workflow_id == workflow_id)
        .order_by(desc(WorkflowVersion.version_num))
        .limit(1)
    )
    latest = result.scalar_one_or_none() or 0

    branch_version = WorkflowVersion(
        workflow_id=workflow_id,
        version_num=latest + 1,
        branch=body.branch_name,
        definition=parent.definition,
        commit_msg=f"Branch from v{parent.version_num}",
        parent_id=parent.id,
        author_id=uuid.UUID(user.get("sub", str(uuid.uuid4()))),
    )
    db.add(branch_version)
    await db.commit()
    await db.refresh(branch_version)
    return branch_version
