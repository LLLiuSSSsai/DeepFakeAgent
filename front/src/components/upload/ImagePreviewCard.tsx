import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowsOut, Check, Spinner } from '@phosphor-icons/react';
import type { UploadedImage } from '../../utils/types';
import { useUploadStore } from '../../store/uploadStore';

interface ImagePreviewCardProps {
  image: UploadedImage;
  index: number;
}

export default function ImagePreviewCard({ image, index }: ImagePreviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const removeImage = useUploadStore((s) => s.removeImage);

  const sizeLabel =
    image.size > 1024 * 1024
      ? `${(image.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(image.size / 1024).toFixed(0)} KB`;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="group relative rounded-xl overflow-hidden bg-white border border-zinc-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-shadow duration-300"
      >
        {/* Thumbnail */}
        <div className="relative aspect-[4/3] bg-zinc-100 overflow-hidden">
          <img
            src={image.previewUrl}
            alt={image.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />

          {/* Status badge */}
          {image.status === 'detecting' && (
            <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-amber-500/90 backdrop-blur-sm text-[10px] font-medium text-white flex items-center gap-1.5">
              <Spinner weight="bold" className="w-3 h-3 animate-spin" />
              Detecting
            </div>
          )}
          {image.status === 'completed' && (
            <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-emerald-500/90 backdrop-blur-sm text-[10px] font-medium text-white flex items-center gap-1.5">
              <Check weight="bold" className="w-3 h-3" />
              Done
            </div>
          )}
          {image.status === 'error' && (
            <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-red-500/90 backdrop-blur-sm text-[10px] font-medium text-white">
              Failed
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
            <button
              onClick={() => setExpanded(true)}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white"
            >
              <ArrowsOut weight="bold" className="w-4 h-4 text-zinc-700" />
            </button>
          </div>

          {/* Remove button */}
          <button
            onClick={() => removeImage(image.id)}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-red-50 hover:text-red-500 text-zinc-500"
          >
            <X weight="bold" className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-sm font-medium text-zinc-700 truncate" title={image.name}>
            {image.name}
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">{sizeLabel}</p>
        </div>

        {image.errorMessage && (
          <div className="px-3 pb-2">
            <p className="text-[10px] text-red-500 truncate">{image.errorMessage}</p>
          </div>
        )}
      </motion.div>

      {/* Expanded modal */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-8"
            onClick={() => setExpanded(false)}
          >
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              src={image.previewUrl}
              alt={image.name}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setExpanded(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
            >
              <X weight="bold" className="w-5 h-5 text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
