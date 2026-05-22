import React, { useState, useRef } from 'react';
import { useVttStore } from '../store';
import { Clock, X } from 'lucide-react';
import { useTimerCountdown } from '../hooks/useTimerCountdown';
import { TimerDisplay, TimerControls, TimerPresets } from './timer';

export const DetachedTimer: React.FC = () => {
  const timer = useVttStore(s => s.timer);
  const displaySettings = useVttStore(s => s.displaySettings);
  const setTimer = useVttStore(s => s.setTimer);
  const timerState = useTimerCountdown();
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);

  if (!timer.isDetached) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
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

  const handleTimerToggle = () => setTimer({ isRunning: !timerState.isRunning });
  const handleTimerReset = () => setTimer({
    isRunning: false,
    minutes: displaySettings.timerDefaultMinutes ?? 5,
    seconds: displaySettings.timerDefaultSeconds ?? 0
  });

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
      <div className="drag-handle flex items-center justify-between bg-muted p-2 cursor-grab active:cursor-grabbing border-b border-border">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground select-none">
          {timerState.isRunning ? (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <Clock size={14} />
            </span>
          ) : (
            <Clock size={14} />
          )}
          Chronomètre
        </div>
        <button
          onPointerDown={(e) => {
            e.stopPropagation();
            setTimer({ isDetached: false });
          }}
          className="p-1 hover:bg-accent hover:text-foreground text-muted-foreground rounded transition-colors z-50 pointer-events-auto"
          title="Rattacher au panneau"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex flex-col items-center gap-3 p-4">
        <TimerDisplay
          minutes={timerState.minutes}
          seconds={timerState.seconds}
          isRunning={timerState.isRunning}
          onMinutesChange={(m) => setTimer({ minutes: m })}
          onSecondsChange={(s) => setTimer({ seconds: s })}
          size="large"
        />
        <TimerControls
          isRunning={timerState.isRunning}
          playSoundAtZero={timerState.playSoundAtZero}
          onToggle={handleTimerToggle}
          onReset={handleTimerReset}
          onSoundChange={(v) => setTimer({ playSoundAtZero: v })}
        />
        <TimerPresets
          minutes={timerState.minutes}
          seconds={timerState.seconds}
          isRunning={timerState.isRunning}
          onSet={(m, s) => setTimer({ minutes: m, seconds: s })}
        />
      </div>
    </div>
  );
};
