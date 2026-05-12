import React, { useState, useRef, useEffect } from 'react';
import { useVttStore } from '../store';
import * as icons from 'lucide-react';
import { Music, X, Settings, Repeat } from 'lucide-react';
import './DetachedSoundboard.css';

import { getChannel } from '../lib/realtime-host';

export const DetachedSoundboard: React.FC = () => {
  const { soundboard, setSoundboard, setEditingEntity } = useVttStore();
  const [isDragging, setIsDragging] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const progressRefs = useRef<Map<number, HTMLDivElement>>(new Map());
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

  // Sync volumes when they change in the store
  useEffect(() => {
    soundboard.buttons.forEach(btn => {
      if (audioRefs.current[btn.index]) {
        audioRefs.current[btn.index].volume = btn.volume ?? 1.0;
      }
    });
  }, [soundboard.buttons]);

  const broadcastPlaybackStatus = () => {
    const channel = getChannel();
    if (!channel) return;
    const playing = Object.entries(audioRefs.current)
      .filter(([_, audio]) => !audio.paused && audio.currentTime > 0 && !audio.ended)
      .map(([idx]) => parseInt(idx));
    
    channel.send({
      type: 'broadcast',
      event: 'soundboard_playback',
      payload: { playingIndices: playing }
    }).catch(() => {});
  };

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
      newAudio.volume = btn.volume ?? 1.0;

      newAudio.addEventListener('play', () => {
        setAudioStates(prev => ({ ...prev, [index]: { ...prev[index], isPlaying: true } }));
        broadcastPlaybackStatus();
      });
      newAudio.addEventListener('pause', () => {
        setAudioStates(prev => ({ ...prev, [index]: { ...prev[index], isPlaying: false } }));
        broadcastPlaybackStatus();
      });
      newAudio.addEventListener('ended', () => {
        setAudioStates(prev => ({ ...prev, [index]: { isPlaying: false, progress: 0 } }));
        newAudio.currentTime = 0;
        broadcastPlaybackStatus();
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
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          if (e.name !== 'AbortError') {
            console.error("Audio playback error", e);
          }
        });
      }
    }
  };

  const lastTriggerTimestamp = useRef<number | null>(null);
  useEffect(() => {
    if (soundboard.remotePlayTrigger && soundboard.remotePlayTrigger.timestamp !== lastTriggerTimestamp.current) {
      lastTriggerTimestamp.current = soundboard.remotePlayTrigger.timestamp;
      handleButtonClick(soundboard.remotePlayTrigger.index);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundboard.remotePlayTrigger]);

  // Update window transition via ref
  useEffect(() => {
    if (windowRef.current) {
      windowRef.current.style.transition = isDragging ? 'none' : 'opacity 0.2s';
    }
  }, [isDragging]);

  // Update all button styles via refs
  useEffect(() => {
    buttonRefs.current.forEach((el, i) => {
      const btn = soundboard.buttons.find(b => b.index === i);
      const isPlaying = audioStates[i]?.isPlaying || false;
      
      el.style.setProperty('--btn-color', btn?.color || 'transparent');
      el.style.setProperty('--btn-bg-image', btn?.imageUrl ? `url(${btn.imageUrl})` : 'none');
      el.style.setProperty('--is-playing', isPlaying ? '1' : '0');
    });
  }, [soundboard.buttons, audioStates]);

  // Update progress bars
  useEffect(() => {
    progressRefs.current.forEach((el, i) => {
      const state = audioStates[i];
      const btn = soundboard.buttons.find(b => b.index === i);
      if (state?.isPlaying) {
        el.style.width = `${state.progress}%`;
        el.style.backgroundColor = btn?.color || '#fff';
      }
    });
  }, [audioStates, soundboard.buttons]);

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

  const handleButtonContextMenu = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    setEditingEntity({ type: 'soundButton', id: index.toString() });
  };

  if (!soundboard.isDetached) {
    return null;
  }

  const totalButtons = soundboard.cols * soundboard.rows;

  return (
    <div
      ref={windowRef}
      className="detached-soundboard z-[150] touch-none"
      style={{ 
        left: `${soundboard.x}px`, 
        top: `${soundboard.y}px` 
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
            e.stopPropagation();
            setSoundboard({ isDetached: false });
          }}
          className="p-1 hover:bg-accent hover:text-foreground text-muted-foreground rounded transition-colors z-50 pointer-events-auto"
          title="Rattacher au panneau"
        >
          <X size={14} />
        </button>
      </div>

      <div
        className="soundboard-grid p-4"
        style={{ 
          display: 'grid',
          gridTemplateColumns: `repeat(${soundboard.cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${soundboard.rows}, minmax(0, 1fr))`
        }}
      >
        {Array.from({ length: totalButtons }).map((_, i) => {
          const btn = soundboard.buttons.find(b => b.index === i);
          const hasSound = !!btn && !!btn.audioUrl;
          const state = audioStates[i];
          const isPlaying = state?.isPlaying || false;

          const IconComponent = btn?.icon && icons[btn.icon as keyof typeof icons] ? icons[btn.icon as keyof typeof icons] : Music;

          return (
            <button
              key={i}
              ref={el => { if (el) buttonRefs.current.set(i, el); else buttonRefs.current.delete(i); }}
              onClick={() => handleButtonClick(i)}
              onContextMenu={(e) => handleButtonContextMenu(e, i)}
              className={`soundboard-btn ${
                hasSound
                  ? 'soundboard-btn-active'
                  : 'soundboard-btn-empty'
              }`}
            >
              {btn?.imageUrl && <div className="absolute inset-0 bg-black/40 z-0" />}

              {hasSound ? (
                <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
                  {React.createElement(IconComponent as any, { size: 20, className: "mb-1 drop-shadow-md", color: btn.color || 'currentColor' })}
                  <span className="text-[10px] font-bold leading-tight break-words w-full truncate px-1">
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
                      <div 
                        ref={el => { if (el) progressRefs.current.set(i, el); else progressRefs.current.delete(i); }}
                        className="h-full transition-all duration-100 ease-linear bg-white" 
                      />
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
