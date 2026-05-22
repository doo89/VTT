import React, { useState, useRef, useEffect } from 'react';
import { useVttStore } from '../store';
import * as icons from 'lucide-react';
import { X, Check, ChevronDown, ChevronRight } from 'lucide-react';
import type { ActionConditionType, ActionOperator } from '../types';
import { TAG_ICONS } from '../lib/icons';
import './ActionConditionWindow.css';

export const ActionConditionWindow: React.FC = () => {
  const { 
    actionConditionCreatorState, 
    setActionConditionCreatorState, 
    addPendingCondition,
    updatePendingCondition,
    pendingActionConditions,
    pendingActionOnce,
    setPendingOnce,
    pendingActionIsRecurring,
    pendingActionIntervalSeconds,
    pendingActionRepeatCount,
    pendingActionDelaySeconds,
    setPendingDelay,
    setPendingRecurring,
    roles,
    tags,
    teams
  } = useVttStore();
  
  const [type, setType] = useState<ActionConditionType>('day');
  const [operator, setOperator] = useState<ActionOperator>('=');
  const [value, setValue] = useState(0);
  const [minValue, setMinValue] = useState(0);
  const [maxValue, setMaxValue] = useState(0);
  const [enabled, setEnabled] = useState(true);
  const [roleId, setRoleId] = useState<string | null>(null);
  const [tagId, setTagId] = useState<string | null>(null);
  const [selectionTeamId, setSelectionTeamId] = useState<string | null>(null);
  const [pastilleIcon, setPastilleIcon] = useState<string | null>(null);
  const [selectionType, setSelectionType] = useState<'first' | 'last' | 'all' | 'callOrder' | 'numeric' | 'random' | null>('all');
  const [selectionRoleId, setSelectionRoleId] = useState<string | null>(null);
  const [distanceFromPlayerId, setDistanceFromPlayerId] = useState<string | null>('$Joueur');
  const [distanceTargetRoleId, setDistanceTargetRoleId] = useState<string | null>(null);
  const [cycleCheckType, setCycleCheckType] = useState<string | null>('$Jour');
  const [distanceTargetTeamId, setDistanceTargetTeamId] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [distanceTargetStatus, setDistanceTargetStatus] = useState<'alive' | 'dead' | null>('alive');
  const [distanceUnit, setDistanceUnit] = useState<'logical' | 'physical'>('logical');
  const [chancePercent, setChancePercent] = useState(50);
  const [targetPlayerId, setTargetPlayerId] = useState<string | null>('$Joueur');

  const [isDistanceExpanded, setIsDistanceExpanded] = useState(true);
  const [isIdentityExpanded, setIsIdentityExpanded] = useState(true);
  const [isAutreExpanded, setIsAutreExpanded] = useState(true);
  const [isCycleExpanded, setIsCycleExpanded] = useState(true);

  const isEditing = !!actionConditionCreatorState.editingConditionId;

  const allIcons = TAG_ICONS;

  useEffect(() => {
    if (isEditing) {
      const condition = pendingActionConditions.find(c => c.id === actionConditionCreatorState.editingConditionId);
      if (condition) {
        setType(condition.type);
        setOperator(condition.operator);
        setValue(condition.value);
        setMinValue(condition.minValue ?? condition.value);
        setMaxValue(condition.maxValue ?? condition.value);
        setEnabled(condition.enabled ?? true);
        setRoleId(condition.roleId || (roles[0]?.id || null));
        setTagId(condition.tagId || (tags[0]?.id || null));
        setPastilleIcon(condition.pastilleIcon || allIcons[0]);
        setSelectionType(condition.selectionType || 'all');
        setSelectionRoleId(condition.selectionRoleId || (roles[0]?.id || null));
        setDistanceFromPlayerId(condition.distanceFromPlayerId || '$Joueur');
        setDistanceTargetRoleId(condition.distanceTargetRoleId || (roles[0]?.id || null));
        setCycleCheckType(condition.cycleCheckType || '$Jour');
        setSelectionTeamId(condition.selectionTeamId || (teams[0]?.id || null));
        setDistanceTargetTeamId(condition.distanceTargetTeamId || (teams[0]?.id || null));
        setTeamId(condition.teamId || (teams[0]?.id || null));
        setDistanceTargetStatus(condition.distanceTargetStatus || 'alive');
        setDistanceUnit(condition.distanceUnit || 'logical');
        setChancePercent(condition.chancePercent ?? 50);
        setTargetPlayerId(condition.targetPlayerId || '$Joueur');
      }
    } else {
      setType('day');
      setOperator('=');
      setValue(0);
      setMinValue(0);
      setMaxValue(0);
      setEnabled(true);
      setRoleId(roles[0]?.id || null);
      setTagId(tags[0]?.id || null);
      setPastilleIcon(allIcons[0]);
      setSelectionType('all');
      setSelectionRoleId(roles[0]?.id || null);
      setDistanceFromPlayerId('$Joueur');
      setDistanceTargetRoleId(roles[0]?.id || null);
      setCycleCheckType('$Jour');
      setSelectionTeamId(teams[0]?.id || null);
      setDistanceTargetTeamId(teams[0]?.id || null);
      setTeamId(teams[0]?.id || null);
      setDistanceTargetStatus('alive');
      setDistanceUnit('logical');
      setChancePercent(50);
      setTargetPlayerId('$Joueur');
    }
  }, [isEditing, actionConditionCreatorState.editingConditionId, pendingActionConditions, roles, tags, allIcons]);

  const windowRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number, y: number, startX: number, startY: number } | null>(null);

  useEffect(() => {
    if (windowRef.current) {
      windowRef.current.style.left = `${actionConditionCreatorState.x}px`;
      windowRef.current.style.top = `${actionConditionCreatorState.y}px`;
    }
  }, [actionConditionCreatorState.x, actionConditionCreatorState.y]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setActionConditionCreatorState({
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
  }, [isDragging, setActionConditionCreatorState]);

  if (!actionConditionCreatorState.isOpen) return null;

  const handleClose = () => {
    setActionConditionCreatorState({ isOpen: false, editingConditionId: null });
  };

  const handleOK = () => {
    const isDist = ['playerDistance', 'playerDistanceTag', 'playerDistancePastille', 'playerDistanceTeam', 'playerDistanceStatus', 'playerDistanceSelf', 'playerDistanceSelected'].includes(type);
    const conditionData = { 
      type, 
      operator, 
      value: isDist ? 0 : value,
      minValue: isDist ? minValue : value,
      maxValue: isDist ? maxValue : value,
      enabled, 
      roleId: (type === 'playerRole' || type === 'playerSelectionRole' || type === 'callOrderRole') ? roleId : null,
      tagId: (type === 'playerTag' || type === 'playerSelectionTag' || type === 'playerDistanceTag') ? tagId : null,
      pastilleIcon: (type === 'playerPastille' || type === 'playerSelectionPastille' || type === 'playerDistancePastille') ? pastilleIcon : null,
      selectionType: ['playerSelection', 'playerSelectionRole', 'playerSelectionTag', 'playerSelectionPastille', 'playerSelectionTeam', 'playerSelectionStatus', 'playerSelectionRoleAndTeam', 'playerRole', 'playerTag', 'playerPastille'].includes(type) ? selectionType : null,
      selectionRoleId: (type === 'playerSelectionRole' || type === 'playerSelectionRoleAndTeam') ? selectionRoleId : null,
      distanceFromPlayerId: isDist ? distanceFromPlayerId : null,
      distanceTargetRoleId: (type === 'playerDistance' || type === 'playerDistanceSelected') ? distanceTargetRoleId : null,
      distanceTargetTeamId: type === 'playerDistanceTeam' ? distanceTargetTeamId : null,
      distanceTargetStatus: (type === 'playerDistanceStatus' || type === 'playerSelectionStatus') ? distanceTargetStatus : null,
      distanceUnit: isDist ? distanceUnit : null,
      cycleCheckType: type === 'cycleCheck' ? cycleCheckType : null,
      selectionTeamId: (type === 'playerSelectionTeam' || type === 'playerSelectionRoleAndTeam') ? selectionTeamId : null,
      teamId: type === 'roleTeamCheck' ? teamId : null,
      chancePercent: type === 'randomChance' ? chancePercent : undefined,
      targetPlayerId: ['hasTag', 'randomChance'].includes(type) ? targetPlayerId : null
    };

    if (isEditing && actionConditionCreatorState.editingConditionId) {
      updatePendingCondition(actionConditionCreatorState.editingConditionId, conditionData);
    } else {
      addPendingCondition(conditionData);
    }
    handleClose();
  };

  return (
    <div 
      ref={windowRef}
      className={`action-condition-window animate-in zoom-in-95 duration-200 ${isDragging ? 'action-condition-window-dragging' : ''}`}
    >
      <div 
        className="px-4 py-2 bg-zinc-950 border-b border-orange-500/40 flex items-center justify-between cursor-move group select-none"
        onMouseDown={(e) => {
          setIsDragging(true);
          dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            startX: actionConditionCreatorState.x,
            startY: actionConditionCreatorState.y
          };
        }}
      >
        <div className="flex items-center gap-2 text-orange-400">
          <span className="font-bold text-sm tracking-tight text-white uppercase">Conditions d'actions</span>
        </div>
        <button 
          type="button"
          onClick={handleClose}
          onMouseDown={e => e.stopPropagation()}
          className="p-1.5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-full transition-all"
          title="Fermer"
          aria-label="Fermer la fenêtre"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-3.5 flex flex-col gap-3.5 bg-background overflow-y-auto max-h-[75vh] custom-scrollbar">
        
        {/* Groupe : Autre */}
        <div className="flex flex-col bg-orange-500/5 rounded-xl border border-orange-500/10 shadow-sm transition-all hover:bg-orange-500/[0.08]">
          <button 
            type="button"
            onClick={() => setIsAutreExpanded(!isAutreExpanded)}
            className="flex items-center justify-between w-full p-2.5 text-left outline-none"
          >
            <h4 className="text-[10px] font-black text-orange-500/60 uppercase tracking-[0.2em] pl-1">Groupe : Autre</h4>
            {isAutreExpanded ? <ChevronDown size={14} className="text-orange-500/40" /> : <ChevronRight size={14} className="text-orange-500/40" />}
          </button>
          <div className={`px-2.5 pb-2.5 transition-all duration-300 origin-top flex flex-col gap-1.5 ${isAutreExpanded ? 'opacity-100' : 'hidden opacity-0 overflow-hidden'}`}>
            <div className="flex items-center justify-between px-2 py-1">
              <label htmlFor="action-once" className="flex flex-col gap-0.5 cursor-pointer">
                <span className="text-xs font-bold text-foreground">Une seule fois</span>
                <span className="text-[10px] text-muted-foreground">L'action se désactivera après sa première exécution réussie</span>
              </label>
              <input
                id="action-once"
                type="checkbox"
                checked={pendingActionOnce}
                onChange={(e) => setPendingOnce(e.target.checked)}
                className="w-5 h-5 rounded border-border text-orange-500 focus:ring-orange-500 transition-all cursor-pointer"
              />
            </div>
            <div className="h-px bg-border/20 my-1" />
            <div className="flex items-center gap-3 px-2 py-1">
              <input
                id="action-recurring"
                type="checkbox"
                checked={pendingActionIsRecurring}
                onChange={(e) => setPendingRecurring(e.target.checked, pendingActionIntervalSeconds, pendingActionRepeatCount)}
                className="w-5 h-5 rounded border-border text-orange-500 focus:ring-orange-500 transition-all cursor-pointer shrink-0"
              />
              <label htmlFor="action-recurring" className={`flex items-center gap-1.5 text-xs transition-opacity duration-200 cursor-pointer ${!pendingActionIsRecurring ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                <span className="font-medium">Exécuter toutes les</span>
                <input
                  disabled={!pendingActionIsRecurring}
                  type="number"
                  min="1"
                  value={pendingActionIntervalSeconds}
                  onChange={(e) => setPendingRecurring(pendingActionIsRecurring, parseInt(e.target.value) || 1, pendingActionRepeatCount)}
                  className="w-12 bg-input border border-border rounded-lg px-2 py-1 text-center font-bold outline-none"
                />
                <span className="font-medium">secondes,</span>
                <input
                  disabled={!pendingActionIsRecurring}
                  type="number"
                  min="1"
                  value={pendingActionRepeatCount}
                  onChange={(e) => setPendingRecurring(pendingActionIsRecurring, pendingActionIntervalSeconds, parseInt(e.target.value) || 1)}
                  className="w-12 bg-input border border-border rounded-lg px-2 py-1 text-center font-bold outline-none"
                />
                <span className="font-medium">fois.</span>
              </label>
            </div>
            <div className="h-px bg-border/20 my-1" />
            <div className="flex items-center gap-3 px-2 py-1">
              <input
                id="action-delay"
                type="checkbox"
                checked={pendingActionDelaySeconds > 0}
                onChange={(e) => setPendingDelay(e.target.checked ? 5 : 0)}
                className="w-5 h-5 rounded border-border text-orange-500 focus:ring-orange-500 transition-all cursor-pointer shrink-0"
              />
              <label htmlFor="action-delay" className={`flex items-center gap-1.5 text-xs transition-opacity duration-200 cursor-pointer ${pendingActionDelaySeconds === 0 ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                <span className="font-medium">Attendre :</span>
                <input
                  disabled={pendingActionDelaySeconds === 0}
                  type="number"
                  min="0"
                  value={pendingActionDelaySeconds}
                  onChange={(e) => setPendingDelay(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-12 bg-input border border-border rounded-lg px-2 py-1 text-center font-bold outline-none"
                />
                <span className="font-medium">secondes avant d'exécuter l'action.</span>
              </label>
            </div>
          </div>
        </div>

        <div className="h-px bg-border/30" />

        {/* Groupe : Cycle */}
        <div className="flex flex-col bg-orange-500/5 rounded-xl border border-orange-500/10 shadow-sm transition-all hover:bg-orange-500/[0.08]">
          <button 
            type="button"
            onClick={() => setIsCycleExpanded(!isCycleExpanded)}
            className="flex items-center justify-between w-full p-2.5 text-left outline-none"
          >
            <h4 className="text-[10px] font-black text-orange-500/60 uppercase tracking-[0.2em] pl-1">Groupe : Cycle</h4>
            {isCycleExpanded ? <ChevronDown size={14} className="text-orange-500/40" /> : <ChevronRight size={14} className="text-orange-500/40" />}
          </button>
          <div className={`px-4 pb-4 transition-all duration-300 origin-top flex flex-col gap-4 ${isCycleExpanded ? 'opacity-100' : 'hidden opacity-0 overflow-hidden'}`}>
            
            {/* Consolidated Cycle Check */}
            <div className={`flex items-end gap-3 transition-all duration-300 ${!['cycleCheck', 'day', 'night', 'turn'].includes(type) ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}>
              <div className="flex flex-col gap-1.5 pb-2">
                <label htmlFor="cycle-enabled" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1 cursor-pointer">Actif</label>
                <div className="flex items-center h-[38px] justify-center px-1">
                  <input
                    id="cycle-enabled"
                    type="checkbox"
                    checked={['cycleCheck', 'day', 'night', 'turn'].includes(type) && enabled}
                    onChange={() => {
                      if (!['cycleCheck', 'day', 'night', 'turn'].includes(type)) {
                        setType('cycleCheck');
                        setCycleCheckType('$Jour');
                        setEnabled(true);
                        setOperator('=');
                      } else {
                        setEnabled(!enabled);
                      }
                    }}
                    className="w-5 h-5 rounded border-border text-orange-500 focus:ring-orange-500 transition-all cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1 flex-1">
                <label htmlFor="cycle-variable" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Variable</label>
                <input
                  id="cycle-variable"
                  list="cycle-variable-list"
                  disabled={!enabled || !['cycleCheck', 'day', 'night', 'turn'].includes(type)}
                  value={
                    type === 'day' ? '$Jour' :
                    type === 'night' ? '$Nuit' :
                    type === 'turn' ? '$Cycle' :
                    (cycleCheckType || '$Jour')
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    setType('cycleCheck');
                    setCycleCheckType(val);
                  }}
                  placeholder="Ex: $Temp1"
                  className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-sm outline-none transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <datalist id="cycle-variable-list">
                  <option value="$Jour">$Jour</option>
                  <option value="$Nuit">$Nuit</option>
                  <option value="$Cycle">$Cycle</option>
                  <option value="$Ordre">$Ordre</option>
                  <option value="$Parité">$Parité (1=Impair, 0=Pair)</option>
                  <option value="$Phase">$Phase (1=Nuit, 0=Jour)</option>
                  <option value="$Timer">$Timer (Secondes restantes)</option>
                  <option value="$NbEnLigne">$NbEnLigne (Joueurs connectés)</option>
                  <option value="$NbTotal">$NbTotal (Joueurs total)</option>
                  <option value="$NbVivants">$NbVivants (Joueurs en vie)</option>
                  <option value="$NbMorts">$NbMorts (Joueurs morts)</option>
                </datalist>
              </div>

              <div className="flex flex-col gap-1 flex-[0.5]">
                <label htmlFor="cycle-operator" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">OP.</label>
                <select
                  id="cycle-operator"
                  disabled={!enabled || !['cycleCheck', 'day', 'night', 'turn'].includes(type)}
                  value={operator}
                  onChange={(e) => setOperator(e.target.value as ActionOperator)}
                  className="w-full bg-input border border-border rounded-lg px-2 py-2 text-sm outline-none transition-all font-mono font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">--</option>
                  <option value="=">=</option>
                  <option value="!=">!=</option>
                  <option value="<">&lt;</option>
                  <option value=">">&gt;</option>
                  <option value="<=">&lt;=</option>
                  <option value=">=">&gt;=</option>
                  <option value="modulo">Tous les</option>
                </select>
              </div>

              <div className="flex flex-col gap-1 flex-[0.7]">
                <label htmlFor="cycle-value" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Valeur</label>
                <input
                  id="cycle-value"
                  disabled={!enabled || !['cycleCheck', 'day', 'night', 'turn'].includes(type) || operator === ''}
                  type="number"
                  value={value}
                  onChange={(e) => setValue(parseInt(e.target.value) || 0)}
                  className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-sm outline-none transition-all shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-border/30" />

        {/* Groupe : Distance */}
        <div className="flex flex-col bg-orange-500/5 rounded-xl border border-orange-500/10 shadow-sm transition-all hover:bg-orange-500/[0.08]">
          <button 
            type="button"
            onClick={() => setIsDistanceExpanded(!isDistanceExpanded)}
            className="flex items-center justify-between w-full p-3 text-left outline-none"
          >
            <h4 className="text-[10px] font-black text-orange-500/60 uppercase tracking-[0.2em] pl-1">Groupe : Distance</h4>
            {isDistanceExpanded ? <ChevronDown size={14} className="text-orange-500/40" /> : <ChevronRight size={14} className="text-orange-500/40" />}
          </button>
          
          <div className={`px-4 pb-4 transition-all duration-300 origin-top flex flex-col gap-5 ${isDistanceExpanded ? 'opacity-100' : 'hidden opacity-0 overflow-hidden'}`}>
            
            <div className={`flex flex-col gap-4 transition-all duration-300 ${!['playerDistance', 'playerDistanceTag', 'playerDistancePastille', 'playerDistanceTeam', 'playerDistanceStatus', 'playerDistanceSelf', 'playerDistanceSelected'].includes(type) ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}>
              <div className="flex items-end gap-3">
                <div className="flex flex-col gap-1.5 pb-2">
                  <label htmlFor="distance-enabled" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1 cursor-pointer">Actif</label>
                  <div className="flex items-center h-[38px] justify-center">
                    <input
                      id="distance-enabled"
                      type="checkbox"
                      checked={['playerDistance', 'playerDistanceTag', 'playerDistancePastille', 'playerDistanceTeam', 'playerDistanceStatus', 'playerDistanceSelf', 'playerDistanceSelected'].includes(type) && enabled}
                      onChange={() => {
                        if (!['playerDistance', 'playerDistanceTag', 'playerDistancePastille', 'playerDistanceTeam', 'playerDistanceStatus', 'playerDistanceSelf', 'playerDistanceSelected'].includes(type)) {
                          setType('playerDistance');
                          setEnabled(true);
                        } else {
                          setEnabled(!enabled);
                        }
                      }}
                      className="w-5 h-5 rounded border-border text-orange-500 focus:ring-orange-500 transition-all cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1 flex-[0.6]">
                  <label htmlFor="distance-unit" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Unité</label>
                  <select
                    id="distance-unit"
                    disabled={!['playerDistance', 'playerDistanceTag', 'playerDistancePastille', 'playerDistanceTeam', 'playerDistanceStatus', 'playerDistanceSelf', 'playerDistanceSelected'].includes(type) || !enabled}
                    value={distanceUnit || 'logical'}
                    onChange={(e) => setDistanceUnit(e.target.value as any)}
                    className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-sm outline-none transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="logical">LOGIQUE (Index)</option>
                    <option value="physical">PHYSIQUE (Pixels)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-1 flex-1">
                  <label htmlFor="distance-source-player" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Joueur Source</label>
                  <select
                    id="distance-source-player"
                    disabled={!['playerDistance', 'playerDistanceTag', 'playerDistancePastille', 'playerDistanceTeam', 'playerDistanceStatus', 'playerDistanceSelf', 'playerDistanceSelected'].includes(type) || !enabled}
                    value={distanceFromPlayerId || '$Joueur'}
                    onChange={(e) => setDistanceFromPlayerId(e.target.value)}
                    className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-sm outline-none transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="$Joueur">$Joueur</option>
                    <option value="$Selected">Joueur(s) sélectionné(s)</option>
                  </select>
                </div>

                <div className="flex items-center h-[38px] pb-1.5 px-1 min-w-fit">
                  <ChevronRight size={14} className="text-muted-foreground opacity-30 mt-4" />
                </div>

                <div className="flex flex-col gap-1 flex-1">
                  <label htmlFor="distance-target-type" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Type Cible</label>
                  <select
                    id="distance-target-type"
                    disabled={!['playerDistance', 'playerDistanceTag', 'playerDistancePastille', 'playerDistanceTeam', 'playerDistanceStatus', 'playerDistanceSelf', 'playerDistanceSelected'].includes(type) || !enabled}
                    value={
                      type === 'playerDistance' ? 'ROLE' :
                      type === 'playerDistanceTag' ? 'TAG' :
                      type === 'playerDistancePastille' ? 'PASTILLE' :
                      type === 'playerDistanceTeam' ? 'TEAM' :
                      type === 'playerDistanceStatus' ? 'STATUS' : 
                      type === 'playerDistanceSelf' ? 'SELF' :
                      type === 'playerDistanceSelected' ? 'SELECTED' : 'ROLE'
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'ROLE') setType('playerDistance');
                      else if (val === 'TAG') setType('playerDistanceTag');
                      else if (val === 'PASTILLE') setType('playerDistancePastille');
                      else if (val === 'TEAM') setType('playerDistanceTeam');
                      else if (val === 'STATUS') setType('playerDistanceStatus');
                      else if (val === 'SELF') setType('playerDistanceSelf');
                      else if (val === 'SELECTED') setType('playerDistanceSelected');
                    }}
                    className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-sm outline-none transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="ROLE">RÔLE CIBLE</option>
                    <option value="TAG">TAG CIBLE</option>
                    <option value="PASTILLE">PASTILLE CIBLE</option>
                    <option value="TEAM">ÉQUIPE CIBLE</option>
                    <option value="STATUS">STATUT CIBLE</option>
                    <option value="SELF">SOI-MÊME</option>
                    <option value="SELECTED">SÉLECTION</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1 flex-1">
                  <label htmlFor="distance-target-value" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Cible</label>
                  {type === 'playerDistance' ? (
                    <select
                      id="distance-target-value"
                      disabled={!enabled}
                      value={distanceTargetRoleId || ''}
                      onChange={(e) => setDistanceTargetRoleId(e.target.value)}
                      className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-sm outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {[...roles].sort((a,b) => a.name.localeCompare(b.name)).map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  ) : type === 'playerDistanceTag' ? (
                    <select
                      id="distance-target-value"
                      disabled={!enabled}
                      value={tagId || ''}
                      onChange={(e) => setTagId(e.target.value)}
                      className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-sm outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {[...tags].sort((a,b) => a.name.localeCompare(b.name)).map(tag => (
                        <option key={tag.id} value={tag.id}>{tag.name}</option>
                      ))}
                    </select>
                  ) : type === 'playerDistancePastille' ? (
                    <div id="distance-target-value" className="flex flex-wrap gap-1 bg-input border border-border rounded-lg p-1 max-h-24 overflow-y-auto custom-scrollbar disabled:opacity-50 disabled:cursor-not-allowed">
                      {allIcons.map((iconName: string) => {
                        const IconComp = (icons as any)[iconName];
                        if (!IconComp) return null;
                        return (
                          <button
                            key={iconName}
                            disabled={!enabled}
                            type="button"
                            onClick={() => setPastilleIcon(iconName)}
                            className={`p-1 rounded transition-colors flex items-center justify-center ${
                              pastilleIcon === iconName
                                ? 'bg-orange-500 text-white shadow-sm'
                                : 'hover:bg-accent text-muted-foreground'
                            }`}
                            title={iconName}
                            aria-label={iconName}
                          >
                            <IconComp size={14} />
                          </button>
                        );
                      })}
                    </div>
                  ) : type === 'playerDistanceTeam' ? (
                    <select
                      id="distance-target-value"
                      disabled={!enabled}
                      value={distanceTargetTeamId || ''}
                      onChange={(e) => setDistanceTargetTeamId(e.target.value)}
                      className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-sm outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {[...teams].sort((a,b) => a.name.localeCompare(b.name)).map(team => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  ) : type === 'playerDistanceStatus' ? (
                    <select
                      id="distance-target-value"
                      disabled={!enabled}
                      value={distanceTargetStatus || 'alive'}
                      onChange={(e) => setDistanceTargetStatus(e.target.value as any)}
                      className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-sm outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                    >
                      <option value="alive">VIVANT</option>
                      <option value="dead">MORT</option>
                    </select>
                  ) : type === 'playerDistanceSelf' ? (
                    <div className="h-[38px] bg-input border border-border rounded-lg px-2 py-1.5 text-sm opacity-50 italic flex items-center font-bold text-orange-500">
                      $Joueur
                    </div>
                  ) : type === 'playerDistanceSelected' ? (
                    <select
                      id="distance-target-value"
                      disabled={!enabled}
                      value={distanceTargetRoleId || ''}
                      onChange={(e) => setDistanceTargetRoleId(e.target.value)}
                      className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-sm outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {[...roles].sort((a,b) => a.name.localeCompare(b.name)).map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="h-[38px] bg-input border border-border rounded-lg px-2 py-1.5 text-sm opacity-50 italic flex items-center">
                      Sélectionnez un type...
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center h-[38px] pb-1.5 px-1 min-w-fit">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase whitespace-nowrap mt-4">entre</span>
                </div>

                <div className="flex flex-col gap-1 flex-1">
                  <label htmlFor="distance-min" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Min {distanceUnit === 'physical' ? '(px)' : '(idx)'}</label>
                  <input
                    id="distance-min"
                    disabled={!['playerDistance', 'playerDistanceTag', 'playerDistancePastille', 'playerDistanceTeam', 'playerDistanceStatus', 'playerDistanceSelf', 'playerDistanceSelected'].includes(type) || !enabled}
                    type="number"
                    value={minValue}
                    onChange={(e) => setMinValue(parseInt(e.target.value) || 0)}
                    className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm outline-none transition-all shadow-inner disabled:opacity-50 disabled:cursor-not-allowed text-center"
                  />
                </div>

                <div className="flex items-center h-[38px] pb-1.5 px-1 min-w-fit">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase whitespace-nowrap mt-4">et</span>
                </div>

                <div className="flex flex-col gap-1 flex-1">
                  <label htmlFor="distance-max" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Max {distanceUnit === 'physical' ? '(px)' : '(idx)'}</label>
                  <input
                    id="distance-max"
                    disabled={!['playerDistance', 'playerDistanceTag', 'playerDistancePastille', 'playerDistanceTeam', 'playerDistanceStatus', 'playerDistanceSelf', 'playerDistanceSelected'].includes(type) || !enabled}
                    type="number"
                    value={maxValue}
                    onChange={(e) => setMaxValue(parseInt(e.target.value) || 0)}
                    className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm outline-none transition-all shadow-inner disabled:opacity-50 disabled:cursor-not-allowed text-center"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-border/30" />

        {/* Groupe : Identité */}
        <div className="flex flex-col bg-orange-500/5 rounded-xl border border-orange-500/10 shadow-sm transition-all hover:bg-orange-500/[0.08]">
          <button 
            type="button"
            onClick={() => setIsIdentityExpanded(!isIdentityExpanded)}
            className="flex items-center justify-between w-full p-3 text-left outline-none"
          >
            <h4 className="text-[10px] font-black text-orange-500/60 uppercase tracking-[0.2em] pl-1">Groupe : Identité</h4>
            {isIdentityExpanded ? <ChevronDown size={14} className="text-orange-500/40" /> : <ChevronRight size={14} className="text-orange-500/40" />}
          </button>
          
          <div className={`px-4 pb-4 transition-all duration-300 origin-top flex flex-col gap-5 ${isIdentityExpanded ? 'opacity-100' : 'hidden opacity-0 overflow-hidden'}`}>
            
            {/* Consolidated Identity Selection */}
            <div className={`flex items-end gap-3 transition-all duration-300 ${!type.startsWith('player') && type !== 'roleTeamCheck' ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}>
              <div className="flex flex-col gap-1.5 pb-2">
                <label htmlFor="identity-enabled" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1 cursor-pointer">Actif</label>
                <div className="flex items-center h-[38px] justify-center">
                  <span className="text-[11px] font-black text-muted-foreground mr-1.5 opacity-50">2.</span>
                  <input
                    id="identity-enabled"
                    type="checkbox"
                    checked={['playerSelection', 'playerSelectionRole', 'playerSelectionTag', 'playerSelectionPastille', 'playerSelectionTeam', 'playerSelectionStatus', 'playerSelectionRoleAndTeam', 'playerRole', 'playerTag', 'playerPastille'].includes(type) && enabled}
                    onChange={() => {
                      if (!['playerSelection', 'playerSelectionRole', 'playerSelectionTag', 'playerSelectionPastille', 'playerSelectionTeam', 'playerSelectionStatus', 'playerSelectionRoleAndTeam', 'playerRole', 'playerTag', 'playerPastille'].includes(type)) {
                        setType('playerSelectionRole');
                        setEnabled(true);
                        setOperator('=');
                      } else {
                        setEnabled(!enabled);
                      }
                    }}
                    className="w-5 h-5 rounded border-border text-orange-500 focus:ring-orange-500 transition-all cursor-pointer"
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-1 flex-[1.2]">
                <label htmlFor="identity-selection-type" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Joueur</label>
                <select
                  id="identity-selection-type"
                  disabled={!['playerSelection', 'playerSelectionRole', 'playerSelectionTag', 'playerSelectionPastille', 'playerSelectionTeam', 'playerSelectionStatus', 'playerSelectionRoleAndTeam', 'playerRole', 'playerTag', 'playerPastille'].includes(type) || !enabled}
                  value={selectionType || 'all'}
                  onChange={(e) => setSelectionType(e.target.value as any)}
                  className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-sm outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="first">Le premier joueur (ordre croissant)</option>
                  <option value="last">Le dernier joueur (ordre décroissant)</option>
                  <option value="all">Tous les joueurs</option>
                  <option value="callOrder">Le(s) joueur(s) de l'ordre d'appel ($Ordre)</option>
                  <option value="numeric">Numérique (Sélection par ordre)</option>
                  <option value="random">Aléatoire (Un seul joueur)</option>
                </select>
                {selectionType === 'numeric' && (
                  <input
                    id="identity-numeric-index"
                    disabled={!['playerSelection', 'playerSelectionRole', 'playerSelectionTag', 'playerSelectionPastille', 'playerSelectionTeam', 'playerSelectionStatus', 'playerSelectionRoleAndTeam', 'playerRole', 'playerTag', 'playerPastille'].includes(type) || !enabled}
                    type="number"
                    min="1"
                    value={value || 1}
                    onChange={(e) => setValue(parseInt(e.target.value) || 1)}
                    className="w-full mt-1.5 bg-input border border-border rounded-lg px-2 py-1 text-xs outline-none transition-all shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Ordre..."
                    aria-label="Index de sélection numérique"
                  />
                )}
              </div>

              <div className="flex flex-col gap-1 flex-[0.5]">
                <label htmlFor="identity-operator" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Op.</label>
                <select
                  id="identity-operator"
                  disabled={!['playerSelection', 'playerSelectionRole', 'playerSelectionTag', 'playerSelectionPastille', 'playerSelectionTeam', 'playerSelectionStatus', 'playerSelectionRoleAndTeam', 'playerRole', 'playerTag', 'playerPastille'].includes(type) || !enabled}
                  value={operator}
                  onChange={(e) => setOperator(e.target.value as ActionOperator)}
                  className="w-full bg-input border border-border rounded-lg px-2 py-2 text-sm outline-none transition-all font-mono font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="=">=</option>
                  <option value="!=">!=</option>
                </select>
              </div>

              <div className="flex flex-col gap-1 flex-1">
                <label htmlFor="identity-target-type" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Type</label>
                <select
                  id="identity-target-type"
                  disabled={!['playerSelection', 'playerSelectionRole', 'playerSelectionTag', 'playerSelectionPastille', 'playerSelectionTeam', 'playerSelectionStatus', 'playerSelectionRoleAndTeam', 'playerRole', 'playerTag', 'playerPastille'].includes(type) || !enabled}
                  value={
                    type === 'playerSelectionRole' || type === 'playerSelection' ? 'ROLE' :
                    type === 'playerSelectionTag' ? 'TAG' :
                    type === 'playerSelectionPastille' ? 'PASTILLE' :
                    type === 'playerSelectionTeam' ? 'EQUIPE' : 
                    type === 'playerSelectionStatus' ? 'STATUT' :
                    type === 'playerSelectionRoleAndTeam' ? 'ROLE+EQUIPE' : 'ROLE'
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'ROLE') setType('playerSelectionRole');
                    else if (val === 'TAG') setType('playerSelectionTag');
                    else if (val === 'PASTILLE') setType('playerSelectionPastille');
                    else if (val === 'EQUIPE') {
                      setType('playerSelectionTeam');
                      if (!selectionTeamId && teams.length > 0) setSelectionTeamId(teams[0].id);
                    }
                    else if (val === 'STATUT') setType('playerSelectionStatus');
                    else if (val === 'ROLE+EQUIPE') {
                      setType('playerSelectionRoleAndTeam');
                      if (!selectionRoleId && roles.length > 0) setSelectionRoleId(roles[0].id);
                      if (!selectionTeamId && teams.length > 0) setSelectionTeamId(teams[0].id);
                    }
                  }}
                  className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-sm outline-none transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                   <option value="ROLE">RÔLE</option>
                   <option value="TAG">TAG</option>
                   <option value="PASTILLE">PASTILLE</option>
                   <option value="EQUIPE">EQUIPE</option>
                   <option value="STATUT">STATUT</option>
                   <option value="ROLE+EQUIPE">RÔLE + ÉQUIPE</option>
                </select>
              </div>

              <div className="flex flex-col gap-1 flex-1">
                <label htmlFor="identity-selection-value" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Sélection</label>
                {type === 'playerSelectionRole' || type === 'playerSelection' ? (
                  <select
                    id="identity-selection-value"
                    disabled={!enabled}
                    value={selectionRoleId || ''}
                    onChange={(e) => setSelectionRoleId(e.target.value)}
                    className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-sm outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                ) : type === 'playerSelectionTag' ? (
                  <select
                    id="identity-selection-value"
                    disabled={!enabled}
                    value={tagId || ''}
                    onChange={(e) => setTagId(e.target.value)}
                    className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-sm outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {[...tags].sort((a,b) => a.name.localeCompare(b.name)).map(tag => (
                      <option key={tag.id} value={tag.id}>{tag.name}</option>
                    ))}
                  </select>
                ) : type === 'playerSelectionPastille' ? (
                  <div className="flex items-center gap-2">
                    <select
                      id="identity-selection-value"
                      disabled={!enabled}
                      value={pastilleIcon || ''}
                      onChange={(e) => setPastilleIcon(e.target.value)}
                      className="w-full bg-input border border-border rounded-lg px-2 py-2 text-sm outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {allIcons.map((icon: string) => (
                        <option key={icon} value={icon}>{icon}</option>
                      ))}
                    </select>
                    {pastilleIcon && (icons as any)[pastilleIcon] && (
                      <div className="w-9 h-9 flex items-center justify-center bg-muted rounded-lg border border-border p-1 shadow-inner shrink-0">
                        {React.createElement((icons as any)[pastilleIcon], { size: 20, className: "text-orange-500" })}
                      </div>
                    )}
                  </div>
                ) : type === 'playerSelectionTeam' ? (
                  <select
                    id="identity-selection-value"
                    disabled={!enabled}
                    value={selectionTeamId || ''}
                    onChange={(e) => setSelectionTeamId(e.target.value)}
                    className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-sm outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Aucune --</option>
                    {[...teams].sort((a,b) => a.name.localeCompare(b.name)).map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                  ) : type === 'playerSelectionStatus' ? (
                    <select
                      id="identity-selection-value"
                      disabled={!enabled}
                      value={distanceTargetStatus || 'alive'}
                      onChange={(e) => setDistanceTargetStatus(e.target.value as any)}
                      className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-sm outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                    >
                      <option value="alive">VIVANT</option>
                      <option value="dead">MORT</option>
                    </select>
                  ) : type === 'playerSelectionRoleAndTeam' ? (
                    <div className="flex gap-2">
                      <select
                        id="identity-selection-role"
                        disabled={!enabled}
                        value={selectionRoleId || ''}
                        onChange={(e) => setSelectionRoleId(e.target.value)}
                        className="flex-1 bg-input border border-border rounded-lg px-2 py-1.5 text-sm outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {roles.map(role => (
                          <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                      </select>
                      <select
                        id="identity-selection-team"
                        disabled={!enabled}
                        value={selectionTeamId || ''}
                        onChange={(e) => setSelectionTeamId(e.target.value)}
                        className="flex-1 bg-input border border-border rounded-lg px-2 py-1.5 text-sm outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">-- Aucune --</option>
                        {[...teams].sort((a,b) => a.name.localeCompare(b.name)).map(team => (
                          <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                  <div className="h-[38px] bg-input border border-border rounded-lg px-2 py-1.5 text-sm opacity-50 italic flex items-center">
                    Sélectionnez un type...
                  </div>
                )}
              </div>
            </div>

            <div className="h-px bg-border/20 my-1" />

            {/* Nouveau : Rôle vs Équipe */}
            <div className={`flex items-end gap-3 transition-all duration-300 ${type !== 'roleTeamCheck' ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}>
              <div className="flex flex-col gap-1.5 pb-2">
                <label htmlFor="roleteam-enabled" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1 cursor-pointer">Actif</label>
                <div className="flex items-center h-[38px] justify-center">
                  <span className="text-[11px] font-black text-muted-foreground mr-1.5 opacity-50">3.</span>
                  <input
                    id="roleteam-enabled"
                    type="checkbox"
                    checked={type === 'roleTeamCheck' && enabled}
                    onChange={() => {
                      if (type !== 'roleTeamCheck') {
                        setType('roleTeamCheck');
                        setEnabled(true);
                        setOperator('=');
                        if (!roleId && roles.length > 0) setRoleId(roles[0].id);
                        if (!teamId && teams.length > 0) setTeamId(teams[0].id);
                      } else {
                        setEnabled(!enabled);
                      }
                    }}
                    className="w-5 h-5 rounded border-border text-orange-500 focus:ring-orange-500 transition-all cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1 flex-1">
                <label htmlFor="roleteam-role" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Rôle</label>
                <select
                  id="roleteam-role"
                  disabled={type !== 'roleTeamCheck' || !enabled}
                  value={roleId || ''}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-sm outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                >
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1 flex-[0.5]">
                <label htmlFor="roleteam-operator" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Op.</label>
                <select
                  id="roleteam-operator"
                  disabled={type !== 'roleTeamCheck' || !enabled}
                  value={operator}
                  onChange={(e) => setOperator(e.target.value as ActionOperator)}
                  className="w-full bg-input border border-border rounded-lg px-2 py-2 text-sm outline-none transition-all font-mono font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="=">=</option>
                  <option value="!=">!=</option>
                </select>
              </div>

              <div className="flex flex-col gap-1 flex-1">
                <label htmlFor="roleteam-team" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Équipe</label>
                <select
                  id="roleteam-team"
                  disabled={type !== 'roleTeamCheck' || !enabled}
                  value={teamId || ''}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-sm outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                >
                  <option value="">-- Aucune --</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1 p-3.5 border-t border-border bg-card">
        <button
          onClick={handleClose}
          className="flex-1 py-1.5 px-4 bg-muted hover:bg-accent text-foreground text-xs font-bold rounded-lg transition-colors border border-border"
        >
          Annuler
        </button>
        <button
          onClick={handleOK}
          className="flex-1 py-1.5 px-4 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
        >
          <Check size={14} />
          OK
        </button>
      </div>
    </div>
  );
};
