import { motion } from 'framer-motion';
import { Pulse } from '@phosphor-icons/react';
import { useDetectionStore } from '../../store/detectionStore';
import AgentCharacter from './AgentCharacter';

export default function AgentSignalPreview() {
  const steps = useDetectionStore((s) => s.steps);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-6 p-5 rounded-2xl bg-white border border-zinc-200/60"
    >
      <div className="flex items-center gap-2 mb-5">
        <Pulse weight="fill" className="w-5 h-5 text-emerald-500" />
        <span className="text-sm font-semibold text-zinc-700 tracking-tight">
          Agent Signal Monitor
        </span>
        <span className="text-xs text-zinc-400 ml-auto">
          {steps.filter(s => s.status === 'completed').length}/{steps.length} agents completed
        </span>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {steps.map((step, i) => {
          const isActive = step.status === 'running';
          const isCompleted = step.status === 'completed';

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className="flex flex-col items-center gap-2"
            >
              <AgentCharacter
                agentId={step.id}
                size={isActive ? 56 : 44}
                isActive={isActive}
                isCompleted={isCompleted}
              />

              <span className={`text-[10px] font-semibold text-center leading-tight ${
                isActive ? 'text-zinc-700' : isCompleted ? 'text-zinc-600' : 'text-zinc-400'
              }`}>
                {step.agentName
                  .replace('FrequencyDomainAgent', 'Frequency')
                  .replace('NoiseConsistencyAgent', 'Noise Check')
                  .replace('SemanticStructureAgent', 'Semantic')
                  .replace('DeepFeatureAgent', 'Deep Feature')
                  .replace('OpenSetDiscriminator', 'Open-Set')
                }
              </span>

              {/* Status indicator */}
              <div className="flex items-center gap-1">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    isActive ? 'animate-pulse-soft' : ''
                  }`}
                  style={{
                    backgroundColor: isActive ? '#10b981' : isCompleted ? '#10b981' : '#d4d4d8'
                  }}
                />
                <span className="text-[9px] font-medium text-zinc-400">
                  {isActive ? 'Running' : isCompleted ? 'Done' : 'Waiting'}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
