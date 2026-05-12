import React, { useRef, useState, useEffect } from 'react';
import { useVttStore } from '../store';
import './HandoutWindow.css';
import { X, Maximize2, Minimize2, ExternalLink } from 'lucide-react';
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

  // Update dynamic styles via ref to avoid using the 'style' prop in JSX
  useEffect(() => {
    if (windowRef.current) {
      windowRef.current.style.setProperty('--handout-x', `${handout.x}px`);
      windowRef.current.style.setProperty('--handout-y', `${handout.y}px`);
      windowRef.current.style.setProperty('--handout-width', `${handout.width}px`);
      windowRef.current.style.setProperty('--handout-height', `${handout.height}px`);
    }
  }, [handout.x, handout.y, handout.width, handout.height]);

  return (
    <div
      ref={windowRef}
      className={`handout-window absolute z-[100] bg-card border border-border rounded-lg shadow-2xl flex flex-col overflow-hidden transition-all ${
        handout.isMaximized ? 'handout-window-maximized duration-300' : 'duration-0'
      }`}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className={`handout-header h-10 bg-muted/80 border-b border-border flex items-center justify-between px-3 shrink-0 select-none ${handout.isMaximized ? '' : 'cursor-move'}`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-sm truncate" title={handout.name}>{handout.name}</span>
          {handout.type === 'pdf' && (
            <a 
              href={handout.imageUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-primary transition-colors"
              title="Ouvrir dans un nouvel onglet"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>
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
      <div className="handout-body custom-scrollbar">
        {handout.type === 'pdf' ? (
          <iframe
            src={`${handout.imageUrl}#toolbar=0`}
            className="handout-iframe"
            title={handout.name}
          />
        ) : (
          <div className="handout-image-wrapper">
            <img
              src={handout.imageUrl}
              alt={handout.name}
              className={`handout-image ${handout.isMaximized ? 'handout-image-maximized' : 'handout-image-normal'}`}
              draggable={false}
            />
          </div>
        )}
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
