import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.database import get_db
from app.models.case import Case, CaseTimeline, ShiftHandover
from app.schemas.case import (
    CaseCreate, CaseUpdate, CaseOut,
    TimelineEventOut,
    ShiftHandoverCreate, ShiftHandoverOut,
)
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/cases", tags=["Cases"])


@router.get("", response_model=list[CaseOut])
async def list_cases(
    workspace_id: uuid.UUID | None = None,
    severity: str | None = None,
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    q = select(Case).order_by(desc(Case.created_at))
    if workspace_id:
        q = q.where(Case.workspace_id == workspace_id)
    if severity:
        q = q.where(Case.severity == severity)
    if status:
        q = q.where(Case.status == status)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=CaseOut, status_code=201)
async def create_case(
    body: CaseCreate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    case = Case(
        title=body.title,
        severity=body.severity,
        workspace_id=body.workspace_id,
        assignee_id=body.assignee_id,
        metadata_=body.metadata,
    )
    db.add(case)
    await db.commit()
    await db.refresh(case)
    return case


@router.get("/{case_id}", response_model=CaseOut)
async def get_case(
    case_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    case = await db.get(Case, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.patch("/{case_id}", response_model=CaseOut)
async def update_case(
    case_id: uuid.UUID,
    body: CaseUpdate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    case = await db.get(Case, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    updates = body.model_dump(exclude_none=True)
    if "status" in updates and updates["status"] in ("resolved", "closed"):
        from datetime import datetime, timezone
        case.resolved_at = datetime.now(timezone.utc)

    for field, value in updates.items():
        setattr(case, field, value)

    # Add timeline event for status change
    if "status" in updates:
        event = CaseTimeline(
            case_id=case_id,
            actor_id=uuid.UUID(user.get("sub", str(uuid.uuid4()))),
            event_type="status_change",
            content={"new_status": updates["status"]},
        )
        db.add(event)

    await db.commit()
    await db.refresh(case)
    return case


@router.get("/{case_id}/timeline", response_model=list[TimelineEventOut])
async def get_timeline(
    case_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    case = await db.get(Case, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    result = await db.execute(
        select(CaseTimeline)
        .where(CaseTimeline.case_id == case_id)
        .order_by(CaseTimeline.created_at)
    )
    return result.scalars().all()


@router.post("/{case_id}/comments", response_model=TimelineEventOut, status_code=201)
async def add_comment(
    case_id: uuid.UUID,
    body: dict,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    event = CaseTimeline(
        case_id=case_id,
        actor_id=uuid.UUID(user.get("sub", str(uuid.uuid4()))),
        event_type="comment",
        content={"text": body.get("text", "")},
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event
