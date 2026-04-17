export type EntityId = string;

export interface Player {
  id: EntityId;
  x: number;
  y: number;
  color: string;
  size: number;
  name: string;
  roleId: EntityId | null;
  teamId: EntityId | null;
  isDead: boolean;
  tags: TagInstance[];
  imageUrl?: string;
  lives?: number;
  points?: number;
  votes?: number;
  privateNotes?: string;
  publicNotes?: string;
  publicNotesSendToPlayer?: boolean;
  publicNotesNoticeBoard?: boolean;
  publicNotesTimestamp?: number;
  selectionPastilles?: { id: string, icon: string, color: string, name?: string }[];
  smartphoneImageStyle?: 'circle' | 'square' | 'original' | 'background' | 'none';
  creationOrder?: number;
}

export interface PlayerTemplate {
  id: EntityId;
  name: string;
  color: string;
  size: number;
  imageUrl?: string;
  roleId: EntityId | null;
  teamId: EntityId | null;
  smartphoneImageStyle?: 'circle' | 'square' | 'original' | 'background' | 'none';
}

export interface Role {
  id: EntityId;
  name: string;
  color: string;
  lives: number;
  isUnique: boolean;
  teamId: EntityId | null;
  tags: TagModel[];
  imageUrl?: string;
  seenAsRoleId?: EntityId | null;
  seenInTeamId?: EntityId | null;
  description?: string;
  isSelectableForDistribution?: boolean;
  distributionQuantity?: number;
  smartphoneImageStyle?: 'circle' | 'square' | 'original' | 'background' | 'none';
}

export interface TagCategory {
  id: EntityId;
  name: string;
  icon: string;
  color: string;
}

export interface MarkerParameter {
  id: EntityId;
  name: string;
  lives: string | number | null;
  points: string | number | null;
  votes: string | number | null;
  uses: string | number | null;
  autoDeleteOnZeroUses?: boolean;
  description?: string;
  callOrderDay: string | number | null;
  callOrderNight: string | number | null;
  showInTooltip?: boolean;
  showInGameTab?: boolean;
  showOnSmartphone?: boolean;
  isMultiPlayerSelector?: boolean;
  isSinglePlayerSelector?: boolean;
  smartphoneButtonText?: string;
  smartphoneButtonFeedback?: string;
  smartphonePlayerFeedback?: string;
  smartphoneAutoDelete?: boolean;
  smartphoneReturnInfo?: 'none' | 'real_role' | 'real_team' | 'seen_role' | 'seen_team';
  seenAsRoleId?: EntityId | null;
  seenInTeamId?: EntityId | null;
  visibleInWiki?: boolean;
  smartphoneShowPastille?: boolean;
  smartphoneMergeTagId?: EntityId | null;
  smartphoneSelfMergeTagId?: EntityId | null;
  smartphoneActionId?: EntityId | null;
  // Filters for selector
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

export interface Marker {
  id: EntityId;
  x: number;
  y: number;
  tag: TagInstance;
}

// Global Tag Model (from which instances are created)
export interface TagModel extends MarkerParameter {
  color: string;
  icon: string;
  imageUrl?: string;
  categoryId?: EntityId | null;
  childTagIds?: EntityId[]; // List of other tag model IDs to apply when this container is applied
  handoutId?: EntityId | null; // Reference to a handout image
  isInDistributor?: boolean;
}

// Local Tag Instance (attached to a player or marker)
export interface TagInstance extends TagModel {
  instanceId: EntityId; // Unique ID for this instance
  parentTagInstanceId?: EntityId; // The instanceId of the parent tag (if applied via container)
}

export interface Team {
  id: EntityId;
  name: string;
  icon: string;
  color: string;
}

export type BadgeType = 'none' | 'team' | 'lives' | 'votes' | 'points' | 'uses' | 'callOrderDay' | 'callOrderNight' | 'connection' | 'creationOrder';

export interface BadgeConfig {
  type: BadgeType;
  bgColor: string;
  textColor: string;
}

export interface Handout {
  id: EntityId;
  name: string;
  imageUrl: string;
  isOpen: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  isMaximized?: boolean;
}

export interface SoundButton {
  index: number;
  name: string;
  audioUrl: string; // base64 string
  isOneShot: boolean;
  icon?: string;
  color?: string;
  imageUrl?: string;
}

export interface LogEvent {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'action' | 'system' | 'death' | 'note' | 'role';
}

export interface SoundboardState {
  cols: number;
  rows: number;
  isDetached: boolean;
  x: number;
  y: number;
  buttons: SoundButton[];
  remoteEnabled: boolean;
  remotePasscode: string;
  remotePlayTrigger?: { index: number, timestamp: number } | null;
}

export interface CustomPopup {
  id: string;
  title: string;
  imageUrl?: string | null;
  content: string;
  showCloseButton: boolean;
  autoCloseTimer: boolean;
  soundUrl?: string | null;
}

export type ChecklistItemType = 'text' | 'checkbox' | 'image';

export interface ChecklistItem {
  id: string;
  type: ChecklistItemType;
  content?: string;
  checked?: boolean;
  color?: string;
  imageUrl?: string | null;
}

export interface ChecklistState {
  isOpen: boolean;
  isDetached: boolean;
  x: number;
  y: number;
}

export interface TagDistributorState {
  isOpen: boolean;
  isDetached: boolean;
  x: number;
  y: number;
}

export interface WikiState {
  isOpen: boolean;
  isDetached: boolean;
  x: number;
  y: number;
  content: string;
}

export interface Action {
  id: string;
  name: string;
  conditions?: ActionCondition[];
  effects?: ActionEffect[];
  once?: boolean;
  isExecuted?: boolean;
  isRecurring?: boolean;
  intervalSeconds?: number;
  repeatCount?: number;
  currentRepeatExecution?: number;
  enabled?: boolean;
}

export type ActionEffectType = 
  | 'deleteAllTags' 
  | 'nextPhase' 
  | 'previousPhase' 
  | 'resetCycle'
  | 'distributeRoles'
  | 'showPlayerImage'
  | 'hidePlayerImage'
  | 'showRoleImage'
  | 'hideRoleImage'
  | 'deleteSelectionPastilles' 
  | 'deleteAllPlayerTags'
  | 'setCycleDayNight'
  | 'setCycleTurn'
  | 'setCycleNone'
  | 'popupPlayer'
  | 'showPlayerTooltip'
  | 'hidePlayerTooltip'
  | 'showTagTooltip'
  | 'hideTagTooltip'
  | 'showRoleColor'
  | 'hideRoleColor';

export interface ActionEffect {
  id: string;
  type: ActionEffectType;
  enabled: boolean;
}

export type ActionConditionType = 'day' | 'night' | 'turn' | 'playerRole' | 'playerTag' | 'playerPastille' | 'playerSelection';
export type ActionOperator = '=' | '<' | '>' | '!=' | '<=' | '>=';

export interface ActionCondition {
  id: string;
  type: ActionConditionType;
  operator: ActionOperator;
  value: number;
  roleId?: string | null;
  tagId?: string | null;
  pastilleIcon?: string | null;
  selectionType?: 'first' | 'last' | 'all' | null;
  selectionRoleId?: string | null;
  enabled: boolean;
  logic?: 'AND' | 'OR';
}

export interface ActionCreatorState {
  isOpen: boolean;
  isDetached: boolean;
  x: number;
  y: number;
  editingActionId?: string | null;
}

export interface ActionConditionCreatorState {
  isOpen: boolean;
  x: number;
  y: number;
  editingConditionId?: string | null;
}

export interface ActionEffectCreatorState {
  isOpen: boolean;
  x: number;
  y: number;
  editingEffectId?: string | null;
}

export interface GameState {
  roomName: string;
  roomCode: string | null;
  isRoomPublic: boolean;
  joinRequests: string[];
  onlinePlayerIds: EntityId[];
  selectedEntityIds: EntityId[];
  interactionMode: 'pan' | 'select';
  players: Player[];
  roles: Role[];
  markers: Marker[];
  markerParameters: MarkerParameter[];
  teams: Team[];
  tags: TagModel[]; // Added tags property here
  tagCategories: TagCategory[];
  handouts: Handout[];
  logs: LogEvent[];
  recentColors: string[];
  customPopups: CustomPopup[];
  activeCustomPopupId: string | null;
  checklist: ChecklistItem[];
  isNight: boolean;
  cycleNumber: number;
  cycleMode: 'dayNight' | 'turns' | 'none';
  timer: {
    minutes: number;
    seconds: number;
    isRunning: boolean;
    playSoundAtZero: boolean;
    isDetached: boolean;
    x: number;
    y: number;
  };
  soundboard: SoundboardState;
  wiki: WikiState;
  checklistState: ChecklistState;
  tagDistributorState: TagDistributorState;
  actionCreatorState: ActionCreatorState;
  actionConditionCreatorState: ActionConditionCreatorState;
  actionEffectCreatorState: ActionEffectCreatorState;
  actions: Action[];
  pendingActionConditions: ActionCondition[];
  pendingActionEffects: ActionEffect[];
  pendingActionOnce: boolean;
  pendingActionIsRecurring: boolean;
  pendingActionIntervalSeconds: number;
  pendingActionRepeatCount: number;
  pendingActionEnabled: boolean;
  scoreboard: {
    isDetached: boolean;
    x: number;
    y: number;
    isOpen: boolean;
    showRoles: boolean;
    showPoints: boolean;
    showVotes: boolean;
    showLives: boolean;
    showStatus: boolean;
  };
  activeLeftTab: 'players' | 'roles' | 'tags' | 'game' | 'handouts';
  editingEntity: { type: 'player' | 'playerTemplate' | 'role' | 'tagModel' | 'tagInstance' | 'team' | 'tagCategory' | 'playerNotes' | 'playerPublicNotes' | 'soundButton', id: EntityId, parentId?: EntityId } | null;
  canvas: {
    panX: number;
    panY: number;
    zoom: number;
  };
  grid: {
    enabled: boolean;
    sizeX: number;
    sizeY: number;
  };
  room: {
    width: number;
    height: number;
    backgroundColor: string;
    backgroundImage: string | null;
    backgroundStyle: 'mosaic' | 'center' | 'stretch';
    minimapImageUrl?: string | null;
  };
  displaySettings: {
    showTooltip: boolean;
    showRole: boolean;
    showTeam: boolean;
    showTags: boolean;
    showPlayerName: boolean;
    showPlayers: boolean;
    showCenter: boolean;
    showCycleIcon: boolean;
    foregroundElement: 'players' | 'markers';
    showPlayerImage: boolean;
    showRoleImage: boolean;
    showRoleColor: boolean;
    imagePriority: 'player' | 'role';
    playerNamePosition: 'none' | 'bottom' | 'top' | 'inside';
    showTagName: boolean;
    showOfflineStatus: boolean;
    autoMergeTags: boolean;
    playerBadges: {
      topLeft: BadgeConfig;
      topRight: BadgeConfig;
      bottomLeft: BadgeConfig;
      bottomRight: BadgeConfig;
    };
    smartphoneImageStyle: 'circle' | 'square' | 'original' | 'background' | 'none';
    panels: {
      distribution?: boolean;
      chrono?: boolean;
      soundboard?: boolean;
      scoreboard?: boolean;
      logs?: boolean;
      system?: boolean;
      wiki?: boolean;
      popupCreator?: boolean;
      actionCreator?: boolean;
      checklist?: boolean;
      tagDistributor?: boolean;
    };
    recordLogs: boolean;
    smartphoneTabs: {
      game: boolean;
      players: boolean;
      room: boolean;
      wiki: boolean;
    };
    smartphonePlayersOptions?: {
      allowPrivateNotes: boolean;
      showDeadPlayers: boolean;
      includeSelf: boolean;
      allowNotesForDeadPlayers: boolean;
      showNotePreview: boolean;
    };
    wikiTitle?: string;
    wikiLightMode?: boolean;
    showWikiNotes?: boolean;
    showWikiRoles?: boolean;
    showWikiTags?: boolean;
    wikiOnlySelectedRoles?: boolean;
    wikiOnlyInPlayRoles?: boolean;
    smartphoneImageBlur?: number;
    smartphoneImageMinHeight?: number;
    roomMiniatureAnimation?: boolean;
    roomMiniatureDeadIconUrl?: string | null;
    showTagCallOrderDay?: boolean;
    showTagCallOrderNight?: boolean;
    showTagLives?: boolean;
    showTagVotes?: boolean;
    showTagPoints?: boolean;
    showTagUses?: boolean;
    showTagTooltip?: boolean;
    showTagAutoDelete?: boolean;
    showTagSeenAsRole?: boolean;
    showTagSeenInTeam?: boolean;
    showTagDescription?: boolean;
    showTagNameInTooltip?: boolean;
    showTagNameSeenAsRole?: boolean;
    showTagNameSeenInTeam?: boolean;
    showTagSmartphoneIcon?: boolean;
  };
}