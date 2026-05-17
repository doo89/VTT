import type { Player, Role, TagModel, Team, EntityId } from '../../types';

/**
 * Creates a Map from an array of entities indexed by their ID
 * O(1) lookup instead of O(n) with .find()
 */
export function createEntityMap<T extends { id: EntityId }>(entities: T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const entity of entities) {
    map.set(entity.id, entity);
  }
  return map;
}

/**
 * Creates an index of players by their normalized name
 * O(1) lookup by name instead of O(n) with .find()
 */
export function createPlayerNameIndex(players: Player[]): Map<string, Player> {
  const map = new Map<string, Player>();
  const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
  
  for (const player of players) {
    const normalizedName = normalize(player.name);
    map.set(normalizedName, player);
  }
  return map;
}

/**
 * Utility: Get player by ID using Map for O(1) lookup
 */
export function getPlayerById(players: Player[], playerId: EntityId): Player | undefined {
  const map = createEntityMap(players);
  return map.get(playerId);
}

/**
 * Utility: Get player by name using index for O(1) lookup
 */
export function getPlayerByName(players: Player[], playerName: string): Player | undefined {
  const index = createPlayerNameIndex(players);
  const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
  return index.get(normalize(playerName));
}

/**
 * Utility: Get role by ID using Map for O(1) lookup
 */
export function getRoleById(roles: Role[], roleId: EntityId): Role | undefined {
  const map = createEntityMap(roles);
  return map.get(roleId);
}

/**
 * Utility: Get tag by ID using Map for O(1) lookup
 */
export function getTagById(tags: TagModel[], tagId: EntityId): TagModel | undefined {
  const map = createEntityMap(tags);
  return map.get(tagId);
}

/**
 * Utility: Get team by ID using Map for O(1) lookup
 */
export function getTeamById(teams: Team[], teamId: EntityId): Team | undefined {
  const map = createEntityMap(teams);
  return map.get(teamId);
}

/**
 * Utility: Get players by role ID
 */
export function getPlayersByRole(players: Player[], roleId: EntityId): Player[] {
  return players.filter(p => p.roleId === roleId);
}

/**
 * Utility: Get players by team ID
 */
export function getPlayersByTeam(players: Player[], teamId: EntityId): Player[] {
  return players.filter(p => p.teamId === teamId);
}

/**
 * Utility: Get alive players
 */
export function getAlivePlayers(players: Player[]): Player[] {
  return players.filter(p => !p.isDead);
}

/**
 * Utility: Get dead players
 */
export function getDeadPlayers(players: Player[]): Player[] {
  return players.filter(p => p.isDead);
}
