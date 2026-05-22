import React from 'react';
import { ColorPicker } from '../ColorPicker';
import * as icons from 'lucide-react';
import { TAG_ICONS } from '../../lib/icons';
import { Trash2, Loader2 } from 'lucide-react';
import type { TagFormData, TagFormUpdate } from '../../types/tag-form';

interface Props {
  data: TagFormData;
  onUpdate: (updates: TagFormUpdate) => void;
  handleImageFile: (file: File, onUpdate: (url: string) => void) => Promise<void>;
  onDeleteImage?: () => void;
  isUploading?: boolean;
}

export const TagAppearanceTab: React.FC<Props> = React.memo(({ data, onUpdate, handleImageFile, onDeleteImage, isUploading }) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Icône du tag</label>
        <div className="flex flex-wrap gap-1 bg-input border border-border rounded-md p-2 max-h-40 overflow-y-auto custom-scrollbar">
          {TAG_ICONS.map((iconName: string) => {
            const IconComponent = icons[iconName as keyof typeof icons];
            if (!IconComponent) return null;
            return (
              <button
                key={iconName}
                onClick={() => onUpdate({ icon: iconName })}
                className={`p-2.5 min-w-[44px] min-h-[44px] rounded-md transition-colors flex items-center justify-center ${
                   data.icon === iconName
                     ? 'bg-primary text-primary-foreground shadow-sm'
                     : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'
                 }`}
                title={iconName}
              >
                {React.createElement(IconComponent as any, { size: 20 })}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor={`tag-image-file-${data.id}`}>Image personnalisée</label>
        <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                id={`tag-image-file-${data.id}`}
                type="file"
                accept="image/*"
                disabled={isUploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    await handleImageFile(file, (url) => onUpdate({ imageUrl: url }));
                  }
                }}
                className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer disabled:opacity-50"
              />
              {isUploading && <Loader2 size={16} className="animate-spin text-primary" />}
            </div>
            <label className="sr-only" htmlFor={`tag-image-url-${data.id}`}>URL de l'image personnalisée</label>
            <input
              id={`tag-image-url-${data.id}`}
              type="text"
              value={data.imageUrl || ''}
              onChange={(e) => onUpdate({ imageUrl: e.target.value })}
              placeholder="Ou collez l'URL d'une image ici..."
              className="bg-input border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {data.imageUrl && (
            <div className="flex items-center gap-3 mt-1 pt-2 border-t border-border/30">
              <img src={data.imageUrl} alt="Preview" className="w-14 h-14 rounded-md object-cover border-2 border-primary/20 shadow-sm" />
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Aperçu</span>
                <button
                  onClick={() => onDeleteImage ? onDeleteImage() : onUpdate({ imageUrl: undefined })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 text-destructive hover:bg-destructive text-[11px] font-bold hover:text-destructive-foreground rounded-md transition-all shadow-sm"
                >
                  <Trash2 size={12} /> Supprimer l'image
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1 mt-2">
        <label className="text-sm font-medium">Couleur</label>
        <div className="flex items-center gap-3">
          <ColorPicker
            color={data.color}
            onChange={(c) => onUpdate({ color: c })}
            label="Couleur"
            className="!w-10 !h-10"
          />
        </div>
      </div>
    </div>
  );
});
