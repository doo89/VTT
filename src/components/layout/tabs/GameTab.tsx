import { Moon, Sun, FastForward, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useVttStore } from '../../../store';
import type { Player, Marker, TagInstance } from '../../../types';

export const GameTab: React.FC = () => {
  const { isNight, cycleNumber, cycleMode, nextCycle, resetCycle, players, markers, updatePlayer, updateMarker } = useVttStore();

  const [expandedCalledTags, setExpandedCalledTags] = useState<Record<string, boolean>>({});
  const [expandedOtherTags, setExpandedOtherTags] = useState<Record<string, boolean>>({});

  const toggleCalledTag = (id: string) => {
    setExpandedCalledTags(prev => ({ ...prev, [id]: prev[id] === undefined ? false : !prev[id] }));
  };

  const toggleOtherTag = (id: string) => {
    setExpandedOtherTags(prev => ({ ...prev, [id]: prev[id] === undefined ? true : !prev[id] }));
  };

  const handleModifyTagField = (player: Player, tag: TagInstance, field: 'uses' | 'lives' | 'votes' | 'points', amount: number) => {
    let newValue = (tag[field] ?? 0) + amount;

    // Uses cannot be negative
    if (field === 'uses') newValue = Math.max(0, newValue);
    // Votes usually shouldn't go below -1 (-1 = unlimited), but if it's currently >0, prevent going below 0 unless explicitly turning to -1.
    // Let's just prevent votes going below 0 if they are modifying it, unless it's already -1.
    // If it is -1, maybe don't modify it. We'll handle this in the UI by hiding buttons if votes == -1.

    let updatedTags = player.tags.map(t =>
      t.instanceId === tag.instanceId ? { ...t, [field]: newValue } : t
    );

    // Handle Auto-delete for uses
    if (field === 'uses' && newValue === 0 && tag.autoDeleteOnZeroUses) {
      // If we delete this tag, also cascade delete any children if it was a container
      const tagsToRemove = new Set([tag.instanceId]);
      updatedTags.forEach(t => {
        if (t.parentTagInstanceId === tag.instanceId) {
          tagsToRemove.add(t.instanceId);
        }
      });
      updatedTags = updatedTags.filter(t => !tagsToRemove.has(t.instanceId));
    }

    updatePlayer(player.id, { tags: updatedTags });
  };

  const handleModifyMarkerTagField = (marker: Marker, field: 'uses' | 'lives' | 'votes' | 'points', amount: number) => {
    let newValue = (marker.tag[field] ?? 0) + amount;

    if (field === 'uses') newValue = Math.max(0, newValue);

    // Handle Auto-delete for uses
    if (field === 'uses' && newValue === 0 && marker.tag.autoDeleteOnZeroUses) {
      useVttStore.getState().deleteMarker(marker.id);
      return;
    }

    updateMarker(marker.id, {
      tag: { ...marker.tag, [field]: newValue }
    });
  };

  // Generate Call Order List dynamically
  const { calledEntities, otherEntities } = useMemo(() => {
    const called: Array<{ type: 'player' | 'marker', entity: Player | Marker, order: number, reason: string }> = [];
    const others: Array<{ type: 'player' | 'marker', entity: Player | Marker }> = [];

    // Check Players
    players.forEach(player => {
      let isCalled = false;
      let minOrder = Infinity;
      let reason = '';

      // Check player's local tags
      player.tags.forEach(tag => {
        const order = (cycleMode === 'dayNight' && isNight) ? tag.callOrderNight : tag.callOrderDay;
        if (order !== null && order !== undefined) {
          isCalled = true;
          if (order < minOrder) {
            minOrder = order;
            reason = `Tag: ${tag.name}`;
          }
        }
      });

      // Check role's tags
      const role = useVttStore.getState().roles.find(r => r.id === player.roleId);
      if (role && role.tags) {
        role.tags.forEach(tag => {
          const order = (cycleMode === 'dayNight' && isNight) ? tag.callOrderNight : tag.callOrderDay;
          if (order !== null && order !== undefined) {
            isCalled = true;
            if (order < minOrder) {
              minOrder = order;
              reason = `Tag Rôle: ${tag.name}`;
            }
          }
        });
      }

      if (isCalled) {
        called.push({ type: 'player', entity: player, order: minOrder, reason });
      } else {
        others.push({ type: 'player', entity: player });
      }
    });

    // Check Markers
    markers.forEach(marker => {
      const order = (cycleMode === 'dayNight' && isNight) ? marker.tag.callOrderNight : marker.tag.callOrderDay;
      if (order !== null && order !== undefined) {
        called.push({ type: 'marker', entity: marker, order, reason: `Marker: ${marker.tag.name}` });
      } else {
        others.push({ type: 'marker', entity: marker });
      }
    });

    // Sort called entities
    called.sort((a, b) => a.order - b.order);

    return { calledEntities: called, otherEntities: others };
  }, [players, markers, isNight, cycleMode]);

  return (
    <div className="flex flex-col gap-6">
      {cycleMode !== 'none' && (
        <section className="flex flex-col gap-3">
          <h3 className="font-semibold text-sm border-b border-border pb-1">Phase Actuelle</h3>
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
                onClick={resetCycle}
                className="p-2 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-md transition-colors"
                title={`Réinitialiser au ${cycleMode === 'dayNight' ? 'Jour 1' : 'Tour 1'}`}
              >
                <RotateCcw size={16} />
              </button>
            </div>
            <button
              onClick={nextCycle}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors w-full justify-center"
            >
              <FastForward size={16} /> Passer à la phase suivante
            </button>
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h3 className="font-semibold text-sm border-b border-border pb-1">
          {cycleMode === 'none'
            ? "Ordre d'Appel"
            : `Ordre d'Appel (${cycleMode === 'dayNight' ? (isNight ? 'Nuit' : 'Jour') : `Tour ${cycleNumber}`})`}
        </h3>

        {calledEntities.length === 0 ? (
          <p className="text-sm text-muted-foreground italic text-center py-2">Personne n'est appelé pour cette phase.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {calledEntities.map((item, index) => (
              <div key={`called-${index}`} className="flex flex-col gap-2 p-3 rounded-md border border-primary/30 bg-primary/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {item.order}
                    </span>
                    <span className="font-medium text-sm">
                      {item.type === 'player' ? (item.entity as Player).name : `Marqueur: ${(item.entity as Marker).tag.name}`}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground bg-accent px-1.5 py-0.5 rounded">
                    {item.reason}
                  </span>
                </div>

                {/* Quick actions for players */}
                {item.type === 'player' && (item.entity as Player).tags.filter((t: TagInstance) => t.showInGameTab !== false).length > 0 && (
                  <div className="flex flex-col gap-1 mt-1">
                    <button
                      onClick={() => toggleCalledTag(item.entity.id)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-max"
                    >
                      {expandedCalledTags[item.entity.id] !== false ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      Tags ({(item.entity as Player).tags.filter((t: TagInstance) => t.showInGameTab !== false).length})
                    </button>

                    {expandedCalledTags[item.entity.id] !== false && (item.entity as Player).tags.filter((t: TagInstance) => t.showInGameTab !== false).map((tag: TagInstance) => (
                      <div key={tag.instanceId} className="flex flex-col gap-1 pl-7 pr-2 bg-background/30 rounded p-1">
                        <span className="text-xs font-semibold text-muted-foreground" title={tag.name}>Tag: {tag.name}</span>

                        {tag.uses !== null && (
                          <div className="flex items-center justify-between pl-2">
                            <span className="text-[10px] text-muted-foreground">Utilisations</span>
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleModifyTagField((item.entity as Player), tag, 'uses', -1)} className="w-4 h-4 flex items-center justify-center bg-accent rounded text-[10px] hover:bg-accent/80">-</button>
                              <span className="text-[10px] w-4 text-center">{tag.uses}</span>
                              <button onClick={() => handleModifyTagField((item.entity as Player), tag, 'uses', 1)} className="w-4 h-4 flex items-center justify-center bg-accent rounded text-[10px] hover:bg-accent/80">+</button>
                            </div>
                          </div>
                        )}
                        {tag.lives !== null && (
                          <div className="flex items-center justify-between pl-2">
                            <span className="text-[10px] text-muted-foreground">Vies</span>
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleModifyTagField((item.entity as Player), tag, 'lives', -1)} className="w-4 h-4 flex items-center justify-center bg-accent rounded text-[10px] hover:bg-accent/80">-</button>
                              <span className="text-[10px] w-4 text-center">{tag.lives}</span>
                              <button onClick={() => handleModifyTagField((item.entity as Player), tag, 'lives', 1)} className="w-4 h-4 flex items-center justify-center bg-accent rounded text-[10px] hover:bg-accent/80">+</button>
                            </div>
                          </div>
                        )}
                        {tag.votes !== null && (
                          <div className="flex items-center justify-between pl-2">
                            <span className="text-[10px] text-muted-foreground">Votes</span>
                            <div className="flex items-center gap-1">
                              {tag.votes !== -1 && <button onClick={() => handleModifyTagField((item.entity as Player), tag, 'votes', -1)} className="w-4 h-4 flex items-center justify-center bg-accent rounded text-[10px] hover:bg-accent/80">-</button>}
                              <span className="text-[10px] w-10 text-center">{tag.votes === -1 ? 'Illimité' : tag.votes}</span>
                              {tag.votes !== -1 && <button onClick={() => handleModifyTagField((item.entity as Player), tag, 'votes', 1)} className="w-4 h-4 flex items-center justify-center bg-accent rounded text-[10px] hover:bg-accent/80">+</button>}
                            </div>
                          </div>
                        )}
                        {tag.points !== null && (
                          <div className="flex items-center justify-between pl-2">
                            <span className="text-[10px] text-muted-foreground">Points</span>
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleModifyTagField((item.entity as Player), tag, 'points', -1)} className="w-4 h-4 flex items-center justify-center bg-accent rounded text-[10px] hover:bg-accent/80">-</button>
                              <span className="text-[10px] w-4 text-center">{tag.points}</span>
                              <button onClick={() => handleModifyTagField((item.entity as Player), tag, 'points', 1)} className="w-4 h-4 flex items-center justify-center bg-accent rounded text-[10px] hover:bg-accent/80">+</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick actions for markers */}
                {item.type === 'marker' && (item.entity as Marker).tag.showInGameTab !== false && (
                  <div className="flex flex-col gap-1 pl-7 pr-2">
                    {(item.entity as Marker).tag.uses !== null && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">Utilisations</span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleModifyMarkerTagField((item.entity as Marker), 'uses', -1)} className="w-4 h-4 flex items-center justify-center bg-accent rounded text-[10px] hover:bg-accent/80">-</button>
                          <span className="text-[10px] w-4 text-center">{(item.entity as Marker).tag.uses}</span>
                          <button onClick={() => handleModifyMarkerTagField((item.entity as Marker), 'uses', 1)} className="w-4 h-4 flex items-center justify-center bg-accent rounded text-[10px] hover:bg-accent/80">+</button>
                        </div>
                      </div>
                    )}
                    {(item.entity as Marker).tag.lives !== null && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">Vies</span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleModifyMarkerTagField((item.entity as Marker), 'lives', -1)} className="w-4 h-4 flex items-center justify-center bg-accent rounded text-[10px] hover:bg-accent/80">-</button>
                          <span className="text-[10px] w-4 text-center">{(item.entity as Marker).tag.lives}</span>
                          <button onClick={() => handleModifyMarkerTagField((item.entity as Marker), 'lives', 1)} className="w-4 h-4 flex items-center justify-center bg-accent rounded text-[10px] hover:bg-accent/80">+</button>
                        </div>
                      </div>
                    )}
                    {(item.entity as Marker).tag.votes !== null && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">Votes</span>
                        <div className="flex items-center gap-1">
                          {(item.entity as Marker).tag.votes !== -1 && <button onClick={() => handleModifyMarkerTagField((item.entity as Marker), 'votes', -1)} className="w-4 h-4 flex items-center justify-center bg-accent rounded text-[10px] hover:bg-accent/80">-</button>}
                          <span className="text-[10px] w-10 text-center">{(item.entity as Marker).tag.votes === -1 ? 'Illimité' : (item.entity as Marker).tag.votes}</span>
                          {(item.entity as Marker).tag.votes !== -1 && <button onClick={() => handleModifyMarkerTagField((item.entity as Marker), 'votes', 1)} className="w-4 h-4 flex items-center justify-center bg-accent rounded text-[10px] hover:bg-accent/80">+</button>}
                        </div>
                      </div>
                    )}
                    {(item.entity as Marker).tag.points !== null && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">Points</span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleModifyMarkerTagField((item.entity as Marker), 'points', -1)} className="w-4 h-4 flex items-center justify-center bg-accent rounded text-[10px] hover:bg-accent/80">-</button>
                          <span className="text-[10px] w-4 text-center">{(item.entity as Marker).tag.points}</span>
                          <button onClick={() => handleModifyMarkerTagField((item.entity as Marker), 'points', 1)} className="w-4 h-4 flex items-center justify-center bg-accent rounded text-[10px] hover:bg-accent/80">+</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="font-semibold text-sm border-b border-border pb-1">Autres entités</h3>
        <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
          {otherEntities.length === 0 ? (
             <p className="text-xs text-muted-foreground text-center">Aucune autre entité.</p>
          ) : (
            otherEntities.map((item, index) => {
              const hasTags = item.type === 'player' && (item.entity as Player).tags.filter((t: TagInstance) => t.showInGameTab !== false).length > 0;
              const isExpanded = expandedOtherTags[item.entity.id] === true;

              return (
                <div key={`other-${index}`} className="flex flex-col p-1.5 rounded bg-muted/30">
                  <div className="flex items-center justify-between text-xs">
                     <span className="truncate flex-1 font-medium">
                        {item.type === 'player' ? (item.entity as Player).name : `Marqueur: ${(item.entity as Marker).tag.name}`}
                     </span>
                     <span className="text-[10px] text-muted-foreground w-12 text-right">
                       {item.type === 'player' && (item.entity as Player).isDead ? '(Mort)' : ''}
                     </span>
                  </div>

                  {hasTags && (
                    <div className="flex flex-col gap-1 mt-1 border-t border-border/50 pt-1">
                      <button
                        onClick={() => toggleOtherTag(item.entity.id)}
                        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors w-max"
                      >
                        {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                        Tags ({(item.entity as Player).tags.filter((t: TagInstance) => t.showInGameTab !== false).length})
                      </button>

                      {isExpanded && (item.entity as Player).tags.filter((t: TagInstance) => t.showInGameTab !== false).map((tag: TagInstance) => (
                        <div key={tag.instanceId} className="flex flex-col gap-1 pl-4 pr-1 bg-background/50 rounded py-1 mt-1">
                          <span className="text-[10px] font-semibold text-muted-foreground" title={tag.name}>Tag: {tag.name}</span>

                          {tag.uses !== null && (
                            <div className="flex items-center justify-between pl-2">
                              <span className="text-[9px] text-muted-foreground">Utilisations</span>
                              <div className="flex items-center gap-0.5">
                                <button onClick={() => handleModifyTagField((item.entity as Player), tag, 'uses', -1)} className="w-3.5 h-3.5 flex items-center justify-center bg-accent rounded text-[9px] hover:bg-accent/80">-</button>
                                <span className="text-[9px] w-3 text-center">{tag.uses}</span>
                                <button onClick={() => handleModifyTagField((item.entity as Player), tag, 'uses', 1)} className="w-3.5 h-3.5 flex items-center justify-center bg-accent rounded text-[9px] hover:bg-accent/80">+</button>
                              </div>
                            </div>
                          )}
                          {tag.lives !== null && (
                            <div className="flex items-center justify-between pl-2">
                              <span className="text-[9px] text-muted-foreground">Vies</span>
                              <div className="flex items-center gap-0.5">
                                <button onClick={() => handleModifyTagField((item.entity as Player), tag, 'lives', -1)} className="w-3.5 h-3.5 flex items-center justify-center bg-accent rounded text-[9px] hover:bg-accent/80">-</button>
                                <span className="text-[9px] w-3 text-center">{tag.lives}</span>
                                <button onClick={() => handleModifyTagField((item.entity as Player), tag, 'lives', 1)} className="w-3.5 h-3.5 flex items-center justify-center bg-accent rounded text-[9px] hover:bg-accent/80">+</button>
                              </div>
                            </div>
                          )}
                          {tag.votes !== null && (
                            <div className="flex items-center justify-between pl-2">
                              <span className="text-[9px] text-muted-foreground">Votes</span>
                              <div className="flex items-center gap-0.5">
                                {tag.votes !== -1 && <button onClick={() => handleModifyTagField((item.entity as Player), tag, 'votes', -1)} className="w-3.5 h-3.5 flex items-center justify-center bg-accent rounded text-[9px] hover:bg-accent/80">-</button>}
                                <span className="text-[9px] w-8 text-center">{tag.votes === -1 ? 'Illimité' : tag.votes}</span>
                                {tag.votes !== -1 && <button onClick={() => handleModifyTagField((item.entity as Player), tag, 'votes', 1)} className="w-3.5 h-3.5 flex items-center justify-center bg-accent rounded text-[9px] hover:bg-accent/80">+</button>}
                              </div>
                            </div>
                          )}
                          {tag.points !== null && (
                            <div className="flex items-center justify-between pl-2">
                              <span className="text-[9px] text-muted-foreground">Points</span>
                              <div className="flex items-center gap-0.5">
                                <button onClick={() => handleModifyTagField((item.entity as Player), tag, 'points', -1)} className="w-3.5 h-3.5 flex items-center justify-center bg-accent rounded text-[9px] hover:bg-accent/80">-</button>
                                <span className="text-[9px] w-3 text-center">{tag.points}</span>
                                <button onClick={() => handleModifyTagField((item.entity as Player), tag, 'points', 1)} className="w-3.5 h-3.5 flex items-center justify-center bg-accent rounded text-[9px] hover:bg-accent/80">+</button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};