import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowsLeftRight, StackSimple } from '@phosphor-icons/react';
import HeatmapOverlay from './HeatmapOverlay';
import HeatmapToggle from './HeatmapToggle';
import { useDetectionStore } from '../../store/detectionStore';

interface ComparisonViewProps {
  originalUrl: string;
}

export default function ComparisonView({ originalUrl }: ComparisonViewProps) {
  const [layoutMode, setLayoutMode] = useState<'split' | 'stack'>('split');
  const activeHeatmap = useDetectionStore((s) => s.activeHeatmap);
  const setActiveHeatmap = useDetectionStore((s) => s.setActiveHeatmap);
  const result = useDetectionStore((s) => s.result);
  const highlightedAnomalyId = useDetectionStore((s) => s.highlightedAnomalyId);

  const anomalyRegions = result?.anomalies.map((a) => ({
    ...a.region,
    id: a.id,
    score: a.score,
    label: a.title.split(':')[0] || a.title,
  })) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl bg-white border border-zinc-200/60 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
        <p className="text-base font-semibold text-zinc-700 tracking-tight">
          Heatmap Comparison
        </p>
        <div className="flex items-center gap-4">
          <HeatmapToggle active={activeHeatmap} onChange={setActiveHeatmap} />
          <div className="w-px h-5 bg-zinc-200" />
          <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-0.5">
            <button
              onClick={() => setLayoutMode('split')}
              className={`p-2 rounded-md transition-all ${layoutMode === 'split' ? 'bg-white shadow-sm text-zinc-700' : 'text-zinc-400'}`}
            >
              <ArrowsLeftRight weight="bold" className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLayoutMode('stack')}
              className={`p-2 rounded-md transition-all ${layoutMode === 'stack' ? 'bg-white shadow-sm text-zinc-700' : 'text-zinc-400'}`}
            >
              <StackSimple weight="bold" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className={`p-4 ${layoutMode === 'split' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : 'flex flex-col gap-4'}`}>
        <div className="rounded-xl overflow-hidden border border-zinc-200/60">
          <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-100">
            <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">
              Original Image
            </span>
          </div>
          <div className="aspect-[16/10] bg-zinc-100 relative">
            <img
              src={originalUrl}
              alt="Original"
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>
        </div>

        <div className="rounded-xl overflow-hidden border border-zinc-200/60">
          <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">
              {activeHeatmap === 'fusion' ? 'Fusion Heatmap' :
               activeHeatmap === 'frequency' ? 'Frequency Anomalies' :
               activeHeatmap === 'noise' ? 'Noise Inconsistencies' : 'Semantic Anomalies'}
            </span>
          </div>
          <HeatmapOverlay
            imageUrl={originalUrl}
            anomalyRegions={anomalyRegions}
            highlightedId={highlightedAnomalyId}
          />
        </div>
      </div>
    </motion.div>
  );
}
