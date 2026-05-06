import asyncio
import random
from app.engine.agents.base import BaseAgent, AgentInput, AgentOutput


class NoiseConsistencyAgent(BaseAgent):
    agent_name = "NoiseConsistencyAgent"
    label = "Noise Consistency Check"

    async def analyze(self, input: AgentInput) -> AgentOutput:
        await asyncio.sleep(random.uniform(1.5, 2.8))
        score = round(random.uniform(0.40, 0.85), 2)
        return AgentOutput(
            agent_name=self.agent_name,
            label=self.label,
            score=score,
            anomaly_detected=score >= 0.55,
            anomaly_regions=[{"x": 10, "y": 65, "width": 25, "height": 30}] if score >= 0.55 else [],
            duration=random.uniform(1.5, 2.8),
        )

    def is_enabled_for_mode(self, mode: str) -> bool:
        return mode in ("deep", "forensic")
