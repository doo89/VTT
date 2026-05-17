import { Plus, Trash2, Edit2, Users, icons, ChevronDown, ChevronRight, X, GripVertical } from 'lucide-react';
import React, { useState } from 'react';
import { useVttStore } from '../../../store';
import { ColorPicker } from '../../ColorPicker';
import { DynamicColor } from '../../DynamicColor';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './PlayersTab.css';

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
  const { playerTemplates, teams, setEditingEntity, addPlayerTemplate, deletePlayerTemplate, addTeam, deleteTeam, room, addPlayer, clearPlayers } = useVttStore();
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerColor, setNewPlayerColor] = useState('#ef4444');

  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamColor, setNewTeamColor] = useState('#3b82f6');
  const [newTeamIcon, setNewTeamIcon] = useState('Users');

  // Section order state
  const [sectionOrder, setSectionOrder] = useState([
    'createPlayer',
    'playersList',
    'massImport',
    'createTeam',
  ]);

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

  // Mass Import states
  type MassImportMode = 'circle' | 'grid' | 'semicircle' | 'ellipse' | 'random' | 'teams' | 'cross' | 'spiral' | 'doubleCircle' | 'zigzag';
  const [massImportCount, setMassImportCount] = useState(10);
  const [massImportMode, setMassImportMode] = useState<MassImportMode>('circle');
  const [massImportCols, setMassImportCols] = useState(5);
  const [massImportRows, setMassImportRows] = useState(2);
  const [showMassImportModal, setShowMassImportModal] = useState(false);
  const [massImportNames, setMassImportNames] = useState<string[]>([]);
  const [massImportRadius, setMassImportRadius] = useState(0.35);
  const [massImportSpiralTurns, setMassImportSpiralTurns] = useState(2);
  const [massImportZigzagAmp, setMassImportZigzagAmp] = useState(50);

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
      setSectionOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAddPlayer = () => {
    if (!newPlayerName.trim()) return;

    addPlayerTemplate({
      name: newPlayerName,
      color: newPlayerColor,
      roleId: null,
      teamId: null,
      size: 40,
    });
    setNewPlayerName('');
  };

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

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const handleValidateMassImport = () => {
    const N = massImportNames.length;
    const cx = 0;
    const cy = 0;
    const minDim = Math.min(room.width, room.height);
    const maxDim = Math.max(room.width, room.height);

    const createPlayer = (name: string, index: number, x: number, y: number, teamId?: string | null) => {
      const finalName = name.trim() || `Joueur ${index + 1}`;
      const team = teamId ? teams.find(t => t.id === teamId) : null;
      const color = team?.color ?? getRandomColor();
      addPlayerTemplate({ name: finalName, color, roleId: null, teamId: teamId ?? null, size: 40 });
      addPlayer({ name: finalName, color, roleId: null, teamId: teamId ?? null, size: 40, x, y, isDead: false, tags: [] });
    };

    const getPositions = (mode: MassImportMode): { x: number; y: number; teamId?: string | null }[] => {
      const positions: { x: number; y: number; teamId?: string | null }[] = [];
      const R = minDim * massImportRadius;

      switch (mode) {
        case 'circle':
          for (let i = 0; i < N; i++) {
            const angle = (i * 2 * Math.PI) / N;
            positions.push({ x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) });
          }
          break;

        case 'grid': {
          const spacing = 100;
          const totalWidth = (massImportCols - 1) * spacing;
          const totalHeight = (massImportRows - 1) * spacing;
          const startX = cx - totalWidth / 2;
          const startY = cy - totalHeight / 2;
          for (let i = 0; i < N; i++) {
            const col = i % massImportCols;
            const row = Math.floor(i / massImportCols);
            positions.push({ x: startX + col * spacing, y: startY + row * spacing });
          }
          break;
        }

        case 'semicircle':
          for (let i = 0; i < N; i++) {
            const angle = (i * Math.PI) / (N - 1 || 1);
            positions.push({ x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) * 0.6 });
          }
          break;

        case 'ellipse': {
          const Rx = maxDim * massImportRadius * 0.5;
          const Ry = minDim * massImportRadius * 0.5;
          for (let i = 0; i < N; i++) {
            const angle = (i * 2 * Math.PI) / N;
            positions.push({ x: cx + Rx * Math.cos(angle), y: cy + Ry * Math.sin(angle) });
          }
          break;
        }

        case 'random': {
          const margin = 80;
          for (let i = 0; i < N; i++) {
            positions.push({
              x: cx + (Math.random() - 0.5) * (room.width - margin * 2),
              y: cy + (Math.random() - 0.5) * (room.height - margin * 2),
            });
          }
          break;
        }

        case 'teams': {
          let idx = 0;
          const teamSpacing = 200;
          const playerSpacing = 80;
          teams.forEach((team, ti) => {
            const teamCount = Math.max(1, Math.floor(N / teams.length));
            const teamCx = cx + (ti - (teams.length - 1) / 2) * teamSpacing;
            const teamCy = cy;
            for (let i = 0; i < teamCount && idx < N; i++, idx++) {
              const angle = (i * 2 * Math.PI) / teamCount;
              positions.push({
                x: teamCx + playerSpacing * Math.cos(angle),
                y: teamCy + playerSpacing * Math.sin(angle),
                teamId: team.id,
              } as { x: number; y: number; teamId?: string });
            }
          });
          while (idx < N) {
            positions.push({ x: cx + (Math.random() - 0.5) * 200, y: cy + (Math.random() - 0.5) * 200 });
            idx++;
          }
          break;
        }

        case 'cross': {
          const armLength = R;
          const perArm = Math.ceil(N / 4);
          const armSpacing = armLength / (perArm || 1);
          const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
          let idx = 0;
          angles.forEach((angle) => {
            for (let i = 1; i <= perArm && idx < N; i++, idx++) {
              positions.push({
                x: cx + armSpacing * i * Math.cos(angle),
                y: cy + armSpacing * i * Math.sin(angle),
              });
            }
          });
          break;
        }

        case 'spiral': {
          const totalAngle = massImportSpiralTurns * 2 * Math.PI;
          for (let i = 0; i < N; i++) {
            const t = N > 1 ? i / (N - 1) : 0;
            const angle = t * totalAngle;
            const radius = R * t;
            positions.push({ x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) });
          }
          break;
        }

        case 'doubleCircle': {
          const innerCount = Math.floor(N / 2);
          const outerCount = N - innerCount;
          const innerR = R * 0.5;
          const outerR = R;
          for (let i = 0; i < innerCount; i++) {
            const angle = (i * 2 * Math.PI) / innerCount;
            positions.push({ x: cx + innerR * Math.cos(angle), y: cy + innerR * Math.sin(angle) });
          }
          for (let i = 0; i < outerCount; i++) {
            const angle = (i * 2 * Math.PI) / outerCount;
            positions.push({ x: cx + outerR * Math.cos(angle), y: cy + outerR * Math.sin(angle) });
          }
          break;
        }

        case 'zigzag': {
          const spacing = 100;
          const cols = Math.ceil(Math.sqrt(N * 2));
          const startX = cx - ((cols - 1) * spacing) / 2;
          for (let i = 0; i < N; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const yOffset = row % 2 === 0 ? massImportZigzagAmp : -massImportZigzagAmp;
            positions.push({ x: startX + col * spacing, y: cy + row * spacing * 0.8 + yOffset });
          }
          break;
        }
      }

      return positions;
    };

    const positions = getPositions(massImportMode);
    massImportNames.forEach((name, i) => {
      const pos = positions[i];
      createPlayer(name, i, pos?.x ?? cx, pos?.y ?? cy, pos?.teamId);
    });

    setShowMassImportModal(false);
  };

  // Section content renderers
  const renderCreatePlayer = () => (
    <div className="flex flex-col gap-2 px-1">
      <input
        type="text"
        placeholder="Nom du joueur"
        value={newPlayerName}
        onChange={(e) => setNewPlayerName(e.target.value)}
        className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <div className="flex items-center gap-2">
        <ColorPicker
          color={newPlayerColor}
          onChange={setNewPlayerColor}
          label="Couleur du joueur"
        />
        <button
          onClick={handleAddPlayer}
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Ajouter
        </button>
      </div>
    </div>
  );

  const renderPlayersList = () => (
    <div className="flex flex-col gap-2">
      {playerTemplates.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Aucun joueur créé.</p>
      ) : (
        <>
          <div className="flex justify-end mb-1">
            <button
              onClick={() => {
                if (window.confirm(`Supprimer les ${playerTemplates.length} modèles de joueurs ?`)) {
                  [...playerTemplates].forEach(p => deletePlayerTemplate(p.id));
                }
              }}
              className="text-xs text-destructive hover:text-destructive/80 hover:bg-destructive/10 px-2 py-1 rounded transition-colors flex items-center gap-1"
              title="Supprimer tous les joueurs"
            >
              <Trash2 size={12} /> Tout supprimer
            </button>
          </div>
          {playerTemplates.map((player) => {
          const team = teams.find(t => t.id === player.teamId);
          return (
          <div
            key={player.id}
            className="flex items-center justify-between p-2 rounded-md border border-border bg-card hover:bg-accent/50 group"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify({ type: 'new_player', data: player }));
            }}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
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
              <span className="text-sm font-medium">{player.name}</span>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setEditingEntity({ type: 'playerTemplate', id: player.id })}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md"
                title="Modifier"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => deletePlayerTemplate(player.id)}
                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                title="Supprimer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        );
      })}
        </>
      )}
    </div>
  );

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

      <button
        onClick={openMassImportModal}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2 rounded-md font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
      >
        <Plus size={18} /> Configurer l'import
      </button>
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
          {sectionOrder.map((sectionId) => {
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
    </DndContext>
  );
};
