import { motion } from 'framer-motion';
import type { AgentResult } from '../../utils/types';

interface AgentScoreBarsProps {
  agents: AgentResult[];
}

const AGENT_COLORS: Record<string, string> = {
  FrequencyDomainAgent: '#10b981',
  NoiseConsistencyAgent: '#3b82f6',
  SemanticStructureAgent: '#f59e0b',
  DeepFeatureAgent: '#8b5cf6',
};

export default function AgentScoreBars({ agents }: AgentScoreBarsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="p-5 rounded-2xl bg-white border border-zinc-200/60 flex flex-col justify-center"
    >
      <p className="text-sm font-semibold text-zinc-600 tracking-tight mb-5">
        Agent Analysis Scores
      </p>
      <div className="space-y-4">
        {agents.map((agent, i) => {
          const color = AGENT_COLORS[agent.agentName] || '#10b981';
          const pct = Math.round(agent.score * 100);

          return (
            <div key={agent.agentName}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-zinc-700">{agent.label}</span>
                <span className="text-sm font-mono font-semibold tabular-nums" style={{ color }}>
                  {pct}%
                </span>
              </div>
              <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: 0.5 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
