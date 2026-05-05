import { useRef } from 'react';
import { Plus } from '@phosphor-icons/react';
import { useUploadStore } from '../../store/uploadStore';
import ImagePreviewCard from './ImagePreviewCard';

export default function PreviewGrid() {
  const images = useUploadStore((s) => s.images);
  const addImages = useUploadStore((s) => s.addImages);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (images.length === 0) return null;

  const handleAddMore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addImages(Array.from(files));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <h3 className="text-base font-semibold text-zinc-800 tracking-tight">
            Selected Images
          </h3>
          <span className="text-sm text-zinc-400 bg-zinc-100 px-2.5 py-0.5 rounded-full font-medium">
            {images.length}
          </span>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-all"
        >
          <Plus weight="bold" className="w-4 h-4" />
          Add More
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/tiff,image/bmp"
          onChange={handleAddMore}
          className="hidden"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {images.map((image, i) => (
          <ImagePreviewCard key={image.id} image={image} index={i} />
        ))}
      </div>
    </div>
  );
}
