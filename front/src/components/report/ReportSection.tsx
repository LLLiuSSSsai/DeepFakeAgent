import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X } from '@phosphor-icons/react';
import { useDetectionStore } from '../../store/detectionStore';
import ReportContent from './ReportContent';
import ExportButtons from './ExportButtons';

export default function ReportSection() {
  const reportExpanded = useDetectionStore((s) => s.reportExpanded);
  const setReportExpanded = useDetectionStore((s) => s.setReportExpanded);

  return (
    <>
      {/* Trigger button */}
      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        onClick={() => setReportExpanded(true)}
        className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-zinc-200/60 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all duration-300 group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-zinc-100 group-hover:bg-emerald-100 transition-colors">
            <FileText weight="fill" className="w-6 h-6 text-zinc-500 group-hover:text-emerald-600 transition-colors" />
          </div>
          <div className="text-left">
            <p className="text-base font-semibold text-zinc-800">Structured Report</p>
            <p className="text-sm text-zinc-400 mt-0.5">
              View complete evidence chain, agent breakdown, and export options
            </p>
          </div>
        </div>
        <span className="text-sm font-medium text-emerald-500 group-hover:translate-x-0.5 transition-transform">
          Open
        </span>
      </motion.button>

      {/* Fullscreen modal */}
      <AnimatePresence>
        {reportExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto"
            onClick={() => setReportExpanded(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-5xl my-8 mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Modal header */}
              <div className="sticky top-0 z-10 flex items-center justify-between p-5 bg-white/95 backdrop-blur-xl border-b border-zinc-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100">
                    <FileText weight="fill" className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-zinc-900">Structured Detection Report</h2>
                    <p className="text-sm text-zinc-400">Complete forensic evidence and export options</p>
                  </div>
                </div>
                <button
                  onClick={() => setReportExpanded(false)}
                  className="p-2 rounded-xl hover:bg-zinc-100 transition-colors"
                >
                  <X weight="bold" className="w-5 h-5 text-zinc-500" />
                </button>
              </div>

              {/* Modal body */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                {/* Report content - takes 2/3 */}
                <div className="lg:col-span-2 border-r border-zinc-100">
                  <ReportContent />
                </div>

                {/* Export panel - takes 1/3 */}
                <div className="p-5">
                  <p className="text-sm font-semibold text-zinc-700 mb-4">Export Report</p>
                  <ExportButtons />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
