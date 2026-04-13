import React, { useState, useRef } from 'react';
import { useVttStore } from '../store';
import { CheckSquare, X, ArrowUpRight } from 'lucide-react';
import { ChecklistContent } from './ChecklistContent';

export const ChecklistWindow: React.FC = () => {
  const { checklistState, setChecklistState } = useVttStore();
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);

  if (!checklistState.isOpen || !checklistState.isDetached) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!(e.target as HTMLElement).closest('.drag-handle')) return;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: checklistState.x,
      initY: checklistState.y
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setChecklistState({
      x: dragRef.current.initX + dx,
      y: dragRef.current.initY + dy
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
      dragRef.current = null;
    }
  };

  return (
    <div
      className="fixed bg-card border border-border shadow-2xl rounded-xl overflow-hidden flex flex-col z-[150] w-[350px] touch-none"
      style={{
        left: checklistState.x,
        top: checklistState.y,
        transition: isDragging ? 'none' : 'opacity 0.2s',
        maxHeight: '70vh'
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="drag-handle flex items-center justify-between bg-muted p-3 cursor-grab active:cursor-grabbing border-b border-border">
        <div className="flex items-center gap-2 text-sm font-bold text-green-500 select-none">
          <CheckSquare size={16} /> Checklist pour le MJ
        </div>
        <div className="flex items-center gap-1">
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              setChecklistState({ isDetached: false });
            }}
            className="p-1.5 hover:bg-accent hover:text-foreground text-muted-foreground rounded transition-colors text-[10px] font-bold uppercase tracking-tighter flex items-center gap-1"
            title="Rattacher au panneau"
          >
            <ArrowUpRight size={12} className="rotate-180" /> Rattacher
          </button>
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              setChecklistState({ isOpen: false });
            }}
            className="p-1 hover:bg-destructive hover:text-white text-muted-foreground rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="p-3 overflow-y-auto custom-scrollbar flex-1 bg-background/50">
        <ChecklistContent />
      </div>
    </div>
  );
};
