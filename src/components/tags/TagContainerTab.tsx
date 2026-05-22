import React, { useState } from 'react';
import * as icons from 'lucide-react';
import type { TagFormData, TagFormUpdate } from '../../types/tag-form';

interface Props {
  data: TagFormData;
  onUpdate: (updates: TagFormUpdate) => void;
  tagsByCategory: Record<string, Array<{ id: string; name: string; color: string; icon: string }>>;
  tagCategories: { id: string; name: string; icon: string; color: string }[];
  isInstance?: boolean;
}

export const TagContainerTab: React.FC<Props> = React.memo(({ data, onUpdate, tagsByCategory, tagCategories, isInstance }) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const handleToggleCat = (catId: string) => {
    setExpandedCategories(prev => ({ ...prev, [catId]: !(prev[catId] ?? true) }));
  };

  const renderTagList = (catTags: Array<{ id: string; name: string; color: string }>) => (
    <div className="flex flex-col gap-1 p-2 bg-background/50 border-t border-border">
      {catTags.map(otherTag => (
        <label key={otherTag.id} className="flex items-center gap-3 p-2 hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={data.childTagIds?.includes(otherTag.id) || false}
            onChange={(e) => {
              const currentList = data.childTagIds || [];
              const newList = e.target.checked
                ? [...currentList, otherTag.id]
                : currentList.filter((id: string) => id !== otherTag.id);
              onUpdate({ childTagIds: newList });
            }}
            className="rounded border-border w-4 h-4"
          />
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: otherTag.color }} />
          <span className="text-sm font-medium flex-1">{otherTag.name}</span>
        </label>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground mb-2">
        Ce tag peut servir de "Container". Lorsqu'il est appliqué à un joueur, tous les tags sélectionnés ici seront appliqués en même temps avec lui.
        {isInstance && (
          <span className="block mt-1 text-[11px] text-amber-600 font-medium">
            Note : Ces modifications s'appliquent à cette instance uniquement, pas au modèle du tag.
          </span>
        )}
      </p>
      <div className="flex flex-col gap-2">
        {tagCategories.map(cat => {
          const catTags = tagsByCategory[cat.id]?.filter(t => t.id !== data.id);
          if (!catTags || catTags.length === 0) return null;

          const CatIcon = icons[cat.icon as keyof typeof icons] || icons.Folder;
          const isExpanded = expandedCategories[cat.id] ?? true;

          return (
            <div key={cat.id} className="flex flex-col bg-card border border-border rounded-md overflow-hidden">
              <button
                onClick={() => handleToggleCat(cat.id)}
                className="flex items-center justify-between bg-muted/50 hover:bg-muted p-2 min-h-[44px] transition-colors w-full text-left"
              >
                <div className="flex items-center gap-2 flex-1">
                  <div className="p-1 rounded bg-background shadow-sm" style={{ color: cat.color }}>
                    {React.createElement(CatIcon as any, { size: 14 })}
                  </div>
                  <span className="font-semibold text-sm flex-1">{cat.name}</span>
                  <span className="text-xs text-muted-foreground bg-background px-1.5 rounded-full border border-border">
                    {catTags.length}
                  </span>
                </div>
                {isExpanded ? <icons.ChevronDown size={14} className="text-muted-foreground" /> : <icons.ChevronRight size={14} className="text-muted-foreground" />}
              </button>

              {isExpanded && renderTagList(catTags)}
            </div>
          );
        })}

        {/* Uncategorized Tags */}
        {(() => {
          const noCatTags = tagsByCategory['no-category']?.filter(t => t.id !== data.id);
          if (!noCatTags || noCatTags.length === 0) return null;

          const isExpanded = expandedCategories['no-category'] ?? true;

          return (
            <div className="flex flex-col bg-card border border-border rounded-md overflow-hidden">
              <button
                onClick={() => handleToggleCat('no-category')}
                className="flex items-center justify-between bg-muted/50 hover:bg-muted p-2 min-h-[44px] transition-colors w-full text-left"
              >
                <div className="flex items-center gap-2 flex-1">
                  <div className="p-1 rounded bg-background shadow-sm text-muted-foreground">
                    <icons.Folder size={14} />
                  </div>
                  <span className="font-semibold text-sm flex-1 text-muted-foreground italic">Sans catégorie</span>
                  <span className="text-xs text-muted-foreground bg-background px-1.5 rounded-full border border-border">
                    {noCatTags.length}
                  </span>
                </div>
                {isExpanded ? <icons.ChevronDown size={14} className="text-muted-foreground" /> : <icons.ChevronRight size={14} className="text-muted-foreground" />}
              </button>

              {isExpanded && renderTagList(noCatTags)}
            </div>
          );
        })()}

        {(() => {
          const allOtherTags = Object.values(tagsByCategory).flat().filter(t => t.id !== data.id);
          return allOtherTags.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">Aucun autre tag disponible</div>
          );
        })()}
      </div>
    </div>
  );
});
