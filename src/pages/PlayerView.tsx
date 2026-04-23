import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { SyncStatePayload } from '../lib/supabase';
import { LogOut, UserCircle2, Tag as TagIcon, ShieldAlert, X, MessageSquareWarning, ChevronUp, ChevronDown, Megaphone, Clock, Gamepad2, Users, Map, Power, Trash2 } from 'lucide-react';
import * as icons from 'lucide-react';
import { useVttStore } from '../store';
import type { Player, Role, Team, TagModel } from '../types';

export const PlayerView: React.FC = () => {
  const { roomId, playerName } = useParams<{ roomId: string, playerName: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'game' | 'players' | 'room' | 'wiki'>('game');
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
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
  const [wiki, setWiki] = useState<any>(null);
  const [wikiLightMode, setWikiLightMode] = useState(false);
  const [isWikiNotesOpen, setIsWikiNotesOpen] = useState(false);
  const [isWikiRolesOpen, setIsWikiRolesOpen] = useState(false);
  const [isWikiTagsOpen, setIsWikiTagsOpen] = useState(false);
  const [allTags, setAllTags] = useState<TagModel[]>([]);
  const [expandedPlayerNotesId, setExpandedPlayerNotesId] = useState<string | null>(null);
  const [playerNotes, setPlayerNotes] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(`vtt_player_notes_${roomId}`);
    return saved ? JSON.parse(saved) : {};
  });

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

  const handleSmartphoneAction = (tagInstanceId: string, buttonFeedback: string, isSelector: boolean, autoDelete: boolean, playerFeedback?: string, returnInfo?: string) => {
    if (!localPlayer || !channelRef.current) return;
    
    let feedbackAddon = '';
    if (isSelector) {
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
        selectedPlayerIds: isSelector ? (selectedPlayersByTag[tagInstanceId] || []) : [],
        smartphoneReturnInfo: returnInfo
      }
    }).catch(console.error);

    if (playerFeedback && playerFeedback.trim() !== '') {
      setSubmitMessage(playerFeedback);
      setTimeout(() => setSubmitMessage(null), 3500);
    }
    
    if (isSelector) {
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

  const updatePlayerNote = (playerId: string, note: string) => {
    const newNotes = { ...playerNotes, [playerId]: note };
    setPlayerNotes(newNotes);
    localStorage.setItem(`vtt_player_notes_${roomId}`, JSON.stringify(newNotes));
  };

  const clearAllNotes = () => {
    if (confirm('Effacer toutes vos notes privées sur les joueurs ?')) {
      setPlayerNotes({});
      localStorage.removeItem(`vtt_player_notes_${roomId}`);
    }
  };

  useEffect(() => {
    if (!roomId || !playerName || !supabase) return;

    const channel = supabase.channel(`room:${roomId}`, {
      config: { broadcast: { ack: false }, presence: { key: playerName } },
    });
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'feedback_popup' }, ({ payload }) => {
        if (payload.playerId === matchedPlayerIdRef.current) {
          setSubmitMessage(payload.message);
          setTimeout(() => setSubmitMessage(null), 10000);
        }
      })
      .on('broadcast', { event: 'sync_state' }, async ({ payload }) => {
        const data = payload as SyncStatePayload;
        setLastSyncTime(Date.now());
        setIsNight(data.isNight || false);
        setCycleMode(data.cycleMode || 'dayNight');
        setDisplaySettings(data.displaySettings || null);
        setWiki(data.wiki || null);
        
        // Initial light mode from GM settings if not already toggled by user
        if (data.displaySettings?.wikiLightMode !== undefined) {
           setWikiLightMode(prev => prev || data.displaySettings.wikiLightMode);
        }

        setRoomData(data.room || null);
        
        // Push custom popups to the global store so that CustomPopupOverlay can render them
        useVttStore.setState({
          customPopups: (data as any).customPopups || [],
          activeCustomPopupId: (data as any).activeCustomPopupId || null
        });

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
        
        // Store all roles for the Wiki
        setAllRoles(data.roles || []);

        // Store all teams for the Wiki
        setAllTeams(data.teams || []);

        // Store all tags for the Wiki
        setAllTags(data.tags || []);

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

  const smartphoneTabs = displaySettings?.smartphoneTabs || { game: true, players: true, room: true, wiki: true };
  const hasSelectedTabs = smartphoneTabs.game || smartphoneTabs.players || smartphoneTabs.room || smartphoneTabs.wiki;
  
  // If no tabs are selected, we fallback to showing the game content ONLY (no tab bar will be rendered)
  const showGame = hasSelectedTabs ? (smartphoneTabs.game ?? true) : true;
  const showPlayers = hasSelectedTabs ? (smartphoneTabs.players ?? true) : false;
  const showRoom = hasSelectedTabs ? (smartphoneTabs.room ?? true) : false;
  const showWiki = hasSelectedTabs ? (smartphoneTabs.wiki ?? true) : false;

  const filteredRoles = useMemo(() => {
    if (!allRoles) return [];
    let roles = [...allRoles];
    
    // Filter by selected roles
    if (displaySettings?.wikiOnlySelectedRoles) {
      roles = roles.filter(r => r.isSelectableForDistribution);
    }
    
    // Filter by roles in play
    if (displaySettings?.wikiOnlyInPlayRoles) {
      const activeRoleIds = new Set(roomPlayers.map(p => p.roleId).filter(id => id !== null));
      roles = roles.filter(r => activeRoleIds.has(r.id));
    }
    
    return roles;
  }, [allRoles, roomPlayers, displaySettings?.wikiOnlySelectedRoles, displaySettings?.wikiOnlyInPlayRoles]);

  const filteredTags = useMemo(() => {
    if (!allTags) return [];
    return allTags.filter(t => t.visibleInWiki === true);
  }, [allTags]);

  useEffect(() => {
    if (activeTab === 'players' && !showPlayers) setActiveTab(showGame ? 'game' : (showRoom ? 'room' : 'wiki'));
    if (activeTab === 'room' && !showRoom) setActiveTab(showGame ? 'game' : (showPlayers ? 'players' : 'wiki'));
    if (activeTab === 'game' && !showGame) setActiveTab(showPlayers ? 'players' : (showRoom ? 'room' : 'wiki'));
    if (activeTab === 'wiki' && !showWiki) setActiveTab(showGame ? 'game' : (showPlayers ? 'players' : 'room'));
  }, [showGame, showPlayers, showRoom, showWiki, activeTab]);

  const smartphoneOptions = displaySettings?.smartphonePlayersOptions || { 
    allowPrivateNotes: true, 
    showDeadPlayers: true, 
    includeSelf: true,
    allowNotesForDeadPlayers: true,
    showNotePreview: true
  };

  const filteredPlayers = useMemo(() => {
    let list = [...roomPlayers];
    
    if (smartphoneOptions.showDeadPlayers === false) {
      list = list.filter(p => !p.isDead);
    }
    
    if (smartphoneOptions.includeSelf === false && localPlayer) {
      list = list.filter(p => p.id !== localPlayer.id);
    }
    
    return list;
  }, [roomPlayers, localPlayer, smartphoneOptions.showDeadPlayers, smartphoneOptions.includeSelf]);

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
          
          {localPlayer.isSleeping && (
            <div className="absolute inset-0 bg-zinc-950 z-[100] flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-700">
               <div className="relative mb-6">
                 <icons.Moon size={80} className="text-indigo-400 animate-pulse" />
                 <div className="absolute -top-2 -right-4 flex flex-col gap-1">
                   <span className="text-xl font-bold text-indigo-300/60 animate-bounce delay-100">Z</span>
                   <span className="text-2xl font-bold text-indigo-300/40 animate-bounce delay-200">z</span>
                   <span className="text-3xl font-bold text-indigo-300/20 animate-bounce delay-300">z</span>
                 </div>
               </div>
               <h3 className="text-2xl font-black uppercase tracking-tighter text-white mb-2 italic">Vous dormez...</h3>
               <p className="text-sm text-zinc-500 max-w-[200px] leading-relaxed">
                 Le Maître du Jeu vous a endormi. Vous ne pouvez plus voir vos actions pour le moment.
               </p>
            </div>
          )}

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
            const blur = displaySettings?.smartphoneImageBlur ?? 20;
            const minHeight = displaySettings?.smartphoneImageMinHeight ?? 400;

            return (
              <div 
                className={`relative shrink-0 flex flex-col items-center border rounded-2xl p-6 shadow-2xl overflow-hidden mt-4 transition-all duration-1000 ${(isNight && cycleMode === 'dayNight') ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-800 border-zinc-700'}`}
                style={{ minHeight: effectiveStyle === 'background' ? `${minHeight}px` : undefined }}
              >
                {localTeam && (
                  <div
                      className="absolute top-0 left-0 w-full h-1.5"
                      style={{ backgroundColor: localTeam.color }}
                    />
                )}

                {/* Background Image Style */}
                {(effectiveStyle === 'background') && (localRole?.imageUrl || localPlayer?.imageUrl) && (
                  <div className="absolute inset-0 z-0 opacity-40 overflow-hidden">
                    <img 
                      src={localRole?.imageUrl || localPlayer?.imageUrl} 
                      alt="" 
                      className="w-full h-full object-cover transition-all duration-700"
                      style={{ filter: `blur(${blur}px) brightness(0.6)` }}
                    />
                  </div>
                )}

                {effectiveStyle !== 'background' && effectiveStyle !== 'none' && (
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
                    
                    {/* Selection Pastilles Overlay */}
                    {localPlayer.selectionPastilles && localPlayer.selectionPastilles.length > 0 && (
                      <div className="absolute top-1 right-1 flex flex-col gap-1 z-20">
                        {localPlayer.selectionPastilles.map((p, idx) => {
                          const PIcon = (icons as any)[p.icon] || TagIcon;
                          return (
                            <div
                              key={`${p.id}-${idx}`}
                              className="w-6 h-6 rounded-full border-2 border-zinc-900 shadow-lg flex items-center justify-center bg-zinc-950 animate-in zoom-in-50 duration-300"
                              style={{ borderColor: p.color }}
                              title={p.name}
                            >
                              <PIcon size={12} style={{ color: p.color }} />
                            </div>
                          );
                        })}
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
                    <p className="text-sm text-zinc-400 italic text-center leading-relaxed whitespace-pre-wrap">
                      {localRole.description}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* GM Message / Public Notes targeting this player */}
          {localPlayer.publicNotes && localPlayer.publicNotesSendToPlayer !== false && (
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
          {(() => {
            const playerTags = localPlayer.tags.filter(t => t.showOnSmartphone);
            const roleTags = (localRole?.tags || []).filter((t: any) => t.showOnSmartphone);
            const allTags = [...playerTags, ...roleTags];
            
            if (allTags.length === 0) return null;
            
            return (
              <div className="shrink-0 flex flex-col gap-3 mt-4">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <TagIcon size={14} /> Effets & Rôle
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {allTags.map((tag: any) => {
                    const tagId = tag.instanceId || `role-tag-${tag.id}`;
                    return (
                      <div key={tagId} className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2">
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
                      <p className="text-xs text-zinc-500 italic mt-1 leading-relaxed whitespace-pre-wrap">{tag.description}</p>
                    )}

                    {(tag.isMultiPlayerSelector || tag.isSinglePlayerSelector || tag.smartphoneButtonText) && (
                      <div className="mt-3 pt-3 border-t border-zinc-800/80 flex flex-col gap-3">
                        {(tag.isMultiPlayerSelector || tag.isSinglePlayerSelector) && (
                           <div className="flex flex-col gap-2">
                             <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                               {tag.isSinglePlayerSelector ? 'Choisir un joueur' : 'Sélectionner des joueurs'}
                             </span>
                             <div className="flex flex-col gap-1 max-h-32 overflow-y-auto custom-scrollbar pr-1 bg-zinc-950/30 p-2 rounded-lg border border-zinc-800/50">
                                {roomPlayers.filter(p => {
                                  // Inclusion filters (OR)
                                  const matchAlive = tag.smartphoneFilterAlive ? !p.isDead : false;
                                  const matchDead = tag.smartphoneFilterDead ? p.isDead : false;
                                  const matchMyRole = tag.smartphoneFilterMyRole ? p.roleId === localPlayer.roleId : false;
                                  const matchMyTeam = tag.smartphoneFilterMyTeam ? p.teamId === localPlayer.teamId : false;

                                  const hasInclusionFilters = tag.smartphoneFilterAlive || tag.smartphoneFilterDead || tag.smartphoneFilterMyRole || tag.smartphoneFilterMyTeam;
                                  const passesInclusion = !hasInclusionFilters || matchAlive || matchDead || matchMyRole || matchMyTeam;

                                  if (!passesInclusion) return false;

                                  // Exclusion filters (AND)
                                  if (tag.smartphoneFilterNotMe && p.id === localPlayer.id) return false;
                                  if (tag.smartphoneFilterNotMyRole && p.roleId === localPlayer.roleId) return false;
                                  if (tag.smartphoneFilterNotMyTeam && p.teamId === localPlayer.teamId) return false;
                                  if (tag.smartphoneFilterNotThisTag) {
                                    const targetExcludeId = tag.smartphoneFilterExcludeTagId || tag.id;
                                    if (p.tags.some(t => t.id === targetExcludeId)) return false;
                                  }

                                  return true;
                                }).map(p => (
                                  <label key={p.id} className={`flex items-center gap-2 p-1.5 rounded transition-colors ${p.isDead && !tag.smartphoneFilterDead ? 'hover:bg-transparent opacity-50 cursor-not-allowed' : 'hover:bg-zinc-800/50 cursor-pointer'}`}>
                                      <input 
                                        type={tag.isSinglePlayerSelector ? "radio" : "checkbox"}
                                        name={tag.isSinglePlayerSelector ? `selector-${tagId}` : undefined}
                                        disabled={p.isDead && !tag.smartphoneFilterDead}
                                        checked={(selectedPlayersByTag[tagId] || []).includes(p.id)}
                                        onChange={() => {
                                          if (tag.isSinglePlayerSelector) {
                                            setSelectedPlayersByTag(prev => ({ ...prev, [tagId]: [p.id] }));
                                          } else {
                                            togglePlayerSelection(tagId, p.id);
                                          }
                                        }}
                                        className={`${tag.isSinglePlayerSelector ? 'rounded-full' : 'rounded'} bg-zinc-900 border-zinc-700 w-3.5 h-3.5`}
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
                              onClick={() => handleSmartphoneAction(tagId, tag.smartphoneButtonFeedback || '', (!!tag.isMultiPlayerSelector || !!tag.isSinglePlayerSelector), !!tag.smartphoneAutoDelete, tag.smartphonePlayerFeedback, tag.smartphoneReturnInfo)}
                              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors w-full uppercase tracking-wider shadow-lg shadow-blue-900/20 active:scale-95"
                            >
                              {tag.smartphoneButtonText}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                  })}
                </div>
              </div>
            );
          })()}

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

          {(activeTab === 'players' && showPlayers) && (
            <div className="flex-1 flex flex-col gap-4 py-2">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Joueurs en salle</h3>
                  <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-widest">{filteredPlayers.length} joueurs connectés</p>
                </div>
                {smartphoneOptions.allowPrivateNotes !== false && (
                  <button
                    onClick={clearAllNotes}
                    className="p-2 text-zinc-500 hover:text-red-400 transition-colors bg-zinc-900/50 rounded-lg border border-zinc-800"
                    title="Effacer toutes vos notes"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2.5">
                {filteredPlayers.map(p => {
                  const isLocal = p.id === localPlayer?.id;
                  const isExpanded = expandedPlayerNotesId === p.id;
                  
                  return (
                    <div 
                      key={p.id} 
                      className={`flex flex-col bg-zinc-900/40 rounded-2xl border transition-all duration-300 backdrop-blur-sm ${
                        isLocal ? 'border-orange-500/50 bg-orange-500/5' : 'border-zinc-800/50'
                      }`}
                    >
                      <div 
                        className={`flex items-center gap-4 p-4 ${(smartphoneOptions.allowPrivateNotes !== false && (!p.isDead || smartphoneOptions.allowNotesForDeadPlayers !== false)) ? 'cursor-pointer' : ''}`}
                        onClick={() => {
                          if (smartphoneOptions.allowPrivateNotes !== false && (!p.isDead || smartphoneOptions.allowNotesForDeadPlayers !== false)) {
                            setExpandedPlayerNotesId(isExpanded ? null : p.id);
                          }
                        }}
                      >
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
                          <span className={`text-lg font-bold truncate ${p.isDead ? 'line-through text-zinc-600 opacity-50' : (isLocal ? 'text-orange-200' : 'text-zinc-100')}`}>
                            {p.name} {isLocal && <span className="text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded ml-1 font-black">MOI</span>}
                          </span>
                          {p.isDead && <span className="text-[10px] font-bold text-red-900/70 uppercase tracking-widest leading-none">Mort</span>}
                          {smartphoneOptions.showNotePreview !== false && !p.isDead && playerNotes[p.id] && (
                            <span className="text-[10px] text-zinc-500 truncate italic mt-1">Note: {playerNotes[p.id]}</span>
                          )}
                        </div>
                        {p.isDead ? (
                          <div className="flex items-center gap-2">
                             <div className="bg-red-950/20 p-2 rounded-full">
                                <ShieldAlert size={18} className="text-red-900/40" />
                             </div>
                             {(smartphoneOptions.allowPrivateNotes !== false && smartphoneOptions.allowNotesForDeadPlayers !== false) && (
                                <div className={`p-1.5 rounded-full transition-colors ${isExpanded ? 'bg-zinc-800 text-blue-400' : 'text-zinc-600'}`}>
                                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>
                             )}
                          </div>
                        ) : (
                          smartphoneOptions.allowPrivateNotes !== false && (
                            <div className={`p-1.5 rounded-full transition-colors ${isExpanded ? 'bg-zinc-800 text-blue-400' : 'text-zinc-600'}`}>
                              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                          )
                        )}
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 duration-200">
                          <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-3 flex flex-col gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 border-b border-zinc-800/50 pb-1 flex items-center justify-between">
                              Note Privée
                              <span className="text-[9px] font-medium lowercase">Seulement sur ce téléphone</span>
                            </span>
                            <textarea
                              value={playerNotes[p.id] || ''}
                              onChange={(e) => updatePlayerNote(p.id, e.target.value)}
                              placeholder="Ajouter une note secrète sur ce joueur..."
                              className="w-full bg-transparent text-sm text-zinc-300 outline-none resize-none min-h-[80px]"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(activeTab === 'room' && showRoom) && (
            <div className="flex-1 flex flex-col gap-4 py-2 overflow-hidden h-full">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Miniature de la salle</h3>
                <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-widest">Vue d'ensemble en temps réel</p>
              </div>
              {roomData ? (
                <div className="flex-1 bg-zinc-900/50 rounded-2xl border border-zinc-800 relative overflow-hidden flex items-start justify-center p-2 shadow-inner">
                  <div 
                    className="relative bg-zinc-800 shadow-2xl border border-zinc-700 overflow-hidden rounded-sm pointer-events-none"
                    style={{ 
                      width: '100%', 
                      aspectRatio: `${roomData.width}/${roomData.height}`,
                      backgroundColor: roomData.backgroundColor,
                      backgroundImage: (roomData.minimapImageUrl || roomData.backgroundImage) ? `url(${roomData.minimapImageUrl || roomData.backgroundImage})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      maxHeight: '100%'
                    }}
                  >
                    {roomPlayers.map(p => {
                      const halfW = roomData.width / 2;
                      const halfH = roomData.height / 2;
                      const leftPct = Math.max(0, Math.min(100, ((p.x + halfW) / roomData.width) * 100));
                      const topPct  = Math.max(0, Math.min(100, ((p.y + halfH) / roomData.height) * 100));
                      return (
                        <div
                          key={p.id}
                          title={p.name}
                          className={`absolute ${displaySettings?.roomMiniatureAnimation !== false ? 'transition-all duration-700' : ''}`}
                          style={{ left: `${leftPct}%`, top: `${topPct}%`, transform: 'translate(-50%, -50%)', zIndex: 10 }}
                        >
                          {p.isDead ? (
                            displaySettings?.roomMiniatureDeadIconUrl ? (
                              <img 
                                src={displaySettings.roomMiniatureDeadIconUrl} 
                                alt="Mort" 
                                className="w-[30px] h-[30px] object-contain opacity-80"
                                style={{ filter: `drop-shadow(0 0 5px ${p.color})` }}
                              />
                            ) : (
                              <svg width="39" height="39" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill={p.color} opacity="0.65">
                                <path d="M12 2C7.03 2 3 6.03 3 11c0 3.1 1.53 5.84 3.88 7.5L7 22h10l.12-3.5C19.47 16.84 21 14.1 21 11c0-4.97-4.03-9-9-9zm-3.5 13-.5-1H7l-1-1v-1l1-1h1l.5-1h4l.5 1H14l1 1v1l-1 1h-1l-.5 1h-4zm1-4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                              </svg>
                            )
                          ) : (
                            p.id === localPlayer?.id && displaySettings?.roomMiniaturePlayerIconUrl ? (
                              <img 
                                src={displaySettings.roomMiniaturePlayerIconUrl} 
                                alt="Moi" 
                                className={`w-[30px] h-[30px] object-contain ${displaySettings?.roomMiniatureAnimation !== false ? 'animate-pulse' : ''}`}
                                style={{ filter: `drop-shadow(0 0 5px ${p.color})` }}
                              />
                            ) : (
                              <div
                                className={displaySettings?.roomMiniatureAnimation !== false ? 'animate-pulse' : ''}
                                style={{
                                  width: '30px',
                                  height: '30px',
                                  borderRadius: '50%',
                                  backgroundColor: p.color,
                                  boxShadow: `0 0 15px ${p.color}`,
                                }}
                              />
                            )
                          )}
                        </div>
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

          {(activeTab === 'wiki' && showWiki) && (
            <div className="flex-1 flex flex-col gap-6 py-2 pb-10">
              {/* Part 1: MJ Wiki Content */}
              {(displaySettings?.showWikiNotes !== false) && (
              <section className="flex flex-col gap-3">
                 <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <button 
                       onClick={() => setIsWikiNotesOpen(!isWikiNotesOpen)}
                       className="flex items-center gap-2 flex-1 text-left"
                    >
                       <icons.Book size={18} className="text-blue-500" />
                       <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-100 italic">
                          {displaySettings?.wikiTitle || 'Régles du jeu'}
                       </h3>
                       {isWikiNotesOpen ? <icons.ChevronUp size={16} className="text-zinc-600" /> : <icons.ChevronDown size={16} className="text-zinc-600" />}
                    </button>
                    {isWikiNotesOpen && (
                      <button 
                         onClick={() => setWikiLightMode(!wikiLightMode)}
                         className={`p-1.5 rounded-lg border transition-all ${wikiLightMode ? 'bg-white text-zinc-900 border-zinc-300 shadow-sm' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}
                         title={wikiLightMode ? "Passer en mode sombre" : "Passer en mode clair"}
                      >
                         {wikiLightMode ? <icons.Moon size={14} /> : <icons.Sun size={14} />}
                      </button>
                    )}
                 </div>
                 
                 {isWikiNotesOpen && (
                   <div 
                      className={`border rounded-2xl overflow-hidden p-5 transition-all duration-300 animate-in slide-in-from-top-2 ${wikiLightMode ? 'bg-white border-zinc-200' : (isNight && cycleMode === 'dayNight' ? 'bg-zinc-950/50 border-zinc-800 shadow-blue-900/5' : 'bg-zinc-900/50 border-zinc-800 shadow-black/5')}`}
                   >
                      {wiki?.content ? (
                         <div 
                            className={`wiki-content text-sm leading-relaxed pointer-events-none select-none ${wikiLightMode ? 'text-zinc-900' : 'text-zinc-300'}`}
                            dangerouslySetInnerHTML={{ __html: wiki.content }}
                         />
                      ) : (
                         <div className="flex flex-col items-center justify-center py-6 text-zinc-600 gap-2 grayscale">
                            <icons.FileText size={40} className="opacity-20" />
                            <p className="text-xs font-bold uppercase tracking-tighter opacity-30">Aucune information partagée...</p>
                         </div>
                      )}
                   </div>
                 )}
              </section>
              )}

              {/* Part 2: Roles Arborescence */}
              {(displaySettings?.showWikiRoles !== false) && (
              <section className="flex flex-col gap-3 mt-4">
                 <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                    <button 
                       onClick={() => setIsWikiRolesOpen(!isWikiRolesOpen)}
                       className="flex items-center gap-2 flex-1 text-left"
                    >
                       <icons.Users size={18} className="text-indigo-400" />
                       <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-100 italic">Guide des Rôles</h3>
                       {isWikiRolesOpen ? <icons.ChevronUp size={16} className="text-zinc-600" /> : <icons.ChevronDown size={16} className="text-zinc-600" />}
                    </button>
                 </div>

                 {isWikiRolesOpen && (
                   <div className="flex flex-col gap-3 animate-in slide-in-from-top-2">
                     {filteredRoles && filteredRoles.length > 0 ? (
                        filteredRoles.map(role => {
                         const isExpanded = expandedNoticeId === `role-wiki-${role.id}`;
                         const team = allTeams.find(t => t.id === role.teamId);
                         
                         return (
                            <div 
                               key={role.id} 
                               className={`bg-zinc-900/60 border rounded-2xl overflow-hidden transition-all duration-300 ${isExpanded ? 'border-zinc-700 shadow-xl' : 'border-zinc-800/80'}`}
                            >
                               <button
                                 onClick={() => setExpandedNoticeId(isExpanded ? null : `role-wiki-${role.id}`)}
                                 className="w-full flex items-center justify-between p-4 text-left active:bg-zinc-800/50 transition-colors"
                               >
                                  <div className="flex items-center gap-3 min-w-0">
                                     <div 
                                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0 ${isExpanded ? 'shadow-inner' : ''}`}
                                        style={{ borderColor: role.color + '60', backgroundColor: role.color + '15' }}
                                     >
                                        {role.imageUrl ? (
                                           <img src={role.imageUrl} className="w-full h-full rounded-full object-cover" alt="" />
                                        ) : (
                                           <icons.Shield size={18} style={{ color: role.color }} />
                                        )}
                                     </div>
                                     <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-zinc-100 truncate">{role.name}</span>
                                        {team && (
                                           <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: team.color }}>
                                              {team.name}
                                           </span>
                                        )}
                                     </div>
                                  </div>
                                  <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                     <ChevronDown size={18} className="text-zinc-600" />
                                  </div>
                               </button>

                               {isExpanded && (
                                  <div className="px-4 pb-5 pt-0 animate-in slide-in-from-top-4 duration-300">
                                     <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent mb-4" />
                                     <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap italic">
                                        {role.description || "Aucune description disponible pour ce rôle."}
                                     </p>
                                  </div>
                               )}
                            </div>
                         );
                      })
                   ) : (
                      <p className="text-xs text-center text-zinc-600 italic py-10 uppercase tracking-widest font-black opacity-30">
                        Chargement des rôles...
                      </p>
                   )}
                 </div>
                 )}
              </section>
              )}

              {/* Part 3: Tags Guide */}
              {(displaySettings?.showWikiTags !== false) && (
              <section className="flex flex-col gap-3 mt-4">
                 <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                    <button 
                       onClick={() => setIsWikiTagsOpen(!isWikiTagsOpen)}
                       className="flex items-center gap-2 flex-1 text-left"
                    >
                       <icons.Tag size={18} className="text-emerald-400" />
                       <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-100 italic">Guide des Tags</h3>
                       {isWikiTagsOpen ? <icons.ChevronUp size={16} className="text-zinc-600" /> : <icons.ChevronDown size={16} className="text-zinc-600" />}
                    </button>
                 </div>

                 {isWikiTagsOpen && (
                   <div className="flex flex-col gap-3 animate-in slide-in-from-top-2">
                     {filteredTags && filteredTags.length > 0 ? (
                       filteredTags.map(tag => (
                         <div 
                           key={tag.id} 
                           className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden p-4 flex flex-col gap-3"
                         >
                           <div className="flex items-center gap-3">
                             <div 
                               className="w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0"
                               style={{ borderColor: tag.color + '60', backgroundColor: tag.color + '15' }}
                             >
                               {tag.imageUrl ? (
                                 <img src={tag.imageUrl} className="w-full h-full rounded-full object-cover" alt="" />
                               ) : (
                                 (() => {
                                   const TagIcon = (icons as any)[tag.icon] || (icons as any).Tag;
                                   return <TagIcon size={18} style={{ color: tag.color }} />;
                                 })()
                               )}
                             </div>
                             <span className="font-bold text-zinc-100 text-lg">{tag.name}</span>
                           </div>
                           {tag.description && (
                             <p className="text-sm text-zinc-400 italic leading-relaxed whitespace-pre-wrap pl-1 border-l-2 border-zinc-800">
                               {tag.description}
                             </p>
                           )}
                         </div>
                       ))
                     ) : (
                       <div className="flex flex-col items-center justify-center py-6 text-zinc-600 gap-2 grayscale">
                          <icons.Tag size={40} className="opacity-20" />
                          <p className="text-xs font-bold uppercase tracking-tighter opacity-30">Aucun tag public défini...</p>
                       </div>
                     )}
                   </div>
                 )}
              </section>
              )}
            </div>
          )}

        </div>
      )}

      {/* Navigation Menu */}
      {isConnected && localPlayer && (showGame || showPlayers || showRoom) && (
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800 shadow-[0_-10px_20px_rgba(0,0,0,0.5)] flex items-center justify-around px-4 z-[60] pb-safe">
          {showGame && (
          <button 
            onClick={() => setActiveTab('game')}
            className={`flex flex-col items-center justify-center gap-1.5 flex-1 h-full transition-all duration-300 ${activeTab === 'game' ? 'text-blue-500 scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            <div className={`p-2 rounded-xl transition-colors ${activeTab === 'game' ? 'bg-blue-500/10' : 'bg-transparent'}`}>
              <Gamepad2 size={22} strokeWidth={activeTab === 'game' ? 2.5 : 2} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-[0.15em] transition-opacity ${activeTab === 'game' ? 'opacity-100' : 'opacity-40'}`}>Jeu</span>
          </button>
          )}
          
          {showPlayers && (
          <button 
            onClick={() => setActiveTab('players')}
            className={`flex flex-col items-center justify-center gap-1.5 flex-1 h-full transition-all duration-300 ${activeTab === 'players' ? 'text-blue-500 scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            <div className={`p-2 rounded-xl transition-colors ${activeTab === 'players' ? 'bg-blue-500/10' : 'bg-transparent'}`}>
              <Users size={22} strokeWidth={activeTab === 'players' ? 2.5 : 2} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-[0.15em] transition-opacity ${activeTab === 'players' ? 'opacity-100' : 'opacity-40'}`}>Joueurs</span>
          </button>
          )}

          {showRoom && (
          <button 
            onClick={() => setActiveTab('room')}
            className={`flex flex-col items-center justify-center gap-1.5 flex-1 h-full transition-all duration-300 ${activeTab === 'room' ? 'text-blue-500 scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            <div className={`p-2 rounded-xl transition-colors ${activeTab === 'room' ? 'bg-blue-500/10' : 'bg-transparent'}`}>
              <Map size={22} strokeWidth={activeTab === 'room' ? 2.5 : 2} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-[0.15em] transition-opacity ${activeTab === 'room' ? 'opacity-100' : 'opacity-40'}`}>Salle</span>
          </button>
          )}

          {showWiki && (
          <button 
            onClick={() => setActiveTab('wiki')}
            className={`flex flex-col items-center justify-center gap-1.5 flex-1 h-full transition-all duration-300 ${activeTab === 'wiki' ? 'text-blue-500 scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            <div className={`p-2 rounded-xl transition-colors ${activeTab === 'wiki' ? 'bg-blue-500/10' : 'bg-transparent'}`}>
              <icons.Book size={22} strokeWidth={activeTab === 'wiki' ? 2.5 : 2} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-[0.15em] transition-opacity ${activeTab === 'wiki' ? 'opacity-100' : 'opacity-40'}`}>Wiki</span>
          </button>
          )}
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
