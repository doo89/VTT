import React, { useState, useRef, useEffect } from 'react';
import { useVttStore } from '../store';
import { Music, X, Settings, Repeat, icons } from 'lucide-react';

export const DetachedSoundboard: React.FC = () => {
  const { soundboard, setSoundboard, setEditingEntity } = useVttStore();
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);

  // Track playing audios to toggle/pause them
  const audioRefs = useRef<Record<number, HTMLAudioElement>>({});
  const [audioStates, setAudioStates] = useState<Record<number, { isPlaying: boolean, progress: number }>>({});

  // Cleanup audios on unmount
  useEffect(() => {
    const refs = audioRefs.current;
    return () => {
      Object.values(refs).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
    };
  }, []);

  if (!soundboard.isDetached) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!(e.target as HTMLElement).closest('.drag-handle')) return;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: soundboard.x,
      initY: soundboard.y
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setSoundboard({
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

  const totalButtons = soundboard.cols * soundboard.rows;

  const handleButtonClick = (index: number) => {
    const btn = soundboard.buttons.find(b => b.index === index);
    if (!btn || !btn.audioUrl) {
      // Empty button -> open settings
      setEditingEntity({ type: 'soundButton', id: index.toString() });
      return;
    }

    // Existing audio -> Play / Pause
    if (!audioRefs.current[index]) {
      const newAudio = new Audio(btn.audioUrl);

      newAudio.addEventListener('play', () => setAudioStates(prev => ({ ...prev, [index]: { ...prev[index], isPlaying: true } })));
      newAudio.addEventListener('pause', () => setAudioStates(prev => ({ ...prev, [index]: { ...prev[index], isPlaying: false } })));
      newAudio.addEventListener('ended', () => {
        setAudioStates(prev => ({ ...prev, [index]: { isPlaying: false, progress: 0 } }));
        newAudio.currentTime = 0;
      });
      newAudio.addEventListener('timeupdate', () => {
        if (newAudio.duration) {
          setAudioStates(prev => ({ ...prev, [index]: { ...prev[index], progress: (newAudio.currentTime / newAudio.duration) * 100 } }));
        }
      });

      audioRefs.current[index] = newAudio;
    }
    const audio = audioRefs.current[index];

    // Toggle logic
    if (!audio.paused) {
      audio.pause();
      audio.currentTime = 0;
      setAudioStates(prev => ({ ...prev, [index]: { isPlaying: false, progress: 0 } }));
    } else {
      audio.loop = !btn.isOneShot;
      audio.play().catch(e => console.error("Audio playback error", e));
    }
  };

  const handleButtonContextMenu = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    setEditingEntity({ type: 'soundButton', id: index.toString() });
  };

  return (
    <div
      className="absolute bg-card border border-border shadow-2xl rounded-xl overflow-hidden flex flex-col z-[150] touch-none min-w-[300px]"
      style={{
        left: soundboard.x,
        top: soundboard.y,
        transition: isDragging ? 'none' : 'opacity 0.2s',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="drag-handle flex items-center justify-between bg-muted p-2 cursor-grab active:cursor-grabbing border-b border-border">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground select-none">
          <Music size={14} /> Boîte à sons
        </div>
        <button
          onPointerDown={(e) => {
            e.stopPropagation(); // Stop drag from initiating
            setSoundboard({ isDetached: false });
          }}
          className="p-1 hover:bg-accent hover:text-foreground text-muted-foreground rounded transition-colors z-50 pointer-events-auto"
          title="Rattacher au panneau"
        >
          <X size={14} />
        </button>
      </div>

      <div
        className="p-4 grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${soundboard.cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${soundboard.rows}, minmax(0, 1fr))`
        }}
      >
        {Array.from({ length: totalButtons }).map((_, i) => {
          const btn = soundboard.buttons.find(b => b.index === i);
          const hasSound = !!btn && !!btn.audioUrl;
          const state = audioStates[i];
          const isPlaying = state?.isPlaying || false;
          const progress = state?.progress || 0;

          const IconComponent = btn?.icon && icons[btn.icon as keyof typeof icons] ? icons[btn.icon as keyof typeof icons] : Music;

          return (
            <button
              key={i}
              onClick={() => handleButtonClick(i)}
              onContextMenu={(e) => handleButtonContextMenu(e, i)}
              className={`relative aspect-square rounded-md flex flex-col items-center justify-center p-1 text-center transition-all border overflow-hidden ${
                hasSound
                  ? 'bg-primary border-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted border-dashed border-muted-foreground/30 hover:bg-accent text-muted-foreground hover:text-foreground'
              }`}
              style={{
                boxShadow: isPlaying && btn?.color ? `0 0 15px ${btn.color}, inset 0 0 10px ${btn.color}40` : undefined,
                borderColor: isPlaying && btn?.color ? btn.color : undefined,
                backgroundImage: btn?.imageUrl ? `url(${btn.imageUrl})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                textShadow: btn?.imageUrl ? '0 1px 3px rgba(0,0,0,0.8)' : undefined
              }}
            >
              {btn?.imageUrl && <div className="absolute inset-0 bg-black/40 z-0" />}

              {hasSound ? (
                <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
                  {React.createElement(IconComponent, { size: 20, className: "mb-1 drop-shadow-md", color: btn.color || 'currentColor' })}
                  <span className="text-[10px] font-bold leading-tight break-words w-full truncate px-1" style={{ color: btn.color || 'inherit' }}>
                    {btn.name || `Son ${i+1}`}
                  </span>

                  {!btn.isOneShot && (
                     <div className="absolute top-1 right-1 text-white/70" title="En boucle">
                       <Repeat size={10} className={isPlaying ? 'animate-spin-slow' : ''} />
                     </div>
                  )}

                  {/* Progress bar at bottom */}
                  {isPlaying && (
                    <div className="absolute bottom-0 left-0 h-1 bg-black/50 w-full">
                      <div className="h-full transition-all duration-100 ease-linear" style={{ width: `${progress}%`, backgroundColor: btn.color || '#fff' }} />
                    </div>
                  )}
                </div>
              ) : (
                <Settings size={14} className="opacity-50 relative z-10" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
