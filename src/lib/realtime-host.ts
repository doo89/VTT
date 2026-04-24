import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { useVttStore } from '../store';
import { v4 as uuidv4 } from 'uuid';

let currentChannel: RealtimeChannel | null = null;
export const getChannel = () => currentChannel;

export const initHostRealtime = (roomCode: string) => {
  if (!supabase) return;

  // Cleanup existing channel
  if (currentChannel) {
    supabase.removeChannel(currentChannel);
    currentChannel = null;
  }

  currentChannel = supabase.channel(`room:${roomCode}`, {
    config: { broadcast: { self: false, ack: false }, presence: { key: 'host' } },
  });

  currentChannel
    .on('broadcast', { event: 'join_request' }, ({ payload }) => {
      const { playerName } = payload;

      const state = useVttStore.getState();
      const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
      const rawName = normalize(playerName);
      const existingPlayer = state.players.find(p => normalize(p.name) === rawName);

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
          // State change will automatically trigger a broadcast via the subscriber below
        } else {
          // Private room logic - queue for approval
          console.log(`Private room: Join request received for ${playerName}`);
          if (!state.joinRequests.includes(playerName)) {
            state.addJoinRequest(playerName);
          }
        }
      } else {
        // Player exists, force a broadcast so their client syncs immediately
        forceBroadcastState();
      }
    })
    .on('broadcast', { event: 'get_state' }, () => {
      // Direct request from a player client to get current state (useful for late joiners)
      forceBroadcastState();
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
            actionInitialContext['$Cible'] = state.players.find(p => p.id === payload.selectedPlayerIds[0]);
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
    .on('broadcast', { event: 'soundboard_action' }, ({ payload }) => {
      const state = useVttStore.getState();
      if (!state.soundboard.remoteEnabled) {
        console.warn("[VTT] Remote soundboard action ignored: remote access is disabled.");
        return;
      }
      
      const hostPasscode = (state.soundboard.remotePasscode || "").trim();
      const clientPasscode = (payload.passcode || "").trim();
      
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
    .on('broadcast', { event: 'checklist_action' }, ({ payload }) => {
      const state = useVttStore.getState();
      if (!state.soundboard.remoteEnabled) return;
      if ((state.soundboard.remotePasscode || "").trim() !== (payload.passcode || "").trim()) return;
      
      if (payload.type === 'toggle') {
        state.setChecklist(prev => prev.map(item => 
          item.id === payload.itemId ? { ...item, completed: !item.completed } : item
        ));
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
        console.log(`Host connected to room:${roomCode}`);
        await currentChannel?.track({ isHost: true });
        forceBroadcastState();
      }
    });
};

export const cleanupHostRealtime = () => {
  if (currentChannel && supabase) {
    supabase.removeChannel(currentChannel);
    currentChannel = null;
  }
};

export const forceBroadcastState = () => {
  if (!currentChannel) return;

  const state = useVttStore.getState();

  // Strip large binary data (base64 images) from payload to avoid the
  // Supabase Realtime 250KB broadcast size limit. Only send URLs, not embedded data.
  const stripImage = (url: string | null | undefined) =>
    url && (url.startsWith('data:') || url.length > 2000) ? null : url;

  const payload = {
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
      ...h,
      imageUrl: stripImage(h.imageUrl),
      referenceImageUrl: stripImage((h as any).referenceImageUrl),
    })),
    soundboard: {
      remoteEnabled: state.soundboard.remoteEnabled,
      cols: state.soundboard.cols,
      rows: state.soundboard.rows,
      buttons: state.soundboard.buttons.map(b => ({
        index: b.index,
        name: b.name,
        icon: b.icon,
        color: b.color,
        hasAudio: !!b.audioUrl,
        isOneShot: b.isOneShot,
        imageUrl: stripImage(b.imageUrl)
      }))
    },
    isNight: state.isNight,
    cycleMode: state.cycleMode,
    displaySettings: state.displaySettings,
    wiki: state.wiki,
    checklist: state.checklist,
    room: {
      ...state.room,
      // Strip backgroundImage if it's a base64 blob — send only external URLs
      backgroundImage: stripImage(state.room.backgroundImage),
    },
    customPopups: state.customPopups.map(p => ({
      ...p,
      imageUrl: stripImage(p.imageUrl)
    })),
    activeCustomPopupId: state.activeCustomPopupId,
  };

  const payloadSize = JSON.stringify(payload).length;
  if (payloadSize > 200_000) {
    console.warn(`[VTT] Broadcast payload is large: ${Math.round(payloadSize / 1024)}KB. Some images may have been stripped.`);
  }

  currentChannel.send({
    type: 'broadcast',
    event: 'sync_state',
    payload: payload,
  }).catch(err => console.error("Broadcast failed", err));
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
      state.isRoomPublic !== prevState.isRoomPublic ||
      state.displaySettings !== prevState.displaySettings ||
      state.soundboard !== prevState.soundboard ||
      state.wiki !== prevState.wiki ||
      state.customPopups !== prevState.customPopups ||
      state.activeCustomPopupId !== prevState.activeCustomPopupId ||
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
