import { create } from 'zustand';
import type { UploadedImage, DetectionMode } from '../utils/types';

interface UploadState {
  images: UploadedImage[];
  detectionMode: DetectionMode;
  detectionPurpose: string;
  addImages: (files: File[]) => void;
  removeImage: (id: string) => void;
  clearImages: () => void;
  setImageStatus: (id: string, status: UploadedImage['status'], errorMessage?: string) => void;
  setDetectionMode: (mode: DetectionMode) => void;
  setDetectionPurpose: (purpose: string) => void;
}

let idCounter = 0;

export const useUploadStore = create<UploadState>((set) => ({
  images: [],
  detectionMode: 'deep',
  detectionPurpose: '',

  addImages: (files) =>
    set((state) => {
      const newImages: UploadedImage[] = files.map((file) => ({
        id: `img-${++idCounter}`,
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        status: 'pending' as const,
      }));
      return { images: [...state.images, ...newImages].slice(0, 100) };
    }),

  removeImage: (id) =>
    set((state) => ({
      images: state.images.filter((img) => {
        if (img.id === id) URL.revokeObjectURL(img.previewUrl);
        return img.id !== id;
      }),
    })),

  clearImages: () =>
    set((state) => {
      state.images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      return { images: [] };
    }),

  setImageStatus: (id, status, errorMessage) =>
    set((state) => ({
      images: state.images.map((img) =>
        img.id === id ? { ...img, status, errorMessage } : img
      ),
    })),

  setDetectionMode: (mode) => set({ detectionMode: mode }),
  setDetectionPurpose: (purpose) => set({ detectionPurpose: purpose }),
}));
