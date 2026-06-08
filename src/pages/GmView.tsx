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
import { CampaignJournalWindow } from '../components/CampaignJournalWindow';
import { TagDistributorWindow } from '../components/TagDistributorWindow';
import { ActionCreatorWindow } from '../components/ActionCreatorWindow';
import { ActionConditionWindow } from '../components/ActionConditionWindow';
import { ActionEffectWindow } from '../components/ActionEffectWindow';
import { RoleSelectorWindow } from '../components/RoleSelectorWindow';
import { CardEditorWindow } from '../components/CardEditorWindow';
import { VoteManagerWindow } from '../components/VoteManagerWindow';
import { ChatManagerWindow } from '../components/ChatManagerWindow';
import { useVttStore, selectPlayers, selectSelectedEntityIds } from '../store';
import { setupHostRealtimeSubscription, cleanupHostRealtime } from '../lib/realtime-host';
import { X, MessageSquareWarning, Keyboard } from 'lucide-react';
import { useKeyboardShortcuts, KeyboardShortcutsHelp, useGMShortcuts } from '../hooks/useKeyboardShortcuts.tsx';
import type { Shortcut } from '../hooks/useKeyboardShortcuts.tsx';
import { useToast } from '../components/Toast';
import { exportGame, triggerImport, exportLogs, exportPlayersCSV } from '../lib/game-export';

export const GmView: React.FC = () => {
  const { isNight, editingEntity, handouts, smartphoneActionMessage, setSmartphoneActionMessage, toggleLeftPanel, toggleRightPanel, nextCycle, setNight, setSelectedEntityIds, clearSelection, setGrid, setPan, setZoom, grid, canvas, deletePlayer, displaySettings, updateDisplaySettings, setTimer } = useVttStore();
  const players = useVttStore(selectPlayers);
  const selectedEntityIds = useVttStore(selectSelectedEntityIds);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const toast = useToast();

  const [cardEditorRoleId, setCardEditorRoleId] = useState<string | null | undefined>(undefined);

  React.useEffect(() => {
    (window as any).openCardEditor = (roleId?: string | null) => {
      setCardEditorRoleId(roleId === undefined ? null : roleId);
    };
    return () => {
      delete (window as any).openCardEditor;
    };
  }, []);

  const [isVoteManagerOpen, setIsVoteManagerOpen] = useState(false);

  React.useEffect(() => {
    (window as any).openVoteManager = (open: boolean = true) => {
      setIsVoteManagerOpen(open);
    };
    return () => {
      delete (window as any).openVoteManager;
    };
  }, []);

  const [isChatManagerOpen, setIsChatManagerOpen] = useState(false);

  React.useEffect(() => {
    (window as any).openChatManager = (open: boolean = true) => {
      setIsChatManagerOpen(open);
    };
    return () => {
      delete (window as any).openChatManager;
    };
  }, []);

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
      setTimer({ isRunning: !useVttStore.getState().timer.isRunning });
    },
    resetTimer: () => {
      const defaults = useVttStore.getState().displaySettings;
      setTimer({ isRunning: false, minutes: defaults.timerDefaultMinutes ?? 5, seconds: defaults.timerDefaultSeconds ?? 0 });
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
    focusMode: () => (window as any).__gameTabFocusControls?.toggleFocus?.(),
    focusPrev: () => (window as any).__gameTabFocusControls?.focusPrev?.(),
    focusNext: () => (window as any).__gameTabFocusControls?.focusNext?.(),
    exitFocus: () => (window as any).__gameTabFocusControls?.exitFocus?.(),
  }), [isNight, players, grid, toggleLeftPanel, toggleRightPanel, nextCycle, setNight, setSelectedEntityIds, clearSelection, setGrid, setPan, setZoom, toast, selectedEntityIds, deletePlayer]);

  // Define shortcuts - Using Alt+ combinations to avoid browser conflicts
  // Browser-reserved shortcuts to avoid: Ctrl+N, Ctrl+R, Ctrl+S, Ctrl+A, Ctrl+G, Ctrl+[, Ctrl+,
  const customShortcuts = displaySettings.customShortcuts || {};

  const applyCustom = (actionKey: string, defaultKey: string, defaultModifiers: Shortcut['modifiers']) => {
    const custom = customShortcuts[actionKey];
    return custom ? { key: custom.key, modifiers: custom.modifiers } : { key: defaultKey, modifiers: defaultModifiers };
  };

  const shortcuts: Shortcut[] = useMemo(() => [
    {
      ...applyCustom('toggleLeftPanel', '1', { alt: true }),
      callback: actions.toggleLeftPanel,
      description: 'Masquer/Afficher panneau gauche',
      actionKey: 'toggleLeftPanel',
    },
    {
      ...applyCustom('toggleRightPanel', '2', { alt: true }),
      callback: actions.toggleRightPanel,
      description: 'Masquer/Afficher panneau droit',
      actionKey: 'toggleRightPanel',
    },
    {
      ...applyCustom('nextCycle', 'n', { alt: true }),
      callback: actions.nextCycle,
      description: 'Cycle suivant',
      actionKey: 'nextCycle',
    },
    {
      ...applyCustom('toggleNight', 'd', { alt: true }),
      callback: actions.toggleNight,
      description: 'Basculer jour/nuit',
      actionKey: 'toggleNight',
    },
    {
      ...applyCustom('startTimer', ' ', {}),
      callback: actions.startTimer,
      description: 'Démarrer/Pause timer',
      actionKey: 'startTimer',
    },
    {
      ...applyCustom('resetTimer', 'r', { alt: true }),
      callback: actions.resetTimer,
      description: 'Réinitialiser timer',
      actionKey: 'resetTimer',
    },
    {
      ...applyCustom('selectAllPlayers', 'a', { alt: true }),
      callback: actions.selectAllPlayers,
      description: 'Sélectionner tous les joueurs',
      actionKey: 'selectAllPlayers',
    },
    {
      key: 'Escape',
      callback: actions.clearSelection,
      description: 'Désélectionner',
      actionKey: 'clearSelection',
    },
    {
      ...applyCustom('toggleGrid', 'g', { alt: true }),
      callback: actions.toggleGrid,
      description: 'Masquer/Afficher grille',
      actionKey: 'toggleGrid',
    },
    {
      ...applyCustom('resetView', '0', { alt: true }),
      callback: actions.resetView,
      description: 'Réinitialiser la vue',
      actionKey: 'resetView',
    },
    {
      ...applyCustom('openSettings', '/', { alt: true }),
      callback: actions.openSettings,
      description: 'Aide raccourcis clavier',
      actionKey: 'openSettings',
    },
    {
      ...applyCustom('saveGame', 's', { alt: true }),
      callback: actions.saveGame,
      description: 'Sauvegarder la partie',
      actionKey: 'saveGame',
    },
    {
      ...applyCustom('exportGame', 'e', { alt: true }),
      callback: actions.exportGame,
      description: 'Exporter la partie (JSON)',
      actionKey: 'exportGame',
    },
    {
      ...applyCustom('importGame', 'i', { alt: true }),
      callback: actions.importGame,
      description: 'Importer une partie (JSON)',
      actionKey: 'importGame',
    },
    {
      ...applyCustom('exportLogs', 'l', { alt: true }),
      callback: actions.exportLogs,
      description: 'Exporter les logs',
      actionKey: 'exportLogs',
    },
    {
      ...applyCustom('exportPlayersCSV', 'p', { alt: true }),
      callback: actions.exportPlayersCSV,
      description: 'Exporter les joueurs (CSV)',
      actionKey: 'exportPlayersCSV',
    },
    {
      key: 'Delete',
      callback: actions.deleteSelectedPlayers,
      description: 'Supprimer la sélection',
      actionKey: 'deleteSelectedPlayers',
    },
    {
      ...applyCustom('focusMode', 'f', { alt: true }),
      callback: actions.focusMode,
      description: 'Mode Focus (onglet Jeu)',
      actionKey: 'focusMode',
    },
    {
      ...applyCustom('focusPrev', 'ArrowLeft', { alt: true }),
      callback: actions.focusPrev,
      description: 'Joueur précédent (Focus)',
      actionKey: 'focusPrev',
    },
    {
      ...applyCustom('focusNext', 'ArrowRight', { alt: true }),
      callback: actions.focusNext,
      description: 'Joueur suivant (Focus)',
      actionKey: 'focusNext',
    },
    {
      ...applyCustom('exitFocus', 'Escape', { shift: true }),
      callback: actions.exitFocus,
      description: 'Quitter le mode Focus',
      actionKey: 'exitFocus',
    },
  ], [actions, customShortcuts]);

  // Register shortcuts
  useKeyboardShortcuts(shortcuts);

  // Apply accessibility, performance & theme settings globally
  React.useEffect(() => {
    const root = document.documentElement;
    const fs = displaySettings.fontSize ?? 1;
    root.style.fontSize = `${fs * 100}%`;

    if (displaySettings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    if (displaySettings.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Performance: Low quality mode
    if (displaySettings.lowQualityMode) {
      root.classList.add('low-quality-mode');
    } else {
      root.classList.remove('low-quality-mode');
    }

    // Performance: Image rendering
    root.classList.remove('image-rendering-auto', 'image-rendering-pixelated', 'image-rendering-crisp');
    const rendering = displaySettings.imageRendering || 'auto';
    root.classList.add(`image-rendering-${rendering === 'crisp-edges' ? 'crisp' : rendering}`);

    // Custom Theme: Apply CSS variables
    const theme = displaySettings.customTheme || {};
    const themeVars: Record<string, string> = {};
    if (theme.primary) themeVars['--primary'] = theme.primary;
    if (theme.background) themeVars['--background'] = theme.background;
    if (theme.card) themeVars['--card'] = theme.card;
    if (theme.muted) themeVars['--muted'] = theme.muted;
    if (theme.border) themeVars['--border'] = theme.border;
    if (theme.accent) themeVars['--accent'] = theme.accent;
    if (theme.destructive) themeVars['--destructive'] = theme.destructive;
    if (theme.ring) themeVars['--ring'] = theme.ring;
    Object.entries(themeVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    return () => {
      root.style.fontSize = '';
      root.classList.remove('high-contrast', 'reduce-motion', 'low-quality-mode', 'image-rendering-auto', 'image-rendering-pixelated', 'image-rendering-crisp');
      Object.keys(themeVars).forEach(key => root.style.removeProperty(key));
    };
  }, [displaySettings.fontSize, displaySettings.highContrast, displaySettings.reduceMotion, displaySettings.lowQualityMode, displaySettings.imageRendering, displaySettings.customTheme]);

  // Custom CSS injection
  React.useEffect(() => {
    let styleEl = document.getElementById('vtt-custom-css') as HTMLStyleElement | null;
    if (displaySettings.customCSS) {
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'vtt-custom-css';
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = displaySettings.customCSS;
    } else if (styleEl) {
      styleEl.remove();
    }
    return () => {
      if (styleEl && !displaySettings.customCSS) styleEl.remove();
    };
  }, [displaySettings.customCSS]);

  const colorblindFilter = displaySettings.colorblindMode && displaySettings.colorblindMode !== 'none'
    ? `url(#cb-${displaySettings.colorblindMode})`
    : undefined;

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
      <CampaignJournalWindow />
      <TagDistributorWindow />
      <ActionCreatorWindow />
      <ActionConditionWindow />
      <ActionEffectWindow />
      <RoleSelectorWindow />
      {cardEditorRoleId !== undefined && (
        <CardEditorWindow
          roleId={cardEditorRoleId}
          onClose={() => setCardEditorRoleId(undefined)}
        />
      )}
      {isVoteManagerOpen && (
        <VoteManagerWindow
          onClose={() => setIsVoteManagerOpen(false)}
        />
      )}
      {isChatManagerOpen && (
        <ChatManagerWindow
          onClose={() => setIsChatManagerOpen(false)}
        />
      )}

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

      {/* SVG Colorblind Filters */}
      <svg className="absolute w-0 h-0 overflow-hidden" aria-hidden="true">
        <defs>
          <filter id="cb-protanopia">
            <feColorMatrix type="matrix" values="
              0.567, 0.433, 0,     0, 0
              0.558, 0.442, 0,     0, 0
              0,     0.242, 0.758, 0, 0
              0,     0,     0,     1, 0" />
          </filter>
          <filter id="cb-deuteranopia">
            <feColorMatrix type="matrix" values="
              0.625, 0.375, 0,   0, 0
              0.7,   0.3,   0,   0, 0
              0,     0.3,   0.7, 0, 0
              0,     0,     0,   1, 0" />
          </filter>
          <filter id="cb-tritanopia">
            <feColorMatrix type="matrix" values="
              0.95, 0.05,  0,     0, 0
              0,    0.433, 0.567, 0, 0
              0,    0.475, 0.525, 0, 0
              0,    0,     0,     1, 0" />
          </filter>
        </defs>
      </svg>
    </div>
  );
};
