import React, { useState, useRef, useEffect } from 'react';
import { useVttStore } from '../store';
import { X, Zap, Save, Plus, Trash2 } from 'lucide-react';

export const ActionCreatorWindow: React.FC = () => {
  const { 
    actionCreatorState, 
    setActionCreatorState, 
    addAction,
    setActionConditionCreatorState,
    pendingActionConditions,
    clearPendingConditions
  } = useVttStore();
  
  const [actionName, setActionName] = useState('');
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
    setActionCreatorState({ isOpen: false });
    setActionName('');
    clearPendingConditions();
  };

  const handleSave = () => {
    if (!actionName.trim()) return;
    addAction({ 
      name: actionName,
      conditions: [...pendingActionConditions]
    });
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
          <span className="font-bold text-sm tracking-tight text-foreground">Ajouter Action</span>
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

          <div className="flex flex-col gap-1.5 min-h-[40px] max-h-[160px] overflow-y-auto custom-scrollbar bg-muted/20 border border-border/50 rounded-lg p-2">
            {pendingActionConditions.length === 0 ? (
              <p className="text-[10px] text-muted-foreground italic text-center py-2">Aucune condition définie.</p>
            ) : (
              pendingActionConditions.map((condition) => (
                <div key={condition.id} className="flex items-center justify-between gap-2 bg-background border border-border/50 rounded p-1.5 shadow-sm text-[10px] font-medium animate-in slide-in-from-left-2 duration-200">
                  <div className="flex items-center gap-2">
                    <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase font-bold text-[9px]">
                      {condition.type === 'day' ? 'Jour' : condition.type === 'night' ? 'Nuit' : 'Tour'}
                    </span>
                    <span className="font-mono font-bold text-muted-foreground">{condition.operator}</span>
                    <span className="font-bold">{condition.value}</span>
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
