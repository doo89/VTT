import React, { useState, useRef, useEffect } from 'react';
import { useVttStore } from '../store';
import { X, Check } from 'lucide-react';
import type { ActionEffectType } from '../types';

const ACTION_CATEGORIES = [
  { id: 'all', label: 'Toutes les actions' },
  { id: 'cycle', label: 'Cycle & Phase' },
  { id: 'variables', label: 'Variables & Ordre' },
  { id: 'alerts', label: 'Alertes & Popups' },
  { id: 'visibility', label: 'Visibilité & Interface' },
  { id: 'players', label: 'Gestion des Joueurs' },
  { id: 'attributes', label: 'Tags, Rôles & Équipes' },
  { id: 'remote', label: 'Smartphone & Outils' },
  { id: 'system', label: 'Système & Divers' }
];

interface ActionOption {
  value: ActionEffectType;
  label: string;
  category: string;
}

const ACTION_OPTIONS: ActionOption[] = ([
  { value: 'modifyVariable', label: 'Modifier Variable ($Ordre, $Cycle...)', category: 'variables' },
  { value: 'incrementCallOrder', label: '$Ordre + 1', category: 'variables' },
  { value: 'decrementCallOrder', label: '$Ordre - 1', category: 'variables' },
  { value: 'alertVariable', label: 'Afficher $Variable', category: 'alerts' },
  { value: 'alertPlayerName', label: 'Afficher $Joueur', category: 'alerts' },
  { value: 'popupVariable', label: 'Popup $Variable', category: 'alerts' },
  { value: 'showRoleImage', label: "Afficher l'image du Rôle", category: 'visibility' },
  { value: 'showPlayerImage', label: "Afficher l'image du joueur", category: 'visibility' },
  { value: 'showPlayerTooltip', label: "Afficher l'info bulle des joueurs", category: 'visibility' },
  { value: 'showTagTooltip', label: "Afficher l'info bulle des tags", category: 'visibility' },
  { value: 'showRoleColor', label: "Afficher la couleur du rôle", category: 'visibility' },
  { value: 'showAllPlayers', label: 'Afficher tous les joueurs', category: 'visibility' },
  { value: 'hideRoleImage', label: "Cacher l'image du Rôle", category: 'visibility' },
  { value: 'hidePlayerImage', label: "Cacher l'image du joueur", category: 'visibility' },
  { value: 'setCycleNone', label: 'Cycle : Aucun', category: 'cycle' },
  { value: 'setCycleDayNight', label: 'Cycle : Jour/Nuit', category: 'cycle' },
  { value: 'setCycleTurn', label: 'Cycle : par Tour', category: 'cycle' },
  { value: 'setDayNumber', label: 'Aller au Jour X', category: 'cycle' },
  { value: 'setNightNumber', label: 'Aller à la Nuit X', category: 'cycle' },
  { value: 'togglePhaseTimer', label: 'Mettre en pause / Reprendre le cycle', category: 'cycle' },
  { value: 'setPhaseDuration', label: 'Définir la durée de la phase', category: 'cycle' },
  { value: 'distributeRoles', label: 'Distribuer (Rôles)', category: 'attributes' },
  { value: 'triggerAction', label: 'Exécuter une Action', category: 'system' },
  { value: 'assignTagToRole', label: 'Assigner un tag à un rôle', category: 'attributes' },
  { value: 'removeTagFromRole', label: 'Enlever un tag à un rôle', category: 'attributes' },
  { value: 'assignTeam', label: 'Assigner une équipe ($Joueur)', category: 'attributes' },
  { value: 'assignTeamToRole', label: 'Assigner une équipe à un rôle', category: 'attributes' },
  { value: 'hidePlayerTooltip', label: "Masquer l'info bulle des joueurs", category: 'visibility' },
  { value: 'hideTagTooltip', label: "Masquer l'info bulle des tags", category: 'visibility' },
  { value: 'hideRoleColor', label: "Masquer la couleur du rôle", category: 'visibility' },
  { value: 'hideAllPlayers', label: 'Masquer tous les joueurs', category: 'visibility' },
  { value: 'nextPhase', label: 'Passer à la phase suivante', category: 'cycle' },
  { value: 'popupPlayer', label: 'Popup $Joueur', category: 'alerts' },
  { value: 'resurrectAllPlayers', label: 'Ressusciter tous les joueurs', category: 'players' },
  { value: 'previousPhase', label: 'Revenir à la phase précédente', category: 'cycle' },
  { value: 'resetCallOrder', label: 'Réinitialiser $Ordre', category: 'variables' },
  { value: 'resetCycle', label: 'Réinitialiser le Cycle (Jour 1)', category: 'cycle' },
  { value: 'wakeAllPlayers', label: 'Réveil de tous les Joueurs', category: 'players' },
  { value: 'selectCallOrderPlayer', label: 'Sélectionner joueur $Ordre', category: 'variables' },
  { value: 'shuffleCallOrder', label: "Mélanger l'ordre d'appel ($Ordre)", category: 'variables' },
  { value: 'selectPlayer', label: 'Sélectionner $Joueur', category: 'players' },
  { value: 'sleepAllPlayers', label: 'Tous les Joueurs dorment', category: 'players' },
  { value: 'sleepPlayer', label: '$Joueur dort', category: 'players' },
  { value: 'wakePlayer', label: '$Joueur réveil', category: 'players' },
  { value: 'switchSleepPlayer', label: '$Joueur switch éveille', category: 'players' },
  { value: 'deleteSelectionPastilles', label: 'Supprimer les pastilles tags', category: 'attributes' },
  { value: 'deleteAllTags', label: 'Supprimer tous les tags dans la salle', category: 'attributes' },
  { value: 'deleteAllPlayerTags', label: 'Supprimer tous les tags des joueurs', category: 'attributes' },
  { value: 'showTimerOnSmartphone', label: 'Afficher le chronomètre (Smartphone)', category: 'remote' },
  { value: 'hideTimerOnSmartphone', label: 'Masquer le chronomètre (Smartphone)', category: 'remote' },
  { value: 'wait', label: 'Attendre x secondes', category: 'system' },
  { value: 'playSound', label: 'Jouer un effet sonore', category: 'alerts' },
  { value: 'showHandout', label: 'Afficher un Document / Handout', category: 'alerts' },
  { value: 'sendPrivateMessage', label: 'Envoyer un Message Privé ($Joueur)', category: 'alerts' },
  { value: 'addSystemLog', label: "Ajouter un Log Système (Journal)", category: 'system' },
  { value: 'setRoomBackground', label: "Changer le Fond d'écran de la salle", category: 'visibility' },
  { value: 'setRoomColor', label: "Changer l'Ambiance (Couleur) de la salle", category: 'visibility' }
] as ActionOption[]).sort((a, b) => a.label.localeCompare(b.label));

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
    teams,
    soundboard,
    handouts
  } = useVttStore();
  
  const [type, setType] = useState<ActionEffectType>('deleteAllTags');
  const [category, setCategory] = useState<string>('attributes');
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
  const [soundName, setSoundName] = useState<string>('');
  const [handoutId, setHandoutId] = useState<string>('');
  const [privateMessage, setPrivateMessage] = useState<string>('');
  const [logMessage, setLogMessage] = useState<string>('');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>('');
  const [roomColor, setRoomColor] = useState<string>('#6B7280');
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number, y: number, startX: number, startY: number } | null>(null);

  const isEditing = !!actionEffectCreatorState.editingEffectId;

  useEffect(() => {
    if (isEditing) {
      const effect = pendingActionEffects.find(e => e.id === actionEffectCreatorState.editingEffectId);
      if (effect) {
        setType(effect.type);
        const effectCategory = ACTION_OPTIONS.find(o => o.value === effect.type)?.category || 'all';
        setCategory(effectCategory);
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
        setSoundName(effect.soundName || (soundboard.buttons.length > 0 ? soundboard.buttons[0].name : ''));
        setHandoutId(effect.handoutId || (handouts.length > 0 ? handouts[0].id : ''));
        setPrivateMessage(effect.privateMessage || '');
        setLogMessage(effect.logMessage || '');
        setBackgroundImageUrl(effect.backgroundImageUrl || '');
        setRoomColor(effect.roomColor || '#6B7280');
      }
    } else {
      setType('deleteAllTags');
      setCategory('attributes');
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
      setSoundName(soundboard.buttons.length > 0 ? soundboard.buttons[0].name : '');
      setHandoutId(handouts.length > 0 ? handouts[0].id : '');
      setPrivateMessage('');
      setLogMessage('');
      setBackgroundImageUrl('');
      setRoomColor('#6B7280');
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
      variable: (type === 'modifyVariable' || type === 'sortCallOrderByStat' || type === 'alertVariable' || type === 'popupVariable') ? variable : undefined,
      operator: (type === 'modifyVariable' || type === 'sortCallOrderByStat') ? operator : undefined,
      value: (type === 'modifyVariable' || type === 'wait' || type === 'setDayNumber' || type === 'setNightNumber' || type === 'setPhaseDuration') ? value : undefined,
      targetActionId: type === 'triggerAction' ? targetActionId : undefined,
      tagId: (type === 'assignTagToRole' || type === 'removeTagFromRole') ? tagId : undefined,
      roleId: (type === 'assignTagToRole' || type === 'removeTagFromRole' || type === 'assignTeamToRole') ? roleId : undefined,
      teamId: (type === 'assignTeam' || type === 'assignTeamToRole') ? teamId : undefined,
      roleTeamId: type === 'assignTeam' ? roleTeamId : undefined,
      showCountdown: type === 'wait' ? showCountdown : undefined,
      countdownMessage: type === 'wait' ? countdownMessage : undefined,
      soundName: type === 'playSound' ? soundName : undefined,
      handoutId: type === 'showHandout' ? handoutId : undefined,
      privateMessage: type === 'sendPrivateMessage' ? privateMessage : undefined,
      logMessage: type === 'addSystemLog' ? logMessage : undefined,
      backgroundImageUrl: type === 'setRoomBackground' ? backgroundImageUrl : undefined,
      roomColor: type === 'setRoomColor' ? roomColor : undefined
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
          title="Fermer la fenêtre"
          aria-label="Fermer la fenêtre"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-5 flex flex-col gap-5 bg-background/50">
        <div className="flex flex-col gap-4">
          {/* Status first */}
          <label htmlFor="effect-enabled-toggle" className="flex items-center gap-3 p-3 bg-muted/20 border border-border rounded-lg cursor-pointer hover:bg-muted/40 transition-colors">
            <input
              id="effect-enabled-toggle"
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

          {/* Catégorie */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="effect-category-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Catégorie d'action</label>
            <select
              id="effect-category-select"
              value={category}
              onChange={(e) => {
                const newCat = e.target.value;
                setCategory(newCat);
                const availableOptions = ACTION_OPTIONS.filter(o => newCat === 'all' || o.category === newCat);
                if (availableOptions.length > 0 && !availableOptions.some(o => o.value === type)) {
                  const newType = availableOptions[0].value;
                  setType(newType);
                  if (newType === 'sortCallOrderByStat') {
                    setVariable('lives');
                    setOperator('asc');
                  }
                }
              }}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm outline-none transition-all shadow-sm focus:border-indigo-500/50 font-bold"
            >
              {ACTION_CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Type second */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="effect-type-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Type d'action</label>
            <select
              id="effect-type-select"
              value={type}
              onChange={(e) => {
                const newType = e.target.value as any;
                setType(newType);
                if (newType === 'sortCallOrderByStat') {
                  setVariable('lives');
                  setOperator('asc');
                }
              }}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm outline-none transition-all shadow-sm focus:border-indigo-500/50"
            >
              {ACTION_OPTIONS.filter(o => category === 'all' || o.category === category).map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {(type === 'setDayNumber' || type === 'setNightNumber' || type === 'setPhaseDuration') && (
            <div className="flex flex-col gap-3 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-in slide-in-from-top-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="effect-cycle-value" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
                  {type === 'setPhaseDuration' ? 'Durée de la phase (en secondes)' : `Numéro du ${type === 'setDayNumber' ? 'Jour' : 'Nuit'}`}
                </label>
                <input
                  id="effect-cycle-value"
                  type="number"
                  min={type === 'setPhaseDuration' ? "0" : "1"}
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
                />
              </div>
            </div>
          )}

          {type === 'sortCallOrderByStat' && (
            <div className="flex flex-col gap-3 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-in slide-in-from-top-2">
               <div className="flex flex-col gap-1.5">
                  <label htmlFor="effect-stat-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Statistique</label>
                  <select
                    id="effect-stat-select"
                    value={variable}
                    onChange={(e) => setVariable(e.target.value)}
                    className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
                  >
                    <option value="lives">Points de Vie</option>
                    <option value="points">Points de victoire</option>
                    <option value="votes">Votes reçus</option>
                  </select>
               </div>
               <div className="flex flex-col gap-1.5">
                  <label htmlFor="effect-sort-direction" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Ordre de tri</label>
                  <select
                    id="effect-sort-direction"
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
                  >
                    <option value="asc">Croissant (Le plus faible en premier)</option>
                    <option value="desc">Décroissant (Le plus fort en premier)</option>
                  </select>
               </div>
            </div>
          )}

          {type === 'wait' && (
            <div className="flex flex-col gap-3 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-in slide-in-from-top-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="effect-wait-value" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Durée (secondes)</label>
                <input
                  id="effect-wait-value"
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
                    <label htmlFor="effect-countdown-message" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Message sur smartphone</label>
                    <input
                      id="effect-countdown-message"
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
              <label htmlFor="effect-trigger-action" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Action à exécuter</label>
              <select
                id="effect-trigger-action"
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
                <label htmlFor="effect-tag-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
                  {type === 'assignTagToRole' ? 'Tag à assigner' : 'Tag à enlever'}
                </label>
                <select
                  id="effect-tag-select"
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
                <label htmlFor="effect-role-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Rôle cible</label>
                <select
                  id="effect-role-select"
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
                <label htmlFor="effect-team-player-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Équipe à assigner à $Joueur</label>
                <select
                  id="effect-team-player-select"
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
                <label htmlFor="effect-team-role-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Équipe à assigner au rôle du $Joueur</label>
                <select
                  id="effect-team-role-select"
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
          
          {type === 'assignTeamToRole' && (
            <div className="flex flex-col gap-3 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-in slide-in-from-top-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="effect-role-target-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Rôle cible</label>
                <select
                  id="effect-role-target-select"
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-500/50"
                >
                  {roles.length === 0 && <option value="">Aucun rôle disponible</option>}
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="effect-team-target-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Équipe à assigner</label>
                <select
                  id="effect-team-target-select"
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
            </div>
          )}

          {/* New row for variable modification and alerts */}
          {(type === 'modifyVariable' || type === 'alertVariable' || type === 'popupVariable') && (
            <div className="flex flex-col gap-3 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-in slide-in-from-top-2">
               <div className="flex flex-col gap-1.5">
                  <label htmlFor="effect-variable-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Variable</label>
                  <input
                    id="effect-variable-select"
                    list="effect-variable-list"
                    value={variable}
                    onChange={(e) => setVariable(e.target.value)}
                    placeholder="Saisissez un nom (ex: $Temp1)"
                    className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
                  />
                  <datalist id="effect-variable-list">
                    <option value="$Ordre" />
                    <option value="$Cycle" />
                    <option value="$Jour" />
                    <option value="$Nuit" />
                  </datalist>
               </div>
               
               {type === 'modifyVariable' && (
                 <div className="flex gap-2">
                    <div className="flex-1 flex flex-col gap-1.5">
                      <label htmlFor="effect-operator-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Opérateur</label>
                      <select
                        id="effect-operator-select"
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
                      <label htmlFor="effect-variable-value" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Valeur</label>
                      <input
                        id="effect-variable-value"
                        type="number"
                        value={value}
                        onChange={(e) => setValue(Number(e.target.value))}
                        className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50 shadow-inner"
                      />
                    </div>
                 </div>
               )}
            </div>
          )}

          {type === 'playSound' && (
            <div className="flex flex-col gap-1.5 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-in slide-in-from-top-2">
              <label htmlFor="effect-sound-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Effet sonore</label>
              <select
                id="effect-sound-select"
                value={soundName}
                onChange={(e) => setSoundName(e.target.value)}
                className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
              >
                {soundboard.buttons.length === 0 && <option value="">Aucun son disponible</option>}
                {soundboard.buttons.map(b => (
                  <option key={b.index} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          {type === 'showHandout' && (
            <div className="flex flex-col gap-1.5 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-in slide-in-from-top-2">
              <label htmlFor="effect-handout-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Document / Handout</label>
              <select
                id="effect-handout-select"
                value={handoutId}
                onChange={(e) => setHandoutId(e.target.value)}
                className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
              >
                {handouts.length === 0 && <option value="">Aucun document disponible</option>}
                {handouts.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>
          )}

          {type === 'sendPrivateMessage' && (
            <div className="flex flex-col gap-1.5 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-in slide-in-from-top-2">
              <label htmlFor="effect-private-message" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Message Privé ($Joueur)</label>
              <textarea
                id="effect-private-message"
                value={privateMessage}
                onChange={(e) => setPrivateMessage(e.target.value)}
                placeholder="Ex: Le loup a flairé votre piste..."
                rows={3}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500/50 resize-none shadow-inner"
              />
            </div>
          )}

          {type === 'addSystemLog' && (
            <div className="flex flex-col gap-1.5 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-in slide-in-from-top-2">
              <label htmlFor="effect-log-message" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Message du Journal</label>
              <textarea
                id="effect-log-message"
                value={logMessage}
                onChange={(e) => setLogMessage(e.target.value)}
                placeholder="Ex: Le joueur $Joueur a été infecté."
                rows={3}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500/50 resize-none shadow-inner"
              />
              <p className="text-[10px] text-muted-foreground px-1">Vous pouvez utiliser <strong>$Joueur</strong> et <strong>$Rôle</strong> pour insérer le nom et le rôle de la cible.</p>
            </div>
          )}

          {type === 'setRoomBackground' && (
            <div className="flex flex-col gap-1.5 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-in slide-in-from-top-2">
              <label htmlFor="effect-bg-url" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Image de Fond (URL)</label>
              <div className="flex gap-2">
                <input
                  id="effect-bg-url"
                  type="text"
                  value={backgroundImageUrl}
                  onChange={(e) => setBackgroundImageUrl(e.target.value)}
                  placeholder="URL de l'image..."
                  className="flex-1 bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
                />
                <select
                  className="w-1/3 bg-input border border-border rounded-lg px-2 py-1.5 text-[10px] outline-none focus:border-indigo-500/50"
                  onChange={(e) => setBackgroundImageUrl(e.target.value)}
                  value={handouts.find(h => h.imageUrl === backgroundImageUrl)?.imageUrl || ''}
                >
                  <option value="">Document...</option>
                  {handouts.filter(h => h.type === 'image').map(h => (
                    <option key={h.id} value={h.imageUrl}>{h.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {type === 'setRoomColor' && (
            <div className="flex flex-col gap-1.5 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-in slide-in-from-top-2">
              <label htmlFor="effect-room-color" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Couleur d'Ambiance</label>
              <div className="flex items-center gap-3">
                <input
                  id="effect-room-color"
                  type="color"
                  value={roomColor}
                  onChange={(e) => setRoomColor(e.target.value)}
                  className="w-10 h-10 bg-transparent border-none rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={roomColor}
                  onChange={(e) => setRoomColor(e.target.value)}
                  className="flex-1 bg-input border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
                />
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
