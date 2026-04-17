import React, { useState, useRef, useEffect } from 'react';
import { useVttStore } from '../store';
import { X, Check } from 'lucide-react';
import type { ActionEffectType } from '../types';

export const ActionEffectWindow: React.FC = () => {
  const { 
    actionEffectCreatorState, 
    setActionEffectCreatorState, 
    addPendingEffect,
    updatePendingEffect,
    pendingActionEffects
  } = useVttStore();
  
  const [type, setType] = useState<ActionEffectType>('deleteAllTags');
  const [enabled, setEnabled] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number, y: number, startX: number, startY: number } | null>(null);

  const isEditing = !!actionEffectCreatorState.editingEffectId;

  useEffect(() => {
    if (isEditing) {
      const effect = pendingActionEffects.find(e => e.id === actionEffectCreatorState.editingEffectId);
      if (effect) {
        setType(effect.type);
        setEnabled(effect.enabled);
      }
    } else {
      setType('deleteAllTags');
      setEnabled(true);
    }
  }, [isEditing, actionEffectCreatorState.editingEffectId, pendingActionEffects]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragStartRef.current) return;
      
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      
      setActionEffectCreatorState({
        x: dragStartRef.current.startX + dx,
        y: dragStartRef.current.startY + dy
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, setActionEffectCreatorState]);

  if (!actionEffectCreatorState.isOpen) return null;

  const handleClose = () => {
    setActionEffectCreatorState({ isOpen: false, editingEffectId: null });
  };

  const handleOK = () => {
    if (isEditing && actionEffectCreatorState.editingEffectId) {
      updatePendingEffect(actionEffectCreatorState.editingEffectId, { type, enabled });
    } else {
      addPendingEffect({ type, enabled });
    }
    handleClose();
  };

  return (
    <div 
      className={`fixed z-[3100] w-96 bg-card border-2 border-indigo-500/30 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 ${isDragging ? 'opacity-90' : ''}`}
      style={{
        left: actionEffectCreatorState.x,
        top: actionEffectCreatorState.y,
      }}
    >
      <div 
        className="px-4 py-3 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center justify-between cursor-move group select-none"
        onMouseDown={(e) => {
          setIsDragging(true);
          dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            startX: actionEffectCreatorState.x,
            startY: actionEffectCreatorState.y
          };
        }}
      >
        <div className="flex items-center gap-2 text-indigo-400">
          <span className="font-bold text-sm tracking-tight text-foreground uppercase">Ajouter une action</span>
        </div>
        <button 
          onClick={handleClose}
          onMouseDown={e => e.stopPropagation()}
          className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-full transition-all"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-5 flex flex-col gap-5 bg-background/50">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Type d'action</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm outline-none transition-all shadow-sm focus:border-indigo-500/50"
            >
              <option value="deleteAllTags">Supprimer tous les tags dans la salle</option>
              <option value="deleteAllPlayerTags">Supprimer tous les tags des joueurs</option>
              <option value="deleteSelectionPastilles">Supprimer les pastilles tags</option>
              <option value="nextPhase">Passer à la phase suivante</option>
              <option value="previousPhase">Revenir à la phase précédente</option>
              <option value="resetCycle">Réinitialiser le Cycle (Jour 1)</option>
              <option value="setCycleDayNight">Cycle : Jour/Nuit</option>
              <option value="setCycleTurn">Cycle : par Tour</option>
              <option value="setCycleNone">Cycle : Aucun</option>
              <option value="distributeRoles">Distribuer (Rôles)</option>
              <option value="showPlayerImage">Afficher l'image du joueur</option>
              <option value="hidePlayerImage">Cacher l'image du joueur</option>
              <option value="showRoleImage">Afficher l'image du Rôle</option>
              <option value="hideRoleImage">Cacher l'image du Rôle</option>
              <option value="popupPlayer">Popup $Joueur</option>
              <option value="showPlayerTooltip">Afficher l'info bulle des joueurs</option>
              <option value="hidePlayerTooltip">Masquer l'info bulle des joueurs</option>
              <option value="showTagTooltip">Afficher l'info bulle des tags</option>
              <option value="hideTagTooltip">Masquer l'info bulle des tags</option>
            </select>
          </div>

          <label className="flex items-center gap-3 p-3 bg-muted/20 border border-border rounded-lg cursor-pointer hover:bg-muted/40 transition-colors">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-5 h-5 rounded border-border text-indigo-500 focus:ring-indigo-500 transition-all"
            />
            <div className="flex flex-col">
              <span className="text-sm font-bold">Activer cette action</span>
              <span className="text-[10px] text-muted-foreground italic">Définit si cette action spécifique sera exécutée</span>
            </div>
          </label>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={handleClose}
            className="flex-1 py-2 px-4 bg-muted hover:bg-accent text-foreground text-xs font-bold rounded-lg transition-colors border border-border"
          >
            Annuler
          </button>
          <button
            onClick={handleOK}
            className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
          >
            <Check size={14} />
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
