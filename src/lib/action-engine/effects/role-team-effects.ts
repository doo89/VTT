import type { EffectHandler, EffectContext } from '../types';

/**
 * Get player IDs from context
 */
function getPlayerIds(context: EffectContext): string[] {
  if (!context.$Joueur) return [];
  return context.$Joueur._isMultiple ? (context.$Joueur._ids || []) : [context.$Joueur.id];
}

/**
 * Get target player IDs based on effect configuration
 */
function getTargetIds(effect: any, state: any, initiatorIds: string[]): string[] {
  let targetIds: string[] = [];
  
  if (effect.swapTargetMode === 'role' && effect.roleId) {
    targetIds = state.players.filter((p: any) => p.roleId === effect.roleId).map((p: any) => p.id);
  } else if (effect.swapTargetMode === 'tag' && effect.tagId) {
    targetIds = state.players.filter((p: any) => p.tags?.some((t: any) => t.id === effect.tagId)).map((p: any) => p.id);
  } else if (effect.swapTargetMode === 'random') {
    const validTargets = state.players.filter((p: any) => !p.isDead && !initiatorIds.includes(p.id));
    if (validTargets.length > 0) {
      const randomPlayer = validTargets[Math.floor(Math.random() * validTargets.length)];
      targetIds = [randomPlayer.id];
    }
  }
  
  return targetIds;
}

/**
 * Assign role to player effect
 */
export const handleAssignRole: EffectHandler = (effect, context, state) => {
  const ids = getPlayerIds(context);
  if (ids.length === 0 || !effect.roleId) return;
  
  state.players = state.players.map(p => 
    ids.includes(p.id) ? { ...p, roleId: effect.roleId || null } : p
  );
};

/**
 * Swap player role effect
 */
export const handleSwapPlayerRole: EffectHandler = (effect, context, state) => {
  const initiatorIds = getPlayerIds(context);
  if (initiatorIds.length === 0) return;
  
  const targetIds = getTargetIds(effect, state, initiatorIds);
  
  if (targetIds.length > 0 && initiatorIds.length > 0) {
    const idA = initiatorIds[0];
    const idB = targetIds[0];
    if (idA !== idB) {
      const playerA = state.players.find(p => p.id === idA);
      const playerB = state.players.find(p => p.id === idB);
      if (playerA && playerB) {
        const roleA = playerA.roleId;
        const roleB = playerB.roleId;
        state.players = state.players.map(p => {
          if (p.id === idA) return { ...p, roleId: roleB };
          if (p.id === idB) return { ...p, roleId: roleA };
          return p;
        });
      }
    }
  }
};

/**
 * Steal role and kill effect
 */
export const handleStealRoleAndKill: EffectHandler = (effect, context, state) => {
  const initiatorIds = getPlayerIds(context);
  if (initiatorIds.length === 0) return;
  
  const targetIds = getTargetIds(effect, state, initiatorIds);
  
  if (targetIds.length > 0 && initiatorIds.length > 0) {
    const idB = targetIds[0];
    const playerB = state.players.find(p => p.id === idB);
    if (playerB) {
      const targetRoleId = playerB.roleId;
      state.players = state.players.map(p => {
        if (initiatorIds.includes(p.id)) return { ...p, roleId: targetRoleId };
        if (p.id === idB) return { ...p, isDead: true };
        return p;
      });
    }
  }
};

/**
 * Set fake role effect
 */
export const handleSetFakeRole: EffectHandler = (effect, context, state) => {
  const ids = getPlayerIds(context);
  if (ids.length === 0) return;
  
  state.players = state.players.map(p => 
    ids.includes(p.id) ? { ...p, seenAsRoleId: effect.seenAsRoleId || null } : p
  );
};

/**
 * Distribute roles effect
 */
export const handleDistributeRoles: EffectHandler = (effect, context, state) => {
  const rolesToDistribute = state.roles.filter((r: any) => r.isSelectableForDistribution);
  if (rolesToDistribute.length === 0) return;
  
  let rolePool: { id: string, teamId: string | null }[] = [];
  rolesToDistribute.forEach((role: any) => {
    const qty = role.isUnique ? 1 : (role.distributionQuantity || 1);
    for (let i = 0; i < qty; i++) { 
      rolePool.push({ id: role.id, teamId: role.teamId }); 
    }
  });
  
  // Shuffle
  for (let i = rolePool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rolePool[i], rolePool[j]] = [rolePool[j], rolePool[i]];
  }
  
  state.players = state.players.map((player, idx) => {
    if (idx < rolePool.length) {
      return { 
        ...player, 
        roleId: rolePool[idx].id, 
        teamId: rolePool[idx].teamId 
      };
    }
    return player;
  });
};

/**
 * Assign team to player effect
 */
export const handleAssignTeam: EffectHandler = (effect, context, state) => {
  const ids = getPlayerIds(context);
  if (ids.length === 0) return;
  
  if (effect.teamId !== 'unchanged' && effect.teamId !== undefined) {
    state.players = state.players.map(p => 
      ids.includes(p.id) ? { ...p, teamId: effect.teamId || null } : p
    );
  }
  
  if (effect.roleTeamId !== 'unchanged' && effect.roleTeamId !== undefined) {
    const roleIdsToUpdate = state.players.filter(p => ids.includes(p.id)).map(p => p.roleId).filter(id => id !== null);
    state.roles = state.roles.map(r => 
      roleIdsToUpdate.includes(r.id) ? { ...r, teamId: effect.roleTeamId || null } : r
    );
  }
};

/**
 * Assign team to role effect
 */
export const handleAssignTeamToRole: EffectHandler = (effect, context, state) => {
  if (!effect.roleId || effect.teamId === 'unchanged' || effect.teamId === undefined) return;
  
  state.roles = state.roles.map(r => 
    r.id === effect.roleId ? { ...r, teamId: effect.teamId || null } : r
  );
  
  state.players = state.players.map(p => 
    p.roleId === effect.roleId ? { ...p, teamId: effect.teamId || null } : p
  );
};

/**
 * Clear player team effect
 */
export const handleClearPlayerTeam: EffectHandler = (effect, context, state) => {
  const ids = getPlayerIds(context);
  if (ids.length === 0) return;
  
  state.players = state.players.map(p => 
    ids.includes(p.id) ? { ...p, teamId: null } : p
  );
};

/**
 * Join target team effect
 */
export const handleJoinTargetTeam: EffectHandler = (effect, context, state) => {
  const initiatorIds = getPlayerIds(context);
  if (initiatorIds.length === 0) return;
  
  const targetIds = getTargetIds(effect, state, initiatorIds);
  
  if (targetIds.length > 0 && initiatorIds.length > 0) {
    const idB = targetIds[0];
    const playerB = state.players.find(p => p.id === idB);
    if (playerB) {
      const targetTeamId = playerB.teamId;
      state.players = state.players.map(p => 
        initiatorIds.includes(p.id) ? { ...p, teamId: targetTeamId } : p
      );
    }
  }
};

/**
 * Shuffle teams effect
 */
export const handleShuffleTeams: EffectHandler = (effect, context, state) => {
  const teamIds = state.teams.map(t => t.id);
  if (teamIds.length === 0) return;
  
  state.players = state.players.map(p => {
    if (!p.isDead) {
      const randomTeamId = teamIds[Math.floor(Math.random() * teamIds.length)];
      return { ...p, teamId: randomTeamId };
    }
    return p;
  });
};
