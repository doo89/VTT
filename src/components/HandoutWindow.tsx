import React, { useRef, useState, useEffect } from 'react';
import { useVttStore } from '../store';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import type { Handout } from '../types';

interface HandoutWindowProps {
  handout: Handout;
}

export const HandoutWindow: React.FC<HandoutWindowProps> = ({ handout }) => {
  const { updateHandout, toggleHandout } = useVttStore();
  const windowRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [windowStart, setWindowStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag from the header
    if ((e.target as HTMLElement).closest('.handout-header')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setWindowStart({ x: handout.x, y: handout.y });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !handout.isMaximized) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        updateHandout(handout.id, {
          x: windowStart.x + dx,
          y: windowStart.y + dy,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, windowStart, handout.id, handout.isMaximized, updateHandout]);

  // If maximized, ignore x/y and cover screen
  const style: React.CSSProperties = handout.isMaximized ? {
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90vw',
    height: '90vh',
  } : {
    top: handout.y,
    left: handout.x,
    width: handout.width,
    height: handout.height,
  };

  return (
    <div
      ref={windowRef}
      className={`absolute z-[100] bg-card border border-border rounded-lg shadow-2xl flex flex-col overflow-hidden transition-all ${handout.isMaximized ? 'duration-300' : 'duration-0'}`}
      style={style}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className={`handout-header h-10 bg-muted/80 border-b border-border flex items-center justify-between px-3 shrink-0 select-none ${handout.isMaximized ? '' : 'cursor-move'}`}>
        <span className="font-semibold text-sm truncate" title={handout.name}>{handout.name}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => updateHandout(handout.id, { isMaximized: !handout.isMaximized })}
            className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
            title={handout.isMaximized ? "Réduire" : "Agrandir"}
          >
            {handout.isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button
            onClick={() => toggleHandout(handout.id)}
            className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors"
            title="Fermer"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto custom-scrollbar relative bg-black/5 flex items-center justify-center p-2">
        <img
          src={handout.imageUrl}
          alt={handout.name}
          className={`object-contain ${handout.isMaximized ? 'max-w-full max-h-full' : 'w-full h-full'}`}
          draggable={false}
        />
      </div>

      {/* Resizer handle (only when not maximized) */}
      {!handout.isMaximized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={(e) => {
            e.stopPropagation();
            const startW = handout.width;
            const startH = handout.height;
            const startX = e.clientX;
            const startY = e.clientY;

            const handleResizeMove = (moveEvent: MouseEvent) => {
              const newW = Math.max(200, startW + (moveEvent.clientX - startX));
              const newH = Math.max(150, startH + (moveEvent.clientY - startY));
              updateHandout(handout.id, { width: newW, height: newH });
            };

            const handleResizeUp = () => {
              document.removeEventListener('mousemove', handleResizeMove);
              document.removeEventListener('mouseup', handleResizeUp);
            };

            document.addEventListener('mousemove', handleResizeMove);
            document.addEventListener('mouseup', handleResizeUp);
          }}
        >
          {/* visual cue for resize */}
          <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-muted-foreground/50 pointer-events-none" />
        </div>
      )}
    </div>
  );
};
