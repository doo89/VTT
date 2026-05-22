import type { EffectHandler, EffectContext, EffectState } from '../types';
import { v4 as uuidv4 } from 'uuid';

function getPlayerIds(context: EffectContext): string[] {
  if (!context.$Joueur) return [];
  return context.$Joueur._isMultiple ? (context.$Joueur._ids || []) : [context.$Joueur.id];
}

function getCibleIds(context: EffectContext, state: EffectState): string[] {
  if (context.$Cible) {
    return context.$Cible._isMultiple ? (context.$Cible._ids || []) : [context.$Cible.id];
  }
  if (context.$Joueur?._isMultiple && context.$Joueur._ids && context.$Joueur._ids.length > 1) {
    return context.$Joueur._ids.slice(1);
  }
  return [];
}

function selectTargetPlayer(context: EffectContext, state: EffectState, effect: any): string | null {
  const players = state.players;
  let targets = [...players];

  if (effect.excludeDead) targets = targets.filter(p => !p.isDead);
  if (effect.excludeSelf) {
    const joueurIds = getPlayerIds(context);
    targets = targets.filter(p => !joueurIds.includes(p.id));
  }
  if (effect.excludeRoleIds?.length) {
    targets = targets.filter(p => !effect.excludeRoleIds.includes(p.roleId));
  }
  if (effect.excludeTagIds?.length) {
    targets = targets.filter(p => !p.tags?.some((t: any) => effect.excludeTagIds.includes(t.id)));
  }
  if (effect.excludeTeamIds?.length) {
    targets = targets.filter(p => !effect.excludeTeamIds.includes(p.teamId));
  }
  if (effect.targetRoleId) targets = targets.filter(p => p.roleId === effect.targetRoleId);
  if (effect.targetTagId) targets = targets.filter(p => p.tags?.some((t: any) => t.id === effect.targetTagId));
  if (effect.targetTeamId) targets = targets.filter(p => p.teamId === effect.targetTeamId);
  if (effect.selectionStatus === 'alive') targets = targets.filter(p => !p.isDead);
  if (effect.selectionStatus === 'dead') targets = targets.filter(p => p.isDead);
  if (effect.selectionStatus && effect.selectionStatus !== 'alive' && effect.selectionStatus !== 'dead') {
    targets = targets.filter(p => p.selectionPastilles?.some((p: any) => p.icon === effect.selectionStatus));
  }

  if (targets.length === 0) return null;

  const selType = effect.selectionType || 'random';
  if (selType === 'random') return targets[Math.floor(Math.random() * targets.length)].id;
  if (selType === 'first') return targets[0].id;
  if (selType === 'last') return targets[targets.length - 1].id;
  if (selType === 'callOrder') {
    const idx = state.callOrderIndex;
    return targets[idx]?.id || targets[0].id;
  }
  if (selType === 'numeric') {
    const idx = (effect.value || 1) - 1;
    return targets[idx]?.id || targets[0].id;
  }
  if (selType === 'tag') return targets[0]?.id || null;
  if (selType === 'pastille') return targets[0]?.id || null;
  return targets[0].id;
}

export const handleCreateCouple: EffectHandler = (effect, context, state, storeApi) => {
  const joueurIds = getPlayerIds(context);
  const cibleIds = getCibleIds(context, state);

  let player1Id: string | null = joueurIds[0] || null;
  let player2Id: string | null = cibleIds[0] || null;

  if (!player2Id) {
    player2Id = selectTargetPlayer(context, state, effect);
  }

  if (!player1Id || !player2Id || player1Id === player2Id) return;

  const coupleId = uuidv4();
  state.players = state.players.map(p => {
    if (p.id === player1Id || p.id === player2Id) {
      return { ...p, coupleId };
    }
    return p;
  });

  const p1 = state.players.find(p => p.id === player1Id);
  const p2 = state.players.find(p => p.id === player2Id);
  storeApi?.addLog(`Cupidon lie ${p1?.name || 'Joueur 1'} et ${p2?.name || 'Joueur 2'} dans un couple`, 'action');
};

export const handleKillPartner: EffectHandler = (effect, context, state, storeApi) => {
  const joueurIds = getPlayerIds(context);
  if (joueurIds.length === 0) return;

  const player = state.players.find(p => p.id === joueurIds[0]);
  if (!player?.coupleId) return;

  const partner = state.players.find(p => p.coupleId === player.coupleId && p.id !== joueurIds[0]);
  if (!partner) return;

  state.players = state.players.map(p => {
    if (p.id === partner.id) {
      return { ...p, isDead: true };
    }
    return p;
  });

  storeApi?.addLog(`${partner.name} (partenaire du couple) meurt`, 'death');
};

export const handleRandomSelect: EffectHandler = (effect, context, state, storeApi) => {
  const targetId = selectTargetPlayer(context, state, effect);
  if (!targetId) return;

  const target = state.players.find(p => p.id === targetId);
  if (!target) return;

  storeApi?.setSelectedEntityIds([targetId]);
  storeApi?.addLog(`Sélection aléatoire: ${target.name}`, 'action');
};

export const handleCheckRole: EffectHandler = (effect, context, state, storeApi) => {
  const joueurIds = getPlayerIds(context);
  if (joueurIds.length === 0) return;

  const targetId = selectTargetPlayer(context, state, effect);
  if (!targetId) return;

  const target = state.players.find(p => p.id === targetId);
  if (!target) return;

  const role = state.roles.find(r => r.id === target.roleId);
  const roleName = role?.name || 'Inconnu';

  storeApi?.addLog(`Vérification de rôle: ${target.name} est ${roleName}`, 'info');

  if (effect.revealInSmartphoneGamePopup) {
    storeApi?.addCustomPopup({
      title: 'Vérification de Rôle',
      content: `${target.name} est ${roleName}`,
      showCloseButton: true,
      autoCloseTimer: false,
      showToGM: true,
      showToSmartphone: false,
    });
  }
};

export const handleRevealRoleToGM: EffectHandler = (effect, context, state, storeApi) => {
  const joueurIds = getPlayerIds(context);
  if (joueurIds.length === 0) return;

  const targetId = selectTargetPlayer(context, state, effect);
  if (!targetId) return;

  const target = state.players.find(p => p.id === targetId);
  if (!target) return;

  const role = state.roles.find(r => r.id === target.roleId);
  const roleName = role?.name || 'Inconnu';

  storeApi?.addLog(`[GM] ${target.name} → ${roleName}`, 'role');
};

export const handleInfectPlayer: EffectHandler = (effect, context, state, storeApi) => {
  const joueurIds = getPlayerIds(context);
  if (joueurIds.length === 0) return;

  const targetId = selectTargetPlayer(context, state, effect);
  if (!targetId) return;

  const target = state.players.find(p => p.id === targetId);
  if (!target) return;

  const newRoleId = effect.targetRoleId || target.roleId;
  if (!newRoleId) return;

  state.players = state.players.map(p => {
    if (p.id === targetId) {
      return { ...p, roleId: newRoleId };
    }
    return p;
  });

  const role = state.roles.find(r => r.id === newRoleId);
  storeApi?.addLog(`${target.name} est infecté et devient ${role?.name || 'loup-garou'}`, 'role');
};

export const handleCurePlayer: EffectHandler = (effect, context, state, storeApi) => {
  const joueurIds = getPlayerIds(context);
  if (joueurIds.length === 0) return;

  const targetId = selectTargetPlayer(context, state, effect);
  if (!targetId) return;

  const target = state.players.find(p => p.id === targetId);
  if (!target) return;

  const newRoleId = effect.targetRoleId;
  if (!newRoleId) return;

  state.players = state.players.map(p => {
    if (p.id === targetId) {
      return { ...p, roleId: newRoleId };
    }
    return p;
  });

  const role = state.roles.find(r => r.id === newRoleId);
  storeApi?.addLog(`${target.name} est guéri et redevient ${role?.name || 'villageois'}`, 'role');
};
