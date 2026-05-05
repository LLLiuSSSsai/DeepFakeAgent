import { motion } from 'framer-motion';
import type { DetectionStep } from '../../utils/types';
import AgentCharacter from './AgentCharacter';

interface StepItemProps {
  step: DetectionStep;
  index: number;
  isLast: boolean;
}

const AGENT_COLORS: Record<string, string> = {
  frequency: '#10b981',
  noise: '#3b82f6',
  semantic: '#f59e0b',
  deepfeature: '#8b5cf6',
  openset: '#ec4899',
};

const AGENT_EFFECTS: Record<string, { bgPattern: string; borderEffect: string }> = {
  frequency: {
    bgPattern: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(16,185,129,0.03) 2px, rgba(16,185,129,0.03) 4px)',
    borderEffect: 'border-emerald-300/60',
  },
  noise: {
    bgPattern: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(59,130,246,0.04) 3px, rgba(59,130,246,0.04) 6px), repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(59,130,246,0.04) 3px, rgba(59,130,246,0.04) 6px)',
    borderEffect: 'border-blue-300/60',
  },
  semantic: {
    bgPattern: 'radial-gradient(circle at 30% 50%, rgba(245,158,11,0.05) 0%, transparent 60%)',
    borderEffect: 'border-amber-300/60',
  },
  deepfeature: {
    bgPattern: 'radial-gradient(circle at 70% 30%, rgba(139,92,246,0.06) 0%, transparent 50%), radial-gradient(circle at 30% 70%, rgba(139,92,246,0.04) 0%, transparent 50%)',
    borderEffect: 'border-violet-300/60',
  },
  openset: {
    bgPattern: 'conic-gradient(from 0deg, rgba(236,72,153,0.04), transparent 90deg, rgba(236,72,153,0.04) 180deg, transparent 270deg)',
    borderEffect: 'border-pink-300/60',
  },
};

export default function StepItem({ step, index, isLast }: StepItemProps) {
  const color = AGENT_COLORS[step.id] || '#10b981';
  const effect = AGENT_EFFECTS[step.id] || AGENT_EFFECTS.frequency;
  const isActive = step.status === 'running';
  const isCompleted = step.status === 'completed';
  const isError = step.status === 'error';

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex gap-4"
    >
      {/* Agent character */}
      <div className="flex flex-col items-center shrink-0">
        <AgentCharacter
          agentId={step.id}
          size={isActive ? 56 : 48}
          isActive={isActive}
          isCompleted={isCompleted}
        />
        {!isLast && (
          <motion.div
            className="w-0.5 flex-1 min-h-[20px]"
            style={{
              background: isCompleted
                ? `linear-gradient(to bottom, ${color}, ${color}40)`
                : '#e4e4e7',
            }}
            animate={isActive ? {
              background: [
                `linear-gradient(to bottom, ${color}, ${color}20)`,
                `linear-gradient(to bottom, ${color}80, ${color}10)`,
                `linear-gradient(to bottom, ${color}, ${color}20)`,
              ],
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>

      {/* Content card */}
      <motion.div
        className={`flex-1 mb-2 rounded-xl border transition-all duration-500 overflow-hidden
          ${isActive
            ? `border-${effect.borderEffect} bg-white shadow-[0_0_0_2px_${color}10]`
            : isCompleted
            ? 'border-zinc-200/50 bg-zinc-50/30'
            : isError
            ? 'border-red-200 bg-red-50/50'
            : 'border-transparent bg-transparent'
          }
        `}
        animate={isActive ? {
          boxShadow: [
            `0 0 0 2px ${color}08, 0 4px 12px ${color}06`,
            `0 0 0 4px ${color}04, 0 4px 16px ${color}04`,
            `0 0 0 2px ${color}08, 0 4px 12px ${color}06`,
          ],
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {/* Active background pattern */}
        {isActive && (
          <div className="absolute inset-0 pointer-events-none" style={{ background: effect.bgPattern }} />
        )}

        <div className="relative p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`text-sm font-semibold transition-colors duration-300 ${
                isCompleted ? 'text-zinc-700' :
                isActive ? 'text-zinc-800' :
                isError ? 'text-red-600' :
                'text-zinc-400'
              }`}
            >
              {step.label}
            </span>
            {isActive && (
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full animate-pulse"
                style={{ backgroundColor: `${color}20`, color }}
              >
                Processing
              </span>
            )}
            {step.duration !== undefined && (
              <span className="text-xs font-mono text-zinc-400 ml-auto tabular-nums">
                {step.duration.toFixed(1)}s
              </span>
            )}
          </div>
          <p className={`text-sm leading-relaxed transition-colors duration-300 ${
            isActive ? 'text-zinc-500' : 'text-zinc-400'
          }`}>
            {step.description}
          </p>

          {/* Active signal preview */}
          {isActive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2.5 overflow-hidden"
            >
              <div
                className="h-14 rounded-lg flex items-center justify-center relative overflow-hidden"
                style={{ background: effect.bgPattern }}
              >
                {/* Animated signal bars */}
                <div className="flex items-end gap-1 h-8">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 rounded-t-sm"
                      style={{ backgroundColor: color }}
                      animate={{
                        height: [4, Math.random() * 24 + 4, 4],
                        opacity: [0.3, 0.8, 0.3],
                      }}
                      transition={{
                        duration: 0.8 + Math.random() * 0.6,
                        delay: i * 0.08,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  ))}
                </div>
                <span
                  className="absolute bottom-1 right-2 text-[9px] font-mono font-medium"
                  style={{ color }}
                >
                  SCANNING
                </span>
              </div>
            </motion.div>
          )}

          {/* Completed score */}
          {isCompleted && step.score !== undefined && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${step.score * 100}%` }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: color }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <span className="text-xs font-mono font-semibold tabular-nums" style={{ color }}>
                {(step.score * 100).toFixed(0)}%
              </span>
            </div>
          )}

          {isError && step.errorMessage && (
            <p className="text-sm text-red-500 mt-1">{step.errorMessage}</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
