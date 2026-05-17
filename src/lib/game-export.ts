/**
 * Game Export/Import System
 * 
 * Allows GMs to export and import game sessions
 * Useful for backup, sharing, or migrating between devices
 */

import type { GameState } from '../types';
import { useVttStore } from '../store';

export interface ExportData {
  version: string;
  exportedAt: string;
  roomName: string;
  roomCode: string | null;
  state: Partial<GameState>;
}

/**
 * Export current game state to JSON file
 */
export function exportGame(): string {
  const state = useVttStore.getState();
  
  const exportData: ExportData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    roomName: state.roomName,
    roomCode: state.roomCode,
    state: {
      players: state.players,
      roles: state.roles,
      teams: state.teams,
      tags: state.tags,
      tagCategories: state.tagCategories,
      markers: state.markers,
      handouts: state.handouts,
      actions: state.actions,
      checklist: state.checklist,
      wiki: state.wiki,
      soundboard: state.soundboard,
      timer: state.timer,
      displaySettings: state.displaySettings,
      room: state.room,
      grid: state.grid,
      isNight: state.isNight,
      cycleNumber: state.cycleNumber,
      cycleMode: state.cycleMode,
      callOrderIndex: state.callOrderIndex,
      customVariables: state.customVariables,
      magneticPoints: state.magneticPoints,
      logs: state.logs,
    },
  };

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `vtt-${state.roomName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return exportData.exportedAt;
}

/**
 * Import game state from JSON file
 */
export async function importGame(file: File): Promise<{ success: boolean; error?: string }> {
  try {
    const text = await file.text();
    const data: ExportData = JSON.parse(text);

    // Validate export data
    if (!data.version || !data.state) {
      return { success: false, error: 'Invalid export file format' };
    }

    // Confirm with user before importing
    const confirmed = window.confirm(
      `Import game "${data.roomName}"?\nExported: ${new Date(data.exportedAt).toLocaleString()}\n\nThis will replace your current game state.`
    );

    if (!confirmed) {
      return { success: false, error: 'Import cancelled' };
    }

    // Apply imported state
    const store = useVttStore.getState();
    const importedState = data.state;

    // Update store with imported data
    if (importedState.players) store.players = importedState.players;
    if (importedState.roles) store.roles = importedState.roles;
    if (importedState.teams) store.teams = importedState.teams;
    if (importedState.tags) store.tags = importedState.tags;
    if (importedState.tagCategories) store.tagCategories = importedState.tagCategories;
    if (importedState.markers) store.markers = importedState.markers;
    if (importedState.handouts) store.handouts = importedState.handouts;
    if (importedState.actions) store.actions = importedState.actions;
    if (importedState.checklist) store.checklist = importedState.checklist;
    if (importedState.wiki) store.wiki = importedState.wiki;
    if (importedState.soundboard) store.soundboard = importedState.soundboard;
    if (importedState.timer) store.timer = importedState.timer;
    if (importedState.displaySettings) store.displaySettings = importedState.displaySettings;
    if (importedState.room) store.room = importedState.room;
    if (importedState.grid) store.grid = importedState.grid;
    if (importedState.isNight !== undefined) store.isNight = importedState.isNight;
    if (importedState.cycleNumber) store.cycleNumber = importedState.cycleNumber;
    if (importedState.cycleMode) store.cycleMode = importedState.cycleMode;
    if (importedState.callOrderIndex !== undefined) store.callOrderIndex = importedState.callOrderIndex;
    if (importedState.customVariables) store.customVariables = importedState.customVariables;
    if (importedState.magneticPoints) store.magneticPoints = importedState.magneticPoints;
    if (importedState.logs) store.logs = importedState.logs;

    // Force re-render
    useVttStore.setState({ ...useVttStore.getState() });

    return { success: true };
  } catch (error) {
    console.error('Import failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Import failed' };
  }
}

/**
 * Create a file input and trigger import
 */
export function triggerImport(): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve({ success: false, error: 'No file selected' });
        return;
      }
      
      const result = await importGame(file);
      resolve(result);
    };

    input.click();
  });
}

/**
 * Export logs only
 */
export function exportLogs(): void {
  const state = useVttStore.getState();
  
  if (state.logs.length === 0) {
    alert('No logs to export');
    return;
  }

  const json = JSON.stringify(state.logs, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `vtt-logs-${state.roomName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export players list as CSV
 */
export function exportPlayersCSV(): void {
  const state = useVttStore.getState();
  
  if (state.players.length === 0) {
    alert('No players to export');
    return;
  }

  const headers = ['Name', 'Role', 'Team', 'Alive', 'X', 'Y', 'Notes'];
  const rows = state.players.map(p => {
    const role = state.roles.find(r => r.id === p.roleId)?.name || '';
    const team = state.teams.find(t => t.id === p.teamId)?.name || '';
    return [
      p.name,
      role,
      team,
      p.isDead ? 'No' : 'Yes',
      p.x,
      p.y,
      p.privateNotes || '',
    ].map(v => `"${v}"`).join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `vtt-players-${state.roomName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
