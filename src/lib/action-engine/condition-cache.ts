/**
 * Condition Evaluation Cache
 * 
 * Caches condition evaluation results to avoid redundant computations.
 * Conditions are re-evaluated only when relevant state changes.
 */

import type { ActionCondition, Player, Role, TagModel } from '../../types';

/**
 * Cache key generated from condition and relevant state hashes
 */
interface CacheEntry {
  result: boolean;
  timestamp: number;
  stateHash: string;
}

/**
 * Simple LRU cache for condition evaluations
 */
export class ConditionCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number;
  private ttl: number; // Time to live in ms

  constructor(maxSize: number = 1000, ttl: number = 5000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  /**
   * Generate a hash from condition and relevant state
   */
  private generateKey(
    condition: ActionCondition,
    players: Player[],
    roles: Role[],
    tags: TagModel[],
    context: Record<string, any>
  ): string {
    // Create a lightweight hash based on condition and state references
    const parts = [
      condition.id,
      condition.type,
      condition.enabled,
      players.length,
      roles.length,
      tags.length,
      context.$Joueur?.id || 'none',
    ];
    return parts.join(':');
  }

  /**
   * Get cached result if available and not expired
   */
  get(
    condition: ActionCondition,
    players: Player[],
    roles: Role[],
    tags: TagModel[],
    context: Record<string, any>
  ): boolean | null {
    const key = this.generateKey(condition, players, roles, tags, context);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.result;
  }

  /**
   * Cache a condition evaluation result
   */
  set(
    condition: ActionCondition,
    players: Player[],
    roles: Role[],
    tags: TagModel[],
    context: Record<string, any>,
    result: boolean
  ): void {
    const key = this.generateKey(condition, players, roles, tags, context);

    // Evict oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      stateHash: key,
    });
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

/**
 * Singleton condition cache instance
 */
export const conditionCache = new ConditionCache(1000, 5000);

/**
 * Memoized condition evaluator
 * Returns cached result if available, otherwise evaluates and caches
 */
export function evaluateConditionWithCache(
  condition: ActionCondition,
  players: Player[],
  roles: Role[],
  tags: TagModel[],
  context: Record<string, any>,
  evaluator: () => boolean
): boolean {
  // Try to get from cache
  const cached = conditionCache.get(condition, players, roles, tags, context);
  if (cached !== null) {
    return cached;
  }

  // Evaluate and cache
  const result = evaluator();
  conditionCache.set(condition, players, roles, tags, context, result);
  return result;
}

/**
 * Invalidate cache when state changes significantly
 * Call this when players, roles, or tags are modified
 */
export function invalidateConditionCache(): void {
  conditionCache.clear();
}
