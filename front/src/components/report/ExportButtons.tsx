import { useState } from 'react';
import { motion } from 'framer-motion';
import { FilePdf, Code, Images, Check, Spinner } from '@phosphor-icons/react';

type ExportFormat = 'pdf' | 'json' | 'images';
type ExportState = 'idle' | 'exporting' | 'done';

export default function ExportButtons() {
  const [exportStates, setExportStates] = useState<Record<ExportFormat, ExportState>>({
    pdf: 'idle',
    json: 'idle',
    images: 'idle',
  });

  const handleExport = async (format: ExportFormat) => {
    setExportStates((s) => ({ ...s, [format]: 'exporting' }));
    await new Promise((r) => setTimeout(r, 1500));
    setExportStates((s) => ({ ...s, [format]: 'done' }));
    setTimeout(() => {
      setExportStates((s) => ({ ...s, [format]: 'idle' }));
    }, 2000);
  };

  const buttons: { format: ExportFormat; label: string; icon: typeof FilePdf; description: string }[] = [
    { format: 'pdf', label: 'PDF Report', icon: FilePdf, description: 'Structured report for legal and compliance use' },
    { format: 'json', label: 'JSON Data', icon: Code, description: 'Raw scores and anomaly coordinates for analysis' },
    { format: 'images', label: 'Image Pack', icon: Images, description: 'All heatmaps and annotated evidence images' },
  ];

  return (
    <div className="space-y-3">
      {buttons.map(({ format, label, icon: Icon, description }) => {
        const state = exportStates[format];
        return (
          <motion.button
            key={format}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleExport(format)}
            disabled={state !== 'idle'}
            className={`
              w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 text-left
              ${state === 'done'
                ? 'border-emerald-300 bg-emerald-50'
                : 'border-zinc-200/60 bg-white hover:border-zinc-300 hover:bg-zinc-50/50'
              }
              disabled:opacity-70 disabled:cursor-not-allowed
            `}
          >
            <div className={`p-2.5 rounded-xl ${state === 'done' ? 'bg-emerald-100' : 'bg-zinc-100'}`}>
              {state === 'exporting' ? (
                <Spinner weight="bold" className="w-5 h-5 text-zinc-500 animate-spin" />
              ) : state === 'done' ? (
                <Check weight="bold" className="w-5 h-5 text-emerald-600" />
              ) : (
                <Icon weight="bold" className="w-5 h-5 text-zinc-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-800">
                {state === 'exporting' ? `Generating ${label}...` :
                 state === 'done' ? `${label} Ready` : label}
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">{description}</p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
