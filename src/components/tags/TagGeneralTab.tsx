import React from 'react';
import type { TagFormData, TagFormUpdate } from '../../types/tag-form';

interface Props {
  data: TagFormData;
  onUpdate: (updates: TagFormUpdate) => void;
  categories: { id: string; name: string; color: string }[];
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">{children}</h4>
  );
}

export const TagGeneralTab: React.FC<Props> = React.memo(({ data, onUpdate, categories }) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor={`tag-name-${data.id}`}>Nom</label>
        <input
          id={`tag-name-${data.id}`}
          type="text"
          value={data.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring min-h-[44px]"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor={`tag-category-${data.id}`}>Catégorie</label>
        <select
          id={`tag-category-${data.id}`}
          value={data.categoryId || ''}
          onChange={(e) => onUpdate({ categoryId: e.target.value || null })}
          className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring min-h-[44px]"
        >
          <option value="">Sans catégorie</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Visibility Section */}
      <div className="bg-muted/20 rounded-lg p-3 border border-border/40">
        <SectionTitle>Visibilité Info-bulle &amp; Plateau</SectionTitle>
        <div className="flex flex-col gap-2">
          <CheckboxRow checked={data.showInTooltip !== false} onChange={(v) => onUpdate({ showInTooltip: v })}>
            Visible dans l'info-bulle (au survol du joueur)
          </CheckboxRow>
          <CheckboxRow checked={data.showPastille || false} onChange={(v) => onUpdate({ showPastille: v })}>
            Afficher la pastille (au dessus du joueur)
          </CheckboxRow>
        </div>
      </div>

      <div className="bg-muted/20 rounded-lg p-3 border border-border/40">
        <SectionTitle>Visibilité Écrans de Jeu</SectionTitle>
        <div className="flex flex-col gap-2">
          <CheckboxRow checked={data.showInGameTab !== false} onChange={(v) => onUpdate({ showInGameTab: v })}>
            Visible dans l'onglet Jeu (sous le joueur)
          </CheckboxRow>
          <CheckboxRow checked={data.visibleInWiki || false} onChange={(v) => onUpdate({ visibleInWiki: v })}>
            Visible dans le WIKI
          </CheckboxRow>
        </div>
      </div>

      <div className="bg-muted/20 rounded-lg p-3 border border-border/40">
        <SectionTitle>Visibilité Smartphone</SectionTitle>
        <div className="flex flex-col gap-2">
          <CheckboxRow checked={data.showOnSmartphone || false} onChange={(v) => onUpdate({ showOnSmartphone: v })}>
            Visible sur smartphone (version joueur)
          </CheckboxRow>
        </div>
      </div>

      {/* Secret Section */}
      <div className="bg-destructive/5 rounded-lg p-3 border border-destructive/20">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <label className="flex items-center gap-2 text-sm text-destructive font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={data.isSecret || false}
                onChange={(e) => onUpdate({ isSecret: e.target.checked })}
                className="rounded border-destructive w-4 h-4 text-destructive focus:ring-destructive"
              />
              Tag Secret
            </label>
            <p className="text-[10px] text-muted-foreground ml-6 mt-1">
              Invisible pour les joueurs, même si les options ci-dessus sont cochées.
            </p>
          </div>
          {data.isSecret && (
            <span className="text-[9px] font-bold uppercase tracking-widest text-destructive/60 bg-destructive/10 px-2 py-1 rounded shrink-0">
              Masqué
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

function CheckboxRow({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-3 text-sm text-foreground cursor-pointer hover:bg-accent/30 rounded-md px-1 -mx-1 py-2 transition-colors min-h-[44px]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-border w-4 h-4 shrink-0"
      />
      <span>{children}</span>
    </label>
  );
}
