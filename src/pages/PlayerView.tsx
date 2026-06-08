import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, uploadFileToStorage } from '../lib/supabase';
import type { SyncStatePayload } from '../lib/supabase';
import { LogOut, UserCircle2, Tag as TagIcon, ShieldAlert, X, MessageSquareWarning, ChevronUp, ChevronDown, Megaphone, Clock, Gamepad2, Users, Map, Power, Trash2, Edit2 } from 'lucide-react';
import * as icons from 'lucide-react';
import { useVttStore } from '../store';
import type { Player, Role, Team, TagModel } from '../types';
import { renderMarkdown } from '../lib/utils';

export const PlayerView: React.FC = () => {
  const { roomId, playerName } = useParams<{ roomId: string, playerName: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'game' | 'players' | 'room' | 'wiki' | 'logs' | 'handouts' | 'journal' | 'chat'>('game');
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
  const [isWikiTeamsOpen, setIsWikiTeamsOpen] = useState(false);
  const [wikiSearchTerm, setWikiSearchTerm] = useState('');
  const [allTags, setAllTags] = useState<TagModel[]>([]);
  const [expandedPlayerNotesId, setExpandedPlayerNotesId] = useState<string | null>(null);
  const [playerNotes, setPlayerNotes] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(`vtt_player_notes_${roomId}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [roomLogs, setRoomLogs] = useState<any[]>([]);
  const chatMessages = useVttStore(state => state.chatMessages);
  const [chatInput, setChatInput] = useState('');
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [profileEditName, setProfileEditName] = useState('');
  const [profileEditColor, setProfileEditColor] = useState('#3b82f6');
  const [profileEditImageUrl, setProfileEditImageUrl] = useState('');
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);

  const activeGroupVote = useVttStore(state => state.activeGroupVote);
  const isGroupVoter = !!(activeGroupVote?.isOpen && (!activeGroupVote.allowedVoterIds?.length || activeGroupVote.allowedVoterIds.includes(localPlayer?.id || '')));

  // Track the actual player ID once found, so if GM renames them, they stay connected
  // Use a ref so changes don't cause the useEffect to tear down the WebSocket channel
  const matchedPlayerIdRef = useRef<string | null>(null);
  const channelRef = useRef<any>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [smartphoneCountdown, setSmartphoneCountdown] = useState<any>(null);
  const [timer, setTimer] = useState<any>({ minutes: 5, seconds: 0, isRunning: false });
  const [roleRevealPopups, setRoleRevealPopups] = useState<{ id: string, playerName: string, playerColor: string, roleName: string, roleImageUrl?: string, roleColor?: string }[]>([]);
  
  const [campaignJournal, setCampaignJournal] = useState<any>(null);
  const [isEditingJournal, setIsEditingJournal] = useState(false);
  const [localJournalContent, setLocalJournalContent] = useState('');
  const journalTextareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (campaignJournal && !isEditingJournal) {
      setLocalJournalContent(campaignJournal.publicContent || '');
    }
  }, [campaignJournal, isEditingJournal]);

  // Synchronise l'état local d'édition avec le verrou du serveur
  useEffect(() => {
    if (campaignJournal && localPlayer) {
      const isMyLock = campaignJournal.lockHolderId === localPlayer.id;
      if (isMyLock && !isEditingJournal) {
        setIsEditingJournal(true);
      } else if (!isMyLock && isEditingJournal) {
        setIsEditingJournal(false);
      }
    }
  }, [campaignJournal?.lockHolderId, localPlayer?.id, isEditingJournal]);
  const processedRoleRevealsRef = useRef<Record<string, number>>({});
  const lastForcedTabRef = useRef<string | null>(null);
  const lastVibrationTriggerRef = useRef<number>(0);
  const [dicePopup, setDicePopup] = useState<{ id: string, result: number, formula: string } | null>(null);
  const lastDiceIdRef = useRef<string>('');
  const [activeParticle, setActiveParticle] = useState<{ id: string, type: string, duration: number } | null>(null);
  const lastParticleIdRef = useRef<string>('');

  // Handle Particles
  useEffect(() => {
    if (localPlayer?.activeParticle && localPlayer.activeParticle.id !== lastParticleIdRef.current) {
      lastParticleIdRef.current = localPlayer.activeParticle.id;
      setActiveParticle(localPlayer.activeParticle);
      
      const timer = setTimeout(() => {
        setActiveParticle(null);
      }, localPlayer.activeParticle.duration);
      return () => clearTimeout(timer);
    }
  }, [localPlayer?.activeParticle]);

  // Pre-calculate stable random properties for active particles to keep rendering pure
  const particles = useMemo(() => {
    if (!activeParticle) return [];
    return Array.from({ length: 40 }).map(() => {
      const left = Math.random() * 100;
      const delay = Math.random() * 0.5;
      const duration = 1 + Math.random();
      const size = activeParticle.type === 'blood' ? (20 + Math.random() * 80) : (5 + Math.random() * 15);
      const rotate = Math.random() * 360;
      const spreadX = (Math.random() - 0.5) * 400;
      const spreadY = (Math.random() - 0.5) * 400;
      return { left, delay, duration, size, rotate, spreadX, spreadY };
    });
  }, [activeParticle?.id, activeParticle?.type]);

  // Handle Dice Results
  useEffect(() => {
    if (localPlayer?.lastDiceResult && localPlayer.lastDiceResult.id !== lastDiceIdRef.current) {
      lastDiceIdRef.current = localPlayer.lastDiceResult.id;
      
      // Ne pas afficher la popup si le jet date d'il y a plus de 10 secondes (utile lors d'une reconnexion)
      const isRecent = localPlayer.lastDiceResult.timestamp && (Date.now() - localPlayer.lastDiceResult.timestamp) < 10000;
      
      if (isRecent) {
        setDicePopup({
          id: localPlayer.lastDiceResult.id,
          result: localPlayer.lastDiceResult.result,
          formula: localPlayer.lastDiceResult.formula
        });
        
        // Auto-hide after 5 seconds
        const timer = setTimeout(() => {
          setDicePopup(null);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [localPlayer?.lastDiceResult]);

  // Handle vibration
  useEffect(() => {
    if (localPlayer?.vibrationTriggeredAt && localPlayer.vibrationTriggeredAt !== lastVibrationTriggerRef.current) {
      lastVibrationTriggerRef.current = localPlayer.vibrationTriggeredAt;
      if ('vibrate' in navigator) {
        navigator.vibrate(localPlayer.vibrationDuration || 200);
      }
    }
  }, [localPlayer?.vibrationTriggeredAt, localPlayer?.vibrationDuration]);

  // Handle forced tab navigation
  useEffect(() => {
    if (localPlayer?.forcedTab && localPlayer.forcedTab !== lastForcedTabRef.current) {
      const tab = localPlayer.forcedTab as any;
      if (['game', 'players', 'room', 'wiki', 'logs', 'handouts'].includes(tab)) {
        setActiveTab(tab);
        lastForcedTabRef.current = tab;
      }
    }
  }, [localPlayer?.forcedTab]);

  // Detect newly triggered role reveal popups
  useEffect(() => {
    if (!roomPlayers.length || !allRoles.length) return;
    
    roomPlayers.forEach(p => {
      if (p.roleRevealPopupTriggeredAt && p.roleRevealPopupTriggeredAt !== processedRoleRevealsRef.current[p.id]) {
        // New popup triggered!
        processedRoleRevealsRef.current[p.id] = p.roleRevealPopupTriggeredAt;
        
        const role = allRoles.find(r => r.id === p.roleId);
        if (role) {
          setRoleRevealPopups(prev => [
            ...prev,
            {
              id: `${p.id}-${p.roleRevealPopupTriggeredAt}`,
              playerName: p.name,
              playerColor: p.color,
              roleName: role.name,
              roleImageUrl: role.imageUrl,
              roleColor: role.color
            }
          ]);
        }
      }
    });
  }, [roomPlayers, allRoles]);

  // Local timer for smartphone countdown
  useEffect(() => {
    if (!smartphoneCountdown?.isActive || smartphoneCountdown.remaining <= 0) return;

    const timer = setInterval(() => {
      setSmartphoneCountdown((prev: any) => {
        if (!prev || prev.remaining <= 0) {
          clearInterval(timer);
          return prev ? { ...prev, isActive: false } : null;
        }
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [smartphoneCountdown?.isActive, smartphoneCountdown?.duration]);

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
        try {
          const data = payload as SyncStatePayload;
          setLastSyncTime(Date.now());
          setIsNight(data.isNight || false);
          setCycleMode(data.cycleMode || 'dayNight');
          setDisplaySettings(data.displaySettings || null);
          setWiki(data.wiki || null);
          setSmartphoneCountdown((data as any).smartphoneCountdown || null);
          setTimer((data as any).timer || { minutes: 5, seconds: 0, isRunning: false });

          // Initial light mode from GM settings if not already toggled by user
          if (data.displaySettings?.wikiLightMode !== undefined) {
            setWikiLightMode(prev => prev || data.displaySettings.wikiLightMode);
          }

          setRoomData(data.room || null);
          setRoomLogs(data.logs || []);
          setCampaignJournal(data.campaignJournal || null);

          // Push custom popups to the global store so that CustomPopupOverlay can render them
          useVttStore.setState({
            customPopups: (data as any).customPopups || [],
            activeCustomPopupId: (data as any).activeCustomPopupId || null,
            activeGroupVote: (data as any).activeGroupVote || null,
            players: (data as any).players || [], // Sync players for CustomPopupOverlay targeting
            roles: (data as any).roles || [] // Sync roles for CustomPopupOverlay targeting
          });

          // Store all players for the selector BEFORE trying to find ourselves
          setRoomPlayers(data.players || []);

          // Store all roles for the Wiki
          setAllRoles(data.roles || []);

          // Store all teams for the Wiki
          setAllTeams(data.teams || []);

          // Store all tags for the Wiki
          setAllTags(data.tags || []);

          // Update notice board players
          const noticeBoard = data.players?.filter(p => p.publicNotes && p.publicNotesNoticeBoard) || [];
          setNoticeBoardPlayers(noticeBoard);

          // Normalize strings for comparison (remove accents & lowercase)
          const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

          // Find player by previously matched ID, OR by name
          let found = null;
          if (matchedPlayerIdRef.current && data.players) {
            found = data.players.find((p: any) => p.id === matchedPlayerIdRef.current);
          }
          if (!found && data.players) {
            const rawName = decodeURIComponent(playerName);
            const normalizedRaw = normalize(rawName);
            found = data.players.find((p: any) => normalize(p.name) === normalizedRaw);
            if (found) {
              matchedPlayerIdRef.current = found.id;
              // Track presence now that we know our ID (do not await to avoid blocking UI update)
              channel.track({ playerId: found.id, name: found.name }).catch(console.error);
            }
          }

          if (found) {
            setLocalPlayer(found);
            const role = data.roles?.find((r: any) => r.id === found.roleId);
            setLocalRole(role || null);

            const effectiveTeamId = role?.seenInTeamId || role?.teamId || found.teamId;
            const team = data.teams?.find((t: any) => t.id === effectiveTeamId);
            setLocalTeam(team || null);

            // Extract handout images from tags
            const newHandouts: { id: string; url: string; name: string }[] = [];
            if (data.handouts) {
              found.tags.forEach((tag: any) => {
                if (tag.handoutId) {
                  const handout = data.handouts.find((h: any) => h.id === tag.handoutId);
                  if (handout && handout.imageUrl) {
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
            if (matchedPlayerIdRef.current) {
              matchedPlayerIdRef.current = null;
              channel.untrack();
            }
          }
        } catch (e) {
          console.error('[VTT] Error processing sync_state:', e);
        }
      })
      .on('broadcast', { event: 'journal_update_public' }, ({ payload }) => {
        setCampaignJournal((prev: any) => ({
          ...(prev || {}),
          publicContent: payload.content ?? prev?.publicContent,
          lockHolderId: payload.lockHolderId ?? prev?.lockHolderId,
          lockHolderName: payload.lockHolderName ?? prev?.lockHolderName,
          lockExpiration: payload.lockExpiration ?? prev?.lockExpiration,
        }));
      })
      .on('broadcast', { event: 'journal_acquire_lock' }, ({ payload }) => {
        setCampaignJournal((prev: any) => ({
          ...(prev || {}),
          lockHolderId: payload.playerId,
          lockHolderName: payload.playerName,
          lockExpiration: Date.now() + 5 * 60 * 1000,
        }));
      })
      .on('broadcast', { event: 'journal_release_lock' }, ({ payload }) => {
        setCampaignJournal((prev: any) => {
          if (prev?.lockHolderId === payload.playerId) {
            return { ...prev, lockHolderId: null, lockHolderName: null, lockExpiration: null };
          }
          return prev;
        });
      })
      .on('broadcast', { event: 'journal_update_permission' }, ({ payload }) => {
        setCampaignJournal((prev: any) => ({
          ...(prev || {}),
          permission: payload.permission,
        }));
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

          // Retry every 2 seconds until we are matched by the host
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
          }, 2000);

          // Detect if sync_state never arrived: if after 6s lastSyncTime is still null, force re-request
          const syncTimeout = setTimeout(() => {
            if (!matchedPlayerIdRef.current) {
              console.warn('[VTT] No sync_state received after 6s, forcing re-request');
              channel.send({
                type: 'broadcast',
                event: 'get_state',
              }).catch(console.error);
            }
          }, 6000);

          // Store interval ID for cleanup on unmount
          return () => {
            clearInterval(retryInterval);
            clearTimeout(syncTimeout);
          };

        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false);
        }
      });

    return () => {
      if (supabase) supabase.removeChannel(channel);
    };
  }, [roomId, playerName]);

  const smartphoneTabs = displaySettings?.smartphoneTabs || { game: true, players: true, room: true, wiki: true, handouts: true, logs: true };
  const hasSelectedTabs = smartphoneTabs.game || smartphoneTabs.players || smartphoneTabs.room || smartphoneTabs.wiki || smartphoneTabs.handouts || smartphoneTabs.logs;
  
  // If no tabs are selected, we fallback to showing the game content ONLY (no tab bar will be rendered)
  const showGame = hasSelectedTabs ? (smartphoneTabs.game ?? true) : true;
  const showPlayers = hasSelectedTabs ? (smartphoneTabs.players ?? true) : false;
  const showRoom = hasSelectedTabs ? (smartphoneTabs.room ?? true) : false;
  const showWiki = hasSelectedTabs ? (smartphoneTabs.wiki ?? true) : false;
  const showHandouts = hasSelectedTabs ? (smartphoneTabs.handouts ?? true) : false;
  const showLogs = hasSelectedTabs ? (smartphoneTabs.logs ?? true) : false;

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
    return allTags.filter(t => t.visibleInWiki === true && !t.isSecret);
  }, [allTags]);

  useEffect(() => {
    if (activeTab === 'players' && !showPlayers) setActiveTab(showGame ? 'game' : (showRoom ? 'room' : 'wiki'));
    if (activeTab === 'room' && !showRoom) setActiveTab(showGame ? 'game' : (showPlayers ? 'players' : 'wiki'));
    if (activeTab === 'game' && !showGame) setActiveTab(showPlayers ? 'players' : (showRoom ? 'room' : 'wiki'));
    if (activeTab === 'wiki' && !showWiki) setActiveTab(showGame ? 'game' : (showPlayers ? 'players' : (showRoom ? 'room' : (showHandouts ? 'handouts' : 'logs'))));
    if (activeTab === 'handouts' && !showHandouts) setActiveTab(showGame ? 'game' : (showPlayers ? 'players' : (showRoom ? 'room' : (showWiki ? 'wiki' : 'logs'))));
    if (activeTab === 'logs' && !showLogs) setActiveTab(showGame ? 'game' : (showPlayers ? 'players' : (showRoom ? 'room' : (showWiki ? 'wiki' : 'handouts'))));
  }, [showGame, showPlayers, showRoom, showWiki, showHandouts, showLogs, activeTab]);

  const smartphoneOptions = displaySettings?.smartphonePlayersOptions || { 
    allowPrivateNotes: true, 
    showDeadPlayers: true, 
    includeSelf: true,
    allowNotesForDeadPlayers: true,
    showNotePreview: true
  };

  const handleAcquireJournalLock = () => {
    if (!localPlayer || !channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'journal_acquire_lock',
      payload: {
        playerId: localPlayer.id,
        playerName: localPlayer.name
      }
    });
  };

  const handleReleaseJournalLock = () => {
    if (!localPlayer || !channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'journal_release_lock',
      payload: {
        playerId: localPlayer.id
      }
    });
    setIsEditingJournal(false);
  };

  const handleUpdateJournalContent = (newContent: string) => {
    setLocalJournalContent(newContent);
    if (!localPlayer || !channelRef.current) return;
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      channelRef.current.send({
        type: 'broadcast',
        event: 'journal_update_public',
        payload: {
          playerId: localPlayer.id,
          playerName: localPlayer.name,
          content: newContent
        }
      });
    }, 300);
  };

  const insertJournalMarkdown = (format: 'bold' | 'italic' | 'list') => {
    const textarea = journalTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    
    let formatted = '';
    if (format === 'bold') {
      formatted = `**${selected || 'texte'}**`;
    } else if (format === 'italic') {
      formatted = `*${selected || 'texte'}*`;
    } else if (format === 'list') {
      if (selected.includes('\n')) {
        formatted = selected.split('\n').map(line => line.startsWith('- ') ? line : `- ${line}`).join('\n');
      } else {
        formatted = `- ${selected || 'élément'}`;
      }
    }

    const newValue = text.substring(0, start) + formatted + text.substring(end);
    handleUpdateJournalContent(newValue);

    setTimeout(() => {
      textarea.focus();
      const offset = format === 'list' ? 2 : (format === 'bold' ? 2 : 1);
      if (selected) {
        textarea.setSelectionRange(start, start + formatted.length);
      } else {
        const wordLen = format === 'bold' ? 5 : (format === 'italic' ? 5 : 7);
        textarea.setSelectionRange(start + offset, start + offset + wordLen);
      }
    }, 0);
  };

  const handleSaveProfile = () => {
    if (!localPlayer || !channelRef.current) return;
    const updates: any = {};
    if (profileEditName && profileEditName !== localPlayer.name) {
      updates.name = profileEditName;
    }
    if (profileEditColor && profileEditColor !== localPlayer.color) {
      updates.color = profileEditColor;
    }
    if (profileEditImageUrl !== undefined && profileEditImageUrl !== localPlayer.imageUrl) {
      updates.imageUrl = profileEditImageUrl;
    }
    if (Object.keys(updates).length > 0) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'update_player_profile',
        payload: { playerId: localPlayer.id, updates }
      });
    }
    setShowProfileEditor(false);
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
      {/* Countdown Overlay */}
      {smartphoneCountdown?.isActive && smartphoneCountdown.remaining > 0 && (
        <div className="fixed top-20 left-4 right-4 z-[200] bg-zinc-900/95 backdrop-blur-md border border-indigo-500/50 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-top-10 duration-500 ring-1 ring-white/5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Action en cours</span>
              </div>
              <div className="flex items-center gap-1.5 text-indigo-300 font-mono font-bold text-lg">
                <Clock size={16} />
                {Math.floor(smartphoneCountdown.remaining / 60)}:{(smartphoneCountdown.remaining % 60).toString().padStart(2, '0')}
              </div>
            </div>
            {smartphoneCountdown.message && (
              <p className="text-sm font-bold text-white leading-tight">{smartphoneCountdown.message}</p>
            )}
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-1">
              <div 
                className="h-full bg-indigo-500 transition-all duration-1000 ease-linear"
                style={{ width: `${(smartphoneCountdown.remaining / smartphoneCountdown.duration) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6 z-10">
        <div className="flex flex-col">
          <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Salle : {roomId}</span>
          <div className="flex items-center gap-2 mt-1">
            {localPlayer && (
              <div 
                className={`shrink-0 ${localPlayer.shape === 'circle' ? 'rounded-full' : 'rounded-sm'}`}
                style={{ 
                  width: '1.2rem', 
                  height: '1.2rem', 
                  backgroundColor: localPlayer.color || '#3b82f6',
                  border: '1px solid rgba(255,255,255,0.3)',
                  clipPath: localPlayer.shape === 'pentagon' ? 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' :
                            localPlayer.shape === 'hexagon' ? 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' :
                            localPlayer.shape === 'star' ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' : 
                            localPlayer.shape === 'werewolfCard' ? 'polygon(36% 36%, 38% 22%, 44% 10%, 55% 2%, 61% 8%, 63% 18%, 62% 28%, 64% 36%, 78% 38%, 90% 44%, 98% 55%, 92% 61%, 82% 63%, 72% 62%, 64% 64%, 62% 78%, 56% 90%, 45% 98%, 39% 92%, 37% 82%, 38% 72%, 36% 64%, 22% 62%, 10% 56%, 2% 45%, 8% 39%, 18% 37%, 28% 38%)' : 
                            'none'
                }}
              />
            )}
            <h2 className="text-xl font-bold tracking-tight text-white truncate max-w-[200px]">{decodeURIComponent(playerName || 'Joueur')}</h2>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {localPlayer && (
            <button
              onClick={() => {
                setProfileEditName(localPlayer.name || '');
                setProfileEditColor(localPlayer.color || '#3b82f6');
                setProfileEditImageUrl(localPlayer.imageUrl || '');
                setShowProfileEditor(true);
              }}
              className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-full transition-colors"
              title="Modifier mon profil"
            >
              <Edit2 size={18} />
            </button>
          )}
          <button
            onClick={() => navigate('/join')}
            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
            title="Quitter la salle"
          >
            <LogOut size={20} />
          </button>
        </div>
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
        <div className={`flex-1 flex flex-col gap-6 z-10 ${activeTab === 'game' && (displaySettings?.showTimerOnSmartphone === true) ? 'pb-44' : 'pb-20'} overflow-y-auto custom-scrollbar pr-2`}>
          
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

          {localPlayer.isSmartphoneLocked && (
            <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md z-[200] flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-500">
               <div className="w-24 h-24 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(217,70,239,0.2)] animate-in zoom-in duration-700">
                 <icons.Lock size={40} className="text-fuchsia-500" />
               </div>
               <h3 className="text-2xl font-black uppercase tracking-tighter text-white mb-2 italic tracking-[0.1em]">Interface Verrouillée</h3>
               <p className="text-xs text-zinc-500 max-w-[220px] leading-relaxed uppercase font-bold tracking-widest opacity-60">
                 Le Maître du Jeu a temporairement suspendu l'accès à votre interface.
               </p>
               <div className="mt-12 flex gap-1 items-center">
                  <div className="w-1 h-1 rounded-full bg-fuchsia-500 animate-pulse" />
                  <div className="w-1 h-1 rounded-full bg-fuchsia-500 animate-pulse delay-75" />
                  <div className="w-1 h-1 rounded-full bg-fuchsia-500 animate-pulse delay-150" />
               </div>
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
                    
                    {/* Pastilles Overlay */}
                    {((localPlayer.selectionPastilles && localPlayer.selectionPastilles.length > 0) || (localPlayer.actionPastilles && localPlayer.actionPastilles.length > 0)) && (
                      <div className="absolute top-1 right-1 flex flex-col gap-1 z-20">
                        {(localPlayer.selectionPastilles || []).map((p, idx) => {
                          const PIcon = (icons as any)[p.icon] || TagIcon;
                          return (
                            <div
                              key={`sel-${p.id}-${idx}`}
                              className="w-6 h-6 rounded-full border-2 border-zinc-900 shadow-lg flex items-center justify-center bg-zinc-950 animate-in zoom-in-50 duration-300"
                              style={{ borderColor: p.color }}
                              title={p.name}
                            >
                              <PIcon size={12} style={{ color: p.color }} />
                            </div>
                          );
                        })}
                        {(localPlayer.actionPastilles || []).map((p, idx) => {
                          const PIcon = (icons as any)[p.icon] || TagIcon;
                          return (
                            <div
                              key={`act-${p.id}-${idx}`}
                              className="w-6 h-6 rounded-full border-2 border-zinc-900 shadow-lg flex items-center justify-center bg-zinc-950 animate-in zoom-in-50 duration-300 relative group"
                              style={{ borderColor: p.color }}
                            >
                              <PIcon size={12} style={{ color: p.color }} />
                              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-zinc-900 text-white text-[10px] font-bold px-2 py-1 rounded border border-zinc-700 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                                {p.id}
                              </div>
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
                      className="inline-flex items-center justify-center px-3 py-1 rounded-full mt-3 border bg-zinc-950/50 gap-2"
                      style={{ borderColor: `${localTeam.color}40`, color: localTeam.color }}
                    >
                      {localTeam.imageUrl ? (
                        <img src={localTeam.imageUrl} className="w-3 h-3 rounded-full object-cover" alt="" />
                      ) : (
                        (icons as any)[localTeam.icon] && React.createElement((icons as any)[localTeam.icon], { size: 12 })
                      )}
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
            const playerTags = localPlayer.tags.filter(t => t.showOnSmartphone && !t.isSecret);
            const roleTags = (localRole?.tags || []).filter((t: any) => t.showOnSmartphone && !t.isSecret);
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
                          {p.isRoleRevealedInSmartphonePlayers && p.roleId && (
                            <span className="text-xs font-bold mt-0.5 drop-shadow-sm" style={{ color: allRoles.find(r => r.id === p.roleId)?.color || '#fff' }}>
                              Rôle révélé : {allRoles.find(r => r.id === p.roleId)?.name}
                            </span>
                          )}
                          {p.isDead && <span className="text-[10px] font-bold text-red-900/70 uppercase tracking-widest leading-none mt-1">Mort</span>}
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
            <div className="flex-1 flex flex-col gap-4 py-2 overflow-hidden h-full relative">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Miniature de la salle</h3>
                <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-widest">Vue d'ensemble en temps réel</p>
              </div>

              {localPlayer?.isBlinded && (
                <div className="absolute inset-x-0 bottom-0 top-14 bg-zinc-950/95 backdrop-blur-md z-50 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
                  <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-2xl">
                    <icons.EyeOff size={32} className="text-zinc-600 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tighter text-zinc-200 mb-2 italic">Cécité</h3>
                  <p className="text-[10px] text-zinc-500 max-w-[180px] leading-relaxed uppercase font-bold tracking-widest text-center opacity-60">
                    Vous ne distinguez plus rien. La salle est plongée dans l'obscurité.
                  </p>
                </div>
              )}

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
                          className={`absolute ${(p.id === localPlayer?.id ? displaySettings?.roomMiniatureSelfAnimation : displaySettings?.roomMiniatureAnimation) !== false ? 'transition-all duration-700' : ''}`}
                          style={{ left: `${leftPct}%`, top: `${topPct}%`, transform: 'translate(-50%, -50%)', zIndex: p.isRoleRevealedInSmartphoneRoom ? 20 : 10 }}
                        >
                          {p.isRoleRevealedInSmartphoneRoom && (
                             <div className="absolute inset-[-10px] rounded-full border-2 border-dashed animate-spin-slow opacity-80" style={{ borderColor: p.color, animationDuration: '4s' }} />
                          )}
                          {p.isRoleRevealedInSmartphoneRoom && (
                             <div className="absolute inset-[-4px] bg-white/30 blur-[4px] rounded-full animate-pulse" />
                          )}
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
                                className={`w-[30px] h-[30px] object-contain ${displaySettings?.roomMiniatureSelfAnimation !== false ? 'animate-pulse' : ''}`}
                                style={{ filter: `drop-shadow(0 0 5px ${p.color})` }}
                              />
                            ) : (
                              <div
                                className={(p.id === localPlayer?.id ? displaySettings?.roomMiniatureSelfAnimation : displaySettings?.roomMiniatureAnimation) !== false ? 'animate-pulse' : ''}
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

              {/* Revealed Cards Below Miniature */}
              {roomPlayers.some(p => p.isRoleRevealedInSmartphoneRoom) && (
                <div className="shrink-0 mt-2 p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3 text-center">Rôles Révélés</h4>
                  <div className="flex gap-4 overflow-x-auto pb-2 snap-x custom-scrollbar">
                    {roomPlayers.filter(p => p.isRoleRevealedInSmartphoneRoom).map(p => {
                      const role = allRoles.find(r => r.id === p.roleId);
                      return (
                        <div key={`reveal-${p.id}`} className="snap-center shrink-0 flex flex-col items-center gap-1.5 w-20">
                           <div className="text-[10px] font-bold truncate w-full text-center" style={{ color: p.color }}>{p.name}</div>
                           <div className="w-20 h-28 bg-zinc-950 rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.5)] border-2 overflow-hidden flex flex-col items-center justify-center relative animate-in slide-in-from-bottom-4" style={{ borderColor: role?.color || '#fff' }}>
                              {role?.imageUrl ? (
                                <img src={role.imageUrl} alt={role?.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[9px] font-bold text-center px-1 leading-tight break-words" style={{ color: role?.color || '#fff' }}>{role?.name}</span>
                              )}
                           </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {(activeTab === 'wiki' && showWiki) && (
            <div className="flex-1 flex flex-col gap-6 py-2 pb-10">
              {/* Search bar */}
              <div className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-sm py-2 border-b border-zinc-800">
                <div className="relative">
                  <icons.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                  <input
                    type="text"
                    placeholder="Rechercher dans le wiki..."
                    value={wikiSearchTerm}
                    onChange={(e) => setWikiSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-900/50 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-100 placeholder:text-zinc-600"
                  />
                </div>
              </div>

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
                                           <div className="flex items-center gap-1.5 mt-0.5">
                                             {team.imageUrl ? (
                                               <img src={team.imageUrl} className="w-2.5 h-2.5 rounded-full object-cover" alt="" />
                                             ) : (
                                               (icons as any)[team.icon] && React.createElement((icons as any)[team.icon], { size: 10, style: { color: team.color } })
                                             )}
                                             <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: team.color }}>
                                                {team.name}
                                             </span>
                                           </div>
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
              
              {/* Part 3.5: Teams Guide */}
              {(displaySettings?.showWikiTeams !== false) && (
              <section className="flex flex-col gap-3 mt-4">
                 <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                    <button 
                       onClick={() => setIsWikiTeamsOpen(!isWikiTeamsOpen)}
                       className="flex items-center gap-2 flex-1 text-left"
                    >
                       <icons.Flag size={18} className="text-amber-400" />
                       <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-100 italic">Guide des Équipes</h3>
                       {isWikiTeamsOpen ? <icons.ChevronUp size={16} className="text-zinc-600" /> : <icons.ChevronDown size={16} className="text-zinc-600" />}
                    </button>
                 </div>
                 
                 {isWikiTeamsOpen && (
                   <div className="flex flex-col gap-3 animate-in slide-in-from-top-2">
                     {allTeams && allTeams.length > 0 ? (
                        allTeams.map(team => (
                           <div 
                              key={team.id} 
                              className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden p-4 flex flex-col gap-3"
                           >
                              <div className="flex items-center gap-3">
                                <div 
                                   className="w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0"
                                   style={{ borderColor: team.color + '60', backgroundColor: team.color + '15' }}
                                >
                                   {team.imageUrl ? (
                                     <img src={team.imageUrl} className="w-full h-full rounded-full object-cover" alt="" />
                                   ) : (
                                     (() => {
                                       const TeamIcon = (icons as any)[team.icon] || (icons as any).Users;
                                       return <TeamIcon size={18} style={{ color: team.color }} />;
                                     })()
                                   )}
                                </div>
                                <span className="font-bold text-zinc-100 text-lg" style={{ color: team.color }}>{team.name}</span>
                              </div>
                              {team.description && (
                                <p className="text-sm text-zinc-300 italic leading-relaxed whitespace-pre-wrap pl-1 border-l-2 border-zinc-800">
                                  {team.description}
                                </p>
                              )}
                           </div>
                        ))
                     ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-zinc-600 gap-2 grayscale">
                           <icons.Flag size={40} className="opacity-20" />
                           <p className="text-xs font-bold uppercase tracking-tighter opacity-30">Aucune équipe définie...</p>
                        </div>
                     )}
                   </div>
                 )}
              </section>
              )}

              {/* Part 4: Tags Guide */}
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

          {activeTab === 'journal' && (
            <div className="flex-1 flex flex-col gap-4 py-2 pb-10 overflow-hidden h-full">
              <div className="flex flex-col gap-1 px-1">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-505">Journal de Campagne</h3>
                <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-widest">Collaboratif & Persistant</p>
              </div>

              {!campaignJournal || campaignJournal.permission === 'hidden' ? (
                <div className="flex-1 bg-zinc-900/40 rounded-3xl border border-zinc-800/60 p-6 flex flex-col items-center justify-center text-center">
                  <icons.BookOpen size={40} className="text-zinc-700 mb-2 animate-pulse" />
                  <p className="text-sm text-zinc-500 italic">Le journal est actuellement masqué par le Maître du Jeu.</p>
                </div>
              ) : (
                <div className="flex-1 bg-zinc-900/40 rounded-3xl border border-zinc-800/60 overflow-hidden flex flex-col min-h-0">
                  {/* Status Bar */}
                  <div className="p-3 bg-zinc-900/60 border-b border-zinc-800/80 flex items-center justify-between gap-2 text-xs">
                    {campaignJournal.permission === 'editable' ? (
                      campaignJournal.lockHolderId ? (
                        campaignJournal.lockHolderId === (localPlayer?.id || '') ? (
                          <span className="font-semibold text-amber-500 flex items-center gap-1">
                            <icons.Edit size={14} /> Vous modifiez le journal...
                          </span>
                        ) : (
                          <span className="text-red-400 font-semibold flex items-center gap-1">
                            <icons.Lock size={14} /> Verrouillé par {campaignJournal.lockHolderName}
                          </span>
                        )
                      ) : (
                        <span className="text-green-500 font-semibold flex items-center gap-1">
                          <icons.Unlock size={14} /> Journal disponible pour édition
                        </span>
                      )
                    ) : (
                      <span className="text-blue-400 font-semibold flex items-center gap-1">
                        <icons.Eye size={14} /> Lecture Seule
                      </span>
                    )}

                    {campaignJournal.permission === 'editable' && (
                      isEditingJournal ? (
                        <button
                          onClick={handleReleaseJournalLock}
                          className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors"
                        >
                          Enregistrer
                        </button>
                      ) : (
                        <button
                          disabled={!!campaignJournal.lockHolderId}
                          onClick={handleAcquireJournalLock}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-bold rounded-lg transition-colors"
                        >
                          Modifier
                        </button>
                      )
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {isEditingJournal ? (
                      <div className="flex flex-col gap-2 h-full min-h-[250px]">
                        {/* Editor Toolbar */}
                        <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-lg">
                          <button
                            onClick={() => insertJournalMarkdown('bold')}
                            className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200"
                            title="Gras"
                          >
                            <icons.Bold size={15} />
                          </button>
                          <button
                            onClick={() => insertJournalMarkdown('italic')}
                            className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200"
                            title="Italique"
                          >
                            <icons.Italic size={15} />
                          </button>
                          <button
                            onClick={() => insertJournalMarkdown('list')}
                            className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200"
                            title="Liste à puces"
                          >
                            <icons.List size={15} />
                          </button>
                        </div>
                        <textarea
                          ref={journalTextareaRef}
                          value={localJournalContent}
                          onChange={(e) => handleUpdateJournalContent(e.target.value)}
                          placeholder="Rédigez le journal de campagne ici... Utilisez le Markdown simple ou les boutons ci-dessus."
                          className="w-full flex-1 bg-transparent border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none min-h-[200px]"
                        />
                      </div>
                    ) : (
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none break-words select-text text-zinc-200 leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: renderMarkdown(campaignJournal.publicContent) || '<em class="text-zinc-600">Aucune note pour le moment.</em>'
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="flex-1 flex flex-col gap-4 py-2 pb-10 overflow-hidden h-full">
              <div className="flex flex-col gap-1 px-1">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Journal de la partie</h3>
                <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-widest">Historique des événements</p>
              </div>
              <div className="flex-1 bg-zinc-900/40 rounded-3xl border border-zinc-800/60 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-3">
                {roomLogs && roomLogs.length > 0 ? (
                  roomLogs.slice().reverse().map((log: any) => {
                    let badgeClass = 'bg-zinc-800 text-zinc-500';
                    let dotColor = 'bg-zinc-500';
                    
                    if (log.type === 'system') {
                      badgeClass = 'bg-zinc-800 text-zinc-500';
                      dotColor = 'bg-blue-500';
                    } else if (log.type === 'death') {
                      badgeClass = 'bg-red-500/20 text-red-400';
                      dotColor = 'bg-red-500';
                    } else if (log.type === 'action') {
                      badgeClass = 'bg-amber-500/20 text-amber-400';
                      dotColor = 'bg-amber-500';
                    } else if (log.type === 'role') {
                      badgeClass = 'bg-emerald-500/20 text-emerald-400';
                      dotColor = 'bg-emerald-500';
                    } else if (log.type === 'note') {
                      badgeClass = 'bg-purple-500/20 text-purple-400';
                      dotColor = 'bg-purple-500';
                    } else if (log.type === 'info') {
                      badgeClass = 'bg-blue-500/20 text-blue-400';
                      dotColor = 'bg-blue-500';
                    }
                    
                    return (
                      <div key={log.id} className="flex gap-2 items-start animate-in fade-in slide-in-from-left-2 duration-300">
                        <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${badgeClass}`}>
                              {log.type}
                            </span>
                            <span className="text-[8px] font-medium text-zinc-700">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-300 leading-relaxed pl-1 border-l-2 border-zinc-800">
                            {log.message}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-zinc-700 italic gap-3 opacity-30">
                    <icons.MessageSquare size={48} strokeWidth={1} />
                    <span className="text-xs uppercase tracking-[0.2em] font-bold">Le journal est vide</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col gap-4 py-2 pb-10 overflow-hidden h-full">
              <div className="flex flex-col gap-1 px-1">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Messagerie</h3>
                <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-widest">Messages du MJ</p>
              </div>
              <div className="flex-1 bg-zinc-900/40 rounded-3xl border border-zinc-800/60 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-3">
                {chatMessages && chatMessages.length > 0 ? (
                  chatMessages.slice().reverse().map((msg: any) => (
                    <div key={msg.id} className="flex gap-2 items-start animate-in fade-in slide-in-from-left-2 duration-300">
                      <div className="mt-1.5 w-2 h-2 rounded-full shrink-0 bg-blue-500" />
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                            {msg.senderName || 'MJ'}
                          </span>
                          <span className="text-[8px] font-medium text-zinc-700">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 break-words">{msg.text}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-zinc-700 italic gap-3 opacity-30">
                    <icons.MessageSquare size={48} strokeWidth={1} />
                    <span className="text-xs uppercase tracking-[0.2em] font-bold">Aucun message</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Timer Banner */}
      {activeTab === 'game' && isConnected && localPlayer && displaySettings?.showTimerOnSmartphone === true && (
        <div className="fixed bottom-24 left-0 right-0 px-6 z-[50] animate-in slide-in-from-bottom-10 duration-700">
          <div className="bg-zinc-900/90 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center transition-all duration-500 ${timer.isRunning ? 'scale-110 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : ''}`}>
                <icons.Clock size={24} className={`text-amber-500 transition-all duration-500 ${timer.isRunning ? 'animate-pulse' : 'opacity-40'}`} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-0.5">Temps restant</span>
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-black font-mono tracking-tighter transition-colors duration-500 ${timer.isRunning ? 'text-amber-500' : 'text-zinc-600'}`}>
                    {String(timer.minutes).padStart(2, '0')}:{String(timer.seconds).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>
            {timer.isRunning && (
              <div className="relative flex items-center justify-center w-6 h-6 mr-2">
                <div className="absolute inset-0 bg-amber-500 rounded-full animate-ping opacity-20" />
                <div className="w-2.5 h-2.5 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      {isConnected && localPlayer && (showGame || showPlayers || showRoom || showWiki || showHandouts || showLogs) && (
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

          {showHandouts && (
          <button 
            onClick={() => setActiveTab('handouts')}
            className={`flex flex-col items-center justify-center gap-1.5 flex-1 h-full transition-all duration-300 ${activeTab === 'handouts' ? 'text-blue-500 scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            <div className={`p-2 rounded-xl transition-colors ${activeTab === 'handouts' ? 'bg-blue-500/10' : 'bg-transparent'}`}>
              <icons.Image size={22} strokeWidth={activeTab === 'handouts' ? 2.5 : 2} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-[0.15em] transition-opacity ${activeTab === 'handouts' ? 'opacity-100' : 'opacity-40'}`}>Docs</span>
          </button>
          )}

          {showLogs && (
          <button 
            onClick={() => setActiveTab('logs')}
            className={`flex flex-col items-center justify-center gap-1.5 flex-1 h-full transition-all duration-300 ${activeTab === 'logs' ? 'text-blue-500 scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            <div className={`p-2 rounded-xl transition-colors ${activeTab === 'logs' ? 'bg-blue-500/10' : 'bg-transparent'}`}>
              <icons.MessageSquare size={22} strokeWidth={activeTab === 'logs' ? 2.5 : 2} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-[0.15em] transition-opacity ${activeTab === 'logs' ? 'opacity-100' : 'opacity-40'}`}>Journal</span>
          </button>
          )}

          {campaignJournal && campaignJournal.permission !== 'hidden' && (
          <button
            onClick={() => setActiveTab('journal')}
            className={`flex flex-col items-center justify-center gap-1.5 flex-1 h-full transition-all duration-300 ${activeTab === 'journal' ? 'text-amber-500 scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            <div className={`p-2 rounded-xl transition-colors ${activeTab === 'journal' ? 'bg-amber-500/10' : 'bg-transparent'}`}>
              <icons.BookOpen size={22} strokeWidth={activeTab === 'journal' ? 2.5 : 2} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-[0.15em] transition-opacity ${activeTab === 'journal' ? 'opacity-100' : 'opacity-40'}`}>Campagne</span>
          </button>
          )}

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex flex-col items-center justify-center gap-1.5 flex-1 h-full transition-all duration-300 ${activeTab === 'chat' ? 'text-blue-500 scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            <div className={`p-2 rounded-xl transition-colors relative ${activeTab === 'chat' ? 'bg-blue-500/10' : 'bg-transparent'}`}>
              <icons.MessageSquare size={22} strokeWidth={activeTab === 'chat' ? 2.5 : 2} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-[0.15em] transition-opacity ${activeTab === 'chat' ? 'opacity-100' : 'opacity-40'}`}>Messages</span>
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

      {/* Poll / Choice Modal */}
      {localPlayer?.activePoll && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center p-6 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-500">
           <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
              <div className="p-5 bg-gradient-to-b from-zinc-800 to-zinc-900 border-b border-zinc-800 flex flex-col gap-1">
                 <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
                       <icons.HelpCircle size={14} className="text-blue-400" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Question du MJ</span>
                 </div>
                 <h3 className="text-xl font-black text-white leading-tight italic">{localPlayer.activePoll.question}</h3>
              </div>
              <div className="p-5 flex flex-col gap-3">
                 {localPlayer.activePoll.options.map((option, idx) => (
                    <button
                       key={`${localPlayer.activePoll?.id}-${idx}`}
                       onClick={() => {
                          if (channelRef.current && localPlayer) {
                             channelRef.current.send({
                                type: 'broadcast',
                                event: 'poll_response',
                                payload: {
                                   playerId: localPlayer.id,
                                   playerName: localPlayer.name,
                                   pollId: localPlayer.activePoll?.id,
                                   question: localPlayer.activePoll?.question,
                                   response: option
                                }
                             });
                             // Clear locally
                             setLocalPlayer({ ...localPlayer, activePoll: null });
                          }
                       }}
                       className="w-full bg-zinc-800 hover:bg-blue-600/20 hover:border-blue-500/50 border border-zinc-700 rounded-2xl py-4 px-5 text-left transition-all group flex items-center justify-between"
                    >
                       <span className="font-bold text-zinc-100 group-hover:text-blue-100 transition-colors">{option}</span>
                       <icons.ChevronRight size={18} className="text-zinc-600 group-hover:text-blue-400 transition-colors" />
                    </button>
                 ))}
              </div>
              <div className="px-5 py-3 bg-zinc-950/50 border-t border-zinc-800 flex items-center justify-center">
                 <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest opacity-40 italic">Une seule réponse possible</p>
              </div>
           </div>
        </div>
      )}

      {/* Group Vote Popup */}
      {(isGroupVoter && activeGroupVote) && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="relative w-full max-w-sm bg-zinc-900 border-2 border-fuchsia-500/50 rounded-3xl shadow-[0_0_50px_rgba(217,70,239,0.2)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-500 max-h-[80vh]">
              <div className="p-5 bg-zinc-950/50 border-b border-zinc-800 flex flex-col items-center gap-2">
                 <icons.Users size={32} className="text-fuchsia-500" />
                 <h3 className="text-xl font-black text-center text-white">{activeGroupVote.question}</h3>
                 <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest text-center mt-1">Vote de groupe en temps réel</p>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 bg-zinc-900/50">
                 {roomPlayers.filter(p => {
                    const isDead = p.isDead;
                    const isVoter = activeGroupVote.allowedVoterIds.includes(p.id);
                    const shouldExclude = activeGroupVote.excludeVoters && isVoter;
                    return !isDead && !shouldExclude;
                  }).map(player => {
                    const votesForThisPlayer = Object.entries(activeGroupVote.votes).filter(([_, targetId]) => targetId === player.id).map(([voterId, _]) => {
                      const voter = roomPlayers.find(vp => vp.id === voterId);
                      return voter?.name || 'Inconnu';
                    });
                    
                    const isVoterPlayer = activeGroupVote.allowedVoterIds.includes(player.id);
                    const playerNameColor = (activeGroupVote.hideVoters) ? '#ffffff' : (isVoterPlayer ? (activeGroupVote.votersRoleColor || '#ef4444') : '#ffffff');
                    
                    const hasMyVote = activeGroupVote.votes[localPlayer?.id || ''] === player.id;

                    return (
                      <button
                        key={player.id}
                        onClick={() => {
                          if (localPlayer) {
                             channelRef.current?.send({
                                type: 'broadcast',
                                event: 'group_vote_response',
                                payload: { playerId: localPlayer.id, voteId: activeGroupVote.id, targetId: player.id }
                             }).catch(console.error);
                          }
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${hasMyVote ? 'bg-fuchsia-500/20 border-fuchsia-500/50' : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700'}`}
                      >
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-950 shrink-0">
                             {player.imageUrl ? <img src={player.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-zinc-800" />}
                           </div>
                           <span className="font-bold text-sm" style={{ color: playerNameColor }}>{player.name}</span>
                         </div>
                         {votesForThisPlayer.length > 0 && (
                           <div className="flex flex-col items-end gap-1 px-2 py-1 bg-zinc-950/50 rounded-lg">
                             <div className="flex items-center gap-1.5">
                               <span className="text-[10px] text-zinc-400 font-medium">Votes</span>
                               <span className="text-sm font-black text-fuchsia-400">{votesForThisPlayer.length}</span>
                             </div>
                             {!activeGroupVote.hideVoters && (
                               <div className="text-[8px] text-zinc-500 max-w-[100px] truncate text-right">
                                 {votesForThisPlayer.join(', ')}
                               </div>
                             )}
                           </div>
                         )}
                      </button>
                    )
                 })}
              </div>
               <div className="p-3 bg-zinc-950/80 border-t border-zinc-800">
                 {(() => {
                   const livingVoterIds = activeGroupVote.allowedVoterIds.filter(id => {
                     const p = roomPlayers.find(rp => rp.id === id);
                     return p && !p.isDead;
                   });
                   const allVoted = livingVoterIds.every(id => activeGroupVote.votes[id]);
                   const voteCounts = Object.values(activeGroupVote.votes).reduce((acc, tid) => {
                     acc[tid] = (acc[tid] || 0) + 1;
                     return acc;
                   }, {} as Record<string, number>);
                   const sorted = Object.values(voteCounts).sort((a, b) => b - a);
                   const hasTie = activeGroupVote.noTies && sorted.length > 1 && sorted[0] === sorted[1];
                   
                   if (activeGroupVote.mandatory && !allVoted) {
                     return (
                       <div className="w-full py-3 bg-zinc-800 text-zinc-500 font-black uppercase tracking-widest text-[10px] rounded-xl text-center border border-zinc-700/50 flex flex-col gap-1">
                          <span>En attente des autres votants...</span>
                          <span className="text-[8px] opacity-50">({Object.keys(activeGroupVote.votes).length} / {livingVoterIds.length})</span>
                       </div>
                     );
                   }

                   if (hasTie) {
                     return (
                       <div className="w-full py-3 bg-amber-900/20 text-amber-500 font-black uppercase tracking-widest text-[10px] rounded-xl text-center border border-amber-500/30 flex flex-col gap-1">
                          <span>Égalité détectée !</span>
                          <span className="text-[8px] opacity-70">Un vote décisif est nécessaire</span>
                       </div>
                     );
                   }

                   return (
                     <button
                       onClick={() => {
                          channelRef.current?.send({
                             type: 'broadcast',
                             event: 'close_group_vote',
                             payload: { voteId: activeGroupVote.id }
                          }).catch(console.error);
                       }}
                       className="w-full py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(217,70,239,0.3)]"
                     >
                       Valider le choix final
                     </button>
                   );
                 })()}
               </div>
            </div>
         </div>
      )}

      {/* Dice Result Popup */}
      {dicePopup && (
        <div className="absolute inset-0 z-[250] flex items-center justify-center p-6 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-300 pointer-events-none">
           <div className="relative w-full max-w-[280px] bg-zinc-900 border-2 border-amber-500/50 rounded-[40px] shadow-[0_0_50px_rgba(245,158,11,0.3)] flex flex-col items-center p-8 animate-in zoom-in-75 slide-in-from-bottom-10 duration-500 pointer-events-auto">
              <div className="absolute -top-6 bg-amber-500 text-zinc-950 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                 Lancer de {dicePopup.formula}
              </div>
              
              <div className="relative mb-4">
                 <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full animate-pulse" />
                 <icons.Dices size={64} className="text-amber-500 relative animate-bounce" style={{ animationDuration: '2s' }} />
              </div>

              <div className="flex flex-col items-center">
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-1">Résultat</span>
                 <span className="text-7xl font-black text-white tabular-nums drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                    {dicePopup.result}
                 </span>
              </div>

              <button 
                onClick={() => setDicePopup(null)}
                className="mt-8 w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-colors border border-zinc-700/50"
              >
                Fermer
              </button>
           </div>
        </div>
      )}

      {/* Particle Overlay */}
      {activeParticle && (
        <div className="absolute inset-0 z-[300] overflow-hidden pointer-events-none">
          {particles.map((p, i) => {
            let style: React.CSSProperties = {
              position: 'absolute',
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              animationTimingFunction: 'ease-out',
              animationFillMode: 'forwards'
            };

            let className = '';

            if (activeParticle.type === 'confetti') {
              const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#a855f7'];
              style.backgroundColor = colors[i % colors.length];
              style.width = `${p.size}px`;
              style.height = `${p.size}px`;
              style.top = '-20px';
              style.transform = `rotate(${p.rotate}deg)`;
              className = 'animate-particle-fall';
            } else if (activeParticle.type === 'blood') {
              style.backgroundColor = '#991b1b'; // red-800
              style.width = `${p.size}px`;
              style.height = `${p.size}px`;
              style.borderRadius = '50%';
              style.top = '50%';
              style.left = '50%';
              style.transform = `translate(-50%, -50%) scale(0)`;
              className = 'animate-particle-splatter';
              // add random spread for splatter
              (style as any)['--spread-x'] = `${p.spreadX}px`;
              (style as any)['--spread-y'] = `${p.spreadY}px`;
            } else if (activeParticle.type === 'magic') {
              style.backgroundColor = '#fde047'; // yellow-300
              style.boxShadow = '0 0 10px #fef08a';
              style.width = `${p.size / 2}px`;
              style.height = `${p.size / 2}px`;
              style.borderRadius = '50%';
              style.bottom = '-20px';
              className = 'animate-particle-float';
            } else if (activeParticle.type === 'fire') {
              style.background = 'linear-gradient(to top, #ea580c, #facc15)';
              style.width = `${p.size * 1.5}px`;
              style.height = `${p.size * 2}px`;
              style.borderRadius = '50% 50% 20% 20%';
              style.bottom = '-20px';
              style.filter = 'blur(2px)';
              className = 'animate-particle-fire';
            } else if (activeParticle.type === 'poison') {
              style.backgroundColor = '#22c55e'; // green-500
              style.boxShadow = 'inset 0 0 5px #14532d';
              style.width = `${p.size}px`;
              style.height = `${p.size}px`;
              style.borderRadius = '50%';
              style.bottom = '-20px';
              className = 'animate-particle-bubble';
            }

            return <div key={`${activeParticle.id}-${i}`} className={className} style={style} />;
          })}
          
          <style>{`
            @keyframes particle-fall {
              0% { transform: translateY(0) rotate(0deg); opacity: 1; }
              100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
            }
            .animate-particle-fall { animation-name: particle-fall; }

            @keyframes particle-splatter {
              0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
              50% { transform: translate(calc(-50% + var(--spread-x)), calc(-50% + var(--spread-y))) scale(1); opacity: 0.8; }
              100% { transform: translate(calc(-50% + var(--spread-x)), calc(100vh)) scale(0.5); opacity: 0; }
            }
            .animate-particle-splatter { animation-name: particle-splatter; }

            @keyframes particle-float {
              0% { transform: translateY(0) scale(1); opacity: 1; }
              50% { transform: translateY(-50vh) scale(1.5); opacity: 0.8; }
              100% { transform: translateY(-100vh) scale(0); opacity: 0; }
            }
            .animate-particle-float { animation-name: particle-float; }

            @keyframes particle-fire {
              0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 0.8; }
              50% { transform: translateY(-30vh) scale(1.2) rotate(10deg); opacity: 0.5; }
              100% { transform: translateY(-60vh) scale(0) rotate(-10deg); opacity: 0; }
            }
            .animate-particle-fire { animation-name: particle-fire; }

            @keyframes particle-bubble {
              0% { transform: translateY(0) scale(1); opacity: 0; }
              20% { transform: translateY(-20vh) scale(1.2); opacity: 0.6; }
              80% { transform: translateY(-80vh) scale(1.5); opacity: 0.4; }
              100% { transform: translateY(-100vh) scale(2); opacity: 0; }
            }
            .animate-particle-bubble { animation-name: particle-bubble; }
          `}</style>
        </div>
      )}

      {/* Role Reveal Popups */}
      {roleRevealPopups.map((popup, index) => (
        <div key={popup.id} className="absolute inset-0 z-[150] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-300" style={{ zIndex: 150 + index }}>
          <div className="relative w-full max-w-sm bg-zinc-900 border-2 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-75 slide-in-from-bottom-8 duration-500" style={{ borderColor: popup.roleColor || '#fff' }}>
            <div className="p-4 bg-zinc-950/50 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Rôle Révélé :</span>
                <span className="text-sm font-bold truncate" style={{ color: popup.playerColor }}>{popup.playerName}</span>
              </div>
              <button
                onClick={() => setRoleRevealPopups(prev => prev.filter(p => p.id !== popup.id))}
                title="Fermer"
                aria-label="Fermer"
                className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors"
              >
                <X size={20} className="text-zinc-400" />
              </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-900">
              <div className="w-40 h-56 rounded-xl shadow-2xl border-4 overflow-hidden mb-6 flex items-center justify-center relative bg-zinc-950" style={{ borderColor: popup.roleColor || '#fff' }}>
                {popup.roleImageUrl ? (
                   <img src={popup.roleImageUrl} alt={popup.roleName} className="w-full h-full object-cover" />
                ) : (
                   <span className="text-lg font-black uppercase text-center px-4 leading-tight" style={{ color: popup.roleColor || '#fff' }}>{popup.roleName}</span>
                )}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
              </div>
              <h3 className="text-2xl font-black text-center" style={{ color: popup.roleColor || '#fff' }}>{popup.roleName}</h3>
            </div>
            <div className="p-4 bg-zinc-950/50 border-t border-zinc-800">
              <button
                onClick={() => setRoleRevealPopups(prev => prev.filter(p => p.id !== popup.id))}
                className="w-full py-3 rounded-xl font-bold uppercase tracking-widest text-xs text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20 active:scale-95"
              >
                C'est noté !
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Profile Editor Modal */}
      {showProfileEditor && (
        <div className="fixed inset-0 bg-black/70 z-[300] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowProfileEditor(false)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit2 size={18} className="text-blue-500" /> Modifier mon profil
              </h3>
              <button onClick={() => setShowProfileEditor(false)} className="text-zinc-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5 block">Nom</label>
                <input
                  type="text"
                  value={profileEditName}
                  onChange={(e) => setProfileEditName(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Mon nom"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5 block">Couleur</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={profileEditColor}
                    onChange={(e) => setProfileEditColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono text-zinc-500">{profileEditColor}</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5 block">Photo de profil</label>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={profileEditImageUrl}
                    onChange={(e) => setProfileEditImageUrl(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="URL de l'image ou envoyez ci-dessous"
                  />
                  <label className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/60 hover:border-zinc-500 rounded-lg text-xs font-bold text-zinc-300 cursor-pointer transition-all select-none">
                    <icons.Upload size={14} className={isUploadingProfileImage ? 'animate-bounce' : ''} />
                    {isUploadingProfileImage ? 'Téléversement...' : 'Importer une image'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setIsUploadingProfileImage(true);
                        try {
                          const url = await uploadFileToStorage(file);
                          if (url) {
                            setProfileEditImageUrl(url);
                          } else {
                            alert("Échec du téléversement de l'image.");
                          }
                        } catch (err) {
                          console.error(err);
                          alert("Une erreur est survenue lors de l'envoi.");
                        } finally {
                          setIsUploadingProfileImage(false);
                        }
                      }}
                      disabled={isUploadingProfileImage}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              {localPlayer && (
                <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg">
                  <div
                    className="w-10 h-10 rounded-full border border-white/30 overflow-hidden shrink-0 flex items-center justify-center bg-zinc-800"
                    style={{ backgroundColor: profileEditColor }}
                  >
                    {profileEditImageUrl ? (
                      <img src={profileEditImageUrl} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <icons.UserCircle2 className="w-6 h-6 text-zinc-500" />
                    )}
                  </div>
                  <span className="text-sm font-bold text-white">{profileEditName || 'Joueur'}</span>
                </div>
              )}
            </div>
            <div className="p-4 bg-zinc-950/50 border-t border-zinc-800 flex gap-2">
              <button
                onClick={() => setShowProfileEditor(false)}
                className="flex-1 py-2.5 rounded-lg font-bold text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 py-2.5 rounded-lg font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 transition-colors"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
