import React, { useState, useRef } from 'react';
import { useVttStore } from '../store';
import { Clock, X } from 'lucide-react';

export const DetachedTimer: React.FC = () => {
  const { timer, setTimer } = useVttStore();
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);

  if (!timer.isDetached) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    // only drag from header
    if (!(e.target as HTMLElement).closest('.drag-handle')) return;

    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: timer.x,
      initY: timer.y
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    setTimer({
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

  const handleTimerToggle = () => setTimer({ isRunning: !timer.isRunning });
  const handleTimerReset = () => setTimer({ isRunning: false, minutes: 5, seconds: 0 });

  return (
    <div
      className="absolute bg-card border border-border shadow-2xl rounded-xl overflow-hidden flex flex-col z-[150] w-64 touch-none"
      style={{
        left: timer.x,
        top: timer.y,
        transition: isDragging ? 'none' : 'opacity 0.2s',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Header / Drag Handle */}
      <div className="drag-handle flex items-center justify-between bg-muted p-2 cursor-grab active:cursor-grabbing border-b border-border">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground select-none">
          <Clock size={14} /> Chronomètre
        </div>
        <button
          onPointerDown={(e) => {
            e.stopPropagation(); // Stop drag from initiating
            setTimer({ isDetached: false });
          }}
          className="p-1 hover:bg-accent hover:text-foreground text-muted-foreground rounded transition-colors z-50 pointer-events-auto"
          title="Rattacher au panneau"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex flex-col items-center gap-3 p-4">
        <div className="flex items-center gap-1 text-4xl font-mono font-bold bg-input px-4 py-3 rounded-md border border-border w-full justify-center">
          <input
            type="number"
            min="0"
            max="99"
            value={String(timer.minutes).padStart(2, '0')}
            onChange={(e) => {
              if (!timer.isRunning) {
                setTimer({ minutes: Math.min(99, Math.max(0, parseInt(e.target.value) || 0)) });
              }
            }}
            disabled={timer.isRunning}
            className="w-16 bg-transparent text-center focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
          />
          <span className="text-muted-foreground pb-1">:</span>
          <input
            type="number"
            min="0"
            max="59"
            value={String(timer.seconds).padStart(2, '0')}
            onChange={(e) => {
              if (!timer.isRunning) {
                setTimer({ seconds: Math.min(59, Math.max(0, parseInt(e.target.value) || 0)) });
              }
            }}
            disabled={timer.isRunning}
            className="w-16 bg-transparent text-center focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-muted-foreground w-full cursor-pointer mt-1 mb-1 justify-center">
          <input
            type="checkbox"
            checked={timer.playSoundAtZero}
            onChange={(e) => setTimer({ playSoundAtZero: e.target.checked })}
            className="rounded border-border w-3.5 h-3.5"
          />
          Jouer un son à la fin
        </label>

        <div className="flex gap-2 w-full mt-2">
          <button
            onClick={handleTimerToggle}
            className={`flex-[2] py-2 rounded text-sm font-medium text-white shadow-sm transition-colors ${timer.isRunning ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'}`}
          >
            {timer.isRunning ? 'Pause' : 'Démarrer'}
          </button>
          <button
            onClick={handleTimerReset}
            className="flex-1 bg-destructive text-destructive-foreground py-2 rounded text-sm shadow-sm hover:bg-destructive/90 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
