import { useCallback, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { motion } from 'framer-motion';
import { ImageSquare, Upload, WarningCircle, X } from '@phosphor-icons/react';
import { useUploadStore } from '../../store/uploadStore';

const MAX_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 100;
const ACCEPTED_FORMATS = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/tiff': ['.tif', '.tiff'],
  'image/bmp': ['.bmp'],
};

export default function UploadZone() {
  const [error, setError] = useState<string | null>(null);
  const addImages = useUploadStore((s) => s.addImages);
  const images = useUploadStore((s) => s.images);

  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      setError(null);
      if (rejected.length > 0) {
        const err = rejected[0].errors[0];
        if (err?.code === 'file-too-large') {
          setError('File exceeds 10MB limit. Please compress or choose a smaller image.');
        } else if (err?.code === 'file-invalid-type') {
          setError('Unsupported format. Please upload JPG, PNG, WebP, TIFF, or BMP files.');
        } else {
          setError(err?.message || 'Upload failed. Please try again.');
        }
        return;
      }
      if (images.length + accepted.length > MAX_FILES) {
        setError(`Maximum ${MAX_FILES} images per batch. You already have ${images.length} selected.`);
        return;
      }
      addImages(accepted);
    },
    [addImages, images.length]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FORMATS,
    maxSize: MAX_SIZE,
    maxFiles: MAX_FILES,
  });

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          {...getRootProps()}
          className={`
            relative w-full rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
            ${isDragActive
              ? 'border-emerald-400 bg-emerald-50/50'
              : 'border-zinc-300 bg-white hover:border-zinc-400 hover:bg-zinc-50/50'
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            {isDragActive ? (
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="w-20 h-20 rounded-2xl bg-emerald-100 flex items-center justify-center">
                  <Upload weight="fill" className="w-10 h-10 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-emerald-600">Drop images here</p>
                  <p className="text-base text-emerald-500/70 mt-1">Release to upload</p>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-zinc-100 flex items-center justify-center">
                  <ImageSquare weight="duotone" className="w-10 h-10 text-zinc-400" />
                </div>
                <div>
                  <p className="text-xl font-medium text-zinc-700">
                    Drag and drop images, or <span className="text-emerald-500 underline decoration-emerald-300 underline-offset-2">browse files</span>
                  </p>
                  <p className="text-base text-zinc-400 mt-1">
                    JPG, PNG, WebP, TIFF, BMP — Up to 10MB each, 100 per batch
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-start gap-2.5 p-4 rounded-xl bg-red-50 border border-red-200"
        >
          <WarningCircle weight="fill" className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="p-1 rounded hover:bg-red-100 transition-colors">
            <X weight="bold" className="w-4 h-4 text-red-400" />
          </button>
        </motion.div>
      )}

    </div>
  );
}
