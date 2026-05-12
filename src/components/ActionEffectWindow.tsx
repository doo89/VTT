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
    pendingActionEffects,
    actions,
    roles,
    tags,
    teams
  } = useVttStore();
  
  const [type, setType] = useState<ActionEffectType>('deleteAllTags');
  const [enabled, setEnabled] = useState(true);
  const [variable, setVariable] = useState('$Ordre');
  const [operator, setOperator] = useState('=');
  const [value, setValue] = useState<number>(0);
  const [targetActionId, setTargetActionId] = useState<string>('');
  const [tagId, setTagId] = useState<string>('');
  const [roleId, setRoleId] = useState<string>('');
  const [teamId, setTeamId] = useState<string>('unchanged');
  const [roleTeamId, setRoleTeamId] = useState<string>('unchanged');
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownMessage, setCountdownMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number, y: number, startX: number, startY: number } | null>(null);

  const isEditing = !!actionEffectCreatorState.editingEffectId;

  useEffect(() => {
    if (isEditing) {
      const effect = pendingActionEffects.find(e => e.id === actionEffectCreatorState.editingEffectId);
      if (effect) {
        setType(effect.type);
        setEnabled(effect.enabled);
        setVariable(effect.variable || '$Ordre');
        setOperator(effect.operator || '=');
        setValue(effect.value || 0);
        setTargetActionId(effect.targetActionId || (actions.length > 0 ? actions[0].id : ''));
        setTagId(effect.tagId || (tags.length > 0 ? tags[0].id : ''));
        setRoleId(effect.roleId || (roles.length > 0 ? roles[0].id : ''));
        setTeamId(effect.teamId || 'unchanged');
        setRoleTeamId(effect.roleTeamId || 'unchanged');
        setShowCountdown(effect.showCountdown || false);
        setCountdownMessage(effect.countdownMessage || '');
      }
    } else {
      setType('deleteAllTags');
      setEnabled(true);
      setVariable('$Ordre');
      setOperator('=');
      setValue(0);
      setTargetActionId(actions.length > 0 ? actions[0].id : '');
      setTagId(tags.length > 0 ? tags[0].id : '');
      setRoleId(roles.length > 0 ? roles[0].id : '');
      setTeamId('unchanged');
      setRoleTeamId('unchanged');
      setShowCountdown(false);
      setCountdownMessage('');
    }
  }, [isEditing, actionEffectCreatorState.editingEffectId, pendingActionEffects, actions, tags, roles, teams]);

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
    const data = { 
      type, 
      enabled,
      variable: type === 'modifyVariable' ? variable : undefined,
      operator: type === 'modifyVariable' ? operator : undefined,
      value: (type === 'modifyVariable' || type === 'wait') ? value : undefined,
      targetActionId: type === 'triggerAction' ? targetActionId : undefined,
      tagId: (type === 'assignTagToRole' || type === 'removeTagFromRole') ? tagId : undefined,
      roleId: (type === 'assignTagToRole' || type === 'removeTagFromRole') ? roleId : undefined,
      teamId: type === 'assignTeam' ? teamId : undefined,
      roleTeamId: type === 'assignTeam' ? roleTeamId : undefined,
      showCountdown: type === 'wait' ? showCountdown : undefined,
      countdownMessage: type === 'wait' ? countdownMessage : undefined
    };
    if (isEditing && actionEffectCreatorState.editingEffectId) {
      updatePendingEffect(actionEffectCreatorState.editingEffectId, data);
    } else {
      addPendingEffect(data);
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
          {/* Status first */}
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

          {/* Type second */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Type d'action</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm outline-none transition-all shadow-sm focus:border-indigo-500/50"
            >
              <option value="modifyVariable">Modifier Variable ($Ordre, $Cycle...)</option>
              <option value="incrementCallOrder">$Ordre + 1</option>
              <option value="decrementCallOrder">$Ordre - 1</option>
              <option value="alertCycleNumber">Afficher $Cycle</option>
              <option value="alertDayNumber">Afficher $Jour</option>
              <option value="alertPlayerName">Afficher $Joueur</option>
              <option value="alertNightNumber">Afficher $Nuit</option>
              <option value="alertCallOrder">Afficher $Ordre</option>
              <option value="showRoleImage">Afficher l'image du Rôle</option>
              <option value="showPlayerImage">Afficher l'image du joueur</option>
              <option value="showPlayerTooltip">Afficher l'info bulle des joueurs</option>
              <option value="showTagTooltip">Afficher l'info bulle des tags</option>
              <option value="showRoleColor">Afficher la couleur du rôle</option>
              <option value="showAllPlayers">Afficher tous les joueurs</option>
              <option value="hideRoleImage">Cacher l'image du Rôle</option>
              <option value="hidePlayerImage">Cacher l'image du joueur</option>
              <option value="setCycleNone">Cycle : Aucun</option>
              <option value="setCycleDayNight">Cycle : Jour/Nuit</option>
              <option value="setCycleTurn">Cycle : par Tour</option>
              <option value="distributeRoles">Distribuer (Rôles)</option>
              <option value="triggerAction">Exécuter une Action</option>
              <option value="assignTagToRole">Assigner un tag à un rôle</option>
              <option value="removeTagFromRole">Enlever un tag à un rôle</option>
              <option value="assignTeam">Assigner une équipe</option>
              <option value="hidePlayerTooltip">Masquer l'info bulle des joueurs</option>
              <option value="hideTagTooltip">Masquer l'info bulle des tags</option>
              <option value="hideRoleColor">Masquer la couleur du rôle</option>
              <option value="hideAllPlayers">Masquer tous les joueurs</option>
              <option value="nextPhase">Passer à la phase suivante</option>
              <option value="popupPlayer">Popup $Joueur</option>
              <option value="resurrectAllPlayers">Ressusciter tous les joueurs</option>
              <option value="previousPhase">Revenir à la phase précédente</option>
              <option value="resetCallOrder">Réinitialiser $Ordre</option>
              <option value="resetCycle">Réinitialiser le Cycle (Jour 1)</option>
              <option value="wakeAllPlayers">Réveil de tous les Joueurs</option>
              <option value="selectCallOrderPlayer">Sélectionner joueur $Ordre</option>
              <option value="selectPlayer">Sélectionner $Joueur</option>
              <option value="sleepAllPlayers">Tous les Joueurs dorment</option>
              <option value="sleepPlayer">$Joueur dort</option>
              <option value="wakePlayer">$Joueur réveil</option>
              <option value="switchSleepPlayer">$Joueur switch éveille</option>
              <option value="deleteSelectionPastilles">Supprimer les pastilles tags</option>
              <option value="deleteAllTags">Supprimer tous les tags dans la salle</option>
              <option value="deleteAllPlayerTags">Supprimer tous les tags des joueurs</option>
              <option value="showTimerOnSmartphone">Afficher le chronomètre (Smartphone)</option>
              <option value="hideTimerOnSmartphone">Masquer le chronomètre (Smartphone)</option>
              <option value="wait">Attendre x secondes</option>
            </select>
          </div>

          {type === 'wait' && (
            <div className="flex flex-col gap-3 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-in slide-in-from-top-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Durée (secondes)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
                />
              </div>
              
              <div className="flex flex-col gap-2 pt-1 border-t border-indigo-500/10 mt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${showCountdown ? 'bg-indigo-500 border-indigo-500' : 'border-border group-hover:border-indigo-500/50'}`}>
                    {showCountdown && <Check size={12} className="text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={showCountdown}
                    onChange={(e) => setShowCountdown(e.target.checked)}
                    className="hidden"
                  />
                  <span className="text-xs font-medium">Compte à rebours sur smartphone</span>
                </label>

                {showCountdown && (
                  <div className="flex flex-col gap-1.5 animate-in slide-in-from-top-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Message sur smartphone</label>
                    <input
                      type="text"
                      value={countdownMessage}
                      onChange={(e) => setCountdownMessage(e.target.value)}
                      placeholder="Ex: Fin du vote dans..."
                      className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {type === 'triggerAction' && (
            <div className="flex flex-col gap-1.5 p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg animate-in slide-in-from-top-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Action à exécuter</label>
              <select
                value={targetActionId}
                onChange={(e) => setTargetActionId(e.target.value)}
                className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-orange-500/50"
              >
                {actions.length === 0 && <option value="">Aucune action disponible</option>}
                {actions.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}

          {(type === 'assignTagToRole' || type === 'removeTagFromRole') && (
            <div className="flex flex-col gap-3 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-in slide-in-from-top-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
                  {type === 'assignTagToRole' ? 'Tag à assigner' : 'Tag à enlever'}
                </label>
                <select
                  value={tagId}
                  onChange={(e) => setTagId(e.target.value)}
                  className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
                >
                  {tags.length === 0 && <option value="">Aucun tag disponible</option>}
                  {tags.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Rôle cible</label>
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
                >
                  {roles.length === 0 && <option value="">Aucun rôle disponible</option>}
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {type === 'assignTeam' && (
            <div className="flex flex-col gap-3 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-in slide-in-from-top-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Équipe à assigner à $Joueur</label>
                <select
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
                >
                  <option value="unchanged">Ne pas modifier</option>
                  <option value="">Aucune équipe (Retirer l'équipe)</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Équipe à assigner au rôle du $Joueur</label>
                <select
                  value={roleTeamId}
                  onChange={(e) => setRoleTeamId(e.target.value)}
                  className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
                >
                  <option value="unchanged">Ne pas modifier</option>
                  <option value="">Aucune équipe (Retirer l'équipe)</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* New row for variable modification */}
          {type === 'modifyVariable' && (
            <div className="flex flex-col gap-3 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-in slide-in-from-top-2">
               <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Variable</label>
                  <select
                    value={variable}
                    onChange={(e) => setVariable(e.target.value)}
                    className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
                  >
                    <option value="$Ordre">$Ordre</option>
                    <option value="$Cycle">$Cycle</option>
                    <option value="$Jour">$Jour</option>
                    <option value="$Nuit">$Nuit</option>
                  </select>
               </div>
               <div className="flex gap-2">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Opérateur</label>
                    <select
                      value={operator}
                      onChange={(e) => setOperator(e.target.value)}
                      className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
                    >
                      <option value="=">=</option>
                      <option value="+">+</option>
                      <option value="-">-</option>
                      <option value="*">*</option>
                      <option value="/">/</option>
                    </select>
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Valeur</label>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => setValue(Number(e.target.value))}
                      className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50 shadow-inner"
                    />
                  </div>
               </div>
            </div>
          )}
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
