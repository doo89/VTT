import { Settings, ChevronLeft, ChevronRight, Upload, Clock, ChevronDown, Music, Shuffle, Database, X, History, ArrowUpRight, Trash2, Zap, RefreshCw, Download, Trophy, Heart, Book, MessageSquare, Plus, MonitorUp, Edit2, CheckSquare, Volume2, Tag, Play } from 'lucide-react';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useVttStore, initialState } from '../../store';
import { forceBroadcastState, initHostRealtime } from '../../lib/realtime-host';
import { uploadImageToStorage, deleteImageFromStorage } from '../../lib/supabase';
import type { Role, Player } from '../../types';
import { SettingsModal } from './SettingsModal';
import { ChecklistContent } from '../ChecklistContent';

export const RightPanel: React.FC = () => {
  const {
    isRightPanelOpen, toggleRightPanel,
    displaySettings,
    timer, setTimer,
    soundboard, setSoundboard,
    roles, updateRole, players, updatePlayers,
    logs, clearLogs, addLog,
    scoreboard, setScoreboard,
    wiki: storeWiki, setWiki,
    customPopups, addCustomPopup, updateCustomPopup, deleteCustomPopup, triggerCustomPopup,
    checklist,
    checklistState, setChecklistState,
    tagDistributorState, setTagDistributorState,
    actionCreatorState: _, setActionCreatorState,
    actions, deleteAction, executeAction, setPendingConditions, setPendingEffects
  } = useVttStore();

  const wiki = storeWiki || initialState.wiki;

  const [activeSection, setActiveSection] = useState<string | null>('distribution');
  const [showSupabaseSettings, setShowSupabaseSettings] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showPopupCreator, setShowPopupCreator] = useState(false);
  const [editingPopupId, setEditingPopupId] = useState<string | null>(null);
  const [newPopupData, setNewPopupData] = useState({ title: '', imageUrl: '', soundUrl: '', content: '', showCloseButton: true, autoCloseTimer: false });
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

  const toggleSection = (section: string) => {
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
      return total + (role.distributionQuantity || 1);
    }, 0);
  }, [selectedRolesForDistribution]);

  const totalPlayersInRoom = players.length;

  const canDistribute = totalRolesToDistribute >= totalPlayersInRoom && totalPlayersInRoom > 0;

  const handleDistributeRoles = () => {
    if (!canDistribute) return;

    // Create array of roles to distribute
    const rolesPool: Role[] = [];
    selectedRolesForDistribution.forEach(role => {
      const quantity = role.isUnique ? 1 : (role.distributionQuantity || 1);
      for (let i = 0; i < quantity; i++) {
        rolesPool.push(role);
      }
    });

    // Shuffle the roles pool using Fisher-Yates
    for (let i = rolesPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rolesPool[i], rolesPool[j]] = [rolesPool[j], rolesPool[i]];
    }

    // Assign to players
    const updates = players.map((player, index) => {
      const assignedRole = rolesPool[index];
      if (assignedRole) {
        return {
          id: player.id,
          updates: {
            roleId: assignedRole.id,
            teamId: assignedRole.teamId
          }
        };
      }
      return null;
    }).filter(Boolean) as { id: string; updates: Partial<Player> }[];

    if (updates.length > 0) {
      updatePlayers(updates);
      updates.forEach((update) => {
        const player = players.find(p => p.id === update.id);
        const role = roles.find(r => r.id === update.updates.roleId);
        if (player && role) {
          addLog(`Distribution : ${player.name} reçoit ${role.name}`, 'role');
        }
      });
    }
  };

  // Timer Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timer.isRunning) {
      interval = setInterval(() => {
        let newS = timer.seconds - 1;
        let newM = timer.minutes;

        if (newS < 0) {
          if (newM === 0) {
            clearInterval(interval);
            setTimer({ isRunning: false, seconds: 0 });
            if (timer.playSoundAtZero) {
              // Beep sound
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gainNode = ctx.createGain();
              osc.connect(gainNode);
              gainNode.connect(ctx.destination);
              osc.type = 'sine';
              osc.frequency.setValueAtTime(880, ctx.currentTime);
              gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
              osc.start();
              osc.stop(ctx.currentTime + 0.5);
            }
            return;
          }
          newM -= 1;
          newS = 59;
        }

        setTimer({ minutes: newM, seconds: newS });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer.isRunning, timer.minutes, timer.seconds, timer.playSoundAtZero, setTimer]);

  const handleTimerToggle = () => setTimer({ isRunning: !timer.isRunning });
  const handleTimerReset = () => {
    setTimer({ isRunning: false, minutes: 5, seconds: 0 });
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
        >
          <ChevronLeft size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-[288px] h-full bg-card border-l border-border flex flex-col relative z-40 shrink-0">
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

        {/* Distribution des rôles */}
        {displaySettings.panels?.distribution !== false && (
        <section className="flex flex-col border border-border rounded-md bg-background">
          <button
            onClick={() => toggleSection('distribution')}
            className="flex items-center justify-between p-2 bg-muted/50 hover:bg-muted font-semibold text-sm transition-colors"
          >
            <div className={`flex items-center gap-2 ${activeSection === 'distribution' ? 'text-purple-400' : ''}`}>
              <Shuffle size={16} /> Distribution Rôles
            </div>
            {activeSection === 'distribution' ? <ChevronDown size={16} className="text-purple-400" /> : <ChevronRight size={16} />}
          </button>
          {activeSection === 'distribution' && (
            <div className="flex flex-col gap-3 p-3 border-t border-border">
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
                          <span className="text-xs text-muted-foreground">Qté:</span>
                          <input
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
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
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
            </div>
          )}
        </section>
        )}

        {/* Timer */}
        {displaySettings.panels?.chrono !== false && (
        <section className="flex flex-col border border-border rounded-md bg-background">
          <button
            onClick={() => toggleSection('chrono')}
            className="flex items-center justify-between p-2 bg-muted/50 hover:bg-muted font-semibold text-sm transition-colors"
          >
            <div className={`flex items-center gap-2 ${activeSection === 'chrono' ? 'text-amber-500' : ''}`}>
              <Clock size={16} /> Chronomètre
            </div>
            {activeSection === 'chrono' ? <ChevronDown size={16} className="text-amber-500" /> : <ChevronRight size={16} />}
          </button>
          {activeSection === 'chrono' && (
            <div className="flex flex-col items-center gap-3 p-3 border-t border-border">
              {timer.isDetached ? (
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
                  <div className="flex items-center gap-1 text-3xl font-mono font-bold bg-input px-3 py-2 rounded-md border border-border">
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

                  <label className="flex items-center gap-2 text-xs text-muted-foreground w-full cursor-pointer mt-1 mb-1">
                    <input
                      type="checkbox"
                      checked={timer.playSoundAtZero}
                      onChange={(e) => setTimer({ playSoundAtZero: e.target.checked })}
                      className="rounded border-border w-3.5 h-3.5"
                    />
                    Jouer un son à la fin
                  </label>

                  <div className="flex gap-2 w-full">
                    <button
                      onClick={handleTimerToggle}
                      className={`flex-[2] py-2 rounded text-sm font-medium text-white ${timer.isRunning ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'}`}
                    >
                      {timer.isRunning ? 'Pause' : 'Démarrer'}
                    </button>
                    <button
                      onClick={handleTimerReset}
                      className="flex-1 bg-destructive text-destructive-foreground py-2 rounded text-sm hover:bg-destructive/90"
                    >
                      Reset
                    </button>
                  </div>
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
        )}

        {/* Soundboard */}
        {displaySettings.panels?.soundboard !== false && (
        <section className="flex flex-col border border-border rounded-md bg-background">
          <button
            onClick={() => toggleSection('soundboard')}
            className="flex items-center justify-between p-2 bg-muted/50 hover:bg-muted font-semibold text-sm transition-colors"
          >
            <div className={`flex items-center gap-2 ${activeSection === 'soundboard' ? 'text-pink-400' : ''}`}>
              <Music size={16} /> Soundboard ({soundboard.buttons.filter(b => b.audioUrl).length}/{soundboard.cols * soundboard.rows})
            </div>
            {activeSection === 'soundboard' ? <ChevronDown size={16} className="text-pink-400" /> : <ChevronRight size={16} />}
          </button>
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
                      <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Colonnes</label>
                      <input
                        type="number"
                        min="1" max="10"
                        value={soundboard.cols}
                        onChange={e => setSoundboard({ cols: parseInt(e.target.value) || 4 })}
                        className="bg-input border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Lignes</label>
                      <input
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
        )}

        {/* Tableau des Scores */}
        {displaySettings.panels?.scoreboard !== false && (
        <section className="flex flex-col border border-border rounded-md bg-background">
          <button
            onClick={() => toggleSection('scoreboard')}
            className="flex items-center justify-between p-2 bg-muted/50 hover:bg-muted font-semibold text-sm transition-colors"
          >
            <div className={`flex items-center gap-2 ${activeSection === 'scoreboard' ? 'text-yellow-400' : ''}`}>
              <Trophy size={16} /> Tableau des Scores
            </div>
            {activeSection === 'scoreboard' ? <ChevronDown size={16} className="text-yellow-400" /> : <ChevronRight size={16} />}
          </button>
          {activeSection === 'scoreboard' && (
            <div className="flex flex-col p-3 border-t border-border gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Mode détaché</span>
                <button
                  onClick={() => setScoreboard({ isDetached: !scoreboard.isDetached })}
                  className={`w-10 h-5 rounded-full transition-colors relative ${scoreboard.isDetached ? 'bg-primary' : 'bg-muted'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${scoreboard.isDetached ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <button
                onClick={() => setScoreboard({ isOpen: !scoreboard.isOpen })}
                className="w-full bg-primary text-primary-foreground text-xs py-2 rounded font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Trophy size={14} /> {scoreboard.isOpen ? 'Masquer le tableau' : 'Afficher le tableau'}
              </button>

              {scoreboard.isOpen && !scoreboard.isDetached && (
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
                      {[...players].sort((a, b) => (b.points || 0) - (a.points || 0)).map((player) => {
                        const role = roles.find(r => r.id === player.roleId);
                        return (
                          <tr key={player.id} className={`${player.isDead ? 'opacity-50' : ''}`}>
                            <td className="p-1.5">
                              <div className="font-bold truncate max-w-[80px]">{player.name}</div>
                              {scoreboard.showRoles && <div className="text-[8px] text-muted-foreground uppercase truncate max-w-[80px]">{role?.name || 'Sans Rôle'}</div>}
                            </td>
                            {scoreboard.showPoints && <td className="p-1.5 text-center font-bold text-blue-400">{player.points || 0}</td>}
                            {scoreboard.showLives && (
                              <td className="p-1.5 text-center">
                                 <div className="flex items-center justify-center gap-0.5 text-red-500">
                                   <Heart size={8} fill={player.lives && player.lives > 0 ? "currentColor" : "none"} />
                                   <span>{player.lives ?? 0}</span>
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
        )}

        {/* Historique / Logs */}
        {displaySettings.panels?.logs !== false && (
        <section className="flex flex-col border border-border rounded-md bg-background">
          <button
            onClick={() => toggleSection('logs')}
            className="flex items-center justify-between p-2 bg-muted/50 hover:bg-muted font-semibold text-sm transition-colors"
          >
            <div className={`flex items-center gap-2 ${activeSection === 'logs' ? 'text-teal-400' : ''}`}>
              <History size={16} /> Log / Historique ({logs.length})
            </div>
            {activeSection === 'logs' ? <ChevronDown size={16} className="text-teal-400" /> : <ChevronRight size={16} />}
          </button>
          {activeSection === 'logs' && (
            <div className="flex flex-col p-0 border-t border-border">
              <div className="flex justify-between items-center p-2 border-b border-border bg-muted/20">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{logs.length} Événements</span>
                <button
                  onClick={clearLogs}
                  className="text-xs flex items-center gap-1 text-destructive hover:text-white hover:bg-destructive px-2 py-1 rounded transition-colors"
                  title="Effacer l'historique"
                >
                  <Trash2 size={12} /> Vider
                </button>
              </div>
              <div className="flex flex-col max-h-[300px] overflow-y-auto custom-scrollbar p-2 gap-2">
                {logs.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-4">Aucune action enregistrée pour le moment.</p>
                ) : (
                  <>
                  {logs.map((log) => {
                    let dotColor = "bg-primary";
                    if (log.type === 'death') dotColor = "bg-destructive";
                    else if (log.type === 'action') dotColor = "bg-amber-500";
                    else if (log.type === 'system') dotColor = "bg-blue-500";
                    else if (log.type === 'note') dotColor = "bg-purple-500";
                    else if (log.type === 'role') dotColor = "bg-emerald-500";

                    return (
                      <div key={log.id} className="flex gap-2 items-start text-sm">
                        <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                        <div className="flex flex-col min-w-0">
                          <span className="text-foreground leading-snug">{log.message}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-2 border-t border-border mt-1">
                    <button
                      onClick={initialState.downloadLogs}
                      className="w-full flex items-center justify-center gap-2 py-1.5 px-2 bg-accent hover:bg-accent/80 text-xs font-medium rounded transition-colors"
                    >
                      <Download size={14} /> Enregistrer JSON
                    </button>
                  </div>
                  </>
                )}
              </div>
            </div>
          )}
        </section>
        )}

        {/* Wiki */}
        {displaySettings.panels?.wiki !== false && (
        <section className="flex flex-col border border-border rounded-md bg-background">
          <button
            onClick={() => toggleSection('wiki')}
            className="flex items-center justify-between p-2 bg-muted/50 hover:bg-muted font-semibold text-sm transition-colors"
          >
            <div className={`flex items-center gap-2 ${activeSection === 'wiki' ? 'text-blue-400' : ''}`}>
              <Book size={16} /> Wiki
            </div>
            {activeSection === 'wiki' ? <ChevronDown size={16} className="text-blue-400" /> : <ChevronRight size={16} />}
          </button>
          {activeSection === 'wiki' && (
            <div className="flex flex-col p-3 border-t border-border gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Mode détaché</span>
                <button
                  onClick={() => setWiki({ isDetached: !wiki.isDetached })}
                  className={`w-10 h-5 rounded-full transition-colors relative ${wiki.isDetached ? 'bg-primary' : 'bg-muted'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${wiki.isDetached ? 'left-6' : 'left-1'}`} />
                </button>
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
        )}

        {/* Système & Connexion */}
        {displaySettings.panels?.system !== false && (
        <section className="flex flex-col border border-border rounded-md bg-background">
          <button
            onClick={() => toggleSection('systeme')}
            className="flex items-center justify-between p-2 bg-muted/50 hover:bg-muted font-semibold text-sm transition-colors"
          >
            <div className={`flex items-center gap-2 ${activeSection === 'systeme' ? 'text-amber-500' : ''}`}>
              <Zap size={16} /> Système & Connexion
            </div>
            {activeSection === 'systeme' ? <ChevronDown size={16} className="text-amber-500" /> : <ChevronRight size={16} />}
          </button>
          {activeSection === 'systeme' && (
            <div className="p-4 pt-3 flex flex-col gap-3 border-t border-border">
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => forceBroadcastState()}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <RefreshCw size={14} /> Forcer la Synchronisation
                </button>
                <p className="text-[10px] text-muted-foreground italic px-1 leading-tight">
                  Envoie immédiatement l'état actuel à tous les joueurs connectés.
                </p>
              </div>

              <div className="flex flex-col gap-1.5 mt-2">
                <button
                  onClick={() => {
                    const code = useVttStore.getState().roomCode;
                    if (code) initHostRealtime(code);
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
            </div>
          )}
        </section>
        )}

        {/* Créateur de Popup */}
        {(displaySettings.panels?.popupCreator ?? true) && (
          <section className="flex flex-col border border-border rounded-md bg-background">
            <button
              onClick={() => toggleSection('popups')}
              className="flex items-center justify-between p-2 bg-muted/50 hover:bg-muted font-semibold text-sm transition-colors"
            >
              <div className={`flex items-center gap-2 ${activeSection === 'popups' ? 'text-indigo-400' : ''}`}>
                <MessageSquare size={16} /> Créateur de Popup ({customPopups.length})
              </div>
              {activeSection === 'popups' ? <ChevronDown size={16} className="text-indigo-400" /> : <ChevronRight size={16} />}
            </button>
            {activeSection === 'popups' && (
              <div className="p-3 flex flex-col gap-3 border-t border-border">
                 <button
                    onClick={() => {
                      setEditingPopupId(null);
                      setNewPopupData({ title: '', imageUrl: '', soundUrl: '', content: '', showCloseButton: true, autoCloseTimer: false });
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
                                autoCloseTimer: popup.autoCloseTimer
                              });
                              setShowPopupCreator(true);
                            }} className="text-muted-foreground hover:text-primary transition-colors p-1" title="Modifier">
                              <Edit2 size={12} />
                            </button>
                            <button onClick={async () => {
                              if (popup.imageUrl) await deleteImageFromStorage(popup.imageUrl);
                              deleteCustomPopup(popup.id);
                            }} className="text-destructive hover:text-white hover:bg-destructive p-1 rounded transition-colors" title="Supprimer">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => triggerCustomPopup(popup.id)}
                          className="w-full mt-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded text-[10px] uppercase font-bold py-1.5 transition-colors border border-indigo-500/30 flex justify-center items-center gap-1.5"
                        >
                           <MonitorUp size={12} /> Afficher à tous
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
        )}
        {/* Créateur d'Actions */}
        {(displaySettings.panels?.actionCreator ?? true) && (
          <section className="flex flex-col border border-border rounded-md bg-background">
            <button
              onClick={() => toggleSection('actions')}
              className="flex items-center justify-between p-2 bg-muted/50 hover:bg-muted font-semibold text-sm transition-colors"
            >
              <div className={`flex items-center gap-2 ${activeSection === 'actions' ? 'text-orange-400' : ''}`}>
                <Zap size={16} /> Créateur d'Actions ({actions.length})
              </div>
              {activeSection === 'actions' ? <ChevronDown size={16} className="text-orange-400" /> : <ChevronRight size={16} />}
            </button>
            {activeSection === 'actions' && (
              <div className="p-3 flex flex-col gap-3 border-t border-border">
                 <button
                    onClick={() => setActionCreatorState({ isOpen: true, isDetached: true })}
                    className="w-full bg-primary text-primary-foreground text-xs py-2 rounded font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Plus size={14} /> Ajouter Action
                  </button>
  
                  <div className="flex flex-col gap-2 mt-2">
                    {actions.map(action => (
                      <div key={action.id} className="flex flex-col gap-2 w-full bg-muted/20 border border-border/50 rounded-md p-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold truncate pr-2">{action.name}</span>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => {
                                setPendingConditions(action.conditions || []);
                                setPendingEffects(action.effects || []);
                                setActionCreatorState({ isOpen: true, isDetached: true, editingActionId: action.id });
                              }}
                              className="text-muted-foreground hover:text-primary p-1 rounded transition-colors" title="Modifier"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button onClick={() => deleteAction(action.id)} className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors" title="Supprimer">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => executeAction(action.id)}
                          className="w-full bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded text-[10px] uppercase font-bold py-1.5 transition-colors border border-green-500/30 flex justify-center items-center gap-1.5"
                        >
                          <Play size={12} /> Lancer l'action
                        </button>
                      </div>
                    ))}
                    {actions.length === 0 && (
                      <p className="text-xs text-muted-foreground italic text-center py-2">Aucune action créée.</p>
                    )}
                  </div>
              </div>
            )}
          </section>
        )}
        {/* Checklist pour le MJ */}
        {(displaySettings.panels?.checklist ?? true) && (
          <section className="flex flex-col border border-border rounded-md bg-background">
            <div className="flex items-center justify-between p-2 bg-muted/50 hover:bg-muted font-semibold text-sm transition-colors group">
              <button 
                onClick={() => toggleSection('checklist')}
                className="flex items-center gap-2 flex-1 text-left"
              >
                <div className={`flex items-center gap-2 ${activeSection === 'checklist' ? 'text-green-500' : ''}`}>
                  <CheckSquare size={16} /> Checklist pour le MJ ({checklist?.length || 0})
                </div>
              </button>
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
                <button onClick={() => toggleSection('checklist')}>
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
        )}
        {/* Distributeur de Tag */}
        {(displaySettings.panels?.tagDistributor ?? true) && (
          <section className="flex flex-col border border-border rounded-md bg-background overflow-hidden p-2">
            <div className="flex items-center justify-between font-semibold text-sm transition-colors group">
              <div className="flex items-center gap-2 flex-1 text-left">
                <Tag size={16} /> Distributeur de Tags
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTagDistributorState({ isDetached: true, isOpen: true });
                  }}
                  disabled={tagDistributorState.isDetached}
                  className={`p-1 transition-colors flex items-center justify-center ${tagDistributorState.isDetached ? 'opacity-30 cursor-not-allowed' : 'text-primary hover:bg-primary/20 bg-primary/10 rounded-md'}`}
                  title="Détacher le distributeur"
                >
                  <ArrowUpRight size={14} />
                </button>
              </div>
            </div>
            {tagDistributorState.isDetached && (
              <p className="text-[10px] text-muted-foreground mt-1 px-1">Géré dans une fenêtre flottante.</p>
            )}
            {!tagDistributorState.isDetached && (
              <p className="text-[10px] text-muted-foreground mt-1 px-1">Cliquez sur l'icône pour détacher la liste de distribution rapide.</p>
            )}
          </section>
        )}

      </div>

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
                            await deleteImageFromStorage(newPopupData.imageUrl);
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
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = await uploadImageToStorage(file);
                      if (url) {
                        setNewPopupData({...newPopupData, imageUrl: url});
                      }
                    }
                  }} 
                />
              </div>


              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Volume2 size={16} className="text-blue-500" />
                  <span>Son au déclenchement (Optionnel)</span>
                </label>
                <div className="flex gap-2">
                  <input
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
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = await uploadImageToStorage(file);
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
                  Fermeture automatique (10s)
                </label>
              </div>
            </div>

            <div className="p-4 bg-muted/50 border-t border-border flex justify-between items-center shrink-0">
              <button 
                onClick={() => {
                  setNewPopupData({ title: '', imageUrl: '', soundUrl: '', content: '', showCloseButton: true, autoCloseTimer: false });
                  setShowPopupCreator(false);
                  setEditingPopupId(null);
                }} 
                className="px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded font-medium transition-colors border border-destructive/20"
              >
                Annuler
              </button>
              <button 
                onClick={() => {
                  if (newPopupData.title.trim()) {
                    if (editingPopupId) {
                      updateCustomPopup(editingPopupId, newPopupData);
                    } else {
                      addCustomPopup(newPopupData);
                    }
                    setNewPopupData({ title: '', imageUrl: '', soundUrl: '', content: '', showCloseButton: true, autoCloseTimer: false });
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
          onChange={handleImport}
        />
      </div>

      {isSettingsOpen && (
        <SettingsModal 
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      <button
        onClick={toggleRightPanel}
        className="absolute -left-8 top-1/2 transform -translate-y-1/2 bg-card border border-r-0 border-border rounded-l-md p-2 shadow-md hover:bg-accent"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};