import asyncio
import json
import uuid
import logging
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from app.database import async_session
from app.models.detection import DetectionTask, DetectionStep
from app.models.image import Image
from app.engine.orchestrator import SupervisorOrchestrator, STEP_DEFS
from app.schemas.detection import (
    DetectionResultResponse,
    DetectionCreatedResponse,
    DetectionStatusResponse,
    StepResponse,
)

logger = logging.getLogger(__name__)
orchestrator = SupervisorOrchestrator()
_active_tasks: dict[str, asyncio.Task] = {}
ws_callbacks: dict[str, set] = {}


class DetectionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_detection(self, image_id: str, mode: str, purpose: str) -> DetectionCreatedResponse:
        img = await self.db.get(Image, image_id)
        if not img:
            raise ValueError("Image not found")

        det_id = f"det_{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc)

        task = DetectionTask(
            id=det_id,
            image_id=image_id,
            mode=mode,
            purpose=purpose,
            status="pending",
            created_at=now,
        )
        self.db.add(task)

        enabled_steps = [
            s for s in STEP_DEFS
            if self._agent_enabled_for_mode(s["agent_name"], mode)
        ]
        for i, sdef in enumerate(enabled_steps):
            self.db.add(DetectionStep(
                task_id=det_id,
                step_type=sdef["id"],
                agent_name=sdef["agent_name"],
                label=sdef["label"],
                description=sdef.get("description", ""),
                status="pending",
                step_index=i,
            ))

        await self.db.commit()

        active_task = asyncio.create_task(self._run_detection(det_id, img.storage_path, mode, purpose))
        _active_tasks[det_id] = active_task

        estimated = {"quick": 3, "deep": 10, "forensic": 20}.get(mode, 10)

        return DetectionCreatedResponse(
            detection_id=det_id,
            status="pending",
            mode=mode,
            image_id=image_id,
            ws_endpoint=f"/api/v1/ws/detections/{det_id}",
            created_at=now,
            estimated_duration=estimated,
        )

    async def get_status(self, detection_id: str) -> DetectionStatusResponse | None:
        task = await self.db.get(DetectionTask, detection_id)
        if not task:
            return None

        await self.db.refresh(task, attribute_names=["steps"])
        steps = sorted(task.steps, key=lambda s: s.step_index)

        completed_steps = [
            StepResponse(
                id=s.id, agent_name=s.agent_name, label=s.label,
                description=s.description, status=s.status,
                score=s.score, duration=s.duration,
                anomaly_detected=s.anomaly_detected, step_index=s.step_index,
            )
            for s in steps if s.status == "completed"
        ]

        running_step = next(
            (StepResponse(
                id=s.id, agent_name=s.agent_name, label=s.label,
                description=s.description, status=s.status, step_index=s.step_index,
            ) for s in steps if s.status == "running"),
            None,
        )

        result = None
        if task.result_json:
            try:
                result = DetectionResultResponse(**json.loads(task.result_json))
            except Exception:
                pass

        return DetectionStatusResponse(
            detection_id=task.id, status=task.status, mode=task.mode,
            overall_progress=task.overall_progress,
            current_step=running_step, completed_steps=completed_steps,
            result=result, created_at=task.created_at, completed_at=task.completed_at,
        )

    async def list_detections(self, page: int = 1, page_size: int = 20) -> tuple[list[DetectionTask], int]:
        q = select(DetectionTask).order_by(DetectionTask.created_at.desc())
        q = q.offset((page - 1) * page_size).limit(page_size)
        count_q = select(func.count(DetectionTask.id))
        total = (await self.db.execute(count_q)).scalar()
        tasks = (await self.db.execute(q)).scalars().all()
        return list(tasks), total

    async def cancel_detection(self, detection_id: str) -> bool:
        task = await self.db.get(DetectionTask, detection_id)
        if not task or task.status not in ("pending", "queued", "running"):
            return False
        if detection_id in _active_tasks:
            _active_tasks[detection_id].cancel()
            del _active_tasks[detection_id]
        task.status = "cancelled"
        await self.db.commit()
        return True

    @staticmethod
    def _agent_enabled_for_mode(agent_name: str, mode: str) -> bool:
        if mode == "quick":
            return agent_name == "DeepFeatureAgent"
        return True

    @staticmethod
    async def _run_detection(detection_id: str, image_path: str, mode: str, purpose: str):
        """Background task with its own DB session."""
        async with async_session() as db:
            try:
                await DetectionService._update_status_db(db, detection_id, "running", started_at=datetime.now(timezone.utc))

                async def on_progress(event: dict):
                    await DetectionService._handle_progress_db(db, detection_id, event)

                result = await orchestrator.run_pipeline(
                    image_path=image_path, mode=mode, purpose=purpose,
                    progress_callback=on_progress,
                )

                result_json = json.dumps(result.model_dump(), default=str)
                await DetectionService._update_status_db(
                    db, detection_id, "completed",
                    overall_progress=100, risk_score=result.risk_score,
                    confidence=result.confidence, conclusion=result.conclusion,
                    conclusion_label=result.conclusion_label,
                    total_duration=result.total_duration,
                    result_json=result_json, report_markdown=result.report_markdown,
                    completed_at=datetime.now(timezone.utc),
                )
            except asyncio.CancelledError:
                await DetectionService._update_status_db(db, detection_id, "cancelled")
            except Exception as e:
                logger.exception(f"Detection {detection_id} failed")
                await DetectionService._update_status_db(db, detection_id, "error", error_message=str(e))

    @staticmethod
    async def _handle_progress_db(db: AsyncSession, detection_id: str, event: dict):
        etype = event.get("type")
        if etype == "step_started":
            step_info = event["step"]
            await DetectionService._update_step_db(
                db, detection_id, step_info["agent_name"], "running",
                step_index=step_info.get("step_index"),
            )
        elif etype == "step_completed":
            step_info = event["step"]
            await DetectionService._update_step_db(
                db, detection_id, step_info["agent_name"], "completed",
                score=step_info.get("score"), duration=step_info.get("duration"),
            )
            progress = event.get("overall_progress", 0)
            await DetectionService._update_status_db(db, detection_id, "running", overall_progress=progress)

        if detection_id in ws_callbacks:
            for cb in list(ws_callbacks[detection_id]):
                try:
                    await cb(event)
                except Exception:
                    pass

    @staticmethod
    async def _update_status_db(db: AsyncSession, detection_id: str, status: str, **kwargs):
        values = {"status": status, **{k: v for k, v in kwargs.items() if v is not None}}
        stmt = update(DetectionTask).where(DetectionTask.id == detection_id).values(**values)
        await db.execute(stmt)
        await db.commit()

    @staticmethod
    async def _update_step_db(db: AsyncSession, detection_id: str, agent_name: str, status: str, **kwargs):
        values = {"status": status, **{k: v for k, v in kwargs.items() if v is not None}}
        stmt = (
            update(DetectionStep)
            .where(DetectionStep.task_id == detection_id, DetectionStep.agent_name == agent_name)
            .values(**values)
        )
        await db.execute(stmt)
        await db.commit()
