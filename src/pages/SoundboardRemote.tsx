import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as icons from 'lucide-react';
import { Music, AlertCircle, LogOut, CheckSquare, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export const SoundboardRemote: React.FC = () => {
  const { roomId, passcode } = useParams<{ roomId: string, passcode: string }>();
  const navigate = useNavigate();
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error' | 'unauthorized'>('connecting');
  const [gameState, setGameState] = useState<any>(null);
  const [playingIndices, setPlayingIndices] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'soundboard' | 'checklist' | 'handouts' | 'actions' | 'players'>('soundboard');

  // Handle tab visibility changes from host
  useEffect(() => {
    if (!gameState?.soundboard) return;
    const { remoteShowSounds, remoteShowTasks, remoteShowHandouts, remoteShowActions, remoteShowPlayers } = gameState.soundboard;
    
    // If current tab becomes hidden, switch to the first available one
    if (activeTab === 'soundboard' && remoteShowSounds === false) {
      if (remoteShowTasks !== false) setActiveTab('checklist');
      else if (remoteShowHandouts !== false) setActiveTab('handouts');
      else if (remoteShowActions !== false) setActiveTab('actions');
      else if (remoteShowPlayers !== false) setActiveTab('players');
    } else if (activeTab === 'checklist' && remoteShowTasks === false) {
      if (remoteShowSounds !== false) setActiveTab('soundboard');
      else if (remoteShowHandouts !== false) setActiveTab('handouts');
      else if (remoteShowActions !== false) setActiveTab('actions');
      else if (remoteShowPlayers !== false) setActiveTab('players');
    } else if (activeTab === 'handouts' && remoteShowHandouts === false) {
      if (remoteShowSounds !== false) setActiveTab('soundboard');
      else if (remoteShowTasks !== false) setActiveTab('checklist');
      else if (remoteShowActions !== false) setActiveTab('actions');
      else if (remoteShowPlayers !== false) setActiveTab('players');
    } else if (activeTab === 'actions' && remoteShowActions === false) {
      if (remoteShowSounds !== false) setActiveTab('soundboard');
      else if (remoteShowTasks !== false) setActiveTab('checklist');
      else if (remoteShowHandouts !== false) setActiveTab('handouts');
      else if (remoteShowPlayers !== false) setActiveTab('players');
    } else if (activeTab === 'players' && remoteShowPlayers === false) {
      if (remoteShowSounds !== false) setActiveTab('soundboard');
      else if (remoteShowTasks !== false) setActiveTab('checklist');
      else if (remoteShowHandouts !== false) setActiveTab('handouts');
      else if (remoteShowActions !== false) setActiveTab('actions');
    }
  }, [gameState, activeTab]);

  useEffect(() => {
    if (!roomId || !supabase) return;

    const newChannel = supabase.channel(`room:${roomId}`, {
      config: { broadcast: { self: false, ack: false } }
    });

    newChannel
      .on('broadcast', { event: 'sync_state' }, ({ payload }) => {
        if (!payload.soundboard) return;
        if (!payload.soundboard.remoteEnabled) {
          setConnectionStatus('unauthorized');
          return;
        }
        setGameState(payload);
        if (connectionStatus !== 'connected') {
          setConnectionStatus('connected');
        }
      })
      .on('broadcast', { event: 'soundboard_playback' }, ({ payload }) => {
        if (payload?.playingIndices) {
          setPlayingIndices(payload.playingIndices);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Ask for state init from host
          newChannel.send({ type: 'broadcast', event: 'get_state' });
          
          // Fallback if no state received within 5s
          setTimeout(() => {
            setConnectionStatus(prev => prev === 'connecting' ? 'error' : prev);
          }, 5000);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          if (connectionStatus !== 'unauthorized') {
            setConnectionStatus('error');
          }
        }
      });

    setChannel(newChannel);

    return () => {
      if (supabase) {
        supabase.removeChannel(newChannel);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const handlePlaySound = (index: number) => {
    if (!channel || !passcode || !gameState?.soundboard) return;
    
    // Add optimism
    if (!playingIndices.includes(index)) {
      setPlayingIndices(prev => [...prev, index]);
    }
    
    console.log(`[Remote] Sending soundboard_action for index ${index} with passcode "${passcode}"`);
    
    channel.send({
      type: 'broadcast',
      event: 'soundboard_action',
      payload: { index, passcode }
    }).catch(console.error);
  };

  const handleToggleChecklist = (itemId: string) => {
    if (!channel || !passcode) return;
    
    // Add optimism
    setGameState((prev: any) => {
      if (!prev || !prev.checklist) return prev;
      return {
        ...prev,
        checklist: prev.checklist.map((item: any) => 
          item.id === itemId ? { ...item, checked: !item.checked } : item
        )
      };
    });

    channel.send({
      type: 'broadcast',
      event: 'checklist_action',
      payload: { type: 'toggle', itemId, passcode }
    }).catch(console.error);
  };

  const handleToggleCollapse = (itemId: string) => {
    if (!channel || !passcode) return;
    
    // Optimism
    setGameState((prev: any) => {
      if (!prev || !prev.checklist) return prev;
      return {
        ...prev,
        checklist: prev.checklist.map((item: any) => 
          item.id === itemId ? { ...item, collapsed: !item.collapsed } : item
        )
      };
    });

    channel.send({
      type: 'broadcast',
      event: 'checklist_action',
      payload: { type: 'toggle_collapse', itemId, passcode }
    }).catch(console.error);
  };

  const handleTriggerAction = (actionId: string) => {
    if (!channel || !passcode) return;
    
    channel.send({
      type: 'broadcast',
      event: 'action_trigger',
      payload: { actionId, passcode }
    }).catch(console.error);
  };
  
  const handleUpdatePrivateNotes = (playerId: string, notes: string) => {
    if (!channel || !passcode) return;
    
    // Optimism
    setGameState((prev: any) => {
      if (!prev || !prev.players) return prev;
      return {
        ...prev,
        players: prev.players.map((p: any) => 
          p.id === playerId ? { ...p, privateNotes: notes } : p
        )
      };
    });

    channel.send({
      type: 'broadcast',
      event: 'remote_player_update',
      payload: { type: 'notes', playerId, notes, passcode }
    }).catch(console.error);
  };

  const handleDisconnect = () => {
    navigate('/remote');
  };

  if (connectionStatus === 'connecting') {
    return (
      <div className="h-screen w-screen bg-zinc-950 text-zinc-50 flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mb-4"></div>
        <p className="text-zinc-400 font-medium">Connexion à la salle {roomId}...</p>
      </div>
    );
  }

  if (connectionStatus === 'unauthorized') {
    return (
      <div className="h-screen w-screen bg-zinc-950 text-zinc-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 bg-red-600/20 text-red-500 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold mb-2 tracking-tight">Accès Refusé</h2>
        <p className="text-zinc-400 text-center max-w-sm mb-6 text-sm leading-relaxed">
          Le MJ n'a pas autorisé les connexions distantes pour la Soundboard. Demandez-lui de cocher la case d'autorisation dans ses paramètres.
        </p>
        <button onClick={handleDisconnect} className="bg-zinc-800 hover:bg-zinc-700 px-8 py-2.5 rounded-xl font-semibold transition-all active:scale-95 shadow-lg border border-zinc-700">
          Retour
        </button>
      </div>
    );
  }

  if (connectionStatus === 'error' || !gameState) {
    return (
      <div className="h-screen w-screen bg-zinc-950 text-zinc-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 bg-red-600/20 text-red-500 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold mb-2 tracking-tight">Erreur de connexion</h2>
        <p className="text-zinc-400 text-center max-w-sm mb-6 text-sm leading-relaxed">
          Impossible de se connecter à la salle {roomId}. Vérifiez que le MJ est bien en ligne et que le code est correct.
        </p>
        <button onClick={handleDisconnect} className="bg-zinc-800 hover:bg-zinc-700 px-8 py-2.5 rounded-xl font-semibold transition-all active:scale-95 shadow-lg border border-zinc-700">
          Retour
        </button>
      </div>
    );
  }

  const soundboardData = gameState?.soundboard || {};
  const { cols = 4, rows = 3, buttons = [], remoteShowSounds = true, remoteShowTasks = true, remoteShowHandouts = true, remoteShowActions = true, remoteShowPlayers = false, remoteShowDeadPlayers = false, remoteAllowPrivateNotes = false } = soundboardData;
  const checklist = gameState.checklist || [];
  const actions = gameState.actions || [];
  const players = gameState.players || [];
  const roles = gameState.roles || [];
  const teams = gameState.teams || [];
  const totalButtons = cols * rows;
  const visibleTabsCount = [remoteShowSounds, remoteShowTasks, remoteShowHandouts, remoteShowActions, remoteShowPlayers].filter(v => v !== false).length;

  return (
    <div className="h-screen w-screen bg-zinc-950 text-zinc-50 flex flex-col max-w-md mx-auto shadow-2xl relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-pink-500/10 to-transparent pointer-events-none z-0" />

      <header className="flex items-center justify-between p-4 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-pink-600 p-2 rounded-xl text-white shadow-lg shadow-pink-900/40">
            {activeTab === 'soundboard' ? <Music size={20} /> : activeTab === 'checklist' ? <CheckSquare size={20} /> : activeTab === 'actions' ? <icons.Zap size={20} /> : activeTab === 'players' ? <icons.Users size={20} /> : <icons.FileText size={20} />}
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight leading-none">Télécommande MJ</h1>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Salle: {roomId}</p>
          </div>
        </div>
        <button
          onClick={handleDisconnect}
          className="p-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all active:scale-90"
          title="Déconnexion"
        >
          <LogOut size={22} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-black/40 backdrop-blur-sm z-10 touch-pan-y">
        {activeTab === 'soundboard' ? (
          <div
            className="grid gap-3 w-full h-fit"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gridAutoRows: '1fr',
              aspectRatio: `${cols} / ${rows}`
            }}
          >
            {Array.from({ length: totalButtons }).map((_, i) => {
              const btn = buttons.find((b: any) => b.index === i);
              const hasSound = !!btn && btn.hasAudio;
              const isPlaying = playingIndices.includes(i);
              
              const IconComponent = btn?.icon && icons[btn.icon as keyof typeof icons] 
                ? icons[btn.icon as keyof typeof icons] as React.ElementType
                : Music;

              return (
                <button
                  key={i}
                  onClick={() => hasSound ? handlePlaySound(i) : undefined}
                  disabled={!hasSound}
                  className={`relative rounded-2xl border flex flex-col items-center justify-center p-2 text-center transition-all overflow-hidden ${
                    hasSound
                      ? 'bg-zinc-900/80 border-zinc-700/50 hover:bg-zinc-800 active:scale-95 shadow-xl'
                      : 'bg-zinc-950/30 border-dashed border-zinc-800/50 opacity-20 cursor-not-allowed'
                  }`}
                  style={{
                    boxShadow: isPlaying && btn?.color ? `0 0 20px ${btn.color}40, inset 0 0 10px ${btn.color}20` : undefined,
                    borderColor: isPlaying && btn?.color ? btn.color : (hasSound ? `${btn?.color}40` : undefined),
                    backgroundImage: btn?.imageUrl ? `url(${btn.imageUrl})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {btn?.imageUrl && <div className="absolute inset-0 bg-black/60 z-0" />}

                  {hasSound && (
                    <div className="relative z-10 flex flex-col items-center justify-center w-full h-full text-zinc-100">
                      <IconComponent size={26} className="mb-2 drop-shadow-md" style={{ color: btn.color || 'currentColor' }} />
                      <span 
                        className="text-[11px] font-bold leading-tight break-words w-full px-1 drop-shadow-sm"
                        style={{ color: btn.imageUrl ? '#fff' : (btn.color || 'inherit') }}
                      >
                        {btn.name || `Son ${i+1}`}
                      </span>
                      {!btn.isOneShot && isPlaying && (
                         <div className="absolute top-0 right-0 p-1">
                            <span className="flex h-3 w-3 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: btn.color || '#fff' }}></span>
                              <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: btn.color || '#fff' }}></span>
                            </span>
                         </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : activeTab === 'checklist' ? (
          <div className="flex flex-col gap-3 pb-8">
            <div className="flex items-center justify-between mb-2">
               <h2 className="text-xl font-black uppercase tracking-widest text-zinc-400">Checklist</h2>
               {(() => {
                 const visibleChecklist = [];
                 let currentSectionVisible = true;
                 let currentSectionCollapsed = false;
                 for (const item of checklist) {
                   if (item.type === 'text') {
                     currentSectionVisible = item.showOnSmartphone !== false;
                     currentSectionCollapsed = item.collapsed || false;
                   }
                   if (currentSectionVisible && item.showOnSmartphone !== false) {
                     if (item.type === 'checkbox' && currentSectionCollapsed) continue;
                     visibleChecklist.push(item);
                   }
                 }
                 return (
                   <span className="bg-zinc-800 text-zinc-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-zinc-700">
                     {visibleChecklist.filter((i: any) => i.type === 'checkbox' && i.checked).length} / {visibleChecklist.filter((i: any) => i.type === 'checkbox').length}
                   </span>
                 );
               })()}
            </div>
            {(() => {
              const visibleChecklist = [];
              let currentSectionVisible = true;
              let currentSectionCollapsed = false;
              for (const item of checklist) {
                if (item.type === 'text') {
                  currentSectionVisible = item.showOnSmartphone !== false;
                  currentSectionCollapsed = item.collapsed || false;
                }
                if (currentSectionVisible && item.showOnSmartphone !== false) {
                  if (item.type === 'checkbox' && currentSectionCollapsed) continue;
                  visibleChecklist.push(item);
                }
              }
              
              if (visibleChecklist.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-20 text-zinc-500 opacity-50">
                    <CheckSquare size={48} className="mb-4 stroke-[1px]" />
                    <p className="text-sm font-medium">Aucune tâche visible</p>
                  </div>
                );
              }
              
              return visibleChecklist.map((item: any) => {
                if (item.type === 'image') {
                  return item.imageUrl ? (
                    <div key={item.id} className="w-full bg-zinc-900/50 rounded-2xl overflow-hidden border border-zinc-800">
                      <img src={item.imageUrl} alt="Checklist" className="w-full h-auto max-h-60 object-contain" />
                    </div>
                  ) : null;
                }

                if (item.type === 'text') {
                  return (
                    <div 
                      key={item.id} 
                      onClick={() => handleToggleCollapse(item.id)}
                      className="bg-zinc-900/80 border border-zinc-700 p-4 rounded-2xl text-sm leading-relaxed shadow-lg shadow-black/20 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all" 
                      style={{ color: item.color || '#e4e4e7' }}
                    >
                      <span className="font-black uppercase tracking-widest">{item.content}</span>
                      <div className="text-zinc-500">
                        {item.collapsed ? <icons.ChevronRight size={16} /> : <icons.ChevronDown size={16} />}
                      </div>
                    </div>
                  );
                }

                // Checkbox type
                return (
                  <button
                    key={item.id}
                    onClick={() => handleToggleChecklist(item.id)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all active:scale-[0.98] text-left group ${
                      item.checked 
                        ? 'bg-zinc-900/30 border-zinc-800 opacity-60' 
                        : 'bg-zinc-900/80 border-zinc-700 shadow-lg shadow-black/20 hover:border-blue-500/30'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                      item.checked 
                        ? 'bg-blue-500/10 border-blue-500 text-blue-500' 
                        : 'border-zinc-700 bg-zinc-950'
                    }`}>
                      {item.checked && <Check size={18} strokeWidth={3} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm leading-snug transition-all ${
                        item.checked ? 'line-through opacity-50' : ''
                      }`} style={{ color: item.color || '#e4e4e7' }}>
                        {item.content}
                      </p>
                    </div>
                  </button>
                );
              })
            })()}
          </div>
        ) : activeTab === 'actions' ? (
          <div className="flex flex-col gap-4 pb-8">
            <h2 className="text-xl font-black uppercase tracking-widest text-zinc-400 mb-2">Actions</h2>
            <div className="grid grid-cols-1 gap-3">
              {actions.map((action: any) => (
                <button
                  key={action.id}
                  onClick={() => handleTriggerAction(action.id)}
                  disabled={action.enabled === false}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all active:scale-[0.98] text-left ${
                    action.enabled === false
                      ? 'bg-zinc-900/30 border-zinc-800 opacity-50 cursor-not-allowed'
                      : 'bg-zinc-900/80 border-zinc-700 shadow-lg shadow-black/20 hover:border-purple-500/30'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    action.enabled === false ? 'bg-zinc-800 text-zinc-600' : 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                  }`}>
                    <icons.Zap size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm leading-tight text-zinc-100">{action.name}</p>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">
                      {action.enabled === false ? 'Désactivée' : 'Prête à jouer'}
                    </p>
                  </div>
                  {action.enabled !== false && (
                    <icons.ChevronRight size={16} className="text-zinc-600" />
                  )}
                </button>
              ))}
              {actions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500 opacity-50">
                  <icons.Zap size={48} className="mb-4 stroke-[1px]" />
                  <p className="text-sm font-medium">Aucune action disponible</p>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'players' ? (
          <div className="flex flex-col gap-4 pb-8">
            <h2 className="text-xl font-black uppercase tracking-widest text-zinc-400 mb-2">Joueurs</h2>
            <div className="flex flex-col gap-3">
              {players
                .filter((p: any) => remoteShowDeadPlayers || !p.isDead)
                .map((player: any) => {
                  const role = roles.find((r: any) => r.id === player.roleId);
                  const team = teams.find((t: any) => t.id === player.teamId);
                  
                  return (
                    <div
                      key={player.id}
                      className={`flex items-center gap-4 p-3 rounded-2xl border bg-zinc-900/80 border-zinc-700 shadow-lg shadow-black/20 ${
                        player.isDead ? 'opacity-50 grayscale' : ''
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div 
                          className="w-12 h-12 rounded-xl border-2 flex items-center justify-center overflow-hidden bg-zinc-950"
                          style={{ borderColor: player.color || '#3b82f6' }}
                        >
                          {player.imageUrl ? (
                            <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover" />
                          ) : (
                            <icons.User size={24} style={{ color: player.color || '#3b82f6' }} />
                          )}
                        </div>
                        {player.isDead && (
                          <div className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-1 shadow-lg">
                            <icons.Skull size={10} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                           <p className="font-bold text-sm text-zinc-100 truncate">{player.name}</p>
                           {player.isDead && <span className="text-[8px] font-black uppercase text-red-500 tracking-tighter">Mort</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest truncate">
                            {role?.name || 'Sans Rôle'}
                          </span>
                          {team && (
                            <>
                              <span className="text-zinc-700">•</span>
                              <span className="text-[10px] font-bold uppercase tracking-widest truncate" style={{ color: team.color || 'inherit' }}>
                                {team.name}
                              </span>
                            </>
                          )}
                        </div>
                        {remoteAllowPrivateNotes && (
                          <textarea
                            value={player.privateNotes || ''}
                            onChange={(e) => handleUpdatePrivateNotes(player.id, e.target.value)}
                            placeholder="Notes privées (MJ uniquement)..."
                            className="w-full mt-2 bg-black/40 border border-zinc-700/50 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-pink-500/50 transition-colors resize-none h-16"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              {players.filter((p: any) => remoteShowDeadPlayers || !p.isDead).length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500 opacity-50">
                  <icons.Users size={48} className="mb-4 stroke-[1px]" />
                  <p className="text-sm font-medium">Aucun joueur visible</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 pb-8">
            <h2 className="text-xl font-black uppercase tracking-widest text-zinc-400 mb-2">Aides de Jeu</h2>
            <div className="grid grid-cols-1 gap-4">
              {gameState.handouts?.map((handout: any) => (
                <div key={handout.id} className="bg-zinc-900/80 border border-zinc-700 rounded-2xl overflow-hidden shadow-lg shadow-black/20">
                  <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
                    <span className="font-bold text-sm truncate pr-2">{handout.name}</span>
                    <span className="text-[10px] text-zinc-500 font-black uppercase tracking-tighter shrink-0">{handout.type || 'image'}</span>
                  </div>
                  <div className="aspect-video bg-black/20 flex items-center justify-center relative">
                    {handout.type === 'pdf' ? (
                      <div className="flex flex-col items-center justify-center w-full h-full bg-zinc-950/30 group">
                        <div className="relative mb-3 transition-transform group-active:scale-95">
                          <icons.File size={64} className="text-zinc-700 stroke-[1.5px]" />
                          <div className="absolute inset-0 flex items-center justify-center pt-2">
                             <span className="text-[10px] font-black text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 uppercase tracking-tighter">PDF</span>
                          </div>
                        </div>
                        <a 
                          href={handout.imageUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-zinc-800 hover:bg-zinc-700 px-6 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 border border-zinc-700 shadow-lg shadow-black/40"
                        >
                          Voir le document
                        </a>
                      </div>
                    ) : (
                      <img src={handout.imageUrl} alt={handout.name} className="w-full h-full object-contain" />
                    )}
                  </div>
                </div>
              ))}
              {(!gameState.handouts || gameState.handouts.length === 0) && (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500 opacity-50">
                  <icons.FileText size={48} className="mb-4 stroke-[1px]" />
                  <p className="text-sm font-medium">Aucune aide de jeu</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      {visibleTabsCount > 1 && (
      <nav 
        className="grid bg-zinc-900/90 backdrop-blur-lg border-t border-zinc-800 p-2 gap-2 z-20 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]"
        style={{ gridTemplateColumns: `repeat(${visibleTabsCount}, minmax(0, 1fr))` }}
      >
        {remoteShowSounds !== false && (
          <button
            onClick={() => setActiveTab('soundboard')}
            className={`flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
              activeTab === 'soundboard'
                ? 'bg-pink-600 text-white shadow-lg shadow-pink-900/40'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
            }`}
          >
            <Music size={20} className={activeTab === 'soundboard' ? 'scale-110' : ''} />
            <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">Sons</span>
          </button>
        )}
        {remoteShowTasks !== false && (
          <button
            onClick={() => setActiveTab('checklist')}
            className={`flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
              activeTab === 'checklist'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
            }`}
          >
            <CheckSquare size={20} className={activeTab === 'checklist' ? 'scale-110' : ''} />
            <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">Tâches</span>
          </button>
        )}
        {remoteShowHandouts !== false && (
          <button
            onClick={() => setActiveTab('handouts')}
            className={`flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
              activeTab === 'handouts'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/40'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
            }`}
          >
            <icons.FileText size={20} className={activeTab === 'handouts' ? 'scale-110' : ''} />
            <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">Aides</span>
          </button>
        )}
        {remoteShowActions !== false && (
          <button
            onClick={() => setActiveTab('actions')}
            className={`flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
              activeTab === 'actions'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
            }`}
          >
            <icons.Zap size={20} className={activeTab === 'actions' ? 'scale-110' : ''} />
            <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">Actions</span>
          </button>
        )}
        {remoteShowPlayers !== false && (
          <button
            onClick={() => setActiveTab('players')}
            className={`flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
              activeTab === 'players'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/40'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
            }`}
          >
            <icons.Users size={20} className={activeTab === 'players' ? 'scale-110' : ''} />
            <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">Joueurs</span>
          </button>
        )}
      </nav>
      )}
    </div>
  );
};
