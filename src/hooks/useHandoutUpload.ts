import { useState, useCallback } from 'react';
import { useVttStore } from '../store';
import { uploadFileToStorage } from '../lib/supabase';
import type { Handout } from '../types';

interface UploadResult {
  success: boolean;
  handout?: Handout;
  error?: string;
}

export function useHandoutUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [errors, setErrors] = useState<string[]>([]);
  const addHandout = useVttStore(state => state.addHandout);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `"${file.name}" est trop volumineux (${(file.size / 1024 / 1024).toFixed(1)}MB, max 10MB)`;
    }
    const validTypes = ['image/*', 'application/pdf'];
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isImage && !isPdf) {
      return `"${file.name}" : format non supporté (images et PDF uniquement)`;
    }
    return null;
  }, []);

  const getCascadePosition = useCallback((handouts: Handout[]) => {
    const openHandouts = handouts.filter(h => h.isOpen);
    const offset = openHandouts.length * 30;
    const baseX = 50;
    const baseY = 50;
    return { x: baseX + offset, y: baseY + offset };
  }, []);

  const uploadSingle = useCallback(async (file: File, name?: string): Promise<UploadResult> => {
    const error = validateFile(file);
    if (error) return { success: false, error };

    try {
      const url = await uploadFileToStorage(file);
      if (!url) return { success: false, error: `Échec de l'upload de "${file.name}"` };

      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const handouts = useVttStore.getState().handouts;
      const pos = getCascadePosition(handouts);

      const handout: Omit<Handout, 'id'> = {
        name: name || file.name.split('.')[0],
        imageUrl: url,
        type: isPdf ? 'pdf' : 'image',
        isOpen: true,
        x: pos.x,
        y: pos.y,
        width: 400,
        height: 300,
        isMaximized: false,
        zIndex: handouts.length + 1,
      };

      addHandout(handout);
      return { success: true, handout: { id: '', ...handout } as Handout };
    } catch (e) {
      return { success: false, error: `Erreur lors de l'upload de "${file.name}"` };
    }
  }, [validateFile, getCascadePosition, addHandout]);

  const uploadFiles = useCallback(async (files: FileList | File[], names?: Record<string, string>) => {
    setIsUploading(true);
    setErrors([]);
    const fileArray = Array.isArray(files) ? files : Array.from(files);
    setUploadProgress({ current: 0, total: fileArray.length });

    const results: UploadResult[] = [];
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const name = names?.[file.name];
      const result = await uploadSingle(file, name);
      results.push(result);
      setUploadProgress({ current: i + 1, total: fileArray.length });
    }

    const successCount = results.filter(r => r.success).length;
    const failedResults = results.filter(r => !r.success);
    if (failedResults.length > 0) {
      setErrors(failedResults.map(r => r.error!).filter(Boolean));
    }

    setIsUploading(false);
    return { successCount, total: fileArray.length, errors: failedResults.map(r => r.error!).filter(Boolean) };
  }, [uploadSingle]);

  const clearErrors = useCallback(() => setErrors([]), []);

  return {
    isUploading,
    uploadProgress,
    errors,
    uploadFiles,
    clearErrors,
  };
}
