import type { EffectHandler, EffectContext } from '../types';

/**
 * Get player IDs from context
 */
function getPlayerIds(context: EffectContext): string[] {
  if (!context.$Joueur) return [];
  return context.$Joueur._isMultiple ? (context.$Joueur._ids || []) : [context.$Joueur.id];
}

/**
 * Wait effect
 */
export const handleWait: EffectHandler = (effect, context, state) => {
  if (effect.showCountdown) {
    state.smartphoneCountdown = {
      duration: effect.value || 0,
      remaining: effect.value || 0,
      message: effect.countdownMessage || '',
      isActive: true
    };
  }
  // Return special marker to indicate wait
  return { _waitTime: effect.value || 0 };
};

/**
 * Stop execution effect
 */
export const handleStopExecution: EffectHandler = () => {
  return { _stopExecution: true };
};

/**
 * Reset board effect
 */
export const handleResetBoard: EffectHandler = (effect, context, state) => {
  state.markers = [];
  state.players = state.players.map(p => ({ 
    ...p, 
    isDead: false, 
    isAsleep: false, 
    tags: [], 
    selectionPastilles: [] 
  }));
};

/**
 * Next/Previous phase effect
 */
export const handleNextPhase: EffectHandler = (effect, context, state) => {
  return { _phaseShift: 1 };
};

export const handlePreviousPhase: EffectHandler = (effect, context, state) => {
  return { _phaseShift: -1 };
};

/**
 * Reset cycle effect
 */
export const handleResetCycle: EffectHandler = (effect, context, state) => {
  return { _resetValue: 1, _phaseShift: 0 };
};

/**
 * Set cycle mode effects
 */
export const handleSetCycleDayNight: EffectHandler = (effect, context, state) => {
  state.cycleMode = 'dayNight';
};

export const handleSetCycleTurn: EffectHandler = (effect, context, state) => {
  state.cycleMode = 'turns';
};

export const handleSetCycleNone: EffectHandler = (effect, context, state) => {
  state.cycleMode = 'none';
};

/**
 * Set day/night number effect
 */
export const handleSetDayNumber: EffectHandler = (effect, context, state) => {
  return { _resetValue: effect.value || 1, _isNight: false };
};

export const handleSetNightNumber: EffectHandler = (effect, context, state) => {
  return { _resetValue: effect.value || 1, _isNight: true };
};

/**
 * Alert player name effect
 */
export const handleAlertPlayerName: EffectHandler = (effect, context) => {
  if (context.$Joueur) {
    alert(context.$Joueur.name);
  }
};

/**
 * Alert/Popup variable effect
 */
export const handleAlertVariable: EffectHandler = (effect, context, state) => {
  let currentVal: number | string = 0;
  const isCustom = !['$Ordre', '$Cycle', '$Jour', '$Nuit'].includes(effect.variable || '');
  
  if (effect.variable === '$Ordre') currentVal = state.callOrderIndex;
  else if (effect.variable === '$Cycle') currentVal = state.cycleNumber;
  else if (effect.variable === '$Jour') currentVal = !state.isNight ? state.cycleNumber : 0;
  else if (effect.variable === '$Nuit') currentVal = state.isNight ? state.cycleNumber : 0;
  else if (isCustom) currentVal = state.customVariables[effect.variable || ''] || 0;

  if (effect.type === 'alertVariable') {
    alert(`${effect.variable} : ${currentVal}`);
  } else {
    // Popup variable
    const dynamicPopup = {
      id: `dynamic-var-${Date.now()}`,
      title: `Information`,
      content: `<div class="flex flex-col items-center text-center gap-4">
        <div class="text-lg font-medium text-muted-foreground uppercase tracking-widest">${effect.variable}</div>
        <div class="text-5xl font-black text-primary tracking-tighter">${currentVal}</div>
      </div>`,
      showCloseButton: true,
      autoCloseTimer: true
    };
    state.customPopups = [...state.customPopups, dynamicPopup];
    state.activeCustomPopupId = dynamicPopup.id;
  }
};

/**
 * Popup player effect
 */
export const handlePopupPlayer: EffectHandler = (effect, context, state) => {
  const joueur = context.$Joueur;
  if (!joueur) return;
  
  const role = state.roles.find(r => r.id === joueur.roleId);
  const playerName = joueur.name;
  const roleName = role?.name || 'Sans Rôle';
  const imageUrl = role?.imageUrl || joueur.imageUrl || '';
  
  const dynamicPopup = {
    id: `dynamic-joueur-${Date.now()}`,
    title: `Résultat : ${playerName}`,
    content: `<div class="flex flex-col items-center text-center gap-4">
      <div class="text-lg">Le joueur <strong>${playerName}</strong> est :</div>
      <div class="text-3xl font-black text-primary uppercase tracking-tighter">${roleName}</div>
    </div>`,
    imageUrl: imageUrl,
    showCloseButton: true,
    autoCloseTimer: true
  };
  
  state.customPopups = [...state.customPopups, dynamicPopup];
  state.activeCustomPopupId = dynamicPopup.id;
};

/**
 * Play sound effect
 */
export const handlePlaySound: EffectHandler = (effect, context, state) => {
  if (!effect.soundName) return;
  
  const sound = state.soundboard.buttons.find((b: any) => b.name === effect.soundName);
  if (sound && sound.audioUrl) {
    const audio = new Audio(sound.audioUrl);
    audio.volume = sound.volume !== undefined ? sound.volume : 0.5;
    audio.play().catch(e => console.error("Error playing action sound:", e));
  }
};

/**
 * Show handout effect
 */
export const handleShowHandout: EffectHandler = (effect, context, state) => {
  if (!effect.handoutId) return;
  
  state.handouts = state.handouts.map(h => 
    h.id === effect.handoutId ? { ...h, isOpen: true } : h
  );
};

/**
 * Send private message effect
 */
export const handleSendPrivateMessage: EffectHandler = (effect, context, state) => {
  if (!effect.privateMessage || !context.$Joueur) return;
  
  let message = effect.privateMessage;
  if (message.includes('$Rôle') || message.includes('$Role')) {
    const roleNames = context.$Joueur._isMultiple
      ? context.$Joueur._ids!.map((id: string) => {
          const p = state.players.find(p => p.id === id);
          const r = state.roles.find(r => r.id === p?.roleId);
          return r ? r.name : 'Inconnu';
        }).filter(Boolean).join(', ')
      : (state.roles.find(r => r.id === context.$Joueur!.roleId)?.name || 'Inconnu');
    message = message.replace(/\$R[oô]le/g, roleNames);
  }
  
  const playerNames = context.$Joueur._isMultiple 
    ? context.$Joueur._ids!.map((id: string) => state.players.find(p => p.id === id)?.name).filter(Boolean).join(',')
    : context.$Joueur.name;
    
  state.smartphoneActionMessage = { playerName: playerNames, message: message };
};

/**
 * Add system log effect
 */
export const handleAddSystemLog: EffectHandler = (effect, context, state, storeApi) => {
  if (!effect.logMessage) return;
  
  let message = effect.logMessage;
  if (context.$Joueur) {
    if (message.includes('$Joueur')) {
      const playerNames = context.$Joueur._isMultiple 
        ? context.$Joueur._ids!.map((id: string) => state.players.find(p => p.id === id)?.name).filter(Boolean).join(', ')
        : context.$Joueur.name;
      message = message.replace(/\$Joueur/g, playerNames);
    }
    if (message.includes('$Rôle') || message.includes('$Role')) {
      const roleNames = context.$Joueur._isMultiple
        ? context.$Joueur._ids!.map((id: string) => {
            const p = state.players.find(p => p.id === id);
            const r = state.roles.find(r => r.id === p?.roleId);
            return r ? r.name : 'Inconnu';
          }).filter(Boolean).join(', ')
        : (state.roles.find(r => r.id === context.$Joueur!.roleId)?.name || 'Inconnu');
      message = message.replace(/\$R[oô]le/g, roleNames);
    }
  }
  
  storeApi.addLog(message, 'system');
};

/**
 * Set room background/color effect
 */
export const handleSetRoomBackground: EffectHandler = (effect, context, state) => {
  state.room = { ...state.room, backgroundImage: effect.backgroundImageUrl || null };
};

export const handleSetRoomColor: EffectHandler = (effect, context, state) => {
  state.room = { ...state.room, backgroundColor: effect.roomColor || state.room.backgroundColor };
};

/**
 * Increment call order effect
 */
export const handleIncrementCallOrder: EffectHandler = (effect, context, state, storeApi) => {
  state.callOrderIndex = (state.callOrderIndex || 0) + 1;
  storeApi?.addLog(`$Ordre incrémenté → ${state.callOrderIndex}`, 'action');
};

/**
 * Decrement call order effect
 */
export const handleDecrementCallOrder: EffectHandler = (effect, context, state, storeApi) => {
  state.callOrderIndex = Math.max(0, (state.callOrderIndex || 0) - 1);
  storeApi?.addLog(`$Ordre décrémenté → ${state.callOrderIndex}`, 'action');
};

/**
 * Reset call order effect
 */
export const handleResetCallOrder: EffectHandler = (effect, context, state, storeApi) => {
  state.callOrderIndex = 0;
  storeApi?.addLog(`$Ordre réinitialisé → 0`, 'action');
};

/**
 * Roll dice effect
 */
export const handleRollDice: EffectHandler = (effect, context, state, storeApi) => {
  if (!context.$Joueur) return;
  
  const count = effect.diceCount || 1;
  const sides = effect.diceSides || 20;
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  const formula = `${count}d${sides}`;
  const diceId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
  
  storeApi.addLog(`[Dés] ${context.$Joueur.name} a lancé ${formula} et a obtenu : ${total}`, 'action');
  
  const ids = getPlayerIds(context);
  state.players = state.players.map(p => 
    ids.includes(p.id) ? { 
      ...p, 
      lastDiceResult: { id: diceId, result: total, formula, timestamp: Date.now() } 
    } : p
  );
};

/**
 * Play particle effect
 */
export const handlePlayParticleEffect: EffectHandler = (effect, context, state) => {
  const ids = getPlayerIds(context);
  if (ids.length === 0) return;
  
  const particleId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
  state.players = state.players.map(p => 
    ids.includes(p.id) ? { 
      ...p, 
      activeParticle: { 
        id: particleId, 
        type: effect.particleType || 'confetti', 
        duration: effect.particleDuration || 3000 
      } 
    } : p
  );
};

/**
 * Toggle action enabled effect
 */
export const handleToggleActionEnabled: EffectHandler = (effect, context, state) => {
  if (!effect.targetActionId) return;
  
  state.actions = state.actions.map(a => {
    if (a.id === effect.targetActionId) {
      let enabled = a.enabled;
      if (effect.actionEnabledMode === 'enable') enabled = true;
      else if (effect.actionEnabledMode === 'disable') enabled = false;
      else if (effect.actionEnabledMode === 'toggle') enabled = !enabled;
      return { ...a, enabled };
    }
    return a;
  });
};

/**
 * Trigger action effect
 */
export const handleTriggerAction: EffectHandler = (effect, context, state, storeApi) => {
  if (!effect.targetActionId) return;
  
  // Build custom context if overrides are specified
  let newContext = { ...context };
  
  if (effect.contextOverride) {
    // Override $Joueur
    if (effect.contextOverride.targetPlayerId !== undefined) {
      if (effect.contextOverride.targetPlayerId === null) {
        delete newContext.$Joueur;
      } else {
        const player = state.players.find(p => p.id === effect.contextOverride!.targetPlayerId);
        if (player) {
          newContext.$Joueur = player;
        }
      }
    }
    
    // Override $Cible
    if (effect.contextOverride.targetCibleId !== undefined) {
      if (effect.contextOverride.targetCibleId === null) {
        delete newContext.$Cible;
      } else {
        const player = state.players.find(p => p.id === effect.contextOverride!.targetCibleId);
        if (player) {
          newContext.$Cible = player;
        }
      }
    }
  }
  
  // This will be handled by the executor with depth limit
  return { _triggerAction: effect.targetActionId, _actionContext: newContext };
};

/**
 * Send poll to smartphone effect
 */
export const handleSendPollToSmartphone: EffectHandler = (effect, context, state) => {
  const ids = getPlayerIds(context);
  if (ids.length === 0 || !effect.pollQuestion) return;
  
  const pollId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
  state.players = state.players.map(p => 
    ids.includes(p.id) ? { 
      ...p, 
      activePoll: { 
        id: pollId, 
        question: effect.pollQuestion!, 
        options: (effect.pollOptions || ['Oui', 'Non']).filter((o: string) => o.trim() !== '')
      } 
    } : p
  );
};

/**
 * Send group vote to smartphone effect
 */
export const handleSendGroupVoteToSmartphone: EffectHandler = (effect, context, state) => {
  const ids = getPlayerIds(context);
  if (ids.length === 0 || !effect.pollQuestion) return;
  
  const voteId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
  state.activeGroupVote = {
    id: voteId,
    question: effect.pollQuestion,
    allowedVoterIds: ids,
    votersRoleColor: effect.groupVoteVotersRoleColor || '#ef4444',
    hideVoters: effect.groupVoteHideVoters || false,
    excludeVoters: effect.groupVoteExcludeVoters || false,
    mandatory: effect.groupVoteMandatory || false,
    noTies: effect.groupVoteNoTies || false,
    tagIdToAssign: effect.groupVoteTagId,
    votes: {},
    isOpen: true
  };
};

/**
 * Select call order player effect
 */
export const handleSelectCallOrderPlayer: EffectHandler = (effect, context, state, storeApi) => {
  const calledPlayers = state.players.filter((p: any) => {
    const playerTags = p.tags || [];
    const roleTags = state.roles.find((r: any) => r.id === p.roleId)?.tags || [];
    const allTags = [...playerTags, ...roleTags];
    return allTags.some((tag: any) => {
      const order = (state.cycleMode === 'dayNight' && state.isNight) ? tag.callOrderNight : tag.callOrderDay;
      return order !== null && order !== undefined && order !== '' && Number(order) === state.callOrderIndex;
    });
  });
  
  if (calledPlayers.length > 0) {
    storeApi.setSelectedEntityIds(calledPlayers.map((p: any) => p.id));
  } else {
    storeApi.setSelectedEntityIds([]);
  }
};
