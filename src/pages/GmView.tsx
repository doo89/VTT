import React, { useState, useMemo } from 'react';
import { LeftPanel } from '../components/layout/LeftPanel';
import { RightPanel } from '../components/layout/RightPanel';
import { Canvas } from '../components/layout/Canvas';
import { EditingModal } from '../components/EditingModal';
import { HandoutWindow } from '../components/HandoutWindow';
import { DetachedTimer } from '../components/DetachedTimer';
import { DetachedSoundboard } from '../components/DetachedSoundboard';
import { ScoreboardWindow } from '../components/ScoreboardWindow';
import { WikiWindow } from '../components/WikiWindow';
import { ChecklistWindow } from '../components/ChecklistWindow';
import { TagDistributorWindow } from '../components/TagDistributorWindow';
import { ActionCreatorWindow } from '../components/ActionCreatorWindow';
import { ActionConditionWindow } from '../components/ActionConditionWindow';
import { ActionEffectWindow } from '../components/ActionEffectWindow';
import { RoleSelectorWindow } from '../components/RoleSelectorWindow';
import { useVttStore, selectPlayers, selectSelectedEntityIds } from '../store';
import { setupHostRealtimeSubscription, cleanupHostRealtime } from '../lib/realtime-host';
import { X, MessageSquareWarning, Keyboard } from 'lucide-react';
import { useKeyboardShortcuts, KeyboardShortcutsHelp } from '../hooks/useKeyboardShortcuts.tsx';
import type { Shortcut } from '../hooks/useKeyboardShortcuts.tsx';
import { useToast } from '../components/Toast';
import { exportGame, triggerImport, exportLogs, exportPlayersCSV } from '../lib/game-export';

export const GmView: React.FC = () => {
  const { isNight, editingEntity, handouts, smartphoneActionMessage, setSmartphoneActionMessage, toggleLeftPanel, toggleRightPanel, nextCycle, setNight, setSelectedEntityIds, clearSelection, setGrid, setPan, setZoom, grid, canvas, deletePlayer } = useVttStore();
  const players = useVttStore(selectPlayers);
  const selectedEntityIds = useVttStore(selectSelectedEntityIds);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const toast = useToast();

  React.useEffect(() => {
    const unsubscribe = setupHostRealtimeSubscription();
    return () => {
      cleanupHostRealtime();
      unsubscribe();
    };
  }, []);

  // Define actions for shortcuts
  const actions = useMemo(() => ({
    toggleLeftPanel: () => {
      toggleLeftPanel();
      toast.info('Panneau gauche masqué/affiché');
    },
    toggleRightPanel: () => {
      toggleRightPanel();
      toast.info('Panneau droit masqué/affiché');
    },
    nextCycle: () => {
      nextCycle();
    },
    toggleNight: () => {
      setNight(!isNight);
      toast.info(isNight ? 'Mode jour activé' : 'Mode nuit activé');
    },
    startTimer: () => {
      useVttStore.setState(s => ({ timer: { ...s.timer, isRunning: !s.timer.isRunning } }));
    },
    resetTimer: () => {
      useVttStore.setState(s => ({ timer: { ...s.timer, isRunning: false, minutes: s.displaySettings.timerDefaultMinutes || 5, seconds: s.displaySettings.timerDefaultSeconds || 0 } }));
      toast.info('Timer réinitialisé');
    },
    selectAllPlayers: () => {
      setSelectedEntityIds(players.map(p => p.id));
      toast.info(`${players.length} joueur(s) sélectionné(s)`);
    },
    clearSelection: () => {
      clearSelection();
    },
    toggleGrid: () => {
      setGrid({ ...grid, show: !grid.show });
      toast.info(grid.show ? 'Grille masquée' : 'Grille affichée');
    },
    resetView: () => {
      setPan(0, 0);
      setZoom(1);
      toast.info('Vue réinitialisée');
    },
    openSettings: () => {
      setShowShortcutsHelp(true);
    },
    saveGame: () => {
      toast.success('Partie sauvegardée (localStorage)');
    },
    exportGame: async () => {
      const exportedAt = exportGame();
      toast.success(`Partie exportée à ${new Date(exportedAt).toLocaleTimeString()}`);
    },
    importGame: async () => {
      const result = await triggerImport();
      if (result.success) {
        toast.success('Partie importée avec succès');
      } else {
        toast.error(result.error || 'Échec de l\'import');
      }
    },
    exportLogs: () => {
      exportLogs();
      toast.success('Logs exportés');
    },
    exportPlayersCSV: () => {
      exportPlayersCSV();
      toast.success('Joueurs exportés en CSV');
    },
    deleteSelectedPlayers: () => {
      if (selectedEntityIds.length === 0) {
        toast.info('Aucun joueur sélectionné');
        return;
      }
      if (window.confirm(`Supprimer ${selectedEntityIds.length} joueur(s) sélectionné(s) ?`)) {
        selectedEntityIds.forEach(id => deletePlayer(id));
        clearSelection();
        toast.success(`${selectedEntityIds.length} joueur(s) supprimé(s)`);
      }
    },
  }), [isNight, players, grid, toggleLeftPanel, toggleRightPanel, nextCycle, setNight, setSelectedEntityIds, clearSelection, setGrid, setPan, setZoom, toast, selectedEntityIds, deletePlayer]);

  // Define shortcuts - Using Alt+ combinations to avoid browser conflicts
  // Browser-reserved shortcuts to avoid: Ctrl+N, Ctrl+R, Ctrl+S, Ctrl+A, Ctrl+G, Ctrl+[, Ctrl+,
  const shortcuts: Shortcut[] = useMemo(() => [
    {
      key: '1',
      modifiers: { alt: true },
      callback: actions.toggleLeftPanel,
      description: 'Masquer/Afficher panneau gauche',
    },
    {
      key: '2',
      modifiers: { alt: true },
      callback: actions.toggleRightPanel,
      description: 'Masquer/Afficher panneau droit',
    },
    {
      key: 'n',
      modifiers: { alt: true },
      callback: actions.nextCycle,
      description: 'Cycle suivant',
    },
    {
      key: 'd',
      modifiers: { alt: true },
      callback: actions.toggleNight,
      description: 'Basculer jour/nuit',
    },
    {
      key: ' ',
      callback: actions.startTimer,
      description: 'Démarrer/Pause timer',
    },
    {
      key: 'r',
      modifiers: { alt: true },
      callback: actions.resetTimer,
      description: 'Réinitialiser timer',
    },
    {
      key: 'a',
      modifiers: { alt: true },
      callback: actions.selectAllPlayers,
      description: 'Sélectionner tous les joueurs',
    },
    {
      key: 'Escape',
      callback: actions.clearSelection,
      description: 'Désélectionner',
    },
    {
      key: 'g',
      modifiers: { alt: true },
      callback: actions.toggleGrid,
      description: 'Masquer/Afficher grille',
    },
    {
      key: '0',
      modifiers: { alt: true },
      callback: actions.resetView,
      description: 'Réinitialiser la vue',
    },
    {
      key: '/',
      modifiers: { alt: true },
      callback: actions.openSettings,
      description: 'Aide raccourcis clavier',
    },
    {
      key: 's',
      modifiers: { alt: true },
      callback: actions.saveGame,
      description: 'Sauvegarder la partie',
    },
    {
      key: 'e',
      modifiers: { alt: true },
      callback: actions.exportGame,
      description: 'Exporter la partie (JSON)',
    },
    {
      key: 'i',
      modifiers: { alt: true },
      callback: actions.importGame,
      description: 'Importer une partie (JSON)',
    },
    {
      key: 'l',
      modifiers: { alt: true },
      callback: actions.exportLogs,
      description: 'Exporter les logs',
    },
    {
      key: 'p',
      modifiers: { alt: true },
      callback: actions.exportPlayersCSV,
      description: 'Exporter les joueurs (CSV)',
    },
    {
      key: 'Delete',
      callback: actions.deleteSelectedPlayers,
      description: 'Supprimer la sélection',
    },
  ], [actions]);

  // Register shortcuts
  useKeyboardShortcuts(shortcuts);

  return (
    <div className={`h-screen w-screen flex overflow-hidden bg-background text-foreground transition-colors duration-300 ${isNight ? 'dark' : ''}`}>
      <LeftPanel />
      <Canvas />
      <RightPanel />
      {editingEntity && <EditingModal />}

      {/* Render open handouts over everything */}
      {handouts.filter(h => h.isOpen).map(handout => (
        <HandoutWindow key={handout.id} handout={handout} />
      ))}

      <DetachedTimer />
      <DetachedSoundboard />
      <ScoreboardWindow />
      <WikiWindow />
      <ChecklistWindow />
      <TagDistributorWindow />
      <ActionCreatorWindow />
      <ActionConditionWindow />
      <ActionEffectWindow />
      <RoleSelectorWindow />

      {/* Smartphone Action Popup */}
      {smartphoneActionMessage && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 border-2 border-blue-500/50 text-white rounded-xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="bg-blue-500/20 border-b border-blue-500/30 p-4 flex justify-between items-center">
              <div className="flex flex-row items-center gap-2">
                <MessageSquareWarning className="text-blue-400 h-5 w-5" />
                <h3 className="font-bold text-lg text-blue-100 drop-shadow-sm">
                  Retour de {smartphoneActionMessage.playerName}
                </h3>
              </div>
              <button 
                onClick={() => setSmartphoneActionMessage(null)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 text-zinc-200 whitespace-pre-wrap text-base leading-relaxed">
              {smartphoneActionMessage.message}
            </div>
            <div className="p-4 bg-zinc-950/50 flex justify-end">
              <button
                onClick={() => setSmartphoneActionMessage(null)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-colors border border-blue-500/50"
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help Button */}
      <button
        onClick={() => setShowShortcutsHelp(true)}
        className="fixed bottom-4 left-4 z-[9998] p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
        title="Raccourcis clavier (Alt + /)"
      >
        <Keyboard className="h-5 w-5 text-muted-foreground" />
      </button>

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp
        shortcuts={shortcuts}
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />
    </div>
  );
};
