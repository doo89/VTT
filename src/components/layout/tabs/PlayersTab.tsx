import { Plus, Trash2, Edit2, Users, icons } from 'lucide-react';
import React, { useState } from 'react';
import { useVttStore } from '../../../store';
import { ColorPicker } from '../../ColorPicker';

const TEAM_ICONS = [
  'Users', 'Shield', 'Sword', 'Heart', 'Star', 'Flag', 'Skull', 'Ghost',
  'Crown', 'Flame', 'Zap', 'Droplet', 'Sun', 'Moon', 'Eye', 'Feather',
  'Key', 'Anchor', 'Axe', 'Castle', 'Crosshair', 'Hexagon', 'Sprout', 'Target', 'Gem'
];

export const PlayersTab: React.FC = () => {
  const { playerTemplates, teams, setEditingEntity, addPlayerTemplate, deletePlayerTemplate, addTeam, deleteTeam } = useVttStore();
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerColor, setNewPlayerColor] = useState('#ef4444');

  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamColor, setNewTeamColor] = useState('#3b82f6');
  const [newTeamIcon, setNewTeamIcon] = useState('Users');

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

  return (
    <div className="flex flex-col gap-6">
      {/* Create Player Section */}
      <section className="flex flex-col gap-3">
        <h3 className="font-semibold text-sm border-b border-border pb-1">Créer un Joueur (Modèle)</h3>
        <div className="flex flex-col gap-2">
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
      </section>

      {/* List Players Section */}
      <section className="flex flex-col gap-3">
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

      {/* Teams Section */}
      <section className="flex flex-col gap-3 pt-4 border-t border-border">
        <h3 className="font-semibold text-sm border-b border-border pb-1">Créer une Équipe</h3>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Nom de l'équipe"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Icône de l'équipe</span>
            <div className="flex flex-wrap gap-1.5 bg-input border border-border rounded-md p-2 max-h-32 overflow-y-auto">
              {TEAM_ICONS.map(iconName => {
                const IconComponent = icons[iconName as keyof typeof icons];
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
      </section>
    </div>
  );
};