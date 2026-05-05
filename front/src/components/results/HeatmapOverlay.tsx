import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MagnifyingGlassPlus, MagnifyingGlassMinus, ArrowsOut } from '@phosphor-icons/react';

interface HeatmapOverlayProps {
  imageUrl: string;
  anomalyRegions?: { x: number; y: number; width: number; height: number; id?: string; score?: number; label?: string }[];
  highlightedId?: string | null;
}

export default function HeatmapOverlay({ anomalyRegions = [], highlightedId }: HeatmapOverlayProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    setPan({
      x: dragStart.current.panX + (e.clientX - dragStart.current.x),
      y: dragStart.current.panY + (e.clientY - dragStart.current.y),
    });
  }, [dragging]);

  const handleMouseUp = useCallback(() => setDragging(false), []);
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.5, Math.min(3, z + (e.deltaY > 0 ? -0.2 : 0.2))));
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[16/10] bg-zinc-900 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Base heatmap image */}
      <motion.div
        className="absolute inset-0"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      >
        {/* Heatmap gradient layer */}
        <div
          className="absolute inset-0 opacity-70 mix-blend-multiply"
          style={{
            background: `
              radial-gradient(ellipse at 35% 30%, rgba(239,68,68,0.6) 0%, transparent 50%),
              radial-gradient(ellipse at 65% 60%, rgba(245,158,11,0.5) 0%, transparent 40%),
              radial-gradient(ellipse at 15% 70%, rgba(245,158,11,0.4) 0%, transparent 35%),
              radial-gradient(ellipse at 80% 20%, rgba(34,197,94,0.2) 0%, transparent 60%)`,
          }}
        />

        {/* Anomaly region boxes */}
        {anomalyRegions.map((region) => {
          const isHighlighted = region.id === highlightedId;
          return (
            <motion.div
              key={region.id || `${region.x}-${region.y}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: isHighlighted ? 1 : 0.6,
                scale: isHighlighted ? 1.02 : 1,
                borderColor: isHighlighted ? '#ef4444' : '#f97316',
              }}
              transition={{ duration: 0.3 }}
              className="absolute border-2 rounded-lg"
              style={{
                left: `${region.x}%`,
                top: `${region.y}%`,
                width: `${region.width}%`,
                height: `${region.height}%`,
                borderColor: isHighlighted ? '#ef4444' : '#f97316',
                boxShadow: isHighlighted
                  ? '0 0 0 4px rgba(239,68,68,0.2), inset 0 0 0 1px rgba(239,68,68,0.1)'
                  : '0 0 0 2px rgba(249,115,22,0.15)',
              }}
            >
              {isHighlighted && (
                <div className="absolute -top-6 left-0 px-1.5 py-0.5 rounded bg-red-500 text-[9px] font-medium text-white whitespace-nowrap">
                  {region.label || 'Anomaly'}
                  {region.score !== undefined && (
                    <span className="ml-1 opacity-80">{(region.score * 100).toFixed(0)}%</span>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Zoom controls */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg border border-zinc-200/50 p-1 shadow-lg">
        <button
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.3))}
          className="p-1.5 rounded hover:bg-zinc-100 transition-colors"
        >
          <MagnifyingGlassMinus weight="bold" className="w-3.5 h-3.5 text-zinc-600" />
        </button>
        <span className="text-[10px] font-mono text-zinc-500 tabular-nums w-8 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.min(3, z + 0.3))}
          className="p-1.5 rounded hover:bg-zinc-100 transition-colors"
        >
          <MagnifyingGlassPlus weight="bold" className="w-3.5 h-3.5 text-zinc-600" />
        </button>
        <div className="w-px h-4 bg-zinc-200 mx-0.5" />
        <button
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          className="p-1.5 rounded hover:bg-zinc-100 transition-colors"
        >
          <ArrowsOut weight="bold" className="w-3.5 h-3.5 text-zinc-600" />
        </button>
      </div>
    </div>
  );
}
