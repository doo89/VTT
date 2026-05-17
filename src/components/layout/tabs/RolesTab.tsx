import { Plus, Trash2, Edit2, ChevronDown, ChevronRight, icons, ChevronsUpDown, ChevronsDownUp, Copy, GripVertical } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { useVttStore } from '../../../store';
import { ColorPicker } from '../../ColorPicker';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './RolesTab.css';

const DynamicColor: React.FC<{ color: string; children?: React.ReactNode; className?: string; isBackground?: boolean }> = ({ color, children, className, isBackground }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (ref.current) {
      if (isBackground) {
        ref.current.style.backgroundColor = color;
      } else {
        ref.current.style.color = color;
      }
    }
  }, [color, isBackground]);
  return <div ref={ref} className={className}>{children}</div>;
};

function SortableSection({ id, children, isOpen, title, onToggle, extraHeader }: {
  id: string;
  children: React.ReactNode;
  isOpen: boolean;
  title: string;
  onToggle: () => void;
  extraHeader?: React.ReactNode;
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
      <div className="flex items-center justify-between bg-accent/30 hover:bg-accent/50 p-2 rounded cursor-pointer transition-colors group">
        <div className="flex items-center gap-2 flex-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-accent/80 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical size={14} className="text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-sm flex-1" onClick={onToggle}>{title}</h3>
          {extraHeader}
        </div>
        <div onClick={onToggle}>
          {isOpen ? <ChevronDown size={16} className="text-blue-500" /> : <ChevronRight size={16} className="text-blue-500" />}
        </div>
      </div>
      
      {isOpen && children}
    </section>
  );
}

export const RolesTab: React.FC = () => {
  const { roles, teams, setEditingEntity, addRole, updateRole, deleteRole } = useVttStore();
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#3b82f6');
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});

  const [sectionOrder, setSectionOrder] = useState([
    'createRole',
    'rolesList',
  ]);

  const [openSections, setOpenSections] = useState({
    createRole: true,
    rolesList: true,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

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

  const handleAddRole = () => {
    if (!newRoleName.trim()) return;

    addRole({
      name: newRoleName,
      color: newRoleColor,
      lives: 1,
      isUnique: true,
      teamId: null,
      tags: [],
      isSelectableForDistribution: false,
      distributionQuantity: 1,
      defaultCount: 1,
      minCount: 0,
      maxCount: 99,
      isFiller: false,
      isMinMandatory: false,
    });
    setNewRoleName('');
  };

  const handleDuplicateRole = (role: typeof roles[0]) => {
    const { id, ...roleData } = role;
    addRole({
      ...roleData,
      name: `${role.name} (Copie)`,
      isSelectableForDistribution: false,
    });
  };

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

  const renderCreateRole = () => (
    <div className="flex flex-col gap-3 px-1">
      <input
        type="text"
        placeholder="Nom du rôle"
        value={newRoleName}
        onChange={(e) => setNewRoleName(e.target.value)}
        className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />

      <div className="flex items-center gap-2">
        <ColorPicker
          color={newRoleColor}
          onChange={setNewRoleColor}
          label="Couleur du rôle"
        />
        <button
          onClick={handleAddRole}
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Ajouter Rôle
        </button>
      </div>
    </div>
  );

  const renderRolesList = () => (
    <div className="flex flex-col gap-2">
      {roles.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Aucun rôle défini.</p>
      ) : (
        <>
          {Object.entries(rolesByTeam).map(([teamId, teamRoles]) => {
            if (teamRoles.length === 0) return null;

            const team = teamId === 'no-team' ? null : teams.find(t => t.id === teamId);
            const isExpanded = expandedTeams[teamId] !== false;
            const TeamIcon = team && team.icon ? icons[team.icon as keyof typeof icons] : null;

            return (
              <div key={teamId} className="flex flex-col gap-1">
                <button
                  onClick={() => toggleTeam(teamId)}
                  className="flex items-center justify-between w-full p-1.5 rounded bg-muted/50 hover:bg-muted text-sm font-medium transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    {team ? (
                      <DynamicColor color={team.color} className="team-header-content">
                        {team.imageUrl ? (
                          <img src={team.imageUrl} className="team-image-icon" alt="" />
                        ) : (
                          TeamIcon && React.createElement(TeamIcon, { size: 14 })
                        )}
                        {team.name}
                      </DynamicColor>
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
                            <DynamicColor 
                              color={role.color} 
                              isBackground 
                              className="role-color-preview" 
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
  );

  const sectionContent: Record<string, { title: string; render: () => React.ReactNode; extraHeader?: React.ReactNode }> = {
    createRole: { title: 'Créer un Rôle', render: renderCreateRole },
    rolesList: {
      title: `Rôles Disponibles (${roles.filter(r => r.isSelectableForDistribution).length}/${roles.length})`,
      render: renderRolesList,
      extraHeader: (
        <button
          onClick={(e) => { e.stopPropagation(); toggleAll(); }}
          className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground"
          title={isAnyCollapsed ? "Tout déplier" : "Tout replier"}
        >
          {isAnyCollapsed ? <ChevronsUpDown size={14} /> : <ChevronsDownUp size={14} />}
        </button>
      ),
    },
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
                extraHeader={section.extraHeader}
              >
                {section.render()}
              </SortableSection>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
};
