import { motion } from 'framer-motion';
import { ShieldCheck, ShieldWarning, ShieldSlash, Detective } from '@phosphor-icons/react';
import type { DetectionResult } from '../../utils/types';

interface ResultCardProps {
  result: DetectionResult;
}

const CONCLUSION_CONFIG = {
  real: {
    icon: ShieldCheck,
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    shadow: 'shadow-[0_4px_24px_rgba(16,185,129,0.12)]',
  },
  suspicious: {
    icon: ShieldWarning,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    shadow: 'shadow-[0_4px_24px_rgba(245,158,11,0.12)]',
  },
  'ai-generated': {
    icon: ShieldSlash,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    shadow: 'shadow-[0_4px_24px_rgba(239,68,68,0.12)]',
  },
  unknown: {
    icon: Detective,
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    text: 'text-violet-700',
    shadow: 'shadow-[0_4px_24px_rgba(139,92,246,0.12)]',
  },
};

function riskColor(score: number): string {
  if (score <= 30) return 'text-risk-safe';
  if (score <= 60) return 'text-risk-suspicious';
  if (score <= 90) return 'text-risk-high';
  return 'text-risk-unknown';
}

export default function ResultCard({ result }: ResultCardProps) {
  const config = CONCLUSION_CONFIG[result.conclusion];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`relative rounded-2xl p-6 border ${config.border} ${config.bg} ${config.shadow}`}
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-sm font-medium text-zinc-500 uppercase tracking-wide">Detection Verdict</p>
          <div className="flex items-center gap-3 mt-2">
            <Icon weight="fill" className={`w-8 h-8 ${config.text}`} />
            <h2 className={`text-2xl font-bold tracking-tight ${config.text}`}>
              {result.conclusionLabel}
            </h2>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-zinc-500 uppercase tracking-wide">Risk Score</p>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
          >
            <span className={`text-5xl font-bold font-mono tabular-nums tracking-tighter ${riskColor(result.riskScore)}`}>
              {result.riskScore}
            </span>
            <span className="text-base text-zinc-400">/100</span>
          </motion.div>
        </div>
      </div>

      {/* Score bar */}
      <div className="mb-4">
        <div className="relative h-3 rounded-full bg-zinc-200/70 overflow-hidden">
          <div className="absolute inset-0 flex">
            <div className="w-[30%] bg-risk-safe/30" />
            <div className="w-[30%] bg-risk-suspicious/30" />
            <div className="w-[30%] bg-risk-high/30" />
            <div className="w-[10%] bg-risk-unknown/30" />
          </div>
          <motion.div
            initial={{ left: '0%' }}
            animate={{ left: `${Math.min(result.riskScore, 100)}%` }}
            transition={{ type: 'spring', stiffness: 50, damping: 20, delay: 0.5 }}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white border-2 border-zinc-800 shadow-md"
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-risk-safe font-semibold">Real</span>
          <span className="text-xs text-risk-suspicious font-semibold">Suspicious</span>
          <span className="text-xs text-risk-high font-semibold">AI-Generated</span>
          <span className="text-xs text-risk-unknown font-semibold">Unknown</span>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-8 text-sm text-zinc-500">
        <div>
          <span className="text-zinc-400">Confidence: </span>
          <span className="font-mono font-semibold text-zinc-800 tabular-nums">
            {(result.confidence * 100).toFixed(1)}%
          </span>
        </div>
        <div>
          <span className="text-zinc-400">Duration: </span>
          <span className="font-mono font-semibold text-zinc-800 tabular-nums">
            {result.totalDuration.toFixed(1)}s
          </span>
        </div>
        <div>
          <span className="text-zinc-400">Mode: </span>
          <span className="font-semibold text-zinc-800 capitalize">{result.detectionMode}</span>
        </div>
      </div>

      {result.unknownWarning && (
        <div className="mt-5 p-4 rounded-xl bg-violet-100/50 border border-violet-200">
          <p className="text-sm font-semibold text-violet-700">Unknown Generation Pattern Detected</p>
          <p className="text-sm text-violet-600 mt-1">{result.unknownWarning.possibleAttackType}</p>
        </div>
      )}
    </motion.div>
  );
}
