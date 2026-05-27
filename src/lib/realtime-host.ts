import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { useVttStore } from '../store';
import { v4 as uuidv4 } from 'uuid';
import { getPlayerByName } from './utils/entity-lookups';
import { createOptimizedBroadcastPayload, BROADCAST_FIELDS } from './utils/state-diff';

let currentChannel: RealtimeChannel | null = null;
export const getChannel = () => currentChannel;

// Track if host channel is fully subscribed
let isHostSubscribed = false;

// Debounced version of forceBroadcastState to prevent spam
let broadcastTimeout: ReturnType<typeof setTimeout> | null = null;
const BROADCAST_DEBOUNCE_MS = 150; // Wait 150ms after last change before broadcasting

// Store last broadcasted state for diff computation
let lastBroadcastedState: Record<string, any> | null = null;

// Throttle for position updates (pan/zoom)
let lastPositionBroadcast = 0;
const POSITION_THROTTLE_MS = 500; // Max 2 position broadcasts per second

/**
 * Build the full state payload for broadcast
 */
const buildFullStatePayload = () => {
  const state = useVttStore.getState();
  const stripImage = (url: string | null | undefined) =>
    url && (url.startsWith('data:') || url.length > 500) ? null : url;

  return {
    players: state.players.map(p => ({
      ...p,
      imageUrl: stripImage(p.imageUrl),
    })),
    roles: state.roles.map(r => ({
      ...r,
      imageUrl: stripImage(r.imageUrl),
    })),
    teams: state.teams,
    tags: state.tags.map(t => ({
      ...t,
      imageUrl: (t as any).imageUrl ? stripImage((t as any).imageUrl) : undefined
    })),
    handouts: state.handouts.map(h => ({
      id: h.id, name: h.name, type: h.type, isOpen: h.isOpen,
      imageUrl: stripImage(h.imageUrl),
      referenceImageUrl: h.referenceImageUrl ? stripImage(h.referenceImageUrl) : undefined,
    })),
    soundboard: {
      remoteEnabled: state.soundboard?.remoteEnabled || false,
      remoteShowSounds: state.soundboard?.remoteShowSounds ?? true,
      remoteShowTasks: state.soundboard?.remoteShowTasks ?? true,
      remoteShowHandouts: state.soundboard?.remoteShowHandouts ?? true,
      remoteShowActions: state.soundboard?.remoteShowActions ?? true,
      remoteShowPlayers: state.soundboard?.remoteShowPlayers ?? false,
      remoteShowDeadPlayers: state.soundboard?.remoteShowDeadPlayers ?? false,
      remoteAllowPrivateNotes: state.soundboard?.remoteAllowPrivateNotes ?? false,
      cols: state.soundboard?.cols || 4,
      rows: state.soundboard?.rows || 3,
      buttons: state.soundboard.buttons.map(b => ({
        index: b.index, name: b.name, icon: b.icon,
        color: b.color, hasAudio: !!b.audioUrl,
        isOneShot: b.isOneShot, imageUrl: stripImage(b.imageUrl)
      }))
    },
    isNight: state.isNight,
    cycleMode: state.cycleMode,
    isPublicMode: state.isPublicMode,
    displaySettings: state.displaySettings,
    wiki: state.wiki,
    checklist: state.checklist,
    room: {
      ...state.room,
      backgroundImage: stripImage(state.room.backgroundImage),
    },
    customPopups: state.customPopups.map(p => ({
      ...p,
      imageUrl: stripImage(p.imageUrl)
    })),
    activeCustomPopupId: state.activeCustomPopupId,
    activeGroupVote: state.activeGroupVote,
    smartphoneCountdown: state.smartphoneCountdown,
    timer: state.timer,
    actions: state.actions.map(a => ({ id: a.id, name: a.name, enabled: a.enabled })),
    logs: (state.logs || []).slice(-100),
  };
};

/**
 * Send full state with retries to ensure delivery to newly connected players
 * Broadcasts 3 times: immediately, at 500ms, and at 1200ms
 */
export const sendFullStateWithRetry = () => {
  if (!currentChannel) {
    console.warn('[VTT] Cannot broadcast: no channel');
    return;
  }

  const payload = buildFullStatePayload();
  const playerCount = payload.players?.length || 0;
  const payloadSize = JSON.stringify(payload).length;
  console.log(`[VTT] Sending sync_state: ${playerCount} players, ${Math.round(payloadSize / 1024)}KB, channel: ${currentChannel.topic}`);
  if (payloadSize > 200_000) {
    console.warn(`[VTT] Broadcast payload is large: ${Math.round(payloadSize / 1024)}KB. Some images may have been stripped.`);
  }

  const doSend = (attempt: number) => {
    currentChannel!.send({
      type: 'broadcast',
      event: 'sync_state',
      payload: payload,
    }).then(() => {
      console.log(`[VTT] sync_state broadcast sent OK (attempt ${attempt + 1})`);
    }).catch(err => {
      console.error(`[VTT] Broadcast failed (attempt ${attempt + 1}):`, err);
    });
  };

  // Immediate send
  doSend(0);
  // Retry at 500ms
  setTimeout(() => doSend(1), 500);
  // Retry at 1200ms
  setTimeout(() => doSend(2), 1200);
  // Additional retry at 3s for safety
  setTimeout(() => doSend(3), 3000);

  // Update last broadcasted state for future diff computation
  lastBroadcastedState = { ...useVttStore.getState() } as Record<string, any>;
};

const broadcastStateInternal = (forceFull: boolean = false) => {
  if (!currentChannel || !isHostSubscribed) return;

  const state = useVttStore.getState();

  // Always send full state - diff-based broadcast was broken because
  // the player client only listens to 'sync_state', not 'sync_state_diff'
  const payload = buildFullStatePayload();

  const payloadSize = JSON.stringify(payload).length;
  if (payloadSize > 200_000) {
    console.warn(`[VTT] Broadcast payload is large: ${Math.round(payloadSize / 1024)}KB. Some images may have been stripped.`);
  }

  currentChannel.send({
    type: 'broadcast',
    event: 'sync_state',
    payload: payload,
  }).catch(err => console.error("Broadcast failed", err));

  // Store state for tracking (even though we always send full state)
  lastBroadcastedState = { ...state } as Record<string, any>;
  
  // Update last sync timestamp
  useVttStore.getState().setLastSyncTimestamp(Date.now());
};

/**
 * Broadcast state with debounce
 */
export const forceBroadcastState = () => {
  if (broadcastTimeout !== null) {
    clearTimeout(broadcastTimeout);
  }
  broadcastTimeout = setTimeout(() => broadcastStateInternal(false), BROADCAST_DEBOUNCE_MS);
};

/**
 * Immediate broadcast for critical updates (no debounce)
 */
export const forceBroadcastStateImmediate = () => {
  if (!isHostSubscribed) return;
  if (broadcastTimeout !== null) {
    clearTimeout(broadcastTimeout);
    broadcastTimeout = null;
  }
  broadcastStateInternal(true);
};

/**
 * Throttled broadcast for position updates (pan/zoom)
 * Prevents spamming during drag operations
 */
export const throttledPositionBroadcast = () => {
  const now = Date.now();
  if (now - lastPositionBroadcast < POSITION_THROTTLE_MS) {
    return; // Throttled
  }
  lastPositionBroadcast = now;
  forceBroadcastState();
};

export const initHostRealtime = (roomCode: string) => {
  if (!supabase) return;

  // Cleanup existing channel
  if (currentChannel) {
    supabase.removeChannel(currentChannel);
    currentChannel = null;
  }

  currentChannel = supabase.channel(`room:${roomCode}`, {
    config: { broadcast: { self: true, ack: false }, presence: { key: 'host' } },
  });

  currentChannel
    .on('broadcast', { event: 'join_request' }, ({ payload }) => {
      const { playerName } = payload;
      console.log(`[VTT] join_request received for: ${playerName}`);

      const state = useVttStore.getState();
      const existingPlayer = getPlayerByName(state.players, playerName);

      if (!existingPlayer) {
        if (state.isRoomPublic) {
          // Auto-add player to canvas at center
          const { panX, panY, zoom } = state.canvas;
          const centerX = (-panX + 500) / zoom;
          const centerY = (-panY + 400) / zoom;

          state.addPlayer({
            name: playerName,
            color: state.recentColors[Math.floor(Math.random() * state.recentColors.length)] || '#3b82f6',
            size: 40,
            x: centerX,
            y: centerY,
            roleId: null,
            teamId: null,
            isDead: false,
            tags: [],
          });
          state.addLog(`${playerName} a rejoint la partie.`, 'system');
          // Send state with retries so the newly added player receives it
          sendFullStateWithRetry();
        } else {
          // Private room logic - queue for approval
          console.log(`Private room: Join request queued for ${playerName}`);
          if (!state.joinRequests.includes(playerName)) {
            state.addJoinRequest(playerName);
          }
          // Still send state with retries so the waiting player can see "En attente" with debug info
          sendFullStateWithRetry();
        }
      } else {
        // Player exists, send state with retries so their client syncs immediately
        console.log(`[VTT] Player ${playerName} already exists, sending state with retry`);
        sendFullStateWithRetry();
      }
    })
    .on('broadcast', { event: 'get_state' }, () => {
      // Direct request from a player client to get current state (useful for late joiners)
      console.log('[VTT] get_state received, sending state with retry');
      sendFullStateWithRetry();
    })
    .on('broadcast', { event: 'smartphone_action' }, ({ payload }) => {
      const state = useVttStore.getState();
      if (payload.feedbackMessage && payload.feedbackMessage.trim() !== '') {
        state.setSmartphoneActionMessage({
          playerName: payload.playerName,
          message: payload.feedbackMessage,
        });
        state.addLog(`${payload.playerName} : ${payload.feedbackMessage}`, 'action');
      }

      // Find the tag info and handle pastilles
      let tagData: any = null;
      if (payload.tagInstanceId?.startsWith('role-tag-')) {
        const tagId = payload.tagInstanceId.replace('role-tag-', '');
        tagData = state.tags.find(t => t.id === tagId);
      } else {
        for (const p of state.players) {
          tagData = p.tags.find(t => t.instanceId === payload.tagInstanceId);
          if (tagData) break;
        }
        if (!tagData) {
          tagData = state.markers.find(m => m.tag.instanceId === payload.tagInstanceId)?.tag;
        }
      }

      // Prepare a map for all player updates to apply them in a single batch at the end
      const playerUpdatesMap: Record<string, any> = {};
      const getLatestPlayerTags = (pid: string) => {
        if (playerUpdatesMap[pid]?.tags) return playerUpdatesMap[pid].tags;
        return state.players.find(p => p.id === pid)?.tags || [];
      };
      const getLatestPlayerPastilles = (pid: string) => {
        if (playerUpdatesMap[pid]?.selectionPastilles) return playerUpdatesMap[pid].selectionPastilles;
        return state.players.find(p => p.id === pid)?.selectionPastilles || [];
      };

      if (tagData) {
        const pastilleId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
        const isSelector = !!tagData.isSinglePlayerSelector || !!tagData.isMultiPlayerSelector;
        
        // 1. Handle Selection Pastilles
        if (isSelector) {
          if (tagData.smartphoneShowPastille && payload.selectedPlayerIds && Array.isArray(payload.selectedPlayerIds) && payload.selectedPlayerIds.length > 0) {
            payload.selectedPlayerIds.forEach((pid: string) => {
              const target = state.players.find(p => p.id === pid);
              if (target) {
                const currentPastilles = getLatestPlayerPastilles(pid);
                playerUpdatesMap[pid] = {
                  ...playerUpdatesMap[pid],
                  selectionPastilles: [...currentPastilles, { id: pastilleId, icon: tagData.icon, color: tagData.color, name: tagData.name }]
                };
              }
            });
          }
        } else {
          if (payload.playerId) {
            const source = state.players.find(p => p.id === payload.playerId);
            if (source) {
              const currentPastilles = getLatestPlayerPastilles(source.id);
              playerUpdatesMap[source.id] = {
                ...playerUpdatesMap[source.id],
                selectionPastilles: [...currentPastilles, { id: pastilleId, icon: tagData.icon, color: tagData.color, name: tagData.name }]
              };
            }
          }
        }

        // 2. Handle Feedback / Info Reveal
        if (payload.smartphoneReturnInfo && payload.smartphoneReturnInfo !== 'none' && payload.selectedPlayerIds?.length > 0) {
          const infoMsg = payload.selectedPlayerIds.map((pid: string) => {
            const target = state.players.find(p => p.id === pid);
            if (!target) return null;
            
            let val = '';
            const infoType = payload.smartphoneReturnInfo;
            
            if (infoType === 'real_role') {
              const role = state.roles.find(r => r.id === target.roleId);
              val = role?.name || 'Sans Rôle';
            } else if (infoType === 'real_team') {
              const team = state.teams.find(t => t.id === target.teamId);
              val = team?.name || 'Sans Équipe';
            } else if (infoType === 'seen_role') {
              const role = state.roles.find(r => r.id === target.roleId);
              const tagSeenRole = target.tags.find(t => t.seenAsRoleId)?.seenAsRoleId || 
                                  (role?.tags || []).find(t => t.seenAsRoleId)?.seenAsRoleId;
              const seenRoleId = tagSeenRole || role?.seenAsRoleId || target.roleId;
              const seenRole = state.roles.find(r => r.id === seenRoleId);
              val = seenRole?.name || role?.name || 'Sans Rôle';
            } else if (infoType === 'seen_team') {
              const role = state.roles.find(r => r.id === target.roleId);
              const tagSeenTeam = target.tags.find(t => t.seenInTeamId)?.seenInTeamId ||
                                  (role?.tags || []).find(t => t.seenInTeamId)?.seenInTeamId;
              const teamId = tagSeenTeam || role?.seenInTeamId || role?.teamId || target.teamId;
              const team = state.teams.find(t => t.id === teamId);
              val = team?.name || 'Sans Équipe';
            }
            
            return `${target.name} : ${val}`;
          }).filter(Boolean).join('\n');

          if (infoMsg && currentChannel) {
            currentChannel.send({
              type: 'broadcast',
              event: 'feedback_popup',
              payload: { playerId: payload.playerId, message: infoMsg }
            });
          }
        }

        // 2.5 Handle Role Check
        if (tagData.smartphoneIsCheckRoleEnabled && tagData.smartphoneCheckRoleId && payload.selectedPlayerIds?.length > 0) {
          const checkRole = state.roles.find(r => r.id === tagData.smartphoneCheckRoleId);
          const roleName = checkRole?.name || 'ce rôle';
          let checkMsg = '';

          const matchingTargets = payload.selectedPlayerIds.map((pid: string) => state.players.find(p => p.id === pid))
            .filter((p: any) => p && p.roleId === tagData.smartphoneCheckRoleId);
          
          if (tagData.isMultiPlayerSelector) {
             if (tagData.smartphoneCheckRoleCount) {
               checkMsg = `${matchingTargets.length} joueur(s) possède(nt) le rôle ${roleName}.`;
             } else if (tagData.smartphoneCheckRoleVague) {
               checkMsg = matchingTargets.length > 0 
                 ? `Oui, un ou plusieurs joueurs ont le rôle ${roleName} dans cette sélection.` 
                 : `Non, aucun joueur n'a le rôle ${roleName} dans cette sélection.`;
             } else {
               checkMsg = payload.selectedPlayerIds.map((pid: string) => {
                 const target = state.players.find(p => p.id === pid);
                 if (!target) return null;
                 return target.roleId === tagData.smartphoneCheckRoleId 
                   ? (tagData.smartphonePlayerFeedback || "C'est exact !") 
                   : `Non, le joueur ${target.name} n'est pas ${roleName}.`;
               }).filter(Boolean).join('\n');
             }
          } else {
            const target = state.players.find(p => p.id === payload.selectedPlayerIds[0]);
            if (target) {
              checkMsg = target.roleId === tagData.smartphoneCheckRoleId 
                ? (tagData.smartphonePlayerFeedback || "C'est exact !") 
                : `Non, le joueur ${target.name} n'est pas ${roleName}.`;
            }
          }

          if (checkMsg && currentChannel) {
            currentChannel.send({
              type: 'broadcast',
              event: 'feedback_popup',
              payload: { playerId: payload.playerId, message: checkMsg }
            });
          }
        }

        // 3. Handle Tag Merging (Fusionner ce Tag aux joueurs sélectionnés)
        if (tagData.smartphoneMergeTagId) {
          const mergeModel = state.tags.find(t => t.id === tagData.smartphoneMergeTagId);
          if (mergeModel) {
            const targets = isSelector
              ? (payload.selectedPlayerIds || [])
              : [payload.playerId].filter(Boolean);
              
            targets.forEach((pid: string) => {
              const target = state.players.find(p => p.id === pid);
              if (target) {
                const newInstanceId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
                const currentTags = getLatestPlayerTags(pid);
                playerUpdatesMap[pid] = {
                  ...playerUpdatesMap[pid],
                  tags: [...currentTags, { ...mergeModel, instanceId: newInstanceId }]
                };
              }
            });
          }
        }

        // 4. Handle Self Tag Merging (Me fusionner ce Tag)
        if (tagData.smartphoneSelfMergeTagId) {
          const selfMergeModel = state.tags.find(t => t.id === tagData.smartphoneSelfMergeTagId);
          if (selfMergeModel && payload.playerId) {
            const sourcePlayer = state.players.find(p => p.id === payload.playerId);
            if (sourcePlayer) {
              const newInstanceId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
              const currentTags = getLatestPlayerTags(sourcePlayer.id);
              playerUpdatesMap[sourcePlayer.id] = {
                ...playerUpdatesMap[sourcePlayer.id],
                tags: [...currentTags, { ...selfMergeModel, instanceId: newInstanceId }]
              };
            }
          }
        }

        // 2.7 Handle Pastille Showing (Display pastille above target players)
        if (tagData.smartphoneShowPastille && payload.selectedPlayerIds?.length > 0) {
          payload.selectedPlayerIds.forEach((pid: string) => {
            const target = state.players.find(p => p.id === pid);
            if (target) {
              const currentPastilles = [...(target.selectionPastilles || [])];
              const alreadyHas = currentPastilles.some(past => past.icon === tagData.icon && past.color === tagData.color);
              if (!alreadyHas) {
                playerUpdatesMap[pid] = {
                  ...(playerUpdatesMap[pid] || {}),
                  selectionPastilles: [...currentPastilles, { 
                    id: uuidv4(), 
                    icon: tagData.icon, 
                    color: tagData.color,
                    name: tagData.name
                  }]
                };
              }
            }
          });
        }

        // 4.5 Handle Action triggering
        if (tagData.smartphoneActionId) {
          const actionInitialContext: any = {};
          if (payload.playerId) {
            actionInitialContext['$Joueur'] = state.players.find(p => p.id === payload.playerId);
          }
          if (payload.selectedPlayerIds && payload.selectedPlayerIds.length > 0) {
            const isMulti = !!tagData.isMultiPlayerSelector;
            if (isMulti && payload.selectedPlayerIds.length > 1) {
              const ciblePlayers = payload.selectedPlayerIds.map((pid: string) => state.players.find(p => p.id === pid)).filter(Boolean);
              const cibleNames = ciblePlayers.map((p: any) => p.name).join(', ');
              const cibleIds = ciblePlayers.map((p: any) => p.id);
              actionInitialContext['$Cible'] = {
                ...ciblePlayers[0],
                name: cibleNames,
                _isMultiple: true,
                _ids: cibleIds,
              };
            } else {
              actionInitialContext['$Cible'] = state.players.find(p => p.id === payload.selectedPlayerIds[0]);
            }
          }
          state.executeAction(tagData.smartphoneActionId, actionInitialContext);
        }

        // 5. Handle auto-delete of UI for this tag
        if (payload.autoDeleteSmartphoneUI && payload.playerId && payload.tagInstanceId) {
          const player = state.players.find(p => p.id === payload.playerId);
          if (player) {
            const tagsToRemove = new Set([payload.tagInstanceId]);
            // Include any children tags if it was a container
            player.tags.forEach(t => {
              if (t.parentTagInstanceId === payload.tagInstanceId) {
                tagsToRemove.add(t.instanceId);
              }
            });

            const currentTags = getLatestPlayerTags(player.id);
            playerUpdatesMap[player.id] = {
              ...playerUpdatesMap[player.id],
              tags: currentTags.filter((t: any) => !tagsToRemove.has(t.instanceId))
            };
          }
        }

        // Apply all batched updates
        const finalUpdates = Object.entries(playerUpdatesMap).map(([id, updates]) => ({ id, updates }));
        if (finalUpdates.length > 0) {
          state.updatePlayers(finalUpdates as any);
        }

      }
    })
    .on('broadcast', { event: 'poll_response' }, ({ payload }) => {
      const state = useVttStore.getState();
      const player = state.players.find(p => p.id === payload.playerId);
      if (player) {
        state.addLog(`[Sondage] ${player.name} a répondu "${payload.response}" à la question : "${payload.question}"`, 'action');
        state.updatePlayer(player.id, { activePoll: null });
      }
    })
    .on('broadcast', { event: 'group_vote_response' }, ({ payload }) => {
      const state = useVttStore.getState();
      const player = state.players.find(p => p.id === payload.playerId);
      if (player && state.activeGroupVote && state.activeGroupVote.id === payload.voteId) {
        state.updateGroupVote(player.id, payload.targetId);
      }
    })
    .on('broadcast', { event: 'close_group_vote' }, ({ payload }) => {
      const state = useVttStore.getState();
      if (state.activeGroupVote && state.activeGroupVote.id === payload.voteId) {
        const { votes, tagIdToAssign } = state.activeGroupVote;

        // Calculate winner and results
        const voteCounts = Object.values(votes).reduce((acc, tid) => {
          acc[tid] = (acc[tid] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const sorted = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
        
        if (sorted.length > 0) {
          const resultsMsg = sorted.map(([tid, count]) => {
            const target = state.players.find(p => p.id === tid);
            return `${target?.name || 'Inconnu'} (${count} vote${count > 1 ? 's' : ''})`;
          }).join(', ');
          
          state.addLog(`[Vote] Résultats : ${resultsMsg}`, 'system');

          if (tagIdToAssign) {
            const winnerId = sorted[0][0];
            const tagModel = state.tags.find(t => t.id === tagIdToAssign);
            const winner = state.players.find(p => p.id === winnerId);
            
            if (tagModel && winner) {
              state.updatePlayer(winnerId, {
                tags: [...winner.tags, { ...tagModel, instanceId: uuidv4() }]
              });
              state.addLog(`[Vote] ${winner.name} reçoit le tag "${tagModel.name}".`, 'system');
            }
          }
        } else {
          state.addLog(`[Vote] Aucun vote n'a été exprimé.`, 'system');
        }

        state.setActiveGroupVote(null);
      }
    })
    .on('broadcast', { event: 'soundboard_action' }, ({ payload }) => {
      const state = useVttStore.getState();
      if (!state.soundboard.remoteEnabled) {
        console.warn("[VTT] Remote soundboard action ignored: remote access is disabled.");
        return;
      }
      
      const hostPasscode = (state.soundboard.remotePasscode || "").trim();
      const clientPasscode = (payload.passcode || "").trim();
      console.log(`[VTT] soundboard_action reçu de la télécommande. Index: ${payload.index}, Passcode client: "${clientPasscode}", Passcode hôte: "${hostPasscode}"`);
      
      if (hostPasscode !== clientPasscode) {
        console.warn("[VTT] Remote soundboard action ignored: invalid passcode.");
        return;
      }
      
      console.log(`[VTT] Remote soundboard trigger received for index ${payload.index}`);
      
      // Update store to trigger the playing logic in DetachedSoundboard
      useVttStore.setState(s => ({
        soundboard: {
          ...s.soundboard,
          remotePlayTrigger: { index: payload.index, timestamp: Date.now() }
        }
      }));
    })
    .on('broadcast', { event: 'soundboard_stop' }, ({ payload }) => {
      const state = useVttStore.getState();
      if (!state.soundboard.remoteEnabled) return;
      if ((state.soundboard.remotePasscode || "").trim() !== (payload.passcode || "").trim()) return;
      
      console.log(`[VTT] Remote soundboard stop received for index ${payload.index}`);
      
      useVttStore.setState(s => ({
        soundboard: {
          ...s.soundboard,
          remoteStopTrigger: { index: payload.index, timestamp: Date.now() }
        }
      }));
    })
    .on('broadcast', { event: 'checklist_action' }, ({ payload }) => {
      const state = useVttStore.getState();
      if (!state.soundboard.remoteEnabled) return;
      if ((state.soundboard.remotePasscode || "").trim() !== (payload.passcode || "").trim()) return;
      
      if (payload.type === 'toggle') {
        console.log(`[VTT] Remote checklist toggle received for item ${payload.itemId}`);
        state.setChecklist(prev => prev.map(item => {
          if (item.id === payload.itemId) {
            const newChecked = !item.checked;
            if (newChecked && item.actionId) {
              state.executeAction(item.actionId, {});
            }
            return { ...item, checked: newChecked };
          }
          return item;
        }));
      }

      if (payload.type === 'toggle_collapse') {
        console.log(`[VTT] Remote checklist toggle_collapse received for item ${payload.itemId}`);
        state.setChecklist(prev => prev.map(item => 
          item.id === payload.itemId ? { ...item, collapsed: !item.collapsed } : item
        ));
      }
    })
    .on('broadcast', { event: 'action_trigger' }, ({ payload }) => {
      const state = useVttStore.getState();
      if (!state.soundboard.remoteEnabled) return;
      if ((state.soundboard.remotePasscode || "").trim() !== (payload.passcode || "").trim()) return;
      
      console.log(`[VTT] Remote action trigger received for action ${payload.actionId}`);
      state.executeAction(payload.actionId, {});
    })
    .on('broadcast', { event: 'remote_player_update' }, ({ payload }) => {
      const state = useVttStore.getState();
      if (!state.soundboard.remoteEnabled) return;
      if ((state.soundboard.remotePasscode || "").trim() !== (payload.passcode || "").trim()) return;

      if (payload.type === 'notes') {
        const player = state.players.find(p => p.id === payload.playerId);
        if (player) {
          state.updatePlayer(payload.playerId, { privateNotes: payload.notes });
          state.addLog(`Note privée mise à jour pour ${player.name}`, 'note');
        }
      }
    })
    .on('presence', { event: 'sync' }, () => {
      const state = useVttStore.getState();
      const newState = currentChannel?.presenceState() || {};

      const onlineIds: string[] = [];
      for (const key in newState) {
        if (key !== 'host') {
          const presences = newState[key] as any[];
          for (const p of presences) {
            if (p.playerId) {
              onlineIds.push(p.playerId);
            }
          }
        }
      }
      state.setOnlinePlayers(onlineIds);
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('Player joined', key, newPresences);
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('Player left', key, leftPresences);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        isHostSubscribed = true;
        useVttStore.getState().setConnectionStatus('connected');
        useVttStore.getState().setSupabaseConfigured(true);
        console.log(`Host connected to room:${roomCode}`);
        await currentChannel?.track({ isHost: true });
        forceBroadcastState();
        sendFullStateWithRetry();
      } else if (status === 'CHANNEL_ERROR') {
        useVttStore.getState().setConnectionStatus('error');
      } else if (status === 'CLOSED') {
        useVttStore.getState().setConnectionStatus('disconnected');
      }
    });
};

export const cleanupHostRealtime = () => {
  if (currentChannel && supabase) {
    supabase.removeChannel(currentChannel);
    currentChannel = null;
  }
  isHostSubscribed = false;
  if (broadcastTimeout !== null) {
    clearTimeout(broadcastTimeout);
    broadcastTimeout = null;
  }
  // Reset broadcast state
  lastBroadcastedState = null;
  lastPositionBroadcast = 0;
};

export const setupHostRealtimeSubscription = () => {
  // Automatically connect if there's already a room code (e.g. after page refresh)
  const initialState = useVttStore.getState();
  if (initialState.roomCode) {
    initHostRealtime(initialState.roomCode);
  }

  return useVttStore.subscribe((state, prevState) => {
    if (!state.roomCode && !prevState.roomCode) return;

    // Check if relevant parts changed
    const relevantChanged =
      state.players !== prevState.players ||
      state.roles !== prevState.roles ||
      state.teams !== prevState.teams ||
      state.tags !== prevState.tags ||
      state.handouts !== prevState.handouts ||
      state.isNight !== prevState.isNight ||
      state.isPublicMode !== prevState.isPublicMode ||
      state.isRoomPublic !== prevState.isRoomPublic ||
      state.displaySettings !== prevState.displaySettings ||
      state.soundboard !== prevState.soundboard ||
      state.wiki !== prevState.wiki ||
      state.checklist !== prevState.checklist ||
      state.customPopups !== prevState.customPopups ||
      state.activeCustomPopupId !== prevState.activeCustomPopupId ||
      state.activeGroupVote !== prevState.activeGroupVote ||
      state.smartphoneCountdown !== prevState.smartphoneCountdown ||
      state.timer !== prevState.timer ||
      state.logs !== prevState.logs ||
      state.room !== prevState.room;

    if (state.roomCode !== prevState.roomCode) {
      if (state.roomCode) {
        initHostRealtime(state.roomCode);
      } else {
        cleanupHostRealtime();
      }
    } else if (relevantChanged && currentChannel) {
      // isRoomPublic changes no longer trigger a full re-init. It's read dynamically in the event handler.
      // They just trigger a force broadcast so that clients know the current state (if they needed to).
      forceBroadcastState();
    }
  });
};
