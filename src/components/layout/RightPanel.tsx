import { Settings, ChevronLeft, ChevronRight, Upload, Grid3X3, Clock, Eye, PaintBucket, ChevronDown, Image as ImageIcon, Trash2, ArrowUpRight, Music, Shuffle, RefreshCw, Zap, Database, X, History } from 'lucide-react';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useVttStore, initialState } from '../../store';
import { forceBroadcastState, initHostRealtime } from '../../lib/realtime-host';
import type { BadgeConfig, BadgeType, Role, Player } from '../../types';
import { ColorPicker } from '../ColorPicker';

export const RightPanel: React.FC = () => {
  const {
    isRightPanelOpen, toggleRightPanel,
    grid, setGrid,
    cycleMode, setCycleMode,
    displaySettings, updateDisplaySettings,
    room, setRoom,
    timer, setTimer,
    soundboard, setSoundboard,
    roles, updateRole, players, updatePlayers,
    logs, clearLogs, addLog
  } = useVttStore();

  const [activeSection, setActiveSection] = useState<string | null>('affichage');
  const [showSupabaseSettings, setShowSupabaseSettings] = useState(false);
  const urlRef = useRef<HTMLInputElement>(null);
  const keyRef = useRef<HTMLInputElement>(null);

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
  const imageInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setRoom({ backgroundImage: e.target?.result as string });
      };
      reader.readAsDataURL(file);
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
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Settings size={20} />
        <h2 className="text-xl font-bold">Outils</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 custom-scrollbar min-h-0">

        {/* Display Settings */}
        <section className="flex flex-col border border-border rounded-md bg-background">
          <button
            onClick={() => toggleSection('affichage')}
            className="flex items-center justify-between p-2 bg-muted/50 hover:bg-muted font-semibold text-sm transition-colors"
          >
            <div className={`flex items-center gap-2 ${activeSection === 'affichage' ? 'text-blue-400' : ''}`}>
              <Eye size={16} /> Affichage
            </div>
            {activeSection === 'affichage' ? <ChevronDown size={16} className="text-blue-400" /> : <ChevronRight size={16} />}
          </button>
          {activeSection === 'affichage' && (
          <div className="flex flex-col gap-2 p-3 border-t border-border">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Type de cycle</label>
              <select
                value={cycleMode}
                onChange={(e) => setCycleMode(e.target.value as 'dayNight' | 'turns' | 'none')}
                className="bg-input border border-border rounded p-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="dayNight">Jour/Nuit</option>
                <option value="turns">Par tour</option>
                <option value="none">Aucun</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={displaySettings.showCenter}
                onChange={(e) => updateDisplaySettings({ showCenter: e.target.checked })}
                className="rounded border-border"
              />
              Afficher le centre de la salle
            </label>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={displaySettings.showTagName}
                onChange={(e) => updateDisplaySettings({ showTagName: e.target.checked })}
                className="rounded border-border"
              />
              Afficher le nom des tags
            </label>

            {cycleMode !== 'none' && (
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={displaySettings.showCycleIcon}
                  onChange={(e) => updateDisplaySettings({ showCycleIcon: e.target.checked })}
                  className="rounded border-border"
                />
                Afficher l'icône {cycleMode === 'dayNight' ? 'Jour/Nuit' : 'Tours'}
              </label>
            )}
            
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={displaySettings.showOfflineStatus}
                onChange={(e) => updateDisplaySettings({ showOfflineStatus: e.target.checked })}
                className="rounded border-border"
              />
              Joueur Hors ligne
            </label>

            {/* Foreground Selection */}
            <div className="mt-2 flex flex-col gap-1.5 border-t border-border/50 pt-2">
              <label className="text-xs font-semibold text-muted-foreground">Élément au premier plan</label>
              <select
                value={displaySettings.foregroundElement}
                onChange={(e) => updateDisplaySettings({ foregroundElement: e.target.value as 'players' | 'markers' })}
                className="w-full bg-background border border-border rounded px-2 py-1 text-sm focus:ring-1 focus:ring-ring focus:border-input outline-none"
              >
                <option value="players">Joueurs</option>
                <option value="markers">Marqueurs</option>
              </select>
            </div>

            {/* Display Settings for Players */}
            <div className="mt-2 flex flex-col gap-2 border-t border-border/50 pt-2">
              <span className="text-xs font-semibold text-muted-foreground">Paramètres d'affichage des Joueurs</span>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={displaySettings.showPlayers}
                  onChange={(e) => updateDisplaySettings({ showPlayers: e.target.checked })}
                  className="rounded border-border"
                />
                Afficher les joueurs
              </label>

              {displaySettings.showPlayers && (
                <div className="flex flex-col gap-1.5 pl-5 border-l-2 border-border/30 ml-1.5 mt-1">
                  <label className="flex items-center gap-2 text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                    <input
                      type="checkbox"
                      checked={displaySettings.showPlayerImage}
                      onChange={(e) => updateDisplaySettings({ showPlayerImage: e.target.checked })}
                      className="rounded border-border w-3 h-3"
                    />
                    Afficher l'image du joueur
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                    <input
                      type="checkbox"
                      checked={displaySettings.showRoleImage}
                      onChange={(e) => updateDisplaySettings({ showRoleImage: e.target.checked })}
                      className="rounded border-border w-3 h-3"
                    />
                    Afficher l'image du rôle
                  </label>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Priorité si les deux existent :</span>
                    <select
                      value={displaySettings.imagePriority}
                      onChange={(e) => updateDisplaySettings({ imagePriority: e.target.value as 'player' | 'role' })}
                      className="bg-background border border-border rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="player">Joueur</option>
                      <option value="role">Rôle</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span>Position du nom (sans image) :</span>
                    <select
                      value={displaySettings.playerNamePosition}
                      onChange={(e) => updateDisplaySettings({ playerNamePosition: e.target.value as 'inside' | 'bottom' })}
                      className="bg-background border border-border rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="inside">À l'intérieur</option>
                      <option value="bottom">En dessous</option>
                    </select>
                  </div>

                  {/* Custom Badges Configurator */}
                  <div className="mt-3 flex flex-col gap-2 border-t border-border/30 pt-2">
                    <span className="text-[11px] font-bold text-foreground">Pastilles personnalisables</span>

                    {[
                      { key: 'topLeft', label: 'Haut Gauche' },
                      { key: 'topRight', label: 'Haut Droite (Cœur si Vie)' },
                      { key: 'bottomLeft', label: 'Bas Gauche' },
                      { key: 'bottomRight', label: 'Bas Droite' }
                    ].map(corner => {
                      const badgeKey = corner.key as keyof typeof displaySettings.playerBadges;
                      const badge = displaySettings.playerBadges?.[badgeKey] || { type: 'none', bgColor: '#000', textColor: '#fff' };

                      const updateBadge = (updates: Partial<BadgeConfig>) => {
                        updateDisplaySettings({
                          playerBadges: {
                            ...displaySettings.playerBadges,
                            [badgeKey]: { ...badge, ...updates }
                          }
                        });
                      };

                      return (
                        <div key={corner.key} className="flex flex-col gap-1 bg-muted/20 p-1.5 rounded border border-border/50">
                          <span className="text-[10px] text-muted-foreground font-medium">{corner.label}</span>
                          <div className="flex items-center gap-2">
                            <select
                              value={badge.type}
                              onChange={(e) => updateBadge({ type: e.target.value as BadgeType })}
                              className="flex-1 bg-background border border-border rounded px-1 py-0.5 text-[10px] outline-none focus:ring-1 focus:ring-ring"
                            >
                              <option value="none">Rien</option>
                              <option value="team">Équipe</option>
                              <option value="lives">Vie</option>
                              <option value="votes">Votes</option>
                              <option value="points">Pts</option>
                              <option value="uses">Uses</option>
                              <option value="callOrderDay">Ordre Appel Jour</option>
                              <option value="callOrderNight">Ordre Appel Nuit</option>
                              <option value="connection">Connexion</option>
                            </select>

                            {badge.type !== 'none' && badge.type !== 'team' && badge.type !== 'connection' && (
                              <div className="flex items-center gap-1 shrink-0">
                                <ColorPicker
                                  color={badge.bgColor}
                                  onChange={(c) => updateBadge({ bgColor: c })}
                                  label="Couleur de fond"
                                  className="!w-4 !h-4"
                                />
                                <ColorPicker
                                  color={badge.textColor}
                                  onChange={(c) => updateBadge({ textColor: c })}
                                  label="Couleur du texte"
                                  className="!w-4 !h-4"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={displaySettings.showTooltip}
                  onChange={(e) => updateDisplaySettings({ showTooltip: e.target.checked })}
                  className="rounded border-border"
                />
                Afficher la bulle d'information
              </label>

              {displaySettings.showTooltip && (
                <div className="flex flex-col gap-1.5 pl-5 border-l-2 border-border/30 ml-1.5 mt-1">
                  <label className="flex items-center gap-2 text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                    <input
                      type="checkbox"
                      checked={displaySettings.showRole}
                      onChange={(e) => updateDisplaySettings({ showRole: e.target.checked })}
                      className="rounded border-border w-3 h-3"
                    />
                    Afficher le rôle
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                    <input
                      type="checkbox"
                      checked={displaySettings.showTeam}
                      onChange={(e) => updateDisplaySettings({ showTeam: e.target.checked })}
                      className="rounded border-border w-3 h-3"
                    />
                    Afficher l'équipe
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                    <input
                      type="checkbox"
                      checked={displaySettings.showTags}
                      onChange={(e) => updateDisplaySettings({ showTags: e.target.checked })}
                      className="rounded border-border w-3 h-3"
                    />
                    Afficher les Tags
                  </label>
                </div>
              )}
              <div className="mt-4 flex flex-col gap-1.5 border-t border-border/50 pt-3">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Image sur smartphone</label>
                <select
                  value={displaySettings.smartphoneImageStyle || 'circle'}
                  onChange={(e) => updateDisplaySettings({ smartphoneImageStyle: e.target.value as any })}
                  className="bg-input border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="circle">Rond (Défaut)</option>
                  <option value="square">Carré</option>
                  <option value="original">Taille réelle</option>
                  <option value="background">Toute la carte (Fond)</option>
                </select>
              </div>
            </div>
          </div>
          )}
        </section>

        {/* Distribution des rôles */}
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

        {/* Timer */}
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

        {/* Soundboard */}
        <section className="flex flex-col border border-border rounded-md bg-background">
          <button
            onClick={() => toggleSection('soundboard')}
            className="flex items-center justify-between p-2 bg-muted/50 hover:bg-muted font-semibold text-sm transition-colors"
          >
            <div className={`flex items-center gap-2 ${activeSection === 'soundboard' ? 'text-pink-400' : ''}`}>
              <Music size={16} /> Soundboard
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
                    className="w-full mt-2 bg-primary text-primary-foreground text-xs py-2 rounded font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowUpRight size={14} /> Afficher la boîte à sons
                  </button>
                </>
              )}
            </div>
          )}
        </section>

        {/* Historique / Logs */}
        <section className="flex flex-col border border-border rounded-md bg-background">
          <button
            onClick={() => toggleSection('logs')}
            className="flex items-center justify-between p-2 bg-muted/50 hover:bg-muted font-semibold text-sm transition-colors"
          >
            <div className={`flex items-center gap-2 ${activeSection === 'logs' ? 'text-teal-400' : ''}`}>
              <History size={16} /> Log / Historique
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
                  logs.map((log) => {
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
                  })
                )}
              </div>
            </div>
          )}
        </section>

        {/* Magnetic Grid */}
        <section className="flex flex-col border border-border rounded-md bg-background">
          <button
            onClick={() => toggleSection('grille')}
            className="flex items-center justify-between p-2 bg-muted/50 hover:bg-muted font-semibold text-sm transition-colors"
          >
            <div className={`flex items-center gap-2 ${activeSection === 'grille' ? 'text-green-400' : ''}`}>
              <Grid3X3 size={16} /> Grille Magnétique
            </div>
            {activeSection === 'grille' ? <ChevronDown size={16} className="text-green-400" /> : <ChevronRight size={16} />}
          </button>
          {activeSection === 'grille' && (
          <div className="flex flex-col gap-2 p-3 border-t border-border">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={grid.enabled}
                onChange={(e) => setGrid({ ...grid, enabled: e.target.checked })}
                className="rounded border-border"
              />
              Activer la grille
            </label>
            {grid.enabled && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground">Taille (px):</span>
                <input
                  type="number"
                  value={grid.sizeX}
                  onChange={(e) => setGrid({ ...grid, sizeX: Math.max(10, parseInt(e.target.value) || 50), sizeY: Math.max(10, parseInt(e.target.value) || 50) })}
                  className="w-16 bg-input border border-border rounded px-2 py-1 text-sm"
                />
              </div>
            )}
          </div>
          )}
        </section>

        {/* Background Config */}
         <section className="flex flex-col border border-border rounded-md bg-background">
          <button
            onClick={() => toggleSection('salle')}
            className="flex items-center justify-between p-2 bg-muted/50 hover:bg-muted font-semibold text-sm transition-colors"
          >
            <div className={`flex items-center gap-2 ${activeSection === 'salle' ? 'text-indigo-400' : ''}`}>
              <PaintBucket size={16} /> Salle
            </div>
            {activeSection === 'salle' ? <ChevronDown size={16} className="text-indigo-400" /> : <ChevronRight size={16} />}
          </button>
          {activeSection === 'salle' && (
          <div className="flex flex-col gap-3 p-3 border-t border-border">

            <div className="flex gap-2">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs text-muted-foreground">Largeur (px)</label>
                <input
                  type="number"
                  value={room.width}
                  onChange={(e) => setRoom({ width: Math.max(100, parseInt(e.target.value) || 2000) })}
                  className="w-full bg-input border border-border rounded px-2 py-1 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs text-muted-foreground">Hauteur (px)</label>
                <input
                  type="number"
                  value={room.height}
                  onChange={(e) => setRoom({ height: Math.max(100, parseInt(e.target.value) || 1500) })}
                  className="w-full bg-input border border-border rounded px-2 py-1 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Couleur de fond</label>
              <div className="flex gap-2 items-center">
                <ColorPicker
                  color={room.backgroundColor}
                  onChange={(c) => setRoom({ backgroundColor: c })}
                  label="Couleur de fond"
                />
                <span className="text-xs uppercase font-mono">{room.backgroundColor}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-border/50">
              <span className="text-xs font-semibold text-muted-foreground">Image de fond</span>

              {!room.backgroundImage ? (
                <div
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full h-24 border-2 border-dashed border-border rounded-md flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-colors"
                >
                  <ImageIcon size={24} className="mb-2" />
                  <span className="text-xs">Charger une image</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="relative w-full h-24 rounded-md overflow-hidden border border-border group">
                    <div
                      className="absolute inset-0 bg-contain bg-center bg-no-repeat"
                      style={{ backgroundImage: `url(${room.backgroundImage})` }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <button
                        onClick={() => setRoom({ backgroundImage: null })}
                        className="p-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                        title="Supprimer l'image"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 mt-1">
                    <label className="text-xs text-muted-foreground">Style d'affichage</label>
                    <select
                      value={room.backgroundStyle}
                      onChange={(e) => setRoom({ backgroundStyle: e.target.value as any })}
                      className="bg-input border border-border rounded-md px-2 py-1 text-sm w-full outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="mosaic">Mosaïque (Répéter)</option>
                      <option value="center">Centrer (Taille réelle)</option>
                      <option value="stretch">Étendre (Occuper tout l'espace)</option>
                    </select>
                  </div>
                </div>
              )}

              <input
                type="file"
                ref={imageInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Minimap Image URL */}
            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-border/50">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <ArrowUpRight size={12} className="text-blue-400" />
                  Image de miniature (URL)
                </span>
                <p className="text-[10px] text-muted-foreground italic">Affichée sur le smartphone. Doit être une image accessible publiquement.</p>
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="url"
                  value={room.minimapImageUrl || ''}
                  onChange={(e) => setRoom({ minimapImageUrl: e.target.value || null })}
                  placeholder="https://..."
                  className="flex-1 bg-input border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-muted-foreground/40"
                />
                {room.minimapImageUrl && (
                  <button
                    onClick={() => setRoom({ minimapImageUrl: null })}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                    title="Effacer l'URL"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              {room.minimapImageUrl && (
                <div className="w-full h-16 rounded-md overflow-hidden border border-border bg-zinc-900">
                  <img src={room.minimapImageUrl} alt="Aperçu minimap" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
            </div>

          </div>
          )}
        </section>

        <section className="border-b border-border">
          <button
            onClick={() => toggleSection('systeme')}
            className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-3">
              <Zap size={18} className="text-amber-500" />
              <span className="font-bold text-sm">Système & Connexion</span>
            </div>
            {activeSection === 'systeme' ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>

          {activeSection === 'systeme' && (
            <div className="p-4 pt-0 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => {
                    forceBroadcastState();
                    // Optional toast or feedback could go here
                  }}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <RefreshCw size={14} /> Forcer la Synchronisation
                </button>
                <p className="text-[10px] text-muted-foreground italic px-1">
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
                <p className="text-[10px] text-muted-foreground italic px-1">
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
                <p className="text-[10px] text-muted-foreground italic px-1">
                  Configurer l'URL et la clé d'API pour la synchronisation.
                </p>
              </div>
            </div>
          )}
        </section>

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

      <button
        onClick={toggleRightPanel}
        className="absolute -left-8 top-1/2 transform -translate-y-1/2 bg-card border border-r-0 border-border rounded-l-md p-2 shadow-md hover:bg-accent"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};