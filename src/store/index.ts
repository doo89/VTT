import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { temporal } from 'zundo';
import type { GameState, EntityId, Player, Role, TagModel, TagCategory, Marker, Team, Handout } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface PlayerTemplate {
  id: EntityId;
  color: string;
  name: string;
  roleId: EntityId | null;
  teamId: EntityId | null;
  size: number;
  imageUrl?: string;
}

interface VttStore extends GameState {
  setCycleMode: (mode: GameState['cycleMode']) => void;
  setTimer: (timerUpdate: Partial<GameState['timer']>) => void;
  setSoundboard: (soundboardUpdate: Partial<GameState['soundboard']>) => void;
  updateSoundButton: (index: number, updates: Partial<GameState['soundboard']['buttons'][0]>) => void;
  removeSoundButton: (index: number) => void;
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

  // Game Logic
  setNight: (isNight: boolean) => void;
  nextCycle: () => void;
  resetCycle: () => void;

  // Settings
  updateDisplaySettings: (updates: Partial<GameState['displaySettings']>) => void;

  // Colors
  addRecentColor: (color: string) => void;
}

const initialState = {
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
  recentColors: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff', '#000000', '#6b7280'], // default colors
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
  },
  activeLeftTab: 'players' as const,
  editingEntity: null,
  canvas: {
    panX: 0,
    panY: 0,
    zoom: 1,
  },
  grid: {
    enabled: false,
    sizeX: 50,
    sizeY: 50,
  },
  room: {
    width: 2000,
    height: 1500,
    backgroundColor: '#ffffff',
    backgroundImage: null,
    backgroundStyle: 'mosaic' as const,
  },
  displaySettings: {
    showTooltip: true,
    showRole: true,
    showTeam: true,
    showTags: true,
    showPlayers: true,
    showCenter: true,
    showCycleIcon: true,
    foregroundElement: 'players' as const,
    showPlayerImage: true,
    showRoleImage: true,
    imagePriority: 'player' as const,
    playerNamePosition: 'bottom' as const,
    playerBadges: {
      topLeft: { type: 'team' as const, bgColor: '#000000', textColor: '#ffffff' },
      topRight: { type: 'lives' as const, bgColor: '#ef4444', textColor: '#ffffff' },
      bottomLeft: { type: 'none' as const, bgColor: '#3b82f6', textColor: '#ffffff' },
      bottomRight: { type: 'none' as const, bgColor: '#10b981', textColor: '#ffffff' },
    },
  },
  isLeftPanelOpen: true,
  isRightPanelOpen: true,
};

export const useVttStore = create<VttStore>()(
  persist(
    temporal(
      (set) => ({
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
  addPlayer: (playerData) => set((state) => ({
    players: [...state.players, { ...playerData, id: uuidv4() }]
  })),
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
    tags: state.tags.map(t => t.id === id ? { ...t, ...updates } : t)
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
    if (state.isNight) {
      return { isNight: false, cycleNumber: state.cycleNumber + 1 };
    } else {
      return { isNight: true };
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
      }),
      {
        partialize: (state) => ({
          players: state.players,
          markers: state.markers,
          isNight: state.isNight,
          cycleNumber: state.cycleNumber,
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