import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotePencil, CaretDown } from '@phosphor-icons/react';
import { useUploadStore } from '../../store/uploadStore';

const SUGGESTIONS = [
  { label: 'News Verification', value: 'Quick screening of news images for media authentication' },
  { label: 'Identity Review', value: 'Verify ID photos and profile images for identity fraud detection' },
  { label: 'Forensic Audit', value: 'Comprehensive forensic examination for legal evidence submission' },
  { label: 'Ad Content Check', value: 'Validate advertising material authenticity before campaign launch' },
];

export default function PurposeInput() {
  const [expanded, setExpanded] = useState(false);
  const purpose = useUploadStore((s) => s.detectionPurpose);
  const setPurpose = useUploadStore((s) => s.setDetectionPurpose);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="mt-1"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-base text-zinc-500 hover:text-zinc-700 transition-colors group"
      >
        <NotePencil weight="bold" className="w-5 h-5" />
        <span>Detection Context (optional)</span>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <CaretDown weight="bold" className="w-4 h-4" />
        </motion.span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => setPurpose(s.value)}
                    className={`
                      text-sm px-4 py-2 rounded-full border transition-all duration-200
                      ${purpose === s.value
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
                      }
                    `}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Describe your detection objective to help optimize the analysis strategy..."
                rows={2}
                className="w-full text-base px-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-700 placeholder:text-zinc-300 resize-none focus:outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-50 transition-all"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
