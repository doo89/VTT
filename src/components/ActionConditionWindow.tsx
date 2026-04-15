import React, { useState, useRef, useEffect } from 'react';
import { useVttStore } from '../store';
import { X, Check } from 'lucide-react';
import type { ActionConditionType, ActionOperator } from '../types';

export const ActionConditionWindow: React.FC = () => {
  const { 
    actionConditionCreatorState, 
    setActionConditionCreatorState, 
    addPendingCondition,
    updatePendingCondition,
    pendingActionConditions
  } = useVttStore();
  
  const [type, setType] = useState<ActionConditionType>('day');
  const [operator, setOperator] = useState<ActionOperator>('=');
  const [value, setValue] = useState(1);
  const [enabled, setEnabled] = useState(true);

  const isEditing = !!actionConditionCreatorState.editingConditionId;

  useEffect(() => {
    if (isEditing) {
      const condition = pendingActionConditions.find(c => c.id === actionConditionCreatorState.editingConditionId);
      if (condition) {
        setType(condition.type);
        setOperator(condition.operator);
        setValue(condition.value);
        setEnabled(condition.enabled ?? true);
      }
    } else {
      setType('day');
      setOperator('=');
      setValue(1);
      setEnabled(true);
    }
  }, [isEditing, actionConditionCreatorState.editingConditionId, pendingActionConditions]);
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
    if (isEditing && actionConditionCreatorState.editingConditionId) {
      updatePendingCondition(actionConditionCreatorState.editingConditionId, { type, operator, value, enabled });
    } else {
      addPendingCondition({ type, operator, value, enabled });
    }
    handleClose();
  };

  return (
    <div 
      className={`fixed z-[3100] w-96 bg-card border-2 border-orange-500/30 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 ${isDragging ? 'opacity-90' : ''}`}
      style={{
        left: actionConditionCreatorState.x,
        top: actionConditionCreatorState.y,
      }}
    >
      <div 
        className="px-4 py-3 bg-orange-500/10 border-b border-orange-500/20 flex items-center justify-between cursor-move group select-none"
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

      <div className="p-5 flex flex-col gap-4 bg-background/50">
        <div className="flex items-end gap-3">
          <div className="flex flex-col gap-1.5 pb-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Actif</label>
            <div className="flex items-center h-[38px] justify-center">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-5 h-5 rounded border-border text-orange-500 focus:ring-orange-500 transition-all cursor-pointer"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Cycle</label>
            <select
              disabled={!enabled}
              value={type}
              onChange={(e) => setType(e.target.value as ActionConditionType)}
              className="w-full bg-input border border-border rounded-lg px-2 py-2 text-sm outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="day">Jour</option>
              <option value="night">Nuit</option>
              <option value="turn">Tour</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5 flex-[0.5]">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Op.</label>
            <select
              disabled={!enabled}
              value={operator}
              onChange={(e) => setOperator(e.target.value as ActionOperator)}
              className="w-full bg-input border border-border rounded-lg px-2 py-2 text-sm outline-none transition-all font-mono font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="=">=</option>
              <option value="<">&lt;</option>
              <option value=">">&gt;</option>
              <option value="!=">!=</option>
              <option value="<=">&lt;=</option>
              <option value=">=">&gt;=</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5 flex-[0.7]">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Valeur</label>
            <input
              disabled={!enabled}
              type="number"
              value={value}
              onChange={(e) => setValue(parseInt(e.target.value) || 0)}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm outline-none transition-all shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
            />
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
            onClick={handleOK}
            className="flex-1 py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
          >
            <Check size={14} />
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
