import React, { useState, useRef, useEffect } from 'react';
import { X, PaintBucket, Users, Smartphone, Settings as SettingsIcon, Image as ImageIcon, Trash2, ArrowUpRight, Grid3X3, Sun, UserCircle2, Tag, ChevronDown, ChevronRight, Moon, Keyboard, Download, Upload, RotateCcw, FileJson, AlertTriangle, Check, Copy, KeyRound, ZoomIn, ZoomOut, Terminal, Bug, Eye, Filter, Code, Accessibility, Type, Contrast, EyeOff, Palette, Zap, Globe, Gamepad2, Map, Book, MessageSquare, FileText, Radio, Monitor, Music, CheckSquare, Info, Play, SlidersHorizontal, Trophy, Heart, Table } from 'lucide-react';
import * as icons from 'lucide-react';
import { useVttStore, setUndoLimit } from '../../store';
import { ColorPicker } from '../ColorPicker';
import { ThemeToggle } from '../ThemeToggle';
import { useI18n, getBrowserLanguage } from '../../lib/i18n';
import type { BadgeConfig, BadgeType } from '../../types';
import './SettingsModal.css';


interface SettingsModalProps {
  onClose: () => void;
}

const TOOL_LABELS: Record<string, string> = {
  distribution: 'Distribution des Rôles',
  chrono: 'Chronomètre',
  soundboard: 'Boîte à Sons (Soundboard)',
  scoreboard: 'Tableau des Scores',
  logs: 'Log / Historique',
  tagDistributor: 'Distributeur de Tags',
  wiki: 'Wiki / Notes GM',
  popupCreator: 'Créateur de Popup',
  actionCreator: "Créateur d'Actions",
  checklist: 'Checklist pour le MJ',
  magneticPoints: 'Points aimantés',
  system: 'Système & Connexion'
};

const DEFAULT_PANELS_ORDER = ['distribution', 'chrono', 'soundboard', 'scoreboard', 'logs', 'tagDistributor', 'wiki', 'popupCreator', 'actionCreator', 'checklist', 'magneticPoints', 'system'];

const BadgePreview: React.FC<{ corner: string; config: any; children: React.ReactNode }> = ({ corner, config, children }) => {
  const badgeRef = useRef<HTMLDivElement>(null);
  const isTop = corner.startsWith('top');
  const isLeft = corner.endsWith('Left');
  
  const positionClass = isTop 
    ? (isLeft ? 'badge-top-left' : 'badge-top-right')
    : (isLeft ? 'badge-bottom-left' : 'badge-bottom-right');

  useEffect(() => {
    if (badgeRef.current) {
      const bgColor = config.type === 'team' ? '#3b82f6' : config.bgColor;
      const textColor = config.type === 'team' ? '#fff' : config.textColor;
      badgeRef.current.style.backgroundColor = bgColor || 'transparent';
      badgeRef.current.style.color = textColor || 'inherit';
    }
  }, [config.type, config.bgColor, config.textColor]);

  return (
    <div 
      ref={badgeRef}
      className={`badge-preview ${positionClass}`}
    >
      {children}
    </div>
  );
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'salle' | 'joueurs' | 'tags' | 'smartphone' | 'outils' | 'remote' | 'raccourcis' | 'sauvegarde' | 'debug' | 'accessibilite'>('salle');
  const [expandedOutils, setExpandedOutils] = useState<Record<string, boolean>>({ distribution: true, chrono: true, wiki: true, soundboard: true, scoreboard: true, logs: true, tagDistributor: true, magneticPoints: true });
  const [expandedSmartphone, setExpandedSmartphone] = useState<Record<string, boolean>>({ game: true, players: true, room: true, wiki: true, handouts: true, logs: true });

  const {
    room, setRoom,
    grid, setGrid,
    cycleMode, setCycleMode,
    displaySettings, updateDisplaySettings,
    soundboard, setSoundboard,
    scoreboard, setScoreboard,
    logsSettings, setLogsSettings,
    actions,
    logs,
    clearLogs,
    exportFullState,
    exportPartialState,
    importState,
    resetStore,
    roomName,
  } = useVttStore();

  const language = (displaySettings.language || 'fr') as any;
  const { t } = useI18n(language);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const nightImageInputRef = useRef<HTMLInputElement>(null);
  const bgImageRef = useRef<HTMLDivElement>(null);
  const nightBgImageRef = useRef<HTMLDivElement>(null);
  const timerSoundInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (bgImageRef.current) {
      bgImageRef.current.style.backgroundImage = room.backgroundImage ? `url(${room.backgroundImage})` : 'none';
    }
  }, [room.backgroundImage]);

  useEffect(() => {
    if (nightBgImageRef.current) {
      nightBgImageRef.current.style.backgroundImage = room.nightBackgroundImage ? `url(${room.nightBackgroundImage})` : 'none';
    }
  }, [room.nightBackgroundImage]);

  const [draggedTool, setDraggedTool] = useState<string | null>(null);
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [selectedExportSections, setSelectedExportSections] = useState<string[]>(['players', 'roles', 'teams', 'tags', 'actions', 'checklist']);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [debugLogFilter, setDebugLogFilter] = useState<'all' | 'system' | 'action' | 'death'>('all');
  const [showRawState, setShowRawState] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const [modalPos, setModalPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY, posX: modalPos.x, posY: modalPos.y };
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setModalPos({ x: dragStartRef.current.posX + dx, y: dragStartRef.current.posY + dy });
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleToolDragStart = (e: React.DragEvent, key: string) => {
    setDraggedTool(key);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleToolDragOver = (e: React.DragEvent, key: string) => {
    e.preventDefault();
    if (!draggedTool || draggedTool === key) return;
    
    const order = [...(displaySettings.panels?.panelsOrder || DEFAULT_PANELS_ORDER)];
    const fromIndex = order.indexOf(draggedTool);
    const toIndex = order.indexOf(key);
    
    if (fromIndex !== -1 && toIndex !== -1) {
      order.splice(fromIndex, 1);
      order.splice(toIndex, 0, draggedTool);
      updateDisplaySettings({
        panels: {
          ...(displaySettings.panels || {}),
          panelsOrder: order
        }
      });
    }
  };

  const handleToolDragEnd = () => {
    setDraggedTool(null);
  };
  
  const handleTimerSoundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateDisplaySettings({ timerEndSoundUrl: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setRoom({ backgroundImage: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const defaultShortcuts = [
    { actionKey: 'toggleLeftPanel', label: 'Panneau gauche', defaultKey: '[', defaultModifiers: { ctrl: true } },
    { actionKey: 'toggleRightPanel', label: 'Panneau droit (Outils)', defaultKey: ']', defaultModifiers: { ctrl: true } },
    { actionKey: 'nextCycle', label: 'Cycle suivant', defaultKey: 'n', defaultModifiers: { ctrl: true } },
    { actionKey: 'toggleNight', label: 'Basculer Jour/Nuit', defaultKey: 'd', defaultModifiers: { ctrl: true, shift: true } },
    { actionKey: 'startTimer', label: 'Démarrer/Pause chrono', defaultKey: ' ', defaultModifiers: {} },
    { actionKey: 'resetTimer', label: 'Reset chrono', defaultKey: 'r', defaultModifiers: { ctrl: true } },
    { actionKey: 'selectAllPlayers', label: 'Sélectionner tous les joueurs', defaultKey: 'a', defaultModifiers: { ctrl: true } },
    { actionKey: 'clearSelection', label: 'Désélectionner', defaultKey: 'Escape', defaultModifiers: {} },
    { actionKey: 'toggleGrid', label: 'Afficher/masquer grille', defaultKey: 'g', defaultModifiers: { ctrl: true } },
    { actionKey: 'resetView', label: 'Reset vue', defaultKey: '0', defaultModifiers: { ctrl: true } },
    { actionKey: 'openSettings', label: 'Ouvrir Paramètres', defaultKey: ',', defaultModifiers: { ctrl: true } },
    { actionKey: 'undo', label: 'Annuler', defaultKey: 'z', defaultModifiers: { ctrl: true } },
    { actionKey: 'redo', label: 'Refaire', defaultKey: 'z', defaultModifiers: { ctrl: true, shift: true } },
    { actionKey: 'saveGame', label: 'Sauvegarder', defaultKey: 's', defaultModifiers: { ctrl: true } },
    { actionKey: 'exportGame', label: 'Exporter', defaultKey: 'e', defaultModifiers: { ctrl: true, shift: true } },
    { actionKey: 'focusMode', label: 'Mode Focus (onglet Jeu)', defaultKey: 'f', defaultModifiers: { alt: true } },
    { actionKey: 'focusPrev', label: 'Joueur précédent (Focus)', defaultKey: 'ArrowLeft', defaultModifiers: { alt: true } },
    { actionKey: 'focusNext', label: 'Joueur suivant (Focus)', defaultKey: 'ArrowRight', defaultModifiers: { alt: true } },
    { actionKey: 'exitFocus', label: 'Quitter le mode Focus', defaultKey: 'Escape', defaultModifiers: { shift: true } },
  ];

  const getShortcutDisplay = (actionKey: string) => {
    const custom = displaySettings.customShortcuts?.[actionKey];
    const def = defaultShortcuts.find(s => s.actionKey === actionKey);
    const key = custom?.key || def?.defaultKey || '';
    const mods = (custom?.modifiers || def?.defaultModifiers || {}) as { ctrl?: boolean; shift?: boolean; alt?: boolean };
    const parts: string[] = [];
    if (mods.ctrl) parts.push('Ctrl');
    if (mods.shift) parts.push('Shift');
    if (mods.alt) parts.push('Alt');
    if (key === ' ') parts.push('Espace');
    else if (key === 'Escape') parts.push('Échap');
    else parts.push(key.toUpperCase());
    return parts.join(' + ');
  };

  const handleShortcutKeyDown = (e: React.KeyboardEvent, actionKey: string) => {
    e.preventDefault();
    const key = e.key === ' ' ? ' ' : e.key;
    const modifiers = {
      ctrl: e.ctrlKey,
      shift: e.shiftKey,
      alt: e.altKey,
    };
    if (key === 'Escape' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
      const newShortcuts = { ...(displaySettings.customShortcuts || {}) };
      delete newShortcuts[actionKey];
      updateDisplaySettings({ customShortcuts: newShortcuts });
      setEditingShortcut(null);
      return;
    }
    if (key !== 'Control' && key !== 'Shift' && key !== 'Alt' && key !== 'Meta') {
      updateDisplaySettings({
        customShortcuts: {
          ...(displaySettings.customShortcuts || {}),
          [actionKey]: { key, modifiers }
        }
      });
      setEditingShortcut(null);
    }
  };

  const resetShortcut = (actionKey: string) => {
    const newShortcuts = { ...(displaySettings.customShortcuts || {}) };
    delete newShortcuts[actionKey];
    updateDisplaySettings({ customShortcuts: newShortcuts });
  };

  const resetAllShortcuts = () => {
    updateDisplaySettings({ customShortcuts: {} });
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = importState(ev.target?.result as string);
      setImportStatus({
        success: result.success,
        message: result.success ? 'Import réussi !' : (result.error || 'Erreur d\'import')
      });
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
    if (importInputRef.current) importInputRef.current.value = '';
  };

  const toggleExportSection = (section: string) => {
    setSelectedExportSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const exportSections = ['players', 'roles', 'teams', 'tags', 'tagCategories', 'markers', 'handouts', 'actions', 'customPopups', 'checklist', 'magneticPoints', 'displaySettings', 'soundboard', 'scoreboard', 'wiki', 'room', 'grid', 'playerTemplates'];
  const exportLabels: Record<string, string> = {
    players: 'Joueurs', roles: 'Rôles', teams: 'Équipes', tags: 'Tags',
    tagCategories: 'Catégories de tags', markers: 'Marqueurs', handouts: 'Documents',
    actions: 'Actions', customPopups: 'Popups custom', checklist: 'Checklist',
    magneticPoints: 'Points aimantés', displaySettings: 'Paramètres d\'affichage',
    soundboard: 'Soundboard', scoreboard: 'Tableau des scores', wiki: 'Wiki',
    room: 'Salle', grid: 'Grille', playerTemplates: 'Templates joueurs',
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        ref={modalRef}
        className="bg-popover text-popover-foreground rounded-lg shadow-2xl w-[98vw] max-w-7xl max-h-[94vh] flex flex-col border border-border absolute"
        style={{ left: `calc(50% + ${modalPos.x}px)`, top: `calc(5vh + ${modalPos.y}px)`, transform: 'translateX(-50%)' }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header / Drag handle */}
        <div 
          className={`p-4 border-b border-border flex justify-between items-center bg-muted/50 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleDragStart}
        >
          <h2 className="text-xl font-bold flex items-center gap-2">
            <SettingsIcon size={24} className="text-blue-500" />
            Paramètres
          </h2>
          <button 
            onClick={onClose} 
            className="text-muted-foreground hover:text-foreground hover:bg-accent p-1.5 rounded transition-colors"
            title="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border bg-muted/20 px-2 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('salle')}
            className={`px-4 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'salle' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <PaintBucket size={16} /> Salle & Autres
          </button>
          <button
            onClick={() => setActiveTab('joueurs')}
            className={`px-4 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'joueurs' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <Users size={16} /> Joueurs
          </button>
          <button
            onClick={() => setActiveTab('tags')}
            className={`px-4 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'tags' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <Tag size={16} /> Tags
          </button>
          <button
            onClick={() => setActiveTab('smartphone')}
            className={`px-4 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'smartphone' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <Smartphone size={16} /> Smartphone
          </button>
          <button
            onClick={() => setActiveTab('remote')}
            className={`px-4 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'remote' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <Smartphone size={16} /> Télécommande
          </button>
          <button
            onClick={() => setActiveTab('outils')}
            className={`px-4 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'outils' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <SettingsIcon size={16} /> Outils
          </button>
          <button
            onClick={() => setActiveTab('raccourcis')}
            className={`px-4 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'raccourcis' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <Keyboard size={16} /> Raccourcis
          </button>
          <button
            onClick={() => setActiveTab('sauvegarde')}
            className={`px-4 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'sauvegarde' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <Download size={16} /> Sauvegarde
          </button>
          <button
            onClick={() => setActiveTab('debug')}
            className={`px-4 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'debug' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <Terminal size={16} /> Debug
          </button>
          <button
            onClick={() => setActiveTab('accessibilite')}
            className={`px-4 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'accessibilite' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <Accessibility size={16} /> Accessibilité
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-background">
          
          {/* TAB: SALLE & AUTRES */}
          {activeTab === 'salle' && (
             <div className="flex flex-col gap-6">

               {/* === LIGNE 1 : CYCLE + GRILLE + NAVIGATION === */}
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                  {/* Cycle & Affichage */}
                  <section className="p-4 bg-card/50 border border-border/50 rounded-xl shadow-sm">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-2 mb-3 flex items-center gap-2">
                      <Sun size={15} /> Cycle & Affichage
                    </h3>
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="settings-cycle-mode" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Type de cycle</label>
                        <select
                          id="settings-cycle-mode"
                          value={cycleMode}
                          onChange={(e) => setCycleMode(e.target.value as any)}
                          className="bg-input border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-full"
                        >
                          <option value="dayNight">Jour / Nuit</option>
                          <option value="turns">Par tour</option>
                          <option value="none">Aucun</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={displaySettings.showCenter}
                            onChange={(e) => updateDisplaySettings({ showCenter: e.target.checked })}
                            className="rounded border-border w-4 h-4 text-primary"
                          />
                          Réticule du centre
                        </label>
                        {cycleMode !== 'none' && (
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={displaySettings.showCycleIcon}
                              onChange={(e) => updateDisplaySettings({ showCycleIcon: e.target.checked })}
                              className="rounded border-border w-4 h-4 text-primary"
                            />
                            Icône {cycleMode === 'dayNight' ? 'Jour/Nuit' : 'Tours'}
                          </label>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Onglet Jeu */}
                  <section className="p-4 bg-card/50 border border-border/50 rounded-xl shadow-sm">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-2 mb-3 flex items-center gap-2">
                      <Play size={15} /> Onglet Jeu
                    </h3>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-start gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={displaySettings.focusModeGroupByOrder ?? false}
                          onChange={(e) => updateDisplaySettings({ focusModeGroupByOrder: e.target.checked })}
                          className="rounded border-border w-4 h-4 text-primary mt-0.5"
                        />
                        <div className="flex flex-col">
                          <span>Regrouper par numéro d'appel en Mode Focus</span>
                          <span className="text-[10px] text-muted-foreground">Affiche tous les joueurs avec le même numéro d'appel simultanément (ex: tous les Loups-Garous)</span>
                        </div>
                      </label>
                    </div>
                  </section>

                 {/* Grille Magnétique */}
                 <section className="p-4 bg-card/50 border border-border/50 rounded-xl shadow-sm">
                   <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-2 mb-3 flex items-center gap-2">
                     <Grid3X3 size={15} /> Grille Magnétique
                   </h3>
                   <div className="flex flex-col gap-3">
                     <label className="flex items-center gap-2 text-sm cursor-pointer">
                       <input
                         type="checkbox"
                         checked={grid.enabled}
                         onChange={(e) => setGrid({ ...grid, enabled: e.target.checked })}
                         className="rounded border-border w-4 h-4 text-primary"
                       />
                       Activer l'aimantage
                     </label>
                     <label className="flex items-center gap-2 text-sm cursor-pointer">
                       <input
                         type="checkbox"
                         checked={grid.show}
                         onChange={(e) => setGrid({ ...grid, show: e.target.checked })}
                         className="rounded border-border w-4 h-4 text-primary"
                       />
                       Afficher la grille
                     </label>
                     {grid.enabled && (
                       <div className="flex items-center gap-2 ml-1 mt-1">
                         <label htmlFor="settings-grid-size" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Taille</label>
                         <input
                           id="settings-grid-size"
                           type="number"
                           value={grid.sizeX}
                           onChange={(e) => setGrid({ ...grid, sizeX: Math.max(10, parseInt(e.target.value) || 50), sizeY: Math.max(10, parseInt(e.target.value) || 50) })}
                           className="w-20 bg-input border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                         />
                         <span className="text-[10px] text-muted-foreground">px</span>
                       </div>
                     )}
                   </div>
                 </section>

                 {/* Zoom & Navigation */}
                 <section className="p-4 bg-card/50 border border-border/50 rounded-xl shadow-sm">
                   <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-2 mb-3 flex items-center gap-2">
                     <ZoomIn size={15} /> Zoom & Navigation
                   </h3>
                   <div className="flex flex-col gap-3">
                     <div className="flex flex-col gap-1.5">
                       <label htmlFor="settings-wheel-behavior" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Molette</label>
                       <select
                         id="settings-wheel-behavior"
                         value={displaySettings.wheelBehavior || 'both'}
                         onChange={(e) => updateDisplaySettings({ wheelBehavior: e.target.value as 'zoom' | 'pan' | 'both' })}
                         className="bg-input border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-full"
                       >
                         <option value="both">Ctrl+Molette = Zoom / Molette = Pan</option>
                         <option value="zoom">Molette = Zoom toujours</option>
                         <option value="pan">Molette = Pan toujours</option>
                       </select>
                     </div>
                     <div className="flex flex-col gap-1">
                       <div className="flex items-center justify-between">
                         <label htmlFor="settings-zoom-speed" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Vitesse zoom</label>
                         <span className="text-[10px] text-primary font-mono">{((displaySettings.zoomSpeed ?? 0.001) * 1000).toFixed(1)}</span>
                       </div>
                       <input
                         id="settings-zoom-speed"
                         type="range"
                         min="0.1"
                         max="5"
                         step="0.1"
                         value={(displaySettings.zoomSpeed ?? 0.001) * 1000}
                         onChange={(e) => updateDisplaySettings({ zoomSpeed: parseFloat(e.target.value) / 1000 })}
                         className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                       />
                     </div>
                     <div className="flex flex-col gap-1">
                       <div className="flex items-center justify-between">
                         <label htmlFor="settings-pan-speed" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Vitesse pan</label>
                         <span className="text-[10px] text-primary font-mono">{(displaySettings.panSpeed ?? 1).toFixed(1)}</span>
                       </div>
                       <input
                         id="settings-pan-speed"
                         type="range"
                         min="0.1"
                         max="3"
                         step="0.1"
                         value={displaySettings.panSpeed ?? 1}
                         onChange={(e) => updateDisplaySettings({ panSpeed: parseFloat(e.target.value) })}
                         className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                       />
                     </div>
                     <div className="grid grid-cols-2 gap-2">
                       <div className="flex flex-col gap-1">
                         <label htmlFor="settings-zoom-min" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Zoom min</label>
                         <input
                           id="settings-zoom-min"
                           type="number"
                           min="0.01"
                           max="1"
                           step="0.05"
                           value={displaySettings.zoomMin ?? 0.1}
                           onChange={(e) => updateDisplaySettings({ zoomMin: Math.min(1, Math.max(0.01, parseFloat(e.target.value) || 0.1)) })}
                           className="bg-input border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary w-full"
                         />
                       </div>
                       <div className="flex flex-col gap-1">
                         <label htmlFor="settings-zoom-max" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Zoom max</label>
                         <input
                           id="settings-zoom-max"
                           type="number"
                           min="1"
                           max="20"
                           step="0.5"
                           value={displaySettings.zoomMax ?? 5}
                           onChange={(e) => updateDisplaySettings({ zoomMax: Math.max(1, Math.min(20, parseFloat(e.target.value) || 5)) })}
                           className="bg-input border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary w-full"
                         />
                       </div>
                     </div>
                   </div>
                 </section>
               </div>

               {/* === LIGNE 2 : SALLE + PERFORMANCE === */}
               <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

                 {/* Dimensions & Fond de la salle */}
                 <section className="p-4 bg-card/50 border border-border/50 rounded-xl shadow-sm">
                   <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-2 mb-3 flex items-center gap-2">
                     <PaintBucket size={15} /> Salle & Fond
                   </h3>
                   <div className="flex flex-col gap-4">
                     <div className="grid grid-cols-3 gap-3">
                       <div className="flex flex-col gap-1">
                         <label htmlFor="settings-room-width" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Largeur</label>
                         <input
                           id="settings-room-width"
                           type="number"
                           value={room.width}
                           onChange={(e) => setRoom({ width: Math.max(100, parseInt(e.target.value) || 2000) })}
                           className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                         />
                       </div>
                       <div className="flex flex-col gap-1">
                         <label htmlFor="settings-room-height" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Hauteur</label>
                         <input
                           id="settings-room-height"
                           type="number"
                           value={room.height}
                           onChange={(e) => setRoom({ height: Math.max(100, parseInt(e.target.value) || 1500) })}
                           className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                         />
                       </div>
                       <div className="flex flex-col gap-1">
                         <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Couleur</label>
                         <div className="flex items-center gap-2 h-full">
                           <ColorPicker
                             color={room.backgroundColor}
                             onChange={(c) => setRoom({ backgroundColor: c })}
                             label="Couleur de fond"
                           />
                           <span className="text-[10px] uppercase font-mono text-muted-foreground">{room.backgroundColor}</span>
                         </div>
                       </div>
                     </div>

                     <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Image de fond</label>
                       <div className="flex gap-2">
                         <input
                           type="text"
                           placeholder="URL de l'image (https://...)"
                           value={room.backgroundImage && !room.backgroundImage.startsWith('data:') ? room.backgroundImage : ''}
                           onChange={(e) => setRoom({ backgroundImage: e.target.value })}
                           className="flex-1 bg-input border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                         />
                         <button
                           onClick={() => imageInputRef.current?.click()}
                           className="px-3 py-1.5 bg-muted border border-border rounded-lg text-xs font-medium hover:bg-accent transition-colors flex items-center gap-1.5 shrink-0"
                         >
                           <ImageIcon size={13} /> Fichier
                         </button>
                       </div>

                       {!room.backgroundImage ? (
                         <div
                           onClick={() => imageInputRef.current?.click()}
                           className="w-full h-24 border-2 border-dashed border-border/50 rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-colors"
                         >
                           <ImageIcon size={22} className="mb-1 opacity-40" />
                           <span className="text-xs font-medium">Glisser un fichier ici</span>
                         </div>
                       ) : (
                         <div className="flex gap-3 items-start mt-1">
                           <div className="relative w-36 h-24 rounded-lg overflow-hidden border border-border group shrink-0">
                             <div
                               ref={bgImageRef}
                               className="absolute inset-0 bg-contain bg-center bg-no-repeat"
                             />
                             <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                               <button
                                 onClick={() => setRoom({ backgroundImage: null })}
                                 className="p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                               >
                                 <Trash2 size={14} />
                               </button>
                             </div>
                           </div>
                           <div className="flex flex-col gap-2 flex-1">
                             <div className="flex flex-col gap-1">
                               <label htmlFor="settings-bg-style" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Style</label>
                               <select
                                 id="settings-bg-style"
                                 value={room.backgroundStyle}
                                 onChange={(e) => setRoom({ backgroundStyle: e.target.value as any })}
                                 className="bg-input border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary w-full"
                               >
                                 <option value="mosaic">Mosaïque (Répéter)</option>
                                 <option value="center">Centrer (Taille réelle)</option>
                                 <option value="stretch">Étirer (Plein cadre)</option>
                               </select>
                             </div>
                             <p className="text-[10px] text-muted-foreground italic">
                               {room.backgroundImage.startsWith('data:') ? 'Image locale' : 'Image distante'}
                             </p>
                           </div>
                         </div>
                       )}
                        <input
                          id="settings-bg-upload"
                          type="file"
                          ref={imageInputRef}
                          onChange={handleImageUpload}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>

                      <div className="flex flex-col gap-2 pt-3 border-t border-border/50">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Moon size={12} className="text-blue-400" /> Image de fond (Nuit)
                        </label>
                        <p className="text-[10px] text-muted-foreground italic">Utilisée uniquement pendant la phase de nuit (cycle Jour/Nuit)</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="URL de l'image (https://...)"
                            value={room.nightBackgroundImage && !room.nightBackgroundImage.startsWith('data:') ? room.nightBackgroundImage : ''}
                            onChange={(e) => setRoom({ nightBackgroundImage: e.target.value })}
                            className="flex-1 bg-input border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                          />
                          <button
                            onClick={() => nightImageInputRef.current?.click()}
                            className="px-3 py-1.5 bg-muted border border-border rounded-lg text-xs font-medium hover:bg-accent transition-colors flex items-center gap-1.5 shrink-0"
                          >
                            <ImageIcon size={13} /> Fichier
                          </button>
                        </div>

                        {!room.nightBackgroundImage ? (
                          <div
                            onClick={() => nightImageInputRef.current?.click()}
                            className="w-full h-24 border-2 border-dashed border-border/50 rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-colors"
                          >
                            <ImageIcon size={22} className="mb-1 opacity-40" />
                            <span className="text-xs font-medium">Glisser un fichier ici</span>
                          </div>
                        ) : (
                          <div className="flex gap-3 items-start mt-1">
                            <div className="relative w-36 h-24 rounded-lg overflow-hidden border border-border group shrink-0">
                              <div
                                ref={nightBgImageRef}
                                className="absolute inset-0 bg-contain bg-center bg-no-repeat"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <button
                                  onClick={() => setRoom({ nightBackgroundImage: null })}
                                  className="p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 flex-1">
                              <div className="flex flex-col gap-1">
                                <label htmlFor="settings-bg-style" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Style</label>
                                <select
                                  id="settings-bg-style"
                                  value={room.backgroundStyle}
                                  onChange={(e) => setRoom({ backgroundStyle: e.target.value as any })}
                                  className="bg-input border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary w-full"
                                >
                                  <option value="mosaic">Mosaïque (Répéter)</option>
                                  <option value="center">Centrer (Taille réelle)</option>
                                  <option value="stretch">Étirer (Plein cadre)</option>
                                </select>
                              </div>
                              <p className="text-[10px] text-muted-foreground italic">
                                {room.nightBackgroundImage.startsWith('data:') ? 'Image locale' : 'Image distante'}
                              </p>
                            </div>
                          </div>
                        )}
                        <input
                          id="settings-night-bg-upload"
                          type="file"
                          ref={nightImageInputRef}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                setRoom({ nightBackgroundImage: ev.target?.result as string });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Barre d'outils */}
                  <section className="p-4 bg-card/50 border border-border/50 rounded-xl shadow-sm">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-2 mb-3 flex items-center gap-2">
                      <SlidersHorizontal size={15} /> Barre d'outils
                    </h3>
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="settings-toolbar-position" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Position</label>
                        <select
                          id="settings-toolbar-position"
                          value={displaySettings.toolbarPosition || 'bottom-left'}
                          onChange={(e) => updateDisplaySettings({ toolbarPosition: e.target.value as any })}
                          className="bg-input border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-full"
                        >
                          <option value="bottom-left">En bas à gauche</option>
                          <option value="bottom-center">En bas au centre</option>
                          <option value="bottom-right">En bas à droite</option>
                          <option value="top-left">En haut à gauche</option>
                          <option value="top-center">En haut au centre</option>
                          <option value="top-right">En haut à droite</option>
                          <option value="hidden">Masquer la barre</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-[10px] text-muted-foreground">
                        <div className={`p-1.5 rounded border text-center transition-colors ${displaySettings.toolbarPosition === 'top-left' ? 'border-primary bg-primary/10 text-primary' : 'border-border/50'}`}>↖ Haut-G</div>
                        <div className={`p-1.5 rounded border text-center transition-colors ${displaySettings.toolbarPosition === 'top-center' ? 'border-primary bg-primary/10 text-primary' : 'border-border/50'}`}>↑ Haut-C</div>
                        <div className={`p-1.5 rounded border text-center transition-colors ${displaySettings.toolbarPosition === 'top-right' ? 'border-primary bg-primary/10 text-primary' : 'border-border/50'}`}>↗ Haut-D</div>
                        <div className={`p-1.5 rounded border text-center transition-colors ${displaySettings.toolbarPosition === 'bottom-left' ? 'border-primary bg-primary/10 text-primary' : 'border-border/50'}`}>↙ Bas-G</div>
                        <div className={`p-1.5 rounded border text-center transition-colors ${displaySettings.toolbarPosition === 'bottom-center' ? 'border-primary bg-primary/10 text-primary' : 'border-border/50'}`}>↓ Bas-C</div>
                        <div className={`p-1.5 rounded border text-center transition-colors ${displaySettings.toolbarPosition === 'bottom-right' ? 'border-primary bg-primary/10 text-primary' : 'border-border/50'}`}>↘ Bas-D</div>
                      </div>
                    </div>
                  </section>

                  {/* Visibilité Barre d'outils */}
                  <section className="p-4 bg-card/50 border border-border/50 rounded-xl shadow-sm">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-2 mb-3 flex items-center gap-2">
                      <SlidersHorizontal size={15} /> Éléments de la barre
                    </h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      {[
                        { key: 'showToolbarZoom', label: 'Zoom' },
                        { key: 'showToolbarResetView', label: 'Réinitialiser' },
                        { key: 'showToolbarUndoRedo', label: 'Annuler / Rétablir' },
                        { key: 'showToolbarInteraction', label: 'Interaction' },
                        { key: 'showToolbarGrid', label: 'Grille' },
                        { key: 'showToolbarCycle', label: 'Cycle Jour/Nuit' },
                        { key: 'showToolbarTimer', label: 'Chronomètre' },
                        { key: 'showToolbarMagneticPoints', label: 'Points aimantés' },
                        { key: 'showToolbarCoordinates', label: 'Coordonnées' },
                        { key: 'showToolbarRoles', label: 'Rôles' },
                        { key: 'showToolbarGrimoire', label: 'Grimoire' },
                        { key: 'showToolbarSettings', label: 'Paramètres' },
                        { key: 'showToolbarFullscreen', label: 'Plein écran' },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(displaySettings as any)[key] !== false}
                            onChange={(e) => updateDisplaySettings({ [key]: e.target.checked })}
                            className="rounded border-border w-4 h-4 text-primary"
                          />
                          <span className="text-xs">{label}</span>
                        </label>
                      ))}
                    </div>
                  </section>

                  {/* Performance */}
                 <section className="p-4 bg-card/50 border border-border/50 rounded-xl shadow-sm">
                   <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-2 mb-3 flex items-center gap-2">
                     <Zap size={15} /> Performance
                   </h3>
                   <div className="flex flex-col gap-3">
                     <div className="grid grid-cols-2 gap-3">
                       <div className="flex flex-col gap-1.5">
                         <label htmlFor="settings-image-rendering" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Rendu images</label>
                         <select
                           id="settings-image-rendering"
                           value={displaySettings.imageRendering || 'auto'}
                           onChange={(e) => updateDisplaySettings({ imageRendering: e.target.value as any })}
                           className="bg-input border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-full"
                         >
                           <option value="auto">Auto (Qualité)</option>
                           <option value="pixelated">Pixelisé (Rétro)</option>
                           <option value="crisp-edges">Bords nets</option>
                         </select>
                       </div>
                       <div className="flex flex-col gap-1.5">
                         <label htmlFor="settings-foreground-element" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Premier plan</label>
                         <select
                           id="settings-foreground-element"
                           value={displaySettings.foregroundElement}
                           onChange={(e) => updateDisplaySettings({ foregroundElement: e.target.value as any })}
                           className="bg-input border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-full"
                         >
                           <option value="players">Joueurs</option>
                           <option value="markers">Marqueurs</option>
                         </select>
                       </div>
                     </div>

                     <div className="flex flex-col gap-1">
                       <div className="flex items-center justify-between">
                         <label htmlFor="settings-fps-limit" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Limite FPS</label>
                         <span className="text-[10px] text-primary font-mono">{displaySettings.fpsLimit ?? 60} fps</span>
                       </div>
                       <input
                         id="settings-fps-limit"
                         type="range"
                         min="10"
                         max="120"
                         step="10"
                         value={displaySettings.fpsLimit ?? 60}
                         onChange={(e) => updateDisplaySettings({ fpsLimit: parseInt(e.target.value) })}
                         className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                       />
                       <div className="flex justify-between text-[10px] text-muted-foreground">
                         <span>10 (éco)</span>
                         <span>120 (fluide)</span>
                       </div>
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                       <label className="flex items-center gap-2 text-sm cursor-pointer p-2 bg-muted/20 rounded-lg hover:bg-muted/40 transition-colors">
                         <input
                           type="checkbox"
                           checked={displaySettings.lazyLoadImages ?? true}
                           onChange={(e) => updateDisplaySettings({ lazyLoadImages: e.target.checked })}
                           className="rounded border-border w-4 h-4 text-primary"
                         />
                         Lazy loading
                       </label>
                       <label className="flex items-center gap-2 text-sm cursor-pointer p-2 bg-muted/20 rounded-lg hover:bg-muted/40 transition-colors">
                         <input
                           type="checkbox"
                           checked={displaySettings.lowQualityMode ?? false}
                           onChange={(e) => updateDisplaySettings({ lowQualityMode: e.target.checked })}
                           className="rounded border-border w-4 h-4 text-primary"
                         />
                         Mode basse qualité
                       </label>
                     </div>

                     <p className="text-[10px] text-muted-foreground leading-relaxed">
                       <strong className="text-foreground">Rendu :</strong> Pixelisé pour le pixel art, Bords nets pour les cartes.
                       <strong className="text-foreground ml-2">Basse qualité :</strong> Désactive ombres, flous et effets.
                     </p>
                   </div>
                 </section>
               </div>

               {/* === LIGNE 3 : LANGUE + THÈME + HISTORIQUE === */}
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                 {/* Langue */}
                 <section className="p-4 bg-card/50 border border-border/50 rounded-xl shadow-sm">
                   <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-2 mb-3 flex items-center gap-2">
                     <Globe size={15} /> Langue
                   </h3>
                   <div className="flex flex-col gap-3">
                     <div className="flex flex-col gap-1.5">
                       <label htmlFor="settings-language" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('language.label')}</label>
                       <select
                         id="settings-language"
                         value={displaySettings.language || 'fr'}
                         onChange={(e) => updateDisplaySettings({ language: e.target.value as any })}
                         className="bg-input border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-full"
                       >
                         <option value="fr">🇫🇷 Français</option>
                         <option value="en">🇬🇧 English</option>
                         <option value="es">🇪🇸 Español</option>
                         <option value="de">🇩🇪 Deutsch</option>
                         <option value="it">🇮🇹 Italiano</option>
                         <option value="pt">🇧🇷 Português</option>
                         <option value="ja">🇯🇵 日本語</option>
                         <option value="zh">🇨🇳 中文</option>
                       </select>
                     </div>
                     {displaySettings.language && displaySettings.language !== 'fr' && (
                       <button
                         onClick={() => updateDisplaySettings({ language: getBrowserLanguage() })}
                         className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded-lg text-xs font-medium hover:bg-accent transition-colors self-start"
                       >
                         <Globe size={12} /> Détecter la langue du navigateur
                       </button>
                     )}
                   </div>
                 </section>

                 {/* Apparence */}
                 <section className="p-4 bg-card/50 border border-border/50 rounded-xl shadow-sm">
                   <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-2 mb-3 flex items-center gap-2">
                     <Sun size={15} /> Apparence
                   </h3>
                   <div className="flex flex-col gap-3">
                     <p className="text-[11px] text-muted-foreground">Ambiance visuelle du logiciel.</p>
                     <ThemeToggle className="w-fit" />
                   </div>
                 </section>

                 {/* Historique */}
                 <section className="p-4 bg-card/50 border border-border/50 rounded-xl shadow-sm">
                   <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-2 mb-3 flex items-center gap-2">
                     <RotateCcw size={15} /> Historique
                   </h3>
                   <div className="flex flex-col gap-3">
                     <div className="flex flex-col gap-1">
                       <div className="flex items-center justify-between">
                         <label htmlFor="settings-undo-limit" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Limite annulations</label>
                         <span className="text-[10px] text-primary font-mono">{displaySettings.undoLimit ?? 50}</span>
                       </div>
                       <input
                         id="settings-undo-limit"
                         type="range"
                         min="5"
                         max="200"
                         step="5"
                         value={displaySettings.undoLimit ?? 50}
                         onChange={(e) => {
                           const limit = parseInt(e.target.value);
                           updateDisplaySettings({ undoLimit: limit });
                           setUndoLimit(limit);
                         }}
                         className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                       />
                       <div className="flex justify-between text-[10px] text-muted-foreground">
                         <span>5</span>
                         <span>200</span>
                       </div>
                     </div>
                     <div className="grid grid-cols-2 gap-2">
                       <div className="p-2 bg-muted/30 rounded-lg text-center">
                         <div className="text-lg font-bold text-blue-400">{useVttStore.temporal.getState().pastStates.length}</div>
                         <div className="text-[9px] text-muted-foreground uppercase">Annulations</div>
                       </div>
                       <div className="p-2 bg-muted/30 rounded-lg text-center">
                         <div className="text-lg font-bold text-amber-400">{useVttStore.temporal.getState().futureStates.length}</div>
                         <div className="text-[9px] text-muted-foreground uppercase">Refaires</div>
                       </div>
                     </div>
                     <button
                       onClick={() => useVttStore.temporal.getState().clear()}
                       className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded-lg text-xs font-medium hover:bg-accent transition-colors self-start"
                     >
                       <Trash2 size={12} /> Vider l'historique
                     </button>
                   </div>
                 </section>
               </div>

               {/* === LIGNE 4 : THÈME AVANCÉ (pleine largeur) === */}
               <section className="p-4 bg-card/50 border border-border/50 rounded-xl shadow-sm">
                 <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-2 mb-3 flex items-center gap-2">
                   <Palette size={15} /> Thème avancé
                 </h3>
                 <div className="flex flex-col gap-4">
                   {/* Couleurs personnalisées */}
                   <div>
                     <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Couleurs personnalisées</h4>
                     <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                       {[
                         { key: 'primary', label: 'Primaire', def: '#3b82f6' },
                         { key: 'background', label: 'Fond', def: '#020817' },
                         { key: 'card', label: 'Carte', def: '#020817' },
                         { key: 'muted', label: 'Atténué', def: '#1e293b' },
                         { key: 'border', label: 'Bordure', def: '#1e293b' },
                         { key: 'accent', label: 'Accent', def: '#1e293b' },
                         { key: 'destructive', label: 'Destructif', def: '#7f1d1d' },
                         { key: 'ring', label: 'Focus', def: '#cbd5e1' },
                       ].map(color => {
                         const current = (displaySettings.customTheme || {} as any)[color.key] || '';
                         return (
                           <div key={color.key} className="flex flex-col gap-1.5">
                             <label className="text-[9px] font-bold text-muted-foreground uppercase text-center">{color.label}</label>
                             <div className="flex items-center justify-center gap-1.5">
                               <ColorPicker
                                 color={current || color.def}
                                 onChange={(c) => updateDisplaySettings({
                                   customTheme: { ...(displaySettings.customTheme || {}), [color.key]: c }
                                 })}
                                 label={color.label}
                                 className="!w-8 !h-8 rounded-lg border border-border/50"
                               />
                               {current && (
                                 <button
                                   onClick={() => {
                                     const theme = { ...(displaySettings.customTheme || {}) } as Record<string, string>;
                                     delete theme[color.key];
                                     updateDisplaySettings({ customTheme: theme });
                                   }}
                                   className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                                 >
                                   <RotateCcw size={11} />
                                 </button>
                               )}
                             </div>
                           </div>
                         );
                       })}
                     </div>
                     <button
                       onClick={() => {
                         if (Object.keys(displaySettings.customTheme || {}).length > 0) {
                           updateDisplaySettings({ customTheme: {} });
                         }
                       }}
                       disabled={Object.keys(displaySettings.customTheme || {}).length === 0}
                       className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded-lg text-xs font-medium hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                       <RotateCcw size={12} /> Réinitialiser les couleurs
                     </button>
                   </div>

                   {/* CSS personnalisé */}
                   <div>
                     <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                       <Code size={13} /> CSS personnalisé
                     </h4>
                     <textarea
                       value={displaySettings.customCSS || ''}
                       onChange={(e) => updateDisplaySettings({ customCSS: e.target.value })}
                       placeholder="/* Votre CSS ici */"
                       className="w-full h-28 bg-black/30 border border-border rounded-lg px-3 py-2 text-xs font-mono text-green-400 outline-none focus:ring-1 focus:ring-primary resize-y placeholder:text-zinc-600"
                       spellCheck={false}
                     />
                     <div className="flex items-center justify-between mt-2">
                       <p className="text-[10px] text-muted-foreground italic">Injecté dynamiquement dans un tag &lt;style&gt;.</p>
                       <button
                         onClick={() => updateDisplaySettings({ customCSS: '' })}
                         disabled={!displaySettings.customCSS}
                         className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded-lg text-xs font-medium hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                         <Trash2 size={12} /> Effacer
                       </button>
                     </div>
                   </div>
                 </div>
               </section>
             </div>
           )}

          {/* TAB: JOUEURS */}
          {activeTab === 'joueurs' && (
             <div className="flex flex-col gap-6">

               {/* === LIGNE 1 : VISIBILITÉ + APPARENCE === */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                 {/* Visibilité des Joueurs */}
                 <section className="p-4 bg-card/50 border border-border/50 rounded-xl shadow-sm">
                   <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-2 mb-3 flex items-center gap-2">
                     <Users size={15} /> Visibilité
                   </h3>
                   <div className="flex flex-col gap-3">
                     <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer p-2 bg-muted/20 rounded-lg hover:bg-muted/40 transition-colors">
                       <input
                         type="checkbox"
                         checked={displaySettings.showPlayers}
                         onChange={(e) => updateDisplaySettings({ showPlayers: e.target.checked })}
                         className="rounded border-border w-4 h-4 text-primary"
                       />
                       Joueurs visibles sur le plateau
                     </label>

                     {displaySettings.showPlayers && (
                       <div className="pl-2 flex flex-col gap-2">
                         <label className="flex items-center gap-2 text-sm cursor-pointer p-2 bg-muted/10 rounded-lg hover:bg-muted/30 transition-colors">
                           <input
                             type="checkbox"
                             checked={displaySettings.showPlayerImage}
                             onChange={(e) => updateDisplaySettings({ showPlayerImage: e.target.checked })}
                             className="rounded border-border w-4 h-4 text-primary"
                           />
                           Image du joueur
                         </label>
                         <label className="flex items-center gap-2 text-sm cursor-pointer p-2 bg-muted/10 rounded-lg hover:bg-muted/30 transition-colors">
                           <input
                             type="checkbox"
                             checked={displaySettings.showOfflineStatus}
                             onChange={(e) => updateDisplaySettings({ showOfflineStatus: e.target.checked })}
                             className="rounded border-border w-4 h-4 text-primary"
                           />
                           Indicateur hors ligne
                         </label>
                       </div>
                     )}
                   </div>
                 </section>

                 {/* Apparence du Pion */}
                 <section className="p-4 bg-card/50 border border-border/50 rounded-xl shadow-sm">
                   <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-2 mb-3 flex items-center gap-2">
                     <UserCircle2 size={15} /> Apparence du Pion
                   </h3>
                   <div className="flex flex-col gap-3">
                     <div className="grid grid-cols-2 gap-3">
                       <div className="flex flex-col gap-1">
                         <label htmlFor="settings-player-size" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Taille (rayon px)</label>
                         <input
                           id="settings-player-size"
                           type="number"
                           min="5"
                           max="500"
                           value={displaySettings.defaultPlayerSize ?? 40}
                           onChange={(e) => updateDisplaySettings({ defaultPlayerSize: parseInt(e.target.value) || 40 })}
                           className="bg-input border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary w-full"
                         />
                       </div>
                       <div className="flex flex-col gap-1">
                         <label htmlFor="settings-player-shape" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Forme</label>
                         <select
                           id="settings-player-shape"
                           value={displaySettings.defaultPlayerShape || 'circle'}
                           onChange={(e) => updateDisplaySettings({ defaultPlayerShape: e.target.value as any })}
                           className="bg-input border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary w-full"
                         >
                           <option value="circle">Rond</option>
                           <option value="square">Carré</option>
                           <option value="oval">Ovale</option>
                       <option value="triangle">Triangle</option>
                           <option value="trapezoid">Trapèze</option>
                           <option value="octagon">Octogone</option>
                           <option value="star">Étoile</option>
                           <option value="pentagon">Pentagone</option>
                           <option value="hexagon">Hexagone</option>
                           <option value="diamond">Diamant</option>
                           <option value="shield">Bouclier</option>
                           <option value="cross">Croix</option>
                           <option value="heart">Cœur</option>
                           <option value="crescent">Croissant</option>
                           <option value="werewolfCard">Carte Loup-Garou</option>
                         </select>
                       </div>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                       <div className="flex flex-col gap-1">
                         <label htmlFor="settings-image-priority" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Priorité image</label>
                         <select
                           id="settings-image-priority"
                           value={displaySettings.imagePriority}
                           onChange={(e) => updateDisplaySettings({ imagePriority: e.target.value as 'player' | 'role' })}
                           className="bg-input border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary w-full"
                         >
                           <option value="player">Joueur</option>
                           <option value="role">Rôle</option>
                         </select>
                       </div>
                       <div className="flex flex-col gap-1">
                         <label htmlFor="settings-name-position" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Position du nom</label>
                         <select
                           id="settings-name-position"
                           value={displaySettings.playerNamePosition}
                           onChange={(e) => updateDisplaySettings({ playerNamePosition: e.target.value as any })}
                           className="bg-input border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary w-full"
                         >
                           <option value="none">Aucun</option>
                           <option value="bottom">En dessous</option>
                           <option value="top">Au dessus</option>
                           <option value="inside">À l'intérieur</option>
                         </select>
                       </div>
                     </div>
                   </div>
                 </section>
               </div>

               {/* === LIGNE 2 : RÔLES + INFO-BULLE === */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                 {/* Affichage des Rôles */}
                 <section className="p-4 bg-card/50 border border-border/50 rounded-xl shadow-sm">
                   <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-2 mb-3 flex items-center gap-2">
                     <Tag size={15} /> Rôles & Équipes
                   </h3>
                   <div className="flex flex-col gap-2">
                     <div className="grid grid-cols-2 gap-2">
                       <label className="flex items-center gap-2 text-sm cursor-pointer p-2 bg-muted/10 rounded-lg hover:bg-muted/30 transition-colors">
                         <input
                           type="checkbox"
                           checked={!displaySettings.showRole}
                           onChange={(e) => updateDisplaySettings({ showRole: !e.target.checked })}
                           className="rounded border-border w-4 h-4 text-primary"
                         />
                         Masquer le rôle
                       </label>
                       <label className="flex items-center gap-2 text-sm cursor-pointer p-2 bg-muted/10 rounded-lg hover:bg-muted/30 transition-colors">
                         <input
                           type="checkbox"
                           checked={!displaySettings.showRoleImage}
                           onChange={(e) => updateDisplaySettings({ showRoleImage: !e.target.checked })}
                           className="rounded border-border w-4 h-4 text-primary"
                         />
                         Masquer l'image
                       </label>
                       <label className="flex items-center gap-2 text-sm cursor-pointer p-2 bg-muted/10 rounded-lg hover:bg-muted/30 transition-colors">
                         <input
                           type="checkbox"
                           checked={!displaySettings.showTeam}
                           onChange={(e) => updateDisplaySettings({ showTeam: !e.target.checked })}
                           className="rounded border-border w-4 h-4 text-primary"
                         />
                         Masquer l'équipe
                       </label>
                       <label className="flex items-center gap-2 text-sm cursor-pointer p-2 bg-muted/10 rounded-lg hover:bg-muted/30 transition-colors">
                         <input
                           type="checkbox"
                           checked={!displaySettings.showRoleColor}
                           onChange={(e) => updateDisplaySettings({ showRoleColor: !e.target.checked })}
                           className="rounded border-border w-4 h-4 text-primary"
                         />
                         Masquer la couleur
                       </label>
                     </div>

                     <div className="border-t border-border/30 pt-2 mt-1">
                       <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer p-2 bg-muted/10 rounded-lg hover:bg-muted/30 transition-colors">
                         <input
                           type="checkbox"
                           checked={!displaySettings.showPlayerBadges?.topLeft && !displaySettings.showPlayerBadges?.topRight && !displaySettings.showPlayerBadges?.bottomLeft && !displaySettings.showPlayerBadges?.bottomRight}
                           onChange={(e) => {
                             const hide = e.target.checked;
                             updateDisplaySettings({
                               showPlayerBadges: hide
                                 ? { topLeft: false, topRight: false, bottomLeft: false, bottomRight: false }
                                 : { topLeft: true, topRight: true, bottomLeft: true, bottomRight: true }
                             });
                           }}
                           className="rounded border-border w-4 h-4 text-primary"
                         />
                         Masquer toutes les pastilles
                       </label>
                       {displaySettings.showPlayerBadges?.topLeft || displaySettings.showPlayerBadges?.topRight || displaySettings.showPlayerBadges?.bottomLeft || displaySettings.showPlayerBadges?.bottomRight ? (
                         <div className="grid grid-cols-2 gap-2 mt-2 ml-2">
                           {(['topLeft', 'topRight', 'bottomLeft', 'bottomRight'] as const).map(pos => (
                             <label key={pos} className="flex items-center gap-2 text-xs cursor-pointer p-1.5 bg-muted/5 rounded hover:bg-muted/20 transition-colors">
                               <input
                                 type="checkbox"
                                 checked={displaySettings.showPlayerBadges?.[pos] ?? true}
                                 onChange={(e) => updateDisplaySettings({
                                   showPlayerBadges: { ...displaySettings.showPlayerBadges, [pos]: e.target.checked }
                                 })}
                                 className="rounded border-border"
                               />
                               {pos === 'topLeft' ? 'Haut G.' : pos === 'topRight' ? 'Haut D.' : pos === 'bottomLeft' ? 'Bas G.' : 'Bas D.'}
                             </label>
                           ))}
                         </div>
                       ) : null}
                     </div>
                   </div>
                 </section>

                 {/* Info-Bulle */}
                 <section className="p-4 bg-card/50 border border-border/50 rounded-xl shadow-sm">
                   <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-2 mb-3 flex items-center gap-2">
                     <MessageSquare size={15} /> Info-Bulle
                   </h3>
                   <div className="flex flex-col gap-2">
                     <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer p-2 bg-muted/20 rounded-lg hover:bg-muted/40 transition-colors">
                       <input
                         type="checkbox"
                         checked={displaySettings.showTooltip}
                         onChange={(e) => updateDisplaySettings({ showTooltip: e.target.checked })}
                         className="rounded border-border w-4 h-4 text-primary"
                       />
                       Afficher au survol
                     </label>
                     {displaySettings.showTooltip && (
                       <div className="grid grid-cols-2 gap-2 ml-2">
                         {[
                           { key: 'showPlayerName', label: 'Nom', def: true },
                           { key: 'showRole', label: 'Rôle' },
                           { key: 'showTeam', label: 'Équipe' },
                           { key: 'showTags', label: 'Tags' },
                         ].map(opt => (
                           <label key={opt.key} className="flex items-center gap-2 text-xs cursor-pointer p-1.5 bg-muted/5 rounded hover:bg-muted/20 transition-colors">
                             <input
                               type="checkbox"
                                checked={(displaySettings[opt.key as keyof typeof displaySettings] as boolean) ?? opt.def}
                               onChange={(e) => updateDisplaySettings({ [opt.key]: e.target.checked })}
                               className="rounded border-border"
                             />
                             {opt.label}
                           </label>
                         ))}
                       </div>
                     )}
                   </div>
                 </section>
               </div>

               {/* === LIGNE 3 : PASTILLES (pleine largeur) === */}
               <section className="p-4 bg-card/50 border border-border/50 rounded-xl shadow-sm">
                 <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-2 mb-3 flex items-center gap-2">
                   <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-background" /> Pastilles (Coins des pions)
                 </h3>
                 <div className="flex flex-col gap-4">
                   {/* Preview + Selectors */}
                   <div className="relative max-w-2xl mx-auto px-4 py-8 bg-muted/5 rounded-2xl border border-border/20 shadow-inner">
                     {/* Central Preview */}
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
                       <div
                         className="relative w-24 h-24 bg-zinc-900 border-2 border-zinc-700 shadow-2xl overflow-visible pointer-events-auto group mt-[-20px] sm:mt-0"
                         style={{
                           borderRadius: displaySettings.defaultPlayerShape === 'square' ? '4px' : displaySettings.defaultPlayerShape === 'circle' ? '50%' : '0',
                           clipPath: displaySettings.defaultPlayerShape === 'oval' ? 'ellipse(50% 40% at 50% 50%)' :
                             displaySettings.defaultPlayerShape === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' :
                             displaySettings.defaultPlayerShape === 'trapezoid' ? 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)' :
                             displaySettings.defaultPlayerShape === 'octagon' ? 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' :
                             displaySettings.defaultPlayerShape === 'star' ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' :
                             displaySettings.defaultPlayerShape === 'pentagon' ? 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' :
                             displaySettings.defaultPlayerShape === 'hexagon' ? 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' :
                             displaySettings.defaultPlayerShape === 'diamond' ? 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' :
                             displaySettings.defaultPlayerShape === 'shield' ? 'polygon(50% 0%, 100% 15%, 100% 65%, 50% 100%, 0% 65%, 0% 15%)' :
                             displaySettings.defaultPlayerShape === 'cross' ? 'polygon(35% 0%, 65% 0%, 65% 35%, 100% 35%, 100% 65%, 65% 65%, 65% 100%, 35% 100%, 35% 65%, 0% 65%, 0% 35%, 35% 35%)' :
                             displaySettings.defaultPlayerShape === 'heart' ? 'path("M50 88 C25 65 0 45 0 25 C0 10 15 0 25 0 C35 0 50 15 50 15 C50 15 65 0 75 0 C85 0 100 10 100 25 C100 45 75 65 50 88Z")' :
                             displaySettings.defaultPlayerShape === 'crescent' ? 'path("M60 10 C30 10 10 35 10 60 C10 85 30 100 60 100 C40 90 30 75 30 60 C30 45 40 30 60 10Z")' :
                             displaySettings.defaultPlayerShape === 'werewolfCard' ? 'polygon(36% 36%, 38% 22%, 44% 10%, 55% 2%, 61% 8%, 63% 18%, 62% 28%, 64% 36%, 78% 38%, 90% 44%, 98% 55%, 92% 61%, 82% 63%, 72% 62%, 64% 64%, 62% 78%, 56% 90%, 45% 98%, 39% 92%, 37% 82%, 38% 72%, 36% 64%, 22% 62%, 10% 56%, 2% 45%, 8% 39%, 18% 37%, 28% 38%)' :
                             undefined,
                         }}
                       >
                         <div className="w-full h-full flex items-center justify-center text-zinc-800">
                           {displaySettings.defaultPlayerShape === 'circle' && <UserCircle2 className="w-full h-full p-2" />}
                           {displaySettings.defaultPlayerShape === 'square' && <UserCircle2 className="w-full h-full p-2" />}
                           {['oval', 'triangle', 'trapezoid', 'octagon', 'star', 'pentagon', 'hexagon', 'diamond', 'shield', 'cross', 'heart', 'crescent', 'werewolfCard'].includes(displaySettings.defaultPlayerShape || 'circle') && (
                             <div className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-zinc-400 opacity-30 uppercase tracking-widest select-none">Aperçu</div>
                           )}
                         </div>

                         {/* Live Badges Preview */}
                         {Object.entries(displaySettings.playerBadges || {}).map(([corner, config]: [string, any]) => {
                           if (config.type === 'none') return null;
                           return (
                             <BadgePreview key={corner} corner={corner} config={config}>
                               {config.type === 'team' && <div className="w-full h-full bg-blue-500" />}
                               {config.type === 'lives' && '3'}
                               {config.type === 'votes' && '1'}
                               {config.type === 'points' && '10'}
                               {config.type === 'uses' && '2'}
                               {config.type === 'callOrderDay' && '1'}
                               {config.type === 'callOrderNight' && '2'}
                               {config.type === 'creationOrder' && '1'}
                               {config.type === 'sleeping' && <Moon size={12} />}
                               {config.type === 'connection' && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                             </BadgePreview>
                           );
                         })}
                       </div>
                     </div>

                     {/* 4 Corner Selectors */}
                     <div className="grid grid-cols-2 gap-x-32 gap-y-24 sm:gap-x-48">
                       {[
                         { key: 'topLeft', label: 'Haut Gauche' },
                         { key: 'topRight', label: 'Haut Droite' },
                         { key: 'bottomLeft', label: 'Bas Gauche' },
                         { key: 'bottomRight', label: 'Bas Droite' }
                       ].map(corner => {
                         const badgeKey = corner.key as keyof typeof displaySettings.playerBadges;
                         const badge = displaySettings.playerBadges?.[badgeKey] || { type: 'none', bgColor: '#000', textColor: '#fff' };

                         const updateBadge = (updates: Partial<BadgeConfig>) => {
                           updateDisplaySettings({
                             playerBadges: {
                               ...displaySettings.playerBadges,
                               [badgeKey]: { ...badge, ...updates }
                             }
                           });
                         };

                         const isLeft = corner.key.endsWith('Left');

                         return (
                           <div key={corner.key} className={`flex flex-col gap-2 p-3 bg-muted/40 backdrop-blur-sm rounded-xl border border-border/60 hover:border-primary/40 transition-all shadow-sm ${isLeft ? 'items-start' : 'items-end'}`}>
                             <label htmlFor={`settings-badge-${corner.key}`} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground cursor-pointer">{corner.label}</label>
                             <div className="flex items-center gap-2 w-full">
                               <select
                                 id={`settings-badge-${corner.key}`}
                                 value={badge.type}
                                 onChange={(e) => updateBadge({ type: e.target.value as BadgeType })}
                                 className="flex-1 min-w-0 bg-background border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                               >
                                 <option value="none">-- Vide --</option>
                                 <option value="team">Équipe</option>
                                 <option value="lives">Vie</option>
                                 <option value="votes">Voix</option>
                                 <option value="points">Pts</option>
                                 <option value="uses">Uses</option>
                                 <option value="callOrderDay">Appel J</option>
                                 <option value="callOrderNight">Appel N</option>
                                 <option value="connection">Status</option>
                                 <option value="creationOrder">Classement</option>
                                 <option value="sleeping">Éveillé</option>
                               </select>

                               {badge.type !== 'none' && badge.type !== 'team' && badge.type !== 'connection' && badge.type !== 'sleeping' && (
                                 <div className="flex items-center gap-1 shrink-0">
                                   <ColorPicker
                                     color={badge.bgColor}
                                     onChange={(c) => updateBadge({ bgColor: c })}
                                     label="Fond"
                                     className="!w-5 !h-5 rounded-full"
                                   />
                                   <ColorPicker
                                     color={badge.textColor}
                                     onChange={(c) => updateBadge({ textColor: c })}
                                     label="Texte"
                                     className="!w-5 !h-5 rounded-full"
                                   />
                                 </div>
                               )}
                             </div>

                             {badge.type === 'sleeping' && (
                               <div className="flex flex-col gap-2 p-2 bg-background/50 rounded-lg border border-border/30 mt-2 w-full animate-in slide-in-from-top-1 duration-200">
                                 <div className="flex flex-col gap-1.5">
                                   <div className="flex items-center justify-between px-0.5">
                                     <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">Réveillé</span>
                                     <div className="flex items-center gap-1.5">
                                       <ColorPicker
                                         color={badge.awakeBgColor || '#fbbf24'}
                                         onChange={(c) => updateBadge({ awakeBgColor: c })}
                                         label="Fond"
                                         className="!w-4 !h-4 rounded-full border border-border/50"
                                       />
                                       <ColorPicker
                                         color={badge.awakeTextColor || '#fff'}
                                         onChange={(c) => updateBadge({ awakeTextColor: c })}
                                         label="Texte"
                                         className="!w-4 !h-4 rounded-full border border-border/50"
                                       />
                                     </div>
                                   </div>
                                   <div className="flex flex-wrap gap-1">
                                     {['Sun', 'Eye', 'Bell', 'User'].map(iconName => (
                                       <button
                                         key={iconName}
                                         onClick={() => updateBadge({ awakeIcon: iconName })}
                                         className={`p-1 rounded hover:bg-primary/20 transition-colors ${badge.awakeIcon === iconName ? 'bg-primary text-white shadow-sm' : 'bg-muted/40 text-muted-foreground'}`}
                                         title={iconName}
                                       >
                                         {React.createElement((icons as any)[iconName], { size: 10 })}
                                       </button>
                                     ))}
                                   </div>
                                 </div>
                                 <div className="flex flex-col gap-1.5 border-t border-border/20 pt-1.5">
                                   <div className="flex items-center justify-between px-0.5">
                                     <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">Dort</span>
                                     <div className="flex items-center gap-1.5">
                                       <ColorPicker
                                         color={badge.sleepingBgColor || '#4f46e5'}
                                         onChange={(c) => updateBadge({ sleepingBgColor: c })}
                                         label="Fond"
                                         className="!w-4 !h-4 rounded-full border border-border/50"
                                       />
                                       <ColorPicker
                                         color={badge.sleepingTextColor || '#fff'}
                                         onChange={(c) => updateBadge({ sleepingTextColor: c })}
                                         label="Texte"
                                         className="!w-4 !h-4 rounded-full border border-border/50"
                                       />
                                     </div>
                                   </div>
                                   <div className="flex flex-wrap gap-1">
                                     {['Moon', 'EyeOff', 'MoonStar', 'BellOff'].map(iconName => (
                                       <button
                                         key={iconName}
                                         onClick={() => updateBadge({ sleepingIcon: iconName })}
                                         className={`p-1 rounded hover:bg-primary/20 transition-colors ${badge.sleepingIcon === iconName ? 'bg-primary text-white shadow-sm' : 'bg-muted/40 text-muted-foreground'}`}
                                         title={iconName}
                                       >
                                         {React.createElement((icons as any)[iconName], { size: 10 })}
                                       </button>
                                     ))}
                                   </div>
                                 </div>
                               </div>
                             )}
                           </div>
                         );
                       })}
                     </div>

                     <p className="mt-8 text-center text-[10px] text-muted-foreground uppercase tracking-tighter opacity-50">
                       Configurez l'affichage des informations directement sur les pions.
                     </p>
                   </div>
                 </div>
               </section>
             </div>
           )}

          {/* TAB: TAGS */}
          {activeTab === 'tags' && (
            <div className="flex flex-col gap-6">

              {/* === LIGNE 1 : COMPORTEMENT + NOM SUR PLATEAU === */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Comportement */}
                <section className="p-4 bg-card/50 border border-border/50 rounded-xl shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-2 mb-3 flex items-center gap-2">
                    <Tag size={15} /> Comportement
                  </h3>
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-2 text-sm cursor-pointer p-2 bg-muted/20 rounded-lg hover:bg-muted/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={displaySettings.autoMergeTags ?? false}
                        onChange={(e) => updateDisplaySettings({ autoMergeTags: e.target.checked })}
                        className="rounded border-border w-4 h-4 text-primary"
                      />
                      Fusion automatique tag → joueur
                    </label>
                    <p className="text-[11px] text-muted-foreground leading-relaxed pl-2">
                      Le glisser-déposer d'un marqueur sur un joueur fusionne sans confirmation.
                    </p>
                  </div>
                </section>

                {/* Nom sur plateau */}
                <section className="p-4 bg-card/50 border border-border/50 rounded-xl shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-2 mb-3 flex items-center gap-2">
                    <Eye size={15} /> Nom sur plateau
                  </h3>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer p-2 bg-muted/20 rounded-lg hover:bg-muted/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={displaySettings.showTagName}
                        onChange={(e) => updateDisplaySettings({ showTagName: e.target.checked })}
                        className="rounded border-border w-4 h-4 text-primary"
                      />
                      Afficher le nom des marqueurs
                    </label>
                    {displaySettings.showTagName && (
                      <div className="grid grid-cols-2 gap-2 ml-2">
                        <label className="flex items-center gap-2 text-xs cursor-pointer p-1.5 bg-muted/5 rounded hover:bg-muted/20 transition-colors">
                          <input
                            type="checkbox"
                            checked={!!displaySettings.showTagNameSeenAsRole}
                            onChange={(e) => updateDisplaySettings({ showTagNameSeenAsRole: e.target.checked })}
                            className="rounded border-border"
                          />
                          Rôle vu comme
                        </label>
                        <label className="flex items-center gap-2 text-xs cursor-pointer p-1.5 bg-muted/5 rounded hover:bg-muted/20 transition-colors">
                          <input
                            type="checkbox"
                            checked={!!displaySettings.showTagNameSeenInTeam}
                            onChange={(e) => updateDisplaySettings({ showTagNameSeenInTeam: e.target.checked })}
                            className="rounded border-border"
                          />
                          Équipe vue comme
                        </label>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* === LIGNE 2 : INFO-BULLE + SMARTPHONE === */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Info-bulle des tags */}
                <section className="p-4 bg-card/50 border border-border/50 rounded-xl shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-2 mb-3 flex items-center gap-2">
                    <MessageSquare size={15} /> Info-Bulle des Tags
                  </h3>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer p-2 bg-muted/20 rounded-lg hover:bg-muted/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={displaySettings.showTagTooltip !== false}
                        onChange={(e) => updateDisplaySettings({ showTagTooltip: e.target.checked })}
                        className="rounded border-border w-4 h-4 text-primary"
                      />
                      Afficher au survol
                    </label>
                    {displaySettings.showTagTooltip !== false && (
                      <div className="grid grid-cols-3 gap-1.5 ml-2">
                        {[
                          { key: 'showTagNameInTooltip', label: 'Nom' },
                          { key: 'showTagCallOrderDay', label: 'Appel J' },
                          { key: 'showTagCallOrderNight', label: 'Appel N' },
                          { key: 'showTagLives', label: 'Vie' },
                          { key: 'showTagVotes', label: 'Votes' },
                          { key: 'showTagPoints', label: 'Pts' },
                          { key: 'showTagUses', label: 'Uses' },
                          { key: 'showTagAutoDelete', label: 'Suppr. auto' },
                          { key: 'showTagSeenAsRole', label: 'Rôle vu' },
                          { key: 'showTagSeenInTeam', label: 'Équipe vue' },
                          { key: 'showTagDescription', label: 'Texte' },
                        ].map(opt => (
                          <label key={opt.key} className="flex items-center gap-1.5 text-[10px] cursor-pointer p-1 rounded hover:bg-muted/20 transition-colors">
                            <input
                              type="checkbox"
                              checked={displaySettings[opt.key as keyof typeof displaySettings] !== false}
                              onChange={(e) => updateDisplaySettings({ [opt.key]: e.target.checked })}
                              className="rounded border-border w-3 h-3"
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </section>

                {/* Action Smartphone */}
                <section className="p-4 bg-card/50 border border-border/50 rounded-xl shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-2 mb-3 flex items-center gap-2">
                    <Smartphone size={15} /> Action Smartphone
                  </h3>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer p-2 bg-muted/20 rounded-lg hover:bg-muted/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={displaySettings.showTagSmartphoneIcon !== false}
                        onChange={(e) => updateDisplaySettings({ showTagSmartphoneIcon: e.target.checked })}
                        className="rounded border-border w-4 h-4 text-primary"
                      />
                      Pastille téléphone sur les tags
                      <div className="bg-blue-500 text-white rounded-full p-0.5 shadow-sm border border-background scale-75">
                        <Smartphone size={8} />
                      </div>
                    </label>
                    <p className="text-[11px] text-muted-foreground leading-relaxed pl-2">
                      Affiche une icône 📱 sur les tags ayant une action smartphone configurée.
                    </p>
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* TAB: SMARTPHONE */}
          {activeTab === 'smartphone' && (
            <div className="flex flex-col gap-6">

              {/* === LIGNE 1 : ONGLET JEU + JOURNAL === */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Onglet Jeu */}
                <section className="p-4 bg-card/50 border border-border/50 rounded-xl shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-2 mb-3 flex items-center gap-2">
                    <Gamepad2 size={15} /> Onglet Jeu
                  </h3>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center justify-between p-2 bg-muted/20 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={displaySettings.smartphoneTabs?.game ?? true}
                          onChange={(e) => updateDisplaySettings({ smartphoneTabs: { ...(displaySettings.smartphoneTabs || { game: true, players: true, room: true, wiki: true }), game: e.target.checked } })}
                          className="rounded border-border w-4 h-4 text-primary"
                        />
                        <span className="text-sm">Onglet Jeu</span>
                      </div>
                      <button
                        onClick={(e) => { e.preventDefault(); setExpandedSmartphone(prev => ({ ...prev, game: !prev.game })) }}
                        className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground"
                      >
                        {expandedSmartphone.game ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    </label>

                    {displaySettings.smartphoneTabs?.game !== false && (
                      <div className="flex flex-col gap-2 ml-2">
                        <label className="flex items-center gap-2 text-xs cursor-pointer p-1.5 bg-muted/5 rounded hover:bg-muted/20 transition-colors">
                          <input
                            type="checkbox"
                            checked={displaySettings.showTimerOnSmartphone ?? true}
                            onChange={(e) => updateDisplaySettings({ showTimerOnSmartphone: e.target.checked })}
                            className="rounded border-border"
                          />
                          Chronomètre
                        </label>

                        {expandedSmartphone.game && (
                          <div className="flex flex-col gap-2 p-2 bg-muted/10 rounded-lg border border-border/30">
                            <div className="flex flex-col gap-1">
                              <label htmlFor="smartphone-image-style" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Style d'image</label>
                              <select
                                id="smartphone-image-style"
                                value={displaySettings.smartphoneImageStyle || 'circle'}
                                onChange={(e) => updateDisplaySettings({ smartphoneImageStyle: e.target.value as any })}
                                className="bg-input border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary w-full"
                              >
                                <option value="circle">Ronde (rognée)</option>
                                <option value="square">Carré (rognée)</option>
                                <option value="original">Originale (entière)</option>
                                <option value="background">Plein écran (floutée)</option>
                                <option value="none">Aucune</option>
                              </select>
                            </div>
                            {displaySettings.smartphoneImageStyle === 'background' && (
                              <div className="flex flex-col gap-2 p-2 bg-muted/20 rounded-lg">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Flou</label>
                                    <span className="text-[10px] text-primary font-mono">{displaySettings.smartphoneImageBlur ?? 20}%</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={displaySettings.smartphoneImageBlur ?? 20}
                                    onChange={(e) => updateDisplaySettings({ smartphoneImageBlur: parseInt(e.target.value) })}
                                    className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Hauteur min (px)</label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="1000"
                                    value={displaySettings.smartphoneImageMinHeight || 400}
                                    onChange={(e) => updateDisplaySettings({ smartphoneImageMinHeight: parseInt(e.target.value) })}
                                    className="bg-input border border-border rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary w-20"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </section>

                {/* Onglet Journal */}
                <section className="p-4 bg-card/50 border border-border/50 rounded-xl shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-2 mb-3 flex items-center gap-2">
                    <FileText size={15} /> Autres Onglets
                  </h3>
                  <div className="flex flex-col gap-2">
                    {[
                      { key: 'logs', label: 'Journal', icon: FileText },
                      { key: 'handouts', label: 'Documents', icon: ImageIcon },
                    ].map(tab => (
                      <label key={tab.key} className="flex items-center gap-2 text-sm cursor-pointer p-2 bg-muted/10 rounded-lg hover:bg-muted/30 transition-colors">
                        <input
                          type="checkbox"
                          checked={displaySettings.smartphoneTabs?.[tab.key as keyof typeof displaySettings.smartphoneTabs] ?? true}
                          onChange={(e) => updateDisplaySettings({ smartphoneTabs: { ...(displaySettings.smartphoneTabs || {}), [tab.key]: e.target.checked } })}
                          className="rounded border-border w-4 h-4 text-primary"
                        />
                        <tab.icon size={14} className="text-muted-foreground" />
                        {tab.label}
                      </label>
                    ))}
                  </div>
                </section>
              </div>

              {/* === LIGNE 2 : JEU + SALLES === */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Onglet Joueurs */}
                <section className="p-4 bg-card/50 border border-border/50 rounded-xl shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-2 mb-3 flex items-center gap-2">
                    <Users size={15} /> Onglet Joueurs
                  </h3>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center justify-between p-2 bg-muted/20 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={displaySettings.smartphoneTabs?.players ?? true}
                          onChange={(e) => updateDisplaySettings({ smartphoneTabs: { ...(displaySettings.smartphoneTabs || { game: true, players: true, room: true, wiki: true }), players: e.target.checked } })}
                          className="rounded border-border w-4 h-4 text-primary"
                        />
                        <span className="text-sm">Onglet Joueurs</span>
                      </div>
                      <button
                        onClick={(e) => { e.preventDefault(); setExpandedSmartphone(prev => ({ ...prev, players: !prev.players })) }}
                        className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground"
                      >
                        {expandedSmartphone.players ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    </label>

                    {displaySettings.smartphoneTabs?.players !== false && expandedSmartphone.players && (
                      <div className="flex flex-col gap-2 ml-2 p-2 bg-muted/10 rounded-lg border border-border/30">
                        {[
                          { key: 'allowPrivateNotes', label: 'Notes privées' },
                          { key: 'showDeadPlayers', label: 'Afficher les morts' },
                          { key: 'includeSelf', label: 'Inclure soi-même' },
                          { key: 'allowNotesForDeadPlayers', label: 'Notes aux morts', sub: true },
                          { key: 'showNotePreview', label: 'Aperçu sous le nom', sub: true },
                        ].map(opt => (
                          <label key={opt.key} className={`flex items-center gap-2 text-xs cursor-pointer p-1.5 rounded hover:bg-muted/20 transition-colors ${opt.sub ? 'ml-4 border-l border-border/30 pl-3' : 'bg-muted/5'}`}>
                            <input
                              type="checkbox"
                              checked={displaySettings.smartphonePlayersOptions?.[opt.key as keyof NonNullable<typeof displaySettings.smartphonePlayersOptions>] ?? true}
                              onChange={(e) => updateDisplaySettings({ smartphonePlayersOptions: { ...(displaySettings.smartphonePlayersOptions || { allowPrivateNotes: true, showDeadPlayers: true, includeSelf: true, allowNotesForDeadPlayers: true, showNotePreview: true }), [opt.key]: e.target.checked } })}
                              className="rounded border-border"
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </section>

                {/* Onglet Salle */}
                <section className="p-4 bg-card/50 border border-border/50 rounded-xl shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-2 mb-3 flex items-center gap-2">
                    <Map size={15} /> Onglet Salle
                  </h3>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center justify-between p-2 bg-muted/20 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={displaySettings.smartphoneTabs?.room ?? true}
                          onChange={(e) => updateDisplaySettings({ smartphoneTabs: { ...(displaySettings.smartphoneTabs || { game: true, players: true, room: true, wiki: true }), room: e.target.checked } })}
                          className="rounded border-border w-4 h-4 text-primary"
                        />
                        <span className="text-sm">Onglet Salle</span>
                      </div>
                      <button
                        onClick={(e) => { e.preventDefault(); setExpandedSmartphone(prev => ({ ...prev, room: !prev.room })) }}
                        className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground"
                      >
                        {expandedSmartphone.room ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    </label>

                    {displaySettings.smartphoneTabs?.room !== false && expandedSmartphone.room && (
                      <div className="flex flex-col gap-2 ml-2 p-2 bg-muted/10 rounded-lg border border-border/30">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Icône joueur</label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="url"
                              value={displaySettings.roomMiniaturePlayerIconUrl || ''}
                              onChange={(e) => updateDisplaySettings({ roomMiniaturePlayerIconUrl: e.target.value || null })}
                              placeholder="URL (défaut: image joueur)..."
                              className="flex-1 bg-input border border-border rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/40"
                            />
                            {displaySettings.roomMiniaturePlayerIconUrl && (
                              <button
                                onClick={() => updateDisplaySettings({ roomMiniaturePlayerIconUrl: null })}
                                className="px-2 py-1 text-[10px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Icône mort (overlay)</label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="url"
                              value={displaySettings.roomMiniatureDeadIconUrl || ''}
                              onChange={(e) => updateDisplaySettings({ roomMiniatureDeadIconUrl: e.target.value || null })}
                              placeholder="URL..."
                              className="flex-1 bg-input border border-border rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/40"
                            />
                            {displaySettings.roomMiniatureDeadIconUrl && (
                              <button
                                onClick={() => updateDisplaySettings({ roomMiniatureDeadIconUrl: null })}
                                className="px-2 py-1 text-[10px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <label className="flex items-center gap-2 text-xs cursor-pointer p-1.5 bg-muted/5 rounded hover:bg-muted/20 transition-colors">
                            <input
                              type="checkbox"
                              checked={displaySettings.roomMiniatureSelfAnimation ?? true}
                              onChange={(e) => updateDisplaySettings({ roomMiniatureSelfAnimation: e.target.checked })}
                              className="rounded border-border"
                            />
                            Anim. moi
                          </label>
                          <label className="flex items-center gap-2 text-xs cursor-pointer p-1.5 bg-muted/5 rounded hover:bg-muted/20 transition-colors">
                            <input
                              type="checkbox"
                              checked={displaySettings.roomMiniatureAnimation ?? true}
                              onChange={(e) => updateDisplaySettings({ roomMiniatureAnimation: e.target.checked })}
                              className="rounded border-border"
                            />
                            Anim. autres
                          </label>
                        </div>

                        <div className="border-t border-border/30 pt-2 mt-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Miniature de la salle</label>
                          <div className="flex gap-2 items-center mt-1">
                            <input
                              type="url"
                              value={room.minimapImageUrl || ''}
                              onChange={(e) => setRoom({ minimapImageUrl: e.target.value || null })}
                              placeholder="https://i.imgur.com/..."
                              className="flex-1 bg-input border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/40"
                            />
                            {room.minimapImageUrl && (
                              <button
                                onClick={() => setRoom({ minimapImageUrl: null })}
                                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                          {room.minimapImageUrl && (
                            <div className="w-full h-20 mt-2 rounded-lg overflow-hidden border border-border bg-zinc-900 shadow-inner">
                              <img src={room.minimapImageUrl} alt="Aperçu" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* === LIGNE 3 : WIKI (pleine largeur) === */}
              <section className="p-4 bg-card/50 border border-border/50 rounded-xl shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-2 mb-3 flex items-center gap-2">
                  <Book size={15} /> Onglet Wiki
                </h3>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center justify-between p-2 bg-muted/20 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={displaySettings.smartphoneTabs?.wiki ?? true}
                        onChange={(e) => updateDisplaySettings({ smartphoneTabs: { ...(displaySettings.smartphoneTabs || { game: true, players: true, room: true, wiki: true }), wiki: e.target.checked } })}
                        className="rounded border-border w-4 h-4 text-primary"
                      />
                      <span className="text-sm">Onglet Wiki</span>
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); setExpandedSmartphone(prev => ({ ...prev, wiki: !prev.wiki })) }}
                      className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground"
                    >
                      {expandedSmartphone.wiki ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  </label>

                  {displaySettings.smartphoneTabs?.wiki !== false && expandedSmartphone.wiki && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-2 p-3 bg-muted/10 rounded-lg border border-border/30">
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 text-sm cursor-pointer p-1.5 bg-muted/5 rounded hover:bg-muted/20 transition-colors">
                          <input
                            type="checkbox"
                            checked={displaySettings.showWikiNotes ?? true}
                            onChange={(e) => updateDisplaySettings({ showWikiNotes: e.target.checked })}
                            className="rounded border-border w-4 h-4 text-primary"
                          />
                          Notes
                        </label>
                        <div className="flex flex-col gap-1.5 ml-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Titre</label>
                            <input
                              type="text"
                              value={displaySettings.wikiTitle || 'Règles du jeu'}
                              onChange={(e) => updateDisplaySettings({ wikiTitle: e.target.value })}
                              placeholder="Ex: Règles du jeu"
                              className="bg-input border border-border rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary w-full"
                            />
                          </div>
                          <label className="flex items-center gap-2 text-xs cursor-pointer p-1 rounded hover:bg-muted/20 transition-colors">
                            <input
                              type="checkbox"
                              checked={displaySettings.wikiLightMode || false}
                              onChange={(e) => updateDisplaySettings({ wikiLightMode: e.target.checked })}
                              className="rounded border-border"
                            />
                            Fond clair
                          </label>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {[
                          { key: 'showWikiRoles', label: 'Rôles' },
                          { key: 'showWikiTags', label: 'Tags' },
                          { key: 'showWikiTeams', label: 'Équipes' },
                        ].map(opt => (
                          <label key={opt.key} className="flex items-center gap-2 text-sm cursor-pointer p-1.5 bg-muted/5 rounded hover:bg-muted/20 transition-colors">
                            <input
                              type="checkbox"
                              checked={(displaySettings[opt.key as keyof typeof displaySettings] as boolean) ?? true}
                              onChange={(e) => updateDisplaySettings({ [opt.key]: e.target.checked })}
                              className="rounded border-border w-4 h-4 text-primary"
                            />
                            {opt.label}
                          </label>
                        ))}
                        <div className="flex flex-col gap-1.5 ml-4 border-l border-border/30 pl-3">
                          <label className="flex items-center gap-2 text-xs cursor-pointer p-1 rounded hover:bg-muted/20 transition-colors">
                            <input
                              type="checkbox"
                              checked={displaySettings.wikiOnlySelectedRoles || false}
                              onChange={(e) => updateDisplaySettings({ wikiOnlySelectedRoles: e.target.checked })}
                              className="rounded border-border"
                            />
                            Rôles sélectionnés uniquement
                          </label>
                          <label className="flex items-center gap-2 text-xs cursor-pointer p-1 rounded hover:bg-muted/20 transition-colors">
                            <input
                              type="checkbox"
                              checked={displaySettings.wikiOnlyInPlayRoles || false}
                              onChange={(e) => updateDisplaySettings({ wikiOnlyInPlayRoles: e.target.checked })}
                              className="rounded border-border"
                            />
                            Rôles en jeu uniquement
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {/* TAB: REMOTE */}
          {activeTab === 'remote' && (
            <div className="flex flex-col gap-6">

              {/* === LIGNE 1 : CONNEXION === */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Activation */}
                <section className="p-4 bg-card/50 border border-border/50 rounded-xl shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-2 mb-3 flex items-center gap-2">
                    <Radio size={15} /> Connexion
                  </h3>
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer p-2 bg-muted/20 rounded-lg hover:bg-muted/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={soundboard.remoteEnabled || false}
                        onChange={(e) => setSoundboard({ remoteEnabled: e.target.checked })}
                        className="rounded border-border w-4 h-4 text-primary"
                      />
                      Activer le portail Soundboard
                    </label>
                    <p className="text-[11px] text-muted-foreground leading-relaxed pl-2">
                      L'URL <code className="px-1 py-0.5 bg-muted rounded text-xs">/remote</code> permettra de contrôler la boîte à sons et la checklist à distance.
                    </p>

                    {soundboard.remoteEnabled && (
                      <div className="flex flex-col gap-2 p-2 bg-muted/10 rounded-lg border border-border/30">
                        <label htmlFor="remote-passcode" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Code d'accès</label>
                        <input
                          id="remote-passcode"
                          type="text"
                          value={soundboard.remotePasscode || ''}
                          onChange={(e) => setSoundboard({ remotePasscode: e.target.value })}
                          className="bg-input border border-border rounded-lg px-3 py-1.5 text-sm font-mono tracking-widest outline-none focus:ring-1 focus:ring-primary w-full"
                          placeholder="EX: 1234"
                        />
                      </div>
                    )}
                  </div>
                </section>

                {/* Modules affichés */}
                <section className="p-4 bg-card/50 border border-border/50 rounded-xl shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-2 mb-3 flex items-center gap-2">
                    <Monitor size={15} /> Modules affichés
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'remoteShowSounds', label: 'Sons', icon: Music },
                      { key: 'remoteShowTasks', label: 'Tâches', icon: CheckSquare },
                      { key: 'remoteShowHandouts', label: 'Aides', icon: FileText },
                      { key: 'remoteShowActions', label: 'Actions', icon: Zap },
                    ].map(opt => (
                      <label key={opt.key} className="flex items-center gap-2 text-sm cursor-pointer p-2 bg-muted/10 rounded-lg hover:bg-muted/30 transition-colors">
                        <input
                          type="checkbox"
                          checked={soundboard[opt.key as keyof typeof soundboard] as boolean ?? true}
                          onChange={(e) => setSoundboard({ [opt.key]: e.target.checked })}
                          className="rounded border-border w-4 h-4 text-primary"
                        />
                        <opt.icon size={13} className="text-muted-foreground" />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </section>
              </div>

              {/* === LIGNE 2 : JOUEURS === */}
              <section className="p-4 bg-card/50 border border-border/50 rounded-xl shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-2 mb-3 flex items-center gap-2">
                  <Users size={15} /> Joueurs sur la Télécommande
                </h3>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer p-2 bg-muted/20 rounded-lg hover:bg-muted/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={soundboard.remoteShowPlayers || false}
                      onChange={(e) => setSoundboard({ remoteShowPlayers: e.target.checked })}
                      className="rounded border-border w-4 h-4 text-primary"
                    />
                    Afficher les joueurs
                  </label>

                  {soundboard.remoteShowPlayers && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-2 p-2 bg-muted/10 rounded-lg border border-border/30">
                      <label className="flex items-center gap-2 text-xs cursor-pointer p-1.5 bg-muted/5 rounded hover:bg-muted/20 transition-colors">
                        <input
                          type="checkbox"
                          checked={soundboard.remoteShowDeadPlayers || false}
                          onChange={(e) => setSoundboard({ remoteShowDeadPlayers: e.target.checked })}
                          className="rounded border-border"
                        />
                        Afficher les morts
                      </label>
                      <label className="flex items-center gap-2 text-xs cursor-pointer p-1.5 bg-muted/5 rounded hover:bg-muted/20 transition-colors">
                        <input
                          type="checkbox"
                          checked={soundboard.remoteAllowPrivateNotes || false}
                          onChange={(e) => setSoundboard({ remoteAllowPrivateNotes: e.target.checked })}
                          className="rounded border-border"
                        />
                        Notes privées (même aux morts)
                      </label>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {/* TAB: OUTILS */}
          {activeTab === 'outils' && (
            <div className="flex flex-col gap-6">

              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center gap-3">
                <icons.Info size={18} className="text-blue-400 shrink-0" />
                <p className="text-xs text-blue-200">
                  Cochez les modules à afficher dans le panneau latéral. Glissez-déposez pour réorganiser l'ordre.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {(displaySettings.panels?.panelsOrder || DEFAULT_PANELS_ORDER).map(key => {
                  const label = TOOL_LABELS[key];
                  if (!label) return null;
                  return (
                    <div
                      key={key}
                      className={`transition-all ${draggedTool === key ? 'opacity-50' : ''}`}
                      draggable
                      onDragStart={(e) => handleToolDragStart(e, key)}
                      onDragOver={(e) => handleToolDragOver(e, key)}
                      onDragEnd={handleToolDragEnd}
                    >
                      <section className="p-4 bg-card/50 border border-border/50 rounded-xl shadow-sm group">
                        <div className="flex items-center gap-3">
                          <icons.GripVertical size={16} className="text-muted-foreground cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          <label className="flex items-center gap-2 flex-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={((displaySettings.panels || {}) as any)[key] ?? true}
                              onChange={(e) => updateDisplaySettings({
                                panels: {
                                  ...(displaySettings.panels || {}),
                                  [key]: e.target.checked
                                } as any
                              })}
                              className="rounded border-border w-4 h-4 text-primary"
                            />
                            <span className="font-semibold text-sm">{label}</span>
                          </label>
                          {['distribution', 'chrono', 'wiki', 'soundboard', 'scoreboard', 'logs', 'tagDistributor', 'magneticPoints'].includes(key) && ((displaySettings.panels || {}) as any)[key] !== false && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setExpandedOutils(prev => ({ ...prev, [key]: !prev[key] }));
                              }}
                              className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground"
                            >
                              {expandedOutils[key as keyof typeof expandedOutils] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                          )}
                        </div>

                        {/* Distribution sub-options */}
                        {key === 'distribution' && (displaySettings.panels?.distribution ?? true) && expandedOutils.distribution && (
                          <div className="mt-3 pt-3 border-t border-border/30">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {[
                                { key: 'distributionResurrectAll', label: 'Ressusciter tous' },
                                { key: 'distributionDeleteTags', label: 'Supprimer tags' },
                                { key: 'distributionRemovePastilles', label: 'Enlever pastilles' },
                                { key: 'distributionResetPhase', label: 'Reset phase (J1)' },
                                { key: 'distributionResetLives', label: 'Reset Vie' },
                                { key: 'distributionResetPoints', label: 'Reset Points' },
                                { key: 'distributionResetVotes', label: 'Reset Votes' },
                                { key: 'distributionDeletePrivateNotes', label: 'Suppr. notes privées' },
                                { key: 'distributionDeletePublicNotes', label: 'Suppr. notes publiques' },
                              ].map(sub => (
                                <label key={sub.key} className="flex items-center gap-2 text-xs cursor-pointer p-1.5 bg-muted/10 rounded hover:bg-muted/20 transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={(displaySettings as any)[sub.key] ?? true}
                                    onChange={(e) => updateDisplaySettings({ [sub.key]: e.target.checked })}
                                    className="rounded border-border w-3.5 h-3.5"
                                  />
                                  {sub.label}
                                </label>
                              ))}
                            </div>
                            <div className="flex flex-col gap-1.5 mt-3 p-2 bg-muted/10 rounded-lg">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Exécuter une action</label>
                              <select
                                value={displaySettings.distributionActionId || ''}
                                onChange={(e) => updateDisplaySettings({ distributionActionId: e.target.value || null })}
                                className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary w-full"
                              >
                                <option value="">Sélectionner...</option>
                                {actions.map(action => (
                                  <option key={action.id} value={action.id}>{action.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}

                        {/* Chrono sub-options */}
                        {key === 'chrono' && (displaySettings.panels?.chrono ?? true) && expandedOutils.chrono && (
                          <div className="mt-3 pt-3 border-t border-border/30">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Minutes</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="99"
                                  value={displaySettings.timerDefaultMinutes ?? 5}
                                  onChange={(e) => updateDisplaySettings({ timerDefaultMinutes: Math.max(0, parseInt(e.target.value) || 0) })}
                                  className="w-20 bg-background border border-border rounded-lg px-2 py-1.5 text-sm text-center font-mono font-bold outline-none focus:ring-1 focus:ring-primary"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Secondes</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="59"
                                  value={displaySettings.timerDefaultSeconds ?? 0}
                                  onChange={(e) => updateDisplaySettings({ timerDefaultSeconds: Math.max(0, parseInt(e.target.value) || 0) })}
                                  className="w-20 bg-background border border-border rounded-lg px-2 py-1.5 text-sm text-center font-mono font-bold outline-none focus:ring-1 focus:ring-primary"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Son de fin</label>
                                <div className="flex gap-1.5">
                                  <input
                                    type="text"
                                    value={displaySettings.timerEndSoundUrl || ''}
                                    onChange={(e) => updateDisplaySettings({ timerEndSoundUrl: e.target.value })}
                                    placeholder="URL..."
                                    className="flex-1 bg-background border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/40"
                                  />
                                  <input
                                    type="file"
                                    ref={timerSoundInputRef}
                                    onChange={handleTimerSoundUpload}
                                    className="hidden"
                                    accept="audio/*"
                                  />
                                  <button
                                    onClick={() => timerSoundInputRef.current?.click()}
                                    className="p-1.5 bg-muted border border-border rounded-lg hover:bg-accent transition-colors"
                                  >
                                    <Music size={14} />
                                  </button>
                                  {displaySettings.timerEndSoundUrl && (
                                    <button
                                      onClick={() => updateDisplaySettings({ timerEndSoundUrl: null })}
                                      className="p-1.5 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg hover:bg-destructive hover:text-white transition-colors"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                            <label className="flex items-center gap-2 text-xs cursor-pointer p-1.5 mt-2 bg-muted/5 rounded hover:bg-muted/20 transition-colors w-fit">
                              <input
                                type="checkbox"
                                checked={displaySettings.showTimerOnSmartphone ?? true}
                                onChange={(e) => updateDisplaySettings({ showTimerOnSmartphone: e.target.checked })}
                                className="rounded border-border"
                              />
                              Afficher sur smartphone
                            </label>
                          </div>
                        )}

                        {/* Wiki sub-options */}
                        {key === 'wiki' && (displaySettings.panels?.wiki ?? true) && expandedOutils.wiki && (
                          <div className="mt-3 pt-3 border-t border-border/30">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="flex flex-col gap-2">
                                <label className="flex items-center gap-2 text-sm cursor-pointer p-1.5 bg-muted/5 rounded hover:bg-muted/20 transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={displaySettings.showWikiNotes ?? true}
                                    onChange={(e) => updateDisplaySettings({ showWikiNotes: e.target.checked })}
                                    className="rounded border-border"
                                  />
                                  Notes
                                </label>
                                <div className="flex flex-col gap-1.5 ml-4">
                                  <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Titre</label>
                                    <input
                                      type="text"
                                      value={displaySettings.wikiTitle || 'Règles du jeu'}
                                      onChange={(e) => updateDisplaySettings({ wikiTitle: e.target.value })}
                                      placeholder="Ex: Règles du jeu"
                                      className="bg-input border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary w-full"
                                    />
                                  </div>
                                  <label className="flex items-center gap-2 text-xs cursor-pointer p-1 rounded hover:bg-muted/20 transition-colors">
                                    <input
                                      type="checkbox"
                                      checked={displaySettings.wikiLightMode || false}
                                      onChange={(e) => updateDisplaySettings({ wikiLightMode: e.target.checked })}
                                      className="rounded border-border"
                                    />
                                    Fond clair
                                  </label>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                {[
                                  { key: 'showWikiRoles', label: 'Rôles' },
                                  { key: 'showWikiTags', label: 'Tags' },
                                  { key: 'showWikiTeams', label: 'Équipes' },
                                ].map(opt => (
                                  <label key={opt.key} className="flex items-center gap-2 text-sm cursor-pointer p-1.5 bg-muted/5 rounded hover:bg-muted/20 transition-colors">
                                    <input
                                      type="checkbox"
                                      checked={(displaySettings[opt.key as keyof typeof displaySettings] as boolean) ?? true}
                                      onChange={(e) => updateDisplaySettings({ [opt.key]: e.target.checked })}
                                      className="rounded border-border"
                                    />
                                    {opt.label}
                                  </label>
                                ))}
                                <div className="flex flex-col gap-1.5 ml-4 border-l border-border/30 pl-3">
                                  <label className="flex items-center gap-2 text-xs cursor-pointer p-1 rounded hover:bg-muted/20 transition-colors">
                                    <input
                                      type="checkbox"
                                      checked={displaySettings.wikiOnlySelectedRoles || false}
                                      onChange={(e) => updateDisplaySettings({ wikiOnlySelectedRoles: e.target.checked })}
                                      className="rounded border-border"
                                    />
                                    Rôles sélectionnés uniquement
                                  </label>
                                  <label className="flex items-center gap-2 text-xs cursor-pointer p-1 rounded hover:bg-muted/20 transition-colors">
                                    <input
                                      type="checkbox"
                                      checked={displaySettings.wikiOnlyInPlayRoles || false}
                                      onChange={(e) => updateDisplaySettings({ wikiOnlyInPlayRoles: e.target.checked })}
                                      className="rounded border-border"
                                    />
                                    Rôles en jeu uniquement
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Scoreboard sub-options */}
                        {key === 'scoreboard' && (displaySettings.panels?.scoreboard ?? true) && expandedOutils.scoreboard && (
                          <div className="mt-3 pt-3 border-t border-border/30 flex flex-col gap-3">
                            <div className="flex items-center gap-4 flex-wrap pb-2 border-b border-border/30">
                              <label className="flex items-center gap-2 text-xs cursor-pointer font-semibold">
                                <input
                                  type="checkbox"
                                  checked={scoreboard.showTable ?? true}
                                  onChange={(e) => setScoreboard({ showTable: e.target.checked })}
                                  className="rounded border-border"
                                />
                                <Table size={12} /> Afficher le tableau
                              </label>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                              {[
                                { key: 'showRoles', label: 'Rôle' },
                                { key: 'showPoints', label: 'Points' },
                                { key: 'showLives', label: 'Vie' },
                                { key: 'showVotes', label: 'Votes' },
                                { key: 'showStatus', label: 'Statut' },
                              ].map(col => (
                                <label key={col.key} className="flex items-center gap-2 text-xs cursor-pointer p-1.5 bg-muted/10 rounded hover:bg-muted/20 transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={(scoreboard as any)[col.key] ?? true}
                                    onChange={(e) => setScoreboard({ [col.key]: e.target.checked })}
                                    className="rounded border-border"
                                  />
                                  {col.label}
                                </label>
                              ))}
                            </div>
                            <div className="flex items-center gap-4 flex-wrap">
                              <label className="flex items-center gap-2 text-xs cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={scoreboard.showPodium ?? true}
                                  onChange={(e) => setScoreboard({ showPodium: e.target.checked })}
                                  className="rounded border-border"
                                />
                                <Trophy size={12} className="text-yellow-500" /> Podium Top 3
                              </label>
                              <label className="flex items-center gap-2 text-xs cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={scoreboard.showLifeBar ?? true}
                                  onChange={(e) => setScoreboard({ showLifeBar: e.target.checked })}
                                  className="rounded border-border"
                                />
                                <Heart size={12} className="text-red-500" fill="currentColor" /> Barre de vie
                              </label>
                            </div>
                          </div>
                        )}

                        {/* Logs sub-options */}
                        {key === 'logs' && (displaySettings.panels?.logs ?? true) && expandedOutils.logs && (
                          <div className="mt-3 pt-3 border-t border-border/30 flex flex-col gap-3">
                            <label className="flex items-center gap-2 text-sm cursor-pointer p-2 bg-muted/10 rounded-lg hover:bg-muted/20 transition-colors">
                              <input
                                type="checkbox"
                                checked={displaySettings.recordLogs ?? true}
                                onChange={(e) => updateDisplaySettings({ recordLogs: e.target.checked })}
                                className="rounded border-border w-4 h-4"
                              />
                              {displaySettings.recordLogs ?? true ? 'Écoute activée' : 'Écoute désactivée'}
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer p-2 bg-muted/10 rounded-lg hover:bg-muted/20 transition-colors">
                              <input
                                type="checkbox"
                                checked={displaySettings.persistLogs ?? true}
                                onChange={(e) => updateDisplaySettings({ persistLogs: e.target.checked })}
                                className="rounded border-border w-4 h-4"
                              />
                              Persistance localStorage (sauvegarde auto)
                            </label>
                            <div className="flex flex-col gap-2 p-2 bg-muted/10 rounded-lg">
                              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Max logs: {logsSettings.maxLogs}
                              </label>
                              <input
                                type="range"
                                min="50"
                                max="500"
                                step="50"
                                value={logsSettings.maxLogs}
                                onChange={(e) => setLogsSettings({ maxLogs: parseInt(e.target.value) })}
                                className="w-full accent-primary"
                              />
                              <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>50</span>
                                <span>500</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Tag Distributor sub-options */}
                        {key === 'tagDistributor' && (displaySettings.panels?.tagDistributor ?? true) && expandedOutils.tagDistributor && (
                          <div className="mt-3 pt-3 border-t border-border/30 flex flex-col gap-3">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                  <Grid3X3 size={10} /> Colonnes (défaut)
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  max="6"
                                  value={displaySettings.tagDistributorDefaultCols ?? 2}
                                  onChange={(e) => updateDisplaySettings({ tagDistributorDefaultCols: Math.max(1, Math.min(6, parseInt(e.target.value) || 2)) })}
                                  className="w-20 bg-background border border-border rounded-lg px-2 py-1.5 text-sm text-center font-bold outline-none focus:ring-1 focus:ring-primary"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mode d'affichage</label>
                                <select
                                  value={displaySettings.tagDistributorDefaultMode || 'detailed'}
                                  onChange={(e) => updateDisplaySettings({ tagDistributorDefaultMode: e.target.value as 'detailed' | 'compact' })}
                                  className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                                >
                                  <option value="detailed">Détaillé</option>
                                  <option value="compact">Compact</option>
                                </select>
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tri par défaut</label>
                                <select
                                  value={displaySettings.tagDistributorDefaultSort || 'order'}
                                  onChange={(e) => updateDisplaySettings({ tagDistributorDefaultSort: e.target.value as 'order' | 'alpha' })}
                                  className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                                >
                                  <option value="order">Ordre personnalisé</option>
                                  <option value="alpha">Alphabétique</option>
                                </select>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-3 pt-2 border-t border-border/30">
                              <label className="flex items-center gap-2 text-xs cursor-pointer p-2 bg-muted/5 rounded-lg hover:bg-muted/20 transition-colors">
                                <input
                                  type="checkbox"
                                  checked={displaySettings.tagDistributorShowCount ?? true}
                                  onChange={(e) => updateDisplaySettings({ tagDistributorShowCount: e.target.checked })}
                                  className="rounded border-border"
                                />
                                Afficher le compteur de tags
                              </label>
                              <label className="flex items-center gap-2 text-xs cursor-pointer p-2 bg-muted/5 rounded-lg hover:bg-muted/20 transition-colors">
                                <input
                                  type="checkbox"
                                  checked={displaySettings.tagDistributorAutoDetach ?? false}
                                  onChange={(e) => updateDisplaySettings({ tagDistributorAutoDetach: e.target.checked })}
                                  className="rounded border-border"
                                />
                                Détachement auto à l'ouverture
                              </label>
                            </div>

                            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                              <p className="text-[10px] text-blue-200 flex items-start gap-2">
                                <Info size={12} className="shrink-0 mt-0.5" />
                                Ces paramètres s'appliquent à la fenêtre flottante du Distributeur de Tags. Vous pouvez aussi modifier le nombre de colonnes directement dans la fenêtre.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Magnetic Points sub-options */}
                        {key === 'magneticPoints' && (displaySettings.panels?.magneticPoints ?? true) && expandedOutils.magneticPoints && (
                          <div className="mt-3 pt-3 border-t border-border/30">
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center gap-3">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Couleur</label>
                                <div className="flex items-center gap-2">
                                  <ColorPicker
                                    color={displaySettings.magneticPointsColor || '#3b82f6'}
                                    onChange={(c) => updateDisplaySettings({ magneticPointsColor: c })}
                                    label="Couleur"
                                    className="!w-6 !h-6 rounded-lg border border-border/50"
                                  />
                                  <span className="text-[10px] font-mono text-muted-foreground">{displaySettings.magneticPointsColor || '#3B82F6'}</span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <label className="flex items-center gap-2 text-xs cursor-pointer p-1.5 bg-muted/5 rounded hover:bg-muted/20 transition-colors">
                                  <input
                                    type="radio"
                                    checked={displaySettings.magneticPointsSnapMode === 'nearest' || !displaySettings.magneticPointsSnapMode}
                                    onChange={() => updateDisplaySettings({ magneticPointsSnapMode: 'nearest' })}
                                    className="rounded-full border-border"
                                  />
                                  Joueur le plus proche
                                </label>
                                <label className="flex items-center gap-2 text-xs cursor-pointer p-1.5 bg-muted/5 rounded hover:bg-muted/20 transition-colors">
                                  <input
                                    type="radio"
                                    checked={displaySettings.magneticPointsSnapMode === 'order'}
                                    onChange={() => updateDisplaySettings({ magneticPointsSnapMode: 'order' })}
                                    className="rounded-full border-border"
                                  />
                                  Ordre des joueurs
                                </label>
                                <label className="flex items-center gap-2 text-xs cursor-pointer p-1.5 bg-muted/5 rounded hover:bg-muted/20 transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={displaySettings.magneticPointsFreeSnap ?? false}
                                    onChange={(e) => updateDisplaySettings({ magneticPointsFreeSnap: e.target.checked })}
                                    className="rounded border-border"
                                  />
                                  Aimant libre
                                </label>
                              </div>
                            </div>
                          </div>
                        )}
                      </section>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: RACCOURCIS CLAVIER */}
          {activeTab === 'raccourcis' && (
            <div className="flex flex-col gap-6">

              {/* Header */}
              <section className="p-4 bg-card/50 border border-border/50 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Keyboard size={15} /> Raccourcis Clavier
                  </h3>
                  <button
                    onClick={resetAllShortcuts}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded-lg text-xs font-medium hover:bg-accent transition-colors"
                  >
                    <RotateCcw size={12} /> Reset tout
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Cliquez sur un raccourci pour le modifier. Appuyez sur <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono border border-border">Échap</kbd> pour restaurer le défaut.
                </p>
              </section>

              {/* Shortcuts list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {defaultShortcuts.map(shortcut => {
                  const isCustom = !!displaySettings.customShortcuts?.[shortcut.actionKey];
                  const isEditing = editingShortcut === shortcut.actionKey;
                  return (
                    <div
                      key={shortcut.actionKey}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isEditing ? 'border-primary bg-primary/5' : isCustom ? 'border-amber-500/30 bg-amber-500/5' : 'border-border/50 bg-card/30 hover:bg-card/50'}`}
                    >
                      <span className="text-sm font-medium">{shortcut.label}</span>
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <div
                              tabIndex={0}
                              onKeyDown={(e) => handleShortcutKeyDown(e, shortcut.actionKey)}
                              className="px-3 py-1.5 bg-primary/10 border-2 border-primary rounded-lg text-sm font-mono font-bold text-primary min-w-[120px] text-center animate-pulse focus:outline-none"
                              autoFocus
                            >
                              En attente...
                            </div>
                            <button
                              onClick={() => setEditingShortcut(null)}
                              className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted transition-colors"
                            >
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingShortcut(shortcut.actionKey)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors ${isCustom ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30' : 'bg-muted border border-border hover:bg-accent'}`}
                            >
                              <KeyRound size={12} />
                              {getShortcutDisplay(shortcut.actionKey)}
                            </button>
                            {isCustom && (
                              <button
                                onClick={() => resetShortcut(shortcut.actionKey)}
                                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                title="Restaurer par défaut"
                              >
                                <RotateCcw size={14} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Aide rapide */}
              <section className="p-4 bg-card/50 border border-border/50 rounded-xl shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-2 mb-3 flex items-center gap-2">
                  <icons.HelpCircle size={15} /> Aide rapide
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { title: 'Modifier', desc: 'Cliquez sur le raccourci, puis appuyez sur la combinaison souhaitée.' },
                    { title: 'Restaurer', desc: 'Appuyez sur Échap en mode édition, ou cliquez l\'icône reset.' },
                    { title: 'Conflits', desc: 'Si deux raccourcis utilisent la même combinaison, le premier dans la liste est prioritaire.' },
                    { title: 'Persistance', desc: 'Les raccourcis personnalisés sont sauvegardés automatiquement dans le navigateur.' },
                  ].map((tip, i) => (
                    <div key={i} className="p-3 bg-muted/10 rounded-lg border border-border/30">
                      <p className="text-xs font-semibold mb-1">{tip.title}</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{tip.desc}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* TAB: SAUVEGARDE / EXPORT */}
          {activeTab === 'sauvegarde' && (
            <div className="flex flex-col gap-6">
              {/* Status message */}
              {importStatus && (
                <div className={`p-3 rounded-lg border flex items-center gap-2 ${importStatus.success ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                  {importStatus.success ? <Check size={16} /> : <AlertTriangle size={16} />}
                  <span className="text-sm font-medium">{importStatus.message}</span>
                </div>
              )}

              {/* Export complet */}
              <section>
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2 mb-3 flex items-center gap-2">
                  <Download size={16} /> Export
                </h3>
                <div className="flex flex-col gap-4">
                  <button
                    onClick={exportFullState}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-primary/10 border border-primary/30 rounded-lg text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
                  >
                    <FileJson size={16} />
                    Export complet (JSON)
                  </button>
                  <p className="text-[11px] text-muted-foreground -mt-2">
                    Exporte toutes les données de la session : joueurs, rôles, équipes, tags, actions, configuration, etc.
                  </p>

                  {/* Export sélectif */}
                  <div className="mt-2">
                    <h4 className="text-xs font-bold text-foreground mb-2">Export sélectif</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-muted/10 border border-border/30 rounded-lg">
                      {exportSections.map(section => (
                        <label key={section} className="flex items-center gap-2 text-xs cursor-pointer hover:text-primary transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedExportSections.includes(section)}
                            onChange={() => toggleExportSection(section)}
                            className="rounded border-border w-3.5 h-3.5 text-primary"
                          />
                          {exportLabels[section] || section}
                        </label>
                      ))}
                    </div>
                    <button
                      onClick={() => exportPartialState(selectedExportSections)}
                      disabled={selectedExportSections.length === 0}
                      className="mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-muted border border-border rounded-lg text-xs font-medium hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download size={14} />
                      Exporter la sélection ({selectedExportSections.length})
                    </button>
                  </div>
                </div>
              </section>

              {/* Import */}
              <section>
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2 mb-3 flex items-center gap-2">
                  <Upload size={16} /> Import
                </h3>
                <div className="flex flex-col gap-3">
                  <div
                    onClick={() => importInputRef.current?.click()}
                    className="w-full h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-colors"
                  >
                    <Upload size={24} className="mb-1 opacity-50" />
                    <span className="text-sm font-medium">Cliquer pour importer un fichier JSON</span>
                    <span className="text-[10px] text-muted-foreground mt-1">Les données importées seront fusionnées avec l'état actuel</span>
                  </div>
                  <input
                    ref={importInputRef}
                    type="file"
                    onChange={handleImportFile}
                    accept=".json"
                    className="hidden"
                    aria-label="Importer un fichier JSON"
                  />

                  {/* Coller JSON */}
                  <details className="mt-2">
                    <summary className="text-xs font-semibold cursor-pointer text-muted-foreground hover:text-foreground">
                      Ou coller le JSON directement
                    </summary>
                    <div className="mt-2 flex flex-col gap-2">
                      <textarea
                        id="import-json-textarea"
                        placeholder='{"version":"1.0","data":{...}}'
                        className="w-full h-32 bg-input border border-border rounded px-3 py-2 text-xs font-mono outline-none focus:ring-1 focus:ring-primary resize-y"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const textarea = document.getElementById('import-json-textarea') as HTMLTextAreaElement;
                            if (textarea?.value) {
                              const result = importState(textarea.value);
                              setImportStatus({
                                success: result.success,
                                message: result.success ? 'Import réussi !' : (result.error || 'Erreur d\'import')
                              });
                              setTimeout(() => setImportStatus(null), 4000);
                              textarea.value = '';
                            }
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                        >
                          <Upload size={12} /> Importer
                        </button>
                        <button
                          onClick={() => {
                            const textarea = document.getElementById('import-json-textarea') as HTMLTextAreaElement;
                            if (textarea) textarea.value = '';
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-muted border border-border rounded text-xs font-medium hover:bg-accent transition-colors"
                        >
                          <Trash2 size={12} /> Effacer
                        </button>
                      </div>
                    </div>
                  </details>
                </div>
              </section>

              {/* Reset */}
              <section>
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2 mb-3 flex items-center gap-2">
                  <AlertTriangle size={16} /> Zone de danger
                </h3>
                {!showResetConfirm ? (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    <RotateCcw size={16} />
                    Réinitialiser tout
                  </button>
                ) : (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex flex-col gap-3">
                    <p className="text-sm text-red-400 font-medium">
                      ⚠️ Êtes-vous sûr ? Cette action est irréversible.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          resetStore();
                          setShowResetConfirm(false);
                          setImportStatus({ success: true, message: 'Configuration réinitialisée' });
                          setTimeout(() => setImportStatus(null), 4000);
                        }}
                        className="flex items-center gap-1 px-4 py-2 bg-red-500 text-white rounded text-sm font-semibold hover:bg-red-600 transition-colors"
                      >
                        <Check size={14} /> Confirmer
                      </button>
                      <button
                        onClick={() => setShowResetConfirm(false)}
                        className="flex items-center gap-1 px-4 py-2 bg-muted border border-border rounded text-sm font-medium hover:bg-accent transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground mt-2">
                  Supprime toutes les données et restaure la configuration par défaut.
                </p>
              </section>

              {/* Quick actions */}
              <section>
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2 mb-3">Actions rapides</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      const state = useVttStore.getState();
                      const json = JSON.stringify({
                        version: '1.0',
                        exportedAt: new Date().toISOString(),
                        roomName: state.roomName,
                        data: { displaySettings: state.displaySettings }
                      }, null, 2);
                      copyToClipboard(json);
                      setImportStatus({ success: true, message: 'Config copiée dans le presse-papiers' });
                      setTimeout(() => setImportStatus(null), 3000);
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-muted border border-border rounded-lg text-xs font-medium hover:bg-accent transition-colors"
                  >
                    <Copy size={14} /> Copier la config
                  </button>
                  <button
                    onClick={() => {
                      const state = useVttStore.getState();
                      const json = JSON.stringify({
                        version: '1.0',
                        exportedAt: new Date().toISOString(),
                        roomName: state.roomName,
                        data: {
                          players: state.players,
                          roles: state.roles,
                          teams: state.teams,
                          tags: state.tags,
                        }
                      }, null, 2);
                      copyToClipboard(json);
                      setImportStatus({ success: true, message: 'Données de jeu copiées' });
                      setTimeout(() => setImportStatus(null), 3000);
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-muted border border-border rounded-lg text-xs font-medium hover:bg-accent transition-colors"
                  >
                    <Copy size={14} /> Copier données jeu
                  </button>
                </div>
              </section>
            </div>
          )}

          {/* TAB: DEBUG */}
          {activeTab === 'debug' && (
            <div className="flex flex-col gap-6">
              {/* Dev Mode Toggle */}
              <section>
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2 mb-3 flex items-center gap-2">
                  <Bug size={16} /> Mode Développeur
                </h3>
                <div className="flex flex-col gap-3 p-4 bg-muted/10 border border-border/30 rounded-lg">
                  <label htmlFor="dev-mode-toggle" className="flex items-center gap-3 text-sm cursor-pointer hover:text-primary transition-colors font-medium">
                    <input
                      id="dev-mode-toggle"
                      type="checkbox"
                      checked={displaySettings.devMode ?? false}
                      onChange={(e) => updateDisplaySettings({ devMode: e.target.checked })}
                      className="rounded border-border w-5 h-5 text-primary"
                    />
                    Activer le mode développeur
                  </label>
                  <p className="text-[11px] text-muted-foreground pl-8 leading-relaxed -mt-1">
                    Affiche des informations techniques supplémentaires sur le plateau (coordonnées, IDs, état des joueurs).
                  </p>
                </div>
              </section>

              {/* Logs Console */}
              <section>
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2 mb-3 flex items-center gap-2">
                  <Terminal size={16} /> Console de logs
                </h3>
                <div className="flex flex-col gap-3">
                  {/* Filter bar */}
                  <div className="flex items-center gap-2">
                    <Filter size={14} className="text-muted-foreground" />
                    <div className="flex gap-1">
                      {(['all', 'system', 'action', 'death'] as const).map(f => (
                        <button
                          key={f}
                          onClick={() => setDebugLogFilter(f)}
                          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${debugLogFilter === f ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                        >
                          {f === 'all' ? 'Tous' : f === 'system' ? 'Système' : f === 'action' ? 'Actions' : 'Morts'}
                        </button>
                      ))}
                    </div>
                    <div className="flex-1" />
                    <span className="text-[10px] text-muted-foreground">
                      {logs.length} entrée(s)
                    </span>
                  </div>

                  {/* Log entries */}
                  <div className="h-64 overflow-y-auto bg-black/40 border border-border rounded-lg p-2 font-mono text-[11px] custom-scrollbar">
                    {logs
                      .filter(log => debugLogFilter === 'all' || log.type === debugLogFilter)
                      .length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                        Aucun log
                      </div>
                    ) : (
                      logs
                        .filter(log => debugLogFilter === 'all' || log.type === debugLogFilter)
                        .map(log => (
                          <div key={log.id} className="flex gap-2 py-1 px-1 border-b border-white/5 last:border-0 hover:bg-white/5 rounded">
                            <span className="text-zinc-600 shrink-0">
                              {new Date(log.timestamp).toLocaleTimeString('fr-FR')}
                            </span>
                            <span className={`shrink-0 font-bold ${
                              log.type === 'system' ? 'text-blue-400' :
                              log.type === 'death' ? 'text-red-400' :
                              log.type === 'action' ? 'text-amber-400' :
                              'text-green-400'
                            }`}>
                              [{log.type}]
                            </span>
                            <span className="text-zinc-300 break-all">{log.message}</span>
                          </div>
                        ))
                    )}
                  </div>

                  {/* Log actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const state = useVttStore.getState();
                        if (state.logs.length === 0) return;
                        const dataStr = JSON.stringify(state.logs, null, 2);
                        const blob = new Blob([dataStr], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `vtt-logs-${new Date().toISOString().split('T')[0]}.json`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded text-xs font-medium hover:bg-accent transition-colors"
                    >
                      <Download size={13} /> Exporter (JSON)
                    </button>
                    <button
                      onClick={() => {
                        const state = useVttStore.getState();
                        const text = state.logs.map(l => `[${new Date(l.timestamp).toLocaleTimeString('fr-FR')}] [${l.type}] ${l.message}`).join('\n');
                        navigator.clipboard.writeText(text);
                        setImportStatus({ success: true, message: 'Logs copiés dans le presse-papiers' });
                        setTimeout(() => setImportStatus(null), 3000);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded text-xs font-medium hover:bg-accent transition-colors"
                    >
                      <Copy size={13} /> Copier (texte)
                    </button>
                    <button
                      onClick={() => clearLogs()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 size={13} /> Vider les logs
                    </button>
                  </div>
                </div>
              </section>

              {/* State Inspector */}
              <section>
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2 mb-3 flex items-center gap-2">
                  <Code size={16} /> Inspecteur d'état
                </h3>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowRawState(!showRawState)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded text-xs font-medium hover:bg-accent transition-colors"
                    >
                      <Eye size={13} /> {showRawState ? 'Masquer' : 'Afficher'} le state brut
                    </button>
                    {showRawState && (
                      <button
                        onClick={() => {
                          const state = useVttStore.getState();
                          const { temporal, downloadLogs, ...serializable } = state as any;
                          const json = JSON.stringify(serializable, (_, v) => typeof v === 'function' ? '[fn]' : v, 2);
                          navigator.clipboard.writeText(json);
                          setImportStatus({ success: true, message: 'State copié dans le presse-papiers' });
                          setTimeout(() => setImportStatus(null), 3000);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded text-xs font-medium hover:bg-accent transition-colors"
                      >
                        <Copy size={13} /> Copier le state
                      </button>
                    )}
                  </div>

                  {showRawState && (
                    <div className="h-80 overflow-y-auto bg-black/40 border border-border rounded-lg p-3 font-mono text-[10px] text-green-400 custom-scrollbar whitespace-pre-wrap break-all">
                      {(() => {
                        const state = useVttStore.getState();
                        const summary = {
                          players: state.players.length,
                          roles: state.roles.length,
                          teams: state.teams.length,
                          tags: state.tags.length,
                          markers: state.markers.length,
                          actions: state.actions.length,
                          handouts: state.handouts.length,
                          logs: state.logs.length,
                          magneticPoints: state.magneticPoints.length,
                          cycleNumber: state.cycleNumber,
                          isNight: state.isNight,
                          cycleMode: state.cycleMode,
                          canvas: state.canvas,
                          room: { width: state.room.width, height: state.room.height },
                          displaySettingsKeys: Object.keys(state.displaySettings),
                        };
                        return JSON.stringify(summary, null, 2);
                      })()}
                    </div>
                  )}
                </div>
              </section>

              {/* Quick Stats */}
              <section>
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2 mb-3 flex items-center gap-2">
                  <Eye size={16} /> Statistiques rapides
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Joueurs', value: useVttStore.getState().players.length, color: 'text-blue-400' },
                    { label: 'Rôles', value: useVttStore.getState().roles.length, color: 'text-purple-400' },
                    { label: 'Équipes', value: useVttStore.getState().teams.length, color: 'text-green-400' },
                    { label: 'Tags', value: useVttStore.getState().tags.length, color: 'text-amber-400' },
                    { label: 'Marqueurs', value: useVttStore.getState().markers.length, color: 'text-teal-400' },
                    { label: 'Actions', value: useVttStore.getState().actions.length, color: 'text-pink-400' },
                    { label: 'Logs', value: useVttStore.getState().logs.length, color: 'text-cyan-400' },
                    { label: 'Cycle', value: `${useVttStore.getState().cycleNumber}${useVttStore.getState().isNight ? ' (Nuit)' : ''}`, color: 'text-orange-400' },
                  ].map(stat => (
                    <div key={stat.label} className="p-3 bg-muted/10 border border-border/30 rounded-lg text-center">
                      <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* TAB: ACCESSIBILITÉ */}
          {activeTab === 'accessibilite' && (
            <div className="flex flex-col gap-6">
              {/* Taille de police */}
              <section>
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2 mb-3 flex items-center gap-2">
                  <Type size={16} /> Taille de police
                </h3>
                <div className="flex flex-col gap-3 p-4 bg-muted/10 border border-border/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-muted-foreground">A</span>
                    <input
                      type="range"
                      min="0.7"
                      max="1.5"
                      step="0.05"
                      value={displaySettings.fontSize ?? 1}
                      onChange={(e) => updateDisplaySettings({ fontSize: parseFloat(e.target.value) })}
                      className="flex-1 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <span className="text-lg font-bold text-muted-foreground">A</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Petit</span>
                    <span className="font-mono text-primary">{((displaySettings.fontSize ?? 1) * 100).toFixed(0)}%</span>
                    <span>Grand</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Ajuste la taille de l'interface du MJ. Appliqué via CSS variable sur le conteneur principal.
                  </p>
                </div>
              </section>

              {/* Contraste */}
              <section>
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2 mb-3 flex items-center gap-2">
                  <Contrast size={16} /> Contraste
                </h3>
                <div className="flex flex-col gap-3 p-4 bg-muted/10 border border-border/30 rounded-lg">
                  <label htmlFor="high-contrast-toggle" className="flex items-center gap-3 text-sm cursor-pointer hover:text-primary transition-colors font-medium">
                    <input
                      id="high-contrast-toggle"
                      type="checkbox"
                      checked={displaySettings.highContrast ?? false}
                      onChange={(e) => updateDisplaySettings({ highContrast: e.target.checked })}
                      className="rounded border-border w-5 h-5 text-primary"
                    />
                    Contraste élevé
                  </label>
                  <p className="text-[11px] text-muted-foreground pl-8 leading-relaxed -mt-1">
                    Augmente le contraste des textes et des bordures pour une meilleure lisibilité. Les couleurs de fond deviennent plus sombres, les textes plus clairs.
                  </p>
                </div>
              </section>

              {/* Réduction de mouvement */}
              <section>
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2 mb-3 flex items-center gap-2">
                  <EyeOff size={16} /> Réduction de mouvement
                </h3>
                <div className="flex flex-col gap-3 p-4 bg-muted/10 border border-border/30 rounded-lg">
                  <label htmlFor="reduce-motion-toggle" className="flex items-center gap-3 text-sm cursor-pointer hover:text-primary transition-colors font-medium">
                    <input
                      id="reduce-motion-toggle"
                      type="checkbox"
                      checked={displaySettings.reduceMotion ?? false}
                      onChange={(e) => updateDisplaySettings({ reduceMotion: e.target.checked })}
                      className="rounded border-border w-5 h-5 text-primary"
                    />
                    Réduire les animations
                  </label>
                  <p className="text-[11px] text-muted-foreground pl-8 leading-relaxed -mt-1">
                    Désactive les transitions, animations et effets de mouvement sur le plateau et l'interface. Utile pour les personnes sensibles au mouvement.
                  </p>
                </div>
              </section>

              {/* Mode daltonien */}
              <section>
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2 mb-3 flex items-center gap-2">
                  <Palette size={16} /> Mode daltonien
                </h3>
                <div className="flex flex-col gap-3 p-4 bg-muted/10 border border-border/30 rounded-lg">
                  <label htmlFor="colorblind-mode" className="text-xs font-bold text-muted-foreground uppercase">Type de simulation</label>
                  <select
                    id="colorblind-mode"
                    value={displaySettings.colorblindMode || 'none'}
                    onChange={(e) => updateDisplaySettings({ colorblindMode: e.target.value as any })}
                    className="bg-input border border-border rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-full max-w-[280px]"
                  >
                    <option value="none">Normal (aucun filtre)</option>
                    <option value="protanopia">Protanopie (rouge faible)</option>
                    <option value="deuteranopia">Deutéranopie (vert faible)</option>
                    <option value="tritanopia">Tritanopie (bleu faible)</option>
                  </select>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Applique un filtre SVG sur le plateau pour simuler la vision daltonienne. Aide à vérifier que les informations ne reposent pas uniquement sur la couleur.
                  </p>

                  {/* Preview */}
                  {displaySettings.colorblindMode !== 'none' && (
                    <div className="mt-2 p-3 bg-black/30 rounded-lg border border-border/30">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Aperçu des couleurs</div>
                      <div className="flex gap-2">
                        {['#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#ec4899'].map(c => (
                          <div key={c} className="w-8 h-8 rounded-full border border-white/20" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                      <div className="text-[9px] text-muted-foreground mt-2 italic">
                        Ces couleurs seront filtrées selon le mode sélectionné.
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Résumé */}
              <section>
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2 mb-3">Résumé</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Police', value: `${((displaySettings.fontSize ?? 1) * 100).toFixed(0)}%`, active: (displaySettings.fontSize ?? 1) !== 1 },
                    { label: 'Contraste', value: displaySettings.highContrast ? 'Élevé' : 'Normal', active: displaySettings.highContrast },
                    { label: 'Animations', value: displaySettings.reduceMotion ? 'Réduites' : 'Normales', active: displaySettings.reduceMotion },
                    { label: 'Daltonisme', value: displaySettings.colorblindMode === 'none' ? 'Aucun' : displaySettings.colorblindMode, active: displaySettings.colorblindMode !== 'none' },
                  ].map(item => (
                    <div key={item.label} className={`p-3 rounded-lg border text-center transition-colors ${item.active ? 'bg-primary/10 border-primary/30' : 'bg-muted/10 border-border/30'}`}>
                      <div className={`text-sm font-bold ${item.active ? 'text-primary' : 'text-muted-foreground'}`}>{item.value}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{item.label}</div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}



        </div>
      </div>
    </div>
  );
};
