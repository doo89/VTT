export type EntityId = string;

export interface Player {
  id: EntityId;
  x: number;
  y: number;
  color: string;
  size: number;
  name: string;
  roleId: EntityId | null;
  seenAsRoleId?: EntityId | null;
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
  isSleeping?: boolean;
  shape?: PlayerShape;
  pingTimestamp?: number;
  pingColor?: string;
  isRoleRevealedOnBoard?: boolean;
  isRoleRevealedInSmartphoneRoom?: boolean;
  isRoleRevealedInSmartphonePlayers?: boolean;
  roleRevealPopupTriggeredAt?: number;
  actionPastilles?: { id: string, icon: string, color: string }[];
  forcedTab?: string | null;
  vibrationTriggeredAt?: number;
  vibrationDuration?: number;
  isSmartphoneLocked?: boolean;
  activePoll?: { id: string, question: string, options: string[] } | null;
  isBlinded?: boolean;
  isAsleep?: boolean;
  lastDiceResult?: { id: string, result: number, formula: string, timestamp: number } | null;
  activeParticle?: { id: string, type: 'confetti' | 'blood' | 'magic' | 'fire' | 'poison', duration: number } | null;
  coupleId?: string | null;
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
  isSleeping?: boolean;
  shape?: PlayerShape;
  description?: string;
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
  defaultCount?: number;
  minCount?: number;
  maxCount?: number;
  isFiller?: boolean;
  isMinMandatory?: boolean;
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
  isSecret?: boolean;
  smartphoneShowPastille?: boolean;
  showPastille?: boolean;
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
  distributorOrder?: number; // Order in the distributor (lower = first)
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
  description?: string;
  imageUrl?: string;
}

export interface MagneticPoint {
  id: string;
  x: number;
  y: number;
  order: number;
  label?: string;
  color?: string;
  targetRoleIds?: string[];
  targetTeamIds?: string[];
}

export type PlayerShape = 'circle' | 'square' | 'oval' | 'triangle' | 'trapezoid' | 'octagon' | 'star' | 'pentagon' | 'hexagon' | 'diamond' | 'shield' | 'cross' | 'heart' | 'crescent';

export type BadgeType = 'none' | 'team' | 'lives' | 'votes' | 'points' | 'uses' | 'callOrderDay' | 'callOrderNight' | 'connection' | 'creationOrder' | 'sleeping';

export interface BadgeConfig {
  type: BadgeType;
  bgColor: string;
  textColor: string;
  sleepingIcon?: string;
  awakeIcon?: string;
  sleepingBgColor?: string;
  sleepingTextColor?: string;
  awakeBgColor?: string;
  awakeTextColor?: string;
}

export interface Handout {
  id: EntityId;
  name: string;
  imageUrl: string;
  referenceImageUrl?: string;
  type: 'image' | 'pdf' | 'text';
  content?: string;
  isOpen: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  isMaximized?: boolean;
  zIndex?: number;
  category?: string;
}

export interface HandoutCategory {
  id: EntityId;
  name: string;
  color?: string;
  collapsed?: boolean;
}

export interface SoundButton {
  index: number;
  name: string;
  audioUrl: string; // base64 string
  isOneShot: boolean;
  icon?: string;
  color?: string;
  imageUrl?: string;
  volume?: number;
  shortcut?: string;
  category?: string;
  isAmbient?: boolean;
}

export interface LogEvent {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'action' | 'system' | 'death' | 'note' | 'role';
  metadata?: {
    playerId?: string;
    roleId?: string;
    tagId?: string;
    targetId?: string;
    actionId?: string;
  };
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
  remoteShowSounds?: boolean;
  remoteShowTasks?: boolean;
  remoteShowHandouts?: boolean;
  remoteShowActions?: boolean;
  remoteShowPlayers?: boolean;
  remoteShowDeadPlayers?: boolean;
  remoteAllowPrivateNotes?: boolean;
  remotePlayTrigger?: { index: number, timestamp: number } | null;
  remoteStopTrigger?: { index: number, timestamp: number } | null;
}

export interface CustomPopup {
  id: string;
  title: string;
  imageUrl?: string | null;
  content: string;
  showCloseButton: boolean;
  autoCloseTimer: boolean;
  autoCloseDuration?: number; // seconds (5-60)
  soundUrl?: string | null;
  showToGM?: boolean;
  showToSmartphone?: boolean;
  targetRoleIds?: string[];
  targetTeamIds?: string[];
  targetPlayerIds?: string[];
  scheduledAt?: string; // ISO date string
  scheduledDelay?: number; // seconds from trigger
}

export type ChecklistItemType = 'text' | 'checkbox' | 'image';

export interface ChecklistItem {
  id: string;
  type: ChecklistItemType;
  content?: string;
  checked?: boolean;
  color?: string;
  imageUrl?: string | null;
  actionId?: string | null;
  showOnSmartphone?: boolean;
  collapsed?: boolean;
  parentId?: string | null;
  notes?: string;
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

export interface RoleSelectorState {
  isOpen: boolean;
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
  elseActionId?: string | null;
  enabled?: boolean;
  delaySeconds?: number;
}

export type ActionEffectType = 
  | 'selectPlayer'
  | 'sleepPlayer'
  | 'wakePlayer'
  | 'switchSleepPlayer'
  | 'sleepAllPlayers'
  | 'wakeAllPlayers'
  | 'deleteAllTags'
  | 'nextPhase'
  | 'previousPhase'
  | 'resetCycle'
  | 'resurrectAllPlayers'
  | 'distributeRoles'
  | 'showPlayerImage'
  | 'hidePlayerImage'
  | 'showRoleImage'
  | 'hideRoleImage'
  | 'deleteSelectionPastilles'
  | 'showAllPlayers'
  | 'hideAllPlayers'
  | 'deleteAllPlayerTags'
  | 'setCycleDayNight'
  | 'setCycleTurn'
  | 'setCycleNone'
  | 'setDayNumber'
  | 'setNightNumber'
  | 'shuffleCallOrder'
  | 'reverseCallOrder'
  | 'sortCallOrderByStat'
  | 'popupPlayer'
  | 'showPlayerTooltip'
  | 'hidePlayerTooltip'
  | 'showTagTooltip'
  | 'hideTagTooltip'
  | 'showRoleColor'
  | 'hideRoleColor'
  | 'alertPlayerName'
  | 'alertVariable'
  | 'popupVariable'
  | 'incrementCallOrder'
  | 'decrementCallOrder'
  | 'resetCallOrder'
  | 'modifyVariable'
  | 'selectCallOrderPlayer'
  | 'assignTag'
  | 'removeTag'
  | 'checkTag'
  | 'assignRole'
  | 'resurrectAllPlayers'
  | 'wakeAllPlayers'
  | 'sleepAllPlayers'
  | 'sleepPlayer'
  | 'wakePlayer'
  | 'switchSleepPlayer'
  | 'selectPlayer'
  | 'triggerAction'
  | 'assignTagToRole'
  | 'removeTagFromRole'
  | 'assignTeam'
  | 'assignTeamToRole'
  | 'showTimerOnSmartphone'
  | 'hideTimerOnSmartphone'
  | 'wait'
  | 'togglePhaseTimer'
  | 'setPhaseDuration'
  | 'playSound'
  | 'showHandout'
  | 'sendPrivateMessage'
  | 'addSystemLog'
  | 'setRoomBackground'
  | 'setRoomColor'
  | 'pingPlayer'
  | 'revealPlayerRole'
  | 'hidePlayerRole'
  | 'togglePlayerPastille'
  | 'killPlayer'
  | 'resurrectPlayer'
  | 'clearPlayer'
  | 'removePlayerRole'
  | 'swapPlayerRole'
  | 'movePlayerToGraveyard'
  | 'moveCibleToGraveyard'
  | 'gatherPlayers'
  | 'changePlayerShape'
  | 'swapPlayerTags'
  | 'incrementTagValue'
  | 'spreadTag'
  | 'clearPlayerTeam'
  | 'joinTargetTeam'
  | 'shuffleTeams'
  | 'setFakeRole'
  | 'stealRoleAndKill'
  | 'forceSmartphoneTab'
  | 'vibrateSmartphone'
  | 'lockSmartphone'
  | 'sendPollToSmartphone'
  | 'sendGroupVoteToSmartphone'
  | 'blindPlayer'
  | 'rollDice'
  | 'stopExecution'
  | 'toggleActionEnabled'
  | 'resetBoard'
  | 'playParticleEffect'
  | 'createCouple'
  | 'killPartner'
  | 'randomSelect'
  | 'checkRole'
  | 'revealRoleToGM'
  | 'infectPlayer'
  | 'curePlayer';

export interface ActionEffect {
  id: string;
  type: ActionEffectType;
  enabled: boolean;
  variable?: string;
  operator?: string;
  value?: number;
  targetActionId?: string;
  tagId?: string;
  roleId?: string;
  teamId?: string;
  roleTeamId?: string;
  showCountdown?: boolean;
  countdownMessage?: string;
  soundName?: string;
  handoutId?: string;
  targetTab?: string;
  vibrationDuration?: number;
  privateMessage?: string;
  logMessage?: string;
  backgroundImageUrl?: string;
  roomColor?: string;
  pingColor?: string;
  pingDuration?: number;
  revealOnBoard?: boolean;
  revealInSmartphoneRoom?: boolean;
  revealInSmartphonePlayers?: boolean;
  revealInSmartphoneGamePopup?: boolean;
  pastilleId?: string;
  pastilleIcon?: string;
  pastilleColor?: string;
  pastilleMode?: 'add' | 'remove' | 'toggle';
  swapTargetMode?: 'role' | 'tag' | 'random' | 'cible';
  targetX?: number;
  targetY?: number;
  gatherRadius?: number;
  targetShape?: PlayerShape;
  killOnGraveyard?: boolean;
  tagIncrement?: number;
  spreadRadius?: number;
  seenAsRoleId?: string | null;
  lockMode?: 'lock' | 'unlock' | 'toggle';
  pollQuestion?: string;
  pollOptions?: string[];
  groupVoteVotersRoleColor?: string;
  groupVoteHideVoters?: boolean;
  groupVoteExcludeVoters?: boolean;
  groupVoteMandatory?: boolean;
  groupVoteNoTies?: boolean;
  groupVoteTagId?: string;
  blindMode?: 'blind' | 'unblind' | 'toggle';
  diceSides?: number;
  diceCount?: number;
  actionEnabledMode?: 'enable' | 'disable' | 'toggle';
  particleType?: 'confetti' | 'blood' | 'magic' | 'fire' | 'poison';
  particleDuration?: number;
  targetRoleId?: string | null;
  targetTagId?: string | null;
  targetTeamId?: string | null;
  selectionType?: 'first' | 'last' | 'all' | 'callOrder' | 'numeric' | 'random' | 'role' | 'tag' | 'pastille' | 'team' | 'alive' | null;
  selectionRoleId?: string | null;
  selectionTagId?: string | null;
  selectionTeamId?: string | null;
  selectionStatus?: 'alive' | 'dead' | null;
  excludeSelf?: boolean;
  excludeDead?: boolean;
  excludeRoleIds?: string[];
  excludeTagIds?: string[];
  excludeTeamIds?: string[];
  // Context overrides for triggerAction
  contextOverride?: {
    targetPlayerId?: string | null;
    targetCibleId?: string | null;
  };
}

export type ActionConditionType = 'day' | 'night' | 'turn' | 'playerRole' | 'playerTag' | 'playerPastille' | 'playerSelection' | 'playerDistance' | 'playerSelectionTag' | 'playerSelectionPastille' | 'playerSelectionRole' | 'playerDistanceTag' | 'playerDistancePastille' | 'cycleCheck' | 'callOrderRole' | 'playerSelectionTeam' | 'playerDistanceTeam' | 'playerDistanceStatus' | 'playerDistanceSelf' | 'playerDistanceSelected' | 'roleTeamCheck' | 'playerSelectionStatus' | 'playerSelectionRoleAndTeam' | 'roleCount' | 'hasTag' | 'randomChance' | 'isCouple' | 'partnerDead' | 'targetExists' | 'playerAlive' | 'playerDead' | 'isNightPhase' | 'isDayPhase';
export type ActionOperator = '=' | '<' | '>' | '!=' | '<=' | '>=' | 'modulo' | '';

export interface ActionCondition {
  id: string;
  type: ActionConditionType;
  operator: ActionOperator;
  value: number;
  minValue?: number;
  maxValue?: number;
  roleId?: string | null;
  seenAsRoleId?: string | null;
  tagId?: string | null;
  teamId?: string | null;
  pastilleIcon?: string | null;
  selectionType?: 'first' | 'last' | 'all' | 'callOrder' | 'numeric' | 'random' | null;
  selectionRoleId?: string | null;
  distanceFromPlayerId?: string | null;
  distanceTargetRoleId?: string | null;
  cycleCheckType?: string | null;
  selectionTeamId?: string | null;
  distanceTargetTeamId?: string | null;
  distanceTargetStatus?: 'alive' | 'dead' | null;
  distanceUnit?: 'logical' | 'physical' | null;
  enabled: boolean;
  logic?: 'AND' | 'OR';
  chancePercent?: number;
  targetPlayerId?: string | null;
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

export interface GroupVote {
  id: string;
  question: string;
  allowedVoterIds: string[];
  votersRoleColor?: string;
  hideVoters?: boolean;
  excludeVoters?: boolean;
  mandatory?: boolean;
  noTies?: boolean;
  tagIdToAssign?: string;
  votes: Record<string, string>;
  isOpen: boolean;
}

export interface GameState {
  coordinatePicker: {
    isActive: boolean;
    onPick?: (x: number, y: number) => void;
  } | null;
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
  magneticPoints: MagneticPoint[];
  showMagneticPoints: boolean;
  isMagneticEnabled: boolean;
  magneticSnapToGrid: boolean;
  magneticGridSize: number;
  tags: TagModel[];
  tagCategories: TagCategory[];
  handouts: Handout[];
  handoutCategories: HandoutCategory[];
  logs: LogEvent[];
  logsSettings: {
    showTypes: {
      info: boolean;
      action: boolean;
      system: boolean;
      death: boolean;
      note: boolean;
      role: boolean;
    };
    maxLogs: number;
  };
  logsFilter: string;
  recentColors: string[];
  customPopups: CustomPopup[];
  activeCustomPopupId: string | null;
  activeGroupVote: GroupVote | null;
  previewPopup: CustomPopup | null;
  checklist: ChecklistItem[];
  isNight: boolean;
  cycleNumber: number;
  callOrderIndex: number;
  customVariables: Record<string, number>;
  cycleMode: 'dayNight' | 'turns' | 'none';
  isPublicMode: boolean;
  timer: {
    minutes: number;
    seconds: number;
    isRunning: boolean;
    playSoundAtZero: boolean;
    isDetached: boolean;
    x: number;
    y: number;
  };
  smartphoneCountdown: {
    duration: number;
    remaining: number;
    message: string;
    isActive: boolean;
  } | null;
  soundboard: SoundboardState;
  wiki: WikiState;
  checklistState: ChecklistState;
  tagDistributorState: TagDistributorState;
  roleSelectorState: RoleSelectorState;
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
    showPodium: boolean;
    showLifeBar: boolean;
    showTable: boolean;
  };
  activeLeftTab: 'players' | 'roles' | 'tags' | 'game' | 'handouts';
  isLeftPanelOpen: boolean;
  isRightPanelOpen: boolean;
  isLeftPanelExpanded: boolean;
  isRightPanelExpanded: boolean;
  gameTabState: {
    treatedEntities: string[];
    playerNotes: Record<string, string>;
    focusMode: boolean;
    focusIndex: number;
  };
  editingEntity: { type: 'player' | 'playerTemplate' | 'role' | 'tagModel' | 'tagInstance' | 'team' | 'tagCategory' | 'playerNotes' | 'playerPublicNotes' | 'soundButton', id: EntityId, parentId?: EntityId } | null;
  canvas: {
    panX: number;
    panY: number;
    zoom: number;
  };
  grid: {
    enabled: boolean;
    show: boolean;
    sizeX: number;
    sizeY: number;
  };
  room: {
    width: number;
    height: number;
    backgroundColor: string;
    backgroundImage: string | null;
    nightBackgroundImage: string | null;
    backgroundStyle: 'mosaic' | 'center' | 'stretch';
    minimapImageUrl?: string | null;
  };
  displaySettings: {
    showRolesOnBoard: boolean;
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
    showPlayerBadges: {
      topLeft: boolean;
      topRight: boolean;
      bottomLeft: boolean;
      bottomRight: boolean;
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
      magneticPoints?: boolean;
      panelsOrder?: string[];
    };
    includeRoomCodeInLinks: boolean;
    recordLogs: boolean;
    persistLogs: boolean;
    smartphoneTabs: {
      game: boolean;
      players: boolean;
      room: boolean;
      wiki: boolean;
      handouts: boolean;
      logs: boolean;
    };
    smartphonePlayersOptions?: {
      allowPrivateNotes: boolean;
      showDeadPlayers: boolean;
      includeSelf: boolean;
      allowNotesForDeadPlayers: boolean;
      showNotePreview: boolean;
    };
    showTimerOnSmartphone?: boolean;
    timerEndSoundUrl?: string | null;
    wikiTitle?: string;
    wikiLightMode?: boolean;
    showWikiNotes?: boolean;
    showWikiRoles?: boolean;
    showWikiTags?: boolean;
    showWikiTeams?: boolean;
    wikiOnlySelectedRoles?: boolean;
    wikiOnlyInPlayRoles?: boolean;
    smartphoneImageBlur?: number;
    smartphoneImageMinHeight?: number;
    roomMiniatureAnimation?: boolean;
    roomMiniatureSelfAnimation?: boolean;
    roomMiniatureDeadIconUrl?: string | null;
    roomMiniaturePlayerIconUrl?: string | null;
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
    distributionResurrectAll?: boolean;
    distributionDeleteTags?: boolean;
    distributionRemovePastilles?: boolean;
    distributionResetPhase?: boolean;
    distributionResetLives?: boolean;
    distributionResetPoints?: boolean;
    distributionResetVotes?: boolean;
    distributionDeletePrivateNotes?: boolean;
    distributionDeletePublicNotes?: boolean;
    timerDefaultMinutes?: number;
    timerDefaultSeconds?: number;
    defaultPlayerSize?: number;
    defaultPlayerShape?: PlayerShape;
    magneticPointsColor?: string;
    magneticPointsSnapMode?: 'nearest' | 'order';
    magneticPointsFreeSnap?: boolean;
    distributionActionId?: string | null;
    customShortcuts?: Record<string, { key: string; modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean } }>;
    zoomMin?: number;
    zoomMax?: number;
    zoomSpeed?: number;
    panSpeed?: number;
    wheelBehavior?: 'zoom' | 'pan' | 'both';
    devMode?: boolean;
    fontSize?: number;
    highContrast?: boolean;
    reduceMotion?: boolean;
    colorblindMode?: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
    undoLimit?: number;
    imageRendering?: 'auto' | 'pixelated' | 'crisp-edges';
    fpsLimit?: number;
    lazyLoadImages?: boolean;
    lowQualityMode?: boolean;
    language?: 'fr' | 'en' | 'es' | 'de' | 'it' | 'pt' | 'ja' | 'zh';
    customTheme?: {
      primary?: string;
      background?: string;
      card?: string;
      muted?: string;
      border?: string;
      accent?: string;
      destructive?: string;
      ring?: string;
    };
    customCSS?: string;
    focusModeGroupByOrder?: boolean;
    toolbarPosition?: 'bottom-left' | 'bottom-center' | 'bottom-right' | 'top-left' | 'top-center' | 'top-right' | 'hidden';
    showToolbarZoom?: boolean;
    showToolbarResetView?: boolean;
    showToolbarUndoRedo?: boolean;
    showToolbarInteraction?: boolean;
    showToolbarGrid?: boolean;
    showToolbarCycle?: boolean;
    showToolbarTimer?: boolean;
    showToolbarMagneticPoints?: boolean;
    showToolbarCoordinates?: boolean;
    showToolbarRoles?: boolean;
    showToolbarGrimoire?: boolean;
    showToolbarSettings?: boolean;
    showToolbarFullscreen?: boolean;
    tagDistributorDefaultCols?: number;
    tagDistributorDefaultMode?: 'detailed' | 'compact';
    tagDistributorDefaultSort?: 'order' | 'alpha';
    tagDistributorShowCount?: boolean;
    tagDistributorAutoDetach?: boolean;
  };
}
