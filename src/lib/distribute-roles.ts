import type { Role, Player } from '../types';

export interface DistributeSettings {
  distributionResurrectAll?: boolean;
  distributionDeleteTags?: boolean;
  distributionRemovePastilles?: boolean;
  distributionResetLives?: boolean;
  distributionResetPoints?: boolean;
  distributionResetVotes?: boolean;
  distributionDeletePrivateNotes?: boolean;
  distributionDeletePublicNotes?: boolean;
}

export interface RoleAssignment {
  playerId: string;
  roleId: string;
  teamId: string | null;
  updates: Partial<Player>;
}

export interface DistributeResult {
  assignments: RoleAssignment[];
  unassigned: number;
  fillerName?: string;
  fillerCount: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function distributeRoles(
  roles: Role[],
  players: Player[],
  settings: DistributeSettings
): DistributeResult {
  const selected = roles.filter(r => r.isSelectableForDistribution);
  if (selected.length === 0 || players.length === 0) {
    return { assignments: [], unassigned: players.length, fillerCount: 0 };
  }

  const requiredGroups: Role[][] = [];
  const optionalPool: Role[] = [];

  selected.forEach(role => {
    if (role.isUnique) {
      requiredGroups.push([role]);
    } else if (role.isMinMandatory) {
      const min = role.minCount || 0;
      const mandatory: Role[] = [];
      for (let i = 0; i < min; i++) mandatory.push(role);
      requiredGroups.push(mandatory);
      const extra = (role.distributionQuantity || 1) - min;
      for (let i = 0; i < extra; i++) optionalPool.push(role);
    } else {
      const qty = role.distributionQuantity || 1;
      for (let i = 0; i < qty; i++) optionalPool.push(role);
    }
  });

  const shuffledRequired = shuffle(requiredGroups);
  const totalPlayers = players.length;

  const pool: Role[] = [];
  shuffledRequired.forEach(group => {
    if (pool.length + group.length <= totalPlayers) {
      pool.push(...group);
    }
  });

  const shuffledOptional = shuffle(optionalPool);
  shuffledOptional.forEach(role => {
    if (pool.length < totalPlayers) {
      pool.push(role);
    }
  });

  const fillerRole = selected.find(r => r.isFiller);
  let fillerCount = 0;
  if (pool.length < totalPlayers && fillerRole) {
    const diff = totalPlayers - pool.length;
    for (let i = 0; i < diff; i++) {
      pool.push(fillerRole);
    }
    fillerCount = diff;
  }

  const finalPool = shuffle(pool);

  const assignments: RoleAssignment[] = [];
  players.forEach((player, index) => {
    const assignedRole = finalPool[index];
    if (!assignedRole) return;

    assignments.push({
      playerId: player.id,
      roleId: assignedRole.id,
      teamId: assignedRole.teamId,
      updates: {
        roleId: assignedRole.id,
        teamId: assignedRole.teamId,
        ...(settings.distributionResurrectAll !== false ? { isDead: false } : {}),
        ...(settings.distributionDeleteTags !== false ? { tags: [] } : {}),
        ...(settings.distributionRemovePastilles !== false ? { selectionPastilles: [] } : {}),
        ...(settings.distributionResetLives !== false ? { lives: assignedRole.lives } : {}),
        ...(settings.distributionResetPoints !== false ? { points: 0 } : {}),
        ...(settings.distributionResetVotes !== false ? { votes: 0 } : {}),
        ...(settings.distributionDeletePrivateNotes !== false ? { privateNotes: '' } : {}),
        ...(settings.distributionDeletePublicNotes !== false ? { publicNotes: '' } : {}),
      }
    });
  });

  return {
    assignments,
    unassigned: totalPlayers - assignments.length,
    fillerName: fillerCount > 0 ? fillerRole?.name : undefined,
    fillerCount,
  };
}
