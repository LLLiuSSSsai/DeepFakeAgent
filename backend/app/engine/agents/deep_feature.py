import asyncio
import random
from app.engine.agents.base import BaseAgent, AgentInput, AgentOutput


class DeepFeatureAgent(BaseAgent):
    agent_name = "DeepFeatureAgent"
    label = "Deep Feature Analysis"

    async def analyze(self, input: AgentInput) -> AgentOutput:
        await asyncio.sleep(random.uniform(0.8, 2.0))
        score = round(random.uniform(0.50, 0.90), 2)
        return AgentOutput(
            agent_name=self.agent_name,
            label=self.label,
            score=score,
            anomaly_detected=score >= 0.7,
            duration=random.uniform(0.8, 2.0),
        )

    def is_enabled_for_mode(self, mode: str) -> bool:
        return True  # All modes
