/**
 * Zustand Selectors - Optimized for Performance
 * 
 * These selectors are designed to minimize re-renders by:
 * 1. Using reference equality checks (===) where possible
 * 2. Memoizing derived data
 * 3. Providing granular access to state slices
 * 
 * Usage:
 *   const players = useVttStore(selectPlayers);
 *   const alivePlayers = useVttStore(selectAlivePlayers);
 *   const playerById = useVttStore(selectPlayerById('player-123'));
 */

import type { Player, Role, TagModel, Team, LogEvent, Handout, Action } from '../types';
import type { VttStore } from './index';

// ============================================================================
// Basic State Selectors (Reference Equality)
// These return direct references - only re-render when the reference changes
// ============================================================================

export const selectPlayers = (state: VttStore): Player[] => state.players;
export const selectRoles = (state: VttStore): Role[] => state.roles;
export const selectTags = (state: VttStore): TagModel[] => state.tags;
export const selectTeams = (state: VttStore): Team[] => state.teams;
export const selectActions = (state: VttStore): Action[] => state.actions;
export const selectLogs = (state: VttStore): LogEvent[] => state.logs;
export const selectHandouts = (state: VttStore): Handout[] => state.handouts;
export const selectMarkers = (state: VttStore) => state.markers;
export const selectTimer = (state: VttStore) => state.timer;
export const selectSoundboard = (state: VttStore) => state.soundboard;
export const selectDisplaySettings = (state: VttStore) => state.displaySettings;
export const selectRoom = (state: VttStore) => state.room;
export const selectCanvas = (state: VttStore) => state.canvas;
export const selectGrid = (state: VttStore) => state.grid;
export const selectWiki = (state: VttStore) => state.wiki;
export const selectChecklist = (state: VttStore) => state.checklist;
export const selectScoreboard = (state: VttStore) => state.scoreboard;
export const selectCustomPopups = (state: VttStore) => state.customPopups;
export const selectActiveGroupVote = (state: VttStore) => state.activeGroupVote;
export const selectSmartphoneCountdown = (state: VttStore) => state.smartphoneCountdown;
export const selectPlayerTemplates = (state: VttStore) => state.playerTemplates;
export const selectMagneticPoints = (state: VttStore) => state.magneticPoints;
export const selectTagCategories = (state: VttStore) => state.tagCategories;
export const selectRecentColors = (state: VttStore) => state.recentColors;
export const selectCustomVariables = (state: VttStore) => state.customVariables;

// ============================================================================
// UI State Selectors
// ============================================================================

export const selectIsNight = (state: VttStore): boolean => state.isNight;
export const selectCycleNumber = (state: VttStore): number => state.cycleNumber;
export const selectCycleMode = (state: VttStore) => state.cycleMode;
export const selectCallOrderIndex = (state: VttStore) => state.callOrderIndex;
export const selectRoomCode = (state: VttStore) => state.roomCode;
export const selectRoomName = (state: VttStore) => state.roomName;
export const selectIsRoomPublic = (state: VttStore) => state.isRoomPublic;
export const selectIsPublicMode = (state: VttStore) => state.isPublicMode;
export const selectJoinRequests = (state: VttStore) => state.joinRequests;
export const selectOnlinePlayerIds = (state: VttStore) => state.onlinePlayerIds;
export const selectSelectedEntityIds = (state: VttStore) => state.selectedEntityIds;
export const selectInteractionMode = (state: VttStore) => state.interactionMode;
export const selectActiveLeftTab = (state: VttStore) => state.activeLeftTab;
export const selectIsLeftPanelOpen = (state: VttStore) => state.isLeftPanelOpen;
export const selectIsRightPanelOpen = (state: VttStore) => state.isRightPanelOpen;
export const selectEditingEntity = (state: VttStore) => state.editingEntity;
export const showMagneticPoints = (state: VttStore) => state.showMagneticPoints;
export const selectIsMagneticEnabled = (state: VttStore) => state.isMagneticEnabled;

// ============================================================================
// Derived Data Selectors
// These compute values from state - use with caution as they create new references
// For better performance, consider useMemo in components
// ============================================================================

export const selectAlivePlayers = (state: VttStore): Player[] => 
  state.players.filter(p => !p.isDead);

export const selectDeadPlayers = (state: VttStore): Player[] => 
  state.players.filter(p => p.isDead);

export const selectPlayersByOrder = (state: VttStore): Player[] => 
  [...state.players].sort((a, b) => (a.creationOrder || 0) - (b.creationOrder || 0));

export const selectPlayerCount = (state: VttStore): number => state.players.length;
export const selectAlivePlayerCount = (state: VttStore): number => 
  state.players.filter(p => !p.isDead).length;
export const selectDeadPlayerCount = (state: VttStore): number => 
  state.players.filter(p => p.isDead).length;

export const selectOnlinePlayerCount = (state: VttStore): number => 
  state.onlinePlayerIds.length;

export const selectRecentLogs = (state: VttStore): LogEvent[] => 
  state.logs.slice(0, 50);

export const selectOpenHandouts = (state: VttStore): Handout[] => 
  state.handouts.filter(h => h.isOpen);

export const selectEnabledActions = (state: VttStore): Action[] => 
  state.actions.filter(a => a.enabled !== false);

// ============================================================================
// Parameterized Selectors (Factory Functions)
// These return selector functions for specific entities
// ============================================================================

export const selectPlayerById = (id: string) => (state: VttStore): Player | undefined => 
  state.players.find(p => p.id === id);

export const selectRoleById = (id: string) => (state: VttStore): Role | undefined => 
  state.roles.find(r => r.id === id);

export const selectTagById = (id: string) => (state: VttStore): TagModel | undefined => 
  state.tags.find(t => t.id === id);

export const selectTeamById = (id: string) => (state: VttStore): Team | undefined => 
  state.teams.find(t => t.id === id);

export const selectActionById = (id: string) => (state: VttStore): Action | undefined => 
  state.actions.find(a => a.id === id);

export const selectHandoutById = (id: string) => (state: VttStore): Handout | undefined => 
  state.handouts.find(h => h.id === id);

export const selectPlayersByRole = (roleId: string | null) => (state: VttStore): Player[] => 
  state.players.filter(p => p.roleId === roleId);

export const selectPlayersByTeam = (teamId: string | null) => (state: VttStore): Player[] => 
  state.players.filter(p => p.teamId === teamId);

export const selectPlayersWithTag = (tagId: string) => (state: VttStore): Player[] => 
  state.players.filter(p => p.tags?.some(t => t.id === tagId));

export const selectRolesByTeam = (teamId: string | null) => (state: VttStore): Role[] => 
  state.roles.filter(r => r.teamId === teamId);

export const selectTagsByCategory = (categoryId: string | null) => (state: VttStore): TagModel[] => 
  state.tags.filter(t => t.categoryId === categoryId);

// ============================================================================
// Display Settings Selectors
// ============================================================================

export const selectShowPlayers = (state: VttStore): boolean => 
  state.displaySettings.showPlayers;

export const selectShowTooltip = (state: VttStore): boolean => 
  state.displaySettings.showTooltip;

export const selectShowRole = (state: VttStore): boolean => 
  state.displaySettings.showRole;

export const selectShowTeam = (state: VttStore): boolean => 
  state.displaySettings.showTeam;

export const selectShowTags = (state: VttStore): boolean => 
  state.displaySettings.showTags;

export const selectShowPlayerName = (state: VttStore): boolean => 
  state.displaySettings.showPlayerName;

export const selectShowPlayerImage = (state: VttStore): boolean => 
  state.displaySettings.showPlayerImage;

export const selectShowRoleImage = (state: VttStore): boolean => 
  state.displaySettings.showRoleImage;

export const selectShowRoleColor = (state: VttStore): boolean => 
  state.displaySettings.showRoleColor;

export const selectImagePriority = (state: VttStore) => 
  state.displaySettings.imagePriority;

export const selectPlayerNamePosition = (state: VttStore) => 
  state.displaySettings.playerNamePosition;

export const selectForegroundElement = (state: VttStore) => 
  state.displaySettings.foregroundElement;

export const selectPlayerBadges = (state: VttStore) => 
  state.displaySettings.playerBadges;

export const selectPanels = (state: VttStore) => 
  state.displaySettings.panels;

// ============================================================================
// Soundboard Selectors
// ============================================================================

export const selectSoundButtons = (state: VttStore) => 
  state.soundboard.buttons;

export const selectSoundboardRemoteEnabled = (state: VttStore) => 
  state.soundboard.remoteEnabled;

export const selectSoundboardRemotePasscode = (state: VttStore) => 
  state.soundboard.remotePasscode;

export const selectSoundboardDetached = (state: VttStore) => 
  state.soundboard.isDetached;

// ============================================================================
// Timer Selectors
// ============================================================================

export const selectTimerIsRunning = (state: VttStore) => 
  state.timer.isRunning;

export const selectTimerMinutes = (state: VttStore) => 
  state.timer.minutes;

export const selectTimerSeconds = (state: VttStore) => 
  state.timer.seconds;

export const selectTimerDetached = (state: VttStore) => 
  state.timer.isDetached;

export const selectTimerPosition = (state: VttStore) => ({
  x: state.timer.x,
  y: state.timer.y
});

// ============================================================================
// Action Creator Selectors
// ============================================================================

export const selectActionCreatorState = (state: VttStore) => 
  state.actionCreatorState;

export const selectPendingConditions = (state: VttStore) => 
  state.pendingActionConditions;

export const selectPendingEffects = (state: VttStore) => 
  state.pendingActionEffects;

export const selectPendingElseActionId = (state: VttStore) => 
  state.pendingElseActionId;

export const selectPendingActionEnabled = (state: VttStore) => 
  state.pendingActionEnabled;

// ============================================================================
// Smartphone/Player View Selectors
// ============================================================================

export const selectSmartphoneActionMessage = (state: VttStore) => 
  state.smartphoneActionMessage;

export const selectWikiState = (state: VttStore) => state.wiki;
export const selectChecklistState = (state: VttStore) => state.checklistState;
export const selectTagDistributorState = (state: VttStore) => state.tagDistributorState;
export const selectRoleSelectorState = (state: VttStore) => state.roleSelectorState;

// ============================================================================
// Room/Canvas Selectors
// ============================================================================

export const selectRoomBackground = (state: VttStore) => ({
  image: state.room.backgroundImage,
  color: state.room.backgroundColor,
  style: state.room.backgroundStyle
});

export const selectRoomDimensions = (state: VttStore) => ({
  width: state.room.width,
  height: state.room.height
});

export const selectCanvasTransform = (state: VttStore) => ({
  panX: state.canvas.panX,
  panY: state.canvas.panY,
  zoom: state.canvas.zoom
});

export const selectGridConfig = (state: VttStore) => ({
  enabled: state.grid.enabled,
  show: state.grid.show,
  sizeX: state.grid.sizeX,
  sizeY: state.grid.sizeY
});
