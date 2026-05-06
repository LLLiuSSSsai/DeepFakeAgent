from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class AgentInput:
    image_path: str
    detection_mode: str
    purpose: str = ""
    focused_regions: list[dict] = field(default_factory=list)


@dataclass
class AgentOutput:
    agent_name: str
    label: str
    score: float
    anomaly_detected: bool = False
    anomaly_regions: list[dict] = field(default_factory=list)
    duration: float = 0.0
    extra: dict = field(default_factory=dict)


class BaseAgent(ABC):
    agent_name: str
    label: str

    @abstractmethod
    async def analyze(self, input: AgentInput) -> AgentOutput: ...

    @abstractmethod
    def is_enabled_for_mode(self, mode: str) -> bool: ...
