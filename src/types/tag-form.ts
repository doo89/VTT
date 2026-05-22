import type { EntityId } from './index';

export interface TagFormData {
  id: string;
  name: string;
  color: string;
  icon: string;
  imageUrl?: string;
  categoryId?: EntityId | null;
  childTagIds?: EntityId[];
  handoutId?: EntityId | null;
  description?: string;
  lives: string | number | null;
  points: string | number | null;
  votes: string | number | null;
  uses: string | number | null;
  autoDeleteOnZeroUses?: boolean;
  callOrderDay: string | number | null;
  callOrderNight: string | number | null;
  showInTooltip?: boolean;
  showInGameTab?: boolean;
  showOnSmartphone?: boolean;
  showPastille?: boolean;
  visibleInWiki?: boolean;
  isSecret?: boolean;
  seenAsRoleId?: EntityId | null;
  seenInTeamId?: EntityId | null;

  isMultiPlayerSelector?: boolean;
  isSinglePlayerSelector?: boolean;
  smartphoneButtonText?: string;
  smartphoneButtonFeedback?: string;
  smartphonePlayerFeedback?: string;
  smartphoneAutoDelete?: boolean;
  smartphoneReturnInfo?: 'none' | 'real_role' | 'real_team' | 'seen_role' | 'seen_team';
  smartphoneShowPastille?: boolean;
  smartphoneMergeTagId?: EntityId | null;
  smartphoneSelfMergeTagId?: EntityId | null;
  smartphoneActionId?: EntityId | null;
  smartphoneFilterAlive?: boolean;
  smartphoneFilterDead?: boolean;
  smartphoneFilterMyRole?: boolean;
  smartphoneFilterNotMe?: boolean;
  smartphoneFilterNotMyRole?: boolean;
  smartphoneFilterMyTeam?: boolean;
  smartphoneFilterNotMyTeam?: boolean;
  smartphoneFilterNotThisTag?: boolean;
  smartphoneFilterExcludeTagId?: EntityId | null;
  smartphoneIsCheckRoleEnabled?: boolean;
  smartphoneCheckRoleId?: EntityId | null;
  smartphoneCheckRoleVague?: boolean;
  smartphoneCheckRoleCount?: boolean;
}

export type TagFormUpdate = Partial<TagFormData>;

export interface ValidationError {
  field: string;
  message: string;
}

const NUMERIC_FIELDS = ['lives', 'points', 'votes', 'uses', 'callOrderDay', 'callOrderNight'] as const;

export function validateTagForm(data: TagFormData): ValidationError[] {
  const errors: ValidationError[] = [];
  for (const field of NUMERIC_FIELDS) {
    const val = data[field];
    if (val === null || val === '' || val === undefined) continue;
    const str = String(val);
    if (!/^-?\d*\.?\d*$/.test(str.trim())) {
      errors.push({ field, message: `Valeur invalide : "${str}" n'est pas un nombre` });
    }
  }
  return errors;
}

export type NumericField = typeof NUMERIC_FIELDS[number];
