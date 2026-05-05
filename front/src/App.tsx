import { motion, AnimatePresence } from 'framer-motion';
import { Play } from '@phosphor-icons/react';
import Navbar from './components/layout/Navbar';
import Container from './components/layout/Container';
import UploadZone from './components/upload/UploadZone';
import PreviewGrid from './components/upload/PreviewGrid';
import DetectionModeSelector from './components/upload/DetectionModeSelector';
import PurposeInput from './components/upload/PurposeInput';
import DetectionProgress from './components/detection/DetectionProgress';
import StepList from './components/detection/StepList';
import AgentSignalPreview from './components/detection/AgentSignalPreview';
import ResultDashboard from './components/results/ResultDashboard';
import { useUploadStore } from './store/uploadStore';
import { useDetectionStore } from './store/detectionStore';

function UploadPhase() {
  const images = useUploadStore((s) => s.images);
  const startDetection = useDetectionStore((s) => s.startDetection);

  const handleStart = () => {
    if (images.length > 0) {
      startDetection(images[0].id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="pt-6 pb-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-sm font-medium text-emerald-700 mb-4">
            AI-Powered Analysis Engine
          </div>
          <h1 className="text-4xl md:text-5xl tracking-tighter leading-none font-bold text-zinc-900">
            Image Forgery
            <br />
            <span className="text-emerald-500">Detection Agent</span>
          </h1>
          <p className="text-base text-zinc-500 mt-3 max-w-xl leading-relaxed">
            Multi-agent orchestration pipeline combining frequency analysis, noise consistency,
            semantic verification, and deep feature extraction for robust deepfake detection.
          </p>
        </motion.div>
      </div>

      {/* Detection mode - full width above upload */}
      <div className="mt-4">
        <DetectionModeSelector />
      </div>

      {/* Upload zone or preview */}
      <div className="mt-4">
        {images.length === 0 ? (
          <UploadZone />
        ) : (
          <PreviewGrid />
        )}
      </div>

      {/* Purpose input */}
      <div className="mt-3">
        <PurposeInput />
      </div>

      {/* Start button */}
      {images.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mt-6 flex justify-end"
        >
          <motion.button
            onClick={handleStart}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-8 py-4 rounded-xl bg-emerald-500 text-white font-semibold text-base shadow-[0_4px_16px_rgba(16,185,129,0.25)] hover:shadow-[0_8px_24px_rgba(16,185,129,0.35)] transition-shadow duration-300"
          >
            <Play weight="fill" className="w-5 h-5" />
            Start Detection
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}

function DetectingPhase() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="pt-8"
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
            Detection in Progress
          </h2>
          <p className="text-base text-zinc-500 mt-2">
            Multi-agent analysis pipeline is processing your image through 5 specialized detectors.
          </p>
        </motion.div>

        <div className="mt-6">
          <DetectionProgress />
        </div>

        <div className="mt-4">
          <AgentSignalPreview />
        </div>

        <div className="mt-2">
          <StepList />
        </div>
      </div>
    </motion.div>
  );
}

export default function App() {
  const phase = useDetectionStore((s) => s.phase);

  return (
    <div className="min-h-[100dvh] bg-zinc-50 font-sans">
      <Navbar />
      <main className="pt-16 pb-12">
        <Container>
          <AnimatePresence mode="wait">
            {phase === 'upload' && <UploadPhase key="upload" />}
            {phase === 'detecting' && <DetectingPhase key="detecting" />}
            {phase === 'results' && <ResultDashboard key="results" />}
          </AnimatePresence>
        </Container>
      </main>
    </div>
  );
}
