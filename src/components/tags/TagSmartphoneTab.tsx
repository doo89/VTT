import React, { useState } from 'react';
import * as icons from 'lucide-react';
import type { TagFormData, TagFormUpdate } from '../../types/tag-form';

interface Props {
  data: TagFormData;
  onUpdate: (updates: TagFormUpdate) => void;
  tags: { id: string; name: string }[];
  roles: { id: string; name: string }[];
  actions: { id: string; name: string }[];
  handouts: { id: string; name: string }[];
  isInstance?: boolean;
}

const RETURN_INFO_OPTIONS = [
  { key: 'none', label: 'Aucun' },
  { key: 'real_role', label: 'Rôle réel' },
  { key: 'real_team', label: 'Equipe réelle' },
  { key: 'seen_role', label: 'Vu comme rôle' },
  { key: 'seen_team', label: 'Vu dans l\'équipe' },
] as const;

export const TagSmartphoneTab: React.FC<Props> = React.memo(({ data, onUpdate, tags, roles, actions, handouts, isInstance }) => {
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  const ns = `${isInstance ? 'instance-' : ''}${data.id}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <icons.Smartphone size={16} className="text-blue-400" />
          Interface Smartphone
        </h4>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">Sélection de joueur(s) sur Smartphone</p>
          <div className="flex flex-col gap-2 bg-background/50 p-2 rounded-md border border-border">
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="radio"
                name={`playerSelectorMode-${ns}`}
                checked={!data.isMultiPlayerSelector && !data.isSinglePlayerSelector}
                onChange={() => onUpdate({ isMultiPlayerSelector: false, isSinglePlayerSelector: false })}
                className="w-4 h-4 text-primary"
              />
              Aucun (Action simple)
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="radio"
                name={`playerSelectorMode-${ns}`}
                checked={data.isSinglePlayerSelector || false}
                onChange={() => onUpdate({ isMultiPlayerSelector: false, isSinglePlayerSelector: true })}
                className="w-4 h-4 text-primary"
              />
              Sélecteur de joueur (le joueur choisit UN joueur)
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="radio"
                name={`playerSelectorMode-${ns}`}
                checked={data.isMultiPlayerSelector || false}
                onChange={() => onUpdate({ isMultiPlayerSelector: true, isSinglePlayerSelector: false })}
                className="w-4 h-4 text-primary"
              />
              Sélecteur multi-joueurs (le joueur choisit PLUSIEURS joueurs)
            </label>
          </div>

          {(data.isSinglePlayerSelector || data.isMultiPlayerSelector) && (
            <div className="flex flex-col gap-2 mt-2 p-3 bg-muted/20 border-l-2 border-primary/30 rounded-r-lg">
              <button
                onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                className="flex items-center justify-between w-full text-left"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Filtres du sélecteur</span>
                {isFiltersExpanded ? <icons.ChevronDown size={14} className="text-muted-foreground" /> : <icons.ChevronRight size={14} className="text-muted-foreground" />}
              </button>

              {isFiltersExpanded && (
                <div className="flex flex-col gap-3 mt-1 animate-in slide-in-from-top-1 duration-200">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer group">
                        <input type="checkbox" checked={data.smartphoneFilterAlive || false} onChange={e => onUpdate({ smartphoneFilterAlive: e.target.checked })} className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-ring" />
                        <span className="group-hover:text-primary transition-colors">Tous les joueurs vivants</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer group">
                        <input type="checkbox" checked={data.smartphoneFilterDead || false} onChange={e => onUpdate({ smartphoneFilterDead: e.target.checked })} className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-ring" />
                        <span className="group-hover:text-primary transition-colors">Tous les joueurs morts</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer group">
                        <input type="checkbox" checked={data.smartphoneFilterMyRole || false} onChange={e => onUpdate({ smartphoneFilterMyRole: e.target.checked })} className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-ring" />
                        <span className="group-hover:text-primary transition-colors">Tous les joueurs ayant mon rôle</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer group">
                        <input type="checkbox" checked={data.smartphoneFilterNotMe || false} onChange={e => onUpdate({ smartphoneFilterNotMe: e.target.checked })} className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-ring" />
                        <span className="group-hover:text-primary transition-colors">Sauf moi</span>
                      </label>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer group">
                        <input type="checkbox" checked={data.smartphoneFilterNotMyRole || false} onChange={e => onUpdate({ smartphoneFilterNotMyRole: e.target.checked })} className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-ring" />
                        <span className="group-hover:text-primary transition-colors">Sauf les joueurs ayant mon rôle</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer group">
                        <input type="checkbox" checked={data.smartphoneFilterMyTeam || false} onChange={e => onUpdate({ smartphoneFilterMyTeam: e.target.checked })} className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-ring" />
                        <span className="group-hover:text-primary transition-colors">Tous les joueurs de mon équipe</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer group">
                        <input type="checkbox" checked={data.smartphoneFilterNotMyTeam || false} onChange={e => onUpdate({ smartphoneFilterNotMyTeam: e.target.checked })} className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-ring" />
                        <span className="group-hover:text-primary transition-colors">Sauf les joueurs de mon équipe</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full pt-2 border-t border-border/10">
                    <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer group shrink-0">
                      <input type="checkbox" checked={data.smartphoneFilterNotThisTag || false} onChange={e => onUpdate({ smartphoneFilterNotThisTag: e.target.checked })} className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-ring" />
                      <span className="group-hover:text-primary transition-colors">Sauf les joueurs ayant ce tag :</span>
                    </label>
                    <label className="sr-only" htmlFor={`tag-exclude-filter-${ns}`}>Tag à exclure du filtre</label>
                    <select
                      id={`tag-exclude-filter-${ns}`}
                      value={data.smartphoneFilterExcludeTagId || ''}
                      onChange={e => onUpdate({ smartphoneFilterExcludeTagId: e.target.value || null })}
                      className="bg-background border border-border/80 rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-primary flex-1 min-h-[44px] text-foreground cursor-pointer hover:border-primary/50 transition-colors shadow-sm"
                      disabled={!data.smartphoneFilterNotThisTag}
                    >
                      <option value="">Sélectionner un tag...</option>
                      {[...tags].sort((a,b) => a.name.localeCompare(b.name)).map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-border/10">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Information à retourner</span>
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      {RETURN_INFO_OPTIONS.map(info => (
                        <label key={info.key} className="flex items-center gap-2 text-xs text-foreground cursor-pointer group">
                          <input
                            type="radio"
                            name={`returnInfo-${ns}`}
                            checked={(data.smartphoneReturnInfo || 'none') === info.key}
                            onChange={() => onUpdate({ smartphoneReturnInfo: info.key as any })}
                            className="w-3 h-3 text-primary"
                          />
                          <span className="group-hover:text-primary transition-colors">{info.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/10">
                    <label className="flex items-center gap-2 text-[11px] text-foreground cursor-pointer group shrink-0">
                      <input
                        type="checkbox"
                        checked={data.smartphoneIsCheckRoleEnabled || false}
                        onChange={e => onUpdate({ smartphoneIsCheckRoleEnabled: e.target.checked })}
                        className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-ring"
                      />
                      <span className="group-hover:text-primary transition-colors">A bien le rôle de :</span>
                    </label>
                    <label className="sr-only" htmlFor={`tag-role-check-${ns}`}>Rôle à vérifier</label>
                    <select
                      id={`tag-role-check-${ns}`}
                      value={data.smartphoneCheckRoleId || ''}
                      onChange={e => onUpdate({ smartphoneCheckRoleId: e.target.value || null })}
                      className="bg-background border border-border/80 rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-primary flex-1 min-h-[44px] text-foreground cursor-pointer hover:border-primary/50 transition-colors shadow-sm"
                      disabled={!data.smartphoneIsCheckRoleEnabled}
                    >
                      <option value="">Sélectionner un rôle...</option>
                      {[...roles].sort((a,b) => a.name.localeCompare(b.name)).map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  {(data.isMultiPlayerSelector || false) && data.smartphoneIsCheckRoleEnabled && (
                    <div className="flex items-center gap-4 mt-1 ml-6">
                      <label className="flex items-center gap-2 text-[10px] text-foreground cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={data.smartphoneCheckRoleVague || false}
                          onChange={e => onUpdate({ smartphoneCheckRoleVague: e.target.checked })}
                          className="w-3 h-3 rounded border-border text-primary focus:ring-ring"
                        />
                        <span className="group-hover:text-primary transition-colors">Réponse vague</span>
                      </label>
                      <label className="flex items-center gap-2 text-[10px] text-foreground cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={data.smartphoneCheckRoleCount || false}
                          onChange={e => onUpdate({ smartphoneCheckRoleCount: e.target.checked })}
                          className="w-3 h-3 rounded border-border text-primary focus:ring-ring"
                        />
                        <span className="group-hover:text-primary transition-colors">Combien</span>
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor={`tag-button-text-${ns}`}>Texte du bouton d'action</label>
          <div className="flex items-center gap-4">
            <input
              id={`tag-button-text-${ns}`}
              type="text"
              value={data.smartphoneButtonText || ''}
              onChange={(e) => onUpdate({ smartphoneButtonText: e.target.value })}
              placeholder="Ex: Utiliser la potion"
              className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring w-1/2 min-h-[44px]"
            />
            <label className="flex items-center gap-2 text-[11px] text-foreground cursor-pointer hover:text-primary transition-colors whitespace-nowrap">
              <input
                type="checkbox"
                checked={data.smartphoneShowPastille || false}
                onChange={(e) => onUpdate({ smartphoneShowPastille: e.target.checked })}
                className="rounded border-border w-3.5 h-3.5 text-primary"
              />
              Afficher la pastille tag au dessus du joueur
            </label>
          </div>
          {data.smartphoneButtonText && (
            <label className="flex items-center gap-2 text-[11px] text-foreground cursor-pointer mt-1 ml-1 hover:text-primary transition-colors">
              <input
                type="checkbox"
                checked={data.smartphoneAutoDelete || false}
                onChange={(e) => onUpdate({ smartphoneAutoDelete: e.target.checked })}
                className="rounded border-border w-3.5 h-3.5 text-primary"
              />
              Suppression automatique (efface le tag après clic)
            </label>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor={`tag-player-feedback-${ns}`}>Retour au smartphone (popup)</label>
          <input
            id={`tag-player-feedback-${ns}`}
            type="text"
            value={data.smartphonePlayerFeedback || ''}
            onChange={(e) => onUpdate({ smartphonePlayerFeedback: e.target.value })}
            placeholder="Ex: Action envoyée au MJ."
            className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring min-h-[44px]"
          />
          <p className="text-[10px] text-muted-foreground leading-tight">Ce message s'affiche en popup sur le smartphone du joueur quand il appuie sur le bouton.</p>
        </div>

        <div className="flex flex-col gap-1 mt-2">
          <label className="text-xs font-medium text-muted-foreground" htmlFor={`tag-mj-feedback-${ns}`}>Message retour au MJ (popup)</label>
          <input
            id={`tag-mj-feedback-${ns}`}
            type="text"
            value={data.smartphoneButtonFeedback || ''}
            onChange={(e) => onUpdate({ smartphoneButtonFeedback: e.target.value })}
            placeholder="Ex: La sorciere utilise sa potion de vie"
            className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring min-h-[44px]"
          />
          <p className="text-[10px] text-muted-foreground leading-tight">Ce message s'affiche en popup chez le MJ quand le joueur appuie sur le bouton.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground italic" htmlFor={`tag-merge-${ns}`}>Fusionner aux joueurs</label>
            <select
              id={`tag-merge-${ns}`}
              value={data.smartphoneMergeTagId || ''}
              onChange={(e) => onUpdate({ smartphoneMergeTagId: e.target.value || null })}
              className="bg-background border border-border/80 rounded-md px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground min-h-[44px] shadow-sm"
            >
              <option value="">-- Aucun --</option>
              {[...tags].filter(t => t.id !== data.id).sort((a,b) => a.name.localeCompare(b.name)).map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground italic" htmlFor={`tag-self-merge-${ns}`}>Me fusionner ce Tag</label>
            <select
              id={`tag-self-merge-${ns}`}
              value={data.smartphoneSelfMergeTagId || ''}
              onChange={(e) => onUpdate({ smartphoneSelfMergeTagId: e.target.value || null })}
              className="bg-background border border-border/80 rounded-md px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground min-h-[44px] shadow-sm"
            >
              <option value="">-- Aucun --</option>
              {[...tags].sort((a,b) => a.name.localeCompare(b.name)).map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1 mt-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground italic" htmlFor={`tag-action-${ns}`}>Déclencher une Action</label>
          <select
            id={`tag-action-${ns}`}
            value={data.smartphoneActionId || ''}
            onChange={(e) => onUpdate({ smartphoneActionId: e.target.value || null })}
            className="bg-background border border-border/80 rounded-md px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground min-h-[44px] shadow-sm"
          >
            <option value="">-- Aucune --</option>
            {[...actions].sort((a,b) => a.name.localeCompare(b.name)).map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 mt-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 italic flex items-center gap-2" htmlFor={`tag-handout-${ns}`}>
            <icons.BookOpen size={12} className="text-primary/50" />
            Associer une Aide de Jeu
          </label>
          <select
            id={`tag-handout-${ns}`}
            value={data.handoutId || ''}
            onChange={(e) => onUpdate({ handoutId: e.target.value || null })}
            className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Aucune (Optionnel)</option>
            {[...handouts].sort((a,b) => a.name.localeCompare(b.name)).map(h => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
          <p className="text-[10px] text-muted-foreground leading-tight mt-1 bg-primary/5 p-2 rounded border border-primary/10 italic">
            L'image de cette aide s'affichera dans une galerie sur le smartphone du joueur possédant ce tag.
          </p>
        </div>
      </div>
    </div>
  );
});
