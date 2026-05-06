from datetime import datetime
from typing import Literal
from pydantic import BaseModel


DetectionMode = Literal["quick", "deep", "forensic"]
ConclusionType = Literal["real", "suspicious", "ai-generated", "unknown"]


class DetectionCreate(BaseModel):
    image_id: str
    mode: DetectionMode = "deep"
    purpose: str = ""


class StepResponse(BaseModel):
    id: str
    agent_name: str
    label: str
    description: str
    status: str
    score: float | None = None
    duration: float | None = None
    anomaly_detected: bool = False
    step_index: int

    model_config = {"from_attributes": True}


class AgentResultResponse(BaseModel):
    agent_name: str
    label: str
    score: float
    anomaly_regions: list[dict] = []


class AnomalyRegion(BaseModel):
    x: float
    y: float
    width: float
    height: float


class AnomalyResponse(BaseModel):
    id: str
    rank: int
    title: str
    description: str
    score: float
    heatmap_type: str
    region: AnomalyRegion | None = None


class UnknownWarning(BaseModel):
    reason: str
    distance_analysis: str
    possible_attack_type: str


class DetectionResultResponse(BaseModel):
    risk_score: int
    confidence: float
    conclusion: str
    conclusion_label: str
    agent_results: list[AgentResultResponse] = []
    anomalies: list[AnomalyResponse] = []
    total_duration: float
    detection_mode: str
    report_markdown: str = ""
    unknown_warning: UnknownWarning | None = None


class DetectionCreatedResponse(BaseModel):
    detection_id: str
    status: str
    mode: str
    image_id: str
    ws_endpoint: str
    created_at: datetime
    estimated_duration: int = 10


class DetectionStatusResponse(BaseModel):
    detection_id: str
    status: str
    mode: str
    overall_progress: int
    current_step: StepResponse | None = None
    completed_steps: list[StepResponse] = []
    result: DetectionResultResponse | None = None
    created_at: datetime
    completed_at: datetime | None = None
