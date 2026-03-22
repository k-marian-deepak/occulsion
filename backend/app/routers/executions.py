import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.database import get_db
from app.models.workflow import Execution
from app.schemas.workflow import ExecutionCreate, ExecutionOut
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/executions", tags=["Executions"])


@router.post("", response_model=ExecutionOut, status_code=201)
async def trigger_execution(
    body: ExecutionCreate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    execution = Execution(
        workflow_id=body.workflow_id,
        version_id=body.version_id,
        triggered_by=body.triggered_by,
        case_id=body.case_id,
        status="pending",
        started_at=datetime.now(timezone.utc),
    )
    db.add(execution)
    await db.commit()
    await db.refresh(execution)

    # Kick off Celery task (non-blocking)
    try:
        from app.workers.execution_worker import run_workflow
        run_workflow.delay(str(execution.id), {}, body.trigger_data)
    except Exception:
        pass  # Worker not available yet — just queue the execution

    return execution


@router.get("/{execution_id}", response_model=ExecutionOut)
async def get_execution(
    execution_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    exc = await db.get(Execution, execution_id)
    if not exc:
        raise HTTPException(status_code=404, detail="Execution not found")
    return exc


@router.get("", response_model=list[ExecutionOut])
async def list_executions(
    workflow_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    q = select(Execution).order_by(desc(Execution.started_at)).limit(50)
    if workflow_id:
        q = q.where(Execution.workflow_id == workflow_id)
    result = await db.execute(q)
    return result.scalars().all()
