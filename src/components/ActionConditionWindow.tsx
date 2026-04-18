import React, { useState, useRef, useEffect } from 'react';
import { useVttStore } from '../store';
import { X, Check, icons, ChevronDown, ChevronRight } from 'lucide-react';
import type { ActionConditionType, ActionOperator } from '../types';
import { TAG_ICONS } from './EditingModal';

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
    setPendingRecurring,
    roles,
    tags
  } = useVttStore();
  
  const [type, setType] = useState<ActionConditionType>('day');
  const [operator, setOperator] = useState<ActionOperator>('=');
  const [value, setValue] = useState(1);
  const [enabled, setEnabled] = useState(true);
  const [roleId, setRoleId] = useState<string | null>(null);
  const [tagId, setTagId] = useState<string | null>(null);
  const [pastilleIcon, setPastilleIcon] = useState<string | null>(null);
  const [selectionType, setSelectionType] = useState<'first' | 'last' | 'all' | null>('first');
  const [selectionRoleId, setSelectionRoleId] = useState<string | null>(null);
  const [distanceFromPlayerId, setDistanceFromPlayerId] = useState<string | null>('$Joueur');
  const [distanceTargetRoleId, setDistanceTargetRoleId] = useState<string | null>(null);

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
        setEnabled(condition.enabled ?? true);
        setRoleId(condition.roleId || (roles[0]?.id || null));
        setTagId(condition.tagId || (tags[0]?.id || null));
        setPastilleIcon(condition.pastilleIcon || allIcons[0]);
        setSelectionType(condition.selectionType || 'first');
        setSelectionRoleId(condition.selectionRoleId || (roles[0]?.id || null));
        setDistanceFromPlayerId(condition.distanceFromPlayerId || '$Joueur');
        setDistanceTargetRoleId(condition.distanceTargetRoleId || (roles[0]?.id || null));
      }
    } else {
      setType('day');
      setOperator('=');
      setValue(1);
      setEnabled(true);
      setRoleId(roles[0]?.id || null);
      setTagId(tags[0]?.id || null);
      setPastilleIcon(allIcons[0]);
      setSelectionType('first');
      setSelectionRoleId(roles[0]?.id || null);
      setDistanceFromPlayerId('$Joueur');
      setDistanceTargetRoleId(roles[0]?.id || null);
    }
  }, [isEditing, actionConditionCreatorState.editingConditionId, pendingActionConditions, roles, tags, allIcons]);

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number, y: number, startX: number, startY: number } | null>(null);

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
    const conditionData = { 
      type, 
      operator, 
      value, 
      enabled, 
      roleId: type === 'playerRole' ? roleId : null,
      tagId: type === 'playerTag' ? tagId : null,
      pastilleIcon: type === 'playerPastille' ? pastilleIcon : null,
      selectionType: type === 'playerSelection' ? selectionType : null,
      selectionRoleId: type === 'playerSelection' ? selectionRoleId : null,
      distanceFromPlayerId: type === 'playerDistance' ? distanceFromPlayerId : null,
      distanceTargetRoleId: type === 'playerDistance' ? distanceTargetRoleId : null
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
      className={`fixed z-[3100] w-[576px] bg-card border-2 border-orange-500/30 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 ${isDragging ? 'opacity-90' : ''}`}
      style={{
        left: actionConditionCreatorState.x,
        top: actionConditionCreatorState.y,
      }}
    >
      <div 
        className="px-4 py-2 bg-orange-500/10 border-b border-orange-500/20 flex items-center justify-between cursor-move group select-none"
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
          <span className="font-bold text-sm tracking-tight text-foreground uppercase">Conditions d'actions</span>
        </div>
        <button 
          onClick={handleClose}
          onMouseDown={e => e.stopPropagation()}
          className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-full transition-all"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-3.5 flex flex-col gap-3.5 bg-background/50 overflow-y-auto max-h-[75vh]">
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
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-foreground">Une seule fois</span>
                <span className="text-[10px] text-muted-foreground">L'action se désactivera après sa première exécution réussie</span>
              </div>
              <input
                type="checkbox"
                checked={pendingActionOnce}
                onChange={(e) => setPendingOnce(e.target.checked)}
                className="w-5 h-5 rounded border-border text-orange-500 focus:ring-orange-500 transition-all cursor-pointer"
              />
            </div>
            <div className="h-px bg-border/20 my-1" />
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={pendingActionIsRecurring}
                onChange={(e) => setPendingRecurring(e.target.checked, pendingActionIntervalSeconds, pendingActionRepeatCount)}
                className="w-5 h-5 rounded border-border text-orange-500 focus:ring-orange-500 transition-all cursor-pointer shrink-0"
              />
              <div className={`flex items-center gap-1.5 text-xs transition-opacity duration-200 ${!pendingActionIsRecurring ? 'opacity-50 grayscale' : 'opacity-100'}`}>
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
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-border/30 -mt-2" />

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
          <div className={`px-2.5 pb-2.5 transition-all duration-300 origin-top flex flex-col gap-1.5 ${isCycleExpanded ? 'opacity-100' : 'hidden opacity-0 overflow-hidden'}`}>
            <div className={`flex items-end gap-3 transition-all duration-300 ${(type !== 'day' && type !== 'night' && type !== 'turn') ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}>
              <div className="flex flex-col gap-1.5 pb-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Actif</label>
                <div className="flex items-center h-[38px] justify-center">
                  <span className="text-[11px] font-black text-muted-foreground mr-1.5 opacity-50">1.</span>
                  <input
                    type="checkbox"
                    checked={(type === 'day' || type === 'night' || type === 'turn') && enabled}
                    onChange={() => {
                      if (type !== 'day' && type !== 'night' && type !== 'turn') {
                        setType('day');
                        setEnabled(true);
                      } else {
                        setEnabled(!enabled);
                      }
                    }}
                    className="w-5 h-5 rounded border-border text-orange-500 focus:ring-orange-500 transition-all cursor-pointer"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Cycle</label>
                <select
                  disabled={(type !== 'day' && type !== 'night' && type !== 'turn') || !enabled}
                  value={(type !== 'day' && type !== 'night' && type !== 'turn') ? 'day' : type}
                  onChange={(e) => setType(e.target.value as ActionConditionType)}
                  className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-sm outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="day">Jour</option>
                  <option value="night">Nuit</option>
                  <option value="turn">Tour</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 flex-[0.5]">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Op.</label>
                <select
                  disabled={(type !== 'day' && type !== 'night' && type !== 'turn') || !enabled}
                  value={operator}
                  onChange={(e) => setOperator(e.target.value as ActionOperator)}
                  className="w-full bg-input border border-border rounded-lg px-2 py-2 text-sm outline-none transition-all font-mono font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="=">=</option>
                  <option value="&lt;">&lt;</option>
                  <option value="&gt;">&gt;</option>
                  <option value="!=">!=</option>
                  <option value="&lt;=">&lt;=</option>
                  <option value="&gt;=">&gt;=</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5 flex-[0.7]">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Valeur</label>
                <input
                  disabled={(type !== 'day' && type !== 'night' && type !== 'turn') || !enabled}
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
        <div className="flex flex-col bg-blue-500/5 rounded-xl border border-blue-500/10 shadow-sm transition-all hover:bg-blue-500/[0.08]">
          <button 
            type="button"
            onClick={() => setIsDistanceExpanded(!isDistanceExpanded)}
            className="flex items-center justify-between w-full p-3 text-left outline-none"
          >
            <h4 className="text-[10px] font-black text-blue-500/60 uppercase tracking-[0.2em] pl-1">Groupe : Distance</h4>
            {isDistanceExpanded ? <ChevronDown size={14} className="text-blue-500/40" /> : <ChevronRight size={14} className="text-blue-500/40" />}
          </button>
          <div className={`px-3 pb-3 transition-all duration-300 origin-top ${isDistanceExpanded ? 'opacity-100' : 'hidden opacity-0 overflow-hidden'}`}>
            <div className={`flex items-end gap-3 transition-all duration-300 ${type !== 'playerDistance' ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}>
              <div className="flex flex-col gap-1.5 pb-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Actif</label>
                <div className="flex items-center h-[38px] justify-center">
                  <span className="text-[11px] font-black text-muted-foreground mr-1.5 opacity-50">5.</span>
                  <input
                    type="checkbox"
                    checked={type === 'playerDistance' && enabled}
                    onChange={() => {
                      if (type !== 'playerDistance') {
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
              <div className="flex flex-col gap-1 flex-[0.5]">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Dist.</label>
                <input
                  disabled={type !== 'playerDistance' || !enabled}
                  type="number"
                  value={type === 'playerDistance' ? value : 0}
                  onChange={(e) => setValue(parseInt(e.target.value) || 0)}
                  className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm outline-none transition-all shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="flex items-center h-[38px] pb-1.5 px-1 min-w-fit">
                <span className="text-[10px] font-bold text-muted-foreground uppercase whitespace-nowrap">de la position de :</span>
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Joueur</label>
                <select
                  disabled={type !== 'playerDistance' || !enabled}
                  value={distanceFromPlayerId || '$Joueur'}
                  onChange={(e) => setDistanceFromPlayerId(e.target.value)}
                  className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-sm outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="$Joueur">$Joueur</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Rôle</label>
                <select
                  disabled={type !== 'playerDistance' || !enabled}
                  value={distanceTargetRoleId || ''}
                  onChange={(e) => setDistanceTargetRoleId(e.target.value)}
                  className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-sm outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {[...roles].sort((a,b) => a.name.localeCompare(b.name)).map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

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
            <div className={`flex items-end gap-3 transition-all duration-300 ${type !== 'playerSelection' ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}>
              <div className="flex flex-col gap-1.5 pb-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Actif</label>
                <div className="flex items-center h-[38px] justify-center">
                  <span className="text-[11px] font-black text-muted-foreground mr-1.5 opacity-50">3.</span>
                  <input
                    type="checkbox"
                    checked={type === 'playerSelection' && enabled}
                    onChange={() => {
                      if (type !== 'playerSelection') {
                        setType('playerSelection');
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
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Joueur</label>
                <select
                  disabled={type !== 'playerSelection' || !enabled}
                  value={selectionType || 'first'}
                  onChange={(e) => setSelectionType(e.target.value as 'first' | 'last' | 'all')}
                  className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-sm outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="first">Le premier joueur (ordre croissant)</option>
                  <option value="last">Le dernier joueur (ordre décroissant)</option>
                  <option value="all">Tous les joueurs</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 flex-[0.5]">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Op.</label>
                <select
                  disabled={type !== 'playerSelection' || !enabled}
                  value={operator}
                  onChange={(e) => setOperator(e.target.value as ActionOperator)}
                  className="w-full bg-input border border-border rounded-lg px-2 py-2 text-sm outline-none transition-all font-mono font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="=">=</option>
                  <option value="!=">!=</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Rôle</label>
                <select
                  disabled={type !== 'playerSelection' || !enabled}
                  value={selectionRoleId || ''}
                  onChange={(e) => setSelectionRoleId(e.target.value)}
                  className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-sm outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="h-px bg-border/20 mx-2" />
            <div className={`flex items-end gap-3 transition-all duration-300 ${type !== 'playerRole' ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}>
              <div className="flex flex-col gap-1.5 pb-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Actif</label>
                <div className="flex items-center h-[38px] justify-center">
                  <span className="text-[11px] font-black text-muted-foreground mr-1.5 opacity-50">2.</span>
                  <input
                    type="checkbox"
                    checked={type === 'playerRole' && enabled}
                    onChange={() => {
                      if (type !== 'playerRole') {
                        setType('playerRole');
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
              <div className="flex flex-col gap-1 flex-[0.6]">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Ordre</label>
                <input
                  disabled={type !== 'playerRole' || !enabled}
                  type="number"
                  min="1"
                  value={type === 'playerRole' ? value : 1}
                  onChange={(e) => setValue(parseInt(e.target.value) || 1)}
                  className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-sm outline-none transition-all shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="flex flex-col gap-1 flex-[0.5]">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Op.</label>
                <select
                  disabled={type !== 'playerRole' || !enabled}
                  value={operator}
                  onChange={(e) => setOperator(e.target.value as ActionOperator)}
                  className="w-full bg-input border border-border rounded-lg px-2 py-2 text-sm outline-none transition-all font-mono font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="=">=</option>
                  <option value="!=">!=</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Rôle</label>
                <select
                  disabled={type !== 'playerRole' || !enabled}
                  value={roleId || ''}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-sm outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="h-px bg-border/20 mx-2" />
            <div className={`flex items-end gap-3 transition-all duration-300 ${type !== 'playerTag' ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}>
              <div className="flex flex-col gap-1.5 pb-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Actif</label>
                <div className="flex items-center h-[38px] justify-center">
                  <span className="text-[11px] font-black text-muted-foreground mr-1.5 opacity-50">4.</span>
                  <input
                    type="checkbox"
                    checked={type === 'playerTag' && enabled}
                    onChange={() => {
                      if (type !== 'playerTag') {
                        setType('playerTag');
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
              <div className="flex flex-col gap-1 flex-[0.6]">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Ordre</label>
                <input
                  disabled={type !== 'playerTag' || !enabled}
                  type="number"
                  min="1"
                  value={type === 'playerTag' ? value : 1}
                  onChange={(e) => setValue(parseInt(e.target.value) || 1)}
                  className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm outline-none transition-all shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="flex flex-col gap-1 flex-[0.5]">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Op.</label>
                <select
                  disabled={type !== 'playerTag' || !enabled}
                  value={operator}
                  onChange={(e) => setOperator(e.target.value as ActionOperator)}
                  className="w-full bg-input border border-border rounded-lg px-2 py-2 text-sm outline-none transition-all font-mono font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="=">=</option>
                  <option value="!=">!=</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Tag</label>
                <select
                  disabled={type !== 'playerTag' || !enabled}
                  value={tagId || ''}
                  onChange={(e) => setTagId(e.target.value)}
                  className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-sm outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {[...tags].sort((a,b) => a.name.localeCompare(b.name)).map(tag => (
                    <option key={tag.id} value={tag.id}>{tag.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="h-px bg-border/20 mx-2" />
            <div className={`flex items-end gap-3 transition-all duration-300 ${type !== 'playerPastille' ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}>
              <div className="flex flex-col gap-1.5 pb-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Actif</label>
                <div className="flex items-center h-[38px] justify-center">
                  <span className="text-[11px] font-black text-muted-foreground mr-1.5 opacity-50">6.</span>
                  <input
                    type="checkbox"
                    checked={type === 'playerPastille' && enabled}
                    onChange={() => {
                      if (type !== 'playerPastille') {
                        setType('playerPastille');
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
              <div className="flex flex-col gap-1 flex-[0.6]">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Ordre</label>
                <input
                  disabled={type !== 'playerPastille' || !enabled}
                  type="number"
                  min="1"
                  value={type === 'playerPastille' ? value : 1}
                  onChange={(e) => setValue(parseInt(e.target.value) || 1)}
                  className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm outline-none transition-all shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="flex flex-col gap-1 flex-[0.5]">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Op.</label>
                <select
                  disabled={type !== 'playerPastille' || !enabled}
                  value={operator}
                  onChange={(e) => setOperator(e.target.value as ActionOperator)}
                  className="w-full bg-input border border-border rounded-lg px-2 py-2 text-sm outline-none transition-all font-mono font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="=">=</option>
                  <option value="!=">!=</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Pastille</label>
                <div className="flex items-center gap-2">
                  <select
                    disabled={type !== 'playerPastille' || !enabled}
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
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1 p-3.5">
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
