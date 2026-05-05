import { motion } from 'framer-motion';
import type { HeatmapType } from '../../utils/types';

interface HeatmapToggleProps {
  active: HeatmapType;
  onChange: (type: HeatmapType) => void;
}

const TYPES: { value: HeatmapType; label: string; color: string }[] = [
  { value: 'fusion', label: 'Fusion', color: '#10b981' },
  { value: 'frequency', label: 'Frequency', color: '#3b82f6' },
  { value: 'noise', label: 'Noise', color: '#f59e0b' },
  { value: 'semantic', label: 'Semantic', color: '#8b5cf6' },
];

export default function HeatmapToggle({ active, onChange }: HeatmapToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl">
      {TYPES.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            active === t.value
              ? 'text-white'
              : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          {active === t.value && (
            <motion.div
              layoutId="heatmap-tab"
              className="absolute inset-0 rounded-lg"
              style={{ backgroundColor: t.color }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative z-10">{t.label}</span>
        </button>
      ))}
    </div>
  );
}
