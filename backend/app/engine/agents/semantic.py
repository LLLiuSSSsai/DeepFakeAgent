import asyncio
import random
from app.engine.agents.base import BaseAgent, AgentInput, AgentOutput


class SemanticStructureAgent(BaseAgent):
    agent_name = "SemanticStructureAgent"
    label = "Semantic Structure Verification"

    async def analyze(self, input: AgentInput) -> AgentOutput:
        await asyncio.sleep(random.uniform(1.2, 2.2))
        score = round(random.uniform(0.45, 0.88), 2)
        return AgentOutput(
            agent_name=self.agent_name,
            label=self.label,
            score=score,
            anomaly_detected=score >= 0.5,
            anomaly_regions=[{"x": 65, "y": 55, "width": 20, "height": 25}] if score >= 0.5 else [],
            duration=random.uniform(1.2, 2.2),
        )

    def is_enabled_for_mode(self, mode: str) -> bool:
        return mode in ("deep", "forensic")
