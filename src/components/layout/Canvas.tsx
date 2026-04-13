import React, { useRef, useState, useEffect } from 'react';
import { useStore } from 'zustand';
import { useVttStore } from '../../store';
import { ZoomIn, ZoomOut, Maximize, Tag, Skull, Trash2, Settings, ChevronRight, Sun, Moon, Copy, Heart, icons, Users, Hand, MousePointer2, Undo2, Redo2, Radio, Lock, Globe, Bell, Check, X, WifiOff, FileText, FastForward } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { Marker, Player } from '../../types';

export const Canvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    roomName, setRoomName, roomCode, generateRoomCode, clearRoomCode, isRoomPublic, toggleRoomPublic,
    joinRequests, removeJoinRequest, onlinePlayerIds,
    canvas, setPan, setZoom, isNight, nextCycle, cycleMode,
    players, updatePlayer, updatePlayers, addPlayer, deletePlayer, clearPlayers,
    markers, updateMarker, addMarker, deleteMarker, clearMarkers,
    roles, teams, grid, room, displaySettings,
    selectedEntityIds, setSelectedEntityIds, clearSelection,
    interactionMode, setInteractionMode
  } = useVttStore();

  const { undo, redo, pastStates, futureStates } = useStore(useVttStore.temporal);

  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [selectionBoxStart, setSelectionBoxStart] = useState<{ x: number, y: number } | null>(null);
  const [selectionBoxCurrent, setSelectionBoxCurrent] = useState<{ x: number, y: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(containerRef.current);
    setContainerSize({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
    return () => observer.disconnect();
  }, []);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, type: 'player' | 'marker' | 'canvas' | 'group', entityId: string | null } | null>(null);
  const [mergeConfirm, setMergeConfirm] = useState<{ marker: Marker, hitPlayer: Player, canvasX: number, canvasY: number } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    title: string,
    message: string,
    onConfirm: () => void
  } | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    joueurs: true,
    roles: true,
    equipes: true,
    tags: true,
    aides: true,
    salle: true,
    outils: true,
    mode: 'default' as 'default' | 'reset' | 'merge'
  });

  const handleExport = () => {
    const state = useVttStore.getState();
    const stateToSave: any = { _importMode: exportOptions.mode };
    
    if (exportOptions.joueurs) {
      stateToSave.players = state.players;
      stateToSave.playerTemplates = state.playerTemplates;
    }
    if (exportOptions.roles) {
      stateToSave.roles = state.roles;
    }
    if (exportOptions.equipes) {
      stateToSave.teams = state.teams;
    }
    if (exportOptions.tags) {
      stateToSave.tags = state.tags;
      stateToSave.tagCategories = state.tagCategories;
    }
    if (exportOptions.aides) {
      stateToSave.handouts = state.handouts;
    }
    if (exportOptions.salle) {
      stateToSave.room = state.room;
      stateToSave.grid = state.grid;
      stateToSave.canvas = state.canvas;
      stateToSave.roomName = state.roomName;
    }
    if (exportOptions.outils) {
      stateToSave.markers = state.markers;
      stateToSave.markerParameters = state.markerParameters;
      stateToSave.isNight = state.isNight;
      stateToSave.cycleNumber = state.cycleNumber;
      stateToSave.activeLeftTab = state.activeLeftTab;
      stateToSave.displaySettings = state.displaySettings;
    }

    const stateStr = JSON.stringify(stateToSave, null, 2);
    const blob = new Blob([stateStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeRoomName = roomName ? roomName.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'vtt_state';
    a.download = `${safeRoomName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };
  const [hoveredId, setHoveredId] = useState<string | null>(null);



  const handleContextMenu = (e: React.MouseEvent, type: 'player' | 'marker' | 'canvas' | 'group', entityId: string | null = null) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, type, entityId });
  };

  const closeContextMenu = () => {
    if (contextMenu) setContextMenu(null);
  };

  const handleAcceptJoin = (playerName: string) => {
    removeJoinRequest(playerName);

    // Auto-add player to canvas at center
    const { panX, panY, zoom } = canvas;
    // Fallback to center-ish if we can't reliably measure
    const centerX = (-panX + 500) / zoom;
    const centerY = (-panY + 400) / zoom;

    addPlayer({
      name: playerName,
      color: useVttStore.getState().recentColors[Math.floor(Math.random() * useVttStore.getState().recentColors.length)] || '#3b82f6',
      size: 40,
      x: centerX,
      y: centerY,
      roleId: null,
      teamId: null,
      isDead: false,
      tags: [],
    });
    useVttStore.getState().addLog(`${playerName} a rejoint la partie.`, 'system');
  };

  const handleRejectJoin = (playerName: string) => {
    removeJoinRequest(playerName);
  };

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const snapToGrid = (value: number, gridSize: number) => {
    return Math.round(value / gridSize) * gridSize;
  };

  const calculateTagEffect = (currentValue: number, tagValue: string | number | null): number => {
    if (tagValue === null || tagValue === undefined || tagValue === '') return currentValue;
    
    const strVal = String(tagValue).trim();
    if (strVal.startsWith('+')) {
      return currentValue + (parseFloat(strVal.substring(1)) || 0);
    } else if (strVal.startsWith('-')) {
      return currentValue - (parseFloat(strVal.substring(1)) || 0);
    } else {
      // Valor brute (sans signe) = valeur absolue
      const parsed = parseFloat(strVal);
      return isNaN(parsed) ? currentValue : parsed;
    }
  };

  const applyTagToPlayer = (player: Player, tagModel: any) => {
    const role = roles.find(r => r.id === player.roleId);
    
    // Calculate new persistent stats
    const newLives = calculateTagEffect(player.lives ?? role?.lives ?? 0, tagModel.lives);
    const newPoints = calculateTagEffect(player.points ?? 0, tagModel.points);
    const newVotes = calculateTagEffect(player.votes ?? 0, tagModel.votes);

    const newTags = [...player.tags];
    const parentInstId = uuidv4();

    // Add the parent tag - we "consume" the numerical values into the player stats
    // but we can keep them as strings in description or just clear them to avoid double-summing
    newTags.push({ 
      ...tagModel, 
      instanceId: parentInstId,
      // We clear these so they don't get added again by dynamic aggregation if any remains
      lives: null,
      points: null,
      votes: null
    });

    // If it's a container, apply children too
    if (tagModel.childTagIds && tagModel.childTagIds.length > 0) {
      tagModel.childTagIds.forEach((childId: string) => {
        const childModel = useVttStore.getState().tags.find(t => t.id === childId);
        if (childModel) {
          newTags.push({ 
            ...childModel, 
            instanceId: uuidv4(), 
            parentTagInstanceId: parentInstId,
            lives: null,
            points: null,
            votes: null
          });
        }
      });
    }

    useVttStore.getState().updatePlayer(player.id, { 
      tags: newTags,
      lives: newLives,
      points: newPoints,
      votes: newVotes
    });
    
    useVttStore.getState().addLog(`${player.name} reçoit "${tagModel.name}"`, 'action');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const coords = getCanvasCoordinates(e);
    let canvasX = coords.x;
    let canvasY = coords.y;

    if (grid.enabled) {
      canvasX = snapToGrid(canvasX, grid.sizeX);
      canvasY = snapToGrid(canvasY, grid.sizeY);
    }

    try {
      const payload = JSON.parse(e.dataTransfer.getData('application/json'));

      if (payload.type === 'new_player') {
        // Cloning a player from left panel
        const newPlayer = {
          ...payload.data,
          size: payload.data.size || 40,
          imageUrl: payload.data.imageUrl,
          isDead: false,
          tags: [],
          x: canvasX,
          y: canvasY,
          id: undefined
        };
        addPlayer(newPlayer);
      } else if (payload.type === 'existing_player') {
        // Moving an existing player
        updatePlayer(payload.data.id, { x: canvasX, y: canvasY });
      } else if (payload.type === 'new_marker') {
        // Creating a new marker from a tag model
        addMarker({
          x: canvasX,
          y: canvasY,
          tag: { ...payload.data, instanceId: uuidv4() }
        });
      } else if (payload.type === 'existing_marker') {
        // Moving an existing marker, check for collision with players for merge
        const marker = payload.data as Marker;

        // Find if dropped on a player
        const hitPlayer = players.find(p => {
          const dx = p.x - canvasX;
          const dy = p.y - canvasY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          return distance <= p.size; // Simple circle collision
        });

        if (hitPlayer) {
          if (displaySettings.autoMergeTags) {
            applyTagToPlayer(hitPlayer, marker.tag);
            deleteMarker(marker.id);
          } else {
            setMergeConfirm({ marker, hitPlayer, canvasX, canvasY });
          }
          return;
        }

        // If not merged, just update position
        updateMarker(marker.id, { x: canvasX, y: canvasY });
      } else if (payload.type === 'group_move') {
        const anchorId = payload.anchorId;
        const anchorPlayer = players.find(p => p.id === anchorId);
        const anchorMarker = markers.find(m => m.id === anchorId);

        const anchorEntity = anchorPlayer || anchorMarker;
        if (!anchorEntity) return;

        // Calculate delta
        const dx = canvasX - anchorEntity.x;
        const dy = canvasY - anchorEntity.y;

        // Apply delta to all selected entities
        selectedEntityIds.forEach(id => {
          const player = players.find(p => p.id === id);
          if (player) {
            updatePlayer(player.id, { x: player.x + dx, y: player.y + dy });
          } else {
            const marker = markers.find(m => m.id === id);
            if (marker) {
              updateMarker(marker.id, { x: marker.x + dx, y: marker.y + dy });
            }
          }
        });
      }
    } catch (err) {
      console.error("Drop error", err);
    }
  };


  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey) {
      // Zoom
      const zoomSensitivity = 0.001;
      const newZoom = Math.min(Math.max(0.1, canvas.zoom - e.deltaY * zoomSensitivity), 5);
      setZoom(newZoom);
    } else {
      // Pan
      setPan(canvas.panX - e.deltaX, canvas.panY - e.deltaY);
    }
  };

  const getCanvasCoordinates = (e: React.MouseEvent | React.DragEvent) => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };

    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left - canvas.panX - rect.width / 2) / canvas.zoom;
    const y = (e.clientY - rect.top - canvas.panY - rect.height / 2) / canvas.zoom;
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    closeContextMenu();

    // Only start panning if clicking directly on the canvas background, not on entities
    if ((e.target as HTMLElement).closest('.canvas-entity')) {
      return;
    }

    if (!e.shiftKey) {
      clearSelection();
    }

    if (e.button === 1 || (e.button === 0 && e.altKey) || e.button === 0) {
      e.preventDefault();

      if (e.button === 1 || (e.button === 0 && e.altKey) || (e.button === 0 && interactionMode === 'pan')) {
        setIsPanning(true);
        setStartPan({ x: e.clientX, y: e.clientY });
      } else if (e.button === 0 && interactionMode === 'select') {
        setIsSelecting(true);
        const coords = getCanvasCoordinates(e);
        setSelectionBoxStart(coords);
        setSelectionBoxCurrent(coords);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isSelecting && selectionBoxStart) {
      setSelectionBoxCurrent(getCanvasCoordinates(e));
      return;
    }

    if (isPanning) {
      const dx = e.clientX - startPan.x;
      const dy = e.clientY - startPan.y;
      setPan(canvas.panX + dx, canvas.panY + dy);
      setStartPan({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isSelecting && selectionBoxStart && selectionBoxCurrent) {
      // Calculate selected entities
      const minX = Math.min(selectionBoxStart.x, selectionBoxCurrent.x);
      const maxX = Math.max(selectionBoxStart.x, selectionBoxCurrent.x);
      const minY = Math.min(selectionBoxStart.y, selectionBoxCurrent.y);
      const maxY = Math.max(selectionBoxStart.y, selectionBoxCurrent.y);

      const newlySelectedIds: string[] = [];

      players.forEach(p => {
        // simple box check for center of player
        if (p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY) {
          newlySelectedIds.push(p.id);
        }
      });

      markers.forEach(m => {
        if (m.x >= minX && m.x <= maxX && m.y >= minY && m.y <= maxY) {
          newlySelectedIds.push(m.id);
        }
      });

      if (e.shiftKey) {
        setSelectedEntityIds([...new Set([...selectedEntityIds, ...newlySelectedIds])]);
      } else {
        setSelectedEntityIds(newlySelectedIds);
      }

      setIsSelecting(false);
      setSelectionBoxStart(null);
      setSelectionBoxCurrent(null);
    }

    setIsPanning(false);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const preventDefaultWheel = (e: WheelEvent) => {
        if (e.ctrlKey) e.preventDefault();
      };
      container.addEventListener('wheel', preventDefaultWheel, { passive: false });
      return () => container.removeEventListener('wheel', preventDefaultWheel);
    }
  }, []);

  // Auto-kill logic based on derived lives
  useEffect(() => {
    let hasChanges = false;
    const updates = players.map(player => {
      if (player.isDead) return null; // Already dead, ignore

      const role = roles.find(r => r.id === player.roleId);
      const baseLives = role?.lives ?? null;

      // If the player has no role, or the role has 0 or null base lives, they shouldn't auto-die
      // unless a negative tag explicitly kills them.
      // A tag life modifier acts on the base. If base is not defined, we assume it's "not tracked" (null).
      // However, roles default to 1 live usually. If base is 0, and no tags affect it, it means it doesn't use lives.

      const hasBaseLives = role !== undefined && baseLives !== null && baseLives > 0;

      const tagLives = player.tags.reduce((sum, t) => sum + (Number(t.lives) || 0), 0);
      const roleTagLives = role?.tags?.reduce((sum, t) => sum + (Number(t.lives) || 0), 0) || 0;

      const totalTagModifiers = tagLives + roleTagLives;

      // We auto-kill if:
      // 1. They have base lives, and the modifiers bring total to <= 0.
      // 2. They don't have base lives, but a negative modifier brings the sum to <= 0.
      // Wait, if they don't have base lives (like 0), they shouldn't start dead.
      // So if (baseLives === 0 && totalTagModifiers === 0), they are NOT dead.
      // If (baseLives === 0 && totalTagModifiers < 0), they ARE dead.
      // If (baseLives > 0 && baseLives + totalTagModifiers <= 0), they ARE dead.

      let shouldDie = false;

      if (hasBaseLives) {
        shouldDie = (baseLives + totalTagModifiers) <= 0;
      } else {
        shouldDie = totalTagModifiers < 0;
      }

      if (shouldDie) {
        hasChanges = true;
        return player.id;
      }
      return null;
    }).filter(id => id !== null) as string[];

    if (hasChanges) {
      updates.forEach(id => {
        updatePlayer(id, { isDead: true });
        const p = players.find(x => x.id === id);
        if (p) {
          useVttStore.getState().addLog(`${p.name} est mort(e)`, 'death');
        }
      });
    }
  }, [players, roles, updatePlayer]);

  return (
    <div className="flex-1 relative flex flex-col min-w-0">
      {/* Banner */}
      <div className="h-12 bg-card border-b border-border flex items-center shrink-0 z-40 relative shadow-sm px-4 justify-between">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            className="text-lg font-bold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary/50 rounded px-2 w-48"
            placeholder="Nom de la salle"
            title="Nom de la salle"
          />

          <button
            onClick={() => setShowExportModal(true)}
            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-accent rounded-md transition-colors"
            title="Exporter l'état (JSON)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
          </button>


        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs text-muted-foreground font-medium">
            <span className="mr-2 border-r border-border pr-2">v0.709</span>
            {onlinePlayerIds.length} Joueur(s)
          </div>
          {!roomCode ? (
            <button
              onClick={generateRoomCode}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-semibold transition-colors shadow-sm"
              title="Créer un code pour que les joueurs vous rejoignent avec leur smartphone"
            >
              <Radio size={16} /> Héberger
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded px-3 py-1 shadow-inner relative">

              {/* Join Requests Notification Dropdown */}
              {joinRequests.length > 0 && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-popover border border-border rounded-md shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-border bg-muted flex items-center justify-between">
                    <span className="text-xs font-semibold flex items-center gap-2 text-primary">
                      <Bell size={12} className="animate-pulse" />
                      Demandes de connexion
                    </span>
                    <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {joinRequests.length}
                    </span>
                  </div>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                    {joinRequests.map(req => (
                      <div key={req} className="flex items-center justify-between p-2 hover:bg-accent rounded-sm group">
                        <span className="text-sm font-medium truncate pr-2">{req}</span>
                        <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleAcceptJoin(req)} className="p-1 bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded transition-colors" title="Accepter">
                            <Check size={14} />
                          </button>
                          <button onClick={() => handleRejectJoin(req)} className="p-1 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors" title="Refuser">
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 uppercase tracking-widest font-bold">Code :</span>
                <span className="text-lg font-black tracking-widest text-blue-400 select-all">{roomCode}</span>
              </div>
              <div className="h-4 w-px bg-zinc-700" />
              <button
                onClick={toggleRoomPublic}
                className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded transition-colors ${isRoomPublic ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'}`}
                title={isRoomPublic ? "Les joueurs apparaissent directement sur le plateau" : "Vous devrez valider l'entrée des joueurs"}
              >
                {isRoomPublic ? <><Globe size={12} /> Publique</> : <><Lock size={12} /> Privée</>}
              </button>
              <button
                onClick={clearRoomCode}
                className="ml-1 p-1 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
                title="Fermer la connexion (Déconnecter tous les joueurs)"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-background outline-none"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onContextMenu={(e) => {
          // Intercept context menu on the canvas background
          if (!(e.target as HTMLElement).closest('.canvas-entity')) {
            handleContextMenu(e, 'canvas');
          }
        }}
        tabIndex={0}
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      >
        {/* Cycle Icon */}
        {displaySettings.showCycleIcon && (
          <button
            onClick={nextCycle}
            className="absolute top-4 left-4 z-50 p-3 rounded-full shadow-lg bg-card/80 backdrop-blur border border-border hover:bg-accent hover:text-accent-foreground transition-all flex items-center justify-center group"
            title={cycleMode === 'dayNight' ? `Passer au ${isNight ? 'Jour' : 'Nuit'}` : 'Passer au tour suivant'}
          >
            {cycleMode === 'dayNight' ? (
              isNight ? <Sun className="text-yellow-500 group-hover:scale-110 transition-transform" size={28} /> : <Moon className="text-blue-400 group-hover:scale-110 transition-transform" size={28} />
            ) : (
              <FastForward className="text-primary group-hover:scale-110 transition-transform" size={28} />
            )}
          </button>
        )}

        {/* Night Overlay */}
        {isNight && cycleMode === 'dayNight' && (
          <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none transition-opacity duration-1000" />
        )}

        {/* Grid Overlay */}
        {grid.enabled && (
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
              backgroundSize: `${grid.sizeX * canvas.zoom}px ${grid.sizeY * canvas.zoom}px`,
              backgroundPosition: `${(canvas.panX + containerSize.width / 2) % (grid.sizeX * canvas.zoom)}px ${(canvas.panY + containerSize.height / 2) % (grid.sizeY * canvas.zoom)}px`
            }}
          />
        )}

        <div className="absolute bottom-4 left-4 z-40 flex gap-2 bg-card p-2 rounded-lg border border-border shadow-md">
          <button onClick={() => setZoom(Math.max(0.1, canvas.zoom - 0.1))} className="p-1 hover:bg-accent rounded-md"><ZoomOut size={20} /></button>
          <span className="w-12 text-center text-sm flex items-center justify-center font-mono">{(canvas.zoom * 100).toFixed(0)}%</span>
          <button onClick={() => setZoom(Math.min(5, canvas.zoom + 0.1))} className="p-1 hover:bg-accent rounded-md"><ZoomIn size={20} /></button>
          <div className="w-px h-6 bg-border mx-1" />
          <button onClick={() => { setZoom(1); setPan(0, 0); }} className="p-1 hover:bg-accent rounded-md" title="Reset View"><Maximize size={20} /></button>
          <div className="w-px h-6 bg-border mx-1" />
          <button
            onClick={() => undo()}
            disabled={pastStates.length === 0}
            className={`p-1 rounded-md ${pastStates.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent'}`}
            title="Annuler (Undo)"
          >
            <Undo2 size={20} />
          </button>
          <button
            onClick={() => redo()}
            disabled={futureStates.length === 0}
            className={`p-1 rounded-md ${futureStates.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent'}`}
            title="Rétablir (Redo)"
          >
            <Redo2 size={20} />
          </button>
          <div className="w-px h-6 bg-border mx-1" />
          <button
            onClick={() => setInteractionMode('pan')}
            className={`p-1 rounded-md ${interactionMode === 'pan' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
            title="Mode Déplacement (Pan)"
          >
            <Hand size={20} />
          </button>
          <button
            onClick={() => setInteractionMode('select')}
            className={`p-1 rounded-md ${interactionMode === 'select' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
            title="Mode Sélection Multiple"
          >
            <MousePointer2 size={20} />
          </button>
        </div>

        {/* The actual infinite canvas */}
        <div
          className="absolute origin-center"
          style={{
            transform: `translate(${canvas.panX}px, ${canvas.panY}px) scale(${canvas.zoom})`,
            left: '50%',
            top: '50%',
            width: 0,
            height: 0,
          }}
        >
          {/* Room Area */}
          <div
            className="absolute origin-center transition-colors duration-500 shadow-2xl"
            style={{
              width: room.width,
              height: room.height,
              left: -room.width / 2,
              top: -room.height / 2,
              backgroundColor: room.backgroundColor,
              backgroundImage: room.backgroundImage ? `url(${room.backgroundImage})` : 'none',
              backgroundRepeat: room.backgroundStyle === 'mosaic' ? 'repeat' : 'no-repeat',
              backgroundPosition: room.backgroundStyle === 'center' ? 'center' : '0 0',
              backgroundSize: room.backgroundStyle === 'stretch' ? '100% 100%' : 'auto',
              border: '2px solid rgba(0,0,0,0.1)',
              borderRadius: '8px',
              pointerEvents: 'none', // Allow clicking through to canvas for panning
            }}
          />

          {/* Origin indicator (0,0) */}
          {displaySettings.showCenter && (
            <div className="absolute w-4 h-4 rounded-full bg-red-500/50 -ml-2 -mt-2" />
          )}

          {/* Selection Box (Layered below entities) */}
          <svg
            className="absolute pointer-events-none"
            style={{
              zIndex: 1,
              overflow: 'visible',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%'
            }}
          >
            {isSelecting && selectionBoxStart && selectionBoxCurrent && (
              <rect
                x={Math.min(selectionBoxStart.x, selectionBoxCurrent.x)}
                y={Math.min(selectionBoxStart.y, selectionBoxCurrent.y)}
                width={Math.abs(selectionBoxCurrent.x - selectionBoxStart.x)}
                height={Math.abs(selectionBoxCurrent.y - selectionBoxStart.y)}
                fill="rgba(59, 130, 246, 0.2)"
                stroke="rgba(59, 130, 246, 0.8)"
                strokeWidth={2}
                pointerEvents="none"
              />
            )}
          </svg>

          {/* Render Players */}
          {displaySettings.showPlayers && players.map(player => {
            const role = roles.find(r => r.id === player.roleId);

            // Determine overrides from tags
            const tagSeenRole = player.tags.find(t => t.seenAsRoleId)?.seenAsRoleId;
            const tagSeenTeam = player.tags.find(t => t.seenInTeamId)?.seenInTeamId;

            // Determine effective team (tag override -> role's seenInTeamId -> role's actual teamId -> player's teamId)
            const effectiveTeamId = tagSeenTeam || role?.seenInTeamId || role?.teamId || player.teamId;
            const team = teams.find(t => t.id === effectiveTeamId);

            // Determine effective role for tooltip
            const effectiveRoleId = tagSeenRole || role?.seenAsRoleId || role?.id;
            const effectiveRole = roles.find(r => r.id === effectiveRoleId);

            // Calculate Total Lives
            const baseLives = player.lives ?? role?.lives ?? 0;
            const tagLives = player.tags.reduce((sum, t) => sum + (Number(t.lives) || 0), 0);
            const roleTagLives = role?.tags?.reduce((sum, t) => sum + (Number(t.lives) || 0), 0) || 0;
            const totalLives = baseLives + tagLives + roleTagLives;

            // Compute other stats for custom badges
            const getAggregatedValue = (field: 'votes' | 'points' | 'uses') => {
              const baseVal = field === 'uses' ? 0 : (player[field] || 0);
              const val1 = player.tags.reduce((sum, t) => sum + (Number(t[field]) || 0), 0);
              const val2 = role?.tags?.reduce((sum, t) => sum + (Number(t[field]) || 0), 0) || 0;
              return baseVal + val1 + val2;
            };

            // For call orders, pick the minimum
            const getMinOrder = (field: 'callOrderDay' | 'callOrderNight') => {
              const vals = ([
                ...player.tags.map(t => t[field]),
                ...(role?.tags || []).map(t => t[field])
              ].filter(v => v !== null && v !== '') as (string | number)[])
               .map(v => Number(v))
               .filter(v => !isNaN(v));
               
              if (vals.length === 0) return null;
              return Math.min(...vals);
            };

            const customBadgeValues: Record<string, string | number | null> = {
              votes: getAggregatedValue('votes'),
              points: getAggregatedValue('points'),
              uses: getAggregatedValue('uses'),
              callOrderDay: getMinOrder('callOrderDay'),
              callOrderNight: getMinOrder('callOrderNight'),
            };

            const renderBadge = (position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight') => {
              const config = displaySettings.playerBadges?.[position];
              if (!config || config.type === 'none') return null;

              const baseClasses = "absolute min-w-[24px] h-6 px-1 rounded-full flex items-center justify-center border-2 border-background shadow-sm text-[11px] font-bold z-20";
              let posClass = "";
              switch (position) {
                case 'topLeft': posClass = "-top-1 -left-1"; break;
                case 'topRight': posClass = "-top-1 -right-1"; break;
                case 'bottomLeft': posClass = "-bottom-1 -left-1"; break;
                case 'bottomRight': posClass = "-bottom-1 -right-1"; break;
              }

              if (config.type === 'team') {
                if (!team) return null;
                return (
                  <div
                    key={position}
                    className={`${baseClasses} ${posClass} !w-6 !min-w-[24px]`}
                    style={{ backgroundColor: team.color }}
                    title={`Équipe: ${team.name}`}
                  >
                    {team.icon && icons[team.icon as keyof typeof icons] ? (
                      React.createElement(icons[team.icon as keyof typeof icons], { size: 12, className: "text-white drop-shadow" })
                    ) : null}
                  </div>
                );
              }

              if (config.type === 'lives') {
                // Note: 'topRight' gets the heart specifically, but we apply heart to any 'lives' type as per the request implied context
                // The user specifically asked "Pour la pastille en haut à droite, peux tu lui mettre une forme de cœur".
                // We'll apply the heart shape styling if type === 'lives'.
                return (
                  <div
                    key={position}
                    className={`absolute ${posClass} z-20 w-7 h-7 flex items-center justify-center`}
                    title={`Vies: ${totalLives}`}
                  >
                    <Heart
                      className="absolute w-full h-full drop-shadow-sm"
                      fill={player.isDead ? '#3f3f46' : config.bgColor} // zinc-700
                      color={player.isDead ? '#27272a' : config.bgColor} // zinc-800 outline
                    />
                    <span
                      className="relative z-10 text-[11px] font-bold"
                      style={{ color: player.isDead ? '#a1a1aa' : config.textColor }} // zinc-400
                    >
                      {totalLives}
                    </span>
                  </div>
                );
              }

              if (config.type === 'connection') {
                if (!roomCode || onlinePlayerIds.includes(player.id)) return null;
                return (
                  <div
                    key={position}
                    className={`${baseClasses} ${posClass} !w-6 !min-w-[24px] bg-destructive text-destructive-foreground`}
                    title="Hors ligne"
                  >
                    <WifiOff size={12} />
                  </div>
                );
              }

              // Other generic values (votes, points, uses, call orders)
              const val = customBadgeValues[config.type];
              if (val === null || val === undefined) return null;

              return (
                <div
                  key={position}
                  className={`${baseClasses} ${posClass}`}
                  style={{ backgroundColor: config.bgColor, color: config.textColor }}
                  title={`${config.type}: ${val}`}
                >
                  {val}
                </div>
              );
            };

            let imageToShow = null;
            if (displaySettings.showPlayerImage && player.imageUrl && displaySettings.showRoleImage && role?.imageUrl) {
              imageToShow = displaySettings.imagePriority === 'player' ? player.imageUrl : role.imageUrl;
            } else if (displaySettings.showPlayerImage && player.imageUrl) {
              imageToShow = player.imageUrl;
            } else if (displaySettings.showRoleImage && role?.imageUrl) {
              imageToShow = role.imageUrl;
            }

            return (
              <div
                key={player.id}
                className={`absolute canvas-entity group ${selectedEntityIds.includes(player.id) ? 'ring-4 ring-blue-500 rounded-full' : ''}`}
                style={{
                  left: player.x,
                  top: player.y,
                  transform: 'translate(-50%, -50%)',
                  cursor: 'grab',
                  zIndex: hoveredId === player.id ? (displaySettings.foregroundElement === 'players' ? 110 : 15) : (displaySettings.foregroundElement === 'players' ? 20 : 10)
                }}
                onMouseEnter={() => setHoveredId(player.id)}
                onMouseLeave={() => setHoveredId(null)}
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  closeContextMenu();

                  // If dragging a selected player, we will handle group drag logic inside handleDrop or onDrag
                  // For now, if dragging a selected one, pass special group drag payload
                  if (selectedEntityIds.includes(player.id) && selectedEntityIds.length > 1) {
                    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'group_move', anchorId: player.id }));
                  } else {
                    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'existing_player', data: player }));
                  }
                }}
                onContextMenu={(e) => {
                  if (selectedEntityIds.includes(player.id) && selectedEntityIds.length > 1) {
                    handleContextMenu(e, 'group');
                  } else {
                    handleContextMenu(e, 'player', player.id);
                  }
                }}
                onDoubleClick={() => useVttStore.getState().setEditingEntity({ type: 'player', id: player.id })}
              >
                <div className="relative flex flex-col items-center justify-center">
                  <div
                    className={`rounded-full shadow-lg flex items-center justify-center transition-all overflow-hidden ${player.isDead ? 'opacity-80' : ''}`}
                    style={{
                      width: player.size * 2,
                      height: player.size * 2,
                      backgroundColor: player.isDead ? '#27272a' : player.color, // zinc-800
                      border: `4px solid ${player.isDead ? '#7f1d1d' : (displaySettings.showRoleColor && role?.color) ? role.color : player.color}`, // red-900 or role/player color
                      padding: imageToShow ? '2px' : '0' // Leave 2px border for color if image exists
                    }}
                  >
                    {imageToShow && !player.isDead && (
                      <img
                        src={imageToShow}
                        alt={player.name}
                        className="w-full h-full object-cover rounded-full bg-background"
                        draggable={false}
                      />
                    )}
                    {player.isDead && (
                      <Skull size={player.size * 1.5} className="absolute text-red-900/60 pointer-events-none" />
                    )}

                    {/* Name inside circle */}
                    {displaySettings.playerNamePosition === 'inside' && (
                      <span className="font-bold text-white text-sm mix-blend-difference drop-shadow-md px-1 text-center leading-tight z-10 pointer-events-none flex flex-col items-center">
                        <span>{player.name}</span>
                        {roomCode && !onlinePlayerIds.includes(player.id) && displaySettings.showOfflineStatus && (
                          <span className="text-[9px] text-destructive opacity-90 -mt-1 drop-shadow-sm font-bold">(hors ligne)</span>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Name below the circle */}
                  {displaySettings.playerNamePosition === 'bottom' && (
                    <div className="absolute top-full mt-1 bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap border border-border pointer-events-none text-center flex flex-col items-center">
                      <span>{player.name}</span>
                      {roomCode && !onlinePlayerIds.includes(player.id) && displaySettings.showOfflineStatus && (
                        <span className="text-[9px] text-destructive opacity-80 -mt-1 leading-tight">(hors ligne)</span>
                      )}
                    </div>
                  )}

                  {/* Name above the circle */}
                  {displaySettings.playerNamePosition === 'top' && (
                    <div className="absolute bottom-full mb-1 bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap border border-border pointer-events-none text-center flex flex-col items-center">
                      <span>{player.name}</span>
                      {roomCode && !onlinePlayerIds.includes(player.id) && displaySettings.showOfflineStatus && (
                        <span className="text-[9px] text-destructive opacity-80 -mt-1 leading-tight">(hors ligne)</span>
                      )}
                    </div>
                  )}

                  {/* Custom Badges */}
                  {renderBadge('topLeft')}
                  {renderBadge('topRight')}
                  {renderBadge('bottomLeft')}
                  {renderBadge('bottomRight')}

                  {/* Selection Pastilles (from smartphone actions) */}
                  {player.selectionPastilles && player.selectionPastilles.length > 0 && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1 z-30">
                      {player.selectionPastilles.map((p, idx) => {
                        const PIcon = icons[p.icon as keyof typeof icons] || Tag;
                        return (
                          <div
                            key={`${p.id}-${idx}`}
                            className="w-5 h-5 rounded-full border-2 border-background shadow-sm flex items-center justify-center bg-card animate-in zoom-in-50 duration-300"
                            style={{ borderColor: p.color }}
                            title="Sélectionné par smartphone"
                          >
                            <PIcon size={10} style={{ color: p.color }} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Tooltip */}
                {displaySettings.showTooltip && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max max-w-[200px] bg-popover text-popover-foreground text-xs p-2 rounded shadow-xl border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {displaySettings.showPlayerName !== false && <p className="font-bold">{player.name}</p>}
                    {displaySettings.showRole && effectiveRole && <p>Rôle: <span style={{ color: effectiveRole.color }}>{effectiveRole.name}</span></p>}
                    {displaySettings.showTeam && team && <p>Équipe: <span style={{ color: team.color }}>{team.name}</span></p>}
                    {player.isDead && <p className="text-destructive font-bold">Mort</p>}
                    {displaySettings.showTags && displaySettings.showTagTooltip !== false && (
                      player.tags.some(t => t.showInTooltip !== false) ||
                      (role && role.tags && role.tags.some(t => t.showInTooltip !== false))
                    ) && (
                        <div className="mt-1 border-t border-border pt-1">
                          <p className="font-semibold text-[10px] text-muted-foreground">Tags:</p>
                          <ul className="flex flex-col gap-1 mt-1">
                            {role?.tags?.filter(t => t.showInTooltip !== false).map(t => {
                              const TIcon = icons[t.icon as keyof typeof icons] || Tag;
                              return (
                                <li key={`role-tag-${t.id}`} className="flex flex-col bg-muted px-1.5 py-0.5 rounded text-[10px] border border-dashed border-border" title="Tag de Rôle">
                                  <div className="flex items-center gap-1">
                                    {t.imageUrl ? (
                                      <img src={t.imageUrl} alt={t.name} className="w-3 h-3 rounded-full object-cover" />
                                    ) : (
                                      <TIcon size={10} style={{ color: t.color }} />
                                    )}
                                    <span className="font-medium">{t.name} (Rôle)</span>
                                  </div>
                                  {(t.uses !== null || t.points !== null || t.votes !== null || t.lives !== null || t.callOrderDay !== null || t.callOrderNight !== null) && (
                                    <div className="text-[9px] text-muted-foreground pl-4 flex flex-wrap gap-x-2">
                                      {displaySettings.showTagCallOrderDay && t.callOrderDay !== null && t.callOrderDay !== '' && <span>J:{t.callOrderDay}</span>}
                                      {displaySettings.showTagCallOrderNight && t.callOrderNight !== null && t.callOrderNight !== '' && <span>N:{t.callOrderNight}</span>}
                                      {displaySettings.showTagLives && t.lives !== null && <span>V:{t.lives}</span>}
                                      {displaySettings.showTagUses && t.uses !== null && <span>Uses: {t.uses}</span>}
                                      {displaySettings.showTagPoints && t.points !== null && <span>Pts: {t.points}</span>}
                                      {displaySettings.showTagVotes && t.votes !== null && <span>Votes: {t.votes === -1 ? 'Illimité' : t.votes}</span>}
                                    </div>
                                  )}
                                  {t.description && <div className="text-[9px] text-muted-foreground pl-4 italic whitespace-pre-wrap">{t.description}</div>}
                                </li>
                              );
                            })}
                            {player.tags.filter(t => t.showInTooltip !== false).map(t => {
                              const TIcon = icons[t.icon as keyof typeof icons] || Tag;
                              return (
                                <li key={t.instanceId} className="flex flex-col bg-muted px-1.5 py-0.5 rounded text-[10px]">
                                  <div className="flex items-center gap-1">
                                    {t.imageUrl ? (
                                      <img src={t.imageUrl} alt={t.name} className="w-3 h-3 rounded-full object-cover" />
                                    ) : (
                                      <TIcon size={10} style={{ color: t.color }} />
                                    )}
                                    <span className="font-medium">{t.name}</span>
                                  </div>
                                  {(t.uses !== null || t.points !== null || t.votes !== null || t.lives !== null || t.callOrderDay !== null || t.callOrderNight !== null) && (
                                    <div className="text-[9px] text-muted-foreground pl-4 flex flex-wrap gap-x-2">
                                      {displaySettings.showTagCallOrderDay && t.callOrderDay !== null && t.callOrderDay !== '' && <span>J:{t.callOrderDay}</span>}
                                      {displaySettings.showTagCallOrderNight && t.callOrderNight !== null && t.callOrderNight !== '' && <span>N:{t.callOrderNight}</span>}
                                      {displaySettings.showTagLives && t.lives !== null && <span>V:{t.lives}</span>}
                                      {displaySettings.showTagUses && t.uses !== null && <span>Uses: {t.uses}</span>}
                                      {displaySettings.showTagPoints && t.points !== null && <span>Pts: {t.points}</span>}
                                      {displaySettings.showTagVotes && t.votes !== null && <span>Votes: {t.votes === -1 ? 'Illimité' : t.votes}</span>}
                                    </div>
                                  )}
                                  {t.description && <div className="text-[9px] text-muted-foreground pl-4 italic whitespace-pre-wrap">{t.description}</div>}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Render Markers */}
          {markers.map(marker => {
            const TagIconComponent = icons[marker.tag.icon as keyof typeof icons] || Tag;
            return (
              <div
                key={marker.id}
                className={`absolute canvas-entity group ${selectedEntityIds.includes(marker.id) ? 'ring-4 ring-blue-500 rounded-lg' : ''}`}
                style={{
                  left: marker.x,
                  top: marker.y,
                  transform: 'translate(-50%, -50%)',
                  cursor: 'grab',
                  zIndex: hoveredId === marker.id ? (displaySettings.foregroundElement === 'markers' ? 110 : 15) : (displaySettings.foregroundElement === 'markers' ? 20 : 10)
                }}
                onMouseEnter={() => setHoveredId(marker.id)}
                onMouseLeave={() => setHoveredId(null)}
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  closeContextMenu();

                  if (selectedEntityIds.includes(marker.id) && selectedEntityIds.length > 1) {
                    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'group_move', anchorId: marker.id }));
                  } else {
                    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'existing_marker', data: marker }));
                  }
                }}
                onContextMenu={(e) => {
                  if (selectedEntityIds.includes(marker.id) && selectedEntityIds.length > 1) {
                    handleContextMenu(e, 'group');
                  } else {
                    handleContextMenu(e, 'marker', marker.id);
                  }
                }}
                onDoubleClick={() => useVttStore.getState().setEditingEntity({ type: 'tagInstance', id: marker.tag.instanceId })}
              >
                <div
                  className="w-10 h-10 rounded-lg shadow-md border-2 flex items-center justify-center bg-card transition-transform hover:scale-110 overflow-hidden"
                  style={{ borderColor: marker.tag.color }}
                >
                  {marker.tag.imageUrl ? (
                    <img src={marker.tag.imageUrl} alt={marker.tag.name} className="w-full h-full object-cover" draggable={false} />
                  ) : (
                    <TagIconComponent size={20} style={{ color: marker.tag.color }} />
                  )}
                </div>

                {/* Tag Name Label */}
                {displaySettings.showTagName && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap border border-border pointer-events-none text-center flex flex-col items-center">
                    <span className="text-xs">{marker.tag.name}</span>
                  </div>
                )}

                {/* Tooltip */}
                {displaySettings.showTagTooltip !== false && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-7 w-max max-w-[200px] bg-popover text-popover-foreground text-xs p-2 rounded shadow-xl border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  <p className="font-bold" style={{ color: marker.tag.color }}>{marker.tag.name}</p>
                  <div className="text-[10px] text-muted-foreground mt-1 flex flex-wrap gap-x-2">
                    {displaySettings.showTagCallOrderDay && marker.tag.callOrderDay !== null && marker.tag.callOrderDay !== '' && <span>J:{marker.tag.callOrderDay}</span>}
                    {displaySettings.showTagCallOrderNight && marker.tag.callOrderNight !== null && marker.tag.callOrderNight !== '' && <span>N:{marker.tag.callOrderNight}</span>}
                    {displaySettings.showTagLives && marker.tag.lives !== null && <span>V:{marker.tag.lives}</span>}
                    {displaySettings.showTagUses && marker.tag.uses !== null && <span>Uses: {marker.tag.uses}</span>}
                    {displaySettings.showTagPoints && marker.tag.points !== null && <span>Pts: {marker.tag.points}</span>}
                    {displaySettings.showTagVotes && marker.tag.votes !== null && <span>Votes: {marker.tag.votes === -1 ? 'Illimité' : marker.tag.votes}</span>}
                  </div>
                  {marker.tag.description && <p className="text-[10px] text-muted-foreground italic mt-1 whitespace-pre-wrap">{marker.tag.description}</p>}
                  </div>
                )}
              </div>
            );
          })}

        </div>

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="fixed z-[100] bg-popover text-popover-foreground border border-border rounded-md shadow-xl py-1 min-w-[120px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            {contextMenu.type === 'player' && players.find(p => p.id === contextMenu.entityId) && (
              <>
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const p = players.find(p => p.id === contextMenu.entityId);
                    if (p) {
                      updatePlayer(p.id, { isDead: !p.isDead });
                      useVttStore.getState().addLog(`${p.name} est ${!p.isDead ? 'mort(e)' : 'ressuscité(e)'}`, !p.isDead ? 'death' : 'system');
                    }
                    closeContextMenu();
                  }}
                >
                  <Skull size={14} className={players.find(p => p.id === contextMenu.entityId)?.isDead ? "text-muted-foreground" : "text-destructive"} />
                  {players.find(p => p.id === contextMenu.entityId)?.isDead ? "Ressusciter" : "Tuer"}
                </button>
                <div className="h-px bg-border my-1" />
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    useVttStore.getState().setEditingEntity({ type: 'player', id: contextMenu.entityId! });
                    closeContextMenu();
                  }}
                >
                  <Settings size={14} />
                  Éditer
                </button>
                
                {(() => {
                  const p = players.find(p => p.id === contextMenu.entityId);
                  if (!p || !p.selectionPastilles || p.selectionPastilles.length === 0) return null;
                  
                  return (
                    <>
                      <div className="h-px bg-border my-1" />
                      {p.selectionPastilles.map(pastille => (
                        <button
                          key={pastille.id}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-destructive/10 text-destructive flex items-center gap-2"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            updatePlayer(p.id, {
                              selectionPastilles: p.selectionPastilles?.filter(ps => ps.id !== pastille.id)
                            });
                            closeContextMenu();
                          }}
                        >
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pastille.color }} />
                          <span className="truncate">Supprimer la pastille {pastille.name || 'Inconnue'}</span>
                        </button>
                      ))}
                    </>
                  );
                })()}

                {/* Utiliser Tag uses */}
                {(() => {
                  const p = players.find(p => p.id === contextMenu.entityId);
                  if (!p) return null;
                  const tagsWithUses = p.tags.filter(t => t.uses !== null);
                  if (tagsWithUses.length === 0) return null;

                  return (
                    <div className="relative group/util">
                      <button className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2"><FastForward size={14} /> Utiliser</span>
                        <ChevronRight size={14} />
                      </button>
                      <div className="absolute left-full top-0 ml-0 bg-popover text-popover-foreground border border-border rounded-md shadow-xl py-1 min-w-[150px] hidden group-hover/util:block z-[101]">
                        {tagsWithUses.map(tag => (
                          <button
                            key={tag.instanceId}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              const nextTags = p.tags.map(t => {
                                if (t.instanceId === tag.instanceId && t.uses !== null) {
                                    return { ...t, uses: Math.max(0, Number(t.uses) - 1) };
                                }
                                return t;
                              });

                              // Supprimer le tag parent ET ses enfants si autoDeleteOnZeroUses déclenche
                              const tagToAutoDelete = nextTags.find(t => t.instanceId === tag.instanceId && t.uses === 0 && t.autoDeleteOnZeroUses);
                              const finalTags = tagToAutoDelete
                                ? nextTags.filter(t =>
                                    t.instanceId !== tagToAutoDelete.instanceId &&
                                    t.parentTagInstanceId !== tagToAutoDelete.instanceId
                                  )
                                : nextTags;

                              updatePlayer(p.id, { tags: finalTags });
                              closeContextMenu();
                            }}
                          >
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                            {tag.name} ({tag.uses})
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div className="relative group">
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2"><FileText size={14} /> Notes</span>
                    <ChevronRight size={14} />
                  </button>
                  <div className="absolute left-full top-0 ml-0 bg-popover text-popover-foreground border border-border rounded-md shadow-xl py-1 min-w-[150px] hidden group-hover:block z-[101]">
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        useVttStore.getState().setEditingEntity({ type: 'playerNotes', id: contextMenu.entityId! });
                        closeContextMenu();
                      }}
                    >
                      <FileText size={14} className="text-blue-400" />
                      Privée
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        useVttStore.getState().setEditingEntity({ type: 'playerPublicNotes', id: contextMenu.entityId! });
                        closeContextMenu();
                      }}
                    >
                      <FileText size={14} className="text-green-400" />
                      Publique
                    </button>
                  </div>
                </div>

                {/* Tags Submenu */}
                {players.find(p => p.id === contextMenu.entityId)!.tags.length > 0 && (
                  <div className="relative group">
                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2"><Tag size={14} /> Éditer les tags</span>
                      <ChevronRight size={14} />
                    </button>
                    <div className="absolute left-full top-0 ml-0 bg-popover text-popover-foreground border border-border rounded-md shadow-xl py-1 min-w-[150px] hidden group-hover:block z-[101]">
                      {players.find(p => p.id === contextMenu.entityId)!.tags.map(tag => (
                        <div key={tag.instanceId} className="flex items-center justify-between px-2 py-1 hover:bg-accent hover:text-accent-foreground">
                          <span className="text-sm truncate flex-1 flex items-center gap-2" title={tag.name}>
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                            {tag.name}
                          </span>
                          <div className="flex items-center gap-1 opacity-60 hover:opacity-100">
                            <button
                              className="p-1 hover:text-primary"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                useVttStore.getState().setEditingEntity({ type: 'tagInstance', id: tag.instanceId, parentId: contextMenu.entityId || undefined });
                                closeContextMenu();
                              }}
                            >
                              <Settings size={14} />
                            </button>
                            <button
                              className="p-1 hover:text-destructive"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                const player = players.find(p => p.id === contextMenu.entityId);
                                if (player) {
                                  setDeleteConfirm({
                                    title: "Supprimer le tag",
                                    message: `Êtes-vous sûr de vouloir supprimer le tag "${tag.name}" de ${player.name} ?`,
                                    onConfirm: () => {
                                      // Cascade delete: if we remove a container, we remove its children too.
                                      const tagsToRemove = new Set([tag.instanceId]);
                                      player.tags.forEach(t => {
                                        if (t.parentTagInstanceId === tag.instanceId) {
                                          tagsToRemove.add(t.instanceId);
                                        }
                                      });

                                      updatePlayer(player.id, {
                                        tags: player.tags.filter(t => !tagsToRemove.has(t.instanceId))
                                      });
                                      setDeleteConfirm(null);
                                      // Keep menu open unless there are no more tags
                                      if (player.tags.length <= tagsToRemove.size) closeContextMenu();
                                    }
                                  });
                                }
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="h-px bg-border my-1" />
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-destructive/10 text-destructive flex items-center gap-2"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    if (contextMenu.entityId) {
                      const player = players.find(p => p.id === contextMenu.entityId);
                      setDeleteConfirm({
                        title: "Supprimer le joueur",
                        message: `Êtes-vous sûr de vouloir supprimer le joueur "${player?.name || 'Inconnu'}" ?`,
                        onConfirm: () => {
                          deletePlayer(contextMenu.entityId!);
                          setDeleteConfirm(null);
                        }
                      });
                    }
                    closeContextMenu();
                  }}
                >
                  <Trash2 size={14} />
                  Supprimer
                </button>
              </>
            )}

            {contextMenu.type === 'marker' && markers.find(m => m.id === contextMenu.entityId) && (
              <>
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const marker = markers.find(m => m.id === contextMenu.entityId);
                    if (marker) {
                      useVttStore.getState().setEditingEntity({ type: 'tagInstance', id: marker.tag.instanceId });
                    }
                    closeContextMenu();
                  }}
                >
                  <Settings size={14} /> Modifier
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const marker = markers.find(m => m.id === contextMenu.entityId);
                    if (marker) {
                      // Create a new instance id for the duplicated tag
                      const duplicatedTag = {
                        ...marker.tag,
                        instanceId: uuidv4()
                      };
                      addMarker({
                        x: marker.x + 20, // offset slightly
                        y: marker.y + 20,
                        tag: duplicatedTag
                      });
                    }
                    closeContextMenu();
                  }}
                >
                  <Copy size={14} /> Dupliquer
                </button>
                <div className="h-px bg-border my-1" />
                <button
                  className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive hover:text-destructive-foreground flex items-center gap-2"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    if (contextMenu.entityId) {
                      const marker = markers.find(m => m.id === contextMenu.entityId);
                      setDeleteConfirm({
                        title: "Supprimer le tag",
                        message: `Êtes-vous sûr de vouloir supprimer le tag "${marker?.tag.name || 'Inconnu'}" du plateau ?`,
                        onConfirm: () => {
                          deleteMarker(contextMenu.entityId!);
                          setDeleteConfirm(null);
                        }
                      });
                    }
                    closeContextMenu();
                  }}
                >
                  <Trash2 size={14} /> Supprimer
                </button>
              </>
            )}

            {contextMenu.type === 'canvas' && (
              <>
                <div className="relative group">
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2"><Users size={14} /> Ajouter un Joueur</span>
                    <ChevronRight size={14} />
                  </button>
                  <div className="absolute left-full top-0 ml-0 bg-popover text-popover-foreground border border-border rounded-md shadow-xl py-1 min-w-[150px] hidden group-hover:block z-[101] max-h-64 overflow-y-auto custom-scrollbar">
                    {useVttStore.getState().playerTemplates.length === 0 ? (
                      <div className="px-4 py-2 text-xs text-muted-foreground italic">Aucun modèle de joueur</div>
                    ) : (
                      useVttStore.getState().playerTemplates.map(pt => (
                        <button
                          key={pt.id}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            const coords = getCanvasCoordinates(e as unknown as React.MouseEvent);
                            let canvasX = coords.x;
                            let canvasY = coords.y;
                            if (grid.enabled) {
                              canvasX = snapToGrid(canvasX, grid.sizeX);
                              canvasY = snapToGrid(canvasY, grid.sizeY);
                            }
                            addPlayer({
                              ...pt,
                              size: pt.size || 40,
                              imageUrl: pt.imageUrl,
                              isDead: false,
                              tags: [],
                              x: canvasX,
                              y: canvasY
                            });
                            closeContextMenu();
                          }}
                        >
                          <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: pt.color }} />
                          {pt.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="relative group">
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2"><Tag size={14} /> Ajouter un Tag</span>
                    <ChevronRight size={14} />
                  </button>
                  <div className="absolute left-full top-0 ml-0 bg-popover text-popover-foreground border border-border rounded-md shadow-xl py-1 min-w-[200px] hidden group-hover:block z-[101] max-h-64 overflow-visible">
                    {useVttStore.getState().tags.length === 0 ? (
                      <div className="px-4 py-2 text-xs text-muted-foreground italic">Aucun modèle de tag</div>
                    ) : (
                      (() => {
                        const state = useVttStore.getState();
                        const tagsByCategory = { 'no-category': [] } as Record<string, typeof state.tags>;
                        state.tagCategories.forEach(cat => tagsByCategory[cat.id] = []);
                        state.tags.forEach(tag => {
                          if (tag.categoryId && tagsByCategory[tag.categoryId]) {
                            tagsByCategory[tag.categoryId].push(tag);
                          } else {
                            tagsByCategory['no-category'].push(tag);
                          }
                        });

                        const handleTagClick = (e: React.MouseEvent, tagModel: any) => {
                          e.stopPropagation();
                          if (!contextMenu) return;
                          const coords = getCanvasCoordinates({ clientX: contextMenu.x, clientY: contextMenu.y } as unknown as React.MouseEvent);
                          let canvasX = coords.x;
                          let canvasY = coords.y;
                          if (state.grid.enabled) {
                            canvasX = snapToGrid(canvasX, state.grid.sizeX);
                            canvasY = snapToGrid(canvasY, state.grid.sizeY);
                          }

                          addMarker({
                            x: canvasX,
                            y: canvasY,
                            tag: { ...tagModel, instanceId: uuidv4() }
                          });
                          closeContextMenu();
                        };

                        return (
                          <>
                            {state.tagCategories.map(cat => {
                              const catTags = tagsByCategory[cat.id];
                              if (!catTags || catTags.length === 0) return null;
                              const CatIcon = icons[cat.icon as keyof typeof icons] || icons.Folder;
                              return (
                                <div key={cat.id} className="relative group/cat">
                                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center justify-between gap-2">
                                    <span className="flex items-center gap-2">
                                      <div className="p-1 rounded bg-background shadow-sm" style={{ color: cat.color }}>
                                        <CatIcon size={12} />
                                      </div>
                                      <span style={{ color: cat.color, fontWeight: 600 }}>{cat.name}</span>
                                    </span>
                                    <ChevronRight size={14} />
                                  </button>
                                  <div className="absolute left-full top-0 ml-0 bg-popover text-popover-foreground border border-border rounded-md shadow-xl py-1 min-w-[200px] hidden group-hover/cat:block z-[102] max-h-64 overflow-y-auto custom-scrollbar">
                                    {catTags.map(tagModel => {
                                      const IconComponent = icons[tagModel.icon as keyof typeof icons] || Tag;
                                      return (
                                        <button
                                          key={tagModel.id}
                                          className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                                          onMouseDown={(e) => handleTagClick(e, tagModel)}
                                        >
                                          <div className="flex items-center justify-center w-4 h-4 rounded-sm border border-border overflow-hidden" style={{ backgroundColor: `${tagModel.color}20`, borderColor: tagModel.color }}>
                                            {tagModel.imageUrl ? (
                                              <img src={tagModel.imageUrl} alt={tagModel.name} className="w-full h-full object-cover" />
                                            ) : (
                                              <IconComponent size={10} style={{ color: tagModel.color }} />
                                            )}
                                          </div>
                                          {tagModel.name}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}

                            {tagsByCategory['no-category'] && tagsByCategory['no-category'].length > 0 && (
                              <div className="relative group/nocat">
                                <button className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center justify-between gap-2">
                                  <span className="flex items-center gap-2">
                                    <div className="p-1 rounded bg-background shadow-sm text-muted-foreground">
                                      <icons.Folder size={12} />
                                    </div>
                                    <span className="italic text-muted-foreground">Sans catégorie</span>
                                  </span>
                                  <ChevronRight size={14} />
                                </button>
                                <div className="absolute left-full top-0 ml-0 bg-popover text-popover-foreground border border-border rounded-md shadow-xl py-1 min-w-[200px] hidden group-hover/nocat:block z-[102] max-h-64 overflow-y-auto custom-scrollbar">
                                  {tagsByCategory['no-category'].map(tagModel => {
                                    const IconComponent = icons[tagModel.icon as keyof typeof icons] || Tag;
                                    return (
                                      <button
                                        key={tagModel.id}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                                        onMouseDown={(e) => handleTagClick(e, tagModel)}
                                      >
                                        <div className="flex items-center justify-center w-4 h-4 rounded-sm border border-border overflow-hidden" style={{ backgroundColor: `${tagModel.color}20`, borderColor: tagModel.color }}>
                                          {tagModel.imageUrl ? (
                                            <img src={tagModel.imageUrl} alt={tagModel.name} className="w-full h-full object-cover" />
                                          ) : (
                                            <IconComponent size={10} style={{ color: tagModel.color }} />
                                          )}
                                        </div>
                                        {tagModel.name}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()
                    )}
                  </div>
                </div>

                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    if (!containerRef.current || players.length === 0) {
                      closeContextMenu();
                      return;
                    }
                    
                    const centerX = -canvas.panX / canvas.zoom;
                    const centerY = -canvas.panY / canvas.zoom;
                    
                    const radius = Math.max(150, players.length * 30);
                    const angleStep = (2 * Math.PI) / players.length;
                    
                    players.forEach((player, index) => {
                        let finalX = centerX + radius * Math.cos(index * angleStep - Math.PI / 2);
                        let finalY = centerY + radius * Math.sin(index * angleStep - Math.PI / 2);
                        
                        if (grid.enabled) {
                            finalX = snapToGrid(finalX, grid.sizeX);
                            finalY = snapToGrid(finalY, grid.sizeY);
                        }
                        
                        updatePlayer(player.id, { x: finalX, y: finalY });
                    });
                    
                    closeContextMenu();
                  }}
                >
                  <icons.CircleDashed size={14} /> Réorganiser en cercle
                </button>

                <div className="h-px bg-border my-1" />

                <div className="relative group">
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-destructive/10 text-destructive flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2"><Trash2 size={14} /> Supprimer</span>
                    <ChevronRight size={14} />
                  </button>
                  <div className="absolute left-full top-0 ml-0 bg-popover text-popover-foreground border border-border rounded-md shadow-xl py-1 min-w-[150px] hidden group-hover:block z-[101]">
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-destructive text-destructive hover:text-destructive-foreground flex items-center gap-2"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm({
                          title: "Supprimer tous les joueurs",
                          message: "Êtes-vous sûr de vouloir supprimer tous les joueurs du plateau ?",
                          onConfirm: () => {
                            clearPlayers();
                            setDeleteConfirm(null);
                          }
                        });
                        closeContextMenu();
                      }}
                    >
                      Tous les joueurs
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-destructive text-destructive hover:text-destructive-foreground flex items-center gap-2"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm({
                          title: "Supprimer tous les tags",
                          message: "Êtes-vous sûr de vouloir supprimer tous les tags (marqueurs) du plateau ?",
                          onConfirm: () => {
                            clearMarkers();
                            setDeleteConfirm(null);
                          }
                        });
                        closeContextMenu();
                      }}
                    >
                    Tous les tags
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-destructive text-destructive hover:text-destructive-foreground flex items-center gap-2"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm({
                          title: "Supprimer toutes les notes privées",
                          message: "Êtes-vous sûr de vouloir supprimer les notes privées de tous les joueurs ?",
                          onConfirm: () => {
                            const updates = players.map(p => ({
                              id: p.id,
                              updates: { privateNotes: '' }
                            }));
                            updatePlayers(updates);
                            setDeleteConfirm(null);
                          }
                        });
                        closeContextMenu();
                      }}
                    >
                      Toutes les notes privées
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-destructive text-destructive hover:text-destructive-foreground flex items-center gap-2"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm({
                          title: "Supprimer toutes les notes publiques",
                          message: "Êtes-vous sûr de vouloir supprimer les notes publiques de tous les joueurs ?",
                          onConfirm: () => {
                            const updates = players.map(p => ({
                              id: p.id,
                              updates: { publicNotes: '' }
                            }));
                            updatePlayers(updates);
                            setDeleteConfirm(null);
                          }
                        });
                        closeContextMenu();
                      }}
                    >
                      Toutes les notes publiques
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-destructive text-destructive hover:text-destructive-foreground flex items-center gap-2"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm({
                          title: "Supprimer tous les tags des joueurs",
                          message: "Êtes-vous sûr de vouloir supprimer tous les tags fusionnés avec les joueurs (pas ceux des rôles) ?",
                          onConfirm: () => {
                            players.forEach(p => updatePlayer(p.id, { tags: [] }));
                            setDeleteConfirm(null);
                          }
                        });
                        closeContextMenu();
                      }}
                    >
                      Tous les tags des joueurs
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-destructive text-destructive hover:text-destructive-foreground flex items-center gap-2"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        useVttStore.getState().clearAllSelectionPastilles();
                        closeContextMenu();
                      }}
                    >
                      Les pastilles tags
                    </button>
                  </div>
                </div>
              </>
            )}

            {contextMenu.type === 'group' && (
              <>
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground border-b border-border mb-1">
                  {selectedEntityIds.length} éléments sélectionnés
                </div>

                {/* Equipe Submenu for group */}
                <div className="relative group">
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">Équipe</span>
                    <ChevronRight size={14} />
                  </button>
                  <div className="absolute left-full top-0 ml-0 bg-popover text-popover-foreground border border-border rounded-md shadow-xl py-1 min-w-[150px] hidden group-hover:block z-[101]">
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground italic"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        selectedEntityIds.forEach(id => {
                          const player = players.find(p => p.id === id);
                          if (player) updatePlayer(player.id, { teamId: null });
                        });
                        closeContextMenu();
                      }}
                    >
                      Aucune
                    </button>
                    {teams.map(team => (
                      <button
                        key={team.id}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          selectedEntityIds.forEach(id => {
                            const player = players.find(p => p.id === id);
                            if (player) updatePlayer(player.id, { teamId: team.id });
                          });
                          closeContextMenu();
                        }}
                      >
                        <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: team.color }} />
                        {team.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags Submenu for group */}
                <div className="relative group">
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2"><Tag size={14} /> Ajouter Tag</span>
                    <ChevronRight size={14} />
                  </button>
                  <div className="absolute left-full top-0 ml-0 bg-popover text-popover-foreground border border-border rounded-md shadow-xl py-1 min-w-[150px] hidden group-hover:block z-[101] max-h-64 overflow-y-auto custom-scrollbar">
                    {useVttStore.getState().tags.length === 0 ? (
                      <div className="px-4 py-2 text-xs text-muted-foreground italic">Aucun modèle de tag</div>
                    ) : (
                      useVttStore.getState().tags.map(tagModel => {
                        const IconComponent = icons[tagModel.icon as keyof typeof icons] || Tag;
                        return (
                          <button
                            key={tagModel.id}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              selectedEntityIds.forEach(id => {
                                const player = players.find(p => p.id === id);
                                if (player) {
                                  applyTagToPlayer(player, tagModel);
                                }
                              });
                              closeContextMenu();
                            }}
                          >
                            <div className="flex items-center justify-center w-4 h-4 rounded-sm border border-border overflow-hidden" style={{ backgroundColor: `${tagModel.color}20`, borderColor: tagModel.color }}>
                              {tagModel.imageUrl ? (
                                <img src={tagModel.imageUrl} alt={tagModel.name} className="w-full h-full object-cover" />
                              ) : (
                                <IconComponent size={10} style={{ color: tagModel.color }} />
                              )}
                            </div>
                            {tagModel.name}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="h-px bg-border my-1" />

                <button
                  className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive hover:text-destructive-foreground flex items-center gap-2"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const pCount = players.filter(p => selectedEntityIds.includes(p.id)).length;
                    const mCount = markers.filter(m => selectedEntityIds.includes(m.id)).length;

                    setDeleteConfirm({
                      title: "Supprimer la sélection",
                      message: `Êtes-vous sûr de vouloir supprimer les ${selectedEntityIds.length} éléments sélectionnés (${pCount} joueurs, ${mCount} tags) ?`,
                      onConfirm: () => {
                        selectedEntityIds.forEach(id => {
                          const player = players.find(p => p.id === id);
                          if (player) deletePlayer(id);
                          else {
                            const marker = markers.find(m => m.id === id);
                            if (marker) deleteMarker(id);
                          }
                        });
                        clearSelection();
                        setDeleteConfirm(null);
                      }
                    });
                    closeContextMenu();
                  }}
                >
                  <Trash2 size={14} /> Supprimer la sélection
                </button>

              </>
            )}

          </div>
        )}



        {mergeConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-background rounded-xl shadow-xl outline-1 border border-border w-96 max-w-md overflow-hidden text-foreground">
              <div className="p-4 bg-muted/30 border-b border-border">
                <h3 className="font-bold text-lg">Fusionner le Tag</h3>
              </div>
              <div className="p-6">
                <p className="text-sm">
                  Voulez-vous fusionner le tag <strong>"{mergeConfirm.marker.tag.name}"</strong> avec le joueur <strong>"{mergeConfirm.hitPlayer.name}"</strong> ?
                </p>
              </div>
              <div className="p-4 bg-muted/50 border-t border-border flex justify-end gap-3">
                <button
                  onClick={() => {
                    updateMarker(mergeConfirm.marker.id, { x: mergeConfirm.canvasX, y: mergeConfirm.canvasY });
                    setMergeConfirm(null);
                  }}
                  className="px-6 py-2 text-sm text-green-900 bg-green-200 hover:bg-green-300 rounded-full font-semibold transition-colors shadow-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    applyTagToPlayer(mergeConfirm.hitPlayer, mergeConfirm.marker.tag);
                    deleteMarker(mergeConfirm.marker.id);
                    setMergeConfirm(null);
                  }}
                  className="px-8 py-2 text-sm bg-[#3a5a40] hover:bg-[#344e3a] ring-2 ring-offset-2 ring-offset-background ring-[#3a5a40] text-white rounded-full font-bold transition-all shadow-md"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-background rounded-xl shadow-xl outline-1 border border-border w-96 max-w-md overflow-hidden text-foreground">
              <div className="p-4 bg-destructive/10 border-b border-border">
                <h3 className="font-bold text-lg flex items-center gap-2 text-destructive">
                  <Trash2 size={20} />
                  {deleteConfirm.title}
                </h3>
              </div>
              <div className="p-6">
                <p className="text-sm">
                  {deleteConfirm.message}
                </p>
              </div>
              <div className="p-4 bg-muted/50 border-t border-border flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-6 py-2 text-sm hover:bg-accent rounded-full font-semibold transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => deleteConfirm.onConfirm()}
                  className="px-8 py-2 text-sm bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full font-bold transition-all shadow-md"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}

        {showExportModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-background rounded-xl shadow-xl outline-1 border border-border w-[450px] max-w-full overflow-hidden text-foreground">
              <div className="p-4 bg-muted/30 border-b border-border flex justify-between items-center">
                <h3 className="font-bold text-lg">Exporter l'état</h3>
                <button onClick={() => setShowExportModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">Sélectionnez les éléments à sauvegarder :</p>
                <div className="grid grid-cols-2 gap-3 pl-2">
                  {[
                    { key: 'joueurs', label: 'Les joueurs' },
                    { key: 'roles', label: 'Les rôles' },
                    { key: 'equipes', label: 'Les équipes' },
                    { key: 'tags', label: 'Les tags' },
                    { key: 'aides', label: 'Les aides' },
                    { key: 'salle', label: 'La salle' },
                    { key: 'outils', label: 'Outils' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors">
                      <input
                        type="checkbox"
                        checked={exportOptions[key as keyof typeof exportOptions] as boolean}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      {label}
                    </label>
                  ))}
                </div>
                
                <div className="mt-4 border-t border-border pt-4">
                  <p className="text-sm font-semibold mb-2">Comportement à l'importation :</p>
                  <div className="flex flex-col gap-2 pl-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        value="default"
                        checked={exportOptions.mode === 'default'}
                        onChange={() => setExportOptions(prev => ({ ...prev, mode: 'default' }))}
                        className="text-primary focus:ring-primary"
                      />
                      Classique 
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        value="reset"
                        checked={exportOptions.mode === 'reset'}
                        onChange={() => setExportOptions(prev => ({ ...prev, mode: 'reset' }))}
                        className="text-primary focus:ring-primary"
                      />
                      Repartir de 0 (Remet tout à 0)
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        value="merge"
                        checked={exportOptions.mode === 'merge'}
                        onChange={() => setExportOptions(prev => ({ ...prev, mode: 'merge' }))}
                        className="text-primary focus:ring-primary"
                      />
                      Fusionner avec l'existant
                    </label>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-muted/50 border-t border-border flex justify-end gap-3">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-6 py-2 text-sm hover:bg-accent rounded-md font-semibold transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleExport}
                  className="px-8 py-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-bold transition-all shadow-md"
                >
                  Exporter
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};