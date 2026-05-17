/**
 * State Diff Utility
 * 
 * Computes minimal differences between two states to optimize Supabase broadcasts.
 * Only sends changed fields instead of the entire state.
 */

export interface StateDiff {
  changed: boolean;
  payload: Record<string, any>;
  changedFields: string[];
}

/**
 * Deep equality check for primitive values and simple objects
 */
function isEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;
  
  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    // For arrays, check reference equality for performance
    return a === b;
  }
  
  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(key => isEqual(a[key], b[key]));
  }
  
  return false;
}

/**
 * Compute diff between two states
 * Returns only the fields that have changed
 */
export function computeStateDiff(
  oldState: Record<string, any>,
  newState: Record<string, any>,
  fieldsToCompare: string[]
): StateDiff {
  const changedFields: string[] = [];
  const payload: Record<string, any> = {};

  for (const field of fieldsToCompare) {
    if (!isEqual(oldState[field], newState[field])) {
      changedFields.push(field);
      payload[field] = newState[field];
    }
  }

  return {
    changed: changedFields.length > 0,
    payload,
    changedFields,
  };
}

/**
 * Fields to compare for broadcast optimization
 * These are the fields that should trigger a broadcast when changed
 */
export const BROADCAST_FIELDS = [
  'players',
  'roles',
  'teams',
  'tags',
  'handouts',
  'isNight',
  'cycleMode',
  'isPublicMode',
  'displaySettings',
  'wiki',
  'checklist',
  'customPopups',
  'activeCustomPopupId',
  'activeGroupVote',
  'smartphoneCountdown',
  'timer',
  'logs',
  'room',
];

/**
 * Create an optimized broadcast payload with only changed fields
 */
export function createOptimizedBroadcastPayload(
  oldState: Record<string, any>,
  newState: Record<string, any>
): { payload: Record<string, any>; shouldBroadcast: boolean } {
  const diff = computeStateDiff(oldState, newState, BROADCAST_FIELDS);
  
  if (!diff.changed) {
    return { payload: {}, shouldBroadcast: false };
  }

  // Strip large binary data from payload
  const stripImage = (url: string | null | undefined) =>
    url && (url.startsWith('data:') || url.length > 2000) ? null : url;

  const optimizedPayload: Record<string, any> = {};

  // Only include changed fields in the payload
  for (const field of diff.changedFields) {
    const value = diff.payload[field];
    
    if (field === 'players') {
      optimizedPayload.players = value.map((p: any) => ({
        ...p,
        imageUrl: stripImage(p.imageUrl),
      }));
    } else if (field === 'roles') {
      optimizedPayload.roles = value.map((r: any) => ({
        ...r,
        imageUrl: stripImage(r.imageUrl),
      }));
    } else if (field === 'tags') {
      optimizedPayload.tags = value.map((t: any) => ({
        ...t,
        imageUrl: stripImage(t.imageUrl),
      }));
    } else if (field === 'handouts') {
      optimizedPayload.handouts = value.map((h: any) => ({
        ...h,
        imageUrl: stripImage(h.imageUrl),
        referenceImageUrl: stripImage(h.referenceImageUrl),
      }));
    } else if (field === 'room') {
      optimizedPayload.room = {
        ...value,
        backgroundImage: stripImage(value.backgroundImage),
      };
    } else if (field === 'customPopups') {
      optimizedPayload.customPopups = value.map((p: any) => ({
        ...p,
        imageUrl: stripImage(p.imageUrl),
      }));
    } else if (field === 'soundboard') {
      optimizedPayload.soundboard = {
        remoteEnabled: value?.remoteEnabled || false,
        remoteShowSounds: value?.remoteShowSounds ?? true,
        remoteShowTasks: value?.remoteShowTasks ?? true,
        remoteShowHandouts: value?.remoteShowHandouts ?? true,
        remoteShowActions: value?.remoteShowActions ?? true,
        remoteShowPlayers: value?.remoteShowPlayers ?? false,
        remoteShowDeadPlayers: value?.remoteShowDeadPlayers ?? false,
        remoteAllowPrivateNotes: value?.remoteAllowPrivateNotes ?? false,
        cols: value?.cols || 4,
        rows: value?.rows || 3,
        buttons: value?.buttons?.map((b: any) => ({
          index: b.index,
          name: b.name,
          icon: b.icon,
          color: b.color,
          hasAudio: !!b.audioUrl,
          isOneShot: b.isOneShot,
          imageUrl: stripImage(b.imageUrl),
        })) || [],
      };
    } else {
      optimizedPayload[field] = value;
    }
  }

  return {
    payload: optimizedPayload,
    shouldBroadcast: true,
  };
}

/**
 * Merge a partial payload with the full state for clients
 * This is used on the client side to apply incremental updates
 */
export function mergeStateDiff(
  currentState: Record<string, any>,
  diffPayload: Record<string, any>
): Record<string, any> {
  return {
    ...currentState,
    ...diffPayload,
  };
}
