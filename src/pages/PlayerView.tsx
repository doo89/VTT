import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { SyncStatePayload } from '../lib/supabase';
import { LogOut, UserCircle2, Tag as TagIcon, ShieldAlert, X, MessageSquareWarning, ChevronUp, ChevronDown, Megaphone, Clock, Gamepad2, Users, Map, Power } from 'lucide-react';
import * as icons from 'lucide-react';
import type { Player, Role, Team } from '../types';

export const PlayerView: React.FC = () => {
  const { roomId, playerName } = useParams<{ roomId: string, playerName: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'game' | 'players' | 'room'>('game');
  const [roomData, setRoomData] = useState<any>(null);
  const [isHostOnline, setIsHostOnline] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [localPlayer, setLocalPlayer] = useState<Player | null>(null);
  const [localRole, setLocalRole] = useState<Role | null>(null);
  const [localTeam, setLocalTeam] = useState<Team | null>(null);
  const [isNight, setIsNight] = useState(false);
  const [cycleMode, setCycleMode] = useState<'dayNight' | 'turns' | 'none'>('dayNight');
  const [isConnected, setIsConnected] = useState(false);
  const [noticeBoardPlayers, setNoticeBoardPlayers] = useState<Player[]>([]);
  const [isNoticeBoardOpen, setIsNoticeBoardOpen] = useState(false);
  const [expandedNoticeId, setExpandedNoticeId] = useState<string | null>(null);
  const [handoutImages, setHandoutImages] = useState<{ id: string; url: string; name: string }[]>([]);
  const [roomPlayers, setRoomPlayers] = useState<Player[]>([]);
  const [selectedPlayersByTag, setSelectedPlayersByTag] = useState<Record<string, string[]>>({});
  const [displaySettings, setDisplaySettings] = useState<any>(null);

  // Track the actual player ID once found, so if GM renames them, they stay connected
  // Use a ref so changes don't cause the useEffect to tear down the WebSocket channel
  const matchedPlayerIdRef = useRef<string | null>(null);
  const channelRef = useRef<any>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const dismissNote = () => {
    if (!localPlayer || !channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'update_player_state',
      payload: { id: localPlayer.id, updates: { publicNotesSendToPlayer: false } }
    }).catch(console.error);
  };

  const handleSmartphoneAction = (tagInstanceId: string, buttonFeedback: string, isMultiSelector: boolean, autoDelete: boolean, playerFeedback?: string) => {
    if (!localPlayer || !channelRef.current) return;
    
    let feedbackAddon = '';
    if (isMultiSelector) {
      const selectedIds = selectedPlayersByTag[tagInstanceId] || [];
      const selectedNames = selectedIds.length > 0 
        ? selectedIds.map(id => roomPlayers.find(p => p.id === id)?.name || id).join(', ')
        : 'Aucun joueur sélectionné';
      feedbackAddon = `\nChoix : ${selectedNames}`;
    }

    channelRef.current.send({
      type: 'broadcast',
      event: 'smartphone_action',
      payload: { 
        playerName: localPlayer.name,
        playerId: localPlayer.id,
        tagInstanceId: tagInstanceId,
        feedbackMessage: buttonFeedback + feedbackAddon,
        autoDeleteSmartphoneUI: autoDelete,
        selectedPlayerIds: isMultiSelector ? (selectedPlayersByTag[tagInstanceId] || []) : []
      }
    }).catch(console.error);

    if (playerFeedback && playerFeedback.trim() !== '') {
      setSubmitMessage(playerFeedback);
      setTimeout(() => setSubmitMessage(null), 3500);
    }
    
    if (isMultiSelector) {
      setSelectedPlayersByTag(prev => ({ ...prev, [tagInstanceId]: [] }));
    }
  };

  const togglePlayerSelection = (tagInstanceId: string, targetPlayerId: string) => {
    setSelectedPlayersByTag(prev => {
      const current = prev[tagInstanceId] || [];
      if (current.includes(targetPlayerId)) {
        return { ...prev, [tagInstanceId]: current.filter(id => id !== targetPlayerId) };
      } else {
        return { ...prev, [tagInstanceId]: [...current, targetPlayerId] };
      }
    });
  };

  useEffect(() => {
    if (!roomId || !playerName || !supabase) return;

    const channel = supabase.channel(`room:${roomId}`, {
      config: { broadcast: { ack: false }, presence: { key: playerName } },
    });
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'sync_state' }, async ({ payload }) => {
        const data = payload as SyncStatePayload;
        setLastSyncTime(Date.now());
        setIsNight(data.isNight || false);
        setCycleMode(data.cycleMode || 'dayNight');
        setDisplaySettings(data.displaySettings || null);
        setRoomData(data.room || null);

        // Normalize strings for comparison (remove accents & lowercase)
        const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

        // Find player by previously matched ID, OR by name
        let found = null;
        if (matchedPlayerIdRef.current) {
          found = data.players.find(p => p.id === matchedPlayerIdRef.current);
        }
        if (!found) {
          const rawName = decodeURIComponent(playerName);
          const normalizedRaw = normalize(rawName);
          found = data.players.find(p => normalize(p.name) === normalizedRaw);
          if (found) {
            matchedPlayerIdRef.current = found.id;
            // Track presence now that we know our ID (do not await to avoid blocking UI update)
            channel.track({ playerId: found.id, name: found.name }).catch(console.error);
          }
        }

        // Store all players for the selector
        setRoomPlayers(data.players || []);

        // Update notice board players
        const noticeBoard = data.players.filter(p => p.publicNotes && p.publicNotesNoticeBoard);
        setNoticeBoardPlayers(noticeBoard);

        if (found) {
          setLocalPlayer(found);
          const role = data.roles.find(r => r.id === found.roleId);
          setLocalRole(role || null);

          const effectiveTeamId = role?.seenInTeamId || role?.teamId || found.teamId;
          const team = data.teams.find(t => t.id === effectiveTeamId);
          setLocalTeam(team || null);

          // Extract handout images from tags
          const newHandouts: { id: string; url: string; name: string }[] = [];
          if (data.handouts) {
            found.tags.forEach((tag: any) => {
              if (tag.handoutId) {
                const handout = data.handouts.find((h: any) => h.id === tag.handoutId);
                if (handout && handout.imageUrl) {
                  // Avoid duplicates
                  if (!newHandouts.find(h => h.id === handout.id)) {
                    newHandouts.push({ id: handout.id, url: handout.imageUrl, name: handout.name });
                  }
                }
              }
            });
          }
          setHandoutImages(newHandouts);
        } else {
          setLocalPlayer(null);
          setLocalRole(null);
          setLocalTeam(null);
          setHandoutImages([]);
          // If we lost our ID (e.g. player deleted), reset it
          if (matchedPlayerIdRef.current) {
            matchedPlayerIdRef.current = null;
            channel.untrack();
          }
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const hostFound = Object.values(newState).flat().some((p: any) => (p as any).isHost === true);
        setIsHostOnline(hostFound);
      })
      .subscribe((status, err) => {
        console.log('Player connection status:', status, err);
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);

          // Before sending a join request, we track ourselves using our name as a fallback ID.
          // This way, the host's `presence` sync picks us up immediately, even before `matchedPlayerId` is resolved.
          // Once the host broadcasts the state back to us, we will overwrite this track call with our true `found.id`.
          if (!matchedPlayerIdRef.current) {
            channel.track({ playerId: decodeURIComponent(playerName), name: decodeURIComponent(playerName) }).catch(console.error);
          }

          // Announce presence so the GM can add us or approve us if we don't exist yet
          // (or force a broadcast if we do exist)
          channel.send({
            type: 'broadcast',
            event: 'join_request',
            payload: { playerName: decodeURIComponent(playerName) }
          }).catch(console.error);

          // Request state immediately
          channel.send({
            type: 'broadcast',
            event: 'get_state',
          }).catch(console.error);

          // Retry every 4 seconds until we are matched by the host
          // This handles the case where the host was not ready when we first joined
          const retryInterval = setInterval(() => {
            if (matchedPlayerIdRef.current) {
              clearInterval(retryInterval);
              return;
            }
            channel.send({
              type: 'broadcast',
              event: 'join_request',
              payload: { playerName: decodeURIComponent(playerName) }
            }).catch(console.error);
            channel.send({
              type: 'broadcast',
              event: 'get_state',
            }).catch(console.error);
          }, 4000);

          // Store interval ID for cleanup on unmount
          return () => clearInterval(retryInterval);

        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false);
        }
      });

    return () => {
      if (supabase) supabase.removeChannel(channel);
    };
  }, [roomId, playerName]);

  return (
    <div className={`h-screen w-screen text-zinc-50 flex flex-col p-4 md:p-8 max-w-md mx-auto relative overflow-hidden transition-colors duration-1000 ${(isNight && cycleMode === 'dayNight') ? 'bg-zinc-950' : 'bg-zinc-900'}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6 z-10">
        <div className="flex flex-col">
          <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Salle : {roomId}</span>
          <h2 className="text-xl font-bold tracking-tight text-white truncate max-w-[200px]">{decodeURIComponent(playerName || 'Joueur')}</h2>
        </div>
        <button
          onClick={() => navigate('/join')}
          className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
          title="Quitter la salle"
        >
          <LogOut size={20} />
        </button>
      </div>

      {!isConnected ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 z-10">
          <div className="w-12 h-12 rounded-full border-4 border-zinc-600 border-t-blue-500 animate-spin" />
          <p className="text-sm text-zinc-500">Connexion à la salle {roomId}...</p>
        </div>
      ) : !localPlayer ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 z-10">
          <div className="w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent animate-pulse" />
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold text-zinc-200">En attente du Maître du Jeu...</h3>
            <p className="text-sm text-zinc-400 max-w-[250px]">Le MJ doit valider votre entrée ou vous placer sur le plateau.</p>
          </div>
          
          <div className="flex flex-col gap-3 w-full mt-4">
             <button 
               onClick={() => {
                 if (channelRef.current) {
                   channelRef.current.send({
                     type: 'broadcast',
                     event: 'join_request',
                     payload: { playerName: decodeURIComponent(playerName || '') }
                   });
                   channelRef.current.send({
                     type: 'broadcast',
                     event: 'get_state',
                   });
                 }
               }}
               className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors"
             >
               Relancer la demande au MJ
             </button>

             <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 text-left flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 border-b border-zinc-800 pb-1 mb-1">Infos de Debug</span>
                <div className="flex justify-between text-[10px]">
                  <span className="text-zinc-500">ID Salle:</span>
                  <span className="text-zinc-300 font-mono">{roomId}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-zinc-500">Mon Pseudo:</span>
                  <span className="text-zinc-300 font-mono">{decodeURIComponent(playerName || '')}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-zinc-500">MJ Connecté:</span>
                  <span className={`font-bold flex items-center gap-1 ${isHostOnline ? 'text-emerald-400' : 'text-red-400'}`}>
                    <Power size={10} />
                    {isHostOnline ? 'OUI' : 'NON'}
                  </span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-zinc-500">Dernière Sync:</span>
                  <span className="text-zinc-300 font-mono">
                    {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString('fr-FR') : 'Jamais'}
                  </span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-zinc-500">Joueurs en salle:</span>
                  <span className="text-blue-400 font-bold">{roomPlayers.length}</span>
                </div>
                {roomPlayers.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {roomPlayers.map(p => (
                      <span key={p.id} className="text-[9px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">
                        {p.name}
                      </span>
                    ))}
                  </div>
                )}
             </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-6 z-10 pb-20 overflow-y-auto custom-scrollbar pr-2">
          
          {activeTab === 'game' && (
            <>
              {/* Status Banner */}
              {localPlayer.isDead && (
                <div className="shrink-0 bg-red-950/50 border border-red-900 text-red-200 p-4 rounded-xl flex items-center justify-center gap-3 shadow-lg">
                  <ShieldAlert size={24} className="text-red-500" />
                  <span className="font-bold text-lg">Vous êtes mort.</span>
                </div>
              )}

          {/* Role Card */}
          {(() => {
            const effectiveStyle = localRole?.smartphoneImageStyle || localPlayer?.smartphoneImageStyle || displaySettings?.smartphoneImageStyle || 'circle';
            return (
              <div className={`relative shrink-0 flex flex-col items-center border rounded-2xl p-6 shadow-2xl overflow-hidden mt-4 transition-colors duration-1000 ${(isNight && cycleMode === 'dayNight') ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-800 border-zinc-700'}`}>
                {localTeam && (
                  <div
                      className="absolute top-0 left-0 w-full h-1.5"
                      style={{ backgroundColor: localTeam.color }}
                    />
                )}

                {/* Background Image Style */}
                {(effectiveStyle === 'background') && (localRole?.imageUrl || localPlayer?.imageUrl) && (
                  <div className="absolute inset-0 z-0 opacity-20 overflow-hidden">
                    <img 
                      src={localRole?.imageUrl || localPlayer?.imageUrl} 
                      alt="" 
                      className="w-full h-full object-cover blur-sm"
                    />
                  </div>
                )}

                {effectiveStyle !== 'background' && (
                  <div
                    className={`flex items-center justify-center shadow-xl mb-4 border-4 transition-all overflow-hidden z-10 ${localPlayer.isDead ? 'grayscale opacity-50 border-zinc-700 bg-zinc-800' : 'border-zinc-800 bg-zinc-950'} ${
                      effectiveStyle === 'square' ? 'w-28 h-28 rounded-2xl' :
                      effectiveStyle === 'original' ? 'max-w-full rounded-lg' : 
                      'w-28 h-28 rounded-full'
                    }`}
                    style={{ borderColor: localPlayer.isDead ? undefined : (localRole?.color || localPlayer.color) }}
                  >
                    {localRole?.imageUrl || localPlayer.imageUrl ? (
                      <img
                        src={localRole?.imageUrl || localPlayer.imageUrl}
                        alt="Avatar"
                        className={`w-full h-full ${effectiveStyle === 'original' ? 'object-contain' : 'object-cover'}`}
                      />
                    ) : (
                      <div className="p-6">
                        <UserCircle2 size={48} className="text-zinc-600" />
                      </div>
                    )}
                  </div>
                )}

                <div className="text-center flex flex-col items-center gap-1 w-full z-10">
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Votre Rôle</span>
                  <h3
                    className={`text-3xl font-black tracking-tight mt-1 ${localPlayer.isDead ? 'text-zinc-600' : 'text-white'}`}
                    style={{ color: localPlayer.isDead ? undefined : (localRole?.color || '#fff') }}
                  >
                    {localRole ? localRole.name : "Pas de rôle"}
                  </h3>

                  {localTeam && (
                    <div
                      className="inline-flex items-center justify-center px-3 py-1 rounded-full mt-3 border bg-zinc-950/50"
                      style={{ borderColor: `${localTeam.color}40`, color: localTeam.color }}
                    >
                      <span className="text-xs font-bold">{localTeam.name}</span>
                    </div>
                  )}
                </div>

                {localRole?.description && (
                  <div className="mt-6 pt-6 border-t border-zinc-800 w-full">
                    <p className="text-sm text-zinc-400 italic text-center leading-relaxed">
                      {localRole.description}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* GM Message / Public Notes targeting this player */}
          {localPlayer.publicNotes && localPlayer.publicNotesSendToPlayer && (
            <div className="shrink-0 bg-blue-900/30 border border-blue-500/50 rounded-2xl overflow-hidden mt-4 relative">
              <div className="bg-blue-500/20 px-4 py-2 border-b border-blue-500/30 flex items-center justify-between">
                <h4 className="text-xs font-bold text-blue-300 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquareWarning size={14} /> Message du MJ
                </h4>
                <button
                  onClick={dismissNote}
                  className="p-1 hover:bg-blue-500/20 rounded-md text-blue-400 hover:text-blue-300 transition-colors"
                  title="Fermer le message"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-4">
                <p className="text-sm text-blue-100 whitespace-pre-wrap leading-relaxed">
                  {localPlayer.publicNotes}
                </p>
              </div>
            </div>
          )}

          {/* Tags / Status Effects */}
          {localPlayer.tags.filter(t => t.showOnSmartphone).length > 0 && (
            <div className="shrink-0 flex flex-col gap-3 mt-4">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <TagIcon size={14} /> Effets Actifs
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {localPlayer.tags.filter(t => t.showOnSmartphone).map(tag => (
                  <div key={tag.instanceId} className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-white">
                        {(() => {
                           const IconComponent = tag.icon ? (icons as any)[tag.icon] : null;
                           return IconComponent ? (
                             <IconComponent size={14} style={{ color: tag.color }} />
                           ) : (
                             <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                           );
                        })()}
                        {tag.name}
                      </div>
                      {tag.uses !== null && (
                         <span className="text-xs font-bold bg-zinc-800 px-2 py-1 rounded text-zinc-300">
                           {tag.uses} util.
                         </span>
                      )}
                    </div>
                    {tag.description && (
                      <p className="text-xs text-zinc-500 italic mt-1 leading-relaxed">{tag.description}</p>
                    )}

                    {(tag.isMultiPlayerSelector || tag.smartphoneButtonText) && (
                      <div className="mt-3 pt-3 border-t border-zinc-800/80 flex flex-col gap-3">
                        {tag.isMultiPlayerSelector && (
                           <div className="flex flex-col gap-2">
                             <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sélectionner des joueurs</span>
                             <div className="flex flex-col gap-1 max-h-32 overflow-y-auto custom-scrollbar pr-1 bg-zinc-950/30 p-2 rounded-lg border border-zinc-800/50">
                                {roomPlayers.map(p => (
                                  <label key={p.id} className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors ${p.isDead ? 'hover:bg-transparent opacity-50' : 'hover:bg-zinc-800/50'}`}>
                                    <input 
                                      type="checkbox"
                                      disabled={p.isDead}
                                      checked={(selectedPlayersByTag[tag.instanceId] || []).includes(p.id)}
                                      onChange={() => togglePlayerSelection(tag.instanceId, p.id)}
                                      className="rounded bg-zinc-900 border-zinc-700 w-3.5 h-3.5"
                                    />
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                    <span className={`text-xs text-zinc-300 truncate ${p.isDead ? 'line-through text-zinc-500' : ''}`}>{p.name}</span>
                                  </label>
                                ))}
                             </div>
                           </div>
                        )}
                        {tag.smartphoneButtonText && (
                          <button
                            onClick={() => handleSmartphoneAction(tag.instanceId, tag.smartphoneButtonFeedback || '', !!tag.isMultiPlayerSelector, !!tag.smartphoneAutoDelete)}
                            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors w-full uppercase tracking-wider shadow-lg shadow-blue-900/20 active:scale-95"
                          >
                            {tag.smartphoneButtonText}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Public Notice Board */}
          {noticeBoardPlayers.length > 0 && (
            <div className="shrink-0 mt-8 border border-zinc-700/50 rounded-2xl overflow-hidden bg-zinc-900/50 backdrop-blur-sm shadow-xl">
              <button
                onClick={() => setIsNoticeBoardOpen(!isNoticeBoardOpen)}
                className="w-full flex items-center justify-between p-4 bg-zinc-800/80 hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Megaphone size={18} className="text-amber-500" />
                  <span className="font-bold tracking-widest uppercase text-xs text-zinc-300">Panneau Affichage Public</span>
                  <span className="bg-amber-500/20 text-amber-500 text-[10px] font-black px-2 py-0.5 rounded-full ml-1">
                    {noticeBoardPlayers.length}
                  </span>
                </div>
                {isNoticeBoardOpen ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
              </button>

              {isNoticeBoardOpen && (
                <div className="p-3 flex flex-col gap-3">
                  {noticeBoardPlayers.map(p => (
                    <div key={p.id} className="bg-zinc-950/50 border border-zinc-800/80 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedNoticeId(expandedNoticeId === p.id ? null : p.id)}
                        className="w-full flex items-center justify-between p-3 hover:bg-zinc-900 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                          <span className="font-bold text-sm text-zinc-200 truncate">{p.name}</span>
                        </div>
                        {expandedNoticeId === p.id ? <ChevronUp size={14} className="text-zinc-600 shrink-0" /> : <ChevronDown size={14} className="text-zinc-600 shrink-0" />}
                      </button>

                      {expandedNoticeId === p.id && (
                        <div className="p-3 pt-0 border-t border-zinc-900">
                          <p className="text-sm text-zinc-300 mt-3 whitespace-pre-wrap">
                            {p.publicNotes}
                          </p>
                          {p.publicNotesTimestamp && (
                            <div className="flex items-center gap-1.5 mt-4 text-[10px] font-medium text-zinc-600 uppercase tracking-widest">
                              <Clock size={10} />
                              {new Date(p.publicNotesTimestamp).toLocaleString('fr-FR', {
                                day: '2-digit', month: '2-digit', year: '2-digit',
                                hour: '2-digit', minute: '2-digit'
                              }).replace(',', '')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Gallery for Tag Handout References */}
          {handoutImages.length > 0 && (
            <div className="shrink-0 mt-8">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 text-center">Aides de Jeu (Références)</h4>
              <div className="flex flex-wrap gap-4 justify-center">
                {handoutImages.map((handout) => (
                  <div key={handout.id} className="relative group cursor-pointer" onClick={() => window.open(handout.url, '_blank')}>
                    <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-zinc-700 bg-zinc-800 shadow-lg hover:border-blue-500 transition-colors">
                      <img src={handout.url} alt={handout.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                      <span className="text-[10px] font-bold text-white uppercase px-2 text-center">Agrandir</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 text-center mt-1 truncate w-24">{handout.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

            </>
          )}

          {activeTab === 'players' && (
            <div className="flex-1 flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Joueurs en salle</h3>
                <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-widest">{roomPlayers.length} joueurs connectés</p>
              </div>
              <div className="flex flex-col gap-2.5">
                {roomPlayers.map(p => (
                  <div key={p.id} className="flex items-center gap-4 bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/50 backdrop-blur-sm">
                    <div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 shrink-0 ${p.isDead ? 'border-zinc-800 grayscale opacity-40' : 'shadow-lg shadow-zinc-950/50'}`} 
                      style={{ borderColor: p.isDead ? undefined : p.color }}
                    >
                       {p.imageUrl ? (
                         <img src={p.imageUrl} className="w-full h-full rounded-full object-cover" alt={p.name} />
                       ) : (
                         <UserCircle2 size={24} className={p.isDead ? 'text-zinc-800' : 'text-zinc-600'} />
                       )}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className={`text-lg font-bold truncate ${p.isDead ? 'line-through text-zinc-600 opacity-50' : 'text-zinc-100'}`}>
                        {p.name}
                      </span>
                      {p.isDead && <span className="text-[10px] font-bold text-red-900/70 uppercase tracking-widest leading-none">Mort</span>}
                    </div>
                    {p.isDead && (
                      <div className="bg-red-950/20 p-2 rounded-full">
                        <ShieldAlert size={18} className="text-red-900/40" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'room' && (
            <div className="flex-1 flex flex-col gap-4 py-2 overflow-hidden h-full">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Miniature de la salle</h3>
                <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-widest">Vue d'ensemble en temps réel</p>
              </div>
              {roomData ? (
                <div className="flex-1 bg-zinc-900/50 rounded-2xl border border-zinc-800 relative overflow-hidden flex items-center justify-center p-2 shadow-inner">
                  <div 
                    className="relative bg-zinc-800 shadow-2xl border border-zinc-700 overflow-hidden rounded-sm pointer-events-none"
                    style={{ 
                      width: '100%', 
                      aspectRatio: `${roomData.width}/${roomData.height}`,
                      backgroundColor: roomData.backgroundColor,
                      backgroundImage: roomData.backgroundImage ? `url(${roomData.backgroundImage})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      maxHeight: '100%'
                    }}
                  >
                    {roomPlayers.map(p => {
                      // World coords are centered at (0,0). Room goes from -w/2 to +w/2 and -h/2 to +h/2.
                      // Convert to percentage (0% = left/top edge, 100% = right/bottom edge)
                      const halfW = roomData.width / 2;
                      const halfH = roomData.height / 2;
                      const leftPct = Math.max(0, Math.min(100, ((p.x + halfW) / roomData.width) * 100));
                      const topPct  = Math.max(0, Math.min(100, ((p.y + halfH) / roomData.height) * 100));
                      return (
                        <div 
                          key={p.id}
                          title={p.name}
                          className={`absolute ${p.isDead ? 'opacity-20' : 'animate-pulse'}`}
                          style={{
                            left: `${leftPct}%`,
                            top: `${topPct}%`,
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: p.color,
                            transform: 'translate(-50%, -50%)',
                            boxShadow: `0 0 12px ${p.color}`,
                            zIndex: 10
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-700 italic gap-2 bg-zinc-900/40 rounded-2xl border border-zinc-800/50">
                   <Clock className="animate-spin opacity-20" size={32} />
                   <span className="text-xs uppercase tracking-widest font-bold opacity-30">Chargement de la salle...</span>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* Navigation Menu */}
      {isConnected && localPlayer && (
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800 shadow-[0_-10px_20px_rgba(0,0,0,0.5)] flex items-center justify-around px-4 z-[60] pb-safe">
          <button 
            onClick={() => setActiveTab('game')}
            className={`flex flex-col items-center justify-center gap-1.5 flex-1 h-full transition-all duration-300 ${activeTab === 'game' ? 'text-blue-500 scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            <div className={`p-2 rounded-xl transition-colors ${activeTab === 'game' ? 'bg-blue-500/10' : 'bg-transparent'}`}>
              <Gamepad2 size={22} strokeWidth={activeTab === 'game' ? 2.5 : 2} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-[0.15em] transition-opacity ${activeTab === 'game' ? 'opacity-100' : 'opacity-40'}`}>Jeu</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('players')}
            className={`flex flex-col items-center justify-center gap-1.5 flex-1 h-full transition-all duration-300 ${activeTab === 'players' ? 'text-blue-500 scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            <div className={`p-2 rounded-xl transition-colors ${activeTab === 'players' ? 'bg-blue-500/10' : 'bg-transparent'}`}>
              <Users size={22} strokeWidth={activeTab === 'players' ? 2.5 : 2} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-[0.15em] transition-opacity ${activeTab === 'players' ? 'opacity-100' : 'opacity-40'}`}>Joueurs</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('room')}
            className={`flex flex-col items-center justify-center gap-1.5 flex-1 h-full transition-all duration-300 ${activeTab === 'room' ? 'text-blue-500 scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            <div className={`p-2 rounded-xl transition-colors ${activeTab === 'room' ? 'bg-blue-500/10' : 'bg-transparent'}`}>
              <Map size={22} strokeWidth={activeTab === 'room' ? 2.5 : 2} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-[0.15em] transition-opacity ${activeTab === 'room' ? 'opacity-100' : 'opacity-40'}`}>Salle</span>
          </button>
        </div>
      )}

      {/* Decorative background glow */}
      {localRole && !localPlayer?.isDead && activeTab === 'game' && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] rounded-full blur-[120px] opacity-10 pointer-events-none z-0"
          style={{ backgroundColor: localRole.color }}
        />
      )}

      {/* Submit Message Popup */}
      {submitMessage && (
        <div className="absolute top-0 inset-x-0 mx-auto w-full max-w-sm mt-16 p-4 z-[70] animate-in fade-in slide-in-from-top-4">
          <div className="bg-emerald-900/90 backdrop-blur-md border border-emerald-600 text-emerald-100 rounded-2xl p-4 shadow-2xl flex items-center justify-between">
            <span className="font-bold text-sm flex-1">{submitMessage}</span>
            <button title="Fermer" onClick={() => setSubmitMessage(null)} className="opacity-70 hover:opacity-100 p-1 bg-emerald-800/50 rounded-lg ml-2">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
