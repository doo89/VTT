import type { EffectHandler, EffectContext, EffectState } from '../types';

/**
 * Get player IDs from context (handles single and multiple players)
 */
function getPlayerIds(context: EffectContext): string[] {
  if (!context.$Joueur) return [];
  return context.$Joueur._isMultiple ? (context.$Joueur._ids || []) : [context.$Joueur.id];
}

function getCibleIds(context: EffectContext): string[] {
  if (!context.$Cible) return [];
  return context.$Cible._isMultiple ? (context.$Cible._ids || []) : [context.$Cible.id];
}

/**
 * Kill player effect
 */
export const handleKillPlayer: EffectHandler = (effect, context, state) => {
  const ids = getPlayerIds(context);
  if (ids.length === 0) return;
  
  state.players = state.players.map(p => 
    ids.includes(p.id) ? { ...p, isDead: true } : p
  );
};

/**
 * Resurrect player effect
 */
export const handleResurrectPlayer: EffectHandler = (effect, context, state) => {
  const ids = getPlayerIds(context);
  if (ids.length === 0) return;
  
  state.players = state.players.map(p => 
    ids.includes(p.id) ? { ...p, isDead: false } : p
  );
};

/**
 * Kill all players effect
 */
export const handleKillAllPlayers: EffectHandler = (effect, context, state) => {
  state.players = state.players.map(p => ({ ...p, isDead: true }));
};

/**
 * Resurrect all players effect
 */
export const handleResurrectAllPlayers: EffectHandler = (effect, context, state) => {
  state.players = state.players.map(p => ({ ...p, isDead: false }));
};

/**
 * Sleep player effect
 */
export const handleSleepPlayer: EffectHandler = (effect, context, state) => {
  const ids = getPlayerIds(context);
  if (ids.length === 0) return;
  
  state.players = state.players.map(p => 
    ids.includes(p.id) ? { ...p, isAsleep: true, isSleeping: true } : p
  );
};

/**
 * Wake player effect
 */
export const handleWakePlayer: EffectHandler = (effect, context, state) => {
  const ids = getPlayerIds(context);
  if (ids.length === 0) return;
  
  state.players = state.players.map(p => 
    ids.includes(p.id) ? { ...p, isAsleep: false, isSleeping: false } : p
  );
};

/**
 * Toggle sleep player effect
 */
export const handleSwitchSleepPlayer: EffectHandler = (effect, context, state) => {
  const ids = getPlayerIds(context);
  if (ids.length === 0) return;
  
  state.players = state.players.map(p => 
    ids.includes(p.id) ? { ...p, isAsleep: !p.isAsleep, isSleeping: !p.isSleeping } : p
  );
};

/**
 * Sleep all players effect
 */
export const handleSleepAllPlayers: EffectHandler = (effect, context, state) => {
  state.players = state.players.map(p => ({ ...p, isAsleep: true, isSleeping: true }));
};

/**
 * Wake all players effect
 */
export const handleWakeAllPlayers: EffectHandler = (effect, context, state) => {
  state.players = state.players.map(p => ({ ...p, isAsleep: false, isSleeping: false }));
};

/**
 * Select player effect
 */
export const handleSelectPlayer: EffectHandler = (effect, context, state, storeApi) => {
  const ids = getPlayerIds(context);
  if (ids.length === 0) return;
  
  storeApi.setSelectedEntityIds(ids);
};

/**
 * Ping player effect
 */
export const handlePingPlayer: EffectHandler = (effect, context, state) => {
  const ids = getPlayerIds(context);
  if (ids.length === 0) return;
  
  state.players = state.players.map(p => 
    ids.includes(p.id) ? { 
      ...p, 
      pingTimestamp: Date.now(), 
      pingColor: effect.pingColor || p.color 
    } : p
  );
};

/**
 * Kill player and move to graveyard effect
 */
export const handleMovePlayerToGraveyard: EffectHandler = (effect, context, state, storeApi) => {
  const ids = getPlayerIds(context);
  if (ids.length === 0) return;
  
  const targetX = effect.targetX !== undefined ? effect.targetX : 0;
  const targetY = effect.targetY !== undefined ? effect.targetY : 0;
  
  state.players = state.players.map(p => {
    if (ids.includes(p.id)) {
      const index = ids.indexOf(p.id);
      const jitterX = ids.length > 1 ? (index % 5) * 20 - 40 : 0;
      const jitterY = ids.length > 1 ? Math.floor(index / 5) * 20 : 0;
      return {
        ...p,
        x: targetX + jitterX,
        y: targetY + jitterY,
        isDead: effect.killOnGraveyard ? true : p.isDead
      };
    }
    return p;
  });
  
  const count = ids.length;
  const playerName = context.$Joueur?.name || 'Joueur';
  storeApi.addLog(`${count > 1 ? `${count} joueurs` : playerName} envoyé(e)${count > 1 ? 's' : ''} au cimetière`, 'action');
};

/**
 * Isolate Cible / Send to graveyard effect (targets $Cible instead of $Joueur)
 */
export const handleMoveCibleToGraveyard: EffectHandler = (effect, context, state, storeApi) => {
  const ids = getCibleIds(context);
  if (ids.length === 0) return;
  
  const targetX = effect.targetX !== undefined ? effect.targetX : 0;
  const targetY = effect.targetY !== undefined ? effect.targetY : 0;
  
  state.players = state.players.map(p => {
    if (ids.includes(p.id)) {
      const index = ids.indexOf(p.id);
      const jitterX = ids.length > 1 ? (index % 5) * 20 - 40 : 0;
      const jitterY = ids.length > 1 ? Math.floor(index / 5) * 20 : 0;
      return {
        ...p,
        x: targetX + jitterX,
        y: targetY + jitterY,
        isDead: effect.killOnGraveyard ? true : p.isDead
      };
    }
    return p;
  });
  
  const count = ids.length;
  const cibleName = context.$Cible?.name || 'Cible';
  storeApi.addLog(`${count > 1 ? `${count} cibles` : cibleName} envoyé(e)${count > 1 ? 's' : ''} au cimetière`, 'action');
};

/**
 * Gather players effect
 */
export const handleGatherPlayers: EffectHandler = (effect, context, state) => {
  const alivePlayers = state.players.filter(p => !p.isDead);
  const centerX = effect.targetX || 0;
  const centerY = effect.targetY || 0;
  const radius = effect.gatherRadius || 150;
  
  state.players = state.players.map(p => {
    if (p.isDead) return p;
    const index = alivePlayers.findIndex(ap => ap.id === p.id);
    if (index !== -1) {
      const angle = (index / alivePlayers.length) * 2 * Math.PI;
      return {
        ...p,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    }
    return p;
  });
};

/**
 * Change player shape effect
 */
export const handleChangePlayerShape: EffectHandler = (effect, context, state) => {
  const ids = getPlayerIds(context);
  if (ids.length === 0 || !effect.targetShape) return;
  
  state.players = state.players.map(p => 
    ids.includes(p.id) ? { ...p, shape: effect.targetShape } : p
  );
};

/**
 * Clear player effect
 */
export const handleClearPlayer: EffectHandler = (effect, context, state) => {
  const ids = getPlayerIds(context);
  if (ids.length === 0) return;
  
  state.players = state.players.map(p => 
    ids.includes(p.id) ? {
      ...p,
      tags: [],
      selectionPastilles: [],
      actionPastilles: [],
      isRoleRevealedOnBoard: false,
      isRoleRevealedInSmartphoneRoom: false,
      isRoleRevealedInSmartphonePlayers: false
    } : p
  );
};

/**
 * Remove player role effect
 */
export const handleRemovePlayerRole: EffectHandler = (effect, context, state) => {
  const ids = getPlayerIds(context);
  if (ids.length === 0) return;
  
  state.players = state.players.map(p => 
    ids.includes(p.id) ? { ...p, roleId: null } : p
  );
};

/**
 * Blind player effect
 */
export const handleBlindPlayer: EffectHandler = (effect, context, state) => {
  const ids = getPlayerIds(context);
  if (ids.length === 0) return;
  
  state.players = state.players.map(p => {
    if (ids.includes(p.id)) {
      let isBlinded = p.isBlinded || false;
      if (effect.blindMode === 'blind') isBlinded = true;
      else if (effect.blindMode === 'unblind') isBlinded = false;
      else if (effect.blindMode === 'toggle') isBlinded = !isBlinded;
      return { ...p, isBlinded };
    }
    return p;
  });
};

/**
 * Reveal/Hide player role effect
 */
export const handleRevealPlayerRole: EffectHandler = (effect, context, state) => {
  const ids = getPlayerIds(context);
  if (ids.length === 0) return;
  
  const isRevealed = effect.type === 'revealPlayerRole';
  
  state.players = state.players.map(p => {
    if (ids.includes(p.id)) {
      return { 
        ...p, 
        isRoleRevealedOnBoard: isRevealed ? (effect.revealOnBoard ?? true) : false,
        isRoleRevealedInSmartphoneRoom: isRevealed ? (effect.revealInSmartphoneRoom ?? false) : false,
        isRoleRevealedInSmartphonePlayers: isRevealed ? (effect.revealInSmartphonePlayers ?? false) : false,
        roleRevealPopupTriggeredAt: (isRevealed && effect.revealInSmartphoneGamePopup) ? Date.now() : p.roleRevealPopupTriggeredAt
      };
    }
    return p;
  });
};

/**
 * Toggle player pastille effect
 */
export const handleTogglePlayerPastille: EffectHandler = (effect, context, state) => {
  const ids = getPlayerIds(context);
  if (ids.length === 0 || !effect.pastilleId) return;
  
  state.players = state.players.map(p => {
    if (ids.includes(p.id)) {
      const existing = p.actionPastilles || [];
      const hasPastille = existing.some((x: { id: string }) => x.id === effect.pastilleId);
      let newPastilles = [...existing];
      
      if (effect.pastilleMode === 'remove' || (effect.pastilleMode === 'toggle' && hasPastille)) {
        newPastilles = newPastilles.filter((x: { id: string }) => x.id !== effect.pastilleId);
      } else if (effect.pastilleMode === 'add' || (effect.pastilleMode === 'toggle' && !hasPastille)) {
        if (!hasPastille) {
          newPastilles.push({
            id: effect.pastilleId as string,
            icon: effect.pastilleIcon || 'Shield',
            color: effect.pastilleColor || '#ffffff'
          });
        }
      }
      return { ...p, actionPastilles: newPastilles };
    }
    return p;
  });
};

/**
 * Force smartphone tab effect
 */
export const handleForceSmartphoneTab: EffectHandler = (effect, context, state) => {
  const ids = getPlayerIds(context);
  if (ids.length === 0) return;
  
  state.players = state.players.map(p => 
    ids.includes(p.id) ? { ...p, forcedTab: effect.targetTab } : p
  );
};

/**
 * Vibrate smartphone effect
 */
export const handleVibrateSmartphone: EffectHandler = (effect, context, state) => {
  const ids = getPlayerIds(context);
  if (ids.length === 0) return;
  
  state.players = state.players.map(p => 
    ids.includes(p.id) ? { 
      ...p, 
      vibrationTriggeredAt: Date.now(), 
      vibrationDuration: effect.vibrationDuration || 200 
    } : p
  );
};

/**
 * Lock smartphone effect
 */
export const handleLockSmartphone: EffectHandler = (effect, context, state) => {
  const ids = getPlayerIds(context);
  if (ids.length === 0) return;
  
  state.players = state.players.map(p => {
    if (ids.includes(p.id)) {
      let isLocked = p.isSmartphoneLocked || false;
      if (effect.lockMode === 'lock') isLocked = true;
      else if (effect.lockMode === 'unlock') isLocked = false;
      else if (effect.lockMode === 'toggle') isLocked = !isLocked;
      return { ...p, isSmartphoneLocked: isLocked };
    }
    return p;
  });
};

/**
 * Show/hide all players effect
 */
export const handleShowAllPlayers: EffectHandler = (effect, context, state) => {
  state.displaySettings = { ...state.displaySettings, showPlayers: true };
};

export const handleHideAllPlayers: EffectHandler = (effect, context, state) => {
  state.displaySettings = { ...state.displaySettings, showPlayers: false };
};

/**
 * Show/hide player image effect
 */
export const handleShowPlayerImage: EffectHandler = (effect, context, state) => {
  state.displaySettings = { ...state.displaySettings, showPlayerImage: true };
};

export const handleHidePlayerImage: EffectHandler = (effect, context, state) => {
  state.displaySettings = { ...state.displaySettings, showPlayerImage: false };
};

/**
 * Show/hide role image effect
 */
export const handleShowRoleImage: EffectHandler = (effect, context, state) => {
  state.displaySettings = { ...state.displaySettings, showRoleImage: true };
};

export const handleHideRoleImage: EffectHandler = (effect, context, state) => {
  state.displaySettings = { ...state.displaySettings, showRoleImage: false };
};

/**
 * Show/hide player tooltip effect
 */
export const handleShowPlayerTooltip: EffectHandler = (effect, context, state) => {
  state.displaySettings = { ...state.displaySettings, showTooltip: true };
};

export const handleHidePlayerTooltip: EffectHandler = (effect, context, state) => {
  state.displaySettings = { ...state.displaySettings, showTooltip: false };
};

/**
 * Show/hide tag tooltip effect
 */
export const handleShowTagTooltip: EffectHandler = (effect, context, state) => {
  state.displaySettings = { ...state.displaySettings, showTagTooltip: true };
};

export const handleHideTagTooltip: EffectHandler = (effect, context, state) => {
  state.displaySettings = { ...state.displaySettings, showTagTooltip: false };
};

/**
 * Show/hide role color effect
 */
export const handleShowRoleColor: EffectHandler = (effect, context, state) => {
  state.displaySettings = { ...state.displaySettings, showRoleColor: true };
};

export const handleHideRoleColor: EffectHandler = (effect, context, state) => {
  state.displaySettings = { ...state.displaySettings, showRoleColor: false };
};

/**
 * Show/hide timer on smartphone effect
 */
export const handleShowTimerOnSmartphone: EffectHandler = (effect, context, state) => {
  state.displaySettings = { ...state.displaySettings, showTimerOnSmartphone: true };
};

export const handleHideTimerOnSmartphone: EffectHandler = (effect, context, state) => {
  state.displaySettings = { ...state.displaySettings, showTimerOnSmartphone: false };
};
