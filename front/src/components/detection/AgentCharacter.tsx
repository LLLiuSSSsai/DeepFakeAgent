import { motion } from 'framer-motion';

interface AgentCharacterProps {
  agentId: string;
  size?: number;
  isActive?: boolean;
  isCompleted?: boolean;
}

const AGENT_CONFIGS: Record<string, { color: string; bgColor: string; label: string }> = {
  frequency: { color: '#10b981', bgColor: '#d1fae5', label: 'Frequency' },
  noise: { color: '#3b82f6', bgColor: '#dbeafe', label: 'Noise' },
  semantic: { color: '#f59e0b', bgColor: '#fef3c7', label: 'Semantic' },
  deepfeature: { color: '#8b5cf6', bgColor: '#ede9fe', label: 'DeepFeature' },
  openset: { color: '#ec4899', bgColor: '#fce7f3', label: 'OpenSet' },
};

function FrequencyWave({ color, isActive }: { color: string; isActive: boolean }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
      {/* Background bars */}
      {[8, 16, 24, 32, 40, 48, 56].map((x, i) => (
        <motion.rect
          key={x}
          x={x - 2}
          y={20}
          width={3}
          rx={1.5}
          fill={color}
          fillOpacity={0.2}
          animate={isActive ? { height: [16, 28, 20, 8, 24, 16], y: [20, 14, 18, 28, 16, 20] } : {} }
          transition={isActive ? { duration: 1.2, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' } : {}}
          style={{ originY: '32px' }}
        />
      ))}
      {/* Foreground sine wave */}
      <motion.path
        d="M4 32 Q12 20 20 32 Q28 44 36 32 Q44 20 52 32 Q56 38 60 32"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
        animate={isActive ? { opacity: [0.6, 1, 0.6], pathLength: [0.85, 1, 0.85] } : { opacity: 1 }}
        transition={isActive ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : {}}
      />
    </svg>
  );
}

function NoiseGrid({ color, isActive }: { color: string; isActive: boolean }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
      {/* Grid lines */}
      <rect x={12} y={12} width={40} height={40} rx={4} stroke={color} strokeWidth={1.5} strokeOpacity={0.3} fill="none" />
      <line x1={32} y1={12} x2={32} y2={52} stroke={color} strokeWidth={1} strokeOpacity={0.2} />
      <line x1={12} y1={32} x2={52} y2={32} stroke={color} strokeWidth={1} strokeOpacity={0.2} />
      <line x1={22} y1={12} x2={22} y2={52} stroke={color} strokeWidth={0.5} strokeOpacity={0.15} />
      <line x1={42} y1={12} x2={42} y2={52} stroke={color} strokeWidth={0.5} strokeOpacity={0.15} />
      <line x1={12} y1={22} x2={52} y2={22} stroke={color} strokeWidth={0.5} strokeOpacity={0.15} />
      <line x1={12} y1={42} x2={52} y2={42} stroke={color} strokeWidth={0.5} strokeOpacity={0.15} />
      {/* Scanning crosshair */}
      <motion.circle
        cx={32} cy={32} r={6} fill={color} fillOpacity={0.15} stroke={color} strokeWidth={2}
        animate={isActive ? { r: [6, 16, 6], opacity: [0.8, 0.2, 0.8] } : {}}
        transition={isActive ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } : {}}
      />
      <motion.circle cx={32} cy={32} r={2} fill={color}
        animate={isActive ? { scale: [1, 1.3, 1] } : {}}
        transition={isActive ? { duration: 0.8, repeat: Infinity } : {}}
      />
      {/* Corner markers */}
      {[
        [10, 10], [54, 10], [10, 54], [54, 54]
      ].map(([cx, cy], i) => (
        <motion.circle key={i} cx={cx} cy={cy} r={2} fill={color}
          animate={isActive ? { opacity: [0.3, 1, 0.3] } : {}}
          transition={isActive ? { duration: 1.5, delay: i * 0.3, repeat: Infinity } : {}}
        />
      ))}
    </svg>
  );
}

function StructuralEye({ color, isActive }: { color: string; isActive: boolean }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
      {/* Outer eye shape */}
      <motion.ellipse cx={32} cy={32} rx={20} ry={14} stroke={color} strokeWidth={2} fill="none"
        animate={isActive ? { rx: [20, 22, 20] } : {}}
        transition={isActive ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
      />
      {/* Iris */}
      <motion.circle cx={32} cy={32} r={7} fill={color} fillOpacity={0.2} stroke={color} strokeWidth={1.5}
        animate={isActive ? { r: [7, 8, 7] } : {}}
        transition={isActive ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : {}}
      />
      <motion.circle cx={32} cy={32} r={3} fill={color}
        animate={isActive ? { scale: [1, 1.2, 1] } : {}}
        transition={isActive ? { duration: 1, repeat: Infinity } : {}}
      />
      {/* Eyelid lines */}
      <path d="M12 32 Q32 22 52 32" stroke={color} strokeWidth={1} strokeOpacity={0.3} fill="none" />
      <path d="M12 34 Q32 44 52 34" stroke={color} strokeWidth={1} strokeOpacity={0.3} fill="none" />
      {/* Scanning lines around */}
      {[0, 45, 90, 135].map((angle, i) => (
        <motion.line key={i}
          x1={32 + 18 * Math.cos(angle * Math.PI / 180)}
          y1={32 + 18 * Math.sin(angle * Math.PI / 180)}
          x2={32 + 24 * Math.cos(angle * Math.PI / 180)}
          y2={32 + 24 * Math.sin(angle * Math.PI / 180)}
          stroke={color} strokeWidth={1.5} strokeOpacity={0.4}
          animate={isActive ? { opacity: [0.3, 1, 0.3], x2: [32 + 22 * Math.cos(angle * Math.PI / 180), 32 + 26 * Math.cos(angle * Math.PI / 180), 32 + 22 * Math.cos(angle * Math.PI / 180)] } : {}}
          transition={isActive ? { duration: 1.2, delay: i * 0.2, repeat: Infinity } : {}}
        />
      ))}
    </svg>
  );
}

function NeuralNetwork({ color, isActive }: { color: string; isActive: boolean }) {
  const nodes = [
    { x: 32, y: 10 }, { x: 16, y: 26 }, { x: 48, y: 26 },
    { x: 10, y: 44 }, { x: 32, y: 38 }, { x: 54, y: 44 },
    { x: 22, y: 56 }, { x: 42, y: 56 },
  ];
  const edges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [2, 5], [3, 6], [4, 6], [4, 7], [5, 7]];

  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
      {/* Edges */}
      {edges.map(([a, b], i) => (
        <motion.line
          key={i}
          x1={nodes[a].x} y1={nodes[a].y}
          x2={nodes[b].x} y2={nodes[b].y}
          stroke={color} strokeWidth={1} strokeOpacity={0.25}
          animate={isActive ? { strokeOpacity: [0.15, 0.5, 0.15] } : {}}
          transition={isActive ? { duration: 1.5, delay: i * 0.1, repeat: Infinity } : {}}
        />
      ))}
      {/* Data flow particles on edges */}
      {isActive && edges.map(([a, b], i) => (
        <motion.circle
          key={`p-${i}`}
          r={2} fill={color} fillOpacity={0.7}
          animate={{
            cx: [nodes[a].x, nodes[b].x, nodes[a].x],
            cy: [nodes[a].y, nodes[b].y, nodes[a].y],
          }}
          transition={{ duration: 1.8, delay: i * 0.15, repeat: Infinity, ease: 'linear' }}
        />
      ))}
      {/* Nodes */}
      {nodes.map((n, i) => (
        <motion.circle
          key={i}
          cx={n.x} cy={n.y} r={i === 0 ? 3.5 : i === 4 ? 3 : 2.5}
          fill={color} fillOpacity={i === 0 || i === 4 ? 0.3 : 0.15}
          stroke={color} strokeWidth={1.5}
          animate={isActive ? { scale: [1, 1.15, 1] } : {}}
          transition={isActive ? { duration: 1.2, delay: i * 0.12, repeat: Infinity } : {}}
        />
      ))}
    </svg>
  );
}

function RadarScope({ color, isActive }: { color: string; isActive: boolean }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
      {/* Outer rings */}
      {[20, 14, 8].map((r, i) => (
        <motion.circle key={i} cx={32} cy={32} r={r} stroke={color} strokeWidth={0.8} strokeOpacity={0.2} fill="none"
          animate={isActive ? { scale: [1, 1.04, 1], opacity: [0.6, 1, 0.6] } : {}}
          transition={isActive ? { duration: 2, delay: i * 0.4, repeat: Infinity } : {}}
        />
      ))}
      {/* Sweep line */}
      <motion.line
        x1={32} y1={32} x2={32} y2={12}
        stroke={color} strokeWidth={2} strokeLinecap="round"
        animate={isActive ? { rotate: [0, 360] } : { rotate: 45 }}
        transition={isActive ? { duration: 3, repeat: Infinity, ease: 'linear' } : {}}
        style={{ originX: '32px', originY: '32px' }}
      />
      {/* Center dot */}
      <circle cx={32} cy={32} r={3} fill={color} />
      {/* Blips */}
      {[
        { x: 40, y: 22 }, { x: 24, y: 40 }, { x: 42, y: 38 }
      ].map((p, i) => (
        <motion.circle key={i} cx={p.x} cy={p.y} r={2.5} fill={color}
          animate={isActive ? { opacity: [0.2, 1, 0.2], r: [1.5, 3, 1.5] } : { opacity: 0.4 }}
          transition={isActive ? { duration: 1.5, delay: i * 0.5, repeat: Infinity } : {}}
        />
      ))}
    </svg>
  );
}

const AGENT_ILLUSTRATIONS: Record<string, React.FC<{ color: string; isActive: boolean }>> = {
  frequency: FrequencyWave,
  noise: NoiseGrid,
  semantic: StructuralEye,
  deepfeature: NeuralNetwork,
  openset: RadarScope,
};

export default function AgentCharacter({ agentId, size = 64, isActive = false, isCompleted = false }: AgentCharacterProps) {
  const config = AGENT_CONFIGS[agentId] || AGENT_CONFIGS.frequency;
  const Illustration = AGENT_ILLUSTRATIONS[agentId] || AGENT_ILLUSTRATIONS.frequency;

  return (
    <motion.div
      className="relative rounded-xl overflow-hidden flex items-center justify-center"
      style={{
        width: size,
        height: size,
        backgroundColor: isCompleted ? config.bgColor : isActive ? config.bgColor : '#f4f4f5',
        border: `2px solid ${isActive ? config.color : isCompleted ? config.color + '40' : '#e4e4e7'}`,
      }}
      animate={isActive ? {
        boxShadow: [
          `0 0 0 0 ${config.color}20`,
          `0 0 0 6px ${config.color}08`,
          `0 0 0 0 ${config.color}20`,
        ],
      } : {}}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <Illustration color={config.color} isActive={isActive} />
      {/* Active glow ring */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-dashed"
          style={{ borderColor: config.color + '40' }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
      )}
      {/* Completed check */}
      {isCompleted && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: config.color }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      )}
    </motion.div>
  );
}
