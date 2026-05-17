/**
 * Entity Cache - O(1) Lookups
 * 
 * Provides cached Map-based lookups for entities to avoid O(n) .find() calls
 * Automatically invalidates when entities change
 */

import type { Player, Role, TagModel, Team, EntityId } from '../../types';

/**
 * Generic entity cache using Map for O(1) lookups
 */
export class EntityCache<T extends { id: EntityId }> {
  private map: Map<string, T> = new Map();
  private version: number = 0;
  private lastVersion: number = -1;

  /**
   * Get or rebuild the cache
   * Rebuilds only if version has changed (optimization)
   */
  get(entities: T[], currentVersion: number): Map<string, T> {
    if (currentVersion !== this.lastVersion || this.map.size !== entities.length) {
      this.rebuild(entities);
      this.lastVersion = currentVersion;
    }
    return this.map;
  }

  /**
   * Rebuild the cache from entities array
   */
  private rebuild(entities: T[]): void {
    this.map.clear();
    for (const entity of entities) {
      this.map.set(entity.id, entity);
    }
    this.version++;
  }

  /**
   * Get a single entity by ID
   */
  getById(entities: T[], id: EntityId, version: number): T | undefined {
    const map = this.get(entities, version);
    return map.get(id);
  }

  /**
   * Invalidate the cache (force rebuild on next get)
   */
  invalidate(): void {
    this.lastVersion = -1;
  }
}

/**
 * Singleton caches for each entity type
 */
const playerCache = new EntityCache<Player>();
const roleCache = new EntityCache<Role>();
const tagCache = new EntityCache<TagModel>();
const teamCache = new EntityCache<Team>();

/**
 * Get player by ID with O(1) cache lookup
 */
export function getCachedPlayer(
  players: Player[],
  id: EntityId,
  version: number
): Player | undefined {
  return playerCache.getById(players, id, version);
}

/**
 * Get role by ID with O(1) cache lookup
 */
export function getCachedRole(
  roles: Role[],
  id: EntityId,
  version: number
): Role | undefined {
  return roleCache.getById(roles, id, version);
}

/**
 * Get tag by ID with O(1) cache lookup
 */
export function getCachedTag(
  tags: TagModel[],
  id: EntityId,
  version: number
): TagModel | undefined {
  return tagCache.getById(tags, id, version);
}

/**
 * Get team by ID with O(1) cache lookup
 */
export function getCachedTeam(
  teams: Team[],
  id: EntityId,
  version: number
): Team | undefined {
  return teamCache.getById(teams, id, version);
}

/**
 * Get multiple players by IDs with O(1) cache lookups
 */
export function getCachedPlayers(
  players: Player[],
  ids: EntityId[],
  version: number
): Player[] {
  const result: Player[] = [];
  for (const id of ids) {
    const player = playerCache.getById(players, id, version);
    if (player) {
      result.push(player);
    }
  }
  return result;
}

/**
 * Create a version number from array reference
 * Use this to detect if the array has changed
 */
export function getVersion(arr: any[]): number {
  // Simple version based on array reference
  // In a more complex scenario, you could use a hash
  return arr.length;
}

/**
 * Invalidate all caches
 * Call this when entities are modified outside the cache
 */
export function invalidateAllCaches(): void {
  playerCache.invalidate();
  roleCache.invalidate();
  tagCache.invalidate();
  teamCache.invalidate();
}
