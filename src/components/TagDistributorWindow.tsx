import React, { useRef, useState, useEffect } from 'react';
import { useVttStore } from '../store';
import { Tag, X, Move, GripHorizontal } from 'lucide-react';
import { icons } from 'lucide-react';

export const TagDistributorWindow: React.FC = () => {
  const { tagDistributorState, setTagDistributorState, tags } = useVttStore();
  const [isDragging, setIsDragging] = useState(false);
  const distributorRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number, y: number, startX: number, startY: number } | null>(null);

  const tagsInDistributor = tags.filter(tag => tag.isInDistributor);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragStartRef.current) return;
      
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      
      setTagDistributorState({
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
  }, [isDragging, setTagDistributorState]);

  if (!tagDistributorState.isDetached || tagsInDistributor.length === 0) return null;

  return (
    <div
      ref={distributorRef}
      className={`fixed z-[100] bg-background border border-border shadow-2xl rounded-lg overflow-hidden flex flex-col ${isDragging ? 'opacity-90' : ''}`}
      style={{
        left: tagDistributorState.x,
        top: tagDistributorState.y,
        width: 300,
        maxHeight: '60vh'
      }}
    >
      <div 
        className="bg-accent/50 p-2 flex items-center justify-between border-b border-border cursor-move cursor-grab active:cursor-grabbing select-none"
        onMouseDown={(e) => {
          setIsDragging(true);
          dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            startX: tagDistributorState.x,
            startY: tagDistributorState.y
          };
        }}
      >
        <div className="flex items-center gap-2 font-bold text-sm text-foreground">
          <GripHorizontal size={14} className="text-muted-foreground" />
          Distributeur de Tags
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTagDistributorState({ isDetached: false })}
            className="p-1 text-muted-foreground hover:text-primary transition-colors cursor-pointer rounded hover:bg-accent"
            title="Rattacher"
            onMouseDown={e => e.stopPropagation()}
          >
            <X size={16} />
          </button>
        </div>
      </div>
      
      <div className="p-3 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
        {tagsInDistributor.map(tag => {
          const IconComponent = icons[tag.icon as keyof typeof icons] || Tag;
          return (
            <div
              key={tag.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({ type: 'new_marker', data: tag }));
              }}
              className="flex items-center justify-between p-2 rounded-md border border-border bg-card hover:bg-accent/50 cursor-grab transform transition-all active:scale-95"
              title="Glisser vers la salle ou un joueur"
            >
              <div className="flex items-center gap-3 overflow-hidden flex-1 select-none pointer-events-none">
                <div className="w-8 h-8 rounded flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: tag.color, color: '#fff' }}>
                  <IconComponent size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold truncate leading-tight">{tag.name}</span>
                  {(tag.lives !== null || tag.points !== null) && (
                    <span className="text-[10px] text-muted-foreground">
                      {[tag.lives !== null ? `Vie: ${tag.lives}` : null, tag.points !== null ? `Pts: ${tag.points}` : null].filter(Boolean).join(' | ')}
                    </span>
                  )}
                </div>
              </div>
              <Move size={14} className="text-muted-foreground opacity-50" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
