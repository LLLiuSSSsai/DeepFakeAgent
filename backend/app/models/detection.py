from datetime import datetime
from sqlalchemy import String, Integer, Float, Boolean, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.image import gen_id


class DetectionTask(Base):
    __tablename__ = "detection_tasks"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: gen_id("det"))
    image_id: Mapped[str] = mapped_column(String(32), ForeignKey("images.id", ondelete="CASCADE"))
    mode: Mapped[str] = mapped_column(String(20))  # quick / deep / forensic
    purpose: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending/running/completed/error/cancelled
    overall_progress: Mapped[int] = mapped_column(Integer, default=0)
    risk_score: Mapped[int | None] = mapped_column(Integer, default=None)
    confidence: Mapped[float | None] = mapped_column(Float, default=None)
    conclusion: Mapped[str | None] = mapped_column(String(20), default=None)
    conclusion_label: Mapped[str | None] = mapped_column(String(256), default=None)
    total_duration: Mapped[float | None] = mapped_column(Float, default=None)
    result_json: Mapped[str | None] = mapped_column(Text, default=None)  # JSON blob for full result
    report_markdown: Mapped[str | None] = mapped_column(Text, default=None)
    error_message: Mapped[str | None] = mapped_column(Text, default=None)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, default=None)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    steps: Mapped[list["DetectionStep"]] = relationship(
        "DetectionStep", back_populates="task", order_by="DetectionStep.step_index"
    )


class DetectionStep(Base):
    __tablename__ = "detection_steps"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: gen_id("step"))
    task_id: Mapped[str] = mapped_column(String(32), ForeignKey("detection_tasks.id", ondelete="CASCADE"))
    step_type: Mapped[str] = mapped_column(String(30))  # frequency/noise/semantic/deepfeature/openset
    agent_name: Mapped[str] = mapped_column(String(64))
    label: Mapped[str] = mapped_column(String(128))
    description: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending/running/completed/error/skipped
    score: Mapped[float | None] = mapped_column(Float, default=None)
    duration: Mapped[float | None] = mapped_column(Float, default=None)
    anomaly_detected: Mapped[bool] = mapped_column(Boolean, default=False)
    error_message: Mapped[str | None] = mapped_column(Text, default=None)
    step_index: Mapped[int] = mapped_column(Integer)

    task: Mapped["DetectionTask"] = relationship("DetectionTask", back_populates="steps")
