import asyncio
import random
from app.engine.agents.base import BaseAgent, AgentInput, AgentOutput


class FrequencyDomainAgent(BaseAgent):
    agent_name = "FrequencyDomainAgent"
    label = "Frequency Domain Analysis"

    async def analyze(self, input: AgentInput) -> AgentOutput:
        await asyncio.sleep(random.uniform(0.8, 1.5))
        score = round(random.uniform(0.55, 0.92), 2)
        return AgentOutput(
            agent_name=self.agent_name,
            label=self.label,
            score=score,
            anomaly_detected=score >= 0.6,
            anomaly_regions=[{"x": 35, "y": 20, "width": 30, "height": 40}] if score >= 0.6 else [],
            duration=random.uniform(0.8, 1.5),
        )

    def is_enabled_for_mode(self, mode: str) -> bool:
        return mode in ("deep", "forensic")
