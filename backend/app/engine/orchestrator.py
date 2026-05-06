import asyncio
import time
import logging
from collections.abc import Callable, Awaitable
from app.engine.agents.base import AgentInput, AgentOutput
from app.engine.agents.frequency import FrequencyDomainAgent
from app.engine.agents.noise import NoiseConsistencyAgent
from app.engine.agents.semantic import SemanticStructureAgent
from app.engine.agents.deep_feature import DeepFeatureAgent
from app.engine.agents.open_set import OpenSetDiscriminator
from app.engine.mock_data import build_mock_result
from app.schemas.detection import DetectionResultResponse

logger = logging.getLogger(__name__)

STEP_DEFS: list[dict] = [
    {"id": "frequency", "agent_name": "FrequencyDomainAgent", "label": "Frequency Domain Analysis",
     "description": "Analyzing high-frequency spatial distributions and generative model residuals"},
    {"id": "noise", "agent_name": "NoiseConsistencyAgent", "label": "Noise Consistency Check",
     "description": "Comparing sensor noise patterns across image regions for tampering traces"},
    {"id": "semantic", "agent_name": "SemanticStructureAgent", "label": "Semantic Structure Verification",
     "description": "Evaluating lighting, shadows, perspective, and anatomical coherence"},
    {"id": "deepfeature", "agent_name": "DeepFeatureAgent", "label": "Deep Feature Analysis",
     "description": "Matching extracted features against known generative model signatures"},
    {"id": "openset", "agent_name": "OpenSetDiscriminator", "label": "Open-Set Discrimination",
     "description": "Detecting unknown generation patterns and novel tampering techniques"},
]

FUSION_WEIGHTS = {
    "quick": {"DeepFeatureAgent": 1.0},
    "deep": {"FrequencyDomainAgent": 0.25, "NoiseConsistencyAgent": 0.20,
             "SemanticStructureAgent": 0.20, "DeepFeatureAgent": 0.25, "OpenSetDiscriminator": 0.10},
    "forensic": {"FrequencyDomainAgent": 0.20, "NoiseConsistencyAgent": 0.25,
                 "SemanticStructureAgent": 0.25, "DeepFeatureAgent": 0.20, "OpenSetDiscriminator": 0.10},
}


class SupervisorOrchestrator:
    def __init__(self):
        self.agents = [
            FrequencyDomainAgent(),
            NoiseConsistencyAgent(),
            SemanticStructureAgent(),
            DeepFeatureAgent(),
            OpenSetDiscriminator(),
        ]

    async def run_pipeline(
        self,
        image_path: str,
        mode: str,
        purpose: str = "",
        progress_callback: Callable[[dict], Awaitable[None]] | None = None,
    ) -> DetectionResultResponse:
        agent_input = AgentInput(
            image_path=image_path,
            detection_mode=mode,
            purpose=purpose,
        )

        enabled = [a for a in self.agents if a.is_enabled_for_mode(mode)]
        agent_outputs: list[AgentOutput] = []
        total_start = time.monotonic()

        for i, agent in enumerate(enabled):
            step_def = next(
                (s for s in STEP_DEFS if s["agent_name"] == agent.agent_name),
                {"id": agent.agent_name, "agent_name": agent.agent_name, "label": agent.label, "description": ""},
            )

            await self._notify(progress_callback, {
                "type": "step_started",
                "step": {
                    "id": step_def["id"],
                    "agent_name": agent.agent_name,
                    "label": agent.label,
                    "description": step_def.get("description", ""),
                    "step_index": i,
                    "total_steps": len(enabled),
                },
                "overall_progress": int(i / max(len(enabled), 1) * 100),
            })

            try:
                output = await agent.analyze(agent_input)
            except Exception as e:
                logger.exception(f"Agent {agent.agent_name} failed")
                await self._notify(progress_callback, {
                    "type": "step_error",
                    "step_id": step_def["id"],
                    "error_message": str(e),
                    "recoverable": True,
                })
                output = AgentOutput(
                    agent_name=agent.agent_name,
                    label=agent.label,
                    score=0.0,
                    duration=0.0,
                )

            agent_outputs.append(output)

            await self._notify(progress_callback, {
                "type": "step_completed",
                "step": {
                    "id": step_def["id"],
                    "agent_name": agent.agent_name,
                    "label": agent.label,
                    "status": "completed",
                    "score": output.score,
                    "duration": output.duration,
                },
                "overall_progress": int((i + 1) / max(len(enabled), 1) * 100),
                "anomaly_detected": output.anomaly_detected,
            })

        total_duration = time.monotonic() - total_start
        result = build_mock_result("", mode, agent_outputs, total_duration)

        await self._notify(progress_callback, {
            "type": "detection_completed",
            "status": "completed",
            "summary": {
                "risk_score": result.risk_score,
                "conclusion": result.conclusion,
                "conclusion_label": result.conclusion_label,
                "confidence": result.confidence,
                "total_duration": result.total_duration,
            },
        })

        return result

    async def _notify(self, callback, event: dict):
        if callback:
            try:
                await callback(event)
            except Exception:
                logger.exception("progress_callback error")
