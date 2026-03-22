import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    severity: Mapped[str] = mapped_column(
        String(20), default="medium"
    )  # critical | high | medium | low
    status: Mapped[str] = mapped_column(
        String(20), default="open"
    )  # open | in_progress | resolved | closed
    assignee_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    sla_deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_utc
    )
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    metadata_: Mapped[dict] = mapped_column(
        "metadata", JSONB, default=dict
    )

    timeline: Mapped[list["CaseTimeline"]] = relationship(
        back_populates="case", cascade="all, delete-orphan", order_by="CaseTimeline.created_at"
    )


class CaseTimeline(Base):
    __tablename__ = "case_timeline"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    case_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("cases.id", ondelete="CASCADE")
    )
    actor_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    # comment | status_change | assignee_change | workflow_run | ai_analysis
    event_type: Mapped[str] = mapped_column(String(40))
    content: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_utc
    )

    case: Mapped["Case"] = relationship(back_populates="timeline")


class ShiftHandover(Base):
    __tablename__ = "shift_handovers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    outgoing_user: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    incoming_user: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    handover_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_utc
    )
    open_cases: Mapped[list] = mapped_column(JSONB, default=list)
    decisions: Mapped[list] = mapped_column(JSONB, default=list)
    watch_items: Mapped[list] = mapped_column(JSONB, default=list)
    notes: Mapped[str | None] = mapped_column(Text)
    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)
