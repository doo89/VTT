import React, { useMemo, useState } from 'react';
import { useVttStore } from '../store';
import * as icons from 'lucide-react';
import { X, ChevronDown, ChevronRight, Copy, Edit2, Trash2, ChevronsUpDown, ChevronsDownUp } from 'lucide-react';

export const RoleSelectorWindow: React.FC = () => {
  const { 
    roles, teams, roleSelectorState, setRoleSelectorState, 
    updateRole, deleteRole, setEditingEntity 
  } = useVttStore();

  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});

  const rolesByTeam = useMemo(() => {
    const grouped: Record<string, typeof roles> = {
      'no-team': []
    };

    teams.forEach(t => grouped[t.id] = []);

    roles.forEach(role => {
      if (role.teamId && grouped[role.teamId]) {
        grouped[role.teamId].push(role);
      } else {
        grouped['no-team'].push(role);
      }
    });

    return grouped;
  }, [roles, teams]);

  const toggleTeam = (teamId: string) => {
    setExpandedTeams(prev => ({ ...prev, [teamId]: !prev[teamId] }));
  };

  const isAnyCollapsed = useMemo(() => {
    return Object.keys(rolesByTeam).some(id => expandedTeams[id] === false);
  }, [rolesByTeam, expandedTeams]);

  const toggleAll = () => {
    const newState: Record<string, boolean> = {};
    const expand = isAnyCollapsed;
    Object.keys(rolesByTeam).forEach(id => {
      newState[id] = expand;
    });
    setExpandedTeams(newState);
  };

  const handleDuplicateRole = (role: typeof roles[0]) => {
    const { id, ...roleData } = role;
    useVttStore.getState().addRole({
      ...roleData,
      name: `${role.name} (Copie)`,
      isSelectableForDistribution: false,
    });
  };

  if (!roleSelectorState.isOpen) return null;

  return (
    <div 
      className="fixed z-[100] bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200"
      style={{
        left: roleSelectorState.x,
        top: roleSelectorState.y,
        width: '350px',
        maxHeight: '80vh'
      }}
    >
      {/* Header / Drag Handle */}
      <div 
        className="px-4 py-3 bg-muted/50 border-b border-border flex items-center justify-between cursor-move"
        onMouseDown={(e) => {
          const startX = e.clientX - roleSelectorState.x;
          const startY = e.clientY - roleSelectorState.y;

          const handleMouseMove = (moveEvent: MouseEvent) => {
            setRoleSelectorState({
              x: moveEvent.clientX - startX,
              y: moveEvent.clientY - startY
            });
          };

          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };

          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
      >
        <div className="flex items-center gap-2">
          <icons.Shuffle size={18} className="text-purple-400" />
          <h3 className="font-bold text-sm">Choisir les Rôles</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAll}
            className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground"
            title={isAnyCollapsed ? "Tout déplier" : "Tout replier"}
          >
            {isAnyCollapsed ? <ChevronsUpDown size={14} /> : <ChevronsDownUp size={14} />}
          </button>
          <button 
            onClick={() => setRoleSelectorState({ isOpen: false })}
            className="p-1 hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          {roles.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucun rôle défini.</p>
          ) : (
            <>
              {Object.entries(rolesByTeam).map(([teamId, teamRoles]) => {
                if (teamRoles.length === 0) return null;

                const team = teamId === 'no-team' ? null : teams.find(t => t.id === teamId);
                const isExpanded = expandedTeams[teamId] !== false; // Default to true
                const TeamIcon = team && team.icon ? (icons as any)[team.icon] : null;

                return (
                  <div key={teamId} className="flex flex-col gap-1">
                    <button
                      onClick={() => toggleTeam(teamId)}
                      className="flex items-center justify-between w-full p-1.5 rounded bg-muted/50 hover:bg-muted text-sm font-medium transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        {team ? (
                          <div className="flex items-center gap-1.5" style={{ color: team.color }}>
                            {team.imageUrl ? (
                              <img src={team.imageUrl} className="w-3.5 h-3.5 rounded-full object-cover" alt="" />
                            ) : (
                              TeamIcon && React.createElement(TeamIcon, { size: 14 })
                            )}
                            {team.name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Sans Équipe</span>
                        )}
                        <span className="text-xs text-muted-foreground ml-1">({teamRoles.filter(r => r.isSelectableForDistribution).length}/{teamRoles.length})</span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="flex flex-col gap-1.5 pl-4 mt-1 border-l-2 border-border/30 ml-2">
                        {teamRoles.map((role) => (
                          <div
                            key={role.id}
                            className="flex items-center justify-between p-2 rounded-md border border-border bg-card hover:bg-accent/50 group"
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={role.isSelectableForDistribution || false}
                                onChange={(e) => updateRole(role.id, { isSelectableForDistribution: e.target.checked })}
                                className="w-4 h-4 rounded border-border text-primary focus:ring-ring cursor-pointer"
                                title="Sélectionner pour la distribution aléatoire"
                              />
                              <div
                                className="w-4 h-4 rounded-sm border border-border"
                                style={{ backgroundColor: role.color }}
                              />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium leading-none">{role.name}</span>
                                <span className="text-[10px] text-muted-foreground mt-1">
                                  {role.lives} PV • {role.isUnique ? 'Unique' : 'Multiple'}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleDuplicateRole(role)}
                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md"
                                title="Dupliquer"
                              >
                                <Copy size={14} />
                              </button>
                              <button
                                onClick={() => setEditingEntity({ type: 'role', id: role.id })}
                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md"
                                title="Modifier"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => deleteRole(role.id)}
                                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                                title="Supprimer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
