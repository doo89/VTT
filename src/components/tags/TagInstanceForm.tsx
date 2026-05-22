import React, { useState, useMemo, useCallback } from 'react';
import { useVttStore } from '../../store';
import type { TagFormData, TagFormUpdate } from '../../types/tag-form';
import { TagFormContent } from './TagFormContent';

interface Props {
  instanceId: string;
  parentId?: string;
  onClose: () => void;
}

export const TagInstanceForm: React.FC<Props> = ({ instanceId, parentId, onClose }) => {
  const { players, markers, tagCategories, roles, teams, tags, actions, handouts, updatePlayer, updateMarker } = useVttStore();

  const snapshot = useMemo(() => {
    if (parentId) {
      const player = players.find(p => p.id === parentId);
      if (!player) return null;
      const tag = player.tags.find(t => t.instanceId === instanceId);
      if (!tag) return null;
      return { instanceTag: tag, player };
    } else {
      const marker = markers.find((m: any) => m.tag.instanceId === instanceId);
      if (!marker) return null;
      return { instanceTag: marker.tag, marker };
    }
  }, [instanceId, parentId, players, markers]);

  const [formData, setFormData] = useState<TagFormData | null>(() => {
    if (parentId) {
      const player = players.find(p => p.id === parentId);
      if (!player) return null;
      const tag = player.tags.find(t => t.instanceId === instanceId);
      return tag || null;
    } else {
      const marker = markers.find((m: any) => m.tag.instanceId === instanceId);
      return marker?.tag || null;
    }
  });
  const [isUploading, setIsUploading] = useState(false);

  if (!formData || !snapshot) return null;

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(snapshot.instanceTag);

  const tagsByCategory = useMemo(() => {
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

  const handleApply = () => {
    if (!hasChanges) { onClose(); return; }
    if (parentId) {
      const player = players.find(p => p.id === parentId);
      if (player) {
        const newTags = player.tags.map(t =>
          t.instanceId === instanceId ? { ...t, ...formData } : t
        );
        updatePlayer(player.id, { tags: newTags });
      }
    } else {
      const marker = markers.find((m: any) => m.tag.instanceId === instanceId);
      if (marker) {
        updateMarker(marker.id, { tag: { ...marker.tag, ...formData } });
      }
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
      isInstance
      onApply={handleApply}
      onCancel={onClose}
      hasChanges={hasChanges}
      isUploading={isUploading}
    />
  );
};
