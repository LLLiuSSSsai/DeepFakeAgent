import { motion } from 'framer-motion';
import { ArrowLeft } from '@phosphor-icons/react';
import { useDetectionStore } from '../../store/detectionStore';
import { useUploadStore } from '../../store/uploadStore';
import ResultCard from './ResultCard';
import AgentScoreBars from './AgentScoreBars';
import ComparisonView from './ComparisonView';
import SuspiciousRegions from './SuspiciousRegions';
import ReportSection from '../report/ReportSection';

export default function ResultDashboard() {
  const result = useDetectionStore((s) => s.result);
  const reset = useDetectionStore((s) => s.reset);
  const images = useUploadStore((s) => s.images);

  if (!result) return null;

  const image = images.find((img) => img.id === result.imageId);
  const originalUrl = image?.previewUrl || '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Back button */}
      <button
        onClick={reset}
        className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
      >
        <ArrowLeft weight="bold" className="w-4 h-4" />
        New Detection
      </button>

      {/* Result card + Agent scores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ResultCard result={result} />
        <AgentScoreBars agents={result.agentResults} />
      </div>

      {/* Comparison view */}
      <ComparisonView originalUrl={originalUrl} />

      {/* Suspicious regions - full width */}
      <SuspiciousRegions anomalies={result.anomalies} />

      {/* Report trigger button - full width below anomalies */}
      <ReportSection />
    </motion.div>
  );
}
