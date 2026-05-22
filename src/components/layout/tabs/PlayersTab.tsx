import { Plus, Trash2, Edit2, Users, icons, ChevronDown, ChevronRight, X, GripVertical, AlertTriangle, Search, ArrowUpDown, ArrowDownAZ, Download, Upload, Eye, BarChart3, Filter, Package, LayoutGrid, List, Save, ClipboardPaste } from 'lucide-react';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useVttStore } from '../../../store';
import { ColorPicker } from '../../ColorPicker';
import { DynamicColor } from '../../DynamicColor';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './PlayersTab.css';
import { PREDEFINED_PLAYER_TEMPLATES } from '../../../lib/player-templates';
import { useMassImport, type MassImportMode, type MassImportConfig } from '../../../hooks/useMassImport';
import { generateNames, type NameTheme, THEMES } from '../../../lib/name-generator';

const TEAM_ICONS = [
  'Users', 'Shield', 'Sword', 'Heart', 'Star', 'Flag', 'Skull', 'Ghost',
  'Crown', 'Flame', 'Zap', 'Droplet', 'Sun', 'Moon', 'Eye', 'Feather',
  'Key', 'Anchor', 'Axe', 'Castle', 'Crosshair', 'Hexagon', 'Sprout', 'Target', 'Gem'
];

// Sortable Section Component
function SortableSection({ id, children, isOpen, title, onToggle, onDragStart }: {
  id: string;
  children: React.ReactNode;
  isOpen: boolean;
  title: string;
  onToggle: () => void;
  onDragStart: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <section ref={setNodeRef} style={style} className="flex flex-col gap-3">
      <div 
        className="flex items-center justify-between bg-accent/30 hover:bg-accent/50 p-2 rounded cursor-pointer transition-colors group"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-accent/80 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={onDragStart}
          >
            <GripVertical size={14} className="text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        {isOpen ? <ChevronDown size={16} className="text-blue-500" /> : <ChevronRight size={16} className="text-blue-500" />}
      </div>
      
      {isOpen && children}
    </section>
  );
}

export const PlayersTab: React.FC = () => {
  const { playerTemplates, teams, roles, players, setEditingEntity, addPlayerTemplate, deletePlayerTemplate, addTeam, deleteTeam, room, addPlayer, clearPlayers } = useVttStore();
  const { executeMassImport, calculatePreviewPositions: calcPreview } = useMassImport();
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerColor, setNewPlayerColor] = useState('#ef4444');
  const [newPlayerTeamId, setNewPlayerTeamId] = useState<string | null>(null);
  const [newPlayerRoleId, setNewPlayerRoleId] = useState<string | null>(null);
  const [nameError, setNameError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'date'>('name');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPositions, setPreviewPositions] = useState<{ x: number; y: number; name: string }[]>([]);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterInstance, setFilterInstance] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<Set<number>>(new Set());
  const [showNameImport, setShowNameImport] = useState(false);
  const [nameImportText, setNameImportText] = useState('');
  const [savedImportConfigs, setSavedImportConfigs] = useState<Array<{ name: string; mode: MassImportMode; count: number; cols: number; rows: number; radius: number; spiralTurns: number; zigzagAmp: number }>>(() => {
    try { const saved = localStorage.getItem('importConfigs'); return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  const [newConfigName, setNewConfigName] = useState('');

  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamColor, setNewTeamColor] = useState('#3b82f6');
  const [newTeamIcon, setNewTeamIcon] = useState('Users');

  // Section order state
  const [sectionOrder, setSectionOrder] = useState(() => {
    try { const saved = localStorage.getItem('playersTabSectionOrder'); return saved ? JSON.parse(saved) : ['createPlayer', 'playersList', 'massImport', 'createTeam']; } catch { return ['createPlayer', 'playersList', 'massImport', 'createTeam']; }
  });

  // Collapse states
  const [openSections, setOpenSections] = useState({
    createPlayer: true,
    playersList: true,
    massImport: false,
    createTeam: false,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => { try { localStorage.setItem('playersTabSectionOrder', JSON.stringify(sectionOrder)); } catch {} }, [sectionOrder]);
  useEffect(() => { try { localStorage.setItem('importConfigs', JSON.stringify(savedImportConfigs)); } catch {} }, [savedImportConfigs]);

  // Mass Import states
  const [massImportCount, setMassImportCount] = useState(10);
  const [massImportMode, setMassImportMode] = useState<MassImportMode>('circle');
  const [massImportCols, setMassImportCols] = useState(5);
  const [massImportRows, setMassImportRows] = useState(2);
  const [showMassImportModal, setShowMassImportModal] = useState(false);
  const [massImportNames, setMassImportNames] = useState<string[]>([]);
  const [massImportRadius, setMassImportRadius] = useState(0.35);
  const [massImportSpiralTurns, setMassImportSpiralTurns] = useState(2);
  const [massImportZigzagAmp, setMassImportZigzagAmp] = useState(50);
  const [showNameGenerator, setShowNameGenerator] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<NameTheme>('fantasy');
  const [generatedNames, setGeneratedNames] = useState<string[]>([]);

  // Dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSectionOrder((items: string[]) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const filteredPlayers = useMemo(() => {
    let result = playerTemplates;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(query));
    }
    if (filterTeam !== 'all') result = result.filter(p => (p.teamId || 'none') === filterTeam);
    if (filterRole !== 'all') result = result.filter(p => (p.roleId || 'none') === filterRole);
    if (filterInstance !== 'all') {
      result = result.filter(p => {
        const count = players.filter(pl => pl.name === p.name && pl.color === p.color).length;
        return filterInstance === 'used' ? count > 0 : count === 0;
      });
    }
    return [...result].sort((a, b) => sortBy === 'name' ? a.name.localeCompare(b.name, 'fr') : 0);
  }, [playerTemplates, searchQuery, sortBy, filterTeam, filterRole, filterInstance, players]);

  const handleAddPlayer = () => {
    if (!newPlayerName.trim()) return;

    const duplicate = playerTemplates.find(p => p.name.toLowerCase() === newPlayerName.trim().toLowerCase());
    if (duplicate) { setNameError(`Un joueur nommé "${duplicate.name}" existe déjà.`); return; }
    setNameError('');

    addPlayerTemplate({
      name: newPlayerName.trim(),
      color: newPlayerColor,
      roleId: newPlayerRoleId,
      teamId: newPlayerTeamId,
      size: 40,
    });
    setNewPlayerName('');
    setNewPlayerRoleId(null);
    setNewPlayerTeamId(null);
  };

  const handleExportPlayers = useCallback(() => {
    const data = { version: '1.0', playerTemplates, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `joueurs-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
  }, [playerTemplates]);

  const handleImportPlayers = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.playerTemplates || !Array.isArray(data.playerTemplates)) return;
      data.playerTemplates.forEach((p: any) => { const { id, ...pData } = p; addPlayerTemplate(pData); });
    } catch {}
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [addPlayerTemplate]);

  const handleShowPreview = useCallback(() => {
    const N = massImportMode === 'grid' ? massImportCols * massImportRows : Math.max(1, massImportCount);
    const positions = calcPreview(N, { mode: massImportMode, count: N, cols: massImportCols, rows: massImportRows, radius: massImportRadius, spiralTurns: massImportSpiralTurns, zigzagAmp: massImportZigzagAmp });
    setPreviewPositions(positions);
    setShowPreview(true);
  }, [massImportMode, massImportCount, massImportCols, massImportRows, massImportRadius, massImportSpiralTurns, massImportZigzagAmp, calcPreview]);

  const handleSaveImportConfig = () => {
    if (!newConfigName.trim()) return;
    setSavedImportConfigs(prev => [...prev, { name: newConfigName.trim(), mode: massImportMode, count: massImportCount, cols: massImportCols, rows: massImportRows, radius: massImportRadius, spiralTurns: massImportSpiralTurns, zigzagAmp: massImportZigzagAmp }]);
    setNewConfigName('');
  };

  const handleLoadImportConfig = (config: typeof savedImportConfigs[0]) => {
    setMassImportMode(config.mode);
    setMassImportCount(config.count);
    setMassImportCols(config.cols);
    setMassImportRows(config.rows);
    setMassImportRadius(config.radius);
    setMassImportSpiralTurns(config.spiralTurns);
    setMassImportZigzagAmp(config.zigzagAmp);
  };

  const handleDeleteImportConfig = (index: number) => {
    setSavedImportConfigs(prev => prev.filter((_, i) => i !== index));
  };

  const handleNameImport = () => {
    const names = nameImportText.split('\n').map(n => n.trim()).filter(n => n.length > 0);
    if (names.length === 0) return;
    setMassImportNames(names);
    setMassImportCount(names.length);
    setShowNameImport(false);
    setNameImportText('');
  };

  const handleGenerateNames = () => {
    const names = generateNames(massImportCount, selectedTheme);
    setGeneratedNames(names);
  };

  const handleUseGeneratedNames = () => {
    setMassImportNames(generatedNames);
    setMassImportCount(generatedNames.length);
    setShowNameGenerator(false);
    setGeneratedNames([]);
  };

  const handleImportTemplates = useCallback(() => {
    if (selectedTemplates.size === 0) return;
    const templatesToImport = Array.from(selectedTemplates).map(i => PREDEFINED_PLAYER_TEMPLATES[i]);
    templatesToImport.forEach(template => {
      let newName = template.name;
      let counter = 1;
      while (playerTemplates.some(p => p.name === newName)) {
        newName = `${template.name} (${counter})`;
        counter++;
      }
      addPlayerTemplate({ ...template, name: newName });
    });
    setSelectedTemplates(new Set());
    setShowTemplates(false);
  }, [selectedTemplates, playerTemplates, addPlayerTemplate]);

  const toggleTemplateSelection = (index: number) => {
    setSelectedTemplates(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  };

  const selectAllTemplates = () => {
    const allIndices = PREDEFINED_PLAYER_TEMPLATES.map((_, i) => i).filter(i => !playerTemplates.some(p => p.name === PREDEFINED_PLAYER_TEMPLATES[i].name));
    setSelectedTemplates(new Set(allIndices));
  };

  const handleRequestDelete = useCallback((id: string, name: string) => setDeleteConfirm({ id, name }), []);
  const handleConfirmDelete = useCallback(() => {
    if (!deleteConfirm) return;
    deletePlayerTemplate(deleteConfirm.id);
    setDeleteConfirm(null);
  }, [deleteConfirm, deletePlayerTemplate]);

  const openMassImportModal = () => {
    let count: number;
    if (massImportMode === 'grid') {
      count = massImportCols * massImportRows;
    } else if (massImportMode === 'teams') {
      count = teams.reduce((sum, t) => sum + Math.max(1, Math.floor(massImportCount / teams.length)), 0);
    } else {
      count = Math.max(1, massImportCount);
    }
    setMassImportNames(Array(count).fill(''));
    setShowMassImportModal(true);
  };

  const handleValidateMassImport = () => {
    executeMassImport(massImportNames, {
      mode: massImportMode,
      count: massImportNames.length,
      cols: massImportCols,
      rows: massImportRows,
      radius: massImportRadius,
      spiralTurns: massImportSpiralTurns,
      zigzagAmp: massImportZigzagAmp,
    });
    setShowMassImportModal(false);
  };

  // Section content renderers
  const renderCreatePlayer = () => (
    <div className="flex flex-col gap-2 px-1">
      <div>
        <input
          type="text"
          placeholder="Nom du joueur"
          value={newPlayerName}
          onChange={(e) => { setNewPlayerName(e.target.value); setNameError(''); }}
          className={`w-full bg-input border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 ${nameError ? 'border-destructive focus:ring-destructive' : 'border-border focus:ring-ring'}`}
        />
        {nameError && <p className="text-[10px] text-destructive mt-1">{nameError}</p>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select value={newPlayerTeamId || ''} onChange={(e) => setNewPlayerTeamId(e.target.value || null)} className="w-full bg-input border border-border rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
          <option value="">Sans équipe</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={newPlayerRoleId || ''} onChange={(e) => setNewPlayerRoleId(e.target.value || null)} className="w-full bg-input border border-border rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
          <option value="">Sans rôle</option>
          {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <ColorPicker
          color={newPlayerColor}
          onChange={setNewPlayerColor}
          label="Couleur du joueur"
        />
        <button
          onClick={handleAddPlayer}
          disabled={!newPlayerName.trim()}
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={16} /> Ajouter
        </button>
      </div>
    </div>
  );

  const renderPlayersList = () => {
    const hasSearch = searchQuery.trim() !== '';
    const hasActiveFilters = filterTeam !== 'all' || filterRole !== 'all' || filterInstance !== 'all';
    return (
    <div className="flex flex-col gap-2">
      {playerTemplates.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Aucun joueur créé.</p>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => setSortBy(sortBy === 'name' ? 'date' : 'name')} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Trier">
              {sortBy === 'name' ? <><ArrowDownAZ size={10} /> A-Z</> : <><ArrowUpDown size={10} /> Date</>}
            </button>
            <button onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Vue">
              {viewMode === 'list' ? <><LayoutGrid size={10} /> Grille</> : <><List size={10} /> Liste</>}
            </button>
            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${showFilters || hasActiveFilters ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground hover:text-foreground'}`} title="Filtres"><Filter size={10} /> Filtres{hasActiveFilters ? ` (${[filterTeam !== 'all', filterRole !== 'all', filterInstance !== 'all'].filter(Boolean).length})` : ''}</button>
            <button onClick={() => setShowDashboard(true)} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Statistiques"><BarChart3 size={10} /></button>
            <div className="flex-1" />
            <button onClick={handleExportPlayers} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Exporter" aria-label="Exporter"><Download size={12} /></button>
            <button onClick={() => fileInputRef.current?.click()} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Importer JSON" aria-label="Importer"><Upload size={12} /></button>
            <button onClick={() => setShowTemplates(true)} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Modèles prédéfinis" aria-label="Modèles"><Package size={12} /></button>
            <button onClick={() => setShowNameImport(true)} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Importer depuis liste" aria-label="Importer liste"><ClipboardPaste size={12} /></button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportPlayers} className="hidden" aria-label="Importer des joueurs" />
            <button
              onClick={() => {
                if (window.confirm(`Supprimer les ${playerTemplates.length} modèles de joueurs ?`)) {
                  [...playerTemplates].forEach(p => deletePlayerTemplate(p.id));
                }
              }}
              className="text-xs text-destructive hover:text-destructive/80 hover:bg-destructive/10 px-2 py-1 rounded transition-colors flex items-center gap-1 shrink-0"
              title="Supprimer tous les joueurs"
            >
              <Trash2 size={12} /> Tout supprimer
            </button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap items-center gap-2 p-2 bg-muted/30 rounded-md border border-border">
              <span className="text-xs font-medium text-muted-foreground">Filtres:</span>
              <select value={filterTeam} onChange={(e) => setFilterTeam(e.target.value)} className="text-xs bg-background border border-border rounded px-2 py-1">
                <option value="all">Toutes les équipes</option>
                <option value="none">Sans équipe</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="text-xs bg-background border border-border rounded px-2 py-1">
                <option value="all">Tous les rôles</option>
                <option value="none">Sans rôle</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <select value={filterInstance} onChange={(e) => setFilterInstance(e.target.value)} className="text-xs bg-background border border-border rounded px-2 py-1">
                <option value="all">Utilisation</option>
                <option value="used">Placés</option>
                <option value="unused">Non placés</option>
              </select>
              <button onClick={() => { setFilterTeam('all'); setFilterRole('all'); setFilterInstance('all'); }} className="text-xs px-2 py-1 rounded bg-muted hover:bg-accent transition-colors">Réinitialiser</button>
            </div>
          )}

          {filteredPlayers.length === 0 && (hasSearch || hasActiveFilters) ? (
            <p className="text-xs text-muted-foreground italic text-center py-2">Aucun résultat</p>
          ) : (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-3 gap-2">
                {filteredPlayers.map((player) => {
                  const team = teams.find(t => t.id === player.teamId);
                  const role = roles.find(r => r.id === player.roleId);
                  const instanceCount = players.filter(p => p.name === player.name && p.color === player.color).length;
                  return (
                    <div key={player.id} className="flex flex-col items-center p-3 rounded-md border border-border bg-card hover:bg-accent/50 group text-center" draggable onDragStart={(e) => { e.dataTransfer.setData('application/json', JSON.stringify({ type: 'new_player', data: player })); }}>
                      <div className="relative mb-2">
                        <DynamicColor color={player.color} isBackground className={`player-avatar-preview shape-${player.shape ?? 'circle'} w-10 h-10`} />
                        {player.imageUrl && <span className="player-image-indicator" title="Contient une image">i</span>}
                        {team && <DynamicColor color={team.color} isBackground className="player-team-pastille" />}
                      </div>
                      <span className="text-xs font-medium truncate w-full">{player.name}</span>
                      <div className="flex items-center gap-1 text-[9px] text-muted-foreground mt-0.5">
                        {role && <span className="truncate" style={{ color: role.color }}>{role.name}</span>}
                        {instanceCount > 0 && <span>×{instanceCount}</span>}
                      </div>
                      <div className="flex gap-0.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditingEntity({ type: 'playerTemplate', id: player.id })} className="p-0.5 text-muted-foreground hover:text-foreground" aria-label="Modifier"><Edit2 size={10} /></button>
                        <button onClick={() => handleRequestDelete(player.id, player.name)} className="p-0.5 text-muted-foreground hover:text-destructive" aria-label="Supprimer"><Trash2 size={10} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredPlayers.map((player) => {
              const team = teams.find(t => t.id === player.teamId);
              const role = roles.find(r => r.id === player.roleId);
              const instanceCount = players.filter(p => p.name === player.name && p.color === player.color).length;
              return (
              <div
                key={player.id}
                className="flex items-center justify-between p-2 rounded-md border border-border bg-card hover:bg-accent/50 group"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/json', JSON.stringify({ type: 'new_player', data: player }));
                }}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    <DynamicColor 
                      color={player.color} 
                      isBackground 
                      className={`player-avatar-preview shape-${player.shape ?? 'circle'}`}
                    />
                    {player.imageUrl && (
                      <span className="player-image-indicator" title="Contient une image">i</span>
                    )}
                    {team && (
                      <DynamicColor
                        color={team.color}
                        isBackground
                        className="player-team-pastille"
                      />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium truncate">{player.name}</span>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      {role && <span className="truncate" style={{ color: role.color }}>{role.name}</span>}
                      {team && <span className="truncate" style={{ color: team.color }}>{team.name}</span>}
                      {instanceCount > 0 && <span>×{instanceCount}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => setEditingEntity({ type: 'playerTemplate', id: player.id })}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md"
                    title="Modifier"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleRequestDelete(player.id, player.name)}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
              </div>
            ))}
        </>
      )}
    </div>
  );
  };

  const massImportModes: { value: MassImportMode; label: string; desc: string }[] = [
    { value: 'circle', label: 'Cercle', desc: 'Table ronde' },
    { value: 'grid', label: 'Rangs', desc: 'Grille structurée' },
    { value: 'semicircle', label: 'Demi-cercle', desc: 'Face au MJ' },
    { value: 'ellipse', label: 'Ellipse', desc: 'Table ovale' },
    { value: 'random', label: 'Aléatoire', desc: 'Dispersion naturelle' },
    { value: 'teams', label: 'En équipes', desc: 'Groupes par équipe' },
    { value: 'cross', label: 'En croix', desc: '4 branches' },
    { value: 'spiral', label: 'Spirale', desc: 'Escargot' },
    { value: 'doubleCircle', label: 'Double cercle', desc: 'Intérieur + extérieur' },
    { value: 'zigzag', label: 'Zigzag', desc: 'Alternance haut/bas' },
  ];

  const renderMassImport = () => (
    <div className="flex flex-col gap-3 px-1">
      <div className="grid grid-cols-2 gap-2 p-2 bg-muted/30 rounded-md border border-border/50">
        {massImportModes.map(mode => (
          <label
            key={mode.value}
            className={`flex flex-col gap-0.5 p-2 rounded-md cursor-pointer transition-all border text-xs ${
              massImportMode === mode.value
                ? 'bg-primary/10 border-primary text-foreground'
                : 'bg-background/50 border-border/50 hover:bg-muted text-muted-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="massImportMode"
                checked={massImportMode === mode.value}
                onChange={() => setMassImportMode(mode.value)}
                className="rounded-full border-border text-primary focus:ring-primary w-3 h-3"
              />
              <span className="font-semibold">{mode.label}</span>
            </div>
            <span className="text-[10px] ml-5 opacity-70">{mode.desc}</span>
          </label>
        ))}
      </div>

      {(massImportMode === 'circle' || massImportMode === 'semicircle' || massImportMode === 'ellipse' || massImportMode === 'spiral' || massImportMode === 'doubleCircle') && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="mass-import-count" className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Nombre de joueurs</label>
            <input
              id="mass-import-count"
              type="number"
              min={1}
              max={100}
              value={massImportCount}
              onChange={(e) => setMassImportCount(parseInt(e.target.value) || 1)}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="mass-import-radius" className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Rayon ({Math.round(massImportRadius * 100)}%)</label>
            <input
              id="mass-import-radius"
              type="range"
              min={10}
              max={50}
              value={massImportRadius * 100}
              onChange={(e) => setMassImportRadius(parseInt(e.target.value) / 100)}
              className="w-full accent-primary"
            />
          </div>
          {massImportMode === 'spiral' && (
            <div className="flex flex-col gap-1">
              <label htmlFor="mass-import-spiral" className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Tours de spirale</label>
              <input
                id="mass-import-spiral"
                type="number"
                min={1}
                max={5}
                value={massImportSpiralTurns}
                onChange={(e) => setMassImportSpiralTurns(parseInt(e.target.value) || 2)}
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          )}
        </div>
      )}

      {massImportMode === 'grid' && (
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="mass-import-cols" className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Colonnes</label>
            <input
              id="mass-import-cols"
              type="number"
              min={1}
              value={massImportCols}
              onChange={(e) => setMassImportCols(parseInt(e.target.value) || 1)}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="mass-import-rows" className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Lignes</label>
            <input
              id="mass-import-rows"
              type="number"
              min={1}
              value={massImportRows}
              onChange={(e) => setMassImportRows(parseInt(e.target.value) || 1)}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      )}

      {massImportMode === 'zigzag' && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="mass-import-count" className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Nombre de joueurs</label>
            <input
              id="mass-import-count-zigzag"
              type="number"
              min={1}
              max={100}
              value={massImportCount}
              onChange={(e) => setMassImportCount(parseInt(e.target.value) || 1)}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="mass-import-zigzag" className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Amplitude du zigzag</label>
            <input
              id="mass-import-zigzag"
              type="number"
              min={10}
              max={100}
              value={massImportZigzagAmp}
              onChange={(e) => setMassImportZigzagAmp(parseInt(e.target.value) || 50)}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      )}

      {massImportMode === 'teams' && teams.length === 0 && (
        <p className="text-xs text-amber-500 bg-amber-500/10 p-2 rounded border border-amber-500/20">
          Aucune équipe créée. Les joueurs seront dispersés aléatoirement.
        </p>
      )}

      {savedImportConfigs.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Configurations sauvegardées</span>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {savedImportConfigs.map((config, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded border border-border/50 text-xs">
                <button onClick={() => handleLoadImportConfig(config)} className="flex-1 text-left hover:text-foreground transition-colors truncate" title={config.name}>
                  <span className="font-medium">{config.name}</span>
                  <span className="text-muted-foreground ml-1">({config.mode}, {config.count})</span>
                </button>
                <button onClick={() => handleDeleteImportConfig(index)} className="p-0.5 text-muted-foreground hover:text-destructive" aria-label="Supprimer"><Trash2 size={10} /></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" value={newConfigName} onChange={(e) => setNewConfigName(e.target.value)} placeholder="Nom de la config..." className="flex-1 bg-background border border-border rounded px-2 py-1 text-xs" />
            <button onClick={handleSaveImportConfig} disabled={!newConfigName.trim()} className="px-2 py-1 rounded bg-muted hover:bg-accent text-xs disabled:opacity-50 flex items-center gap-1"><Save size={10} /> Sauvegarder</button>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleShowPreview}
          className="flex-1 bg-muted text-foreground hover:bg-accent py-2 rounded-md font-medium text-sm flex items-center justify-center gap-2 transition-all"
        >
          <Eye size={16} /> Aperçu
        </button>
        <button
          onClick={() => setShowNameGenerator(true)}
          className="bg-accent/50 text-foreground hover:bg-accent py-2 px-3 rounded-md font-medium text-sm flex items-center justify-center gap-2 transition-all"
          title="Générer des noms automatiquement"
        >
          <Package size={16} />
        </button>
        <button
          onClick={openMassImportModal}
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 py-2 rounded-md font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <Plus size={18} /> Configurer l'import
        </button>
      </div>
    </div>
  );

  const renderCreateTeam = () => (
    <div className="flex flex-col gap-2 px-1">
      <input
        type="text"
        placeholder="Nom de l'équipe"
        value={newTeamName}
        onChange={(e) => setNewTeamName(e.target.value)}
        className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Icône de l'équipe</span>
        <div className="flex flex-wrap gap-1.5 bg-input border border-border rounded-md p-2 max-h-32 overflow-y-auto custom-scrollbar">
          {TEAM_ICONS.map(iconName => {
            const IconComponent = icons[iconName as keyof typeof icons] || Users;
            if (!IconComponent) return null;
            return (
              <button
                key={iconName}
                onClick={() => setNewTeamIcon(iconName)}
                className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${
                  newTeamIcon === iconName
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'
                }`}
                title={iconName}
              >
                {React.createElement(IconComponent, { size: 16 })}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <ColorPicker
          color={newTeamColor}
          onChange={setNewTeamColor}
          label="Couleur de l'équipe"
        />
        <button
          onClick={() => {
            if (!newTeamName.trim()) return;
            addTeam({ name: newTeamName, color: newTeamColor, icon: newTeamIcon });
            setNewTeamName('');
          }}
          className="flex-1 bg-accent hover:bg-accent/80 text-foreground px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Ajouter Équipe
        </button>
      </div>

      <div className="flex flex-col gap-2 mt-2">
        {teams.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">Aucune équipe.</p>
        ) : (
          teams.map((team) => {
            let IconComponent = icons[team.icon as keyof typeof icons] || Users;

            return (
              <div key={team.id} className="flex items-center justify-between p-2 rounded-md border border-border bg-card hover:bg-accent/50 group" style={{ '--team-color': team.color } as React.CSSProperties}>
                <div className="flex items-center gap-3">
                  {team.imageUrl ? (
                    <img src={team.imageUrl} className="w-4 h-4 rounded-full object-cover" alt="" />
                  ) : (
                    <IconComponent size={16} className="team-item-icon" />
                  )}
                  <span className="team-item-name">{team.name}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingEntity({ type: 'team', id: team.id })}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md"
                    title="Modifier"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => deleteTeam(team.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const sectionContent: Record<string, { title: string; render: () => React.ReactNode }> = {
    createPlayer: { title: 'Créer un Joueur (Modèle)', render: renderCreatePlayer },
    playersList: { title: 'Joueurs', render: renderPlayersList },
    massImport: { title: 'Ajouter des joueurs en masse', render: renderMassImport },
    createTeam: { title: 'Créer une Équipe', render: renderCreateTeam },
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sectionOrder}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-6 relative">
          {sectionOrder.map((sectionId: string) => {
            const section = sectionContent[sectionId];
            if (!section) return null;
            
            return (
              <SortableSection
                key={sectionId}
                id={sectionId}
                isOpen={openSections[sectionId as keyof typeof openSections]}
                title={section.title}
                onToggle={() => toggleSection(sectionId as keyof typeof openSections)}
                onDragStart={() => {}}
              >
                {section.render()}
              </SortableSection>
            );
          })}
        </div>
      </SortableContext>

      {/* MODAL - Mass Import */}
      {showMassImportModal && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm"
             onMouseDown={(e) => e.stopPropagation()}
             onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-popover text-popover-foreground rounded-lg shadow-2xl w-full max-w-md overflow-hidden border border-border flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/50 shrink-0">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Users size={20} className="text-blue-500" />
                Importer {massImportNames.length} Joueurs
              </h2>
              <button 
                type="button"
                onClick={() => setShowMassImportModal(false)} 
                className="text-muted-foreground hover:text-foreground"
                title="Fermer"
                aria-label="Fermer la fenêtre"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-2">
              <p className="text-xs text-muted-foreground mb-4">
                Si laissé vide, les joueurs seront nommés automatiquement.
              </p>
              {massImportNames.map((name, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="w-6 text-xs font-medium text-muted-foreground text-right">{i + 1}.</span>
                  <input
                    type="text"
                    value={name}
                    placeholder={`Joueur ${i + 1}`}
                    onChange={(e) => {
                      const newNames = [...massImportNames];
                      newNames[i] = e.target.value;
                      setMassImportNames(newNames);
                    }}
                    className="flex-1 bg-background border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
            <div className="p-4 bg-muted/50 border-t border-border flex justify-end gap-2 shrink-0">
              <button 
                onClick={() => setShowMassImportModal(false)}
                className="px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded font-medium"
              >
                Annuler
              </button>
              <button 
                onClick={handleValidateMassImport}
                className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-500 rounded font-bold shadow-sm flex items-center gap-2"
              >
                <Plus size={16} /> Valider l'import
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-card border border-border rounded-lg p-6 max-w-sm mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3"><div className="p-2 rounded-full bg-destructive/10"><AlertTriangle size={20} className="text-destructive" /></div><h4 className="font-semibold text-sm">Supprimer ce joueur ?</h4></div>
            <p className="text-xs text-muted-foreground mb-1"><strong>"{deleteConfirm.name}"</strong> sera supprimé définitivement.</p>
            <p className="text-[10px] text-muted-foreground italic mb-3">Ce modèle sera retiré de la liste.</p>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 rounded-md text-sm bg-muted hover:bg-accent transition-colors">Annuler</button>
              <button onClick={handleConfirmDelete} className="px-3 py-1.5 rounded-md text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={() => setShowPreview(false)}>
          <div className="bg-card border border-border rounded-lg p-6 max-w-2xl w-full mx-4 shadow-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-base flex items-center gap-2"><Eye size={18} /> Aperçu de la disposition ({previewPositions.length} joueurs)</h4>
              <button onClick={() => setShowPreview(false)} className="p-1 rounded hover:bg-accent"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-hidden relative bg-muted/30 rounded-md border border-border" style={{ minHeight: '300px' }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-primary/30" />
              </div>
              {previewPositions.map((pos, i) => {
                const scale = 280 / Math.max(room.width, room.height);
                const x = 140 + pos.x * scale;
                const y = 150 + pos.y * scale;
                return (
                  <div key={i} className="absolute flex flex-col items-center" style={{ left: `${x}px`, top: `${y}px`, transform: 'translate(-50%, -50%)' }}>
                    <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-[8px] font-bold text-white" style={{ backgroundColor: `hsl(${(i * 360) / previewPositions.length}, 70%, 50%)` }}>
                      {i + 1}
                    </div>
                    <span className="text-[8px] text-muted-foreground mt-0.5 truncate max-w-[60px]">{pos.name}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end mt-4 pt-3 border-t border-border">
              <button onClick={() => setShowPreview(false)} className="px-3 py-1.5 rounded-md text-sm bg-muted hover:bg-accent transition-colors">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL - Dashboard Statistics */}
      {showDashboard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={() => setShowDashboard(false)}>
          <div className="bg-card border border-border rounded-lg p-6 max-w-lg w-full mx-4 shadow-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-base flex items-center gap-2"><BarChart3 size={18} /> Statistiques des Joueurs</h4>
              <button onClick={() => setShowDashboard(false)} className="p-1 rounded hover:bg-accent"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 rounded-md p-3 text-center">
                  <div className="text-2xl font-bold">{playerTemplates.length}</div>
                  <div className="text-xs text-muted-foreground">Modèles</div>
                </div>
                <div className="bg-muted/30 rounded-md p-3 text-center">
                  <div className="text-2xl font-bold">{players.length}</div>
                  <div className="text-xs text-muted-foreground">Instances</div>
                </div>
                <div className="bg-muted/30 rounded-md p-3 text-center">
                  <div className="text-2xl font-bold">{playerTemplates.filter(p => players.some(pl => pl.name === p.name && pl.color === p.color)).length}</div>
                  <div className="text-xs text-muted-foreground">Utilisés</div>
                </div>
                <div className="bg-muted/30 rounded-md p-3 text-center">
                  <div className="text-2xl font-bold">{playerTemplates.filter(p => !players.some(pl => pl.name === p.name && pl.color === p.color)).length}</div>
                  <div className="text-xs text-muted-foreground">Disponibles</div>
                </div>
              </div>
              <div>
                <h5 className="text-sm font-medium mb-2">Par Équipe</h5>
                <div className="space-y-1">
                  {teams.map(team => {
                    const count = playerTemplates.filter(p => p.teamId === team.id).length;
                    return (
                      <div key={team.id} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1"><DynamicColor color={team.color} isBackground className="w-3 h-3 rounded-full" /> {team.name}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Sans équipe</span>
                    <span className="font-medium">{playerTemplates.filter(p => !p.teamId).length}</span>
                  </div>
                </div>
              </div>
              <div>
                <h5 className="text-sm font-medium mb-2">Par Rôle</h5>
                <div className="space-y-1">
                  {roles.map(role => {
                    const count = playerTemplates.filter(p => p.roleId === role.id).length;
                    return (
                      <div key={role.id} className="flex items-center justify-between text-xs">
                        <span style={{ color: role.color }}>{role.name}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Sans rôle</span>
                    <span className="font-medium">{playerTemplates.filter(p => !p.roleId).length}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-4 pt-3 border-t border-border">
              <button onClick={() => setShowDashboard(false)} className="px-3 py-1.5 rounded-md text-sm bg-muted hover:bg-accent transition-colors">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL - Predefined Templates */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={() => setShowTemplates(false)}>
          <div className="bg-card border border-border rounded-lg p-6 max-w-lg w-full mx-4 shadow-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-base flex items-center gap-2"><Package size={18} /> Modèles Prédéfinis</h4>
              <button onClick={() => setShowTemplates(false)} className="p-1 rounded hover:bg-accent"><X size={16} /></button>
            </div>
            <div className="flex gap-2 mb-3">
              <button onClick={selectAllTemplates} className="text-xs px-2 py-1 rounded bg-muted hover:bg-accent transition-colors">Tout sélectionner</button>
              <button onClick={() => setSelectedTemplates(new Set())} className="text-xs px-2 py-1 rounded bg-muted hover:bg-accent transition-colors">Aucun</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1">
              {PREDEFINED_PLAYER_TEMPLATES.map((template, index) => {
                const alreadyExists = playerTemplates.some(p => p.name === template.name);
                const isSelected = selectedTemplates.has(index);
                return (
                  <label key={index} className={`flex items-center gap-2 p-2 rounded cursor-pointer text-xs transition-colors ${alreadyExists ? 'opacity-50 cursor-not-allowed' : isSelected ? 'bg-primary/10' : 'hover:bg-accent/50'}`}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => !alreadyExists && toggleTemplateSelection(index)}
                      disabled={alreadyExists}
                      className="rounded"
                    />
                    <DynamicColor color={template.color} isBackground className="w-4 h-4 rounded-full shrink-0" />
                    <span className="flex-1 truncate">{template.name}</span>
                    {alreadyExists && <span className="text-[9px] text-muted-foreground">Existant</span>}
                  </label>
                );
              })}
            </div>
            <div className="flex justify-between mt-4 pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground">{selectedTemplates.size} sélectionné(s)</span>
              <div className="flex gap-2">
                <button onClick={() => setShowTemplates(false)} className="px-3 py-1.5 rounded-md text-sm bg-muted hover:bg-accent transition-colors">Annuler</button>
                <button onClick={handleImportTemplates} disabled={selectedTemplates.size === 0} className="px-3 py-1.5 rounded-md text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Importer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL - Import from Name List */}
      {showNameImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={() => setShowNameImport(false)}>
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-base flex items-center gap-2"><ClipboardPaste size={18} /> Importer depuis une Liste</h4>
              <button onClick={() => setShowNameImport(false)} className="p-1 rounded hover:bg-accent"><X size={16} /></button>
            </div>
            <p className="text-xs text-muted-foreground mb-2">Collez une liste de noms (un par ligne) :</p>
            <textarea
              value={nameImportText}
              onChange={(e) => setNameImportText(e.target.value)}
              placeholder="Joueur 1&#10;Joueur 2&#10;Joueur 3"
              className="w-full h-40 bg-background border border-border rounded-md p-3 text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex justify-between mt-4 pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground">{nameImportText.split('\n').filter(n => n.trim()).length} nom(s)</span>
              <div className="flex gap-2">
                <button onClick={() => setShowNameImport(false)} className="px-3 py-1.5 rounded-md text-sm bg-muted hover:bg-accent transition-colors">Annuler</button>
                <button onClick={handleNameImport} disabled={nameImportText.trim().length === 0} className="px-3 py-1.5 rounded-md text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Continuer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL - Name Generator */}
      {showNameGenerator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={() => setShowNameGenerator(false)}>
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-base flex items-center gap-2"><Package size={18} /> Générateur de Noms</h4>
              <button onClick={() => setShowNameGenerator(false)} className="p-1 rounded hover:bg-accent"><X size={16} /></button>
            </div>

            <div className="flex flex-col gap-3 mb-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Thème</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {THEMES.map(theme => (
                    <button
                      key={theme.key}
                      onClick={() => setSelectedTheme(theme.key)}
                      className={`px-2 py-1.5 rounded text-xs font-medium transition-all border ${
                        selectedTheme === theme.key
                          ? 'bg-primary/10 border-primary text-foreground'
                          : 'bg-background/50 border-border/50 hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="gen-count" className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Nombre de noms</label>
                <input
                  id="gen-count"
                  type="number"
                  min={1}
                  max={100}
                  value={massImportCount}
                  onChange={(e) => setMassImportCount(parseInt(e.target.value) || 10)}
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <button
                onClick={handleGenerateNames}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2 rounded-md font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Package size={16} /> Générer
              </button>
            </div>

            {generatedNames.length > 0 && (
              <div className="flex-1 overflow-y-auto space-y-1 mb-4 max-h-48">
                {generatedNames.map((name, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-muted/30 rounded text-xs">
                    <span className="w-6 text-muted-foreground text-right">{i + 1}.</span>
                    <span className="flex-1">{name}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-3 border-t border-border">
              <button onClick={() => setShowNameGenerator(false)} className="px-3 py-1.5 rounded-md text-sm bg-muted hover:bg-accent transition-colors">Annuler</button>
              <button
                onClick={handleUseGeneratedNames}
                disabled={generatedNames.length === 0}
                className="px-3 py-1.5 rounded-md text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Utiliser ({generatedNames.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </DndContext>
  );
};
