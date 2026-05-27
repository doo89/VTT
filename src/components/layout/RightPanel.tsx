import { Settings, ChevronLeft, ChevronRight, Upload, Clock, ChevronDown, Music, Shuffle, Database, X, History, ArrowUpRight, Trash2, Zap, RefreshCw, Download, Trophy, Heart, Book, MessageSquare, Plus, MonitorUp, Edit2, CheckSquare, Volume2, Tag, Play, Magnet, Eye, EyeOff, Maximize2, Minimize2, Copy, LayoutGrid, GripVertical, Grid2X2, Wifi, Users, TriangleAlert } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import * as icons from 'lucide-react';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { cn } from '../../lib/utils';
import { useVttStore, initialState } from '../../store';
import { forceBroadcastState, initHostRealtime } from '../../lib/realtime-host';
import { uploadFileToStorage, deleteFileFromStorage } from '../../lib/supabase';
import { getEffectiveStats } from '../../lib/utils';
import type { Role, Player, CustomPopup } from '../../types';
import { SettingsModal } from './SettingsModal';
import { ChecklistContent } from '../ChecklistContent';
import { useTimerCountdown } from '../../hooks/useTimerCountdown';
import { TimerDisplay, TimerControls, TimerPresets } from '../timer';
import { distributeRoles } from '../../lib/distribute-roles';
import { LifeProgressBar } from '../LifeProgressBar';
import { useToast } from '../Toast';

export const RightPanel: React.FC = () => {
  const toast = useToast();

  const {
    isRightPanelOpen, toggleRightPanel, isRightPanelExpanded, toggleRightPanelExpanded,
    displaySettings, updateDisplaySettings,
    timer, setTimer,
    soundboard, setSoundboard,
    roles, updateRole, players, updatePlayers,
    tags, updateTagModel,
    logs, logsSettings, setLogsSettings, logsFilter, clearLogs, addLog,
    scoreboard, setScoreboard,
    wiki: storeWiki, setWiki,
    customPopups, addCustomPopup, updateCustomPopup, deleteCustomPopup, triggerCustomPopup, setPreviewPopup,
    teams,
    checklist,
    checklistState, setChecklistState,
    roleSelectorState, setRoleSelectorState,
    tagDistributorState, setTagDistributorState,
    actionCreatorState: _, setActionCreatorState,
    actions, addAction, deleteAction, duplicateAction, executeAction, setPendingConditions, setPendingEffects,
    resetCycle,
    editingEntity, setEditingEntity,
    magneticPoints, showMagneticPoints, addMagneticPoint, setShowMagneticPoints, snapPlayersToPoints, clearMagneticPoints, deleteMagneticPoint, reorderMagneticPoints, createPointsFromTemplate,
    exportMagneticPoints, importMagneticPoints, setMagneticSnapToGrid, magneticSnapToGrid, updateMagneticPointLabel, updateMagneticPointColor,
    connectionStatus, setConnectionStatus, lastSyncTimestamp, setLastSyncTimestamp, supabaseConfigured, onlinePlayerIds, roomCode,
    testConnection, resetChannel, resetOnlinePlayers,

  } = useVttStore();

  const wiki = storeWiki || initialState.wiki;

  const [activeSection, setActiveSection] = useState<string | null>('distribution');
  const [showSupabaseSettings, setShowSupabaseSettings] = useState(false);
  const [showMagneticTemplateModal, setShowMagneticTemplateModal] = useState(false);
  const [magneticDragIndex, setMagneticDragIndex] = useState<number | null>(null);
  const [showMagneticPreview, setShowMagneticPreview] = useState(false);
  const [showResetMenu, setShowResetMenu] = useState(false);

  // Helper to get popup trigger button label based on targeting
  const getPopupTriggerLabel = (popup: CustomPopup) => {
    const targets: string[] = [];
    
    // Player targeting
    if (popup.targetPlayerIds?.length) {
      const playerNames = popup.targetPlayerIds
        .map((id: string) => players.find(p => p.id === id)?.name)
        .filter(Boolean) as string[];
      if (playerNames.length) {
        targets.push(playerNames.slice(0, 2).join(', ') + (playerNames.length > 2 ? '...' : ''));
      }
    }
    
    // Role targeting
    if (popup.targetRoleIds?.length) {
      const roleNames = popup.targetRoleIds
        .map((id: string) => roles.find(r => r.id === id)?.name)
        .filter(Boolean) as string[];
      if (roleNames.length) {
        targets.push(roleNames.slice(0, 2).join(', ') + (roleNames.length > 2 ? '...' : ''));
      }
    }
    
    // Team targeting
    if (popup.targetTeamIds?.length) {
      const teamNames = popup.targetTeamIds
        .map((id: string) => teams.find(t => t.id === id)?.name)
        .filter(Boolean) as string[];
      if (teamNames.length) {
        targets.push(teamNames.slice(0, 2).join(', ') + (teamNames.length > 2 ? '...' : ''));
      }
    }
    
    if (targets.length === 0) return 'Afficher à tous';
    
    const label = targets.join(' + ');
    return label.length > 35 ? label.slice(0, 32) + '...' : label;
  };
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showPopupCreator, setShowPopupCreator] = useState(false);
  const [editingPopupId, setEditingPopupId] = useState<string | null>(null);
  const [newPopupData, setNewPopupData] = useState<{ title: string; imageUrl: string; soundUrl: string; content: string; showCloseButton: boolean; autoCloseTimer: boolean; autoCloseDuration: number; showToGM: boolean; showToSmartphone: boolean; targetRoleIds: string[]; targetTeamIds: string[]; targetPlayerIds: string[]; scheduledDelay: number }>({ title: '', imageUrl: '', soundUrl: '', content: '', showCloseButton: true, autoCloseTimer: false, autoCloseDuration: 10, showToGM: true, showToSmartphone: true, targetRoleIds: [], targetTeamIds: [], targetPlayerIds: [], scheduledDelay: 0 });
  const urlRef = useRef<HTMLInputElement>(null);
  const keyRef = useRef<HTMLInputElement>(null);
  const popupImageInputRef = useRef<HTMLInputElement>(null);
  const popupSoundInputRef = useRef<HTMLInputElement>(null);

  const saveSupabaseConfig = () => {
    if (urlRef.current && keyRef.current) {
      localStorage.setItem('VTT_SUPABASE_URL', urlRef.current.value);
      localStorage.setItem('VTT_SUPABASE_ANON_KEY', keyRef.current.value);
      setShowSupabaseSettings(false);
      window.location.reload();
    }
  };

  const [useEnvExample, setUseEnvExample] = useState(() => {
    return localStorage.getItem('VTT_USE_ENV_EXAMPLE') === 'true';
  });

  const loadEnvExample = async () => {
    try {
      const response = await fetch('/env.example');
      if (response.ok) {
        const text = await response.text();
        const lines = text.split('\n');
        let url = '';
        let key = '';
        lines.forEach(line => {
          const trimmed = line.trim();
          if (trimmed.startsWith('VITE_SUPABASE_URL=')) {
            url = trimmed.substring('VITE_SUPABASE_URL='.length);
          } else if (trimmed.startsWith('VITE_SUPABASE_ANON_KEY=')) {
            key = trimmed.substring('VITE_SUPABASE_ANON_KEY='.length);
          }
        });
        if (urlRef.current) urlRef.current.value = url;
        if (keyRef.current) keyRef.current.value = key;
      }
    } catch (e) {
      console.error('Failed to load .env.example', e);
    }
  };

  // Auto-load env example on mount if checkbox was previously checked
  useEffect(() => {
    if (useEnvExample) {
      loadEnvExample();
    }
  }, []);

  useEffect(() => {
    const handleOpenSettings = () => setIsSettingsOpen(true);
    window.addEventListener('open-settings', handleOpenSettings);
    return () => window.removeEventListener('open-settings', handleOpenSettings);
  }, []);

  const handleToggleEnvExample = (checked: boolean) => {
    setUseEnvExample(checked);
    localStorage.setItem('VTT_USE_ENV_EXAMPLE', String(checked));
    if (checked) {
      loadEnvExample();
    }
  };

  const toggleSection = (section: string) => {
    if (activeSection === 'soundboard' && section === 'soundboard' && editingEntity?.type === 'soundButton') {
      setEditingEntity(null);
    }
    setActiveSection(prev => prev === section ? null : section);
  };

  // Role distribution logic
  const selectedRolesForDistribution = useMemo(() => {
    return roles.filter(r => r.isSelectableForDistribution);
  }, [roles]);

  const totalRolesToDistribute = useMemo(() => {
    return selectedRolesForDistribution.reduce((total, role) => {
      if (role.isUnique) {
        return total + 1;
      }
      const quantity = role.isMinMandatory ? Math.max(role.distributionQuantity || 1, role.minCount || 0) : (role.distributionQuantity || 1);
      return total + quantity;
    }, 0);
  }, [selectedRolesForDistribution]);

  const totalPlayersInRoom = players.length;

  const fillerRole = useMemo(() => {
    return selectedRolesForDistribution.find(r => r.isFiller);
  }, [selectedRolesForDistribution]);

  const needsFilling = totalPlayersInRoom > 0 && totalRolesToDistribute < totalPlayersInRoom && !!fillerRole;
  const canDistribute = totalPlayersInRoom > 0 && (totalRolesToDistribute >= totalPlayersInRoom || !!fillerRole);

  const handleDistributeRoles = () => {
    if (!canDistribute) return;

    const result = distributeRoles(roles, players, displaySettings);

    if (result.assignments.length === 0) return;

    const updates = result.assignments.map(a => ({ id: a.playerId, updates: a.updates }));
    updatePlayers(updates);
    forceBroadcastState();

    if (displaySettings.distributionResetPhase !== false) {
      resetCycle();
      addLog(`Réinitialisation : Jour 1`, 'system');
    }

    result.assignments.forEach(a => {
      const player = players.find(p => p.id === a.playerId);
      const role = roles.find(r => r.id === a.roleId);
      if (player && role) {
        addLog(`Distribution : ${player.name} reçoit ${role.name}`, 'role');
      }
    });

    if (result.unassigned > 0) {
      addLog(`Attention : ${result.unassigned} joueur(s) n'ont pas reçu de rôle (pas assez de rôles sélectionnés)`, 'system');
    }

    if (result.fillerCount > 0) {
      addLog(`Rôle "${result.fillerName}" utilisé ${result.fillerCount} fois en complément`, 'system');
    }

    const recapParts = [`${result.assignments.length} rôles distribués`];
    if (result.fillerCount > 0) recapParts.push(`${result.fillerName} x${result.fillerCount}`);
    if (result.unassigned > 0) recapParts.push(`${result.unassigned} sans rôle`);
    toast.success(recapParts.join(' — '));

    if (displaySettings.distributionActionId) {
      executeAction(displaySettings.distributionActionId);
    }
  };

  // Timer Logic
  const timerState = useTimerCountdown();

  const handleTimerToggle = () => setTimer({ isRunning: !timerState.isRunning });
  const handleTimerReset = () => {
    setTimer({
      isRunning: false,
      minutes: displaySettings.timerDefaultMinutes ?? 5,
      seconds: displaySettings.timerDefaultSeconds ?? 0
    });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          if (json._importMode === 'reset') {
            useVttStore.setState({ ...initialState, ...json });
          } else if (json._importMode === 'merge') {
            const mergedState: any = { ...useVttStore.getState() };
            for (const key of Object.keys(json)) {
              if (key === '_importMode') continue;
              if (Array.isArray(json[key]) && Array.isArray(mergedState[key])) {
                const existing = [...mergedState[key]];
                json[key].forEach((newItem: any) => {
                  if (newItem && typeof newItem === 'object' && newItem.id) {
                    const index = existing.findIndex(e => e.id === newItem.id);
                    if (index >= 0) {
                      existing[index] = { ...existing[index], ...newItem };
                    } else {
                      existing.push(newItem);
                    }
                  } else {
                     // non-id arrays (like simple strings) just don't try strict merge or merge uniquely
                     if (!existing.includes(newItem)) existing.push(newItem);
                  }
                });
                mergedState[key] = existing;
              } else if (typeof json[key] === 'object' && !Array.isArray(json[key]) && json[key] !== null) {
                mergedState[key] = { ...mergedState[key], ...json[key] };
              } else {
                mergedState[key] = json[key];
              }
            }
            useVttStore.setState(mergedState);
          } else {
            useVttStore.setState(json);
          }
        } catch (error) {
          console.error("Error parsing JSON:", error);
          alert("Fichier JSON invalide.");
        }
      };
      reader.readAsText(file);
    }
  };

  if (!isRightPanelOpen) {
    return (
      <div className="absolute right-0 top-0 h-full flex items-center z-50">
        <button
          onClick={toggleRightPanel}
          className="bg-card border border-border rounded-l-md p-2 shadow-md hover:bg-accent"
          aria-label="Ouvrir le panneau latéral"
          title="Ouvrir le panneau latéral"
        >
          <ChevronLeft size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className={cn(
      "h-full bg-card border-l border-border flex flex-col relative z-40 shrink-0",
      isRightPanelExpanded ? "w-[576px]" : "w-[350px]"
    )}>
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings size={20} />
          <h2 className="text-xl font-bold">Outils</h2>
        </div>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 hover:bg-accent rounded-md border border-border bg-background"
          title="Paramètres"
        >
          <Settings size={14} />
          Paramètres
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 custom-scrollbar min-h-0">

        {(displaySettings.panels?.panelsOrder || ['distribution', 'chrono', 'soundboard', 'scoreboard', 'logs', 'tagDistributor', 'wiki', 'popupCreator', 'actionCreator', 'checklist', 'magneticPoints', 'system']).map(key => {
          if (key === 'distribution') return displaySettings.panels?.distribution !== false && (
            <section key="distribution" className="flex flex-col border border-border rounded-md bg-background">
              <div
                onClick={() => toggleSection('distribution')}
                className="flex items-center justify-between p-2 bg-muted/50 hover:bg-muted font-semibold text-sm transition-colors cursor-pointer"
              >
                <div className={`flex items-center gap-2 ${activeSection === 'distribution' ? 'text-purple-400' : ''}`}>
                  <Shuffle size={16} /> Distribution Rôles
                </div>
                {activeSection === 'distribution' ? <ChevronDown size={16} className="text-purple-400" /> : <ChevronRight size={16} />}
              </div>
              {activeSection === 'distribution' && (
                <div className="flex flex-col gap-3 p-3 border-t border-border">
                  <button
                    onClick={() => setRoleSelectorState({ isOpen: !roleSelectorState.isOpen, x: Math.max(200, (window.innerWidth - 350) / 2), y: Math.max(100, (window.innerHeight - 400) / 2) })}
                    className="flex items-center justify-center gap-2 w-full py-1.5 bg-muted hover:bg-accent border border-border rounded text-xs font-bold transition-colors mb-1"
                  >
                    <icons.Plus size={14} className="text-purple-400" />
                    Choisir les Rôles
                  </button>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Joueurs en salle :</span>
                    <span className="font-bold">{totalPlayersInRoom}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Rôles sélectionnés :</span>
                    <span className={`font-bold ${totalRolesToDistribute < totalPlayersInRoom ? 'text-destructive' : 'text-primary'}`}>
                      {totalRolesToDistribute}
                    </span>
                  </div>

                  {selectedRolesForDistribution.length > 0 && (
                    <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-border/50">
                      {selectedRolesForDistribution.map(role => (
                        <div key={role.id} className="flex items-center justify-between gap-2 text-sm">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: role.color }} />
                            <span className="truncate">{role.name}</span>
                          </div>

                          {!role.isUnique ? (
                            <div className="flex items-center gap-2">
                              <label htmlFor={`dist-qty-${role.id}`} className="text-xs text-muted-foreground">Qté:</label>
                              <input
                                id={`dist-qty-${role.id}`}
                                type="number"
                                min="1"
                                value={role.distributionQuantity || 1}
                                onChange={(e) => updateRole(role.id, { distributionQuantity: Math.max(1, parseInt(e.target.value) || 1) })}
                                className="w-16 bg-background border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring text-center"
                              />
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic mr-6">Unique</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleDistributeRoles}
                    disabled={!canDistribute}
                    className={`mt-2 flex items-center justify-center gap-2 w-full py-2 rounded-md text-sm font-medium transition-colors ${
                      canDistribute
                        ? (needsFilling ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-primary text-primary-foreground hover:bg-primary/90')
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                    }`}
                  >
                    <Shuffle size={16} />
                    Distribuer
                  </button>

                  {!canDistribute && totalPlayersInRoom > 0 && (
                    <p className="text-[10px] text-destructive text-center mt-1">
                      Le nombre de rôles ({totalRolesToDistribute}) doit être supérieur ou égal au nombre de joueurs ({totalPlayersInRoom}).
                    </p>
                  )}

                  {canDistribute && needsFilling && (
                    <p className="text-[10px] text-orange-500 text-center mt-1">
                      Le nombre de rôles ({totalRolesToDistribute}) sera complété par le rôle {fillerRole?.name} pour avoir un nombre de rôles égal au nombre de joueurs ({totalPlayersInRoom}).
                    </p>
                  )}
                </div>
              )}
            </section>
          );

          if (key === 'chrono') return displaySettings.panels?.chrono !== false && (
            <section key="chrono" className="flex flex-col border border-border rounded-md bg-background">
              <div
                onClick={() => toggleSection('chrono')}
                className="flex items-center justify-between p-2 bg-muted/50 hover:bg-muted font-semibold text-sm transition-colors cursor-pointer"
              >
                <div className={`flex items-center gap-2 ${activeSection === 'chrono' ? 'text-amber-500' : ''}`}>
                  <Clock size={16} />
                  {timerState.isRunning && activeSection !== 'chrono' ? (
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="font-mono font-bold">
                        {String(timerState.minutes).padStart(2, '0')}:{String(timerState.seconds).padStart(2, '0')}
                      </span>
                    </span>
                  ) : (
                    'Chronomètre'
                  )}
                </div>
                {activeSection === 'chrono' ? <ChevronDown size={16} className="text-amber-500" /> : <ChevronRight size={16} />}
              </div>
              {activeSection === 'chrono' && (
                <div className="flex flex-col items-center gap-3 p-3 border-t border-border">
                  {timerState.isDetached ? (
                    <div className="flex flex-col items-center gap-2 w-full text-center py-2">
                      <span className="text-sm text-muted-foreground italic">Le chronomètre est détaché.</span>
                      <button
                        onClick={() => setTimer({ isDetached: false })}
                        className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded hover:bg-primary/90"
                      >
                        Rattacher
                      </button>
                    </div>
                  ) : (
                    <>
                      <TimerDisplay
                        minutes={timerState.minutes}
                        seconds={timerState.seconds}
                        isRunning={timerState.isRunning}
                        onMinutesChange={(m) => setTimer({ minutes: m })}
                        onSecondsChange={(s) => setTimer({ seconds: s })}
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
                      <div className="w-full mt-1 border-t border-border pt-2">
                        <button
                          onClick={() => setTimer({ isDetached: true })}
                          className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent py-1.5 rounded transition-colors"
                        >
                          <ArrowUpRight size={14} /> Détacher en fenêtre volante
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </section>
          );

          if (key === 'soundboard') return displaySettings.panels?.soundboard !== false && (
            <section key="soundboard" className="flex flex-col border border-border rounded-md bg-background">
              <div onClick={() => toggleSection('soundboard')} className="flex items-center justify-between p-2 bg-muted/50 hover:bg-muted font-semibold text-sm transition-colors cursor-pointer">
                <div className={`flex items-center gap-2 ${activeSection === 'soundboard' ? 'text-pink-400' : ''}`}>
                  <Music size={16} /> Soundboard ({soundboard.buttons.filter(b => b.audioUrl).length}/{soundboard.cols * soundboard.rows})
                </div>
                {activeSection === 'soundboard' ? <ChevronDown size={16} className="text-pink-400" /> : <ChevronRight size={16} />}
              </div>
              {activeSection === 'soundboard' && (
                <div className="flex flex-col gap-3 p-3 border-t border-border">
                  {soundboard.isDetached ? (
                    <div className="flex flex-col items-center gap-2 w-full text-center py-2">
                      <span className="text-sm text-muted-foreground italic">La boîte à sons est détachée.</span>
                      <button
                        onClick={() => setSoundboard({ isDetached: false })}
                        className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded hover:bg-primary/90"
                      >
                        Rattacher
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1 flex-1">
                          <label htmlFor="soundboard-cols" className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Colonnes</label>
                          <input
                            id="soundboard-cols"
                            type="number"
                            min="1" max="10"
                            value={soundboard.cols}
                            onChange={e => setSoundboard({ cols: parseInt(e.target.value) || 4 })}
                            className="bg-input border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                          />
                        </div>
                        <div className="flex flex-col gap-1 flex-1">
                          <label htmlFor="soundboard-rows" className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Lignes</label>
                          <input
                            id="soundboard-rows"
                            type="number"
                            min="1" max="10"
                            value={soundboard.rows}
                            onChange={e => setSoundboard({ rows: parseInt(e.target.value) || 3 })}
                            className="bg-input border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => setSoundboard({ isDetached: true })}
                        className="w-full mt-3 bg-primary text-primary-foreground text-xs py-2 rounded font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-sm"
                      >
                        <ArrowUpRight size={14} /> Afficher la boîte à sons
                      </button>
                    </>
                  )}
                </div>
              )}
            </section>
          );

          if (key === 'scoreboard') return displaySettings.panels?.scoreboard !== false && (
            <section key="scoreboard" className="flex flex-col border border-border rounded-md bg-background">
              <div onClick={() => toggleSection('scoreboard')} className="flex items-center justify-between p-2 bg-muted/50 hover:bg-muted font-semibold text-sm transition-colors cursor-pointer">
                <div className={`flex items-center gap-2 ${activeSection === 'scoreboard' ? 'text-yellow-400' : ''}`}>
                  <Trophy size={16} /> Tableau des Scores
                </div>
                {activeSection === 'scoreboard' ? <ChevronDown size={16} className="text-yellow-400" /> : <ChevronRight size={16} />}
              </div>
              {activeSection === 'scoreboard' && (
                <div className="flex flex-col p-3 border-t border-border gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Mode détaché</span>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="scoreboard-detach-toggle"
                        checked={!!scoreboard.isDetached}
                        onChange={() => setScoreboard({ isDetached: !scoreboard.isDetached })}
                        className="sr-only peer"
                      />
                      <label 
                        htmlFor="scoreboard-detach-toggle"
                        className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${scoreboard.isDetached ? 'bg-primary' : 'bg-muted'}`}
                        title="Mode détaché du tableau des scores"
                      >
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${scoreboard.isDetached ? 'left-6' : 'left-1'}`} />
                        <span className="sr-only">Mode détaché du tableau des scores</span>
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={() => setScoreboard({ isOpen: !scoreboard.isOpen })}
                    className="w-full bg-primary text-primary-foreground text-xs py-2 rounded font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Trophy size={14} /> {scoreboard.isOpen ? 'Masquer le tableau' : 'Afficher le tableau'}
                  </button>

                  {scoreboard.isOpen && !scoreboard.isDetached && scoreboard.showTable !== false && (
                    <div className="mt-2 border border-border rounded-lg overflow-hidden bg-muted/10">
                      <table className="w-full text-left text-[10px]">
                        <thead className="bg-muted">
                          <tr>
                            <th className="p-1.5 font-bold uppercase tracking-wider text-muted-foreground">Joueur</th>
                            {scoreboard.showPoints && <th className="p-1.5 font-bold uppercase tracking-wider text-muted-foreground text-center">Pts</th>}
                            {scoreboard.showLives && <th className="p-1.5 font-bold uppercase tracking-wider text-muted-foreground text-center">Vie</th>}
                            {scoreboard.showStatus && <th className="p-1.5 font-bold uppercase tracking-wider text-muted-foreground text-center">Statut</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {[...players].sort((a, b) => {
                            const roleA = roles.find(r => r.id === a.roleId);
                            const roleB = roles.find(r => r.id === b.roleId);
                            const effectiveA = getEffectiveStats(a, roleA);
                            const effectiveB = getEffectiveStats(b, roleB);
                            return (effectiveB.points || 0) - (effectiveA.points || 0);
                          }).map((player) => {
                            const role = roles.find(r => r.id === player.roleId);
                            const effective = getEffectiveStats(player, role);
                            return (
                              <tr key={player.id} className={`${player.isDead ? 'opacity-50' : ''}`}>
                                <td className="p-1.5">
                                  <div className="font-bold truncate max-w-[80px]">{player.name}</div>
                                  {scoreboard.showRoles && <div className="text-[8px] text-muted-foreground uppercase truncate max-w-[80px]">{role?.name || 'Sans Rôle'}</div>}
                                  {scoreboard.showLifeBar !== false && scoreboard.showLives && effective.maxLives > 0 && (
                                    <div className="mt-1 flex items-center gap-1">
                                      <div className="flex-1">
                                        <LifeProgressBar current={effective.lives ?? 0} max={effective.maxLives} size="sm" />
                                      </div>
                                      <span className="text-[8px] font-bold text-red-400 tabular-nums">{effective.lives ?? 0}/{effective.maxLives}</span>
                                    </div>
                                  )}
                                </td>
                                {scoreboard.showPoints && <td className="p-1.5 text-center font-bold text-blue-400">{effective.points}</td>}
                                {scoreboard.showLives && (
                                  <td className="p-1.5 text-center">
                                     <div className="flex items-center justify-center gap-0.5 text-red-500">
                                       <Heart size={8} fill={effective.lives > 0 ? "currentColor" : "none"} />
                                       <span>{effective.lives ?? 0}</span>
                                     </div>
                                  </td>
                                )}
                                {scoreboard.showStatus && (
                                  <td className="p-1.5 text-center">
                                     {player.isDead ? (
                                       <span className="text-destructive font-bold">Mort</span>
                                     ) : (
                                       <span className="text-green-500 font-bold">Vif</span>
                                     )}
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </section>
          );

          if (key === 'logs') return displaySettings.panels?.logs !== false && (
            <section key="logs" className="flex flex-col border border-border rounded-md bg-background">
              <div onClick={() => toggleSection('logs')} className="flex items-center justify-between p-2 bg-muted/50 hover:bg-muted font-semibold text-sm transition-colors cursor-pointer">
                <div className={`flex items-center gap-2 ${activeSection === 'logs' ? 'text-teal-400' : ''}`}>
                  <History size={16} /> Log / Historique ({logs.length})
                </div>
                {activeSection === 'logs' ? <ChevronDown size={16} className="text-teal-400" /> : <ChevronRight size={16} />}
              </div>
              {activeSection === 'logs' && (
                <div className="flex flex-col p-0 border-t border-border">
                  <div className="flex flex-col gap-2 p-2 border-b border-border bg-muted/20">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{logs.length} Événements</span>
                      <button
                        onClick={clearLogs}
                        className="text-xs flex items-center gap-1 text-destructive hover:text-white hover:bg-destructive px-2 py-1 rounded transition-colors"
                        title="Effacer l'historique"
                      >
                        <Trash2 size={12} /> Vider
                      </button>
                    </div>
                    {/* Search input */}
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={logsFilter}
                      onChange={(e) => useVttStore.getState().setLogsFilter(e.target.value)}
                      className="w-full text-xs px-2 py-1.5 bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {/* Filter checkboxes */}
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(logsSettings.showTypes).map(([type, enabled]) => {
                        const colors: Record<string, string> = {
                          info: 'bg-primary',
                          action: 'bg-amber-500',
                          system: 'bg-blue-500',
                          death: 'bg-destructive',
                          note: 'bg-purple-500',
                          role: 'bg-emerald-500',
                        };
                        return (
                          <label key={type} className="flex items-center gap-1 text-[10px] cursor-pointer px-1.5 py-0.5 rounded bg-muted/50 hover:bg-muted transition-colors">
                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={(e) => setLogsSettings({ showTypes: { ...logsSettings.showTypes, [type]: e.target.checked } })}
                              className="w-3 h-3 rounded border-border"
                            />
                            <div className={`w-1.5 h-1.5 rounded-full ${colors[type]}`} />
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex flex-col max-h-[300px] overflow-y-auto custom-scrollbar p-2 gap-2">
                    {logs.filter(log => logsSettings.showTypes[log.type] && (!logsFilter || log.message.toLowerCase().includes(logsFilter.toLowerCase()))).length === 0 ? (
                      <p className="text-xs text-muted-foreground italic text-center py-4">Aucun événement correspondant.</p>
                    ) : (
                      <>
                      {logs.filter(log => logsSettings.showTypes[log.type] && (!logsFilter || log.message.toLowerCase().includes(logsFilter.toLowerCase()))).map((log) => {
                        let dotColor = "bg-primary";
                        if (log.type === 'death') dotColor = "bg-destructive";
                        else if (log.type === 'action') dotColor = "bg-amber-500";
                        else if (log.type === 'system') dotColor = "bg-blue-500";
                        else if (log.type === 'note') dotColor = "bg-purple-500";
                        else if (log.type === 'role') dotColor = "bg-emerald-500";

                        const player = log.metadata?.playerId ? players.find(p => p.id === log.metadata?.playerId) : null;
                        const role = log.metadata?.roleId ? roles.find(r => r.id === log.metadata?.roleId) : null;

                        return (
                          <div key={log.id} className="flex gap-2 items-start text-sm">
                            <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-foreground leading-snug">{log.message}</span>
                              {(player || role) && (
                                <div className="flex items-center gap-2 mt-1">
                                  {player && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium truncate max-w-[150px]">
                                      👤 {player.name}
                                    </span>
                                  )}
                                  {role && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-medium truncate max-w-[150px]">
                                      🎭 {role.name}
                                    </span>
                                  )}
                                </div>
                              )}
                              <span className="text-[10px] text-muted-foreground mt-1">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  <div className="pt-2 border-t border-border mt-1 flex flex-col gap-2">
                    {/* Résumé statistique */}
                    <div className="flex flex-col gap-1.5 p-2 bg-muted/10 rounded-lg">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Résumé de session</span>
                      <div className="grid grid-cols-3 gap-2">
                        {(() => {
                          const stats = {
                            deaths: logs.filter(l => l.type === 'death').length,
                            roles: logs.filter(l => l.type === 'role').length,
                            actions: logs.filter(l => l.type === 'action').length,
                            notes: logs.filter(l => l.type === 'note').length,
                            system: logs.filter(l => l.type === 'system').length,
                          };
                          return (
                            <>
                              <div className="flex flex-col items-center p-1.5 bg-destructive/10 rounded">
                                <span className="text-lg font-black text-destructive">{stats.deaths}</span>
                                <span className="text-[9px] text-muted-foreground uppercase">Morts</span>
                              </div>
                              <div className="flex flex-col items-center p-1.5 bg-emerald-500/10 rounded">
                                <span className="text-lg font-black text-emerald-500">{stats.roles}</span>
                                <span className="text-[9px] text-muted-foreground uppercase">Rôles</span>
                              </div>
                              <div className="flex flex-col items-center p-1.5 bg-amber-500/10 rounded">
                                <span className="text-lg font-black text-amber-500">{stats.actions}</span>
                                <span className="text-[9px] text-muted-foreground uppercase">Actions</span>
                              </div>
                              <div className="flex flex-col items-center p-1.5 bg-purple-500/10 rounded">
                                <span className="text-lg font-black text-purple-500">{stats.notes}</span>
                                <span className="text-[9px] text-muted-foreground uppercase">Notes</span>
                              </div>
                              <div className="flex flex-col items-center p-1.5 bg-blue-500/10 rounded">
                                <span className="text-lg font-black text-blue-500">{stats.system}</span>
                                <span className="text-[9px] text-muted-foreground uppercase">Système</span>
                              </div>
                              <div className="flex flex-col items-center p-1.5 bg-primary/10 rounded">
                                <span className="text-lg font-black text-primary">{logs.length}</span>
                                <span className="text-[9px] text-muted-foreground uppercase">Total</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Exporter :</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => initialState.downloadLogs('json')}
                        className="flex-1 flex items-center justify-center gap-1 py-1 px-2 bg-accent hover:bg-accent/80 text-[10px] font-medium rounded transition-colors"
                      >
                        <Download size={12} /> JSON
                      </button>
                      <button
                        onClick={() => initialState.downloadLogs('csv')}
                        className="flex-1 flex items-center justify-center gap-1 py-1 px-2 bg-accent hover:bg-accent/80 text-[10px] font-medium rounded transition-colors"
                      >
                        <Download size={12} /> CSV
                      </button>
                      <button
                        onClick={() => initialState.downloadLogs('txt')}
                        className="flex-1 flex items-center justify-center gap-1 py-1 px-2 bg-accent hover:bg-accent/80 text-[10px] font-medium rounded transition-colors"
                      >
                        <Download size={12} /> TXT
                      </button>
                    </div>
                  </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </section>
          );

          if (key === 'wiki') return displaySettings.panels?.wiki !== false && (
            <section key="wiki" className="flex flex-col border border-border rounded-md bg-background">
              <div onClick={() => toggleSection('wiki')} className="flex items-center justify-between p-2 bg-muted/50 hover:bg-muted font-semibold text-sm transition-colors cursor-pointer">
                <div className={`flex items-center gap-2 ${activeSection === 'wiki' ? 'text-blue-400' : ''}`}>
                  <Book size={16} /> Wiki
                </div>
                {activeSection === 'wiki' ? <ChevronDown size={16} className="text-blue-400" /> : <ChevronRight size={16} />}
              </div>
              {activeSection === 'wiki' && (
                <div className="flex flex-col p-3 border-t border-border gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Mode détaché</span>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="wiki-detach-toggle"
                        checked={!!wiki.isDetached}
                        onChange={() => setWiki({ isDetached: !wiki.isDetached })}
                        className="sr-only peer"
                      />
                      <label 
                        htmlFor="wiki-detach-toggle"
                        className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${wiki.isDetached ? 'bg-primary' : 'bg-muted'}`}
                        title="Mode détaché du Wiki"
                      >
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${wiki.isDetached ? 'left-6' : 'left-1'}`} />
                        <span className="sr-only">Mode détaché du Wiki</span>
                      </label>
                    </div>
                  </div>

                  {!wiki.isDetached && wiki.isOpen ? (
                    <div className="flex flex-col gap-2">
                       <p className="text-[10px] text-muted-foreground italic text-center py-2 bg-muted/20 rounded">
                         Le Wiki est intégré ci-dessous (lecture seule ici, détachez-le pour éditer).
                       </p>
                       <div 
                          className="p-3 bg-zinc-950/50 border border-border rounded-lg min-h-[100px] max-h-[300px] overflow-y-auto custom-scrollbar text-xs leading-relaxed text-foreground wiki-content"
                          dangerouslySetInnerHTML={{ __html: wiki.content || '<em class="opacity-30">Aucun contenu...</em>' }}
                       />
                        <button
                          onClick={() => setWiki({ isOpen: false })}
                          className="w-full bg-muted text-muted-foreground text-[10px] py-1.5 rounded font-bold hover:bg-accent transition-colors uppercase tracking-wider"
                        >
                          Fermer l'aperçu
                        </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setWiki({ isOpen: !wiki.isOpen, isDetached: true })}
                      className="w-full bg-primary text-primary-foreground text-xs py-2 rounded font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Book size={14} /> {wiki.isOpen && wiki.isDetached ? 'Wiki Ouvert' : 'Ouvrir la Fenêtre Wiki'}
                    </button>
                  )}
                </div>
              )}
            </section>
          );

          if (key === 'system') return displaySettings.panels?.system !== false && (
            <section key="system" className="flex flex-col border border-border rounded-md bg-background">
              <div onClick={() => toggleSection('systeme')} className="flex items-center justify-between p-2 bg-muted/50 hover:bg-muted font-semibold text-sm transition-colors cursor-pointer">
                <div className={`flex items-center gap-2 ${activeSection === 'systeme' ? 'text-amber-500' : ''}`}>
                  <Zap size={16} /> Système & Connexion
                </div>
                {activeSection === 'systeme' ? <ChevronDown size={16} className="text-amber-500" /> : <ChevronRight size={16} />}
              </div>
              {activeSection === 'systeme' && (
                <div className="p-4 pt-3 flex flex-col gap-3 border-t border-border">
                  <div className="flex flex-wrap gap-2 pb-2 border-b border-border/50">
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold ${
                      connectionStatus === 'connected' ? 'bg-green-500/20 text-green-500' :
                      connectionStatus === 'connecting' ? 'bg-yellow-500/20 text-yellow-500' :
                      connectionStatus === 'error' ? 'bg-red-500/20 text-red-500' :
                      'bg-gray-500/20 text-gray-500'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                        connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                        connectionStatus === 'error' ? 'bg-red-500' :
                        'bg-gray-500'
                      }`} />
                      {connectionStatus === 'connected' ? 'Connecté' :
                       connectionStatus === 'connecting' ? 'Connexion...' :
                       connectionStatus === 'error' ? 'Erreur' : 'Déconnecté'}
                    </div>
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold ${
                      supabaseConfigured ? 'bg-blue-500/20 text-blue-500' : 'bg-gray-500/20 text-gray-500'
                    }`}>
                      <Database size={10} />
                      Supabase {supabaseConfigured ? 'OK' : 'Non config'}
                    </div>
                    {roomCode && (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-purple-500/20 text-purple-500 text-[10px] font-bold">
                        <Wifi size={10} />
                        {roomCode}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 text-[10px] text-muted-foreground bg-muted/30 p-2 rounded border border-border/50">
                    <div className="flex justify-between">
                      <span>📊 Joueurs connectés :</span>
                      <span className="font-mono font-bold text-foreground">{onlinePlayerIds.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🕐 Dernière sync :</span>
                      <span className="font-mono font-bold text-foreground">
                        {lastSyncTimestamp ? `il y a ${Math.floor((Date.now() - lastSyncTimestamp) / 1000)}s` : 'Jamais'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>📡 Canal :</span>
                      <span className="font-mono font-bold text-foreground truncate max-w-[150px]">
                        {roomCode ? `room:${roomCode}` : 'Aucun'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => {
                        forceBroadcastState();
                        setLastSyncTimestamp(Date.now());
                        toast.success('Synchronisation forcée envoyée');
                      }}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                      <RefreshCw size={14} /> Forcer la Synchronisation
                    </button>
                    <p className="text-[10px] text-muted-foreground italic px-1 leading-tight">
                      Envoie immédiatement l'état actuel à tous les joueurs connectés.
                    </p>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={async () => {
                        toast.info('Test de connexion en cours...');
                        const result = await testConnection();
                        if (result.success) {
                          toast.success('Connexion Supabase OK');
                        } else {
                          toast.error('Échec connexion: ' + result.error);
                        }
                      }}
                      className="flex-1 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-500 border border-green-500/30 rounded-md text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Wifi size={14} /> Tester
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setShowResetMenu(!showResetMenu)}
                        className="h-full py-2 px-3 bg-orange-600/20 hover:bg-orange-600/30 text-orange-500 border border-orange-500/30 rounded-md text-xs font-bold transition-colors"
                        title="Réinitialisation partielle"
                      >
                        <Settings size={14} />
                      </button>
                      {showResetMenu && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                          <div className="p-2 border-b border-border bg-muted/50">
                            <p className="text-[10px] font-bold text-muted-foreground">Réinitialiser</p>
                          </div>
                          <button
                            onClick={() => {
                              resetOnlinePlayers();
                              toast.success('Joueurs reset');
                              setShowResetMenu(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors flex items-center gap-2"
                          >
                            <Users size={12} /> Joueurs connectés
                          </button>
                          <button
                            onClick={() => {
                              resetChannel();
                              toast.info('Canal en cours de reset...');
                              setShowResetMenu(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors flex items-center gap-2"
                          >
                            <Wifi size={12} /> Canal Supabase
                          </button>
                          <button
                            onClick={() => {
                              resetOnlinePlayers();
                              resetChannel();
                              toast.info('Reset complet...');
                              setShowResetMenu(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-destructive/20 text-destructive transition-colors flex items-center gap-2 border-t border-border"
                          >
                            <TriangleAlert size={12} /> Reset complet
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-2">
                    <button
                      onClick={() => {
                        const code = useVttStore.getState().roomCode;
                        if (code) {
                          initHostRealtime(code);
                          toast.success('Canal réinitialisé');
                        } else {
                          toast.error('Aucun code de salle');
                        }
                      }}
                      className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-border"
                    >
                      <Zap size={14} /> Réinitialiser le Canal
                    </button>
                    <p className="text-[10px] text-muted-foreground italic px-1 leading-tight">
                      Relance la connexion Supabase en cas de coupure réseau.
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-border/30 text-foreground">
                    <button
                      onClick={() => setShowSupabaseSettings(true)}
                      className="w-full py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-md text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-blue-500/30 shadow-sm"
                    >
                      <Database size={14} /> Paramètres Supabase
                    </button>
                    <p className="text-[10px] text-muted-foreground italic px-1 leading-tight">
                      Clé d'API (Sauvegardée localement ou .env).
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-border/30">
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer hover:text-primary transition-colors px-1">
                      <input
                        type="checkbox"
                        checked={displaySettings.includeRoomCodeInLinks}
                        onChange={(e) => updateDisplaySettings({ includeRoomCodeInLinks: e.target.checked })}
                        className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5"
                      />
                      Inclure le Code de la salle
                    </label>
                    <p className="text-[10px] text-muted-foreground italic px-1 leading-tight">
                      Ajoute le code dans les liens/QR pour préremplir le champ de connexion.
                    </p>
                  </div>
                </div>
              )}
            </section>
          );

          if (key === 'popupCreator') return (displaySettings.panels?.popupCreator ?? true) && (
            <section key="popupCreator" className="flex flex-col border border-border rounded-md bg-background">
              <div onClick={() => toggleSection('popups')} className="flex items-center justify-between p-2 bg-muted/50 hover:bg-muted font-semibold text-sm transition-colors cursor-pointer">
                <div className={`flex items-center gap-2 ${activeSection === 'popups' ? 'text-indigo-400' : ''}`}>
                  <MessageSquare size={16} /> Créateur de Popup ({customPopups.length})
                </div>
                {activeSection === 'popups' ? <ChevronDown size={16} className="text-indigo-400" /> : <ChevronRight size={16} />}
              </div>
              {activeSection === 'popups' && (
                <div className="p-3 flex flex-col gap-3 border-t border-border">
                   <button
                      onClick={() => {
                        setEditingPopupId(null);
                        setNewPopupData({ title: '', imageUrl: '', soundUrl: '', content: '', showCloseButton: true, autoCloseTimer: false, autoCloseDuration: 10, showToGM: true, showToSmartphone: true, targetRoleIds: [], targetTeamIds: [], targetPlayerIds: [], scheduledDelay: 0 });
                        setShowPopupCreator(true);
                      }}
                      className="w-full bg-primary text-primary-foreground text-xs py-2 rounded font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Plus size={14} /> Ajouter popup
                    </button>
    
                    <div className="flex flex-col gap-2 mt-2">
                      {customPopups.map(popup => (
                        <div key={popup.id} className="flex flex-col gap-1 w-full bg-muted/20 border border-border/50 rounded-md p-2">
                          <div className="flex justify-between items-center w-full">
                            <span className="text-xs font-bold truncate pr-2">{popup.title}</span>
                            <div className="flex items-center gap-1">
                              <button onClick={() => {
                                setEditingPopupId(popup.id);
                                setNewPopupData({
                                  title: popup.title,
                                  imageUrl: popup.imageUrl || '',
                                  soundUrl: popup.soundUrl || '',
                                  content: popup.content,
                                  showCloseButton: popup.showCloseButton,
                                  autoCloseTimer: popup.autoCloseTimer,
                                  autoCloseDuration: popup.autoCloseDuration || 10,
                                  showToGM: popup.showToGM ?? true,
                                  showToSmartphone: popup.showToSmartphone ?? true,
                                  targetRoleIds: popup.targetRoleIds || [],
                                  targetTeamIds: popup.targetTeamIds || [],
                                  targetPlayerIds: popup.targetPlayerIds || [],
                                  scheduledDelay: popup.scheduledDelay || 0
                                });
                                setShowPopupCreator(true);
                              }} className="text-muted-foreground hover:text-primary transition-colors p-1" title="Modifier">
                                <Edit2 size={12} />
                              </button>
                              <button onClick={async () => {
                                if (popup.imageUrl) await deleteFileFromStorage(popup.imageUrl);
                                deleteCustomPopup(popup.id);
                              }} className="text-destructive hover:text-white hover:bg-destructive p-1 rounded transition-colors" title="Supprimer">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => triggerCustomPopup(popup.id)}
                            className="w-full mt-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded text-[10px] uppercase font-bold py-1.5 transition-colors border border-indigo-500/30 flex justify-center items-center gap-1.5 leading-tight"
                            title={getPopupTriggerLabel(popup)}
                          >
                             <MonitorUp size={12} /> <span className="truncate block max-w-[180px]">{getPopupTriggerLabel(popup)}</span>
                          </button>
                        </div>
                      ))}
                      {customPopups.length === 0 && (
                        <p className="text-xs text-muted-foreground italic text-center py-2">Aucune popup créée.</p>
                      )}
                    </div>
                </div>
              )}
            </section>
          );

          if (key === 'actionCreator') return (displaySettings.panels?.actionCreator ?? true) && (
            <section key="actionCreator" className="flex flex-col border border-border rounded-md bg-background">
              <div onClick={() => toggleSection('actions')} className="flex items-center justify-between p-2 bg-muted/50 hover:bg-muted font-semibold text-sm transition-colors cursor-pointer">
                <div className={`flex items-center gap-2 ${activeSection === 'actions' ? 'text-orange-400' : ''}`}>
                  <Zap size={16} /> Créateur d'Actions ({actions.length})
                </div>
                {activeSection === 'actions' ? <ChevronDown size={16} className="text-orange-400" /> : <ChevronRight size={16} />}
              </div>
              {activeSection === 'actions' && (
                <div className="p-3 flex flex-col gap-3 border-t border-border">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActionCreatorState({ isOpen: true, isDetached: true })}
                      className="flex-1 bg-primary text-primary-foreground text-xs py-2 rounded font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Plus size={14} /> Ajouter Action
                    </button>
                    <button
                      onClick={() => {
                        const dataStr = JSON.stringify(actions, null, 2);
                        const blob = new Blob([dataStr], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `actions-${new Date().toISOString().slice(0, 10)}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded border border-blue-500/30 transition-colors"
                      title="Exporter les actions en JSON"
                    >
                      <Download size={14} />
                    </button>
                    <label className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded border border-green-500/30 transition-colors cursor-pointer" title="Importer des actions depuis JSON">
                      <Upload size={14} />
                      <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            try {
                              const imported = JSON.parse(event.target?.result as string);
                              if (Array.isArray(imported)) {
                                imported.forEach(action => {
                                  addAction({ ...action, id: uuidv4() });
                                });
                              }
                            } catch (err) {
                              console.error('Failed to import actions:', err);
                            }
                          };
                          reader.readAsText(file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
    
                    <div className="flex flex-col gap-2 mt-2">
                      {actions.map(action => (
                        <div key={action.id} className="flex items-center gap-1.5 w-full group animate-in slide-in-from-right-2 duration-200">
                          <button
                            onClick={() => executeAction(action.id)}
                            disabled={action.enabled === false}
                            className={`flex-1 rounded-md text-[10px] uppercase font-bold py-2 px-3 transition-all border flex items-center gap-2 shadow-sm truncate ${
                              action.enabled !== false 
                                ? (action.currentRepeatExecution && action.currentRepeatExecution > 0 
                                    ? 'bg-red-600/20 text-red-400 border-red-500/30 font-black animate-pulse' 
                                    : action.effects?.some((e: any) => e.type === 'triggerAction')
                                      ? 'bg-orange-600/10 hover:bg-orange-600/20 text-orange-400 border-orange-500/20'
                                      : 'bg-green-600/10 hover:bg-green-600/20 text-green-400 border-green-500/20')
                                : 'bg-muted/30 text-muted-foreground border-border/10 cursor-not-allowed opacity-60'
                            }`}
                          >
                            <Play size={10} className="shrink-0" />
                            <span className="truncate">{action.name}</span>
                          </button>
                          
                          <div className="flex items-center gap-1 shrink-0">
                            <button 
                              onClick={() => {
                                setPendingConditions(action.conditions || []);
                                setPendingEffects(action.effects || []);
                                setActionCreatorState({ isOpen: true, isDetached: true, editingActionId: action.id });
                              }}
                              className="p-1.5 bg-muted/50 hover:bg-primary/20 text-muted-foreground hover:text-primary rounded-md transition-colors border border-border/50" 
                              title="Modifier"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button 
                              onClick={() => duplicateAction(action.id)} 
                              className="p-1.5 bg-muted/50 hover:bg-blue-500/20 text-muted-foreground hover:text-blue-400 rounded-md transition-colors border border-border/50" 
                              title="Dupliquer"
                            >
                              <Copy size={12} />
                            </button>
                            <button 
                              onClick={() => deleteAction(action.id)} 
                              className="p-1.5 bg-muted/50 hover:bg-destructive/20 text-muted-foreground hover:text-destructive rounded-md transition-colors border border-border/50" 
                              title="Supprimer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {actions.length === 0 && (
                        <p className="text-xs text-muted-foreground italic text-center py-2">Aucune action créée.</p>
                      )}
                    </div>
                </div>
              )}
            </section>
          );

          if (key === 'checklist') return (displaySettings.panels?.checklist ?? true) && (
            <section key="checklist" className="flex flex-col border border-border rounded-md bg-background">
              <div className="flex items-center justify-between p-2 bg-muted/50 hover:bg-muted font-semibold text-sm transition-colors group cursor-pointer">
                <div 
                  onClick={() => toggleSection('checklist')}
                  className="flex items-center gap-2 flex-1 text-left"
                >
                  <div className={`flex items-center gap-2 ${activeSection === 'checklist' ? 'text-green-500' : ''}`}>
                    <CheckSquare size={16} /> Checklist pour le MJ ({checklist?.length || 0})
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setChecklistState({ isDetached: true, isOpen: true });
                    }}
                    className="p-1 text-muted-foreground hover:text-green-500 transition-colors"
                    title="Détacher la checklist"
                  >
                    <ArrowUpRight size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); toggleSection('checklist'); }}>
                    {activeSection === 'checklist' ? <ChevronDown size={16} className="text-green-500" /> : <ChevronRight size={16} />}
                  </button>
                </div>
              </div>
              {activeSection === 'checklist' && !checklistState.isDetached && (
                <div className="p-3 border-t border-border max-h-[500px] flex flex-col min-h-[300px]">
                  <ChecklistContent />
                </div>
              )}
              {activeSection === 'checklist' && checklistState.isDetached && (
                <div className="p-4 border-t border-border text-center flex flex-col gap-3">
                  <p className="text-xs text-muted-foreground italic">La checklist est détachée.</p>
                  <button
                    onClick={() => setChecklistState({ isDetached: false })}
                    className="bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold uppercase py-2 rounded-md transition-colors border border-primary/20"
                  >
                    Rattacher ici
                  </button>
                </div>
              )}
            </section>
          );

          if (key === 'tagDistributor') return (displaySettings.panels?.tagDistributor ?? true) && (
            <section key="tagDistributor" className="flex flex-col border border-border rounded-md bg-background">
              <div
                onClick={() => toggleSection('tagDistributor')}
                className="flex items-center justify-between p-2 bg-muted/50 hover:bg-muted font-semibold text-sm transition-colors cursor-pointer"
              >
                <div className={`flex items-center gap-2 ${activeSection === 'tagDistributor' ? 'text-blue-400' : ''}`}>
                  <Tag size={16} /> Distributeur de Tags ({tags.filter(t => t.isInDistributor).length})
                </div>
                <div className="flex items-center gap-2">
                  {activeSection === 'tagDistributor' ? <ChevronDown size={16} className="text-blue-400" /> : <ChevronRight size={16} />}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTagDistributorState({ isDetached: true, isOpen: true });
                    }}
                    disabled={tagDistributorState.isDetached || tags.filter(t => t.isInDistributor).length === 0}
                    className={`p-1 transition-colors flex items-center justify-center rounded ${
                      tagDistributorState.isDetached || tags.filter(t => t.isInDistributor).length === 0
                        ? 'opacity-30 cursor-not-allowed' 
                        : 'text-primary hover:bg-primary/20 bg-primary/10'
                    }`}
                    title="Détacher le distributeur"
                  >
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
              {activeSection === 'tagDistributor' && (
                <div className="flex flex-col p-3 border-t border-border">
                  {tags.filter(t => t.isInDistributor).length === 0 ? (
                    <p className="text-[10px] text-muted-foreground italic text-center py-2">
                      Aucun tag dans le distributeur. Cochez "Ajouter au Distributeur" dans l'onglet Tags.
                    </p>
                  ) : (
                    <>
                      <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {tags.filter(t => t.isInDistributor).map(tag => {
                          const IconComponent = icons[tag.icon as keyof typeof icons] || Tag;
                          return (
                            <div
                              key={tag.id}
                              className="flex items-center justify-between p-2 rounded-md border border-border bg-card hover:bg-accent/50 group"
                            >
                              <div className="flex items-center gap-2 overflow-hidden flex-1">
                                <div 
                                  className="w-6 h-6 rounded flex items-center justify-center shrink-0 shadow-sm" 
                                  style={{ backgroundColor: tag.color, color: '#fff' }}
                                >
                                  {React.createElement(IconComponent as any, { size: 14 })}
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="text-xs font-semibold truncate">{tag.name}</span>
                                  {(tag.lives !== null || tag.points !== null) && (
                                    <span className="text-[9px] text-muted-foreground">
                                      {[tag.lives !== null ? `♥${tag.lives}` : null, tag.points !== null ? `★${tag.points}` : null].filter(Boolean).join(' | ')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => updateTagModel(tag.id, { isInDistributor: false })}
                                  className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                                  title="Retirer du distributeur"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                        <button
                          onClick={() => setTagDistributorState({ isDetached: true, isOpen: true })}
                          disabled={tagDistributorState.isDetached}
                          className="flex-1 flex items-center justify-center gap-2 py-1.5 bg-primary text-primary-foreground text-xs rounded font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ArrowUpRight size={12} /> Détacher
                        </button>
                        <button
                          onClick={() => {
                            tags.filter(t => t.isInDistributor).forEach(tag => {
                              updateTagModel(tag.id, { isInDistributor: false });
                            });
                          }}
                          className="flex-1 flex items-center justify-center gap-2 py-1.5 bg-muted text-muted-foreground text-xs rounded font-medium hover:bg-accent transition-colors"
                        >
                          <X size={12} /> Tout retirer
                        </button>
                      </div>
                      
                      {tagDistributorState.isDetached && (
                        <p className="text-[10px] text-muted-foreground mt-2 text-center italic">
                          Le distributeur est ouvert dans une fenêtre flottante.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
              {!activeSection && !tagDistributorState.isDetached && tags.filter(t => t.isInDistributor).length > 0 && (
                <div className="flex flex-wrap gap-1 p-2 pt-0 border-t border-border mt-1">
                  {tags.filter(t => t.isInDistributor).slice(0, 8).map(tag => (
                    <div
                      key={tag.id}
                      className="w-5 h-5 rounded flex items-center justify-center text-[8px] shadow-sm"
                      style={{ backgroundColor: tag.color, color: '#fff' }}
                      title={tag.name}
                    >
                      {(() => {
                        const IconComponent = icons[tag.icon as keyof typeof icons] || Tag;
                        return React.createElement(IconComponent as any, { size: 10 });
                      })()}
                    </div>
                  ))}
                  {tags.filter(t => t.isInDistributor).length > 8 && (
                    <div className="w-5 h-5 rounded flex items-center justify-center bg-muted text-[8px] font-bold">
                      +{tags.filter(t => t.isInDistributor).length - 8}
                    </div>
                  )}
                </div>
              )}
            </section>
          );

          if (key === 'magneticPoints') return (displaySettings.panels?.magneticPoints ?? true) && (
            <section key="magneticPoints" className="flex flex-col border border-border rounded-md bg-background">
              <div onClick={() => toggleSection('magneticPoints')} className="flex items-center justify-between p-2 bg-muted/50 hover:bg-muted font-semibold text-sm transition-colors cursor-pointer">
                <div className={`flex items-center gap-2 ${activeSection === 'magneticPoints' ? 'text-blue-500' : ''}`}>
                  <Magnet size={16} /> Points aimantés
                </div>
                {activeSection === 'magneticPoints' ? <ChevronDown size={16} className="text-blue-500" /> : <ChevronRight size={16} />}
              </div>
              {activeSection === 'magneticPoints' && (
                <div className="p-3 flex flex-col gap-3 border-t border-border">
                  <div className="flex gap-2">
                    <button
                      onClick={() => addMagneticPoint()}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/10 text-blue-500 border border-blue-500/20 rounded-md text-xs font-bold hover:bg-blue-600/20 transition-colors"
                    >
                      <Plus size={14} /> Ajouter
                    </button>
                    <button
                      onClick={() => setShowMagneticTemplateModal(true)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600/10 text-purple-500 border border-purple-500/20 rounded-md text-xs font-bold hover:bg-purple-600/20 transition-colors"
                    >
                      <LayoutGrid size={14} /> Templates
                    </button>
                  </div>

                  <div className="flex flex-col gap-1 px-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                      <span>Points :</span>
                      <span className="text-foreground">
                        {magneticPoints.length} / {players.length}
                      </span>
                    </div>
                  </div>

                  {magneticPoints.length > 0 && (
                    <div className="flex flex-col gap-1 max-h-48 overflow-y-auto px-1">
                      {[...magneticPoints].sort((a, b) => a.order - b.order).map((point, index) => (
                        <div
                          key={point.id}
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            setMagneticDragIndex(index);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (magneticDragIndex !== null && magneticDragIndex !== index) {
                              reorderMagneticPoints(magneticDragIndex, index);
                            }
                            setMagneticDragIndex(null);
                          }}
                          onDragEnd={() => setMagneticDragIndex(null)}
                          className="flex flex-col gap-1 px-2 py-1.5 bg-muted/50 rounded-md text-xs group cursor-grab active:cursor-grabbing hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <GripVertical size={12} className="text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
                              <span className="flex items-center justify-center w-5 h-5 rounded-full shrink-0 font-bold text-[10px]" style={{ backgroundColor: `${point.color || displaySettings.magneticPointsColor || '#3b82f6'}20`, color: point.color || displaySettings.magneticPointsColor || '#3b82f6' }}>
                                {point.order}
                              </span>
                              <span className="text-muted-foreground font-mono text-[9px] shrink-0">
                                ({Math.round(point.x)}, {Math.round(point.y)})
                              </span>
                              {point.label && (
                                <span className="text-muted-foreground truncate flex-1" title={point.label}>
                                  • {point.label}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <input
                                type="color"
                                value={point.color || displaySettings.magneticPointsColor || '#3b82f6'}
                                onChange={(e) => updateMagneticPointColor(point.id, e.target.value)}
                                className="w-4 h-4 rounded border-none cursor-pointer p-0 bg-transparent"
                                title="Couleur du point"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button
                                onClick={() => deleteMagneticPoint(point.id)}
                                className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                                title="Supprimer le point"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pl-6">
                            <input
                              type="text"
                              value={point.label || ''}
                              onChange={(e) => updateMagneticPointLabel(point.id, e.target.value)}
                              placeholder="Label (ex: Loups, Village...)"
                              className="flex-1 min-w-0 bg-background border border-border rounded px-1.5 py-0.5 text-[10px] font-mono"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">Afficher</span>
                    <button
                      onClick={() => setShowMagneticPoints(!showMagneticPoints)}
                      className={`p-1.5 rounded-md transition-all ${showMagneticPoints ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-muted text-muted-foreground'}`}
                      title={showMagneticPoints ? 'Masquer les points' : 'Afficher les points'}
                    >
                      {showMagneticPoints ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">Snap to grid</span>
                    <button
                      onClick={() => setMagneticSnapToGrid(!magneticSnapToGrid)}
                      className={`p-1.5 rounded-md transition-all ${magneticSnapToGrid ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'bg-muted text-muted-foreground'}`}
                      title={magneticSnapToGrid ? 'Désactiver snap to grid' : 'Activer snap to grid'}
                    >
                      <Grid2X2 size={14} />
                    </button>
                  </div>

                  <div className="flex gap-2 px-1">
                    <button
                      onClick={() => exportMagneticPoints()}
                      disabled={magneticPoints.length === 0}
                      className="flex-1 flex items-center justify-center gap-2 px-2 py-1.5 bg-green-600/10 text-green-500 border border-green-500/20 rounded-md text-[10px] font-bold hover:bg-green-600/20 transition-colors disabled:opacity-50"
                    >
                      <Download size={12} /> Export
                    </button>
                    <button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.json';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const result = importMagneticPoints(ev.target?.result as string);
                              if (result.success) {
                                toast.success('Points importés avec succès');
                              } else {
                                toast.error(result.error || 'Erreur lors de l\'import');
                              }
                            };
                            reader.readAsText(file);
                          }
                        };
                        input.click();
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-2 py-1.5 bg-orange-600/10 text-orange-500 border border-orange-500/20 rounded-md text-[10px] font-bold hover:bg-orange-600/20 transition-colors"
                    >
                      <Upload size={12} /> Import
                    </button>
                  </div>

                  <div className="relative group">
                    <button
                      onClick={() => snapPlayersToPoints()}
                      disabled={magneticPoints.length === 0}
                      onMouseEnter={() => setShowMagneticPreview(true)}
                      onMouseLeave={() => setShowMagneticPreview(false)}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-xs font-black uppercase tracking-wider transition-all justify-center shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
                        magneticPoints.length < players.length 
                          ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20' 
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                      }`}
                    >
                      <Magnet size={14} className={magneticPoints.length > 0 ? "animate-pulse" : ""} /> Aimanter
                    </button>
                    {showMagneticPreview && magneticPoints.length > 0 && (
                      <div className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-popover border border-border rounded-lg shadow-xl z-50">
                        <p className="text-xs font-bold mb-2">Aperçu :</p>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {[...magneticPoints].sort((a, b) => a.order - b.order).slice(0, 5).map((point, idx) => {
                            const targetPlayer = players.filter(p => !p.isDead)[idx];
                            return (
                              <div key={point.id} className="flex items-center gap-2 text-[10px]">
                                <span className="w-4 h-4 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: `${point.color || displaySettings.magneticPointsColor || '#3b82f6'}20`, color: point.color || displaySettings.magneticPointsColor || '#3b82f6' }}>
                                  {point.order}
                                </span>
                                <span className="text-muted-foreground">→</span>
                                <span className={targetPlayer ? 'text-foreground' : 'text-muted-foreground italic'}>
                                  {targetPlayer?.name || 'Aucun joueur'}
                                </span>
                                {point.label && (
                                  <span className="text-muted-foreground ml-auto">({point.label})</span>
                                )}
                              </div>
                            );
                          })}
                          {magneticPoints.length > 5 && (
                            <p className="text-[9px] text-muted-foreground text-center">... et {magneticPoints.length - 5} autres</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (confirm('Supprimer tous les points aimantés ?')) {
                        clearMagneticPoints();
                      }
                    }}
                    disabled={magneticPoints.length === 0}
                    className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 text-destructive hover:bg-destructive text-[10px] font-bold rounded-md transition-all justify-center hover:text-destructive-foreground disabled:opacity-50"
                  >
                    <Trash2 size={12} /> Tout supprimer
                  </button>
                </div>
              )}
            </section>
          );
          
          return null;
        })}

      </div>

      {/* Magnetic Points Template Modal */}
      {showMagneticTemplateModal && (
        <div 
          className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowMagneticTemplateModal(false);
          }}
        >
          <div className="bg-popover text-popover-foreground rounded-lg shadow-2xl w-full max-w-lg overflow-hidden border border-border" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/50">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <LayoutGrid size={20} className="text-purple-500" />
                Templates de points aimantés
              </h2>
              <button 
                onClick={() => setShowMagneticTemplateModal(false)} 
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Fermer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
              <TemplateCard
                title="Cercle"
                description="Points disposés en cercle parfait"
                icon="circle"
                onClick={() => {
                  const count = Math.max(3, players.length);
                  createPointsFromTemplate({ type: 'circle', params: { radius: 250 } }, count);
                  setShowMagneticTemplateModal(false);
                }}
              />
              <TemplateCard
                title="Ligne"
                description="Points alignés horizontalement"
                icon="line"
                onClick={() => {
                  const count = Math.max(2, players.length);
                  createPointsFromTemplate({ type: 'line', params: { startX: -250, endX: 250 } }, count);
                  setShowMagneticTemplateModal(false);
                }}
              />
              <TemplateCard
                title="Grille"
                description="Points organisés en grille"
                icon="grid"
                onClick={() => {
                  const count = Math.max(4, players.length);
                  createPointsFromTemplate({ type: 'grid', params: { spacing: 120 } }, count);
                  setShowMagneticTemplateModal(false);
                }}
              />
              <TemplateCard
                title="Carré"
                description="Points en formation carrée"
                icon="square"
                onClick={() => {
                  const count = Math.max(4, players.length);
                  createPointsFromTemplate({ type: 'square', params: { size: 350 } }, count);
                  setShowMagneticTemplateModal(false);
                }}
              />
              <TemplateCard
                title="Arc de cercle"
                description="Demi-cercle face au MJ"
                icon="arc"
                onClick={() => {
                  const count = Math.max(3, players.length);
                  createPointsFromTemplate({ type: 'arc', params: { radius: 300, startAngle: 0, endAngle: 180 } }, count);
                  setShowMagneticTemplateModal(false);
                }}
              />
              <TemplateCard
                title="Aléatoire"
                description="Points dispersés aléatoirement"
                icon="random"
                onClick={() => {
                  const count = Math.max(5, players.length);
                  createPointsFromTemplate({ type: 'random', params: { bounds: { x: -400, y: -300, width: 800, height: 600 } } }, count);
                  setShowMagneticTemplateModal(false);
                }}
              />
            </div>
            <div className="p-3 border-t border-border bg-muted/50 flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {players.length} joueurs • {magneticPoints.length} points actuels
              </span>
              <button
                onClick={() => setShowMagneticTemplateModal(false)}
                className="px-4 py-1.5 text-xs font-bold rounded-md bg-muted hover:bg-muted/80 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supabase Settings Modal */}
      {showSupabaseSettings && (
        <div 
          className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={(e) => {
            // Prevent close on modal content click, only on backdrop
            if (e.target === e.currentTarget) setShowSupabaseSettings(false);
          }}
        >
          <div className="bg-popover text-popover-foreground rounded-lg shadow-2xl w-full max-w-md overflow-hidden border border-border" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/50">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Database size={20} className="text-blue-500" />
                Configuration Supabase
              </h2>
              <button 
                onClick={() => setShowSupabaseSettings(false)} 
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Fermer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Enregistrez vos clés Supabase pour cette session locale. Cela permet de tester sur Vercel facilement sans fichier .env.
              </p>
              <div className="flex items-center gap-2 p-2 bg-muted/30 rounded border border-border/50">
                <input
                  type="checkbox"
                  id="use-env-example"
                  checked={useEnvExample}
                  onChange={(e) => handleToggleEnvExample(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-ring cursor-pointer"
                />
                <label htmlFor="use-env-example" className="text-sm font-medium cursor-pointer select-none">
                  Utiliser le fichier .env.example
                </label>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">URL Supabase</label>
                <input
                  type="text"
                  defaultValue={localStorage.getItem('VTT_SUPABASE_URL') || ''}
                  ref={urlRef}
                  className="w-full bg-background border border-border rounded p-2 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="https://xxxxxx.supabase.co"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Clé Anonyme (Anon Key)</label>
                <input
                  type="password"
                  defaultValue={localStorage.getItem('VTT_SUPABASE_ANON_KEY') || ''}
                  ref={keyRef}
                  className="w-full bg-background border border-border rounded p-2 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR..."
                />
              </div>
            </div>
            <div className="p-4 bg-muted/50 border-t border-border flex justify-end gap-2">
              <button onClick={() => setShowSupabaseSettings(false)} className="px-4 py-2 text-sm hover:bg-accent rounded transition-colors">
                Annuler
              </button>
              <button onClick={saveSupabaseConfig} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded font-bold transition-colors">
                Sauvegarder & Recharger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup Creator Modal */}
      {showPopupCreator && (
        <div 
          className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPopupCreator(false);
          }}
        >
          <div className="bg-popover text-popover-foreground rounded-lg shadow-2xl w-full max-w-xl overflow-hidden border border-border flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/50 shrink-0">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <MessageSquare size={20} className="text-indigo-500" />
                Créateur de Popup
              </h2>
              <button 
                onClick={() => {
                  setShowPopupCreator(false);
                  setEditingPopupId(null);
                }} 
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Fermer"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Titre Popup</label>
                <input
                  type="text"
                  value={newPopupData.title}
                  onChange={e => setNewPopupData({...newPopupData, title: e.target.value})}
                  className="w-full bg-background border border-border rounded p-2 text-sm focus:outline-none focus:border-primary"
                  placeholder="Ex: Événement Spécial"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Image principale (Optionnel)</label>
                {!newPopupData.imageUrl ? (
                  <div
                    onClick={() => popupImageInputRef.current?.click()}
                    className="w-full h-24 border-2 border-dashed border-border rounded-md flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-colors"
                  >
                    <Upload size={24} className="mb-2 opacity-50" />
                    <span className="text-xs font-medium">Charger une image (Appareil)</span>
                  </div>
                ) : (
                  <div className="relative w-full h-32 rounded-md overflow-hidden border border-border group">
                    <div
                      className="absolute inset-0 bg-contain bg-center bg-no-repeat"
                      style={{ backgroundImage: `url(${newPopupData.imageUrl})` }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <button
                        onClick={async () => {
                          if (newPopupData.imageUrl) {
                            await deleteFileFromStorage(newPopupData.imageUrl);
                          }
                          setNewPopupData({...newPopupData, imageUrl: ''});
                        }}
                        className="p-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                        title="Supprimer l'image"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={popupImageInputRef} 
                  accept="image/*" 
                  className="hidden" 
                  title="Charger une image pour le popup"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = await uploadFileToStorage(file);
                      if (url) {
                        setNewPopupData({...newPopupData, imageUrl: url});
                      }
                    }
                  }} 
                />
              </div>


              <div className="space-y-2">
                <label htmlFor="popup-sound-url" className="text-sm font-semibold flex items-center gap-2">
                  <Volume2 size={16} className="text-blue-500" />
                  <span>Son au déclenchement (Optionnel)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    id="popup-sound-url"
                    type="text"
                    value={newPopupData.soundUrl || ''}
                    onChange={e => setNewPopupData({...newPopupData, soundUrl: e.target.value})}
                    placeholder="URL du son ou charger un fichier..."
                    className="flex-1 bg-background border border-border rounded p-2 text-sm focus:outline-none focus:border-primary"
                  />
                  <button
                    onClick={() => popupSoundInputRef.current?.click()}
                    className="p-2 bg-muted hover:bg-muted/80 rounded border border-border transition-colors"
                    title="Charger un son"
                  >
                    <Upload size={16} />
                  </button>
                  {newPopupData.soundUrl && (
                    <button
                      onClick={() => setNewPopupData({...newPopupData, soundUrl: ''})}
                      className="p-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded border border-destructive/20 transition-colors"
                      title="Supprimer le son"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <input 
                  ref={popupSoundInputRef}
                  type="file" 
                  accept="audio/*" 
                  className="hidden" 
                  title="Charger un son pour le popup"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = await uploadFileToStorage(file);
                      if (url) {
                        setNewPopupData({...newPopupData, soundUrl: url});
                      }
                    }
                  }} 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold flex justify-between items-end">
                  <span>Contenu (Texte riche WIKI)</span>
                </label>
                <textarea
                  value={newPopupData.content}
                  onChange={e => setNewPopupData({...newPopupData, content: e.target.value})}
                  className="w-full bg-background border border-border rounded p-2 text-sm focus:outline-none focus:border-primary custom-scrollbar min-h-[120px] resize-y"
                  placeholder="Corps du texte... Support HTML simple si désiré."
                />
              </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border/50 pt-4 mt-2">
                 <label className="flex items-center gap-2 text-sm cursor-pointer border border-border/50 p-2 rounded hover:bg-muted/30 transition-colors">
                   <input
                     type="checkbox"
                     checked={newPopupData.showCloseButton}
                     onChange={e => setNewPopupData({...newPopupData, showCloseButton: e.target.checked})}
                     className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                   />
                   Afficher un bouton de fermeture
                 </label>
                 <label className="flex items-center gap-2 text-sm cursor-pointer border border-border/50 p-2 rounded hover:bg-muted/30 transition-colors">
                   <input
                     type="checkbox"
                     checked={newPopupData.autoCloseTimer}
                     onChange={e => setNewPopupData({...newPopupData, autoCloseTimer: e.target.checked})}
                     className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                   />
                   Fermeture automatique
                 </label>
                 {newPopupData.autoCloseTimer && (
                   <div className="col-span-2 flex items-center gap-3 border border-border/50 p-2 rounded bg-muted/20">
                     <span className="text-xs font-medium">Durée :</span>
                     <input
                       type="range"
                       min="5"
                       max="60"
                       step="5"
                       value={newPopupData.autoCloseDuration || 10}
                       onChange={e => setNewPopupData({...newPopupData, autoCloseDuration: parseInt(e.target.value)})}
                       className="flex-1 accent-primary"
                     />
                     <span className="text-sm font-bold text-primary w-12 text-center">{newPopupData.autoCloseDuration}s</span>
                   </div>
                 )}
                 <label className="flex items-center gap-2 text-sm cursor-pointer border border-border/50 p-2 rounded hover:bg-muted/30 transition-colors">
                   <input
                     type="checkbox"
                     checked={newPopupData.showToGM ?? true}
                     onChange={e => setNewPopupData({...newPopupData, showToGM: e.target.checked})}
                     className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                   />
                   Vue par le MJ
                 </label>
                 <label className="flex items-center gap-2 text-sm cursor-pointer border border-border/50 p-2 rounded hover:bg-muted/30 transition-colors">
                   <input
                     type="checkbox"
                     checked={newPopupData.showToSmartphone ?? true}
                     onChange={e => setNewPopupData({...newPopupData, showToSmartphone: e.target.checked})}
                     className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                   />
                   Vue sur smartphone
                 </label>
               </div>

               {/* Ciblage avancé */}
               <div className="border-t border-border/50 pt-4 mt-2">
                 <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Ciblage avancé</h3>
                 <p className="text-[10px] text-muted-foreground italic mb-3">Laisser vide pour afficher à tous</p>
                 
                 {/* Target Roles */}
                 <div className="space-y-2 mb-4">
                   <label className="text-xs font-semibold">Rôles cibles</label>
                   <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar p-2 bg-muted/20 rounded border border-border/50">
                     {roles.map(role => (
                       <label key={role.id} className="flex items-center gap-1.5 text-[10px] cursor-pointer px-2 py-1 rounded bg-background border border-border/50 hover:bg-muted/50">
                         <input
                           type="checkbox"
                           checked={newPopupData.targetRoleIds?.includes(role.id)}
                           onChange={e => {
                             if (e.target.checked) {
                               setNewPopupData({...newPopupData, targetRoleIds: [...(newPopupData.targetRoleIds || []), role.id]});
                             } else {
                               setNewPopupData({...newPopupData, targetRoleIds: (newPopupData.targetRoleIds || []).filter(id => id !== role.id)});
                             }
                           }}
                           className="rounded border-border text-primary focus:ring-primary w-3 h-3"
                         />
                         <span className="truncate max-w-[120px]">{role.name}</span>
                       </label>
                     ))}
                     {roles.length === 0 && <span className="text-[10px] text-muted-foreground italic">Aucun rôle</span>}
                   </div>
                 </div>

                 {/* Target Teams */}
                 <div className="space-y-2 mb-4">
                   <label className="text-xs font-semibold">Équipes cibles</label>
                   <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar p-2 bg-muted/20 rounded border border-border/50">
                     {teams.map(team => (
                       <label key={team.id} className="flex items-center gap-1.5 text-[10px] cursor-pointer px-2 py-1 rounded bg-background border border-border/50 hover:bg-muted/50">
                         <input
                           type="checkbox"
                           checked={newPopupData.targetTeamIds?.includes(team.id)}
                           onChange={e => {
                             if (e.target.checked) {
                               setNewPopupData({...newPopupData, targetTeamIds: [...(newPopupData.targetTeamIds || []), team.id]});
                             } else {
                               setNewPopupData({...newPopupData, targetTeamIds: (newPopupData.targetTeamIds || []).filter(id => id !== team.id)});
                             }
                           }}
                           className="rounded border-border text-primary focus:ring-primary w-3 h-3"
                           style={{ accentColor: team.color }}
                         />
                         <span className="truncate max-w-[120px]">{team.name}</span>
                       </label>
                     ))}
                     {teams.length === 0 && <span className="text-[10px] text-muted-foreground italic">Aucune équipe</span>}
                   </div>
                 </div>

                 {/* Target Players */}
                 <div className="space-y-2 mb-4">
                   <label className="text-xs font-semibold">Joueurs cibles</label>
                   <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar p-2 bg-muted/20 rounded border border-border/50">
                     {players.map(player => (
                       <label key={player.id} className="flex items-center gap-1.5 text-[10px] cursor-pointer px-2 py-1 rounded bg-background border border-border/50 hover:bg-muted/50">
                         <input
                           type="checkbox"
                           checked={newPopupData.targetPlayerIds?.includes(player.id)}
                           onChange={e => {
                             if (e.target.checked) {
                               setNewPopupData({...newPopupData, targetPlayerIds: [...(newPopupData.targetPlayerIds || []), player.id]});
                             } else {
                               setNewPopupData({...newPopupData, targetPlayerIds: (newPopupData.targetPlayerIds || []).filter(id => id !== player.id)});
                             }
                           }}
                           className="rounded border-border text-primary focus:ring-primary w-3 h-3"
                         />
                         <div className="flex items-center gap-1">
                           <div className="w-2 h-2 rounded-full" style={{ backgroundColor: player.color }} />
                           <span className="truncate max-w-[100px]">{player.name}</span>
                         </div>
                       </label>
                     ))}
                     {players.length === 0 && <span className="text-[10px] text-muted-foreground italic">Aucun joueur</span>}
                   </div>
                 </div>
               </div>

                {/* Scheduling */}
                <div className="border-t border-border/50 pt-4 mt-2">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Programmation</h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm cursor-pointer border border-border/50 p-2 rounded hover:bg-muted/30 transition-colors">
                      <input
                        type="checkbox"
                        checked={newPopupData.scheduledDelay ? true : false}
                        onChange={e => setNewPopupData({...newPopupData, scheduledDelay: e.target.checked ? 10 : 0})}
                        className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                      />
                      Déclencher après un délai
                    </label>
                    {newPopupData.scheduledDelay ? (
                      <div className="flex items-center gap-3 ml-6 p-2 bg-muted/20 rounded border border-border/50">
                        <span className="text-xs font-medium">Délai :</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={newPopupData.scheduledDelay}
                          onChange={e => setNewPopupData({...newPopupData, scheduledDelay: parseInt(e.target.value) || 0})}
                          className="w-20 bg-background border border-border rounded p-1 text-sm"
                        />
                        <span className="text-xs font-medium">secondes</span>
                      </div>
                    ) : null}
                  </div>
                </div>
            </div>

            <div className="p-4 bg-muted/50 border-t border-border flex justify-between items-center shrink-0">
              <button 
                onClick={() => {
                    setNewPopupData({ title: '', imageUrl: '', soundUrl: '', content: '', showCloseButton: true, autoCloseTimer: false, autoCloseDuration: 10, showToGM: true, showToSmartphone: true, targetRoleIds: [], targetTeamIds: [], targetPlayerIds: [], scheduledDelay: 0 });
                  setShowPopupCreator(false);
                  setEditingPopupId(null);
                }} 
                className="px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded font-medium transition-colors border border-destructive/20"
              >
                Annuler
              </button>
              <button 
                onClick={() => {
                  setPreviewPopup({
                    id: 'preview',
                    ...newPopupData
                  });
                }} 
                disabled={!newPopupData.title.trim()}
                className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                Prévisualisation
              </button>
              <button 
                onClick={() => {
                  if (newPopupData.title.trim()) {
                    if (editingPopupId) {
                      updateCustomPopup(editingPopupId, newPopupData);
                    } else {
                      addCustomPopup(newPopupData);
                    }
                  setNewPopupData({ title: '', imageUrl: '', soundUrl: '', content: '', showCloseButton: true, autoCloseTimer: false, autoCloseDuration: 10, showToGM: true, showToSmartphone: true, targetRoleIds: [], targetTeamIds: [], targetPlayerIds: [], scheduledDelay: 0 });
                    setShowPopupCreator(false);
                    setEditingPopupId(null);
                  }
                }} 
                disabled={!newPopupData.title.trim()}
                className="px-6 py-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import / Export Footer */}
      <div className="p-4 border-t border-border flex flex-col gap-2">
        <button
           onClick={handleImportClick}
          className="flex items-center justify-center gap-2 w-full py-2 bg-accent hover:bg-accent/80 rounded-md text-sm font-medium transition-colors"
        >
          <Upload size={16} /> Importer (JSON)
        </button>
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          style={{ display: 'none' }}
          title="Importer un fichier de sauvegarde JSON"
          onChange={handleImport}
        />
      </div>

      {isSettingsOpen && (
        <SettingsModal 
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      <div className="absolute -left-8 top-1/2 transform -translate-y-1/2 flex flex-col gap-2">
        <button
          onClick={toggleRightPanelExpanded}
          className="bg-card border border-border rounded-l-md p-2 shadow-md hover:bg-accent flex items-center justify-center"
          title={isRightPanelExpanded ? "Réduire le panneau" : "Agrandir le panneau (+50%)"}
        >
          {isRightPanelExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
        <button
          onClick={toggleRightPanel}
          className="bg-card border border-border rounded-l-md p-2 shadow-md hover:bg-accent"
          aria-label="Fermer le panneau latéral"
          title="Fermer le panneau latéral"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

interface TemplateCardProps {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ title, description, icon, onClick }) => {
  const icons: Record<string, React.ReactNode> = {
    circle: <div className="w-8 h-8 rounded-full border-2 border-purple-500 flex items-center justify-center"><div className="w-1 h-1 rounded-full bg-purple-500" /></div>,
    line: <div className="w-8 h-8 flex items-center justify-center gap-1"><div className="w-1 h-1 rounded-full bg-purple-500" /><div className="w-1 h-1 rounded-full bg-purple-500" /><div className="w-1 h-1 rounded-full bg-purple-500" /></div>,
    grid: <div className="w-8 h-8 grid grid-cols-2 gap-1 p-1"><div className="w-1 h-1 rounded-full bg-purple-500" /><div className="w-1 h-1 rounded-full bg-purple-500" /><div className="w-1 h-1 rounded-full bg-purple-500" /><div className="w-1 h-1 rounded-full bg-purple-500" /></div>,
    square: <div className="w-8 h-8 border-2 border-purple-500 flex items-center justify-center"><div className="w-1 h-1 rounded-full bg-purple-500" /></div>,
    arc: <div className="w-8 h-8 border-t-2 border-l-2 border-r-2 border-purple-500 rounded-t-full flex items-end justify-center pb-1"><div className="w-1 h-1 rounded-full bg-purple-500" /></div>,
    random: <div className="w-8 h-8 flex items-center justify-center gap-1"><div className="w-1 h-1 rounded-full bg-purple-500" /><div className="w-1 h-1 rounded-full bg-purple-500" /><div className="w-1 h-1 rounded-full bg-purple-500" /></div>,
  };

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-3 bg-muted/50 hover:bg-purple-500/10 border border-border hover:border-purple-500/30 rounded-lg transition-all group"
    >
      <div className="group-hover:scale-110 transition-transform">
        {icons[icon] || <LayoutGrid size={32} className="text-purple-500" />}
      </div>
      <span className="text-xs font-bold text-center">{title}</span>
      <span className="text-[10px] text-muted-foreground text-center">{description}</span>
    </button>
  );
};

