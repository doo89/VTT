import React, { useState, useRef, useEffect } from 'react';
import { useVttStore } from '../store';
import * as icons from 'lucide-react';
import { Music, X, Settings, Repeat, Volume2, Filter, Download, Upload } from 'lucide-react';
import './DetachedSoundboard.css';

import { getChannel } from '../lib/realtime-host';
import { getAudio, storeAudio, isIdbUrl, idbUrlToKey, makeIdbKey } from '../lib/audio-storage';
import { audioEngine } from '../lib/audio-engine';
import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSwappingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export const DetachedSoundboard: React.FC = () => {
  const { soundboard, setSoundboard, setEditingEntity } = useVttStore();
  const [isDragging, setIsDragging] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const progressRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const [playingStates, setPlayingStates] = useState<Record<number, boolean>>({});

  const [masterVolume, setMasterVolume] = useState(1.0);
  const [showMixer, setShowMixer] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = React.useMemo(() => {
    const cats = new Set<string>();
    soundboard.buttons.forEach(b => { if (b.category) cats.add(b.category); });
    return Array.from(cats).sort();
  }, [soundboard.buttons]);

  useEffect(() => {
    return () => { audioEngine.destroy(); };
  }, []);

  useEffect(() => {
    audioEngine.onPlayingState((index, playing) => {
      setPlayingStates(prev => ({ ...prev, [index]: playing }));
      broadcastPlaybackStatus();
    });
    audioEngine.onProgress((index, pct) => {
      const bar = progressRefs.current.get(index);
      if (bar) bar.style.width = `${pct}%`;
    });
  }, []);

  useEffect(() => {
    const activeIndices = new Set(soundboard.buttons.map(b => b.index));
    Object.keys(playingStates).forEach(key => {
      const idx = parseInt(key);
      if (!activeIndices.has(idx) && playingStates[idx]) {
        audioEngine.stop(idx);
      }
    });
  }, [soundboard.buttons]);

  useEffect(() => {
    audioEngine.setMasterVolume(masterVolume);
  }, [masterVolume]);

  useEffect(() => {
    if (!soundboard.isDetached) return;
    const shortcutMap = new Map<string, number>();
    soundboard.buttons.forEach(btn => {
      if (btn.shortcut && btn.audioUrl) {
        shortcutMap.set(btn.shortcut.toLowerCase(), btn.index);
      }
    });
    if (shortcutMap.size === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      const key = e.key.toLowerCase();
      if (shortcutMap.has(key)) {
        e.preventDefault();
        const state = useVttStore.getState();
        const btn = state.soundboard.buttons.find(b => b.index === shortcutMap.get(key)!);
        if (btn?.audioUrl) {
          handleButtonClick(shortcutMap.get(key)!);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [soundboard.buttons, soundboard.isDetached]);

  const broadcastPlaybackStatus = () => {
    const channel = getChannel();
    if (!channel) return;
    const playing: number[] = [];
    audioEngine.getPlaybackOrder().forEach(idx => {
      if (audioEngine.isPlaying(idx)) playing.push(idx);
    });
    channel.send({
      type: 'broadcast',
      event: 'soundboard_playback',
      payload: { playingIndices: playing }
    }).catch(() => { /* broadcast errors are non-critical */ });
  };

  const handleButtonClick = async (index: number) => {
    const btn = soundboard.buttons.find(b => b.index === index);
    if (!btn || !btn.audioUrl) {
      setEditingEntity({ type: 'soundButton', id: index.toString() });
      return;
    }

    const audioUrl = btn.audioUrl;
    const vol = btn.volume ?? 1;
    const isAmbient = btn.isAmbient ?? false;

    try {
      if (isAmbient) {
        await audioEngine.crossfadeAmbient(index, audioUrl, vol, masterVolume, 1500);
      } else {
        await audioEngine.play(index, audioUrl, vol, !btn.isOneShot);
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') console.error("Audio playback error", e);
    }
  };

  const lastTriggerTimestamp = useRef<number | null>(null);
  useEffect(() => {
    if (soundboard.remotePlayTrigger && soundboard.remotePlayTrigger.timestamp !== lastTriggerTimestamp.current) {
      lastTriggerTimestamp.current = soundboard.remotePlayTrigger.timestamp;
      handleButtonClick(soundboard.remotePlayTrigger.index);
    }
  }, [soundboard.remotePlayTrigger]);

  const lastStopTimestamp = useRef<number | null>(null);
  useEffect(() => {
    if (soundboard.remoteStopTrigger && soundboard.remoteStopTrigger.timestamp !== lastStopTimestamp.current) {
      lastStopTimestamp.current = soundboard.remoteStopTrigger.timestamp;
      audioEngine.stop(soundboard.remoteStopTrigger.index);
    }
  }, [soundboard.remoteStopTrigger]);

  useEffect(() => {
    if (windowRef.current) {
      windowRef.current.style.transition = isDragging ? 'none' : 'opacity 0.2s';
    }
  }, [isDragging]);

  useEffect(() => {
    buttonRefs.current.forEach((el, i) => {
      const btn = soundboard.buttons.find(b => b.index === i);
      const isPlaying = playingStates[i] || false;

      el.style.setProperty('--btn-color', btn?.color || 'transparent');
      el.style.setProperty('--btn-bg-image', btn?.imageUrl ? `url(${btn.imageUrl})` : 'none');
      el.style.setProperty('--is-playing', isPlaying ? '1' : '0');
    });
  }, [soundboard.buttons, playingStates]);

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

  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );
  const { swapSoundButtons } = useVttStore();
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      swapSoundButtons(Number(active.id), Number(over.id));
    }
  };

  const handleExportPack = async () => {
    const pack = {
      version: 1,
      exportedAt: Date.now(),
      buttons: soundboard.buttons.map(b => ({
        index: b.index,
        name: b.name,
        isOneShot: b.isOneShot,
        icon: b.icon,
        color: b.color,
        volume: b.volume,
        shortcut: b.shortcut,
        category: b.category,
        isAmbient: b.isAmbient,
        audioUrl: b.audioUrl,
      }))
    };
    for (const btn of pack.buttons) {
      if (btn.audioUrl && isIdbUrl(btn.audioUrl)) {
        const data = await getAudio(idbUrlToKey(btn.audioUrl));
        if (data) btn.audioUrl = data;
      }
    }
    const json = JSON.stringify(pack, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soundboard-pack-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleImportPack = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const pack = JSON.parse(text);
      if (!pack.buttons || !Array.isArray(pack.buttons)) throw new Error('Format invalide');
      for (const btn of pack.buttons) {
        if (btn.audioUrl && btn.audioUrl.startsWith('data:')) {
          const key = makeIdbKey(btn.index);
          await storeAudio(key, btn.audioUrl);
          btn.audioUrl = `idb://${key}`;
        }
        useVttStore.getState().updateSoundButton(btn.index, btn);
      }
    } catch (err) {
      console.error('Import failed', err);
    }
    e.target.value = '';
  };

  if (!soundboard.isDetached) {
    return null;
  }

  const totalButtons = soundboard.cols * soundboard.rows;
  const filteredIndices = selectedCategory
    ? soundboard.buttons.filter(b => b.category === selectedCategory).map(b => b.index).sort((a, b) => a - b)
    : Array.from({ length: totalButtons }, (_, i) => i);
  const gridCols = selectedCategory ? Math.min(soundboard.cols, filteredIndices.length || 1) : soundboard.cols;
  const gridRows = selectedCategory ? Math.ceil(filteredIndices.length / gridCols) : soundboard.rows;

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
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleExportPack(); }}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Exporter le pack"
          >
            <Download size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Importer un pack"
          >
            <Upload size={14} />
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportPack} className="hidden" />
          <button
            onClick={(e) => { e.stopPropagation(); setShowMixer(v => !v); }}
            className={`p-1 rounded transition-colors ${showMixer ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            title="Mixer"
          >
            <Volume2 size={14} />
          </button>
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
      </div>

      {showMixer && (
        <div className="px-3 py-2 border-b border-border bg-muted/50 text-xs space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-muted-foreground w-12 shrink-0">Master</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={masterVolume}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setMasterVolume(v);
              }}
              className="flex-1 h-1 rounded-full appearance-none cursor-pointer accent-pink-500"
            />
            <span className="text-muted-foreground w-8 text-right font-mono">{Math.round(masterVolume * 100)}%</span>
          </div>
          {audioEngine.getPlaybackOrder().map(idx => {
            const btn = soundboard.buttons.find(b => b.index === idx);
            if (!btn || !playingStates[idx]) return null;
            return (
              <div key={idx} className="flex items-center gap-2 pl-12">
                <span className="text-foreground truncate flex-1 text-[11px] font-medium">{btn.name || `Son ${idx + 1}`}</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={btn.volume ?? 1.0}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    audioEngine.setTrackVolume(idx, v);
                    useVttStore.getState().updateSoundButton(idx, { volume: v });
                  }}
                  className="w-16 h-1 rounded-full appearance-none cursor-pointer accent-pink-500"
                />
                <span className="text-muted-foreground w-8 text-right font-mono text-[10px]">{Math.round((btn.volume ?? 1.0) * 100)}%</span>
                <button
                  onClick={() => handleButtonClick(idx)}
                  className="p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                  title="Arrêter"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {categories.length > 0 && (
        <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border bg-muted/30 overflow-x-auto">
          <Filter size={12} className="text-muted-foreground shrink-0" />
          <button
            onClick={() => setSelectedCategory(null)}
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap transition-colors ${
              !selectedCategory ? 'bg-pink-500 text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Tout
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === cat ? 'bg-pink-500 text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={filteredIndices} strategy={rectSwappingStrategy}>
        <div
          className="soundboard-grid p-4"
          style={{ 
            display: 'grid',
            gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${gridRows}, minmax(0, 1fr))`
          }}
        >
          {filteredIndices.map((_, displayPos) => {
            const actualIndex = filteredIndices[displayPos];
            return (
              <SortableSoundButton
                key={actualIndex}
                index={actualIndex}
                soundboard={soundboard}
                playingStates={playingStates}
                buttonRefs={buttonRefs}
                progressRefs={progressRefs}
                onPlay={handleButtonClick}
                onContext={handleButtonContextMenu}
              />
            );
          })}
        </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

const SortableSoundButton: React.FC<{
  index: number;
  soundboard: any;
  playingStates: Record<number, boolean>;
  buttonRefs: React.MutableRefObject<Map<number, HTMLButtonElement>>;
  progressRefs: React.MutableRefObject<Map<number, HTMLDivElement>>;
  onPlay: (i: number) => void;
  onContext: (e: React.MouseEvent, i: number) => void;
}> = ({ index, soundboard, playingStates, buttonRefs, progressRefs, onPlay, onContext }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: index });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    zIndex: isDragging ? 1 : undefined,
    position: 'relative' as const,
  };

  const btn = soundboard.buttons.find((b: any) => b.index === index);
  const hasSound = !!btn && !!btn.audioUrl;
  const isPlaying = playingStates[index] || false;
  const IconComponent = btn?.icon && icons[btn.icon as keyof typeof icons] ? icons[btn.icon as keyof typeof icons] : Music;

  return (
    <button
      ref={(el) => {
        setNodeRef(el);
        if (el) buttonRefs.current.set(index, el);
        else buttonRefs.current.delete(index);
      }}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onPlay(index)}
      onContextMenu={(e) => onContext(e, index)}
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
            {btn.name || `Son ${index + 1}`}
          </span>
          {btn.shortcut && (
            <span className="absolute bottom-1 right-1 text-[8px] font-black px-1 py-0.5 rounded bg-black/60 text-white/80 leading-none">
              {btn.shortcut.toUpperCase()}
            </span>
          )}

          {!btn.isOneShot && !btn.isAmbient && (
             <div className="absolute top-1 right-1 text-white/70" title="En boucle">
               <Repeat size={10} className={isPlaying ? 'animate-spin-slow' : ''} />
             </div>
          )}
          {btn.isAmbient && (
            <div className="absolute top-1 right-1 text-white/70" title="Ambiance">
              <span className={`flex h-2 w-2 ${isPlaying ? 'animate-ping' : ''}`}>
                <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
            </div>
          )}

          {isPlaying && (
            <div className="absolute bottom-0 left-0 h-1 bg-black/50 w-full">
              <div
                ref={el => { if (el) progressRefs.current.set(index, el); else progressRefs.current.delete(index); }}
                className="h-full transition-all duration-100 ease-linear bg-white"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="relative z-10 flex items-center justify-center w-full h-full">
          <Settings size={14} className="opacity-50" />
        </div>
      )}
    </button>
  );
};
