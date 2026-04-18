import React, { useState, useRef, useEffect } from 'react';
import { useVttStore } from '../store';
import { X, Zap, Save, Plus, Edit2, Trash2, Check, Timer } from 'lucide-react';

export const ActionCreatorWindow: React.FC = () => {
  const { 
    actionCreatorState, 
    setActionCreatorState, 
    addAction,
    updateAction,
    actions,
    setActionConditionCreatorState,
    pendingActionConditions,
    clearPendingConditions,
    updatePendingCondition,
    deletePendingCondition,
    pendingActionOnce,
    setPendingOnce,
    pendingActionIsRecurring,
    pendingActionIntervalSeconds,
    pendingActionRepeatCount,
    setPendingRecurring,
    pendingActionEnabled,
    setPendingActionEnabled,
    setActionEffectCreatorState,
    pendingActionEffects,
    clearPendingEffects,
    deletePendingEffect,
    roles,
    tags
  } = useVttStore();
  
  const [actionName, setActionName] = useState('');
  const isEditingAction = !!actionCreatorState.editingActionId;

  useEffect(() => {
    if (isEditingAction) {
      const action = actions.find(a => a.id === actionCreatorState.editingActionId);
      if (action) {
        setActionName(action.name);
        setPendingOnce(action.once || false);
        setPendingRecurring(action.isRecurring || false, action.intervalSeconds || 5, action.repeatCount || 2);
        setPendingActionEnabled(action.enabled !== false);
      }
    }
  }, [isEditingAction, actionCreatorState.editingActionId, actions]);

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number, y: number, startX: number, startY: number } | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragStartRef.current) return;
      
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      
      setActionCreatorState({
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
  }, [isDragging, setActionCreatorState]);

  if (!actionCreatorState.isOpen || !actionCreatorState.isDetached) return null;

  const handleClose = () => {
    setActionCreatorState({ isOpen: false, editingActionId: null });
    setActionConditionCreatorState({ isOpen: false, editingConditionId: null });
    setActionEffectCreatorState({ isOpen: false, editingEffectId: null });
    setActionName('');
    setPendingActionEnabled(true);
    clearPendingConditions();
    clearPendingEffects();
  };

  const handleSave = () => {
    if (!actionName.trim()) return;
    const actionData = { 
      name: actionName,
      conditions: [...pendingActionConditions],
      effects: [...pendingActionEffects],
      once: pendingActionOnce,
      isRecurring: pendingActionIsRecurring,
      intervalSeconds: pendingActionIntervalSeconds,
      repeatCount: pendingActionRepeatCount,
      enabled: pendingActionEnabled
    };

    if (isEditingAction && actionCreatorState.editingActionId) {
      updateAction(actionCreatorState.editingActionId, actionData);
    } else {
      addAction(actionData);
    }
    handleClose();
  };

  return (
    <div 
      className={`fixed z-[3000] w-80 bg-card border-2 border-primary/30 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 ${isDragging ? 'opacity-90' : ''}`}
      style={{
        left: actionCreatorState.x,
        top: actionCreatorState.y,
      }}
    >
      <div 
        className="px-4 py-3 bg-primary/10 border-b border-primary/20 flex items-center justify-between cursor-move group select-none"
        onMouseDown={(e) => {
          setIsDragging(true);
          dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            startX: actionCreatorState.x,
            startY: actionCreatorState.y
          };
        }}
      >
        <div className="flex items-center gap-2">
          <Zap size={18} className="text-primary animate-pulse" />
          <span className="font-bold text-sm tracking-tight text-foreground">
            {isEditingAction ? 'Modifier l\'action' : 'Ajouter Action'}
          </span>
        </div>
        <button 
          onClick={handleClose}
          onMouseDown={e => e.stopPropagation()}
          className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-full transition-all"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Nom de l'action</label>
          <input
            autoFocus
            type="text"
            value={actionName}
            onChange={(e) => setActionName(e.target.value)}
            placeholder="Ex: Utiliser un sort, Ouvrir coffre..."
            className="w-full bg-input border-2 border-border focus:border-primary/50 rounded-lg px-3 py-2 text-sm outline-none transition-all shadow-inner"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && actionName.trim()) handleSave();
              if (e.key === 'Escape') handleClose();
            }}
          />
        </div>

        <div className="flex items-center justify-between bg-zinc-800/10 p-2.5 rounded-lg border border-border/20">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-foreground">Action active</span>
            <span className="text-[10px] text-muted-foreground">Désactiver pour griser le bouton dans les outils</span>
          </div>
          <input
            type="checkbox"
            checked={pendingActionEnabled}
            onChange={(e) => setPendingActionEnabled(e.target.checked)}
            className="w-5 h-5 rounded border-border text-primary focus:ring-primary transition-all cursor-pointer"
          />
        </div>

        {/* Conditions Section */}
        <div className="flex flex-col gap-3 pt-1">
          <div className="flex items-center justify-between px-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Conditions</label>
            <button
              onClick={() => setActionConditionCreatorState({ isOpen: true })}
              className="group flex gap-1.5 items-center text-[10px] font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-tight"
            >
              <Plus size={12} className="group-hover:rotate-90 transition-transform duration-200" />
              Ajouter une condition
            </button>
          </div>

          <div className="flex flex-col gap-1.5 min-h-[40px] max-h-[220px] overflow-y-auto custom-scrollbar bg-muted/20 border border-border/50 rounded-lg p-2">
            {!pendingActionOnce && !pendingActionIsRecurring && pendingActionConditions.length === 0 && (
              <p className="text-[10px] text-muted-foreground italic text-center py-2">Aucune condition définie.</p>
            )}

            {pendingActionOnce && (
              <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded p-1.5 text-[10px] font-bold text-orange-600 animate-in slide-in-from-left-2 duration-200">
                <Check size={12} className="shrink-0" />
                <span className="truncate">Une seule fois</span>
              </div>
            )}

            {pendingActionIsRecurring && (
              <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded p-1.5 text-[10px] font-bold text-indigo-600 animate-in slide-in-from-left-2 duration-200">
                <Timer size={12} className="shrink-0" />
                <span className="truncate">Exécuter toutes les {pendingActionIntervalSeconds}s ({pendingActionRepeatCount} fois)</span>
              </div>
            )}

            {pendingActionConditions.map((condition, index) => (
              <React.Fragment key={condition.id}>
                {index > 0 && (
                  <div className="flex justify-center -my-1 relative z-10">
                    <select
                      value={condition.logic || 'AND'}
                      onChange={(e) => updatePendingCondition(condition.id, { logic: e.target.value as 'AND' | 'OR' })}
                      className="bg-card border border-border rounded px-1 py-0.5 text-[9px] font-bold uppercase cursor-pointer hover:border-primary transition-colors outline-none shadow-sm"
                    >
                      <option value="AND">Et</option>
                      <option value="OR">Ou</option>
                    </select>
                  </div>
                )}
                <div key={condition.id} className={`flex items-center justify-between gap-2 bg-background border border-border/50 rounded p-1.5 shadow-sm text-[10px] font-medium animate-in slide-in-from-left-2 duration-200 ${!condition.enabled ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-2">
                    {!condition.enabled ? (
                      <span className="italic text-muted-foreground">Aucune</span>
                    ) : (
                      <>
                        <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase font-bold text-[9px]">
                          {condition.type === 'playerRole' || condition.type === 'playerTag' || condition.type === 'playerPastille' ? `Joueur ${condition.value}` : 
                           condition.type === 'day' ? 'Jour' : 
                           condition.type === 'night' ? 'Nuit' : 
                           condition.type === 'turn' ? 'Tour' :
                           condition.type === 'playerDistance' || condition.type === 'playerDistanceTag' || condition.type === 'playerDistancePastille' ? 'Distance' :
                           'Sélection'}
                        </span>
                        <span className="font-mono font-bold text-muted-foreground">{condition.type === 'playerDistance' ? '' : condition.operator}</span>
                        <span className="font-bold">
                          {condition.type === 'playerRole' ? (roles.find(r => r.id === condition.roleId)?.name || 'Inconnu') : 
                            condition.type === 'playerTag' ? (tags.find((t: any) => t.id === condition.tagId)?.name || 'Inconnu') :
                            condition.type === 'playerPastille' ? (condition.pastilleIcon || 'Icon') :
                            condition.type === 'playerSelection' || condition.type === 'playerSelectionRole' || condition.type === 'playerSelectionTag' || condition.type === 'playerSelectionPastille' ? (
                              `${condition.selectionType === 'first' ? '1er' : condition.selectionType === 'last' ? 'Dernier' : 'Tous'} : ${
                                condition.type === 'playerSelectionPastille' ? `Pastille ${condition.pastilleIcon}` :
                                (condition.type === 'playerSelectionTag' ? (tags.find(t => t.id === condition.tagId)?.name || 'Inconnu') :
                                (roles.find(r => r.id === (condition.selectionRoleId || condition.roleId))?.name || 'Inconnu'))
                              }`
                            ) :
                            condition.type === 'playerDistance' || condition.type === 'playerDistanceTag' || condition.type === 'playerDistancePastille' ? (
                              `${condition.value} de : ${condition.distanceFromPlayerId} (${
                                condition.type === 'playerDistanceTag' ? (tags.find(t => t.id === condition.tagId)?.name || 'Inconnu') :
                                (condition.type === 'playerDistancePastille' ? `Pastille ${condition.pastilleIcon}` :
                                (roles.find(r => r.id === condition.distanceTargetRoleId)?.name || 'Inconnu'))
                              })`
                            ) :
                            condition.value}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setActionConditionCreatorState({ isOpen: true, editingConditionId: condition.id })}
                      className="text-muted-foreground hover:text-primary transition-colors p-0.5"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePendingCondition(condition.id);
                      }}
                      className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Effects Section */}
        <div className="flex flex-col gap-3 pt-1">
          <div className="flex items-center justify-between px-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Actions</label>
            <button
              onClick={() => setActionEffectCreatorState({ isOpen: true })}
              className="group flex gap-1.5 items-center text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-tight"
            >
              <Plus size={12} className="group-hover:rotate-90 transition-transform duration-200" />
              + Ajouter une action
            </button>
          </div>

          <div className="flex flex-col gap-1.5 min-h-[40px] max-h-[160px] overflow-y-auto custom-scrollbar bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-2">
            {pendingActionEffects.length === 0 ? (
              <p className="text-[10px] text-muted-foreground italic text-center py-2">Aucune action définie.</p>
            ) : (
              pendingActionEffects.map((effect) => (
                <div key={effect.id} className="flex items-center justify-between gap-2 bg-background border border-indigo-500/20 rounded p-1.5 shadow-sm text-[10px] font-medium animate-in slide-in-from-left-2 duration-200">
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded uppercase font-bold text-[9px]">
                      Effect
                    </span>
                    <span className="font-bold">
                      {effect.type === 'deleteAllTags' ? 'Supprimer tous les tags' : 
                       effect.type === 'nextPhase' ? 'Passer à la phase suivante' : 
                       effect.type === 'previousPhase' ? 'Revenir à la phase précédente' : 
                       effect.type === 'resetCycle' ? 'Réinitialiser le Cycle (Jour 1)' :
                       effect.type === 'setCycleDayNight' ? 'Cycle : Jour/Nuit' :
                       effect.type === 'setCycleTurn' ? 'Cycle : par Tour' :
                       effect.type === 'setCycleNone' ? 'Cycle : Aucun' :
                       effect.type === 'distributeRoles' ? 'Distribuer (Rôles)' :
                       effect.type === 'showPlayerImage' ? "Afficher l'image du joueur" :
                       effect.type === 'hidePlayerImage' ? "Cacher l'image du joueur" :
                       effect.type === 'showRoleImage' ? "Afficher l'image du Rôle" :
                       effect.type === 'hideRoleImage' ? "Cacher l'image du Rôle" :
                       effect.type === 'deleteAllPlayerTags' ? 'Supprimer tous les tags des joueurs' : 
                       effect.type === 'deleteSelectionPastilles' ? 'Supprimer les pastilles tags' :
                       effect.type === 'popupPlayer' ? 'Popup $Joueur' :
                       effect.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setActionEffectCreatorState({ isOpen: true, editingEffectId: effect.id })}
                      className="text-muted-foreground hover:text-indigo-400 transition-colors p-0.5"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => deletePendingEffect(effect.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={handleClose}
            className="flex-1 py-2 px-4 bg-muted hover:bg-accent text-foreground text-xs font-bold rounded-lg transition-colors border border-border"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!actionName.trim()}
            className="flex-1 py-2 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={14} />
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};
