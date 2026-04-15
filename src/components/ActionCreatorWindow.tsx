import React, { useState, useRef, useEffect } from 'react';
import { useVttStore } from '../store';
import { X, Zap, Save } from 'lucide-react';

export const ActionCreatorWindow: React.FC = () => {
  const { 
    actionCreatorState, 
    setActionCreatorState, 
    addAction 
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
  };

  const handleSave = () => {
    if (!actionName.trim()) return;
    addAction({ name: actionName });
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
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleClose();
            }}
          />
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
