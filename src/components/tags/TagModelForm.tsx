import React, { useState, useCallback } from 'react';
import { useVttStore } from '../../store';
import type { TagFormData, TagFormUpdate } from '../../types/tag-form';
import { TagFormContent } from './TagFormContent';

interface Props {
  tagId: string;
  onClose: () => void;
}

export const TagModelForm: React.FC<Props> = ({ tagId, onClose }) => {
  const { tags, tagCategories, roles, teams, actions, handouts, updateTagModel } = useVttStore();
  const originalTag = tags.find(t => t.id === tagId);
  const [formData, setFormData] = useState<TagFormData | null>(() => {
    const t = tags.find(tg => tg.id === tagId);
    return t || null;
  });
  const [isUploading, setIsUploading] = useState(false);

  if (!formData) return null;

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalTag);

  const tagsByCategory = React.useMemo(() => {
    const grouped: Record<string, typeof tags> = { 'no-category': [] };
    tagCategories.forEach(c => grouped[c.id] = []);
    tags.forEach(t => {
      if (t.categoryId && grouped[t.categoryId]) grouped[t.categoryId].push(t);
      else grouped['no-category'].push(t);
    });
    return grouped;
  }, [tags, tagCategories]);

  const handleUpdate = useCallback((updates: TagFormUpdate) => {
    setFormData(prev => prev ? { ...prev, ...updates } : prev);
  }, []);

  const handleImageFile = async (file: File, onUpdateCb: (url: string) => void) => {
    setIsUploading(true);
    try {
      const { uploadFileToStorage } = await import('../../lib/supabase');
      const supabaseUrl = await uploadFileToStorage(file);
      if (supabaseUrl) {
        onUpdateCb(supabaseUrl);
      } else {
        const fileToBase64 = (file: File): Promise<string> => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
          });
        };
        const base64 = await fileToBase64(file);
        onUpdateCb(base64);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = () => {
    if (formData.imageUrl) {
      import('../../lib/supabase').then(({ deleteFileFromStorage }) => {
        deleteFileFromStorage(formData.imageUrl!);
      });
    }
    setFormData(prev => prev ? { ...prev, imageUrl: undefined } : prev);
  };

  const handleApply = () => {
    if (hasChanges && formData) {
      updateTagModel(tagId, formData);
    }
    onClose();
  };

  return (
    <TagFormContent
      initialData={formData}
      onUpdate={handleUpdate}
      categories={tagCategories}
      roles={roles}
      teams={teams}
      tags={tags}
      actions={actions}
      handouts={handouts}
      handleImageFile={handleImageFile}
      tagsByCategory={tagsByCategory}
      tagCategories={tagCategories}
      showContainerTab
      onDeleteImage={handleDeleteImage}
      onApply={handleApply}
      onCancel={onClose}
      hasChanges={hasChanges}
      isUploading={isUploading}
    />
  );
};
