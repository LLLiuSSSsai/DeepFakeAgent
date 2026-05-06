import asyncio
import random
from app.engine.agents.base import BaseAgent, AgentInput, AgentOutput


class OpenSetDiscriminator(BaseAgent):
    agent_name = "OpenSetDiscriminator"
    label = "Open-Set Discrimination"

    async def analyze(self, input: AgentInput) -> AgentOutput:
        await asyncio.sleep(random.uniform(0.3, 0.8))
        score = round(random.uniform(0.10, 0.50), 2)
        return AgentOutput(
            agent_name=self.agent_name,
            label=self.label,
            score=score,
            anomaly_detected=score >= 0.7,
            duration=random.uniform(0.3, 0.8),
        )

    def is_enabled_for_mode(self, mode: str) -> bool:
        return mode != "quick"
