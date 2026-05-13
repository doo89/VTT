import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { temporal } from 'zundo';
import type { GameState, EntityId, Player, Role, TagModel, TagCategory, Marker, Team, Handout, PlayerTemplate, LogEvent, CustomPopup, ChecklistItem, Action, ActionCreatorState, ActionCondition, ActionConditionCreatorState, ActionEffect, ActionEffectCreatorState, PlayerShape, RoleSelectorState } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface VttStore extends GameState {
  setCycleMode: (mode: GameState['cycleMode']) => void;
  setTimer: (timerUpdate: Partial<GameState['timer']>) => void;
  setSoundboard: (soundboardUpdate: Partial<GameState['soundboard']>) => void;
  updateSoundButton: (index: number, updates: Partial<GameState['soundboard']['buttons'][0]>) => void;
  removeSoundButton: (index: number) => void;
  setScoreboard: (scoreboardUpdate: Partial<GameState['scoreboard']>) => void;
  setWiki: (wikiUpdate: Partial<GameState['wiki']>) => void;
  setChecklistState: (checklistUpdate: Partial<GameState['checklistState']>) => void;
  setTagDistributorState: (distributorUpdate: Partial<GameState['tagDistributorState']>) => void;
  setRoleSelectorState: (roleSelectorUpdate: Partial<RoleSelectorState>) => void;
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
  setEditingEntity: (entity: GameState['editingEntity']) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  isLeftPanelOpen: boolean;
  isRightPanelOpen: boolean;

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

  // Action Creator
  setActionCreatorState: (state: Partial<ActionCreatorState>) => void;
  addAction: (action: Omit<Action, 'id'>) => void;
  updateAction: (id: string, updates: Partial<Action>) => void;
  deleteAction: (id: string) => void;
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

  // Logs
  addLog: (message: string, type: LogEvent['type']) => void;
  clearLogs: () => void;

  // Checklist
  setChecklist: (checklist: ChecklistItem[] | ((prev: ChecklistItem[]) => ChecklistItem[])) => void;

  // Magnetic Points
  addMagneticPoint: (x?: number, y?: number) => void;
  updateMagneticPoint: (id: string, x: number, y: number) => void;
  deleteMagneticPoint: (id: string) => void;
  clearMagneticPoints: () => void;
  setShowMagneticPoints: (show: boolean) => void;
  setIsMagneticEnabled: (enabled: boolean) => void;
  snapPlayersToPoints: () => void;
  resetStore: () => void;
}

export const initialState = {
  roomName: 'Ma Salle',
  roomCode: null,
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
  tagCategories: [],
  handouts: [],
  logs: [],
  recentColors: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff', '#000000', '#6b7280'], // default colors
  customPopups: [],
  activeCustomPopupId: null,
  previewPopup: null,
  checklist: [],
  isNight: false,
  cycleNumber: 1,
  callOrderIndex: 0,
  customVariables: {},
  cycleMode: 'dayNight' as const,
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
    remotePlayTrigger: null
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
    backgroundStyle: 'mosaic' as const,
  },
  displaySettings: {
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
      panelsOrder: ['distribution', 'chrono', 'soundboard', 'scoreboard', 'logs', 'tagDistributor', 'wiki', 'popupCreator', 'actionCreator', 'checklist', 'magneticPoints', 'system'],
    },
    includeRoomCodeInLinks: false,
    recordLogs: false,
    smartphoneTabs: {
      game: true,
      players: false,
      room: false,
      wiki: false,
      handouts: false,
    },
    smartphonePlayersOptions: {
      allowPrivateNotes: true,
      showDeadPlayers: true,
      includeSelf: true,
      allowNotesForDeadPlayers: true,
      showNotePreview: true,
    },
    showTimerOnSmartphone: true,
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
  },
  downloadLogs: () => {
    const logs = useVttStore.getState().logs;
    if (logs.length === 0) return;
    const dataStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vtt-logs-${new Date().toISOString().split('T')[0]}.json`;
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
  setActiveLeftTab: (tab) => set({ activeLeftTab: tab }),
  setEditingEntity: (entity) => set({ editingEntity: entity }),
  toggleLeftPanel: () => set((state) => ({ isLeftPanelOpen: !state.isLeftPanelOpen })),
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
  setWiki: (update) => set((state) => ({ wiki: { ...state.wiki, ...update } })),
  setChecklistState: (update) => set((state) => ({ checklistState: { ...state.checklistState, ...update } })),
  setTagDistributorState: (update) => set((state) => ({ tagDistributorState: { ...state.tagDistributorState, ...update } })),
  setRoleSelectorState: (update) => set((state) => ({ roleSelectorState: { ...state.roleSelectorState, ...update } })),
  updateSoundButton: (index, updates) => set((state) => {
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
  }),
  removeSoundButton: (index) => set((state) => ({
    soundboard: { ...state.soundboard, buttons: state.soundboard.buttons.filter(b => b.index !== index) }
  })),

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
    tags: state.tags.filter(t => t.id !== id)
  })),

  // Tag Categories
  addTagCategory: (categoryData) => set((state) => ({
    tagCategories: [...state.tagCategories, { ...categoryData, id: uuidv4() }]
  })),
  updateTagCategory: (id, updates) => set((state) => ({
    tagCategories: state.tagCategories.map(c => c.id === id ? { ...c, ...updates } : c)
  })),
  deleteTagCategory: (id) => set((state) => ({
    tagCategories: state.tagCategories.filter(c => c.id !== id)
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

  // Game Logic
  setNight: (isNight) => set({ isNight }),
  nextCycle: () => set((state) => {
    let msg = "";
    if (state.isNight) {
      msg = `Le jour se lève (Cycle ${state.cycleNumber + 1})`;
      const updates: any = { 
        isNight: false, 
        cycleNumber: state.cycleNumber + 1
      };
      if (state.displaySettings.recordLogs !== false) {
        updates.logs = [{ id: uuidv4(), timestamp: Date.now(), message: msg, type: 'system' as const }, ...state.logs].slice(0, 100);
      }
      return updates;
    } else {
      msg = `La nuit tombe (Cycle ${state.cycleNumber})`;
      const updates: any = { isNight: true };
      if (state.displaySettings.recordLogs !== false) {
        updates.logs = [{ id: uuidv4(), timestamp: Date.now(), message: msg, type: 'system' as const }, ...state.logs].slice(0, 100);
      }
      return updates;
    }
  }),
  resetCycle: () => set({ isNight: false, cycleNumber: 1 }),

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
        triggerCustomPopup: (id) => set({ activeCustomPopupId: id }),
        setPreviewPopup: (popup) => set({ previewPopup: popup }),

        // Smartphone action message
        setSmartphoneActionMessage: (message) => set({ smartphoneActionMessage: message }),
        setSmartphoneCountdown: (countdown) => set({ smartphoneCountdown: countdown }),

        // Logs
        addLog: (message, type) => set((state) => {
          if (state.displaySettings.recordLogs === false) return {};
          return {
            logs: [{ id: uuidv4(), timestamp: Date.now(), message, type }, ...state.logs].slice(0, 100) // Keep last 100 logs
          };
        }),
        clearLogs: () => set({ logs: [] }),

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
        setPendingActionEnabled: (enabled: boolean) => set({ pendingActionEnabled: enabled }),
        setPendingElseActionId: (id: string | null) => set({ pendingElseActionId: id }),
        executeAction: (id, initialContext, depth = 0) => {
          const run = (remaining: number, startEffectIndex: number = 0) => {
            if (depth > 5) {
              set((state: any) => {
                state.addLog(`Action annulée : profondeur maximale atteinte (SINON)`, 'system');
                return {};
              });
              return;
            }
            set((state: any) => {
              const action = state.actions.find((a: any) => a.id === id);
              if (!action) return {};
              
              // Check for cancellation signal (0 currentRepeatExecution when steps remain)
              const totalSteps = action.isRecurring ? (action.repeatCount || 2) : 1;
              if (remaining < totalSteps && action.currentRepeatExecution === 0) {
                return {};
              }
              
              if (action.enabled === false) return {};

              // Evaluation and Context
              let actionContext: { [key: string]: any } = initialContext ? { ...initialContext } : {};

              const evaluate = (conditions: ActionCondition[]): { success: boolean, failReason?: string } => {
                const activeConditions = (conditions || []).filter(c => c.enabled);
                if (activeConditions.length === 0) return { success: true };

                const mergeIntoJoueur = (player: any) => {
                  if (!player) return;
                  if (!actionContext['$Joueur']) {
                    actionContext['$Joueur'] = player;
                    return;
                  }
                  
                  const existing = actionContext['$Joueur'];
                  const existingIds = existing._isMultiple ? (existing._ids || []) : [existing.id];
                  const newIds = player._isMultiple ? (player._ids || []) : [player.id];
                  
                  const combinedIds = Array.from(new Set([...existingIds, ...newIds]));
                  if (combinedIds.length === existingIds.length && combinedIds.every(id => existingIds.includes(id))) {
                    return; 
                  }
                  
                  const allPlayers = state.players.filter((p: any) => combinedIds.includes(p.id));
                  const names = allPlayers.map((p: any) => p.name).join(', ');
                  if (allPlayers.length > 0) {
                    actionContext['$Joueur'] = { 
                      ...allPlayers[0], 
                      name: names, 
                      _isMultiple: true, 
                      _ids: combinedIds 
                    };
                  }
                };

                const checkSingle = (c: ActionCondition): boolean => {
                  const checkMatching = (p: any): boolean => {
                    const playerTags = p.tags || [];
                    const roleTags = state.roles.find((r: any) => r.id === p.roleId)?.tags || [];
                    const allPlayerTags = [...playerTags, ...roleTags];
                    
                    // Priority: Player's seenAsRoleId > Role's seenAsRoleId > Player's real roleId
                    const effectiveRoleId = p.seenAsRoleId || state.roles.find((r: any) => r.id === p.roleId)?.seenAsRoleId || p.roleId;

                    if (c.type === 'playerRole') {
                      const isRole = effectiveRoleId === c.roleId;
                      if (c.operator === '=') return isRole;
                      if (c.operator === '!=') return !isRole;
                    } else if (c.type === 'playerTag') {
                      const hasTag = allPlayerTags.some((t: any) => t.id === c.tagId);
                      if (c.operator === '=') return hasTag;
                      if (c.operator === '!=') return !hasTag;
                    } else if (c.type === 'playerPastille') {
                      const hasPastille = (p.selectionPastilles || []).some((past: any) => past.icon === c.pastilleIcon);
                      if (c.operator === '=') return hasPastille;
                      if (c.operator === '!=') return !hasPastille;
                    } else if (c.type === 'playerSelection' || c.type === 'playerSelectionRole') {
                      const isRole = effectiveRoleId === (c.selectionRoleId || c.roleId);
                      if (c.operator === '=') return isRole;
                      if (c.operator === '!=') return !isRole;
                    } else if (c.type === 'playerSelectionTag') {
                      const hasTag = allPlayerTags.some((t: any) => t.id === c.tagId);
                      if (c.operator === '=') return hasTag;
                      if (c.operator === '!=') return !hasTag;
                    } else if (c.type === 'playerSelectionPastille') {
                      const hasPastille = (p.selectionPastilles || []).some((past: any) => past.icon === c.pastilleIcon);
                      if (c.operator === '=') return hasPastille;
                      if (c.operator === '!=') return !hasPastille;
                    } else if (c.type === 'playerSelectionTeam') {
                      const isTeam = p.teamId === (c.selectionTeamId || null);
                      if (c.operator === '=') return isTeam;
                      if (c.operator === '!=') return !isTeam;
                    }
                    return false;
                  };
 
                  if (c.type === 'callOrderRole') {
                    const calledPlayers = state.players.filter((p: any) => {
                      const playerTags = p.tags || [];
                      const roleTags = state.roles.find((r: any) => r.id === p.roleId)?.tags || [];
                      const allTags = [...playerTags, ...roleTags];
                      return allTags.some((tag: any) => {
                        const order = (state.cycleMode === 'dayNight' && state.isNight) ? tag.callOrderNight : tag.callOrderDay;
                        return order !== null && order !== undefined && order !== '' && Number(order) === state.callOrderIndex;
                      });
                    });
                    
                    const hasRole = calledPlayers.some((p: any) => p.roleId === c.roleId);
                    
                    if (c.operator === '=') return hasRole;
                    if (c.operator === '!=') return calledPlayers.length > 0 ? !hasRole : true;
                  }

                  if (c.type === 'playerRole' || c.type === 'playerTag' || c.type === 'playerPastille') {
                    const sortedPlayers = [...state.players].sort((a: any, b: any) => (a.creationOrder || 0) - (b.creationOrder || 0));
                    if (sortedPlayers.length === 0) return false;
                    
                    let targetIndex = (c.value - 1) % sortedPlayers.length;
                    while (targetIndex < 0) targetIndex += sortedPlayers.length;
                    
                    const targetPlayer = sortedPlayers[targetIndex];
                    if (targetPlayer && checkMatching(targetPlayer)) {
                      mergeIntoJoueur(targetPlayer);
                      return true;
                    }
                    return false;
                  }

                  if (c.type === 'playerSelection' || c.type === 'playerSelectionRole' || c.type === 'playerSelectionTag' || c.type === 'playerSelectionPastille' || c.type === 'playerSelectionTeam') {
                    if (c.selectionType === 'all' || c.selectionType === 'callOrder') {
                      let sourcePlayers = state.players;
                      if (c.selectionType === 'callOrder') {
                        sourcePlayers = state.players.filter((p: any) => {
                          const playerTags = p.tags || [];
                          const roleTags = state.roles.find((r: any) => r.id === p.roleId)?.tags || [];
                          const allTags = [...playerTags, ...roleTags];
                          return allTags.some((tag: any) => {
                            const order = (state.cycleMode === 'dayNight' && state.isNight) ? tag.callOrderNight : tag.callOrderDay;
                            return order !== null && order !== undefined && order !== '' && Number(order) === state.callOrderIndex;
                          });
                        });
                      }

                      const matchingPlayers = sourcePlayers.filter(checkMatching);
                      if (matchingPlayers.length > 0) {
                        const names = matchingPlayers.map((p: any) => p.name).join(', ');
                        const ids = matchingPlayers.map((p: any) => p.id);
                        mergeIntoJoueur({ ...matchingPlayers[0], name: names, _isMultiple: true, _ids: ids });
                        return true;
                      }
                      return false;
                    }

                    if (c.selectionType === 'numeric') {
                      const sortedPlayers = [...state.players].sort((a: any, b: any) => (a.creationOrder || 0) - (b.creationOrder || 0));
                      if (sortedPlayers.length === 0) return false;
                      
                      let targetIndex = (c.value - 1) % sortedPlayers.length;
                      while (targetIndex < 0) targetIndex += sortedPlayers.length;
                      
                      const targetPlayer = sortedPlayers[targetIndex];
                      if (targetPlayer && checkMatching(targetPlayer)) {
                        mergeIntoJoueur(targetPlayer);
                        return true;
                      }
                      return false;
                    }

                    if (c.selectionType === 'random') {
                      const matchingPlayers = state.players.filter(checkMatching);
                      if (matchingPlayers.length > 0) {
                        const randomPlayer = matchingPlayers[Math.floor(Math.random() * matchingPlayers.length)];
                        mergeIntoJoueur(randomPlayer);
                        return true;
                      }
                      return false;
                    }
                    
                    const sortedPlayers = [...state.players].sort((a: any, b: any) => (a.creationOrder || 0) - (b.creationOrder || 0));
                    if (c.selectionType === 'last') sortedPlayers.reverse();
                    const foundPlayer = sortedPlayers.find(checkMatching);
                    
                    if (foundPlayer) {
                      mergeIntoJoueur(foundPlayer);
                      return true;
                    }
                    return false;
                  }

                  if (['playerDistance', 'playerDistanceTag', 'playerDistancePastille', 'playerDistanceTeam', 'playerDistanceStatus', 'playerDistanceSelf', 'playerDistanceSelected'].includes(c.type)) {
                    let sources: any[] = [];
                    if (c.distanceFromPlayerId === '$Joueur') {
                      if (actionContext['$Joueur']) sources = [actionContext['$Joueur']];
                    } else if (c.distanceFromPlayerId === '$Selected') {
                      sources = state.players.filter((p: any) => state.selectedEntityIds.includes(p.id));
                    } else {
                      const explicitPlayer = state.players.find((p: any) => p.id === c.distanceFromPlayerId);
                      if (explicitPlayer) sources = [explicitPlayer];
                    }

                    if (sources.length === 0) return false;

                    const sortedPlayers = [...state.players].sort((a: any, b: any) => (a.creationOrder || 0) - (b.creationOrder || 0));
                    const minDist = Math.min(c.minValue ?? 0, c.maxValue ?? 0);
                    const maxDist = Math.max(c.minValue ?? 0, c.maxValue ?? 0);

                    const checkTargetCriteria = (targetPlayer: any) => {
                      if (!targetPlayer) return false;
                      const targetRoleTags = state.roles.find((r: any) => r.id === targetPlayer.roleId)?.tags || [];
                      const allTargetTags = [...(targetPlayer.tags || []), ...targetRoleTags];

                      if (c.type === 'playerDistance') {
                        return targetPlayer.roleId === c.distanceTargetRoleId;
                      } else if (c.type === 'playerDistanceTag') {
                        return allTargetTags.some((t: any) => t.id === c.tagId);
                      } else if (c.type === 'playerDistancePastille') {
                        return (targetPlayer.selectionPastilles || []).some((p: any) => p.icon === c.pastilleIcon);
                      } else if (c.type === 'playerDistanceTeam') {
                        return targetPlayer.teamId === c.distanceTargetTeamId;
                      } else if (c.type === 'playerDistanceStatus') {
                        if (c.distanceTargetStatus === 'alive') return !targetPlayer.isDead;
                        if (c.distanceTargetStatus === 'dead') return targetPlayer.isDead;
                      } else if (c.type === 'playerDistanceSelf') {
                        return targetPlayer.id === (actionContext['$Joueur']?.id);
                      } else if (c.type === 'playerDistanceSelected') {
                        return state.selectedEntityIds.includes(targetPlayer.id);
                      }
                      return false;
                    };

                    return sources.some(sourcePlayer => {
                      if (c.distanceUnit === 'physical') {
                        return state.players.some((targetPlayer: any) => {
                          if (targetPlayer.id === sourcePlayer.id) return false;
                          const dx = targetPlayer.x - sourcePlayer.x;
                          const dy = targetPlayer.y - sourcePlayer.y;
                          const dist = Math.sqrt(dx * dx + dy * dy);
                          if (dist < minDist || dist > maxDist) return false;
                          return checkTargetCriteria(targetPlayer);
                        });
                      } else {
                        // Logical distance (index)
                        const sourceIndex = sortedPlayers.findIndex((p: any) => p.id === sourcePlayer.id);
                        if (sourceIndex === -1) return false;

                        const len = sortedPlayers.length;
                        if (len === 0) return false;

                        for (let dist = minDist; dist <= maxDist; dist++) {
                          const targetIndex = ((sourceIndex + dist) % len + len) % len;
                          if (checkTargetCriteria(sortedPlayers[targetIndex])) return true;
                        }
                        return false;
                      }
                    });
                  }

                  if (c.type === 'cycleCheck') {
                    let compareVal = 0;
                    let isActive = false;
                    if (c.cycleCheckType === '$Jour') {
                      isActive = !state.isNight;
                      compareVal = state.cycleNumber;
                    } else if (c.cycleCheckType === '$Nuit') {
                      isActive = state.isNight;
                      compareVal = state.cycleNumber;
                    } else if (c.cycleCheckType === '$Cycle') {
                      isActive = state.cycleMode !== 'none';
                      compareVal = state.cycleNumber;
                    } else if (c.cycleCheckType === '$Ordre') {
                      isActive = state.callOrderIndex > 0;
                      compareVal = state.callOrderIndex;
                    } else if (c.cycleCheckType === '$Parité') {
                      isActive = true;
                      compareVal = state.cycleNumber % 2;
                    } else if (c.cycleCheckType === '$Phase') {
                      isActive = true;
                      compareVal = state.isNight ? 1 : 0;
                    } else if (c.cycleCheckType === '$Timer') {
                      isActive = state.timer.isRunning;
                      compareVal = (state.timer.minutes * 60) + state.timer.seconds;
                    } else if (c.cycleCheckType === '$NbEnLigne') {
                      isActive = true;
                      compareVal = state.onlinePlayerIds.length;
                    } else if (c.cycleCheckType === '$NbTotal') {
                      isActive = true;
                      compareVal = state.players.length;
                    } else if (c.cycleCheckType === '$NbVivants') {
                      isActive = true;
                      compareVal = state.players.filter((p: any) => !p.isDead).length;
                    } else if (c.cycleCheckType === '$NbMorts') {
                      isActive = true;
                      compareVal = state.players.filter((p: any) => p.isDead).length;
                    } else if (c.cycleCheckType) {
                      // Custom variable check
                      isActive = true;
                      compareVal = state.customVariables[c.cycleCheckType] || 0;
                    }

                    const op: string = c.operator;
                    if (!op || op === '') return isActive;

                    switch (c.operator) {
                      case '=': return isActive && compareVal === c.value;
                      case '<': return isActive && compareVal < c.value;
                      case '>': return isActive && compareVal > c.value;
                      case '!=': return isActive && compareVal !== c.value;
                      case '<=': return isActive && compareVal <= c.value;
                      case '>=': return isActive && compareVal >= c.value;
                      case 'modulo': return isActive && c.value > 0 && compareVal % c.value === 0;
                      default: return isActive;
                    }
                  }

                  if (c.type === 'roleTeamCheck') {
                    const role = state.roles.find((r: any) => r.id === c.roleId);
                    const isTeam = (role?.teamId || null) === (c.teamId || null);
                    if (c.operator === '=') return isTeam;
                    if (c.operator === '!=') return !isTeam;
                    return false;
                  }

                  let compareVal = 0;
                  if (c.type === 'day') {
                    if (state.isNight) return false;
                    compareVal = state.cycleNumber;
                  } else if (c.type === 'night') {
                    if (!state.isNight) return false;
                    compareVal = state.cycleNumber;
                  } else if (c.type === 'turn') {
                    compareVal = state.cycleNumber;
                  }

                  switch (c.operator) {
                    case '=': return compareVal === c.value;
                    case '<': return compareVal < c.value;
                    case '>': return compareVal > c.value;
                    case '!=': return compareVal !== c.value;
                    case '<=': return compareVal <= c.value;
                    case '>=': return compareVal >= c.value;
                    case 'modulo': return c.value > 0 && compareVal % c.value === 0;
                    default: return false;
                  }
                };

                const getConditionLabel = (c: ActionCondition): string => {
                  if (c.type === 'playerRole') {
                    const roleName = state.roles.find((r: any) => r.id === c.roleId)?.name || 'Inconnu';
                    return `Joueur ${c.value} ${c.operator} ${roleName}`;
                  }
                  if (c.type === 'playerTag') {
                    const tagName = state.tags.find((t: any) => t.id === c.tagId)?.name || 'Inconnu';
                    return `Joueur ${c.value} ${c.operator} ${tagName}`;
                  }
                  if (c.type === 'playerPastille') {
                    return `Joueur ${c.value} ${c.operator} Pastille ${c.pastilleIcon}`;
                  }
                  if (c.type === 'playerSelection' || c.type === 'playerSelectionRole' || c.type === 'playerSelectionTag' || c.type === 'playerSelectionPastille' || c.type === 'playerSelectionTeam') {
                    const selectionLabel = c.selectionType === 'all' ? 'Tous les Joueurs' : (c.selectionType === 'first' ? '1er Joueur' : (c.selectionType === 'last' ? 'Dernier Joueur' : (c.selectionType === 'numeric' ? `Joueur ${c.value}` : (c.selectionType === 'random' ? 'Aléatoire' : '$Ordre'))));
                    let targetLabel = 'Inconnu';
                    if (c.type === 'playerSelection' || c.type === 'playerSelectionRole') {
                      targetLabel = state.roles.find((r: any) => r.id === (c.selectionRoleId || c.roleId))?.name || 'Inconnu';
                    } else if (c.type === 'playerSelectionTag') {
                      targetLabel = state.tags.find((t: any) => t.id === c.tagId)?.name || 'Inconnu';
                    } else if (c.type === 'playerSelectionPastille') {
                      targetLabel = `Pastille ${c.pastilleIcon}`;
                    } else if (c.type === 'playerSelectionTeam') {
                      targetLabel = state.teams.find((t: any) => t.id === c.selectionTeamId)?.name || 'Aucune équipe';
                    }
                    return `${selectionLabel} ${c.operator} ${targetLabel}`;
                  }
                  if (c.type === 'playerDistance' || c.type === 'playerDistanceTag' || c.type === 'playerDistancePastille') {
                    let targetLabel = 'Inconnu';
                    if (c.type === 'playerDistance') {
                      targetLabel = state.roles.find((r: any) => r.id === c.distanceTargetRoleId)?.name || 'Inconnu';
                    } else if (c.type === 'playerDistanceTag') {
                      targetLabel = state.tags.find((t: any) => t.id === c.tagId)?.name || 'Inconnu';
                    } else if (c.type === 'playerDistancePastille') {
                      targetLabel = `Pastille ${c.pastilleIcon}`;
                    }
                    const fromLabel = c.distanceFromPlayerId === '$Joueur' ? '$Joueur' : (c.distanceFromPlayerId === '$Selected' ? 'Joueur(s) sélectionné(s)' : 'Joueur');
                    const rangeLabel = (c.minValue !== undefined && c.maxValue !== undefined) 
                      ? (c.minValue === c.maxValue ? `${c.minValue}` : `${c.minValue} à ${c.maxValue}`)
                      : `${c.value}`;
                    return `Dist. ${rangeLabel} de : ${fromLabel} (${targetLabel})`;
                  }
                  if (c.type === 'cycleCheck') {
                    const op: string = c.operator;
                    if (!op || op === '') return `${c.cycleCheckType} (Actif)`;
                    const opLabel = c.operator === 'modulo' ? 'Tous les' : c.operator;
                    return `${c.cycleCheckType} ${opLabel} ${c.value}`;
                  }
                  if (c.type === 'roleTeamCheck') {
                    const roleName = state.roles.find((r: any) => r.id === c.roleId)?.name || 'Rôle Inconnu';
                    const teamName = state.teams.find((t: any) => t.id === c.teamId)?.name || 'Aucune équipe';
                    return `${roleName} ${c.operator} ${teamName}`;
                  }
                  const typeLabel = c.type === 'day' ? 'Jour' : c.type === 'night' ? 'Nuit' : 'Tour';
                  const opLabel = c.operator === 'modulo' ? 'Tous les' : c.operator;
                  return `${typeLabel} ${opLabel} ${c.value}`;
                };

                const andGroups: { result: boolean, label: string }[] = [];
                let currentGroupResult = checkSingle(activeConditions[0]);
                let currentGroupLabel = getConditionLabel(activeConditions[0]);

                for (let i = 1; i < activeConditions.length; i++) {
                  const c = activeConditions[i];
                  const val = checkSingle(c);
                  const label = getConditionLabel(c);

                  if (c.logic === 'OR') {
                    andGroups.push({ result: currentGroupResult, label: currentGroupLabel });
                    currentGroupResult = val;
                    currentGroupLabel = label;
                  } else {
                    currentGroupResult = currentGroupResult && val;
                    currentGroupLabel = `${currentGroupLabel} ET ${label}`;
                  }
                }
                andGroups.push({ result: currentGroupResult, label: currentGroupLabel });

                const finalResult = andGroups.some(g => g.result);
                return { success: finalResult, failReason: finalResult ? undefined : andGroups.map(g => `(${g.label})`).join(' OU ') };
              };

              if (startEffectIndex === 0) {
                const evaluation = evaluate(action.conditions || []);
                if (!evaluation.success) {
                  state.addLog(`Action "${action.name}" annulée : condition non remplie (${evaluation.failReason})`, 'system');
                  if (action.elseActionId && depth < 5) {
                    setTimeout(() => {
                      const currentState = (useVttStore.getState() as any);
                      currentState.executeAction(action.elseActionId, initialContext, depth + 1);
                    }, 100);
                  }
                  return {};
                }
              }
              
              let nextMarkers = [...state.markers];
              let nextPlayers = [...state.players];
              let nextRoles = [...state.roles];
              let nextTags = [...state.tags];
              let nextCustomVars = { ...state.customVariables };
              let phaseShift = 0;
              let resetValue: number | null = null;
              let nextDisplaySettings = { ...state.displaySettings };
              let nextCycleMode = state.cycleMode;
              let nextHandouts = [...state.handouts];
              let nextRoom = { ...state.room };
              let effectUpdates: any = {};
              
              const effectsToRun = action.effects || [];
              let currentEffectIndex = startEffectIndex;
              let hasWait = false;
              let waitTime = 0;
              
              for (; currentEffectIndex < effectsToRun.length; currentEffectIndex++) {
                const effect = effectsToRun[currentEffectIndex];
                if (!effect.enabled) continue;
                
                if (effect.type === 'wait') {
                  hasWait = true;
                  waitTime = effect.value || 0;
                  
                  if (effect.showCountdown) {
                    state.setSmartphoneCountdown({
                      duration: waitTime,
                      remaining: waitTime,
                      message: effect.countdownMessage || '',
                      isActive: true
                    });
                  }
                  break;
                }
                if (effect.type === 'deleteAllTags') nextMarkers = [];
                if (effect.type === 'nextPhase') phaseShift++;
                if (effect.type === 'previousPhase') phaseShift--;
                if (effect.type === 'resetCycle') { resetValue = 1; phaseShift = 0; }
                if (effect.type === 'setCycleDayNight') nextCycleMode = 'dayNight';
                if (effect.type === 'setCycleTurn') nextCycleMode = 'turn';
                if (effect.type === 'setCycleNone') nextCycleMode = 'none';
                if (effect.type === 'setDayNumber') { resetValue = effect.value || 1; effectUpdates.isNight = false; }
                if (effect.type === 'setNightNumber') { resetValue = effect.value || 1; effectUpdates.isNight = true; }
                if (effect.type === 'deleteSelectionPastilles') nextPlayers = nextPlayers.map(p => ({ ...p, selectionPastilles: [] }));
                if (effect.type === 'deleteAllPlayerTags') nextPlayers = nextPlayers.map(p => ({ ...p, tags: [] }));
                if (effect.type === 'resurrectAllPlayers') nextPlayers = nextPlayers.map(p => ({ ...p, isDead: false }));
                if (effect.type === 'showAllPlayers') nextDisplaySettings.showPlayers = true;
                if (effect.type === 'hideAllPlayers') nextDisplaySettings.showPlayers = false;
                if (effect.type === 'showPlayerImage') nextDisplaySettings.showPlayerImage = true;
                if (effect.type === 'hidePlayerImage') nextDisplaySettings.showPlayerImage = false;
                if (effect.type === 'showRoleImage') nextDisplaySettings.showRoleImage = true;
                if (effect.type === 'hideRoleImage') nextDisplaySettings.showRoleImage = false;
                if (effect.type === 'showPlayerTooltip') nextDisplaySettings.showTooltip = true;
                if (effect.type === 'hidePlayerTooltip') nextDisplaySettings.showTooltip = false;
                if (effect.type === 'showTagTooltip') nextDisplaySettings.showTagTooltip = true;
                if (effect.type === 'hideTagTooltip') nextDisplaySettings.showTagTooltip = false;
                if (effect.type === 'showRoleColor') nextDisplaySettings.showRoleColor = true;
                if (effect.type === 'hideRoleColor') nextDisplaySettings.showRoleColor = false;
                if (effect.type === 'showTimerOnSmartphone') nextDisplaySettings.showTimerOnSmartphone = true;
                if (effect.type === 'hideTimerOnSmartphone') nextDisplaySettings.showTimerOnSmartphone = false;
                if (effect.type === 'setRoomBackground') {
                  nextRoom = { ...nextRoom, backgroundImage: effect.backgroundImageUrl || null };
                }
                if (effect.type === 'setRoomColor') {
                  nextRoom = { ...nextRoom, backgroundColor: effect.roomColor || nextRoom.backgroundColor };
                }
                if (effect.type === 'assignTag') {
                  const tagId = effect.tagId;
                  const tagModel = state.tags.find((t: any) => t.id === tagId);
                  const player = actionContext['$Joueur'];
                  if (tagModel && player) {
                    const ids = player._isMultiple ? player._ids : [player.id];
                    nextPlayers = nextPlayers.map(p => {
                      if (ids.includes(p.id)) {
                        const hasTag = p.tags?.some((t: any) => t.id === tagId);
                        if (!hasTag) {
                          const newTag = { ...tagModel, instanceId: Math.random().toString(36).substring(2, 9) };
                          return { ...p, tags: [...(p.tags || []), newTag] };
                        }
                      }
                      return p;
                    });
                  }
                }
                if (effect.type === 'removeTag') {
                  const tagId = effect.tagId;
                  const player = actionContext['$Joueur'];
                  if (player && tagId) {
                    const ids = player._isMultiple ? player._ids : [player.id];
                    nextPlayers = nextPlayers.map(p => {
                      if (ids.includes(p.id)) {
                        return { ...p, tags: (p.tags || []).filter((t: any) => t.id !== tagId) };
                      }
                      return p;
                    });
                  }
                }
                if (effect.type === 'assignRole') {
                  const roleId = effect.roleId;
                  const player = actionContext['$Joueur'];
                  if (player && roleId) {
                    const ids = player._isMultiple ? player._ids : [player.id];
                    nextPlayers = nextPlayers.map(p => ids.includes(p.id) ? { ...p, roleId } : p);
                  }
                }
                if (effect.type === 'assignTagToRole') {
                  const tagId = effect.tagId;
                  const roleId = effect.roleId;
                  const tagModel = state.tags.find((t: any) => t.id === tagId);
                  if (tagModel && roleId) {
                    nextPlayers = nextPlayers.map(p => {
                      if (p.roleId === roleId) {
                        const hasTag = p.tags?.some((t: any) => t.id === tagId);
                        if (!hasTag) {
                          const newTag = { ...tagModel, instanceId: Math.random().toString(36).substring(2, 9) };
                          return { ...p, tags: [...(p.tags || []), newTag] };
                        }
                      }
                      return p;
                    });
                  }
                }
                if (effect.type === 'removeTagFromRole') {
                  const tagId = effect.tagId;
                  const roleId = effect.roleId;
                  if (tagId && roleId) {
                    nextPlayers = nextPlayers.map(p => {
                      if (p.roleId === roleId) {
                        return { ...p, tags: (p.tags || []).filter((t: any) => t.id !== tagId) };
                      }
                      return p;
                    });
                  }
                }
                if (effect.type === 'assignTeam') {
                  const player = actionContext['$Joueur'];
                  if (player) {
                    const ids = player._isMultiple ? player._ids : [player.id];
                    nextPlayers = nextPlayers.map(p => {
                      if (ids.includes(p.id)) {
                        const nextP = { ...p };
                        if (effect.teamId !== 'unchanged') nextP.teamId = effect.teamId;
                        if (effect.roleTeamId !== 'unchanged' && p.roleId) {
                          // Update all players with this role
                          nextPlayers = nextPlayers.map(p2 => p2.roleId === p.roleId ? { ...p2, teamId: effect.roleTeamId } : p2);
                        }
                        return nextP;
                      }
                      return p;
                    });
                  }
                }
                if (effect.type === 'assignTeamToRole') {
                  if (effect.roleId && effect.teamId !== 'unchanged') {
                    nextPlayers = nextPlayers.map(p => p.roleId === effect.roleId ? { ...p, teamId: effect.teamId } : p);
                  }
                }
                if (effect.type === 'resurrectAllPlayers') {
                  nextPlayers = nextPlayers.map(p => ({ ...p, isDead: false }));
                }
                if (effect.type === 'wakeAllPlayers') {
                  nextPlayers = nextPlayers.map(p => ({ ...p, isAsleep: false }));
                }
                if (effect.type === 'sleepAllPlayers') {
                  nextPlayers = nextPlayers.map(p => ({ ...p, isAsleep: true }));
                }
                if (effect.type === 'sleepPlayer' || effect.type === 'wakePlayer' || effect.type === 'switchSleepPlayer') {
                  const player = actionContext['$Joueur'];
                  if (player) {
                    const ids = player._isMultiple ? player._ids : [player.id];
                    nextPlayers = nextPlayers.map(p => {
                      if (ids.includes(p.id)) {
                        const isAsleep = effect.type === 'sleepPlayer' ? true : (effect.type === 'wakePlayer' ? false : !p.isAsleep);
                        return { ...p, isAsleep };
                      }
                      return p;
                    });
                  }
                }
                if (effect.type === 'selectPlayer') {
                  const player = actionContext['$Joueur'];
                  if (player) {
                    const ids = player._isMultiple ? player._ids : [player.id];
                    nextPlayers = nextPlayers.map(p => ({ ...p, isSelected: ids.includes(p.id) }));
                  }
                }

                if (effect.type === 'pingPlayer') {
                  const player = actionContext['$Joueur'];
                  if (player) {
                    const ids = player._isMultiple ? player._ids : [player.id];
                    nextPlayers = nextPlayers.map(p => ids.includes(p.id) ? { 
                      ...p, 
                      pingTimestamp: Date.now(), 
                      pingColor: effect.pingColor || p.color 
                    } : p);
                  }
                }
                if (effect.type === 'togglePlayerPastille') {
                  const player = actionContext['$Joueur'];
                  if (player && effect.pastilleId) {
                    const ids = player._isMultiple ? player._ids : [player.id];
                    nextPlayers = nextPlayers.map(p => {
                      if (ids.includes(p.id)) {
                        const existing = p.actionPastilles || [];
                        const hasPastille = existing.some((x: any) => x.id === effect.pastilleId);
                        let newPastilles = [...existing];
                        
                        if (effect.pastilleMode === 'remove' || (effect.pastilleMode === 'toggle' && hasPastille)) {
                          newPastilles = newPastilles.filter((x: any) => x.id !== effect.pastilleId);
                        } else if (effect.pastilleMode === 'add' || (effect.pastilleMode === 'toggle' && !hasPastille)) {
                          if (!hasPastille) {
                            newPastilles.push({
                              id: effect.pastilleId as string,
                              icon: effect.pastilleIcon || 'Shield',
                              color: effect.pastilleColor || '#ffffff'
                            });
                          } else {
                            // Update existing pastille if it was explicitly added again
                            newPastilles = newPastilles.map((x: any) => x.id === effect.pastilleId ? {
                              ...x,
                              icon: effect.pastilleIcon || 'Shield',
                              color: effect.pastilleColor || '#ffffff'
                            } : x);
                          }
                        }
                        return { ...p, actionPastilles: newPastilles };
                      }
                      return p;
                    });
                  }
                }
                if (effect.type === 'revealPlayerRole' || effect.type === 'hidePlayerRole') {
                  const player = actionContext['$Joueur'];
                  if (player) {
                    const ids = player._isMultiple ? player._ids : [player.id];
                    const isRevealed = effect.type === 'revealPlayerRole';
                    nextPlayers = nextPlayers.map(p => {
                      if (ids.includes(p.id)) {
                        return { 
                          ...p, 
                          isRoleRevealedOnBoard: isRevealed ? (effect.revealOnBoard ?? true) : false,
                          isRoleRevealedInSmartphoneRoom: isRevealed ? (effect.revealInSmartphoneRoom ?? false) : false,
                          isRoleRevealedInSmartphonePlayers: isRevealed ? (effect.revealInSmartphonePlayers ?? false) : false,
                          roleRevealPopupTriggeredAt: (isRevealed && effect.revealInSmartphoneGamePopup) ? Date.now() : p.roleRevealPopupTriggeredAt
                        };
                      }
                      return p;
                    });
                  }
                }
                if (effect.type === 'killPlayer' || effect.type === 'resurrectPlayer') {
                  const player = actionContext['$Joueur'];
                  if (player) {
                    const ids = player._isMultiple ? player._ids : [player.id];
                    const isDead = effect.type === 'killPlayer';
                    nextPlayers = nextPlayers.map(p => ids.includes(p.id) ? { ...p, isDead } : p);
                  }
                }
                if (effect.type === 'clearPlayer') {
                  const player = actionContext['$Joueur'];
                  if (player) {
                    const ids = player._isMultiple ? player._ids : [player.id];
                    nextPlayers = nextPlayers.map(p => ids.includes(p.id) ? {
                      ...p,
                      tags: [],
                      selectionPastilles: [],
                      actionPastilles: [],
                      isRoleRevealedOnBoard: false,
                      isRoleRevealedInSmartphoneRoom: false,
                      isRoleRevealedInSmartphonePlayers: false
                    } : p);
                  }
                }
                if (effect.type === 'removePlayerRole') {
                  const player = actionContext['$Joueur'];
                  if (player) {
                    const ids = player._isMultiple ? player._ids : [player.id];
                    nextPlayers = nextPlayers.map(p => ids.includes(p.id) ? { ...p, roleId: null } : p);
                  }
                }
                if (effect.type === 'swapPlayerRole') {
                  const initiator = actionContext['$Joueur'];
                  if (initiator) {
                    const initiatorIds = initiator._isMultiple ? initiator._ids : [initiator.id];
                    
                    let targetIds: string[] = [];
                    if (effect.swapTargetMode === 'role' && effect.roleId) {
                      targetIds = state.players.filter((p: any) => p.roleId === effect.roleId).map((p: any) => p.id);
                    } else if (effect.swapTargetMode === 'tag' && effect.tagId) {
                      targetIds = state.players.filter((p: any) => p.tags?.some((t: any) => t.id === effect.tagId)).map((p: any) => p.id);
                    } else if (effect.swapTargetMode === 'random') {
                      const validTargets = state.players.filter((p: any) => !p.isDead && !initiatorIds.includes(p.id));
                      if (validTargets.length > 0) {
                        const randomPlayer = validTargets[Math.floor(Math.random() * validTargets.length)];
                        targetIds = [randomPlayer.id];
                      }
                    }

                    if (targetIds.length > 0 && initiatorIds.length > 0) {
                      const idA = initiatorIds[0];
                      const idB = targetIds[0];
                      if (idA !== idB) {
                        const playerA = state.players.find((p: any) => p.id === idA);
                        const playerB = state.players.find((p: any) => p.id === idB);
                        if (playerA && playerB) {
                          const roleA = playerA.roleId;
                          const roleB = playerB.roleId;
                          nextPlayers = nextPlayers.map(p => {
                            if (p.id === idA) return { ...p, roleId: roleB };
                            if (p.id === idB) return { ...p, roleId: roleA };
                            return p;
                          });
                        }
                      }
                    }
                  }
                }
                if (effect.type === 'movePlayerToGraveyard') {
                  const player = actionContext['$Joueur'];
                  if (player) {
                    const ids = player._isMultiple ? player._ids : [player.id];
                    nextPlayers = nextPlayers.map(p => ids.includes(p.id) ? {
                      ...p,
                      x: effect.targetX || 0,
                      y: effect.targetY || 0
                    } : p);
                  }
                }
                if (effect.type === 'gatherPlayers') {
                  const alivePlayers = nextPlayers.filter(p => !p.isDead);
                  const centerX = effect.targetX || 0;
                  const centerY = effect.targetY || 0;
                  const radius = effect.gatherRadius || 150;
                  
                  nextPlayers = nextPlayers.map(p => {
                    if (p.isDead) return p;
                    const index = alivePlayers.findIndex(ap => ap.id === p.id);
                    if (index !== -1) {
                      const angle = (index / alivePlayers.length) * 2 * Math.PI;
                      return {
                        ...p,
                        x: centerX + radius * Math.cos(angle),
                        y: centerY + radius * Math.sin(angle)
                      };
                    }
                    return p;
                  });
                }
                if (effect.type === 'changePlayerShape') {
                  const player = actionContext['$Joueur'];
                  if (player && effect.targetShape) {
                    const ids = player._isMultiple ? player._ids : [player.id];
                    nextPlayers = nextPlayers.map(p => ids.includes(p.id) ? { ...p, shape: effect.targetShape } : p);
                  }
                }
                if (effect.type === 'swapPlayerTags') {
                  const initiator = actionContext['$Joueur'];
                  if (initiator) {
                    const initiatorIds = initiator._isMultiple ? initiator._ids : [initiator.id];
                    
                    let targetIds: string[] = [];
                    if (effect.swapTargetMode === 'role' && effect.roleId) {
                      targetIds = state.players.filter((p: any) => p.roleId === effect.roleId).map((p: any) => p.id);
                    } else if (effect.swapTargetMode === 'tag' && effect.tagId) {
                      targetIds = state.players.filter((p: any) => p.tags?.some((t: any) => t.id === effect.tagId)).map((p: any) => p.id);
                    } else if (effect.swapTargetMode === 'random') {
                      const validTargets = state.players.filter((p: any) => !p.isDead && !initiatorIds.includes(p.id));
                      if (validTargets.length > 0) {
                        const randomPlayer = validTargets[Math.floor(Math.random() * validTargets.length)];
                        targetIds = [randomPlayer.id];
                      }
                    }

                    if (targetIds.length > 0 && initiatorIds.length > 0) {
                      const idA = initiatorIds[0];
                      const idB = targetIds[0];
                      if (idA !== idB) {
                        const playerA = state.players.find((p: any) => p.id === idA);
                        const playerB = state.players.find((p: any) => p.id === idB);
                        if (playerA && playerB) {
                          const tagsA = playerA.tags || [];
                          const tagsB = playerB.tags || [];
                          nextPlayers = nextPlayers.map(p => {
                            if (p.id === idA) return { ...p, tags: tagsB };
                            if (p.id === idB) return { ...p, tags: tagsA };
                            return p;
                          });
                        }
                      }
                    }
                  }
                }
                if (effect.type === 'incrementTagValue') {
                  const player = actionContext['$Joueur'];
                  if (player && effect.tagId && effect.tagIncrement !== undefined) {
                    const ids = player._isMultiple ? player._ids : [player.id];
                    nextPlayers = nextPlayers.map(p => {
                      if (ids.includes(p.id)) {
                        const newTags = (p.tags || []).map((t: any) => {
                          if (t.id === effect.tagId) {
                            const currentUses = typeof t.uses === 'number' ? t.uses : (parseInt(String(t.uses)) || 0);
                            return { ...t, uses: currentUses + effect.tagIncrement! };
                          }
                          return t;
                        });
                        return { ...p, tags: newTags };
                      }
                      return p;
                    });
                  }
                }
                if (effect.type === 'spreadTag') {
                  const tagId = effect.tagId;
                  const tagModel = state.tags.find((t: any) => t.id === tagId);
                  const player = actionContext['$Joueur'];
                  if (tagModel && player && effect.spreadRadius !== undefined) {
                    const initiatorIds = player._isMultiple ? player._ids : [player.id];
                    const initiators = state.players.filter((p: any) => initiatorIds.includes(p.id));
                    
                    const targetIds = new Set<string>();
                    state.players.forEach((p: any) => {
                      if (p.isDead) return;
                      for (const init of initiators) {
                        const dx = p.x - init.x;
                        const dy = p.y - init.y;
                        if (Math.sqrt(dx * dx + dy * dy) <= effect.spreadRadius!) {
                          targetIds.add(p.id);
                          break;
                        }
                      }
                    });

                    nextPlayers = nextPlayers.map(p => {
                      if (targetIds.has(p.id)) {
                        const hasTag = p.tags?.some((t: any) => t.id === tagId);
                        if (!hasTag) {
                          const newTag = { ...tagModel, instanceId: Math.random().toString(36).substring(2, 9) };
                          return { ...p, tags: [...(p.tags || []), newTag] };
                        }
                      }
                      return p;
                    });
                  }
                }
                if (effect.type === 'clearPlayerTeam') {
                  const player = actionContext['$Joueur'];
                  if (player) {
                    const ids = player._isMultiple ? player._ids : [player.id];
                    nextPlayers = nextPlayers.map(p => ids.includes(p.id) ? { ...p, teamId: null } : p);
                  }
                }
                if (effect.type === 'joinTargetTeam') {
                  const initiator = actionContext['$Joueur'];
                  if (initiator) {
                    const initiatorIds = initiator._isMultiple ? initiator._ids : [initiator.id];
                    
                    let targetIds: string[] = [];
                    if (effect.swapTargetMode === 'role' && effect.roleId) {
                      targetIds = state.players.filter((p: any) => p.roleId === effect.roleId).map((p: any) => p.id);
                    } else if (effect.swapTargetMode === 'tag' && effect.tagId) {
                      targetIds = state.players.filter((p: any) => p.tags?.some((t: any) => t.id === effect.tagId)).map((p: any) => p.id);
                    } else if (effect.swapTargetMode === 'random') {
                      const validTargets = state.players.filter((p: any) => !p.isDead && !initiatorIds.includes(p.id));
                      if (validTargets.length > 0) {
                        const randomPlayer = validTargets[Math.floor(Math.random() * validTargets.length)];
                        targetIds = [randomPlayer.id];
                      }
                    }

                    if (targetIds.length > 0 && initiatorIds.length > 0) {
                      const idB = targetIds[0];
                      const playerB = state.players.find((p: any) => p.id === idB);
                      if (playerB) {
                        const targetTeamId = playerB.teamId;
                        nextPlayers = nextPlayers.map(p => initiatorIds.includes(p.id) ? { ...p, teamId: targetTeamId } : p);
                      }
                    }
                  }
                }
                if (effect.type === 'shuffleTeams') {
                  const teamIds = state.teams.map((t: any) => t.id);
                  if (teamIds.length > 0) {
                    nextPlayers = nextPlayers.map(p => {
                      if (!p.isDead) {
                        const randomTeamId = teamIds[Math.floor(Math.random() * teamIds.length)];
                        return { ...p, teamId: randomTeamId };
                      }
                      return p;
                    });
                  }
                }
                if (effect.type === 'setFakeRole') {
                  const player = actionContext['$Joueur'];
                  if (player) {
                    const ids = player._isMultiple ? player._ids : [player.id];
                    nextPlayers = nextPlayers.map(p => ids.includes(p.id) ? { ...p, seenAsRoleId: effect.seenAsRoleId || null } : p);
                  }
                }
                if (effect.type === 'stealRoleAndKill') {
                  const initiator = actionContext['$Joueur'];
                  if (initiator) {
                    const initiatorIds = initiator._isMultiple ? initiator._ids : [initiator.id];
                    
                    let targetIds: string[] = [];
                    if (effect.swapTargetMode === 'role' && effect.roleId) {
                      targetIds = state.players.filter((p: any) => p.roleId === effect.roleId).map((p: any) => p.id);
                    } else if (effect.swapTargetMode === 'tag' && effect.tagId) {
                      targetIds = state.players.filter((p: any) => p.tags?.some((t: any) => t.id === effect.tagId)).map((p: any) => p.id);
                    } else if (effect.swapTargetMode === 'random') {
                      const validTargets = state.players.filter((p: any) => !p.isDead && !initiatorIds.includes(p.id));
                      if (validTargets.length > 0) {
                        const randomPlayer = validTargets[Math.floor(Math.random() * validTargets.length)];
                        targetIds = [randomPlayer.id];
                      }
                    }

                    if (targetIds.length > 0 && initiatorIds.length > 0) {
                      const idB = targetIds[0];
                      const playerB = state.players.find((p: any) => p.id === idB);
                      if (playerB) {
                        const targetRoleId = playerB.roleId;
                        nextPlayers = nextPlayers.map(p => {
                          if (initiatorIds.includes(p.id)) return { ...p, roleId: targetRoleId };
                          if (p.id === idB) return { ...p, isDead: true };
                          return p;
                        });
                      }
                    }
                  }
                }
                if (effect.type === 'forceSmartphoneTab') {
                  const player = actionContext['$Joueur'];
                  if (player) {
                    const ids = player._isMultiple ? player._ids : [player.id];
                    nextPlayers = nextPlayers.map(p => ids.includes(p.id) ? { ...p, forcedTab: effect.targetTab } : p);
                  }
                }
                if (effect.type === 'vibrateSmartphone') {
                  const player = actionContext['$Joueur'];
                  if (player) {
                    const ids = player._isMultiple ? player._ids : [player.id];
                    nextPlayers = nextPlayers.map(p => ids.includes(p.id) ? { ...p, vibrationTriggeredAt: Date.now(), vibrationDuration: effect.vibrationDuration || 200 } : p);
                  }
                }
                if (effect.type === 'lockSmartphone') {
                  const player = actionContext['$Joueur'];
                  if (player) {
                    const ids = player._isMultiple ? player._ids : [player.id];
                    nextPlayers = nextPlayers.map(p => {
                      if (ids.includes(p.id)) {
                        let isLocked = p.isSmartphoneLocked || false;
                        if (effect.lockMode === 'lock') isLocked = true;
                        else if (effect.lockMode === 'unlock') isLocked = false;
                        else if (effect.lockMode === 'toggle') isLocked = !isLocked;
                        return { ...p, isSmartphoneLocked: isLocked };
                      }
                      return p;
                    });
                  }
                }
                if (effect.type === 'sendPollToSmartphone') {
                  const player = actionContext['$Joueur'];
                  if (player && effect.pollQuestion) {
                    const ids = player._isMultiple ? player._ids : [player.id];
                    const pollId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
                    nextPlayers = nextPlayers.map(p => ids.includes(p.id) ? { 
                      ...p, 
                      activePoll: { 
                        id: pollId, 
                        question: effect.pollQuestion!, 
                        options: (effect.pollOptions || ['Oui', 'Non']).filter(o => o.trim() !== '')
                      } 
                    } : p);
                  }
                }
                if (effect.type === 'blindPlayer') {
                  const player = actionContext['$Joueur'];
                  if (player) {
                    const ids = player._isMultiple ? player._ids : [player.id];
                    nextPlayers = nextPlayers.map(p => {
                      if (ids.includes(p.id)) {
                        let isBlinded = p.isBlinded || false;
                        if (effect.blindMode === 'blind') isBlinded = true;
                        else if (effect.blindMode === 'unblind') isBlinded = false;
                        else if (effect.blindMode === 'toggle') isBlinded = !isBlinded;
                        return { ...p, isBlinded };
                      }
                      return p;
                    });
                  }
                }
                if (effect.type === 'triggerAction' && effect.targetActionId) {
                  if (depth < 5) {
                    setTimeout(() => {
                      const currentState = (useVttStore.getState() as any);
                      currentState.executeAction(effect.targetActionId, actionContext, depth + 1);
                    }, 50);
                  } else {
                    state.addLog(`Action annulée : boucle infinie détectée (${action.name})`, 'system');
                  }
                }
                if (effect.type === 'assignTagToRole' && effect.tagId && effect.roleId) {
                  const tagModel = state.tags.find((t: any) => t.id === effect.tagId);
                  if (tagModel) {
                    nextPlayers = nextPlayers.map(p => {
                      if (p.roleId === effect.roleId) {
                        const newTag = { ...tagModel, instanceId: uuidv4() };
                        return { ...p, tags: [...(p.tags || []), newTag] };
                      }
                      return p;
                    });
                  }
                }
                if (effect.type === 'removeTagFromRole' && effect.tagId && effect.roleId) {
                  nextPlayers = nextPlayers.map(p => {
                    if (p.roleId === effect.roleId) {
                      return { ...p, tags: (p.tags || []).filter((t: any) => t.id !== effect.tagId) };
                    }
                    return p;
                  });
                }
                if (effect.type === 'assignTeam') {
                  const player = actionContext['$Joueur'];
                  if (player) {
                    const ids = player._isMultiple ? player._ids : [player.id];
                    if (effect.teamId !== 'unchanged' && effect.teamId !== undefined) {
                      nextPlayers = nextPlayers.map(p => ids.includes(p.id) ? { ...p, teamId: effect.teamId || null } : p);
                    }
                    if (effect.roleTeamId !== 'unchanged' && effect.roleTeamId !== undefined) {
                      const roleIdsToUpdate = nextPlayers.filter(p => ids.includes(p.id)).map(p => p.roleId).filter(id => id !== null);
                      nextRoles = nextRoles.map(r => roleIdsToUpdate.includes(r.id) ? { ...r, teamId: effect.roleTeamId || null } : r);
                    }
                  }
                }
                if (effect.type === 'assignTeamToRole' && effect.roleId) {
                  if (effect.teamId !== 'unchanged' && effect.teamId !== undefined) {
                    nextRoles = nextRoles.map(r => r.id === effect.roleId ? { ...r, teamId: effect.teamId || null } : r);
                    // Also update players who have this role
                    nextPlayers = nextPlayers.map(p => p.roleId === effect.roleId ? { ...p, teamId: effect.teamId || null } : p);
                  }
                }
                if (effect.type === 'selectPlayer') {
                  const player = actionContext['$Joueur'];
                  if (player) {
                    const ids = player._isMultiple ? player._ids : [player.id];
                    state.setSelectedEntityIds(ids);
                  }
                }
                if (effect.type === 'showHandout' && effect.handoutId) {
                  nextHandouts = nextHandouts.map(h => 
                    h.id === effect.handoutId ? { ...h, isOpen: true } : h
                  );
                }
                if (effect.type === 'selectCallOrderPlayer') {
                  const calledPlayers = state.players.filter((p: any) => {
                    const playerTags = p.tags || [];
                    const roleTags = state.roles.find((r: any) => r.id === p.roleId)?.tags || [];
                    const allTags = [...playerTags, ...roleTags];
                    return allTags.some((tag: any) => {
                      const order = (state.cycleMode === 'dayNight' && state.isNight) ? tag.callOrderNight : tag.callOrderDay;
                      return order !== null && order !== undefined && order !== '' && Number(order) === state.callOrderIndex;
                    });
                  });
                  if (calledPlayers.length > 0) {
                    state.setSelectedEntityIds(calledPlayers.map((p: any) => p.id));
                  } else {
                    state.setSelectedEntityIds([]);
                  }
                }
                if (effect.type === 'sleepPlayer') {
                  const player = actionContext['$Joueur'];
                  if (player) {
                    const ids = player._isMultiple ? player._ids : [player.id];
                    nextPlayers = nextPlayers.map(p => ids.includes(p.id) ? { ...p, isSleeping: true } : p);
                  }
                }
                if (effect.type === 'wakePlayer') {
                  const player = actionContext['$Joueur'];
                  if (player) {
                    const ids = player._isMultiple ? player._ids : [player.id];
                    nextPlayers = nextPlayers.map(p => ids.includes(p.id) ? { ...p, isSleeping: false } : p);
                  }
                }
                if (effect.type === 'switchSleepPlayer') {
                  const player = actionContext['$Joueur'];
                  if (player) {
                    const ids = player._isMultiple ? player._ids : [player.id];
                    nextPlayers = nextPlayers.map(p => ids.includes(p.id) ? { ...p, isSleeping: !p.isSleeping } : p);
                  }
                }
                if (effect.type === 'sleepAllPlayers') {
                  nextPlayers = nextPlayers.map(p => ({ ...p, isSleeping: true }));
                }
                if (effect.type === 'wakeAllPlayers') {
                  nextPlayers = nextPlayers.map(p => ({ ...p, isSleeping: false }));
                }
                if (effect.type === 'alertPlayerName') {
                  const player = actionContext['$Joueur'];
                  if (player) {
                    alert(player.name);
                  }
                }
                if ((effect.type === 'alertVariable' || effect.type === 'popupVariable') && effect.variable) {
                  let currentVal: number | string = 0;
                  const isCustom = !['$Ordre', '$Cycle', '$Jour', '$Nuit'].includes(effect.variable);
                  
                  if (effect.variable === '$Ordre') currentVal = state.callOrderIndex;
                  else if (effect.variable === '$Cycle') currentVal = state.cycleNumber;
                  else if (effect.variable === '$Jour') currentVal = !state.isNight ? state.cycleNumber : 0;
                  else if (effect.variable === '$Nuit') currentVal = state.isNight ? state.cycleNumber : 0;
                  else if (isCustom) currentVal = nextCustomVars[effect.variable] || 0;

                  if (effect.type === 'alertVariable') {
                    alert(`${effect.variable} : ${currentVal}`);
                  } else {
                    const dynamicPopup = {
                      id: `dynamic-var-${Date.now()}`,
                      title: `Information`,
                      content: `<div class="flex flex-col items-center text-center gap-4">
                        <div class="text-lg font-medium text-muted-foreground uppercase tracking-widest">${effect.variable}</div>
                        <div class="text-5xl font-black text-primary tracking-tighter">${currentVal}</div>
                      </div>`,
                      showCloseButton: true,
                      autoCloseTimer: true
                    };
                    effectUpdates.customPopups = [...(effectUpdates.customPopups || state.customPopups), dynamicPopup];
                    effectUpdates.activeCustomPopupId = dynamicPopup.id;
                  }
                }
                if (effect.type === 'incrementCallOrder') {
                  state.setCallOrderIndex(state.callOrderIndex + 1);
                }
                if (effect.type === 'decrementCallOrder') {
                  state.setCallOrderIndex(Math.max(0, state.callOrderIndex - 1));
                }
                if (effect.type === 'resetCallOrder') {
                  state.setCallOrderIndex(0);
                }
                if (effect.type === 'togglePhaseTimer') {
                  effectUpdates.timer = {
                    ...(effectUpdates.timer || state.timer),
                    isRunning: !(effectUpdates.timer || state.timer).isRunning
                  };
                }
                if (effect.type === 'setPhaseDuration') {
                  const totalSeconds = Math.max(0, effect.value || 0);
                  const minutes = Math.floor(totalSeconds / 60);
                  const seconds = totalSeconds % 60;
                  effectUpdates.timer = {
                    ...(effectUpdates.timer || state.timer),
                    minutes,
                    seconds,
                    isRunning: false
                  };
                }
                if (effect.type === 'shuffleCallOrder') {
                  const isNight = (state.cycleMode === 'dayNight' && state.isNight);
                  const tagsWithOrder = nextTags.filter((t: any) => {
                    const order = isNight ? t.callOrderNight : t.callOrderDay;
                    return order !== null && order !== undefined && order !== '';
                  });
                  
                  if (tagsWithOrder.length > 1) {
                    const orders = tagsWithOrder.map((t: any) => isNight ? t.callOrderNight : t.callOrderDay);
                    // Shuffle orders
                    for (let i = orders.length - 1; i > 0; i--) {
                      const j = Math.floor(Math.random() * (i + 1));
                      [orders[i], orders[j]] = [orders[j], orders[i]];
                    }
                    // Reassign
                    nextTags = nextTags.map((t: any) => {
                      const idx = tagsWithOrder.findIndex((ot: any) => ot.id === t.id);
                      if (idx !== -1) {
                        return isNight ? { ...t, callOrderNight: orders[idx] } : { ...t, callOrderDay: orders[idx] };
                      }
                      return t;
                    });
                  }
                }
                if (effect.type === 'reverseCallOrder') {
                  const isNight = (state.cycleMode === 'dayNight' && state.isNight);
                  const tagsWithOrder = nextTags.filter((t: any) => {
                    const order = isNight ? t.callOrderNight : t.callOrderDay;
                    return order !== null && order !== undefined && order !== '';
                  });
                  
                  if (tagsWithOrder.length > 1) {
                    const sortedOrders = tagsWithOrder.map((t: any) => Number(isNight ? t.callOrderNight : t.callOrderDay)).sort((a, b) => a - b);
                    const invertedOrders = [...sortedOrders].reverse();
                    
                    nextTags = nextTags.map((t: any) => {
                      const order = isNight ? t.callOrderNight : t.callOrderDay;
                      if (order !== null && order !== undefined && order !== '') {
                        const idx = sortedOrders.indexOf(Number(order));
                        if (idx !== -1) {
                          return isNight ? { ...t, callOrderNight: invertedOrders[idx] } : { ...t, callOrderDay: invertedOrders[idx] };
                        }
                      }
                      return t;
                    });
                  }
                }
                if (effect.type === 'sortCallOrderByStat') {
                  const isNight = (state.cycleMode === 'dayNight' && state.isNight);
                  const tagsWithOrder = nextTags.filter((t: any) => {
                    const order = isNight ? t.callOrderNight : t.callOrderDay;
                    return order !== null && order !== undefined && order !== '';
                  });
                  
                  if (tagsWithOrder.length > 1) {
                    const sortedOrders = tagsWithOrder.map((t: any) => Number(isNight ? t.callOrderNight : t.callOrderDay)).sort((a, b) => a - b);
                    
                    const statName = effect.variable || 'lives';
                    const direction = effect.operator === 'desc' ? -1 : 1;
                    
                    const tagStats = tagsWithOrder.map((t: any) => {
                      let statSum = 0;
                      nextPlayers.forEach((p: any) => {
                        const hasTagLocally = p.tags && p.tags.some((pt: any) => pt.id === t.id);
                        const role = nextRoles.find((r: any) => r.id === p.roleId);
                        const hasTagViaRole = role && role.tags && role.tags.some((rt: any) => rt.id === t.id);
                        if (hasTagLocally || hasTagViaRole) {
                          statSum += Number(p[statName] || 0);
                        }
                      });
                      return { tagId: t.id, statSum };
                    });
                    
                    tagStats.sort((a, b) => (a.statSum - b.statSum) * direction);
                    
                    nextTags = nextTags.map((t: any) => {
                      const idx = tagStats.findIndex((ts: any) => ts.tagId === t.id);
                      if (idx !== -1) {
                        return isNight ? { ...t, callOrderNight: sortedOrders[idx] } : { ...t, callOrderDay: sortedOrders[idx] };
                      }
                      return t;
                    });
                  }
                }
                if (effect.type === 'distributeRoles') {
                  const rolesToDistribute = state.roles.filter((r: any) => r.isSelectableForDistribution);
                  if (rolesToDistribute.length > 0) {
                    let rolePool: { id: string, teamId: string | null }[] = [];
                    rolesToDistribute.forEach((role: any) => {
                      const qty = role.isUnique ? 1 : (role.distributionQuantity || 1);
                      for (let i = 0; i < qty; i++) { 
                        rolePool.push({ id: role.id, teamId: role.teamId }); 
                      }
                    });
                    for (let i = rolePool.length - 1; i > 0; i--) {
                      const j = Math.floor(Math.random() * (i + 1));
                      [rolePool[i], rolePool[j]] = [rolePool[j], rolePool[i]];
                    }
                    nextPlayers = nextPlayers.map((player, idx) => {
                      if (idx < rolePool.length) {
                        return { 
                          ...player, 
                          roleId: rolePool[idx].id, 
                          teamId: rolePool[idx].teamId 
                        };
                      }
                      return player;
                    });
                  }
                }
                if (effect.type === 'popupPlayer') {
                  const player = actionContext['$Joueur'];
                  if (player) {
                    const role = state.roles.find((r: any) => r.id === player.roleId);
                    const playerName = player.name;
                    const roleName = role?.name || 'Sans Rôle';
                    const imageUrl = role?.imageUrl || player.imageUrl || '';
                    
                    const dynamicPopup = {
                      id: `dynamic-joueur-${Date.now()}`,
                      title: `Résultat : ${playerName}`,
                      content: `<div class="flex flex-col items-center text-center gap-4">
                        <div class="text-lg">Le joueur <strong>${playerName}</strong> est :</div>
                        <div class="text-3xl font-black text-primary uppercase tracking-tighter">${roleName}</div>
                      </div>`,
                      imageUrl: imageUrl,
                      showCloseButton: true,
                      autoCloseTimer: true
                    };
                    
                    effectUpdates.customPopups = [...(effectUpdates.customPopups || state.customPopups), dynamicPopup];
                    effectUpdates.activeCustomPopupId = dynamicPopup.id;
                  }
                }
                if (effect.type === 'sendPrivateMessage' && effect.privateMessage) {
                  const player = actionContext['$Joueur'];
                  if (player) {
                    let message = effect.privateMessage;
                    if (message.includes('$Rôle') || message.includes('$Role')) {
                      const roleNames = player._isMultiple
                        ? player._ids.map((id: string) => {
                            const p = state.players.find((p: any) => p.id === id);
                            const r = state.roles.find((r: any) => r.id === p?.roleId);
                            return r ? r.name : 'Inconnu';
                          }).filter(Boolean).join(', ')
                        : (state.roles.find((r: any) => r.id === player.roleId)?.name || 'Inconnu');
                      message = message.replace(/\$R[oô]le/g, roleNames);
                    }
                    const playerNames = player._isMultiple 
                      ? player._ids.map((id: string) => state.players.find((p: any) => p.id === id)?.name).filter(Boolean).join(',')
                      : player.name;
                    effectUpdates.smartphoneActionMessage = { playerName: playerNames, message: message };
                  }
                }
                if (effect.type === 'addSystemLog' && effect.logMessage) {
                  let message = effect.logMessage;
                  const player = actionContext['$Joueur'];
                  if (player) {
                    if (message.includes('$Joueur')) {
                      const playerNames = player._isMultiple 
                        ? player._ids.map((id: string) => state.players.find((p: any) => p.id === id)?.name).filter(Boolean).join(', ')
                        : player.name;
                      message = message.replace(/\$Joueur/g, playerNames);
                    }
                    if (message.includes('$Rôle') || message.includes('$Role')) {
                      const roleNames = player._isMultiple
                        ? player._ids.map((id: string) => {
                            const p = state.players.find((p: any) => p.id === id);
                            const r = state.roles.find((r: any) => r.id === p?.roleId);
                            return r ? r.name : 'Inconnu';
                          }).filter(Boolean).join(', ')
                        : (state.roles.find((r: any) => r.id === player.roleId)?.name || 'Inconnu');
                      message = message.replace(/\$R[oô]le/g, roleNames);
                    }
                  }
                  state.addLog(message, 'system');
                }
                if (effect.type === 'playSound' && effect.soundName) {
                  const sound = state.soundboard.buttons.find((b: any) => b.name === effect.soundName);
                  if (sound && sound.audioUrl) {
                    const audio = new Audio(sound.audioUrl);
                    audio.volume = sound.volume !== undefined ? sound.volume : 0.5;
                    audio.play().catch(e => console.error("Error playing action sound:", e));
                  }
                }
                if (effect.type === 'modifyVariable' && effect.variable) {
                  let currentVal = 0;
                  const isCustom = !['$Ordre', '$Cycle', '$Jour', '$Nuit'].includes(effect.variable);
                  
                  if (effect.variable === '$Ordre') currentVal = state.callOrderIndex;
                  else if (effect.variable === '$Cycle') currentVal = state.cycleNumber;
                  else if (effect.variable === '$Jour') currentVal = !state.isNight ? state.cycleNumber : 0;
                  else if (effect.variable === '$Nuit') currentVal = state.isNight ? state.cycleNumber : 0;
                  else if (isCustom) currentVal = nextCustomVars[effect.variable] || 0;
                  
                  let nextVal = currentVal;
                  const val = effect.value || 0;
                  if (effect.operator === '=') nextVal = val;
                  else if (effect.operator === '+') nextVal = currentVal + val;
                  else if (effect.operator === '-') nextVal = currentVal - val;
                  else if (effect.operator === '*') nextVal = Math.round(currentVal * val);
                  else if (effect.operator === '/') nextVal = val !== 0 ? Math.floor(currentVal / val) : currentVal;
                  
                  if (effect.variable === '$Ordre') {
                    state.setCallOrderIndex(Math.max(0, nextVal));
                  } else if (effect.variable === '$Cycle' || effect.variable === '$Jour' || effect.variable === '$Nuit') {
                    effectUpdates.cycleNumber = Math.max(0, nextVal);
                  } else if (isCustom) {
                    nextCustomVars[effect.variable] = nextVal;
                  }
                }
              }

              const newState: any = { 
                ...effectUpdates,
                markers: nextMarkers, 
                players: nextPlayers, 
                roles: nextRoles,
                tags: nextTags,
                customVariables: nextCustomVars,
                displaySettings: nextDisplaySettings,
                cycleMode: nextCycleMode,
                handouts: nextHandouts,
                room: nextRoom
              };
              if (resetValue !== null) {
                newState.isNight = effectUpdates.isNight !== undefined ? effectUpdates.isNight : false;
                newState.cycleNumber = resetValue;
              } else if (phaseShift !== 0) {
                let currentIsNight = state.isNight, currentCycle = state.cycleNumber;
                const absoluteShift = Math.abs(phaseShift), direction = phaseShift > 0 ? 1 : -1;
                for (let i = 0; i < absoluteShift; i++) {
                  if (direction === 1) {
                    const goingToDay = currentIsNight;
                    currentIsNight = !currentIsNight;
                    if (goingToDay) currentCycle++;
                  } else {
                    const goingToNight = !currentIsNight;
                    if (goingToNight && currentCycle <= 0) break;
                    currentIsNight = !currentIsNight;
                    if (goingToNight) currentCycle--;
                  }
                }
                newState.isNight = currentIsNight;
                newState.cycleNumber = currentCycle;
              }
              
              newState.actions = state.actions.map((a: any) => {
                if (a.id === id) {
                  return { 
                    ...a, 
                    currentRepeatExecution: hasWait ? a.currentRepeatExecution : (remaining > 1 ? remaining - 1 : 0),
                    enabled: (!hasWait && action.once && remaining === 1) ? false : a.enabled,
                    isExecuted: (!hasWait && action.once && remaining === 1) ? true : a.isExecuted
                  };
                }
                return a;
              });
              
              if (hasWait) {
                const waitEffect = effectsToRun[currentEffectIndex];
                setTimeout(() => {
                  if (waitEffect.showCountdown) {
                    state.setSmartphoneCountdown(null);
                  }
                  run(remaining, currentEffectIndex + 1);
                }, waitTime * 1000);
              } else if (remaining > 1) {
                setTimeout(() => run(remaining - 1, 0), (action.intervalSeconds || 5) * 1000);
              } else {
                newState.activeActionId = null;
              }
              
              return newState;
            });
          };

          const initialAction = (get() as any).actions.find((a: any) => a.id === id);
          if (!initialAction) return;

          // Cancellation logic: if already executing, stop it
          if (initialAction.currentRepeatExecution && initialAction.currentRepeatExecution > 0) {
            set((state: any) => ({
              actions: state.actions.map((a: any) => a.id === id ? { ...a, currentRepeatExecution: 0 } : a)
            }));
            return;
          }

          const startExecution = () => {
            if (initialAction.isRecurring) {
              set((state: any) => ({
                actions: state.actions.map((a: any) => a.id === id ? { ...a, currentRepeatExecution: initialAction.repeatCount || 2 } : a)
              }));
              run(initialAction.repeatCount || 2);
            } else {
              run(1);
            }
          };

          if (initialAction.delaySeconds && initialAction.delaySeconds > 0) {
            setTimeout(startExecution, initialAction.delaySeconds * 1000);
          } else {
            startExecution();
          }
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
        clearMagneticPoints: () => set({ magneticPoints: [] }),
        setShowMagneticPoints: (show) => set({ showMagneticPoints: show }),
        setIsMagneticEnabled: (enabled) => set({ isMagneticEnabled: enabled }),
        snapPlayersToPoints: () => set((state) => {
          const alivePlayers = state.players.filter(p => !p.isDead);
          const points = [...state.magneticPoints].sort((a, b) => a.order - b.order);
          
          if (points.length === 0 || alivePlayers.length === 0) return state;

          const playerUpdates: { id: string, updates: Partial<Player> }[] = [];
          const snapMode = state.displaySettings.magneticPointsSnapMode || 'nearest';

          if (snapMode === 'order') {
            points.forEach((point, idx) => {
              if (alivePlayers[idx]) {
                playerUpdates.push({ id: alivePlayers[idx].id, updates: { x: point.x, y: point.y } });
              }
            });
          } else {
            const remainingPlayers = [...alivePlayers];
          
          // For each point, find the closest available player
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
                playerUpdates.push({ id: player.id, updates: { x: point.x, y: point.y } });
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
        }),
        limit: 50, // Keep last 50 states to prevent memory issues
        equality: (pastState, currentState) => {
          return pastState.players === currentState.players &&
                 pastState.markers === currentState.markers &&
                 pastState.isNight === currentState.isNight &&
                 pastState.cycleNumber === currentState.cycleNumber;
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
