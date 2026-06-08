import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { temporal } from 'zundo';
import type { GameState, EntityId, Player, Role, TagModel, TagCategory, Marker, Team, Handout, HandoutCategory, PlayerTemplate, LogEvent, CustomPopup, GroupVote, ChecklistItem, Action, ActionCreatorState, ActionCondition, ActionConditionCreatorState, ActionEffect, ActionEffectCreatorState, PlayerShape, RoleSelectorState, ChatMessage } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { executeAction as executeActionEngine } from '../lib/action-engine';
import { storeAudio, deleteAudio, makeIdbKey } from '../lib/audio-storage';

let undoLimit = 50;
export const setUndoLimit = (limit: number) => {
  undoLimit = limit;
};
export const getUndoLimit = () => undoLimit;

export interface VttStore extends GameState {
  setCycleMode: (mode: GameState['cycleMode']) => void;
  setPublicMode: (publicMode: boolean) => void;
  setTimer: (timerUpdate: Partial<GameState['timer']>) => void;
  setSoundboard: (soundboardUpdate: Partial<GameState['soundboard']>) => void;
  updateSoundButton: (index: number, updates: Partial<GameState['soundboard']['buttons'][0]>) => void;
  removeSoundButton: (index: number) => void;
  swapSoundButtons: (indexA: number, indexB: number) => void;
  setScoreboard: (scoreboardUpdate: Partial<GameState['scoreboard']>) => void;
  setLogsSettings: (logsUpdate: Partial<GameState['logsSettings']>) => void;
  setLogsFilter: (filter: string) => void;
  setWiki: (wikiUpdate: Partial<GameState['wiki']>) => void;
  setChecklistState: (checklistUpdate: Partial<GameState['checklistState']>) => void;
  setTagDistributorState: (distributorUpdate: Partial<GameState['tagDistributorState']>) => void;
  setRoleSelectorState: (roleSelectorUpdate: Partial<RoleSelectorState>) => void;
  updateCampaignJournal: (updates: Partial<GameState['campaignJournal']>) => void;
  acquireJournalLock: (playerId: string, playerName: string) => boolean;
  releaseJournalLock: (playerId: string) => void;
  playerTemplates: PlayerTemplate[];

  // Selection & Interaction
  setSelectedEntityIds: (ids: string[]) => void;
  clearSelection: () => void;
  setInteractionMode: (mode: 'pan' | 'select') => void;

  // Room
  setRoomName: (name: string) => void;
  generateRoomCode: () => void;
  toggleRoomPublic: () => void;
  clearRoomCode: () => void;
  addJoinRequest: (playerName: string) => void;
  removeJoinRequest: (playerName: string) => void;
  setOnlinePlayers: (playerIds: EntityId[]) => void;

  // Navigation
  setPan: (x: number, y: number) => void;
  setZoom: (zoom: number) => void;
  setActiveLeftTab: (tab: GameState['activeLeftTab']) => void;
  setGameTabState: (updates: Partial<GameState['gameTabState']>) => void;
  resetGameTabState: () => void;
  setEditingEntity: (entity: GameState['editingEntity']) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  toggleLeftPanelExpanded: () => void;
  toggleRightPanelExpanded: () => void;
  isLeftPanelOpen: boolean;
  isRightPanelOpen: boolean;
  isLeftPanelExpanded: boolean;
  isRightPanelExpanded: boolean;

  // Tools
  setGrid: (grid: GameState['grid']) => void;
  setRoom: (room: Partial<GameState['room']>) => void;

  // Player Templates
  addPlayerTemplate: (templateData: Omit<PlayerTemplate, 'id'>) => void;
  updatePlayerTemplate: (id: EntityId, updates: Partial<PlayerTemplate>) => void;
  deletePlayerTemplate: (id: EntityId) => void;

  // Players
  addPlayer: (playerData: Omit<Player, 'id'>) => void;
  updatePlayer: (id: EntityId, updates: Partial<Player>) => void;
  updatePlayers: (updatesArray: { id: EntityId; updates: Partial<Player> }[]) => void;
  deletePlayer: (id: EntityId) => void;
  clearPlayers: () => void;
  clearAllSelectionPastilles: () => void;

  // Roles
  addRole: (roleData: Omit<Role, 'id'>) => void;
  updateRole: (id: EntityId, updates: Partial<Role>) => void;
  deleteRole: (id: EntityId) => void;

  // Teams
  addTeam: (teamData: Omit<Team, 'id'>) => void;
  updateTeam: (id: EntityId, updates: Partial<Team>) => void;
  deleteTeam: (id: EntityId) => void;

  // Tags (Models)
  tags: TagModel[];
  addTagModel: (tagData: Omit<TagModel, 'id'>) => void;
  updateTagModel: (id: EntityId, updates: Partial<TagModel>) => void;
  deleteTagModel: (id: EntityId) => void;
  reorderDistributorTags: (orderedTagIds: EntityId[]) => void;

  // Tag Categories
  tagCategories: TagCategory[];
  addTagCategory: (categoryData: Omit<TagCategory, 'id'>) => void;
  updateTagCategory: (id: EntityId, updates: Partial<TagCategory>) => void;
  deleteTagCategory: (id: EntityId) => void;

  // Markers (on canvas)
  addMarker: (markerData: Omit<Marker, 'id'>) => void;
  updateMarker: (id: EntityId, updates: Partial<Marker>) => void;
  deleteMarker: (id: EntityId) => void;
  clearMarkers: () => void;

  // Handouts
  addHandout: (handout: Omit<Handout, 'id'>) => void;
  updateHandout: (id: EntityId, updates: Partial<Handout>) => void;
  deleteHandout: (id: EntityId) => void;
  toggleHandout: (id: EntityId) => void;
  bringToFrontHandout: (id: EntityId) => void;
  handoutCategories: HandoutCategory[];
  addHandoutCategory: (category: Omit<HandoutCategory, 'id'>) => void;
  updateHandoutCategory: (id: EntityId, updates: Partial<HandoutCategory>) => void;
  deleteHandoutCategory: (id: EntityId) => void;

  // Action Creator
  setActionCreatorState: (state: Partial<ActionCreatorState>) => void;
  addAction: (action: Omit<Action, 'id'>) => void;
  updateAction: (id: string, updates: Partial<Action>) => void;
  deleteAction: (id: string) => void;
  duplicateAction: (id: string) => void;
  executeAction: (id: string, initialContext?: Record<string, any>, depth?: number) => void;
  pendingElseActionId: string | null;
  setPendingElseActionId: (id: string | null) => void;
  callOrderIndex: number;
  setCallOrderIndex: (index: number) => void;
  setActionConditionCreatorState: (state: Partial<ActionConditionCreatorState>) => void;
  addPendingCondition: (condition: Omit<ActionCondition, 'id'>) => void;
  updatePendingCondition: (id: string, updates: Partial<ActionCondition>) => void;
  deletePendingCondition: (id: string) => void;
  setPendingConditions: (conditions: ActionCondition[]) => void;
  clearPendingConditions: () => void;
  pendingActionOnce: boolean;
  setPendingOnce: (once: boolean) => void;
  pendingActionIsRecurring: boolean;
  pendingActionIntervalSeconds: number;
  pendingActionRepeatCount: number;
  pendingActionDelaySeconds: number;
  setPendingDelay: (delay: number) => void;
  setPendingRecurring: (recurring: boolean, interval: number, count: number) => void;
  setPendingActionEnabled: (enabled: boolean) => void;
  setActionEffectCreatorState: (state: Partial<ActionEffectCreatorState>) => void;
  addPendingEffect: (effect: Omit<ActionEffect, 'id'>) => void;
  updatePendingEffect: (id: string, updates: Partial<ActionEffect>) => void;
  deletePendingEffect: (id: string) => void;
  setPendingEffects: (effects: ActionEffect[]) => void;
  clearPendingEffects: () => void;

  // Game Logic
  setNight: (isNight: boolean) => void;
  nextCycle: () => void;
  resetCycle: () => void;

  // Settings
  updateDisplaySettings: (updates: Partial<GameState['displaySettings']>) => void;

  // Colors
  addRecentColor: (color: string) => void;

  // Smartphone Action Popups for GM
  smartphoneActionMessage: { playerName: string, message: string } | null;
  setSmartphoneActionMessage: (message: { playerName: string, message: string } | null) => void;
  setSmartphoneCountdown: (countdown: GameState['smartphoneCountdown']) => void;
  // Custom Popups
  addCustomPopup: (popup: Omit<CustomPopup, 'id'>) => void;
  updateCustomPopup: (id: string, updates: Partial<CustomPopup>) => void;
  deleteCustomPopup: (id: string) => void;
  triggerCustomPopup: (id: string | null) => void;
  setPreviewPopup: (popup: CustomPopup | null) => void;

  // Group Vote
  setActiveGroupVote: (vote: GroupVote | null) => void;
  updateGroupVote: (voterId: string, targetId: string) => void;

  // Logs
  addLog: (message: string, type: LogEvent['type'], metadata?: LogEvent['metadata']) => void;
  clearLogs: () => void;

  // Chat
  addChatMessage: (msg: ChatMessage) => void;
  clearChatMessages: () => void;
  markChatMessagesAsRead: (senderOrGroupId: string) => void;

  // Checklist
  setChecklist: (checklist: ChecklistItem[] | ((prev: ChecklistItem[]) => ChecklistItem[])) => void;

  // Magnetic Points
  addMagneticPoint: (x?: number, y?: number) => void;
  updateMagneticPoint: (id: string, x: number, y: number) => void;
  updateMagneticPointLabel: (id: string, label: string) => void;
  updateMagneticPointColor: (id: string, color: string) => void;
  updateMagneticPointTargeting: (id: string, targetRoleIds?: string[], targetTeamIds?: string[]) => void;
  deleteMagneticPoint: (id: string) => void;
  reorderMagneticPoints: (fromIndex: number, toIndex: number) => void;
  createPointsFromTemplate: (template: { type: string; params: Record<string, any> }, count: number) => void;
  exportMagneticPoints: () => void;
  importMagneticPoints: (jsonData: string) => { success: boolean; error?: string };
  clearMagneticPoints: () => void;
  setShowMagneticPoints: (show: boolean) => void;
  setIsMagneticEnabled: (enabled: boolean) => void;
  snapPlayersToPoints: (options?: { targetRoleIds?: string[]; targetTeamIds?: string[] }) => void;
  setMagneticSnapToGrid: (enabled: boolean) => void;
  setMagneticGridSize: (size: number) => void;
  resetStore: () => void;
  setCoordinatePicker: (picker: { isActive: boolean; onPick?: (x: number, y: number) => void } | null) => void;
  exportFullState: () => void;
  exportPartialState: (sections: string[]) => void;
  importState: (jsonData: string) => { success: boolean; error?: string };
  
  // Connection status
  setConnectionStatus: (status: 'connected' | 'disconnected' | 'connecting' | 'error') => void;
  setLastSyncTimestamp: (timestamp: number | null) => void;
  setSupabaseConfigured: (configured: boolean) => void;
  testConnection: () => Promise<{ success: boolean; error?: string }>;
  resetChannel: () => void;
  resetOnlinePlayers: () => void;
}

export const initialState = {
  campaignJournal: {
    isOpen: false,
    isDetached: false,
    x: 400,
    y: 200,
    publicContent: '',
    privateContent: '',
    permission: 'readonly' as const,
    lockHolderId: null,
    lockHolderName: null,
    lockExpiration: null,
  },
  coordinatePicker: null,
  roomName: 'Ma Salle',
  roomCode: null,
  chatMessages: [],
  isRoomPublic: true,
  joinRequests: [],
  onlinePlayerIds: [],
  selectedEntityIds: [],
  interactionMode: 'pan' as const,
  playerTemplates: [],
  players: [],
  roles: [],
  tags: [],
  markers: [],
  markerParameters: [],
  teams: [],
  magneticPoints: [],
  showMagneticPoints: true,
  isMagneticEnabled: true,
  magneticSnapToGrid: false,
  magneticGridSize: 50,
  connectionStatus: 'disconnected' as 'connected' | 'disconnected' | 'connecting' | 'error',
  lastSyncTimestamp: null as number | null,
  supabaseConfigured: false,
  tagCategories: [],
  handouts: [],
  handoutCategories: [],
  logsSettings: {
    showTypes: {
      info: true,
      action: true,
      system: true,
      death: true,
      note: true,
      role: true,
    },
    maxLogs: 100,
  },
  logs: [],
  logsFilter: '',
  recentColors: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff', '#000000', '#6b7280'], // default colors
  customPopups: [],
  activeCustomPopupId: null,
  activeGroupVote: null,
  previewPopup: null,
  checklist: [],
  isNight: false,
  cycleNumber: 1,
  callOrderIndex: 0,
  customVariables: {},
  cycleMode: 'dayNight' as const,
  isPublicMode: false,
  timer: {
    minutes: 5,
    seconds: 0,
    isRunning: false,
    playSoundAtZero: false,
    isDetached: false,
    x: 100,
    y: 100,
  },
  smartphoneCountdown: null,
  soundboard: {
    cols: 4,
    rows: 3,
    isDetached: false,
    x: 200,
    y: 200,
    buttons: [],
    remoteEnabled: false,
    remotePasscode: '1234',
    remoteShowSounds: true,
    remoteShowTasks: true,
    remoteShowHandouts: true,
    remoteShowActions: true,
    remoteShowPlayers: false,
    remoteShowDeadPlayers: false,
    remoteAllowPrivateNotes: false,
    remotePlayTrigger: null,
    remoteStopTrigger: null
  },
  scoreboard: {
    isDetached: false,
    x: 300,
    y: 200,
    isOpen: false,
    showRoles: true,
    showPoints: true,
    showVotes: true,
    showLives: true,
    showStatus: true,
    showPodium: true,
    showLifeBar: true,
    showTable: true,
  },
  wiki: {
    isOpen: false,
    isDetached: false,
    x: 400,
    y: 200,
    content: ''
  },
  checklistState: {
    isOpen: false,
    isDetached: false,
    x: 500,
    y: 200,
  },
  tagDistributorState: {
    isOpen: false,
    isDetached: false,
    x: 100,
    y: 100,
  },
  roleSelectorState: {
    isOpen: false,
    x: 100,
    y: 100,
  },
  actionCreatorState: {
    isOpen: false,
    isDetached: false,
    x: 100,
    y: 100,
    editingActionId: null,
  },
  actionConditionCreatorState: {
    isOpen: false,
    x: 150,
    y: 150,
    editingConditionId: null,
  },
  actionEffectCreatorState: {
    isOpen: false,
    x: 200,
    y: 200,
    editingEffectId: null,
  },
  actions: [],
  pendingActionConditions: [],
  pendingActionEffects: [],
  pendingActionOnce: false,
  pendingActionIsRecurring: false,
  pendingActionIntervalSeconds: 5,
  pendingActionRepeatCount: 2,
  pendingActionDelaySeconds: 0,
  pendingActionEnabled: true,
  pendingElseActionId: null as string | null,
  activeLeftTab: 'players' as const,
  isLeftPanelOpen: true,
  isRightPanelOpen: true,
  isLeftPanelExpanded: false,
  isRightPanelExpanded: false,
  gameTabState: {
    treatedEntities: [] as string[],
    playerNotes: {} as Record<string, string>,
    focusMode: false,
    focusIndex: 0,
  },
  editingEntity: null,
  smartphoneActionMessage: null,
  canvas: {
    panX: 0,
    panY: 0,
    zoom: 1,
  },
  grid: {
    enabled: true,
    show: true,
    sizeX: 120,
    sizeY: 120,
  },
  room: {
    width: 850,
    height: 850,
    backgroundColor: '#6B7280',
    backgroundImage: null,
    nightBackgroundImage: null,
    backgroundStyle: 'mosaic' as const,
  },
  displaySettings: {
    showRolesOnBoard: true,
    showTooltip: true,
    showRole: true,
    showTeam: true,
    showTags: true,
    showPlayerName: true,
    showPlayers: true,
    showCenter: false,
    showCycleIcon: true,
    foregroundElement: 'markers' as const,
    showPlayerImage: true,
    showRoleImage: true,
    showRoleColor: false,
    imagePriority: 'role' as const,
    playerNamePosition: 'bottom' as const,
    showTagName: true,
    showOfflineStatus: true,
    autoMergeTags: true,
    playerBadges: {
      topLeft: { type: 'team' as const, bgColor: '#000000', textColor: '#ffffff' },
      topRight: { type: 'none' as const, bgColor: '#ef4444', textColor: '#ffffff' },
      bottomLeft: { type: 'none' as const, bgColor: '#3b82f6', textColor: '#ffffff' },
      bottomRight: { type: 'none' as const, bgColor: '#10b981', textColor: '#ffffff' },
    },
    showPlayerBadges: {
      topLeft: true,
      topRight: true,
      bottomLeft: true,
      bottomRight: true,
    },
    smartphoneImageStyle: 'original' as const,
    panels: {
      distribution: true,
      chrono: true,
      soundboard: true,
      scoreboard: true,
      logs: true,
      system: true,
      wiki: true,
      popupCreator: true,
      actionCreator: true,
      checklist: true,
      tagDistributor: true,
      magneticPoints: true,
      panelsOrder: ['distribution', 'chrono', 'soundboard', 'scoreboard', 'logs', 'tagDistributor', 'wiki', 'campaignJournal', 'popupCreator', 'actionCreator', 'checklist', 'magneticPoints', 'system'],
    },
    includeRoomCodeInLinks: false,
    recordLogs: false,
    persistLogs: true,
    smartphoneTabs: {
      game: true,
      players: false,
      room: false,
      wiki: false,
      handouts: false,
      logs: true,
    },
    smartphonePlayersOptions: {
      allowPrivateNotes: true,
      showDeadPlayers: true,
      includeSelf: true,
      allowNotesForDeadPlayers: true,
      showNotePreview: true,
    },
    showTimerOnSmartphone: false,
    showDiceOnSmartphone: false,
    timerEndSoundUrl: null,
    wikiTitle: 'Régles du jeu',
    wikiLightMode: true,
    showWikiNotes: true,
    showWikiRoles: true,
    showWikiTags: true,
    showWikiTeams: true,
    wikiOnlySelectedRoles: false,
    wikiOnlyInPlayRoles: false,
    smartphoneImageBlur: 20,
    smartphoneImageMinHeight: 400,
    roomMiniatureAnimation: true,
    roomMiniatureSelfAnimation: true,
    roomMiniatureDeadIconUrl: null,
    roomMiniaturePlayerIconUrl: null,
    showTagCallOrderDay: true,
    showTagCallOrderNight: true,
    showTagLives: true,
    showTagVotes: true,
    showTagPoints: true,
    showTagUses: true,
    showTagTooltip: true,
    showTagAutoDelete: true,
    showTagSeenAsRole: true,
    showTagSeenInTeam: true,
    showTagDescription: true,
    showTagNameInTooltip: false,
    showTagNameSeenAsRole: false,
    showTagNameSeenInTeam: false,
    showTagSmartphoneIcon: true,
    distributionResurrectAll: true,
    distributionDeleteTags: true,
    distributionRemovePastilles: true,
    distributionResetPhase: true,
    distributionResetLives: true,
    distributionResetPoints: true,
    distributionResetVotes: true,
    distributionDeletePrivateNotes: true,
    distributionDeletePublicNotes: true,
    timerDefaultMinutes: 5,
    timerDefaultSeconds: 0,
    defaultPlayerSize: 40,
    defaultPlayerShape: 'circle' as PlayerShape,
    magneticPointsColor: '#3B82F6',
    magneticPointsSnapMode: 'nearest' as 'nearest' | 'order',
    magneticPointsFreeSnap: false,
    distributionActionId: null,
    customShortcuts: {},
    zoomMin: 0.1,
    zoomMax: 5,
    zoomSpeed: 0.001,
    panSpeed: 1,
    wheelBehavior: 'both' as const,
    devMode: false,
    fontSize: 1,
    highContrast: false,
    reduceMotion: false,
    colorblindMode: 'none' as const,
    undoLimit: 50,
    imageRendering: 'auto' as const,
    fpsLimit: 60,
    lazyLoadImages: true,
    lowQualityMode: false,
    language: 'fr' as const,
    customTheme: {},
    customCSS: '',
    focusModeGroupByOrder: false,
    toolbarPosition: 'bottom-left' as const,
    showToolbarZoom: true,
    showToolbarResetView: true,
    showToolbarUndoRedo: true,
    showToolbarInteraction: true,
    showToolbarGrid: true,
    showToolbarCycle: true,
    showToolbarTimer: true,
    showToolbarMagneticPoints: true,
    showToolbarCoordinates: true,
    showToolbarRoles: true,
    showToolbarGrimoire: true,
    showToolbarSettings: true,
    showToolbarFullscreen: true,
  },
  downloadLogs: (format: 'json' | 'csv' | 'txt' = 'json') => {
    const logs = useVttStore.getState().logs;
    if (logs.length === 0) return;
    
    let content = '';
    let mimeType = 'text/plain';
    let extension = format;
    
    if (format === 'json') {
      content = JSON.stringify(logs, null, 2);
      mimeType = 'application/json';
    } else if (format === 'csv') {
      content = 'Timestamp,Type,Message\n' + logs.map(log => 
        `"${new Date(log.timestamp).toISOString()}","${log.type}","${log.message.replace(/"/g, '""')}"`
      ).join('\n');
      mimeType = 'text/csv';
    } else if (format === 'txt') {
      content = logs.map(log => 
        `[${new Date(log.timestamp).toLocaleString()}] ${log.type.toUpperCase()}: ${log.message}`
      ).join('\n');
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vtt-logs-${new Date().toISOString().split('T')[0]}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};

export const useVttStore = create<VttStore>()(
  persist(
    temporal(
      (set, get) => ({
        ...initialState,

  updateCampaignJournal: (updates) => set((state) => ({
    campaignJournal: {
      ...state.campaignJournal,
      ...updates
    }
  })),
  acquireJournalLock: (playerId, playerName) => {
    const state = get();
    const journal = state.campaignJournal;
    const now = Date.now();
    const isLockAvailable = 
      journal.lockHolderId === null || 
      journal.lockHolderId === playerId || 
      (journal.lockExpiration !== null && now > journal.lockExpiration);

    if (isLockAvailable) {
      set({
        campaignJournal: {
          ...journal,
          lockHolderId: playerId,
          lockHolderName: playerName,
          lockExpiration: now + 5 * 60 * 1000 // 5 minutes lock
        }
      });
      return true;
    }
    return false;
  },
  releaseJournalLock: (playerId) => {
    const state = get();
    const journal = state.campaignJournal;
    if (journal.lockHolderId === playerId) {
      set({
        campaignJournal: {
          ...journal,
          lockHolderId: null,
          lockHolderName: null,
          lockExpiration: null
        }
      });
    }
  },

    // Selection & Interaction
  setSelectedEntityIds: (ids) => set({ selectedEntityIds: ids }),
  clearSelection: () => set({ selectedEntityIds: [] }),
  setInteractionMode: (mode) => set({ interactionMode: mode }),

  setRoomName: (name) => set({ roomName: name }),
  generateRoomCode: () => {
    // Generate a 6-letter uppercase code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    set({ roomCode: code });
  },
  toggleRoomPublic: () => set((state) => ({ isRoomPublic: !state.isRoomPublic })),
  clearRoomCode: () => set({ roomCode: null, joinRequests: [], onlinePlayerIds: [] }),
  addJoinRequest: (name) => set((state) => ({ joinRequests: [...new Set([...state.joinRequests, name])] })),
  removeJoinRequest: (name) => set((state) => ({ joinRequests: state.joinRequests.filter(n => n !== name) })),
  setOnlinePlayers: (playerIds) => set({ onlinePlayerIds: playerIds }),
  setCallOrderIndex: (index) => set({ callOrderIndex: index }),
  setPan: (x, y) => set((state) => ({ canvas: { ...state.canvas, panX: x, panY: y } })),
  setZoom: (zoom) => set((state) => ({ canvas: { ...state.canvas, zoom } })),
  setCycleMode: (mode) => set({ cycleMode: mode }),
  setPublicMode: (mode) => set({ isPublicMode: mode }),
  setActiveLeftTab: (tab) => set({ activeLeftTab: tab }),
  setGameTabState: (updates) => set((state) => ({
    gameTabState: { ...state.gameTabState, ...updates }
  })),
  resetGameTabState: () => set({
    gameTabState: { treatedEntities: [], playerNotes: {}, focusMode: false, focusIndex: 0 }
  }),
  setEditingEntity: (entity) => set({ editingEntity: entity }),
  toggleLeftPanel: () => set((state) => ({ isLeftPanelOpen: !state.isLeftPanelOpen })),
  toggleLeftPanelExpanded: () => set((state) => ({ isLeftPanelExpanded: !state.isLeftPanelExpanded })),
  toggleRightPanelExpanded: () => set((state) => ({ isRightPanelExpanded: !state.isRightPanelExpanded })),
  toggleRightPanel: () => set((state) => {
    const newState = { isRightPanelOpen: !state.isRightPanelOpen };
    if (state.isRightPanelOpen && state.editingEntity?.type === 'soundButton') {
      return { ...newState, editingEntity: null };
    }
    return newState;
  }),

  // Tools
  setGrid: (grid) => set({ grid }),
  setRoom: (roomUpdates) => set((state) => ({ room: { ...state.room, ...roomUpdates } })),
  setTimer: (timerUpdates) => set((state) => ({ timer: { ...state.timer, ...timerUpdates } })),
  setSoundboard: (soundboardUpdates) => set((state) => {
    const newState = { soundboard: { ...state.soundboard, ...soundboardUpdates } };
    if (soundboardUpdates.isDetached === false && state.editingEntity?.type === 'soundButton') {
      return { ...newState, editingEntity: null };
    }
    return newState;
  }),
  setScoreboard: (update) => set((state) => ({ scoreboard: { ...state.scoreboard, ...update } })),
  setLogsSettings: (update) => set((state) => ({ logsSettings: { ...state.logsSettings, ...update } })),
  setLogsFilter: (filter) => set({ logsFilter: filter }),
  setWiki: (update) => set((state) => ({ wiki: { ...state.wiki, ...update } })),
  setChecklistState: (update) => set((state) => ({ checklistState: { ...state.checklistState, ...update } })),
  setTagDistributorState: (update) => set((state) => ({ tagDistributorState: { ...state.tagDistributorState, ...update } })),
  setRoleSelectorState: (update) => set((state) => ({ roleSelectorState: { ...state.roleSelectorState, ...update } })),
  updateSoundButton: (index, updates) => {
    if (updates.audioUrl && updates.audioUrl.startsWith('data:')) {
      const key = makeIdbKey(index);
      storeAudio(key, updates.audioUrl).catch(() => {});
      updates = { ...updates, audioUrl: `idb://${key}` };
    }
    set((state) => {
      const newButtons = [...state.soundboard.buttons];
      const existingIndex = newButtons.findIndex(b => b.index === index);
      if (existingIndex >= 0) {
        newButtons[existingIndex] = { ...newButtons[existingIndex], ...updates };
      } else {
        newButtons.push({
          index,
          name: updates.name || '',
          audioUrl: updates.audioUrl || '',
          isOneShot: updates.isOneShot ?? true,
          color: updates.color || '#3b82f6',
          icon: updates.icon || 'Music',
          volume: updates.volume ?? 1.0,
          ...updates
        });
      }
      return { soundboard: { ...state.soundboard, buttons: newButtons } };
    });
  },
  removeSoundButton: (index) => {
    deleteAudio(makeIdbKey(index)).catch(() => {});
    set((state) => ({
      soundboard: { ...state.soundboard, buttons: state.soundboard.buttons.filter(b => b.index !== index) }
    }));
  },
  swapSoundButtons: (indexA, indexB) => set((state) => {
    if (indexA === indexB) return state;
    const newButtons = state.soundboard.buttons.map(b => {
      if (b.index === indexA) return { ...b, index: indexB };
      if (b.index === indexB) return { ...b, index: indexA };
      return b;
    });
    return { soundboard: { ...state.soundboard, buttons: newButtons } };
  }),

  // Player Templates
  addPlayerTemplate: (templateData) => set((state) => ({
    playerTemplates: [...state.playerTemplates, { ...templateData, id: uuidv4() }]
  })),
  updatePlayerTemplate: (id, updates) => set((state) => ({
    playerTemplates: state.playerTemplates.map(p => p.id === id ? { ...p, ...updates } : p)
  })),
  deletePlayerTemplate: (id) => set((state) => ({
    playerTemplates: state.playerTemplates.filter(p => p.id !== id)
  })),

  // Players
  addPlayer: (playerData) => set((state) => {
    // On crée le nouveau joueur
    const newPlayer = { 
      points: undefined,
      votes: undefined,
      lives: undefined,
      ...playerData, 
      size: playerData.size ?? state.displaySettings.defaultPlayerSize ?? 40,
      shape: playerData.shape ?? state.displaySettings.defaultPlayerShape ?? 'circle',
      id: uuidv4(),
      creationOrder: 999999 // Valeur temporaire haute pour le mettre à la fin avant tri
    };

    // On ajoute et on re-numérote tout le monde pour garantir la séquence 1, 2, 3...
    const updatedPlayers = [...state.players, newPlayer]
      .sort((a, b) => (a.creationOrder || 0) - (b.creationOrder || 0))
      .map((p, index) => ({ ...p, creationOrder: index + 1 }));

    return { players: updatedPlayers };
  }),
  updatePlayer: (id, updates) => set((state) => {
    // Check if the player exists, if not, do nothing to avoid unnecessary re-renders
    const playerIndex = state.players.findIndex(p => p.id === id);
    if (playerIndex === -1) return state;

    const newPlayers = [...state.players];
    newPlayers[playerIndex] = { ...newPlayers[playerIndex], ...updates };
    return { players: newPlayers };
  }),
  updatePlayers: (updatesArray) => set((state) => {
    const newPlayers = [...state.players];
    updatesArray.forEach(({ id, updates }) => {
      const playerIndex = newPlayers.findIndex(p => p.id === id);
      if (playerIndex !== -1) {
        newPlayers[playerIndex] = { ...newPlayers[playerIndex], ...updates };
      }
    });
    return { players: newPlayers };
  }),
  deletePlayer: (id) => set((state) => {
    const filteredPlayers = state.players.filter(p => p.id !== id);
    // On re-numérote pour boucher les trous après suppression
    const reorderedPlayers = filteredPlayers
      .sort((a, b) => (a.creationOrder || 0) - (b.creationOrder || 0))
      .map((p, index) => ({ ...p, creationOrder: index + 1 }));
    
    return { players: reorderedPlayers };
  }),
  clearPlayers: () => set({ players: [] }),
  clearAllSelectionPastilles: () => set((state) => ({
    players: state.players.map(p => ({ ...p, selectionPastilles: [] }))
  })),

  // Roles
  addRole: (roleData) => set((state) => ({
    roles: [...state.roles, { ...roleData, id: uuidv4() }]
  })),
  updateRole: (id, updates) => set((state) => ({
    roles: state.roles.map(r => r.id === id ? { ...r, ...updates } : r)
  })),
  deleteRole: (id) => set((state) => ({
    roles: state.roles.filter(r => r.id !== id)
  })),

  // Teams
  addTeam: (teamData) => set((state) => ({
    teams: [...state.teams, { id: uuidv4(), ...teamData } as Team]
  })),
  updateTeam: (id, updates) => set((state) => ({
    teams: state.teams.map(t => t.id === id ? { ...t, ...updates } : t)
  })),
  deleteTeam: (id) => set((state) => ({
    teams: state.teams.filter(t => t.id !== id)
  })),

  // Tags
  addTagModel: (tagData) => set((state) => ({
    tags: [...state.tags, { ...tagData, id: uuidv4() }]
  })),
  updateTagModel: (id, updates) => set((state) => ({
    tags: state.tags.map(t => t.id === id ? { ...t, ...updates } : t),
    players: state.players.map(p => ({
      ...p,
      tags: p.tags.map(t => t.id === id ? { ...t, ...updates } : t)
    })),
    markers: state.markers.map(m => m.tag.id === id ? { ...m, tag: { ...m.tag, ...updates } } : m)
  })),
  deleteTagModel: (id) => set((state) => ({
    tags: state.tags.filter(t => t.id !== id),
    players: state.players.map(p => ({
      ...p,
      tags: p.tags.filter(t => t.id !== id)
    })),
    markers: state.markers.filter(m => m.tag.id !== id)
  })),
  reorderDistributorTags: (orderedTagIds) => set((state) => ({
    tags: state.tags.map(t => {
      const index = orderedTagIds.indexOf(t.id);
      if (t.isInDistributor && index !== -1) {
        return { ...t, distributorOrder: index };
      }
      return t;
    })
  })),

  // Tag Categories
  addTagCategory: (categoryData) => set((state) => ({
    tagCategories: [...state.tagCategories, { ...categoryData, id: uuidv4() }]
  })),
  updateTagCategory: (id, updates) => set((state) => ({
    tagCategories: state.tagCategories.map(c => c.id === id ? { ...c, ...updates } : c)
  })),
  deleteTagCategory: (id) => set((state) => ({
    tagCategories: state.tagCategories.filter(c => c.id !== id),
    tags: state.tags.map(t => t.categoryId === id ? { ...t, categoryId: null } : t)
  })),

  // Markers
  addMarker: (markerData) => set((state) => ({
    markers: [...state.markers, { ...markerData, id: uuidv4() }]
  })),
  updateMarker: (id, updates) => set((state) => ({
    markers: state.markers.map(m => m.id === id ? { ...m, ...updates } : m)
  })),
  deleteMarker: (id) => set((state) => ({
    markers: state.markers.filter(m => m.id !== id)
  })),
  clearMarkers: () => set({ markers: [] }),

  // Handouts
  addHandout: (handoutData) => set((state) => ({
    handouts: [...state.handouts, { ...handoutData, id: uuidv4() }]
  })),
  updateHandout: (id, updates) => set((state) => ({
    handouts: state.handouts.map(h => h.id === id ? { ...h, ...updates } : h)
  })),
  deleteHandout: (id) => set((state) => ({
    handouts: state.handouts.filter(h => h.id !== id)
  })),
  toggleHandout: (id) => set((state) => ({
    handouts: state.handouts.map(h => h.id === id ? { ...h, isOpen: !h.isOpen } : h)
  })),
  bringToFrontHandout: (id) => set((state) => {
    const maxZ = Math.max(0, ...state.handouts.map(h => h.zIndex || 0));
    return {
      handouts: state.handouts.map(h => h.id === id ? { ...h, zIndex: maxZ + 1 } : h)
    };
  }),
  addHandoutCategory: (category) => set((state) => ({
    handoutCategories: [...state.handoutCategories, { ...category, id: uuidv4() }]
  })),
  updateHandoutCategory: (id, updates) => set((state) => ({
    handoutCategories: state.handoutCategories.map(c => c.id === id ? { ...c, ...updates } : c)
  })),
  deleteHandoutCategory: (id) => set((state) => ({
    handoutCategories: state.handoutCategories.filter(c => c.id !== id),
    handouts: state.handouts.map(h => h.category === id ? { ...h, category: undefined } : h)
  })),

  // Game Logic
  setNight: (isNight) => set({ isNight }),
  nextCycle: () => set((state) => {
    let msg = "";
    if (state.isNight) {
      msg = `Le jour se lève (Cycle ${state.cycleNumber + 1})`;
      const updates: any = { 
        isNight: false, 
        cycleNumber: state.cycleNumber + 1,
        gameTabState: { ...state.gameTabState, treatedEntities: [], playerNotes: {}, focusIndex: 0 }
      };
      if (state.displaySettings.recordLogs !== false) {
        updates.logs = [{ id: uuidv4(), timestamp: Date.now(), message: msg, type: 'system' as const }, ...state.logs].slice(0, 100);
      }
      return updates;
    } else {
      msg = `La nuit tombe (Cycle ${state.cycleNumber})`;
      const updates: any = {
        isNight: true,
        gameTabState: { ...state.gameTabState, treatedEntities: [], playerNotes: {}, focusIndex: 0 }
      };
      if (state.displaySettings.recordLogs !== false) {
        updates.logs = [{ id: uuidv4(), timestamp: Date.now(), message: msg, type: 'system' as const }, ...state.logs].slice(0, 100);
      }
      return updates;
    }
  }),
  resetCycle: () => set({ isNight: false, cycleNumber: 1, gameTabState: { treatedEntities: [], playerNotes: {}, focusMode: false, focusIndex: 0 } }),

  // Settings
      updateDisplaySettings: (updates) => set((state) => ({
        displaySettings: { ...state.displaySettings, ...updates }
      })),

        // Colors
        addRecentColor: (color) => set((state) => {
          const uppercaseColor = color.toUpperCase();
          const existingIndex = state.recentColors.indexOf(uppercaseColor);
          if (existingIndex > -1) {
            // Move to front
            const newColors = [...state.recentColors];
            newColors.splice(existingIndex, 1);
            newColors.unshift(uppercaseColor);
            return { recentColors: newColors };
          } else {
            // Add to front, keep max 16
            return { recentColors: [uppercaseColor, ...state.recentColors].slice(0, 16) };
          }
        }),

        // Group Vote
        setActiveGroupVote: (vote) => set({ activeGroupVote: vote }),
        updateGroupVote: (voterId, targetId) => set((state) => {
          if (!state.activeGroupVote) return state;
          const newVotes = { ...state.activeGroupVote.votes };
          newVotes[voterId] = targetId;
          return { activeGroupVote: { ...state.activeGroupVote, votes: newVotes } };
        }),

        // Custom Popups
        addCustomPopup: (popup) => set((state) => ({
          customPopups: [...state.customPopups, { ...popup, id: uuidv4() } as CustomPopup]
        })),
        updateCustomPopup: (id, updates) => set((state) => ({
          customPopups: state.customPopups.map(p => p.id === id ? { ...p, ...updates } : p)
        })),
        deleteCustomPopup: (id) => set((state) => ({
          customPopups: state.customPopups.filter(p => p.id !== id),
          activeCustomPopupId: state.activeCustomPopupId === id ? null : state.activeCustomPopupId
        })),
        triggerCustomPopup: (id) => {
          const state = get();
          if (!id) {
            set({ activeCustomPopupId: id });
            return;
          }
          const popup = state.customPopups.find(p => p.id === id);
          if (!popup) {
            console.log('[Popup Trigger] Popup not found:', id);
            set({ activeCustomPopupId: null });
            return;
          }
          
          console.log('[Popup Trigger] Triggering popup:', {
            id,
            title: popup.title,
            targetPlayerIds: popup.targetPlayerIds,
            targetRoleIds: popup.targetRoleIds,
            targetTeamIds: popup.targetTeamIds,
            scheduledDelay: popup.scheduledDelay,
            scheduledAt: popup.scheduledAt
          });
          
          // Check for scheduled delay
          if (popup.scheduledDelay && popup.scheduledDelay > 0) {
            console.log('[Popup Trigger] Scheduling with delay:', popup.scheduledDelay, 'seconds');
            setTimeout(() => {
              console.log('[Popup Trigger] Delay elapsed, showing popup');
              set({ activeCustomPopupId: id });
            }, popup.scheduledDelay * 1000);
            return;
          }
          
          // Check for scheduled date/time
          if (popup.scheduledAt) {
            const scheduledTime = new Date(popup.scheduledAt).getTime();
            const now = Date.now();
            if (scheduledTime > now) {
              console.log('[Popup Trigger] Scheduling for:', new Date(popup.scheduledAt), 'in', (scheduledTime - now) / 1000, 'seconds');
              setTimeout(() => {
                console.log('[Popup Trigger] Scheduled time reached, showing popup');
                set({ activeCustomPopupId: id });
              }, scheduledTime - now);
              return;
            }
          }
          
          // Show immediately
          console.log('[Popup Trigger] Showing immediately');
          set({ activeCustomPopupId: id });
        },
        setPreviewPopup: (popup) => set({ previewPopup: popup }),

        // Smartphone action message
        setSmartphoneActionMessage: (message) => set({ smartphoneActionMessage: message }),
        setSmartphoneCountdown: (countdown) => set({ smartphoneCountdown: countdown }),

        // Logs
        addLog: (message, type, metadata) => set((state) => {
          if (state.displaySettings.recordLogs === false) return {};
          const newLog = { id: uuidv4(), timestamp: Date.now(), message, type, metadata };
          const maxLogs = state.logsSettings.maxLogs ?? 100;
          const newLogs = [newLog, ...state.logs].slice(0, maxLogs);
          // Auto-save to localStorage
          if (typeof window !== 'undefined' && state.displaySettings.persistLogs !== false) {
            localStorage.setItem('vttapp-logs', JSON.stringify(newLogs));
          }
          return { logs: newLogs };
        }),
        clearLogs: () => set((state) => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('vttapp-logs');
          }
          return { logs: [] };
        }),
        addChatMessage: (msg) => set((state) => {
          if (state.chatMessages.some(m => m.id === msg.id)) return state;
          return { chatMessages: [...state.chatMessages, msg] };
        }),
        clearChatMessages: () => set({ chatMessages: [] }),
        markChatMessagesAsRead: (senderOrGroupId) => set((state) => ({
          chatMessages: state.chatMessages.map(m => 
            (m.senderId === senderOrGroupId || m.recipientId === senderOrGroupId) && m.unread
              ? { ...m, unread: false }
              : m
          )
        })),

        // Checklist
        setChecklist: (checklistPayload) => set((state) => ({
          checklist: typeof checklistPayload === 'function' ? checklistPayload(state.checklist) : checklistPayload
        })),

        // Action Creator
        setActionCreatorState: (update) => set((state) => ({ actionCreatorState: { ...state.actionCreatorState, ...update } })),
        addAction: (actionData) => set((state) => ({
          actions: [...state.actions, { ...actionData, id: uuidv4() }]
        })),
        updateAction: (id, updates) => set((state) => ({
          actions: state.actions.map(a => a.id === id ? { ...a, ...updates } : a)
        })),
        deleteAction: (id) => set((state) => ({
          actions: state.actions.filter(a => a.id !== id)
        })),
        duplicateAction: (id) => set((state) => {
          const actionToDuplicate = state.actions.find(a => a.id === id);
          if (!actionToDuplicate) return state;
          const newAction = {
            ...actionToDuplicate,
            id: uuidv4(),
            name: `${actionToDuplicate.name} (Copie)`
          };
          return { actions: [...state.actions, newAction] };
        }),
        setPendingActionEnabled: (enabled: boolean) => set({ pendingActionEnabled: enabled }),
        setPendingElseActionId: (id: string | null) => set({ pendingElseActionId: id }),
        executeAction: (id, initialContext, depth = 0) => {
          executeActionEngine(id, initialContext, depth);
        },
        addPendingCondition: (conditionData) => set((state) => ({
          pendingActionConditions: [...state.pendingActionConditions, { ...conditionData, id: uuidv4() }]
        })),
        setActionConditionCreatorState: (update) => set((state) => ({ 
          actionConditionCreatorState: { ...state.actionConditionCreatorState, ...update } 
        })),

        updatePendingCondition: (id, updates) => set((state) => ({
          pendingActionConditions: state.pendingActionConditions.map(c => c.id === id ? { ...c, ...updates } : c)
        })),
        deletePendingCondition: (id) => set((state) => ({
          pendingActionConditions: state.pendingActionConditions.filter(c => c.id !== id)
        })),
        setPendingConditions: (conditions) => set({ pendingActionConditions: conditions }),
        clearPendingConditions: () => set({ 
          pendingActionConditions: [], 
          pendingActionOnce: false,
          pendingActionIsRecurring: false,
          pendingActionIntervalSeconds: 5,
          pendingActionRepeatCount: 2,
          pendingActionDelaySeconds: 0
        }),
        setPendingOnce: (once) => set({ pendingActionOnce: once }),
        setPendingDelay: (delay) => set({ pendingActionDelaySeconds: delay }),
        setPendingRecurring: (recurring, interval, count) => set({ 
          pendingActionIsRecurring: recurring,
          pendingActionIntervalSeconds: interval,
          pendingActionRepeatCount: count
        }),
        setActionEffectCreatorState: (update) => set((state) => ({ 
          actionEffectCreatorState: { ...state.actionEffectCreatorState, ...update } 
        })),
        addPendingEffect: (effectData) => set((state) => ({
          pendingActionEffects: [...state.pendingActionEffects, { ...effectData, id: uuidv4() }]
        })),
        updatePendingEffect: (id, updates) => set((state) => ({
          pendingActionEffects: state.pendingActionEffects.map(e => e.id === id ? { ...e, ...updates } : e)
        })),
        deletePendingEffect: (id) => set((state) => ({
          pendingActionEffects: state.pendingActionEffects.filter(e => e.id !== id)
        })),
        setPendingEffects: (effects) => set({ pendingActionEffects: effects }),
        clearPendingEffects: () => set({ pendingActionEffects: [] }),

        addMagneticPoint: (x, y) => set((state) => {
          const maxOrder = state.magneticPoints.reduce((max, p) => Math.max(max, p.order), 0);
          const { panX, panY, zoom } = state.canvas;
          const defaultX = x ?? (-panX + 500) / zoom;
          const defaultY = y ?? (-panY + 400) / zoom;
          return {
            magneticPoints: [...state.magneticPoints, {
              id: uuidv4(),
              x: defaultX,
              y: defaultY,
              order: maxOrder + 1
            }]
          };
        }),
        updateMagneticPoint: (id, x, y) => set((state) => ({
          magneticPoints: state.magneticPoints.map(p => p.id === id ? { ...p, x, y } : p)
        })),
        deleteMagneticPoint: (id) => set((state) => {
          const filtered = state.magneticPoints.filter(p => p.id !== id);
          const reordered = [...filtered]
            .sort((a, b) => a.order - b.order)
            .map((p, index) => ({ ...p, order: index + 1 }));
          return { magneticPoints: reordered };
        }),
        reorderMagneticPoints: (fromIndex: number, toIndex: number) => set((state) => {
          const points = [...state.magneticPoints].sort((a, b) => a.order - b.order);
          const [removed] = points.splice(fromIndex, 1);
          points.splice(toIndex, 0, removed);
          const reordered = points.map((p, index) => ({ ...p, order: index + 1 }));
          return { magneticPoints: reordered };
        }),
        createPointsFromTemplate: (template: { type: string; params: Record<string, any> }, count: number) => set((state) => {
          const { panX, panY, zoom } = state.canvas;
          const containerWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
          const containerHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
          const centerX = (-panX + containerWidth / 2) / zoom;
          const centerY = (-panY + containerHeight / 2) / zoom;
          const maxOrder = state.magneticPoints.reduce((max, p) => Math.max(max, p.order), 0);
          let newPoints: typeof state.magneticPoints = [];
          
          switch (template.type) {
            case 'circle': {
              const radius = template.params.radius ?? 150;
              for (let i = 0; i < count; i++) {
                const angle = (2 * Math.PI * i) / count;
                newPoints.push({
                  id: uuidv4(),
                  x: centerX + radius * Math.cos(angle),
                  y: centerY + radius * Math.sin(angle),
                  order: maxOrder + i + 1
                });
              }
              break;
            }
            case 'line': {
              const startX = template.params.startX ?? centerX - 150;
              const startY = template.params.startY ?? centerY;
              const endX = template.params.endX ?? centerX + 150;
              const endY = template.params.endY ?? centerY;
              for (let i = 0; i < count; i++) {
                const t = count === 1 ? 0.5 : i / (count - 1);
                newPoints.push({
                  id: uuidv4(),
                  x: startX + (endX - startX) * t,
                  y: startY + (endY - startY) * t,
                  order: maxOrder + i + 1
                });
              }
              break;
            }
            case 'grid': {
              const rows = template.params.rows ?? Math.ceil(Math.sqrt(count));
              const cols = template.params.cols ?? Math.ceil(count / rows);
              const spacing = template.params.spacing ?? 80;
              const startX = centerX - ((cols - 1) * spacing) / 2;
              const startY = centerY - ((rows - 1) * spacing) / 2;
              for (let i = 0; i < count; i++) {
                const row = Math.floor(i / cols);
                const col = i % cols;
                newPoints.push({
                  id: uuidv4(),
                  x: startX + col * spacing,
                  y: startY + row * spacing,
                  order: maxOrder + i + 1
                });
              }
              break;
            }
            case 'arc': {
              const radius = template.params.radius ?? 180;
              const startAngle = (template.params.startAngle ?? 0) * Math.PI / 180;
              const endAngle = (template.params.endAngle ?? 180) * Math.PI / 180;
              for (let i = 0; i < count; i++) {
                const t = count === 1 ? 0.5 : i / (count - 1);
                const angle = startAngle + (endAngle - startAngle) * t;
                newPoints.push({
                  id: uuidv4(),
                  x: centerX + radius * Math.cos(angle),
                  y: centerY + radius * Math.sin(angle),
                  order: maxOrder + i + 1
                });
              }
              break;
            }
            case 'random': {
              const bounds = template.params.bounds ?? { x: centerX - 200, y: centerY - 150, width: 400, height: 300 };
              for (let i = 0; i < count; i++) {
                newPoints.push({
                  id: uuidv4(),
                  x: bounds.x + Math.random() * bounds.width,
                  y: bounds.y + Math.random() * bounds.height,
                  order: maxOrder + i + 1
                });
              }
              break;
            }
            case 'square': {
              const size = template.params.size ?? 200;
              const countPerSide = template.params.countPerSide ?? Math.ceil(Math.sqrt(count));
              const spacing = size / (countPerSide - 1 || 1);
              const startX = centerX - size / 2;
              const startY = centerY - size / 2;
              for (let i = 0; i < count; i++) {
                const row = Math.floor(i / countPerSide);
                const col = i % countPerSide;
                newPoints.push({
                  id: uuidv4(),
                  x: startX + col * spacing,
                  y: startY + row * spacing,
                  order: maxOrder + i + 1
                });
              }
              break;
            }
            default:
              break;
          }
          
          return { magneticPoints: [...state.magneticPoints, ...newPoints] };
        }),
        clearMagneticPoints: () => set({ magneticPoints: [] }),
        setShowMagneticPoints: (show) => set({ showMagneticPoints: show }),
        setIsMagneticEnabled: (enabled) => set({ isMagneticEnabled: enabled }),
        setMagneticSnapToGrid: (enabled) => set({ magneticSnapToGrid: enabled }),
        setMagneticGridSize: (size) => set({ magneticGridSize: size }),
        setConnectionStatus: (status) => set({ connectionStatus: status }),
        setLastSyncTimestamp: (timestamp) => set({ lastSyncTimestamp: timestamp }),
        setSupabaseConfigured: (configured) => set({ supabaseConfigured: configured }),
        testConnection: async () => {
          const state = get();
          if (!state.supabaseConfigured) {
            return { success: false, error: 'Supabase non configuré' };
          }
          try {
            const { supabase } = await import('../lib/supabase');
            if (!supabase) {
              return { success: false, error: 'Supabase non initialisé' };
            }
            const { error } = await supabase.from('_ping').select('count');
            if (error) {
              set({ connectionStatus: 'error' });
              return { success: false, error: error.message };
            }
            set({ connectionStatus: 'connected' });
            return { success: true };
          } catch (e) {
            set({ connectionStatus: 'error' });
            return { success: false, error: (e as Error).message };
          }
        },
        resetChannel: () => {
          const state = get();
          if (state.roomCode) {
            const code = state.roomCode;
            import('../lib/realtime-host').then(({ initHostRealtime }) => {
              initHostRealtime(code);
              set({ connectionStatus: 'connecting' });
            });
          }
        },
        resetOnlinePlayers: () => set({ onlinePlayerIds: [] }),
        updateMagneticPointLabel: (id, label) => set((state) => ({
          magneticPoints: state.magneticPoints.map(p => p.id === id ? { ...p, label } : p)
        })),
        updateMagneticPointColor: (id, color) => set((state) => ({
          magneticPoints: state.magneticPoints.map(p => p.id === id ? { ...p, color } : p)
        })),
        updateMagneticPointTargeting: (id, targetRoleIds, targetTeamIds) => set((state) => ({
          magneticPoints: state.magneticPoints.map(p => p.id === id ? { ...p, targetRoleIds, targetTeamIds } : p)
        })),
        exportMagneticPoints: () => {
          const state = get();
          const exportData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            magneticPoints: state.magneticPoints,
          };
          const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `magnetic-points-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        },
        importMagneticPoints: (jsonData) => {
          try {
            const parsed = JSON.parse(jsonData);
            if (!parsed.magneticPoints || !Array.isArray(parsed.magneticPoints)) {
              return { success: false, error: 'Format invalide: champ magneticPoints manquant' };
            }
            set((state) => ({
              magneticPoints: [...state.magneticPoints, ...parsed.magneticPoints.map((p: any) => ({
                id: p.id || uuidv4(),
                x: p.x ?? 0,
                y: p.y ?? 0,
                order: p.order ?? 0,
                label: p.label,
                color: p.color,
                targetRoleIds: p.targetRoleIds,
                targetTeamIds: p.targetTeamIds,
              }))]
            }));
            return { success: true };
          } catch (e) {
            return { success: false, error: 'JSON invalide' };
          }
        },
        snapPlayersToPoints: (options) => set((state) => {
          let alivePlayers = state.players.filter(p => !p.isDead);
          let points = [...state.magneticPoints].sort((a, b) => a.order - b.order);
          
          if (points.length === 0 || alivePlayers.length === 0) return state;

          if (options?.targetRoleIds && options.targetRoleIds.length > 0) {
            alivePlayers = alivePlayers.filter(p => p.roleId && options.targetRoleIds!.includes(p.roleId));
          }
          if (options?.targetTeamIds && options.targetTeamIds.length > 0) {
            alivePlayers = alivePlayers.filter(p => p.teamId && options.targetTeamIds!.includes(p.teamId));
          }

          const playerUpdates: { id: string, updates: Partial<Player> }[] = [];
          const snapMode = state.displaySettings.magneticPointsSnapMode || 'nearest';
          const gridSize = state.magneticGridSize || 50;
          const snapToGrid = state.magneticSnapToGrid ?? false;

          const snapToGridCoord = (coord: number) => Math.round(coord / gridSize) * gridSize;

          if (snapMode === 'order') {
            points.forEach((point, idx) => {
              if (alivePlayers[idx]) {
                const finalX = snapToGrid ? snapToGridCoord(point.x) : point.x;
                const finalY = snapToGrid ? snapToGridCoord(point.y) : point.y;
                playerUpdates.push({ id: alivePlayers[idx].id, updates: { x: finalX, y: finalY } });
              }
            });
          } else {
            const remainingPlayers = [...alivePlayers];
          
            for (const point of points) {
              if (remainingPlayers.length === 0) break;
              
              let closestPlayerIndex = -1;
              let minDistance = Infinity;

              remainingPlayers.forEach((player, idx) => {
                const dx = player.x - point.x;
                const dy = player.y - point.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minDistance) {
                  minDistance = dist;
                  closestPlayerIndex = idx;
                }
              });

              if (closestPlayerIndex !== -1) {
                const player = remainingPlayers[closestPlayerIndex];
                const finalX = snapToGrid ? snapToGridCoord(point.x) : point.x;
                const finalY = snapToGrid ? snapToGridCoord(point.y) : point.y;
                playerUpdates.push({ id: player.id, updates: { x: finalX, y: finalY } });
                remainingPlayers.splice(closestPlayerIndex, 1);
              }
            }
          }

          if (playerUpdates.length === 0) return state;

          const newPlayers = state.players.map(p => {
            const update = playerUpdates.find(u => u.id === p.id);
            return update ? { ...p, ...update.updates } : p;
          });

          return { players: newPlayers };
        }),
        resetStore: () => set({ ...initialState }),
        setCoordinatePicker: (picker: { isActive: boolean; onPick?: (x: number, y: number) => void } | null) => set({ coordinatePicker: picker }),
        exportFullState: () => {
          const state = get();
          const exportData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            roomName: state.roomName,
            data: {
              players: state.players,
              roles: state.roles,
              teams: state.teams,
              tags: state.tags,
              tagCategories: state.tagCategories,
              markers: state.markers,
              handouts: state.handouts,
              handoutCategories: state.handoutCategories,
              actions: state.actions,
              customPopups: state.customPopups,
              checklist: state.checklist,
              magneticPoints: state.magneticPoints,
              displaySettings: state.displaySettings,
              soundboard: state.soundboard,
              scoreboard: state.scoreboard,
              wiki: state.wiki,
              room: state.room,
              grid: state.grid,
              cycleMode: state.cycleMode,
              isNight: state.isNight,
              cycleNumber: state.cycleNumber,
              gameTabState: state.gameTabState,
              timer: state.timer,
              playerTemplates: state.playerTemplates,
            }
          };
          const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `vtt-export-${state.roomName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        },
        exportPartialState: (sections: string[]) => {
          const state = get();
          const sectionMap: Record<string, any> = {
            players: state.players,
            roles: state.roles,
            teams: state.teams,
            tags: state.tags,
            tagCategories: state.tagCategories,
            markers: state.markers,
            handouts: state.handouts,
            actions: state.actions,
            customPopups: state.customPopups,
            checklist: state.checklist,
            magneticPoints: state.magneticPoints,
            displaySettings: state.displaySettings,
            soundboard: state.soundboard,
            scoreboard: state.scoreboard,
            wiki: state.wiki,
            room: state.room,
            grid: state.grid,
            playerTemplates: state.playerTemplates,
          };
          const exportData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            roomName: state.roomName,
            sections,
            data: Object.fromEntries(sections.filter(s => sectionMap[s] !== undefined).map(s => [s, sectionMap[s]])),
          };
          const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `vtt-export-partial-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        },
        importState: (jsonData: string) => {
          try {
            const parsed = JSON.parse(jsonData);
            if (!parsed.data || typeof parsed.data !== 'object') {
              return { success: false, error: 'Format de fichier invalide' };
            }
            const data = parsed.data;
            const updates: Partial<any> = {};
            if (data.players) updates.players = data.players;
            if (data.roles) updates.roles = data.roles;
            if (data.teams) updates.teams = data.teams;
            if (data.tags) updates.tags = data.tags;
            if (data.tagCategories) updates.tagCategories = data.tagCategories;
            if (data.markers) updates.markers = data.markers;
            if (data.handouts) updates.handouts = data.handouts;
            if (data.handoutCategories) updates.handoutCategories = data.handoutCategories;
            if (data.actions) updates.actions = data.actions;
            if (data.customPopups) updates.customPopups = data.customPopups;
            if (data.checklist) updates.checklist = data.checklist;
            if (data.magneticPoints) updates.magneticPoints = data.magneticPoints;
            if (data.displaySettings) updates.displaySettings = { ...get().displaySettings, ...data.displaySettings };
            if (data.soundboard) updates.soundboard = { ...get().soundboard, ...data.soundboard };
            if (data.scoreboard) updates.scoreboard = { ...get().scoreboard, ...data.scoreboard };
            if (data.wiki) updates.wiki = { ...get().wiki, ...data.wiki };
            if (data.room) updates.room = { ...get().room, ...data.room };
            if (data.grid) updates.grid = { ...get().grid, ...data.grid };
            if (data.cycleMode) updates.cycleMode = data.cycleMode;
            if (data.isNight !== undefined) updates.isNight = data.isNight;
            if (data.cycleNumber !== undefined) updates.cycleNumber = data.cycleNumber;
            if (data.gameTabState) updates.gameTabState = { ...get().gameTabState, ...data.gameTabState };
            if (data.timer) updates.timer = { ...get().timer, ...data.timer };
            if (data.playerTemplates) updates.playerTemplates = data.playerTemplates;
            if (parsed.roomName) updates.roomName = parsed.roomName;
            set(updates);
            return { success: true };
          } catch (e) {
            return { success: false, error: 'Erreur de parsing JSON' };
          }
        },
      }),
      {
        partialize: (state) => ({
          players: state.players,
          markers: state.markers,
          tags: state.tags,
          tagCategories: state.tagCategories,
          teams: state.teams,
          roles: state.roles,
          displaySettings: state.displaySettings,
          isNight: state.isNight,
          cycleNumber: state.cycleNumber,
          callOrderIndex: state.callOrderIndex,
          scoreboard: state.scoreboard,
          wiki: state.wiki,
          checklist: state.checklist,
          checklistState: state.checklistState,
          tagDistributorState: state.tagDistributorState,
          magneticPoints: state.magneticPoints,
          showMagneticPoints: state.showMagneticPoints,
          gameTabState: state.gameTabState,
        }),
        limit: undoLimit,
        equality: (pastState, currentState) => {
          return pastState.players === currentState.players &&
                 pastState.markers === currentState.markers &&
                 pastState.isNight === currentState.isNight &&
                 pastState.cycleNumber === currentState.cycleNumber &&
                 pastState.gameTabState === currentState.gameTabState;
        },
      }
    ),
    {
      name: 'vtt-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.editingEntity = null;
          state.actionCreatorState = { ...state.actionCreatorState, isOpen: false, editingActionId: null };
          state.actionConditionCreatorState = { ...state.actionConditionCreatorState, isOpen: false, editingConditionId: null };
          state.actionEffectCreatorState = { ...state.actionEffectCreatorState, isOpen: false, editingEffectId: null };
          state.pendingActionConditions = [];
          state.pendingActionEffects = [];
          // Restore logs from localStorage
          if (typeof window !== 'undefined') {
            const savedLogs = localStorage.getItem('vttapp-logs');
            if (savedLogs) {
              try {
                state.logs = JSON.parse(savedLogs);
              } catch (e) {
                console.error('Failed to restore logs from localStorage:', e);
              }
            }
          }

          // Migration: move base64 audio from localStorage to IndexedDB
          const buttons = state.soundboard?.buttons;
          if (buttons) {
            buttons.forEach(btn => {
              if (btn.audioUrl && btn.audioUrl.startsWith('data:')) {
                const key = makeIdbKey(btn.index);
                storeAudio(key, btn.audioUrl).then(() => {
                  const current = useVttStore.getState().soundboard.buttons.find(b => b.index === btn.index);
                  if (current && current.audioUrl === btn.audioUrl) {
                    useVttStore.getState().updateSoundButton(btn.index, { audioUrl: `idb://${key}` });
                  }
                }).catch(() => {});
              }
            });
          }
        }
      },
      partialize: (state) => {
        const { 
          editingEntity, 
          actionCreatorState, 
          actionConditionCreatorState, 
          actionEffectCreatorState,
          pendingActionConditions,
          pendingActionEffects,
          pendingActionOnce,
          pendingActionIsRecurring,
          pendingActionIntervalSeconds,
          pendingActionRepeatCount,
          pendingActionEnabled,
          pendingElseActionId,
          tagDistributorState,
          magneticPoints,
          showMagneticPoints,
          checklistState,
          activeCustomPopupId,
          ...rest 
        } = state;
        return rest;
      },
    }
  )
);

// Export selectors for optimized state access
export * from './selectors';
