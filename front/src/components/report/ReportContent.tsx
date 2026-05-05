import { motion } from 'framer-motion';
import { useDetectionStore } from '../../store/detectionStore';

function renderMarkdown(md: string): string {
  let html = md
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-zinc-800">$1</strong>')
    .replace(/^### (.+)$/gm, '<h4 class="text-base font-semibold text-zinc-700 mt-5 mb-2">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="text-lg font-bold text-zinc-800 mt-6 mb-3">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 class="text-xl font-bold text-zinc-900 mt-6 mb-3">$1</h2>')
    .replace(/^---$/gm, '<hr class="my-4 border-zinc-200" />')
    .replace(/^- (.+)$/gm, '<li class="text-sm text-zinc-600 ml-4 list-disc">$1</li>')
    .replace(/\n\n/g, '</p><p class="text-sm text-zinc-600 leading-relaxed my-2">')
    .replace(/\n/g, '<br />');

  html = '<p class="text-sm text-zinc-600 leading-relaxed my-2">' + html + '</p>';
  return html;
}

export default function ReportContent() {
  const result = useDetectionStore((s) => s.result);

  if (!result) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-6"
    >
      <div
        className="prose prose-base max-w-none"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(result.reportMarkdown) }}
      />

      <div className={`mt-6 p-5 rounded-2xl border ${
        result.riskScore > 60
          ? 'bg-red-50 border-red-200'
          : result.riskScore > 30
          ? 'bg-amber-50 border-amber-200'
          : 'bg-emerald-50 border-emerald-200'
      }`}>
        <p className="text-base font-semibold text-zinc-800 mb-1">
          Manual Review: {result.riskScore > 60 ? 'HIGH PRIORITY' : result.riskScore > 30 ? 'MODERATE' : 'LOW RISK'}
        </p>
        <p className="text-sm text-zinc-600">
          {result.riskScore > 60
            ? 'Elevated risk score with multiple corroborating anomalies. Full manual review is strongly recommended before making any determinations.'
            : result.riskScore > 30
            ? 'Some anomalous indicators detected. Consider spot-checking the flagged regions for additional verification.'
            : 'No significant anomalies detected. Results are likely reliable without additional review.'
          }
        </p>
      </div>
    </motion.div>
  );
}
