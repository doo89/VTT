import { Plus, Trash2, Edit2, Users, icons, ChevronDown, ChevronRight, X } from 'lucide-react';
import React, { useState } from 'react';
import { useVttStore } from '../../../store';
import { ColorPicker } from '../../ColorPicker';

const TEAM_ICONS = [
  'Users', 'Shield', 'Sword', 'Heart', 'Star', 'Flag', 'Skull', 'Ghost',
  'Crown', 'Flame', 'Zap', 'Droplet', 'Sun', 'Moon', 'Eye', 'Feather',
  'Key', 'Anchor', 'Axe', 'Castle', 'Crosshair', 'Hexagon', 'Sprout', 'Target', 'Gem'
];

export const PlayersTab: React.FC = () => {
  const { playerTemplates, teams, setEditingEntity, addPlayerTemplate, deletePlayerTemplate, addTeam, deleteTeam, room, addPlayer } = useVttStore();
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerColor, setNewPlayerColor] = useState('#ef4444');

  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamColor, setNewTeamColor] = useState('#3b82f6');
  const [newTeamIcon, setNewTeamIcon] = useState('Users');

  // Collapse states
  const [openSections, setOpenSections] = useState({
    createPlayer: true,
    massImport: false,
    createTeam: false,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Mass Import states
  const [massImportCount, setMassImportCount] = useState(10);
  const [showMassImportModal, setShowMassImportModal] = useState(false);
  const [massImportNames, setMassImportNames] = useState<string[]>([]);

  const handleAddPlayer = () => {
    if (!newPlayerName.trim()) return;

    // Create the template to display in the left panel
    addPlayerTemplate({
      name: newPlayerName,
      color: newPlayerColor,
      roleId: null,
      teamId: null,
      size: 40, // Default size
    });
    setNewPlayerName('');
  };

  const openMassImportModal = () => {
    const count = Math.max(1, massImportCount);
    // Fill array with empty strings
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
    const cx = room.width / 2;
    const cy = room.height / 2;
    // Calculate radius to fit nicely inside the room
    const R = Math.min(room.width, room.height) * 0.35;

    massImportNames.forEach((name, i) => {
      const finalName = name.trim() || `Joueur ${i + 1}`;
      const color = getRandomColor();
      
      addPlayerTemplate({
        name: finalName,
        color: color,
        roleId: null,
        teamId: null,
        size: 40,
      });

      const angle = (i * 2 * Math.PI) / N;
      const x = cx + R * Math.cos(angle);
      const y = cy + R * Math.sin(angle);

      addPlayer({
        name: finalName,
        color: color,
        roleId: null,
        teamId: null,
        size: 40,
        x: x,
        y: y,
        isDead: false,
        tags: []
      });
    });
    setShowMassImportModal(false);
  };

  return (
    <div className="flex flex-col gap-6 relative">
      {/* Create Player Section */}
      <section className="flex flex-col gap-3">
        <div 
          className="flex items-center justify-between bg-accent/30 hover:bg-accent/50 p-2 rounded cursor-pointer transition-colors"
          onClick={() => toggleSection('createPlayer')}
        >
          <h3 className="font-semibold text-sm">Créer un Joueur (Modèle)</h3>
          {openSections.createPlayer ? <ChevronDown size={16} className="text-blue-500" /> : <ChevronRight size={16} className="text-blue-500" />}
        </div>
        
        {openSections.createPlayer && (
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
        )}
      </section>

      {/* List Players Section (Always Visible) */}
      <section className="flex flex-col gap-3 pt-2 border-t border-border">
        <h3 className="font-semibold text-sm border-b border-border pb-1">Joueurs</h3>
        <div className="flex flex-col gap-2">
          {playerTemplates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucun joueur créé.</p>
          ) : (
            playerTemplates.map((player) => {
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
                    <div
                      className="w-6 h-6 rounded-full border border-border"
                      style={{ backgroundColor: player.color }}
                    />
                    {team && (
                      <div
                        className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full border border-background"
                        style={{ backgroundColor: team.color }}
                        title={`Équipe: ${team.name}`}
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
          })
          )}
        </div>
      </section>

      {/* Mass Import Section */}
      <section className="flex flex-col gap-3">
        <div 
          className="flex items-center justify-between bg-accent/30 hover:bg-accent/50 p-2 rounded cursor-pointer transition-colors border-t border-border mt-2"
          onClick={() => toggleSection('massImport')}
        >
          <h3 className="font-semibold text-sm">Ajouter des joueurs en masse</h3>
          {openSections.massImport ? <ChevronDown size={16} className="text-blue-500" /> : <ChevronRight size={16} className="text-blue-500" />}
        </div>

        {openSections.massImport && (
          <div className="flex items-center gap-2 px-1">
            <input
              type="number"
              min={1}
              max={100}
              value={massImportCount}
              onChange={(e) => setMassImportCount(parseInt(e.target.value) || 1)}
              className="w-20 bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring text-center"
            />
            <button
              onClick={openMassImportModal}
              className="bg-accent text-foreground hover:bg-accent/80 p-2 flex items-center justify-center rounded-md font-bold text-lg aspect-square h-[38px] w-[38px]"
            >
              <Plus size={20} />
            </button>
          </div>
        )}
      </section>

      {/* Teams Section */}
      <section className="flex flex-col gap-3">
        <div 
          className="flex items-center justify-between bg-accent/30 hover:bg-accent/50 p-2 rounded cursor-pointer transition-colors border-t border-border mt-2"
          onClick={() => toggleSection('createTeam')}
        >
          <h3 className="font-semibold text-sm">Créer une Équipe</h3>
          {openSections.createTeam ? <ChevronDown size={16} className="text-blue-500" /> : <ChevronRight size={16} className="text-blue-500" />}
        </div>
        
        {openSections.createTeam && (
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
                    <div key={team.id} className="flex items-center justify-between p-2 rounded-md border border-border bg-card hover:bg-accent/50 group">
                      <div className="flex items-center gap-3">
                        <IconComponent size={16} style={{ color: team.color }} />
                        <span className="text-sm font-medium" style={{ color: team.color }}>{team.name}</span>
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
        )}
      </section>

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
              <button onClick={() => setShowMassImportModal(false)} className="text-muted-foreground hover:text-foreground">
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
    </div>
  );
};