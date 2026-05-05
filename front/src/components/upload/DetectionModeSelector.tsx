import { motion } from 'framer-motion';
import { Lightning, MagnifyingGlass, Scales } from '@phosphor-icons/react';
import type { DetectionMode } from '../../utils/types';
import { useUploadStore } from '../../store/uploadStore';

interface ModeOption {
  value: DetectionMode;
  label: string;
  description: string;
  time: string;
  icon: typeof Lightning;
  features: string[];
}

const MODES: ModeOption[] = [
  {
    value: 'quick',
    label: 'Quick Scan',
    description: 'Rapid binary classification for high-volume screening',
    time: '< 3s',
    icon: Lightning,
    features: ['Risk score', 'Risk level badge', 'Binary verdict'],
  },
  {
    value: 'deep',
    label: 'Deep Detection',
    description: 'Full multi-agent analysis with heatmap evidence',
    time: '< 10s',
    icon: MagnifyingGlass,
    features: ['Risk score & confidence', '4 heatmap overlays', 'Top 3 anomaly evidence', 'Agent breakdown'],
  },
  {
    value: 'forensic',
    label: 'Forensic Report',
    description: 'Complete evidence chain for legal and compliance use',
    time: '< 20s',
    icon: Scales,
    features: ['Structured report', 'All agent evidence', 'Unknown threat warnings', 'PDF/JSON export', 'Review guidance'],
  },
];

export default function DetectionModeSelector() {
  const detectionMode = useUploadStore((s) => s.detectionMode);
  const setDetectionMode = useUploadStore((s) => s.setDetectionMode);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {MODES.map((mode, i) => {
        const Icon = mode.icon;
        const isActive = detectionMode === mode.value;

        return (
          <motion.button
            key={mode.value}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => setDetectionMode(mode.value)}
            whileTap={{ scale: 0.98 }}
            className={`
              relative text-left p-5 rounded-2xl border transition-all duration-300
              ${isActive
                ? 'border-emerald-300 bg-emerald-50/70 shadow-[0_0_0_2px_rgba(16,185,129,0.12)]'
                : 'border-zinc-200/60 bg-white hover:border-zinc-300 hover:bg-zinc-50/50'
              }
            `}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${isActive ? 'bg-emerald-100' : 'bg-zinc-100'}`}>
                <Icon
                  weight={isActive ? 'fill' : 'regular'}
                  className={`w-6 h-6 ${isActive ? 'text-emerald-600' : 'text-zinc-400'}`}
                />
              </div>
              <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-full ${
                isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'
              }`}>
                {mode.time}
              </span>
            </div>

            <p className={`text-base font-semibold ${isActive ? 'text-emerald-700' : 'text-zinc-800'}`}>
              {mode.label}
            </p>
            <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed">
              {mode.description}
            </p>

            <div className="mt-4 pt-3 border-t border-zinc-100">
              <ul className="space-y-1.5">
                {mode.features.map((f) => (
                  <li key={f} className="text-xs text-zinc-500 flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-zinc-300'}`} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {isActive && (
              <motion.div
                layoutId="mode-indicator"
                className="absolute -top-[1px] left-6 right-6 h-[3px] bg-emerald-500 rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
