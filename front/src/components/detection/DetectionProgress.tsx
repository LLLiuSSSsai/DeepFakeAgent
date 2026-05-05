import { motion } from 'framer-motion';
import { useDetectionStore } from '../../store/detectionStore';

export default function DetectionProgress() {
  const overallProgress = useDetectionStore((s) => s.overallProgress);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-zinc-600">Detection Progress</span>
        <span className="text-sm font-mono font-semibold text-zinc-700 tabular-nums">
          {Math.round(overallProgress)}%
        </span>
      </div>
      <div className="relative h-3 bg-zinc-200/70 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${overallProgress}%` }}
          transition={{ type: 'spring', stiffness: 50, damping: 20 }}
        />
        {/* Shimmer effect */}
        {overallProgress < 100 && (
          <div className="absolute inset-y-0 left-0 right-0 rounded-full overflow-hidden">
            <div
              className="h-full w-full"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s ease-in-out infinite',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
