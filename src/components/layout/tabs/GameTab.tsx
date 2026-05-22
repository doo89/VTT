import { Moon, Sun, FastForward, RotateCcw, GripVertical, Focus, ArrowLeft, ArrowRight, Search, X, CheckCircle2, Circle, History, ChevronUp, ChevronDown, Trash2, Copy, ClipboardCheck, StickyNote, Clock, RotateCw } from 'lucide-react';
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useVttStore } from '../../../store';
import type { Player, Marker, TagInstance } from '../../../types';
import { TagSection, CallOrderCard } from './GameTabComponents';
import { useCallOrder } from '../../../hooks/useCallOrder';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableSection({ id, children, isOpen, title, onToggle }: {
  id: string;
  children: React.ReactNode;
  isOpen: boolean;
  title: string;
  onToggle: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <section ref={setNodeRef} style={style} className="flex flex-col gap-3">
      <div 
        className="flex items-center justify-between bg-accent/30 hover:bg-accent/50 p-2 rounded cursor-pointer transition-colors group"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-accent/80 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical size={14} className="text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        <div className="text-blue-500">
          {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          )}
        </div>
      </div>
      
      {isOpen && children}
    </section>
  );
}

interface PhaseHistoryEntry {
  phaseLabel: string;
  timestamp: number;
  entities: Array<{ id: string; name: string; type: 'player' | 'marker'; treated: boolean }>;
  timerSnapshot?: { minutes: number; seconds: number; isRunning: boolean };
}

export const GameTab: React.FC = () => {
  const { 
    isNight, cycleNumber, cycleMode, nextCycle, resetCycle, roles, timer, setTimer, displaySettings
  } = useVttStore();

  const [sectionOrder, setSectionOrder] = useState([
    'phase',
    'called',
    'others',
  ]);

  const [openSections, setOpenSections] = useState({
    phase: true,
    called: true,
    others: false,
  });

  const gameTabState = useVttStore(state => state.gameTabState);
  const setGameTabState = useVttStore(state => state.setGameTabState);

  const [focusMode, setFocusMode] = useState(gameTabState.focusMode);
  const [focusIndex, setFocusIndex] = useState(gameTabState.focusIndex);
  const [searchQuery, setSearchQuery] = useState('');
  const [treatedEntities, setTreatedEntities] = useState<Set<string>>(new Set(gameTabState.treatedEntities));
  const [phaseHistory, setPhaseHistory] = useState<PhaseHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [playerNotes, setPlayerNotes] = useState<Record<string, string>>(gameTabState.playerNotes);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  useEffect(() => {
    setGameTabState({
      treatedEntities: Array.from(treatedEntities),
      playerNotes,
      focusMode,
      focusIndex,
    });
  }, [treatedEntities, playerNotes, focusMode, focusIndex, setGameTabState]);

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExitFocus = useCallback(() => {
    setFocusMode(false);
    setFocusIndex(0);
  }, []);

  const handleToggleFocus = useCallback(() => {
    setFocusMode(prev => !prev);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSectionOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const getVisibleTags = (entity: Player | Marker) => {
    if ('tags' in entity) {
      return (entity as Player).tags.filter((t: TagInstance) => t.showInGameTab !== false);
    }
    return (entity as Marker).tag.showInGameTab !== false ? [(entity as Marker).tag] : [];
  };

  const getEntityId = (entity: Player | Marker, type: 'player' | 'marker') => {
    return type === 'player' ? (entity as Player).id : `marker-${(entity as Marker).id}`;
  };

  const getEntityName = (entity: Player | Marker, type: 'player' | 'marker') => {
    if (type === 'player') return (entity as Player).name;
    return `Marqueur: ${(entity as Marker).tag.name}`;
  };

  const { calledEntities, otherEntities } = useCallOrder(isNight, cycleMode);

  const filteredEntities = useMemo(() => {
    if (!searchQuery.trim()) {
      return { called: calledEntities, others: otherEntities };
    }

    const query = searchQuery.toLowerCase();
    const matchesEntity = (entity: Player | Marker) => {
      if ('name' in entity) {
        const player = entity as Player;
        const role = roles.find(r => r.id === player.roleId);
        const team = useVttStore.getState().teams.find(t => t.id === player.teamId);
        return (
          player.name.toLowerCase().includes(query) ||
          role?.name.toLowerCase().includes(query) ||
          team?.name.toLowerCase().includes(query)
        );
      }
      return (entity as Marker).tag.name.toLowerCase().includes(query);
    };

    return {
      called: calledEntities.filter(item => matchesEntity(item.entity)),
      others: otherEntities.filter(item => matchesEntity(item.entity)),
    };
  }, [calledEntities, otherEntities, searchQuery, roles]);

  const focusGroups = useMemo(() => {
    if (!displaySettings.focusModeGroupByOrder) {
      return filteredEntities.called.map((item, idx) => ({
        order: item.order,
        entities: [item],
        groupIndex: idx,
      }));
    }

    const groups: Array<{ order: number; entities: typeof filteredEntities.called; groupIndex: number }> = [];
    let currentOrder: number | null = null;
    let currentGroup: typeof filteredEntities.called = [];

    filteredEntities.called.forEach((item) => {
      if (item.order !== currentOrder) {
        if (currentGroup.length > 0) {
          groups.push({ order: currentOrder!, entities: currentGroup, groupIndex: groups.length });
        }
        currentOrder = item.order;
        currentGroup = [item];
      } else {
        currentGroup.push(item);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ order: currentOrder!, entities: currentGroup, groupIndex: groups.length });
    }

    return groups;
  }, [filteredEntities.called, displaySettings.focusModeGroupByOrder]);

  const focusGroupIndex = useMemo(() => {
    if (!displaySettings.focusModeGroupByOrder) return focusIndex;
    let groupIdx = 0;
    let cumulative = 0;
    for (let i = 0; i < focusGroups.length; i++) {
      if (focusIndex < cumulative + focusGroups[i].entities.length) {
        groupIdx = i;
        break;
      }
      cumulative += focusGroups[i].entities.length;
    }
    return groupIdx;
  }, [focusIndex, focusGroups, displaySettings.focusModeGroupByOrder]);

  const focusDisplayEntities = useMemo(() => {
    if (!focusMode || filteredEntities.called.length === 0) return [];
    if (!displaySettings.focusModeGroupByOrder) {
      return [filteredEntities.called[Math.min(focusIndex, filteredEntities.called.length - 1)]];
    }
    const groupIdx = Math.min(focusGroupIndex, focusGroups.length - 1);
    return focusGroups[groupIdx]?.entities || [];
  }, [focusMode, focusIndex, focusGroupIndex, filteredEntities.called, focusGroups, displaySettings.focusModeGroupByOrder]);

  const handleFocusPrev = useCallback(() => {
    if (!displaySettings.focusModeGroupByOrder) {
      setFocusIndex(prev => Math.max(0, prev - 1));
    } else {
      const groupIdx = Math.max(0, focusGroupIndex - 1);
      let entityIdx = 0;
      for (let i = 0; i < groupIdx; i++) {
        entityIdx += focusGroups[i].entities.length;
      }
      setFocusIndex(entityIdx);
    }
  }, [focusGroupIndex, focusGroups, displaySettings.focusModeGroupByOrder]);

  const handleFocusNext = useCallback(() => {
    if (!displaySettings.focusModeGroupByOrder) {
      setFocusIndex(prev => prev + 1);
    } else {
      const groupIdx = Math.min(focusGroups.length - 1, focusGroupIndex + 1);
      let entityIdx = 0;
      for (let i = 0; i < groupIdx; i++) {
        entityIdx += focusGroups[i].entities.length;
      }
      setFocusIndex(entityIdx);
    }
  }, [focusGroupIndex, focusGroups, displaySettings.focusModeGroupByOrder]);

  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__gameTabFocusControls = {
      toggleFocus: handleToggleFocus,
      focusPrev: handleFocusPrev,
      focusNext: handleFocusNext,
      exitFocus: handleExitFocus,
      isFocusMode: () => focusMode,
    };
    return () => {
      delete w.__gameTabFocusControls;
    };
  }, [handleToggleFocus, handleFocusPrev, handleFocusNext, handleExitFocus, focusMode]);

  const toggleTreated = (entityId: string) => {
    setTreatedEntities(prev => {
      const next = new Set(prev);
      if (next.has(entityId)) next.delete(entityId);
      else next.add(entityId);
      return next;
    });
  };

  const clearTreated = () => {
    setTreatedEntities(new Set());
  };

  const markAllTreated = () => {
    const allIds = filteredEntities.called.map(item => getEntityId(item.entity, item.type));
    setTreatedEntities(new Set(allIds));
  };

  const saveToHistory = useCallback(() => {
    const phaseLabel = cycleMode === 'dayNight'
      ? `${isNight ? 'Nuit' : 'Jour'} ${cycleNumber}`
      : cycleMode === 'turns'
        ? `Tour ${cycleNumber}`
        : 'Phase';

    const snapshot = calledEntities.map(item => ({
      id: getEntityId(item.entity, item.type),
      name: getEntityName(item.entity, item.type),
      type: item.type,
      treated: treatedEntities.has(getEntityId(item.entity, item.type)),
    }));

    setPhaseHistory(prev => [{
      phaseLabel,
      timestamp: Date.now(),
      entities: snapshot,
      timerSnapshot: { minutes: timer.minutes, seconds: timer.seconds, isRunning: timer.isRunning },
    }, ...prev].slice(0, 50));
  }, [calledEntities, cycleMode, isNight, cycleNumber, treatedEntities, timer]);

  const handleNextCycle = () => {
    saveToHistory();
    setTreatedEntities(new Set());
    setPlayerNotes({});
    setEditingNoteId(null);
    nextCycle();
    setFocusIndex(0);
  };

  const handleResetCycle = () => {
    saveToHistory();
    setPhaseHistory(prev => prev.slice(1));
    setTreatedEntities(new Set());
    setPlayerNotes({});
    setEditingNoteId(null);
    resetCycle();
    setFocusIndex(0);
  };

  const clearHistory = () => {
    setPhaseHistory([]);
  };

  const restoreTimerFromHistory = (entry: PhaseHistoryEntry) => {
    if (entry.timerSnapshot) {
      setTimer(entry.timerSnapshot);
    }
  };

  const updatePlayerNote = (entityId: string, note: string) => {
    setPlayerNotes(prev => ({ ...prev, [entityId]: note }));
  };

  const clearNotes = () => {
    setPlayerNotes({});
    setEditingNoteId(null);
  };

  const [copied, setCopied] = useState(false);

  const exportCallOrder = () => {
    const phaseLabel = cycleMode === 'dayNight'
      ? `${isNight ? 'Nuit' : 'Jour'} ${cycleNumber}`
      : cycleMode === 'turns'
        ? `Tour ${cycleNumber}`
        : 'Ordre d\'appel';

    const lines = [
      `=== ${phaseLabel} ===`,
      `Date: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      '',
      ...filteredEntities.called.map((item, i) => {
        const player = item.type === 'player' ? (item.entity as Player) : null;
        const role = player ? roles.find(r => r.id === player.roleId) : null;
        const team = player ? useVttStore.getState().teams.find(t => t.id === player.teamId) : null;
        const entityId = getEntityId(item.entity, item.type);
        const name = item.type === 'player'
          ? `${player?.name} (${role?.name || 'Sans rôle'})${team ? ` [${team.name}]` : ''}`
          : `Marqueur: ${(item.entity as Marker).tag.name}`;
        const treated = treatedEntities.has(entityId) ? ' ✓' : '';
        const note = playerNotes[entityId] ? ` 📝 ${playerNotes[entityId]}` : '';
        return `${i + 1}. [${item.order}] ${name}${treated}${note}`;
      }),
      '',
      `Total: ${filteredEntities.called.length} entité(s) appelées`,
    ];

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const renderPhaseSection = () => (
    <div className="p-4 border border-border rounded-lg bg-card text-center flex flex-col items-center justify-center gap-3">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2 mx-auto">
          {cycleMode === 'dayNight' ? (
            isNight ? <Moon className="text-blue-400" size={24} /> : <Sun className="text-yellow-400" size={24} />
          ) : (
            <FastForward className="text-primary" size={24} />
          )}
          <span className="text-2xl font-bold">
            {cycleMode === 'dayNight' ? (isNight ? 'Nuit ' : 'Jour ') : 'Tour '}{cycleNumber}
          </span>
        </div>
        <button
          onClick={handleResetCycle}
          className="p-2 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-md transition-colors"
          title={`Réinitialiser au ${cycleMode === 'dayNight' ? 'Jour 1' : 'Tour 1'}`}
          aria-label="Réinitialiser le cycle"
        >
          <RotateCcw size={16} />
        </button>
      </div>
      <button
        onClick={handleNextCycle}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors w-full justify-center"
        aria-label="Passer à la phase suivante"
      >
        <FastForward size={16} /> Passer à la phase suivante
      </button>

      {calledEntities.length > 0 && (
        <div className="flex items-center gap-2 w-full pt-2 border-t border-border">
          <button
            onClick={() => setFocusMode(!focusMode)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
              focusMode
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-accent text-muted-foreground hover:text-foreground border border-border'
            }`}
            title="Mode Focus : isoler le joueur en cours d'appel"
            aria-label="Basculer le mode focus"
          >
            <Focus size={14} />
            {focusMode ? 'Focus actif' : 'Mode Focus'}
          </button>
        </div>
      )}

      <div className="w-full pt-2 border-t border-border">
        <div className="flex flex-wrap gap-1 justify-center text-[9px] text-muted-foreground">
          <kbd className="px-1 py-0.5 bg-muted rounded border border-border">Alt+F</kbd>
          <span>Focus</span>
          <span className="mx-1">·</span>
          <kbd className="px-1 py-0.5 bg-muted rounded border border-border">Alt+←</kbd>
          <kbd className="px-1 py-0.5 bg-muted rounded border border-border">Alt+→</kbd>
          <span>Naviguer</span>
          <span className="mx-1">·</span>
          <kbd className="px-1 py-0.5 bg-muted rounded border border-border">Shift+Échap</kbd>
          <span>Quitter</span>
        </div>
      </div>
    </div>
  );

  const renderCalledSection = () => {
    const displayEntities = focusMode && filteredEntities.called.length > 0
      ? focusDisplayEntities
      : filteredEntities.called;

    const treatedCount = displayEntities.filter(item => treatedEntities.has(getEntityId(item.entity, item.type))).length;

    return (
    <div className="flex flex-col gap-2">
      {displayEntities.length === 0 ? (
        <p className="text-sm text-muted-foreground italic text-center py-2">Personne n'est appelé pour cette phase.</p>
      ) : (
        <>
          {!focusMode && displayEntities.length > 1 && (
            <div className="flex items-center gap-2 px-1">
              <button
                onClick={markAllTreated}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-accent/50 hover:bg-accent rounded-md text-xs text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Marquer tous comme traités"
              >
                <CheckCircle2 size={12} /> Tout cocher
              </button>
              <button
                onClick={clearTreated}
                className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-accent/50 hover:bg-accent rounded-md text-xs text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Décocher tout"
              >
                <Circle size={12} /> Tout décocher
              </button>
              <button
                onClick={exportCallOrder}
                className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-accent/50 hover:bg-accent rounded-md text-xs text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Copier l'ordre d'appel"
                title="Copier l'ordre d'appel dans le presse-papier"
              >
                {copied ? <ClipboardCheck size={12} className="text-green-500" /> : <Copy size={12} />}
              </button>
              <span className="text-[10px] text-muted-foreground ml-auto">
                {treatedCount}/{displayEntities.length} traité(s)
                {Object.keys(playerNotes).length > 0 && (
                  <span className="ml-2 text-amber-400">
                    📝 {Object.keys(playerNotes).length} note(s)
                  </span>
                )}
              </span>
            </div>
          )}

          {focusMode && filteredEntities.called.length > 1 && (
            <div className="flex items-center justify-between gap-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-md">
              <button
                onClick={handleFocusPrev}
                disabled={displaySettings.focusModeGroupByOrder ? focusGroupIndex === 0 : focusIndex === 0}
                className="p-2 rounded-md bg-accent hover:bg-accent/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Joueur précédent"
              >
                <ArrowLeft size={16} />
              </button>
              <div className="flex flex-col items-center">
                <span className="text-xs font-semibold text-blue-400">Focus</span>
                <span className="text-[10px] text-muted-foreground">
                  {displaySettings.focusModeGroupByOrder
                    ? `${focusGroupIndex + 1} / ${focusGroups.length} (groupe)`
                    : `${focusIndex + 1} / ${filteredEntities.called.length}`}
                </span>
              </div>
              <button
                onClick={handleFocusNext}
                disabled={displaySettings.focusModeGroupByOrder ? focusGroupIndex >= focusGroups.length - 1 : focusIndex >= filteredEntities.called.length - 1}
                className="p-2 rounded-md bg-accent hover:bg-accent/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Joueur suivant"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {displayEntities.map((item, index) => {
            const actualIndex = focusMode
              ? (displaySettings.focusModeGroupByOrder
                ? focusGroups[focusGroupIndex]?.entities.indexOf(item) ?? index
                : Math.min(focusIndex, filteredEntities.called.length - 1))
              : index;
            const isTreated = treatedEntities.has(getEntityId(item.entity, item.type));
            const entityId = getEntityId(item.entity, item.type);
            const hasNote = !!playerNotes[entityId];
            const isEditing = editingNoteId === entityId;

            return (
              <div key={`called-${focusMode ? `${focusGroupIndex}-${actualIndex}` : index}`} className="flex flex-col gap-1">
                <CallOrderCard
                  item={item}
                  roles={roles}
                  isTreated={isTreated}
                  isFocusMode={focusMode}
                  onToggleTreated={toggleTreated}
                  getEntityId={getEntityId}
                  getVisibleTags={getVisibleTags}
                />
                {item.type === 'player' && (
                  <div className="flex items-center gap-1 pl-11">
                    <button
                      onClick={() => setEditingNoteId(isEditing ? null : entityId)}
                      className={`p-1 rounded transition-colors ${
                        isEditing || hasNote
                          ? 'text-amber-400 bg-amber-500/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                      aria-label="Note rapide"
                      title="Note rapide"
                    >
                      <StickyNote size={12} />
                    </button>
                    {isEditing && (
                      <textarea
                        value={playerNotes[entityId] || ''}
                        onChange={(e) => updatePlayerNote(entityId, e.target.value)}
                        onBlur={() => setEditingNoteId(null)}
                        placeholder="Note rapide..."
                        className="flex-1 bg-input border border-border rounded px-2 py-1 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                        rows={1}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setEditingNoteId(null);
                        }}
                      />
                    )}
                    {!isEditing && hasNote && (
                      <span className="text-[10px] text-muted-foreground truncate italic" title={playerNotes[entityId]}>
                        {playerNotes[entityId]}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
    );
  };

  const renderOthersSection = () => (
    <div className="flex flex-col gap-1 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
      {filteredEntities.others.length === 0 ? (
         <p className="text-xs text-muted-foreground text-center">
           {searchQuery ? 'Aucun résultat.' : 'Aucune autre entité.'}
         </p>
      ) : (
        filteredEntities.others.map((item, index) => {
          const visibleTags = getVisibleTags(item.entity);
          const hasTags = item.type === 'player' && visibleTags.length > 0;
          const player = item.type === 'player' ? (item.entity as Player) : null;
          const role = player ? roles.find(r => r.id === player.roleId) : null;
          const team = player ? useVttStore.getState().teams.find(t => t.id === player.teamId) : null;

          return (
            <div
              key={`other-${index}`}
              className="flex flex-col p-1.5 rounded bg-muted/30"
              style={{ borderLeft: `3px solid ${team?.color ?? role?.color ?? 'transparent'}` }}
            >
              <div className="flex items-center justify-between text-xs">
                 <div className="flex items-center gap-2 truncate flex-1">
                    {player && (
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: player.color }} />
                    )}
                    <span className="truncate font-medium">
                       {item.type === 'player' 
                         ? `${(item.entity as Player).name} (${role?.name || 'Sans rôle'})` 
                         : `Marqueur: ${(item.entity as Marker).tag.name}`}
                    </span>
                    {team && (
                      <span className="text-[9px] px-1 py-0.5 rounded shrink-0" style={{ backgroundColor: team.color + '20', color: team.color }}>
                        {team.name}
                      </span>
                    )}
                 </div>
                 <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0 ml-2">
                    {item.type === 'player' && (item.entity as Player).isDead && (
                      <span className="text-destructive font-bold">💀 Mort</span>
                    )}
                    {item.type === 'player' && (item.entity as Player).isSleeping && (
                      <span className="text-indigo-400 font-bold">💤 Dort</span>
                    )}
                 </span>
              </div>

              {hasTags && (
                <div className="flex flex-col gap-1 mt-1 border-t border-border/50 pt-1">
                  {visibleTags.map((tag: TagInstance) => (
                    <TagSection
                      key={tag.instanceId}
                      tag={tag}
                      entity={item.entity}
                      entityType="player"
                      size="sm"
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  const sectionContent: Record<string, { title: string; render: () => React.ReactNode }> = {
    phase: { title: 'Phase Actuelle', render: renderPhaseSection },
    called: { 
      title: `Ordre d'Appel (${filteredEntities.called.length})`, 
      render: renderCalledSection 
    },
    others: { 
      title: `Autres Entités (${filteredEntities.others.length})`, 
      render: renderOthersSection 
    },
  };

  const renderSearchBar = () => (
    <div className="relative">
      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        placeholder="Rechercher un joueur, rôle, équipe, marqueur..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full bg-input border border-border rounded-md pl-8 pr-8 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        aria-label="Rechercher dans l'ordre d'appel"
      />
      {searchQuery && (
        <button
          onClick={() => setSearchQuery('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Effacer la recherche"
        >
          <X size={14} />
        </button>
      )}
      {searchQuery && (
        <div className="text-[10px] text-muted-foreground mt-1">
          {filteredEntities.called.length} appelé(s) · {filteredEntities.others.length} autre(s)
        </div>
      )}
    </div>
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sectionOrder}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-6 relative">
          {renderSearchBar()}

          {cycleMode !== 'none' && (
            <SortableSection
              key="phase"
              id="phase"
              isOpen={openSections.phase}
              title={sectionContent.phase.title}
              onToggle={() => toggleSection('phase')}
            >
              {sectionContent.phase.render()}
            </SortableSection>
          )}

          <SortableSection
            key="called"
            id="called"
            isOpen={openSections.called}
            title={cycleMode === 'none'
              ? `Ordre d'Appel (${filteredEntities.called.length})`
              : `Ordre d'Appel (${cycleMode === 'dayNight' ? (isNight ? 'Nuit' : 'Jour') : `Tour ${cycleNumber}`}) - ${filteredEntities.called.length}`}
            onToggle={() => toggleSection('called')}
          >
            {sectionContent.called.render()}
          </SortableSection>

          <SortableSection
            key="others"
            id="others"
            isOpen={openSections.others}
            title={`Autres Entités (${filteredEntities.others.length})`}
            onToggle={() => toggleSection('others')}
          >
            {sectionContent.others.render()}
          </SortableSection>

          {phaseHistory.length > 0 && (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center justify-between p-2 rounded-md bg-accent/30 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <History size={14} className="text-muted-foreground" />
                  <span className="text-sm font-semibold">Historique des phases</span>
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                    {phaseHistory.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {showHistory && (
                    <button
                      onClick={(e) => { e.stopPropagation(); clearHistory(); }}
                      className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                      title="Effacer l'historique"
                      aria-label="Effacer l'historique"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                  {showHistory ? <ChevronUp size={16} className="text-blue-500" /> : <ChevronDown size={16} className="text-blue-500" />}
                </div>
              </button>

              {showHistory && (
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {phaseHistory.map((phase, phaseIdx) => (
                    <div key={phaseIdx} className="p-2 rounded-md border border-border/50 bg-card/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold">{phase.phaseLabel}</span>
                        <div className="flex items-center gap-2">
                          {phase.timerSnapshot && (
                            <button
                              onClick={() => restoreTimerFromHistory(phase)}
                              className="flex items-center gap-1 text-[9px] text-muted-foreground hover:text-blue-400 transition-colors"
                              title="Restaurer le minuteur"
                            >
                              <Clock size={10} />
                              {String(phase.timerSnapshot.minutes).padStart(2, '0')}:{String(phase.timerSnapshot.seconds).padStart(2, '0')}
                              <RotateCw size={9} className="opacity-50" />
                            </button>
                          )}
                          <span className="text-[9px] text-muted-foreground">
                            {new Date(phase.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {phase.entities.map(entity => (
                          <span
                            key={entity.id}
                            className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                              entity.treated
                                ? 'bg-green-500/10 text-green-500 line-through'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {entity.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
};
