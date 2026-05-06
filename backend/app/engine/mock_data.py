import random
from app.engine.agents.base import AgentOutput
from app.schemas.detection import (
    DetectionResultResponse,
    AgentResultResponse,
    AnomalyResponse,
    AnomalyRegion,
    UnknownWarning,
)


def build_mock_result(
    image_id: str,
    detection_mode: str,
    agent_outputs: list[AgentOutput],
    total_duration: float,
) -> DetectionResultResponse:
    agent_results = [
        AgentResultResponse(
            agent_name=ao.agent_name,
            label=ao.label,
            score=ao.score,
            anomaly_regions=ao.anomaly_regions,
        )
        for ao in agent_outputs
    ]

    anomalies = [
        AnomalyResponse(
            id="anomaly-1",
            rank=1,
            title="High-frequency energy attenuation in facial region",
            description="Frequency domain analysis detected abnormal high-frequency decay pattern centered on the facial area (score 0.87), consistent with generative model residuals.",
            score=0.87,
            heatmap_type="frequency",
            region=AnomalyRegion(x=35, y=20, width=30, height=40),
        ),
        AnomalyResponse(
            id="anomaly-2",
            rank=2,
            title="Inconsistent shadow direction on right hand",
            description="Shadow orientation on the right hand diverges from the dominant light source by approximately 42 degrees, suggesting composite splicing.",
            score=0.78,
            heatmap_type="semantic",
            region=AnomalyRegion(x=65, y=55, width=20, height=25),
        ),
        AnomalyResponse(
            id="anomaly-3",
            rank=3,
            title="Noise pattern discontinuity in lower-left quadrant",
            description="Sensor noise variance in the lower-left region shows a sharp discontinuity, indicative of inpainting or patch-based manipulation.",
            score=0.72,
            heatmap_type="noise",
            region=AnomalyRegion(x=10, y=65, width=25, height=30),
        ),
    ]

    weighted = sum(ao.score for ao in agent_outputs) / max(len(agent_outputs), 1)
    risk_score = int(weighted * 100)
    confidence = round(0.85 + random.uniform(0, 0.12), 2)

    if risk_score <= 30:
        conclusion = "real"
        conclusion_label = "Real Image"
    elif risk_score <= 60:
        conclusion = "suspicious"
        conclusion_label = "Suspicious — Possibly Forged"
    elif risk_score <= 90:
        conclusion = "ai-generated"
        conclusion_label = "High Probability AI-Generated"
    else:
        conclusion = "unknown"
        conclusion_label = "Unknown Generation — Warning"

    unknown_warning = None
    if conclusion == "unknown":
        unknown_warning = UnknownWarning(
            reason="Feature embedding falls outside known distribution boundary",
            distance_analysis="Mahalanobis distance to nearest known-real cluster: 2.8σ",
            possible_attack_type="Suspected novel diffusion variant or unseen tampering pipeline",
        )

    report_md = f"""# DeepFake Detection Report

## Core Conclusion

- **Risk Score**: {risk_score} / 100 ({conclusion_label})
- **Confidence**: {confidence}
- **Detection Mode**: {detection_mode.capitalize()}
- **Total Duration**: {total_duration:.1f} seconds

---

## Agent Detection Evidence

"""
    for ao in agent_outputs:
        report_md += f"### {ao.label} — Score: {ao.score}\n"
        report_md += f"Analysis completed in {ao.duration:.1f}s. "
        if ao.anomaly_detected:
            report_md += "Anomalies detected in the analyzed regions.\n\n"
        else:
            report_md += "No significant anomalies found.\n\n"

    report_md += """---
## Manual Review Recommendation
Based on the multi-agent analysis, manual review is recommended to verify flagged regions.

---
## Appendix
- **Detection Thresholds**: Frequency 0.6 | Noise 0.55 | Semantic 0.5 | Deep Feature 0.35
- **Model Version**: DeepFakeAgent MVP v0.1.0
"""

    return DetectionResultResponse(
        risk_score=risk_score,
        confidence=confidence,
        conclusion=conclusion,
        conclusion_label=conclusion_label,
        agent_results=agent_results,
        anomalies=anomalies,
        total_duration=total_duration,
        detection_mode=detection_mode,
        report_markdown=report_md,
        unknown_warning=unknown_warning,
    )
