import { motion } from 'framer-motion';
import { WarningCircle } from '@phosphor-icons/react';
import type { AnomalyEvidence } from '../../utils/types';
import AnomalyItem from './AnomalyItem';

interface SuspiciousRegionsProps {
  anomalies: AnomalyEvidence[];
}

export default function SuspiciousRegions({ anomalies }: SuspiciousRegionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="p-5 rounded-2xl bg-white border border-zinc-200/60"
    >
      <div className="flex items-center gap-2 mb-4">
        <WarningCircle weight="fill" className="w-5 h-5 text-amber-500" />
        <p className="text-base font-semibold text-zinc-700 tracking-tight">
          Top Anomaly Evidence
        </p>
        <span className="text-sm text-zinc-400 ml-auto">
          Click to locate on heatmap
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {anomalies.map((anomaly, i) => (
          <AnomalyItem key={anomaly.id} anomaly={anomaly} index={i} />
        ))}
      </div>
    </motion.div>
  );
}
