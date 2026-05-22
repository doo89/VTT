import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useVttStore } from '../store';
import './HandoutWindow.css';
import { X, Maximize2, Minimize2, ExternalLink, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import type { Handout } from '../types';

interface HandoutWindowProps {
  handout: Handout;
}

export const HandoutWindow: React.FC<HandoutWindowProps> = ({ handout }) => {
  const { updateHandout, toggleHandout, bringToFrontHandout } = useVttStore();
  const windowRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [windowStart, setWindowStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const handleMouseDown = (e: React.MouseEvent) => {
    bringToFrontHandout(handout.id);
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
        updateHandout(handout.id, { x: windowStart.x + dx, y: windowStart.y + dy });
      }
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, windowStart, handout.id, handout.isMaximized, updateHandout]);

  useEffect(() => {
    if (windowRef.current) {
      windowRef.current.style.setProperty('--handout-x', `${handout.x}px`);
      windowRef.current.style.setProperty('--handout-y', `${handout.y}px`);
      windowRef.current.style.setProperty('--handout-width', `${handout.width}px`);
      windowRef.current.style.setProperty('--handout-height', `${handout.height}px`);
    }
  }, [handout.x, handout.y, handout.width, handout.height]);

  const clampedPosition = useMemo(() => {
    if (handout.isMaximized) return { x: 0, y: 0 };
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const minVisible = 50;
    const x = Math.max(-handout.width + minVisible, Math.min(vw - minVisible, handout.x));
    const y = Math.max(0, Math.min(vh - minVisible, handout.y));
    return { x, y };
  }, [handout.x, handout.y, handout.width, handout.isMaximized]);

  useEffect(() => {
    if (!handout.isMaximized && (clampedPosition.x !== handout.x || clampedPosition.y !== handout.y)) {
      updateHandout(handout.id, { x: clampedPosition.x, y: clampedPosition.y });
    }
  }, [clampedPosition.x, clampedPosition.y, handout.x, handout.y, handout.isMaximized, handout.id, updateHandout]);

  useEffect(() => {
    setZoom(1);
  }, [handout.id]);

  const handleZoomIn = useCallback(() => setZoom(prev => Math.min(prev + 0.25, 5)), []);
  const handleZoomOut = useCallback(() => setZoom(prev => Math.max(prev - 0.25, 0.25)), []);
  const handleResetZoom = useCallback(() => setZoom(1), []);

  const zIndex = handout.zIndex || 100;

  return (
    <div
      ref={windowRef}
      className={`handout-window absolute bg-card border border-border rounded-lg shadow-2xl flex flex-col overflow-hidden transition-all ${
        handout.isMaximized ? 'handout-window-maximized duration-300' : 'duration-0'
      } ${isDragging ? 'shadow-2xl opacity-90' : ''}`}
      style={{ zIndex }}
      onMouseDown={handleMouseDown}
    >
      <div className={`handout-header h-10 bg-muted/80 border-b border-border flex items-center justify-between px-3 shrink-0 select-none ${handout.isMaximized ? '' : 'cursor-move'}`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-sm truncate" title={handout.name}>{handout.name}</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
            handout.type === 'pdf' ? 'bg-red-500/20 text-red-500' : handout.type === 'text' ? 'bg-blue-500/20 text-blue-500' : 'bg-green-500/20 text-green-500'
          }`}>
            {handout.type.toUpperCase()}
          </span>
          {handout.type === 'pdf' && (
            <a href={handout.imageUrl} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-primary transition-colors" title="Ouvrir dans un nouvel onglet" onMouseDown={(e) => e.stopPropagation()}>
              <ExternalLink size={14} />
            </a>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => updateHandout(handout.id, { isMaximized: !handout.isMaximized })} className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors" title={handout.isMaximized ? "Réduire" : "Agrandir"}>
            {handout.isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button onClick={() => toggleHandout(handout.id)} className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors" title="Fermer">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="handout-body custom-scrollbar relative">
        {handout.type === 'pdf' ? (
          <iframe src={`${handout.imageUrl}#toolbar=0`} className="handout-iframe" title={handout.name} />
        ) : handout.type === 'text' ? (
          <div className="p-4">
            <div className="prose prose-sm max-w-none text-sm whitespace-pre-wrap text-foreground">
              {handout.content || <span className="text-muted-foreground italic">Note vide</span>}
            </div>
          </div>
        ) : (
          <div className="handout-image-wrapper relative overflow-hidden">
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 rounded-md p-1 z-10">
              <button onClick={handleZoomOut} className="p-1 text-white hover:bg-white/20 rounded" title="Zoom arrière" aria-label="Zoom arrière">
                <ZoomOut size={14} />
              </button>
              <span className="text-[10px] text-white w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={handleZoomIn} className="p-1 text-white hover:bg-white/20 rounded" title="Zoom avant" aria-label="Zoom avant">
                <ZoomIn size={14} />
              </button>
              {zoom !== 1 && (
                <button onClick={handleResetZoom} className="p-1 text-white hover:bg-white/20 rounded" title="Réinitialiser zoom" aria-label="Réinitialiser zoom">
                  <RotateCcw size={12} />
                </button>
              )}
            </div>
            <img
              src={handout.imageUrl}
              alt={handout.name}
              className={`handout-image ${handout.isMaximized ? 'handout-image-maximized' : 'handout-image-normal'}`}
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.2s ease' }}
              draggable={false}
            />
          </div>
        )}
      </div>

      {!handout.isMaximized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={(e) => {
            e.stopPropagation();
            bringToFrontHandout(handout.id);
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
          <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-muted-foreground/50 pointer-events-none" />
        </div>
      )}
    </div>
  );
};
