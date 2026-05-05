export type DetectionMode = 'quick' | 'deep' | 'forensic';

export type StepStatus = 'pending' | 'running' | 'completed' | 'error';

export type ConclusionType = 'real' | 'suspicious' | 'ai-generated' | 'unknown';

export type HeatmapType = 'fusion' | 'frequency' | 'noise' | 'semantic';

export interface UploadedImage {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
  width?: number;
  height?: number;
  status: 'pending' | 'detecting' | 'completed' | 'error';
  errorMessage?: string;
}

export interface DetectionStep {
  id: string;
  agentName: string;
  label: string;
  description: string;
  status: StepStatus;
  duration?: number;
  score?: number;
  previewUrl?: string;
  errorMessage?: string;
}

export interface AnomalyEvidence {
  id: string;
  rank: number;
  title: string;
  description: string;
  score: number;
  heatmapType: HeatmapType;
  region: { x: number; y: number; width: number; height: number };
}

export interface AgentResult {
  agentName: string;
  label: string;
  score: number;
  heatmapUrl?: string;
  anomalyRegions?: { x: number; y: number; width: number; height: number }[];
}

export interface DetectionResult {
  imageId: string;
  riskScore: number;
  confidence: number;
  conclusion: ConclusionType;
  conclusionLabel: string;
  agentResults: AgentResult[];
  anomalies: AnomalyEvidence[];
  totalDuration: number;
  detectionMode: DetectionMode;
  fusionHeatmapUrl: string;
  reportMarkdown: string;
  unknownWarning?: {
    reason: string;
    distanceAnalysis: string;
    possibleAttackType: string;
  };
}

export interface ReportData {
  detectionTime: string;
  imageName: string;
  detectionMode: DetectionMode;
  detectionPurpose: string;
  detectorName: string;
  result: DetectionResult;
}

export type AppPhase = 'upload' | 'detecting' | 'results';
