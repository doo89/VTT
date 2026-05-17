import type { EffectHandler, EffectContext, EffectState } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get player IDs from context (handles single and multiple players)
 */
function getPlayerIds(context: EffectContext): string[] {
  if (!context.$Joueur) return [];
  return context.$Joueur._isMultiple ? (context.$Joueur._ids || []) : [context.$Joueur.id];
}

/**
 * Assign tag to player effect
 */
export const handleAssignTag: EffectHandler = (effect, context, state) => {
  const tagModel = state.tags.find(t => t.id === effect.tagId);
  const ids = getPlayerIds(context);
  
  if (!tagModel || ids.length === 0) return;
  
  state.players = state.players.map(p => {
    if (ids.includes(p.id)) {
      const hasTag = p.tags?.some((t: any) => t.id === effect.tagId);
      if (!hasTag) {
        const newTag = { ...tagModel, instanceId: uuidv4() };
        return { ...p, tags: [...(p.tags || []), newTag] };
      }
    }
    return p;
  });
};

/**
 * Remove tag from player effect
 */
export const handleRemoveTag: EffectHandler = (effect, context, state) => {
  const ids = getPlayerIds(context);
  if (ids.length === 0 || !effect.tagId) return;
  
  state.players = state.players.map(p => {
    if (ids.includes(p.id)) {
      return { ...p, tags: (p.tags || []).filter((t: any) => t.id !== effect.tagId) };
    }
    return p;
  });
};

/**
 * Delete all tags effect
 */
export const handleDeleteAllTags: EffectHandler = (effect, context, state) => {
  state.markers = [];
};

/**
 * Delete all player tags effect
 */
export const handleDeleteAllPlayerTags: EffectHandler = (effect, context, state) => {
  state.players = state.players.map(p => ({ ...p, tags: [] }));
};

/**
 * Delete selection pastilles effect
 */
export const handleDeleteSelectionPastilles: EffectHandler = (effect, context, state) => {
  state.players = state.players.map(p => ({ ...p, selectionPastilles: [] }));
};

/**
 * Assign tag to role effect
 */
export const handleAssignTagToRole: EffectHandler = (effect, context, state) => {
  const tagModel = state.tags.find(t => t.id === effect.tagId);
  if (!tagModel || !effect.roleId) return;
  
  state.players = state.players.map(p => {
    if (p.roleId === effect.roleId) {
      const hasTag = p.tags?.some((t: any) => t.id === effect.tagId);
      if (!hasTag) {
        const newTag = { ...tagModel, instanceId: uuidv4() };
        return { ...p, tags: [...(p.tags || []), newTag] };
      }
    }
    return p;
  });
};

/**
 * Remove tag from role effect
 */
export const handleRemoveTagFromRole: EffectHandler = (effect, context, state) => {
  if (!effect.tagId || !effect.roleId) return;
  
  state.players = state.players.map(p => {
    if (p.roleId === effect.roleId) {
      return { ...p, tags: (p.tags || []).filter((t: any) => t.id !== effect.tagId) };
    }
    return p;
  });
};

/**
 * Increment tag value (uses) effect
 */
export const handleIncrementTagValue: EffectHandler = (effect, context, state) => {
  const ids = getPlayerIds(context);
  if (ids.length === 0 || !effect.tagId || effect.tagIncrement === undefined) return;
  
  state.players = state.players.map(p => {
    if (ids.includes(p.id)) {
      const newTags = (p.tags || []).map((t: any) => {
        if (t.id === effect.tagId) {
          const currentUses = typeof t.uses === 'number' ? t.uses : (parseInt(String(t.uses)) || 0);
          return { ...t, uses: currentUses + effect.tagIncrement! };
        }
        return t;
      });
      return { ...p, tags: newTags };
    }
    return p;
  });
};

/**
 * Spread tag to nearby players effect
 */
export const handleSpreadTag: EffectHandler = (effect, context, state) => {
  const tagModel = state.tags.find(t => t.id === effect.tagId);
  const ids = getPlayerIds(context);
  
  if (!tagModel || ids.length === 0 || effect.spreadRadius === undefined) return;
  
  const initiators = state.players.filter(p => ids.includes(p.id));
  const targetIds = new Set<string>();
  
  state.players.forEach(p => {
    if (p.isDead) return;
    for (const init of initiators) {
      const dx = p.x - init.x;
      const dy = p.y - init.y;
      if (Math.sqrt(dx * dx + dy * dy) <= effect.spreadRadius!) {
        targetIds.add(p.id);
        break;
      }
    }
  });

  state.players = state.players.map(p => {
    if (targetIds.has(p.id)) {
      const hasTag = p.tags?.some((t: any) => t.id === effect.tagId);
      if (!hasTag) {
        const newTag = { ...tagModel, instanceId: uuidv4() };
        return { ...p, tags: [...(p.tags || []), newTag] };
      }
    }
    return p;
  });
};

/**
 * Swap player tags effect
 */
export const handleSwapPlayerTags: EffectHandler = (effect, context, state) => {
  const initiatorIds = getPlayerIds(context);
  if (initiatorIds.length === 0) return;
  
  let targetIds: string[] = [];
  if (effect.swapTargetMode === 'role' && effect.roleId) {
    targetIds = state.players.filter(p => p.roleId === effect.roleId).map(p => p.id);
  } else if (effect.swapTargetMode === 'tag' && effect.tagId) {
    targetIds = state.players.filter(p => p.tags?.some((t: any) => t.id === effect.tagId)).map(p => p.id);
  } else if (effect.swapTargetMode === 'random') {
    const validTargets = state.players.filter(p => !p.isDead && !initiatorIds.includes(p.id));
    if (validTargets.length > 0) {
      const randomPlayer = validTargets[Math.floor(Math.random() * validTargets.length)];
      targetIds = [randomPlayer.id];
    }
  }

  if (targetIds.length > 0 && initiatorIds.length > 0) {
    const idA = initiatorIds[0];
    const idB = targetIds[0];
    if (idA !== idB) {
      const playerA = state.players.find(p => p.id === idA);
      const playerB = state.players.find(p => p.id === idB);
      if (playerA && playerB) {
        const tagsA = playerA.tags || [];
        const tagsB = playerB.tags || [];
        state.players = state.players.map(p => {
          if (p.id === idA) return { ...p, tags: tagsB };
          if (p.id === idB) return { ...p, tags: tagsA };
          return p;
        });
      }
    }
  }
};
