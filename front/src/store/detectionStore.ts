import { create } from 'zustand';
import type { DetectionStep, DetectionResult, StepStatus, AppPhase } from '../utils/types';
import { DETECTION_STEPS, getStepDurations, generateMockResult } from '../utils/mockData';

interface DetectionState {
  phase: AppPhase;
  steps: DetectionStep[];
  currentStepIndex: number;
  overallProgress: number;
  result: DetectionResult | null;
  activeHeatmap: 'fusion' | 'frequency' | 'noise' | 'semantic';
  highlightedAnomalyId: string | null;
  reportExpanded: boolean;

  setPhase: (phase: AppPhase) => void;
  startDetection: (imageId: string) => void;
  advanceStep: () => void;
  setActiveHeatmap: (type: 'fusion' | 'frequency' | 'noise' | 'semantic') => void;
  setHighlightedAnomaly: (id: string | null) => void;
  setReportExpanded: (expanded: boolean) => void;
  reset: () => void;
}

const initialState = {
  phase: 'upload' as AppPhase,
  steps: DETECTION_STEPS.map((s) => ({
    ...s,
    status: 'pending' as StepStatus,
  })),
  currentStepIndex: -1,
  overallProgress: 0,
  result: null,
  activeHeatmap: 'fusion' as const,
  highlightedAnomalyId: null,
  reportExpanded: false,
};

export const useDetectionStore = create<DetectionState>((set, get) => ({
  ...initialState,

  setPhase: (phase) => set({ phase }),

  startDetection: (imageId: string) => {
    const steps = DETECTION_STEPS.map((s, i) => ({
      ...s,
      status: i === 0 ? ('running' as StepStatus) : ('pending' as StepStatus),
    }));

    set({
      phase: 'detecting',
      steps,
      currentStepIndex: 0,
      overallProgress: 0,
      result: null,
      highlightedAnomalyId: null,
    });

    const durations = getStepDurations();
    const totalDuration = durations.reduce((a, b) => a + b, 0);

    durations.forEach((duration, index) => {
      setTimeout(() => {
        const state = get();
        const newSteps = state.steps.map((s, i) => {
          if (i === index) return { ...s, status: 'completed' as StepStatus, duration };
          if (i === index + 1) return { ...s, status: 'running' as StepStatus };
          return s;
        });

        const progress = durations
          .slice(0, index + 1)
          .reduce((a, b) => a + b, 0) / totalDuration * 100;

        set({
          steps: newSteps,
          currentStepIndex: index + 1,
          overallProgress: Math.min(progress, 100),
        });

        if (index === durations.length - 1) {
          setTimeout(() => {
            const result = generateMockResult(imageId);
            set({
              phase: 'results',
              overallProgress: 100,
              result,
            });
          }, 400);
        }
      }, durations.slice(0, index).reduce((a, b) => a + b, 0) * 1000 + (index === 0 ? 300 : 0));
    });
  },

  advanceStep: () => {
    // Manual step control reserved for future use
  },

  setActiveHeatmap: (type) => set({ activeHeatmap: type }),
  setHighlightedAnomaly: (id) => set({ highlightedAnomalyId: id }),
  setReportExpanded: (expanded) => set({ reportExpanded: expanded }),

  reset: () => set(initialState),
}));
