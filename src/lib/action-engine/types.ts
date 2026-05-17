import type { ActionEffect, Player, Role, TagModel, Team, Action, CustomPopup, GroupVote, SoundboardState, LogEvent, ChecklistItem } from '../../types';

/**
 * Context passed to effect handlers during action execution
 */
export interface EffectContext {
  $Joueur?: Player & { _isMultiple?: boolean; _ids?: string[] };
  $Cible?: Player;
  [key: string]: any;
}

/**
 * Mutable state object passed to effect handlers
 * Contains all the "next" values that will be committed to the store
 */
export interface EffectState {
  players: Player[];
  roles: Role[];
  tags: TagModel[];
  teams: Team[];
  markers: any[];
  actions: Action[];
  handouts: any[];
  customPopups: CustomPopup[];
  logs: LogEvent[];
  customVariables: Record<string, number>;
  displaySettings: any;
  soundboard: SoundboardState;
  room: any;
  checklist: ChecklistItem[];
  cycleMode: 'dayNight' | 'turns' | 'none';
  isNight: boolean;
  cycleNumber: number;
  callOrderIndex: number;
  timer: any;
  activeGroupVote: GroupVote | null;
  smartphoneCountdown: any;
  smartphoneActionMessage: { playerName: string; message: string } | null;
  activeCustomPopupId: string | null;
}

/**
 * Return type for effect handlers
 * Can return partial updates to merge into the state
 */
export interface EffectResult {
  [key: string]: any;
}

/**
 * Effect handler function signature
 */
export type EffectHandler = (
  effect: ActionEffect,
  context: EffectContext,
  state: EffectState,
  storeApi: any // The Zustand store for calling actions like addLog
) => EffectResult | void;
