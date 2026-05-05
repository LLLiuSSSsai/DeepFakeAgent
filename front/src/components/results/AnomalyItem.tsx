import { motion } from 'framer-motion';
import { ArrowSquareOut, Target } from '@phosphor-icons/react';
import type { AnomalyEvidence } from '../../utils/types';
import { useDetectionStore } from '../../store/detectionStore';

interface AnomalyItemProps {
  anomaly: AnomalyEvidence;
  index: number;
}

const HEATMAP_COLORS: Record<string, string> = {
  fusion: '#10b981',
  frequency: '#3b82f6',
  noise: '#f59e0b',
  semantic: '#8b5cf6',
};

export default function AnomalyItem({ anomaly, index }: AnomalyItemProps) {
  const highlightedAnomalyId = useDetectionStore((s) => s.highlightedAnomalyId);
  const setHighlightedAnomaly = useDetectionStore((s) => s.setHighlightedAnomaly);
  const setActiveHeatmap = useDetectionStore((s) => s.setActiveHeatmap);
  const color = HEATMAP_COLORS[anomaly.heatmapType] || '#10b981';
  const isHighlighted = highlightedAnomalyId === anomaly.id;

  const handleClick = () => {
    if (isHighlighted) {
      setHighlightedAnomaly(null);
    } else {
      setActiveHeatmap(anomaly.heatmapType);
      setHighlightedAnomaly(anomaly.id);
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      onClick={handleClick}
      className={`
        w-full text-left p-4 rounded-xl border transition-all duration-300 group h-full
        ${isHighlighted
          ? 'border-red-300 bg-red-50/60 shadow-[0_0_0_2px_rgba(239,68,68,0.15)]'
          : 'border-zinc-200/60 bg-white hover:border-zinc-300 hover:bg-zinc-50/50'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}18` }}
        >
          <span className="text-sm font-bold font-mono" style={{ color }}>
            {anomaly.rank}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className={`text-sm font-semibold ${isHighlighted ? 'text-red-700' : 'text-zinc-800'}`}>
              {anomaly.title}
            </p>
            {isHighlighted && (
              <Target weight="fill" className="w-4 h-4 text-red-400 shrink-0 animate-pulse-soft" />
            )}
          </div>
          <p className="text-sm text-zinc-500 leading-relaxed line-clamp-3">
            {anomaly.description}
          </p>

          <div className="flex items-center gap-2 mt-3">
            <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${anomaly.score * 100}%` }}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
              />
            </div>
            <span className="text-xs font-mono font-semibold tabular-nums" style={{ color }}>
              {(anomaly.score * 100).toFixed(0)}%
            </span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize"
              style={{ backgroundColor: `${color}12`, color }}
            >
              {anomaly.heatmapType}
            </span>
          </div>
        </div>

        <ArrowSquareOut
          weight="bold"
          className={`w-5 h-5 shrink-0 mt-0.5 transition-all ${
            isHighlighted ? 'text-red-400 rotate-90' : 'text-zinc-300 group-hover:text-zinc-500'
          }`}
        />
      </div>
    </motion.button>
  );
}
