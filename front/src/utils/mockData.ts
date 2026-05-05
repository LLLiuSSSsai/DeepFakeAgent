import type { DetectionResult, DetectionStep, AnomalyEvidence } from './types';

export const DETECTION_STEPS: Omit<DetectionStep, 'status' | 'duration' | 'score'>[] = [
  {
    id: 'frequency',
    agentName: 'FrequencyDomainAgent',
    label: 'Frequency Domain Analysis',
    description: 'Analyzing high-frequency spatial distributions and generative model residuals',
  },
  {
    id: 'noise',
    agentName: 'NoiseConsistencyAgent',
    label: 'Noise Consistency Check',
    description: 'Comparing sensor noise patterns across image regions for tampering traces',
  },
  {
    id: 'semantic',
    agentName: 'SemanticStructureAgent',
    label: 'Semantic Structure Verification',
    description: 'Evaluating lighting, shadows, perspective, and anatomical coherence',
  },
  {
    id: 'deepfeature',
    agentName: 'DeepFeatureAgent',
    label: 'Deep Feature Analysis',
    description: 'Matching extracted features against known generative model signatures',
  },
  {
    id: 'openset',
    agentName: 'OpenSetDiscriminator',
    label: 'Open-Set Discrimination',
    description: 'Detecting unknown generation patterns and novel tampering techniques',
  },
];

export function generateMockResult(imageId: string): DetectionResult {
  const anomalyRegions: AnomalyEvidence[] = [
    {
      id: 'anomaly-1',
      rank: 1,
      title: 'High-frequency energy attenuation in facial region',
      description: 'Frequency domain analysis detected abnormal high-frequency decay pattern centered on the facial area (score 0.87), consistent with generative model residuals typically observed in diffusion-based synthesis.',
      score: 0.87,
      heatmapType: 'frequency',
      region: { x: 35, y: 20, width: 30, height: 40 },
    },
    {
      id: 'anomaly-2',
      rank: 2,
      title: 'Inconsistent shadow direction on right hand',
      description: 'Shadow orientation on the right hand diverges from the dominant light source by approximately 42 degrees (semantic analysis score 0.78), suggesting composite splicing.',
      score: 0.78,
      heatmapType: 'semantic',
      region: { x: 65, y: 55, width: 20, height: 25 },
    },
    {
      id: 'anomaly-3',
      rank: 3,
      title: 'Noise pattern discontinuity in lower-left quadrant',
      description: 'Sensor noise variance in the lower-left region shows a sharp discontinuity relative to surrounding areas (noise consistency score 0.72), indicative of inpainting or patch-based manipulation.',
      score: 0.72,
      heatmapType: 'noise',
      region: { x: 10, y: 65, width: 25, height: 30 },
    },
  ];

  return {
    imageId,
    riskScore: 76,
    confidence: 0.92,
    conclusion: 'ai-generated',
    conclusionLabel: 'High Probability AI-Generated',
    agentResults: [
      { agentName: 'FrequencyDomainAgent', label: 'Frequency Analysis', score: 0.87, heatmapUrl: 'https://picsum.photos/seed/freq/400/300' },
      { agentName: 'NoiseConsistencyAgent', label: 'Noise Consistency', score: 0.72, heatmapUrl: 'https://picsum.photos/seed/noise/400/300' },
      { agentName: 'SemanticStructureAgent', label: 'Semantic Structure', score: 0.78, heatmapUrl: 'https://picsum.photos/seed/semantic/400/300' },
      { agentName: 'DeepFeatureAgent', label: 'Deep Features', score: 0.81, heatmapUrl: 'https://picsum.photos/seed/deep/400/300' },
    ],
    anomalies: anomalyRegions,
    totalDuration: 7.4,
    detectionMode: 'deep',
    fusionHeatmapUrl: 'https://picsum.photos/seed/fusion/800/600',
    reportMarkdown: `# DeepFake Detection Report

## Core Conclusion

- **Risk Score**: 76 / 100 (High Probability AI-Generated)
- **Confidence**: 0.92
- **Detection Mode**: Deep Detection
- **Total Duration**: 7.4 seconds

---

## Agent Detection Evidence

### 1. Frequency Domain Analysis — Score: 0.87
High-frequency energy attenuation detected in facial region, characteristic of diffusion-based generative models. The frequency spectrum shows periodic artifacts at 8x8 grid intervals, commonly observed in latent diffusion outputs.

### 2. Noise Consistency Check — Score: 0.72
Sensor noise variance exhibits a 3.2-sigma discontinuity in the lower-left quadrant, exceeding the natural variation threshold of 1.5-sigma. This pattern is consistent with patch-based inpainting or region splicing.

### 3. Semantic Structure Verification — Score: 0.78
Shadow orientation analysis reveals a 42-degree deviation on the right hand relative to the global light source. Additionally, edge continuity analysis identifies micro-blending artifacts along the neck-shoulder boundary.

### 4. Deep Feature Analysis — Score: 0.81
Feature embedding distance to the nearest known-real cluster is 0.67 (threshold: 0.35). The embedding falls within the characteristic manifold of Stable Diffusion XL outputs.

### 5. Open-Set Discrimination
No unknown generation patterns detected beyond the 0.7 confidence threshold. The detected anomalies are consistent with known generative model categories.

---

## Unknown Generation Warning
None detected. All anomalies map to known generative model profiles.

---

## Manual Review Recommendation: HIGH
Given the risk score of 76 and multiple corroborating anomalies across 4 independent analysis agents, full manual review is strongly recommended. Focus review on: facial region (frequency anomaly), right hand (shadow inconsistency), and lower-left quadrant (noise discontinuity).

---

## Appendix
- **Detection Thresholds**: Frequency 0.6 | Noise 0.55 | Semantic 0.5 | Deep Feature 0.35
- **Model Version**: DeepFeatureDetector v3.2.1 | OpenSetDiscriminator v2.0.4
- **Image Format**: PNG, 2048x1536, sRGB`,
    unknownWarning: undefined,
  };
}

export function getStepDurations(): number[] {
  return [1.2, 2.3, 1.8, 1.5, 0.6];
}
