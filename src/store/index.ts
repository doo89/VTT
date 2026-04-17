import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { temporal } from 'zundo';
import type { GameState, EntityId, Player, Role, TagModel, TagCategory, Marker, Team, Handout, PlayerTemplate, LogEvent, CustomPopup, ChecklistItem, Action, ActionCreatorState, ActionCondition, ActionConditionCreatorState, ActionEffect, ActionEffectCreatorState } from '../types';
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
  executeAction: (id: string) => void;
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
  setPendingRecurring: (recurring: boolean, interval: number, count: number) => void;
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
  // Custom Popups
  addCustomPopup: (popup: Omit<CustomPopup, 'id'>) => void;
  updateCustomPopup: (id: string, updates: Partial<CustomPopup>) => void;
  deleteCustomPopup: (id: string) => void;
  triggerCustomPopup: (id: string | null) => void;

  // Logs
  addLog: (message: string, type: LogEvent['type']) => void;
  clearLogs: () => void;

  // Checklist
  setChecklist: (checklist: ChecklistItem[] | ((prev: ChecklistItem[]) => ChecklistItem[])) => void;
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
  tagCategories: [],
  handouts: [],
  logs: [],
  recentColors: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff', '#000000', '#6b7280'], // default colors
  customPopups: [],
  activeCustomPopupId: null,
  checklist: [],
  isNight: false,
  cycleNumber: 1,
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
  soundboard: {
    cols: 4,
    rows: 3,
    isDetached: false,
    x: 200,
    y: 200,
    buttons: [],
    remoteEnabled: false,
    remotePasscode: '1234',
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
  activeLeftTab: 'players' as const,
  editingEntity: null,
  smartphoneActionMessage: null,
  canvas: {
    panX: 0,
    panY: 0,
    zoom: 1,
  },
  grid: {
    enabled: true,
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
      soundboard: false,
      scoreboard: false,
      logs: false,
      system: false,
      wiki: false,
      popupCreator: false,
      checklist: false,
      tagDistributor: true,
    },
    recordLogs: false,
    smartphoneTabs: {
      game: true,
      players: false,
      room: false,
      wiki: false,
    },
    smartphonePlayersOptions: {
      allowPrivateNotes: true,
      showDeadPlayers: true,
      includeSelf: true,
      allowNotesForDeadPlayers: true,
      showNotePreview: true,
    },
    wikiTitle: 'Régles du jeu',
    wikiLightMode: true,
    showWikiNotes: true,
    showWikiRoles: true,
    showWikiTags: true,
    wikiOnlySelectedRoles: false,
    wikiOnlyInPlayRoles: false,
    smartphoneImageBlur: 20,
    smartphoneImageMinHeight: 400,
    roomMiniatureAnimation: true,
    roomMiniatureDeadIconUrl: null,
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
  },
  isLeftPanelOpen: true,
  isRightPanelOpen: true,
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
  setOnlinePlayers: (ids) => set({ onlinePlayerIds: ids }),

  setPan: (x, y) => set((state) => ({ canvas: { ...state.canvas, panX: x, panY: y } })),
  setZoom: (zoom) => set((state) => ({ canvas: { ...state.canvas, zoom } })),
  setCycleMode: (mode) => set({ cycleMode: mode }),
  setActiveLeftTab: (tab) => set({ activeLeftTab: tab }),
  setEditingEntity: (entity) => set({ editingEntity: entity }),
  toggleLeftPanel: () => set((state) => ({ isLeftPanelOpen: !state.isLeftPanelOpen })),
  toggleRightPanel: () => set((state) => ({ isRightPanelOpen: !state.isRightPanelOpen })),

  // Tools
  setGrid: (grid) => set({ grid }),
  setRoom: (roomUpdates) => set((state) => ({ room: { ...state.room, ...roomUpdates } })),
  setTimer: (timerUpdates) => set((state) => ({ timer: { ...state.timer, ...timerUpdates } })),
  setSoundboard: (soundboardUpdates) => set((state) => ({ soundboard: { ...state.soundboard, ...soundboardUpdates } })),
  setScoreboard: (update) => set((state) => ({ scoreboard: { ...state.scoreboard, ...update } })),
  setWiki: (update) => set((state) => ({ wiki: { ...state.wiki, ...update } })),
  setChecklistState: (update) => set((state) => ({ checklistState: { ...state.checklistState, ...update } })),
  setTagDistributorState: (update) => set((state) => ({ tagDistributorState: { ...state.tagDistributorState, ...update } })),
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
    const maxOrder = state.players.reduce((max, p) => Math.max(max, p.creationOrder || 0), 0);
    return {
      players: [...state.players, { 
        points: undefined,
        votes: undefined,
        lives: undefined,
        ...playerData, 
        id: uuidv4(),
        creationOrder: maxOrder + 1
      }]
    };
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
  deletePlayer: (id) => set((state) => ({
    players: state.players.filter(p => p.id !== id)
  })),
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

        // Smartphone action message
        setSmartphoneActionMessage: (message) => set({ smartphoneActionMessage: message }),

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
        })),        executeAction: (id) => {
          const run = (remaining: number) => {
            set((state: any) => {
              const action = state.actions.find((a: any) => a.id === id);
              if (!action) return {};
              
              if (action.once && action.isExecuted) {
                state.addLog(`Action "${action.name}" déjà exécutée (Action unique)`, 'system');
                return {};
              }
              
              // Evaluate conditions
              const evaluate = (conditions: ActionCondition[]): { success: boolean, failReason?: string } => {
                const activeConditions = (conditions || []).filter(c => c.enabled);
                if (activeConditions.length === 0) return { success: true };

                const checkSingle = (c: ActionCondition): boolean => {
                  if (c.type === 'playerRole') {
                    const player = state.players.find((p: any) => (p.creationOrder || 0) === c.value) 
                                   || state.players[c.value - 1];
                    if (!player) return false;
                    if (c.operator === '=') return player.roleId === c.roleId;
                    if (c.operator === '!=') return player.roleId !== c.roleId;
                    return false;
                  }
                  if (c.type === 'playerTag') {
                    const player = state.players.find((p: any) => (p.creationOrder || 0) === c.value) 
                                   || state.players[c.value - 1];
                    if (!player) return false;
                    const hasTag = player.tags.some((t: any) => t.id === c.tagId);
                    if (c.operator === '=') return hasTag;
                    if (c.operator === '!=') return !hasTag;
                    return false;
                  }
                  if (c.type === 'playerPastille') {
                    const player = state.players.find((p: any) => (p.creationOrder || 0) === c.value) 
                                   || state.players[c.value - 1];
                    if (!player) return false;
                    const hasPastille = (player.selectionPastilles || []).some((p: any) => p.icon === c.pastilleIcon);
                    if (c.operator === '=') return hasPastille;
                    if (c.operator === '!=') return !hasPastille;
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
                  const typeLabel = c.type === 'day' ? 'Jour' : c.type === 'night' ? 'Nuit' : 'Tour';
                  return `${typeLabel} ${c.operator} ${c.value}`;
                };

                let result = checkSingle(activeConditions[0]);
                let firstFail = result ? '' : getConditionLabel(activeConditions[0]);

                for (let i = 1; i < activeConditions.length; i++) {
                  const c = activeConditions[i];
                  const currentResult = checkSingle(c);
                  if (c.logic === 'OR') {
                    result = result || currentResult;
                    if (!result) firstFail = `${firstFail} OU ${getConditionLabel(c)}`;
                  } else {
                    result = result && currentResult;
                    if (!result && !firstFail) firstFail = getConditionLabel(c);
                  }
                }
                return { success: result, failReason: result ? undefined : firstFail };
              };

              const evaluation = evaluate(action.conditions || []);
              if (!evaluation.success) {
                state.addLog(`Action "${action.name}" annulée : condition non remplie (${evaluation.failReason})`, 'system');
                return {};
              }
              
              let nextMarkers = [...state.markers];
              let nextPlayers = [...state.players];
              let phaseShift = 0;
              let resetValue: number | null = null;
              let nextDisplaySettings = { ...state.displaySettings };
              
              action.effects?.forEach((effect: any) => {
                if (!effect.enabled) return;
                if (effect.type === 'deleteAllTags') nextMarkers = [];
                if (effect.type === 'nextPhase') phaseShift++;
                if (effect.type === 'previousPhase') phaseShift--;
                if (effect.type === 'resetCycle') { resetValue = 1; phaseShift = 0; }
                if (effect.type === 'resetCycleZero') { resetValue = 0; phaseShift = 0; }
                if (effect.type === 'deleteSelectionPastilles') nextPlayers = nextPlayers.map(p => ({ ...p, selectionPastilles: [] }));
                if (effect.type === 'deleteAllPlayerTags') nextPlayers = nextPlayers.map(p => ({ ...p, tags: [] }));
                if (effect.type === 'showPlayerImage') nextDisplaySettings.showPlayerImage = true;
                if (effect.type === 'hidePlayerImage') nextDisplaySettings.showPlayerImage = false;
                if (effect.type === 'showRoleImage') nextDisplaySettings.showRoleImage = true;
                if (effect.type === 'hideRoleImage') nextDisplaySettings.showRoleImage = false;
                if (effect.type === 'distributeRoles') {
                  const rolesToDistribute = state.roles.filter((r: any) => r.isSelectableForDistribution);
                  if (rolesToDistribute.length > 0) {
                    let rolePool: string[] = [];
                    rolesToDistribute.forEach((role: any) => {
                      const qty = role.distributionQuantity || 1;
                      for (let i = 0; i < qty; i++) { rolePool.push(role.id); }
                    });
                    for (let i = rolePool.length - 1; i > 0; i--) {
                      const j = Math.floor(Math.random() * (i + 1));
                      [rolePool[i], rolePool[j]] = [rolePool[j], rolePool[i]];
                    }
                    nextPlayers = nextPlayers.map((player, idx) => {
                      if (idx < rolePool.length) return { ...player, roleId: rolePool[idx] };
                      return player;
                    });
                  }
                }
              });
              
              const newState: any = { markers: nextMarkers, players: nextPlayers, displaySettings: nextDisplaySettings };
              if (resetValue !== null) {
                newState.isNight = false;
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
              
              if (action.once) {
                newState.actions = state.actions.map((a: any) => a.id === id ? { ...a, isExecuted: true } : a);
              }
              
              if (remaining > 1) {
                setTimeout(() => run(remaining - 1), (action.intervalSeconds || 5) * 1000);
              }
              
              return newState;
            });
          };

          const initialAction = (get() as any).actions.find((a: any) => a.id === id);
          if (initialAction?.isRecurring) {
            run(initialAction.repeatCount || 2);
          } else {
            run(1);
          }
        },
        setActionConditionCreatorState: (update) => set((state) => ({ 
          actionConditionCreatorState: { ...state.actionConditionCreatorState, ...update } 
        })),
        addPendingCondition: (conditionData) => set((state) => ({
          pendingActionConditions: [...state.pendingActionConditions, { ...conditionData, id: uuidv4() }]
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
          pendingActionRepeatCount: 2
        }),
        setPendingOnce: (once) => set({ pendingActionOnce: once }),
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
          scoreboard: state.scoreboard,
          wiki: state.wiki,
          checklist: state.checklist,
          checklistState: state.checklistState,
          tagDistributorState: state.tagDistributorState,
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
      // Optional: you can ignore certain fields from being persisted if needed.
      // But for temporal, we configure that separately.
    }
  )
);