import { Plus, Trash2, Edit2, ChevronDown, ChevronRight, icons, ChevronsUpDown, ChevronsDownUp, Copy, GripVertical, AlertTriangle, Search, X, ArrowUpDown, ArrowDownAZ, List, LayoutList, Download, Upload, Package, BarChart3, Users, FolderPlus, CheckSquare, Square, Filter, Link2, History, Save, FolderOpen, Clock } from 'lucide-react';
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useVttStore } from '../../../store';
import { ColorPicker } from '../../ColorPicker';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useVirtualizer } from '@tanstack/react-virtual';
import './RolesTab.css';
import { PREDEFINED_ROLE_TEMPLATES } from '../../../lib/role-templates';

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

function DroppableTeamHeader({ teamId, team, isExpanded, TeamIcon, displayRoles, toggleTeam, children }: {
  teamId: string;
  team: { id: string; name: string; color: string; icon?: string; imageUrl?: string } | null;
  isExpanded: boolean;
  TeamIcon: any;
  displayRoles: any[];
  toggleTeam: (id: string) => void;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: teamId });
  return (
    <div className="flex flex-col gap-1" ref={setNodeRef}>
      <button
        onClick={() => toggleTeam(teamId)}
        className={`flex items-center justify-between w-full p-1.5 rounded bg-muted/50 hover:bg-muted text-sm font-medium transition-colors ${isOver ? 'ring-2 ring-primary ring-offset-1' : ''}`}
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
          <span className="text-xs text-muted-foreground ml-1">({displayRoles.filter((r: any) => r.isSelectableForDistribution).length}/{displayRoles.length})</span>
        </div>
      </button>
      {isExpanded && children}
    </div>
  );
}

function DraggableRoleItem({ role, usageCount, isSelected, viewMode, onToggleSelect, onDuplicate, onEdit, onDelete, onUpdate, onDragStart }: {
  role: any;
  usageCount: number;
  isSelected: boolean;
  viewMode: 'detailed' | 'compact';
  onToggleSelect: (id: string) => void;
  onDuplicate: (role: any) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  onUpdate: (id: string, updates: any) => void;
  onDragStart: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `role-${role.id}` });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const IconComponent = role.imageUrl ? null : null;

  if (viewMode === 'compact') {
    return (
      <div ref={setNodeRef} style={style} className="flex items-center justify-between px-2 py-1 rounded hover:bg-accent/50 group cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-1.5 overflow-hidden flex-1" {...listeners} onMouseDown={() => onDragStart(role.id)}>
          <input type="checkbox" checked={isSelected} onChange={() => onToggleSelect(role.id)} onClick={(e) => e.stopPropagation()} className="rounded border-border text-primary focus:ring-primary h-3 w-3 shrink-0 cursor-pointer" />
          <div className="w-3 h-3 rounded shrink-0" style={{ backgroundColor: role.color }} />
          <span className="text-xs font-medium truncate">{role.name}</span>
          {usageCount > 0 && <span className="text-[8px] text-muted-foreground shrink-0">×{usageCount}</span>}
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={(e) => { e.stopPropagation(); onDuplicate(role); }} className="p-0.5 text-muted-foreground hover:text-foreground" aria-label="Dupliquer"><Copy size={10} /></button>
          <button onClick={(e) => { e.stopPropagation(); onEdit(role.id); }} className="p-0.5 text-muted-foreground hover:text-foreground" aria-label="Modifier"><Edit2 size={10} /></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(role.id, role.name); }} className="p-0.5 text-muted-foreground hover:text-destructive" aria-label="Supprimer"><Trash2 size={10} /></button>
        </div>
      </div>
    );
  }
  return (
    <div ref={setNodeRef} style={style} className={`flex items-center justify-between p-2 rounded-md border border-border bg-card hover:bg-accent/50 group cursor-grab active:cursor-grabbing ${isSelected ? 'ring-1 ring-primary' : ''}`}>
      <div className="flex items-center gap-3">
        <input type="checkbox" checked={isSelected} onChange={() => onToggleSelect(role.id)} className="w-4 h-4 rounded border-border text-primary focus:ring-ring cursor-pointer" />
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-accent/80 opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={() => onDragStart(role.id)}>
          <GripVertical size={14} className="text-muted-foreground" />
        </div>
        <DynamicColor color={role.color} isBackground className="role-color-preview" />
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-medium leading-none truncate">{role.name}</span>
          <span className="text-[10px] text-muted-foreground mt-1">
            {role.lives} PV • {role.isUnique ? 'Unique' : 'Multiple'}
          </span>
          {role.description && <span className="text-[10px] text-muted-foreground line-clamp-2 italic">{role.description}</span>}
        </div>
        {usageCount > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0" title="Assigné à {usageCount} joueur(s)">×{usageCount}</span>}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); onDuplicate(role); }} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md" title="Dupliquer"><Copy size={14} /></button>
        <button onClick={(e) => { e.stopPropagation(); onEdit(role.id); }} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md" title="Modifier"><Edit2 size={14} /></button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(role.id, role.name); }} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md" title="Supprimer"><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

function VirtualizedRoleList({ roles, viewMode, roleUsageCounts, selectedRoleIds, toggleRoleSelection, handleDuplicateRole, setEditingEntity, handleRequestDelete, updateRole, handleRoleDragStart }: {
  roles: any[];
  viewMode: 'detailed' | 'compact';
  roleUsageCounts: Record<string, number>;
  selectedRoleIds: Set<string>;
  toggleRoleSelection: (id: string) => void;
  handleDuplicateRole: (role: any) => void;
  setEditingEntity: any;
  handleRequestDelete: (id: string, name: string) => void;
  updateRole: (id: string, updates: any) => void;
  handleRoleDragStart: (id: string) => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const hasSearch = false;

  const virtualizer = useVirtualizer({
    count: roles.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => viewMode === 'compact' ? 32 : 60,
    overscan: 5,
  });

  if (roles.length === 0) {
    return <p className="text-xs text-muted-foreground italic text-center py-2">{hasSearch ? 'Aucun résultat' : 'Aucun rôle'}</p>;
  }

  return (
    <div
      ref={parentRef}
      className="overflow-auto"
      style={{ maxHeight: '400px' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const role = roles[virtualRow.index];
          const usageCount = roleUsageCounts[role.id] || 0;
          const isSelected = selectedRoleIds.has(role.id);
          return (
            <div
              key={role.id}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <DraggableRoleItem
                role={role}
                usageCount={usageCount}
                isSelected={isSelected}
                viewMode={viewMode}
                onToggleSelect={toggleRoleSelection}
                onDuplicate={handleDuplicateRole}
                onEdit={(id) => setEditingEntity({ type: 'role', id })}
                onDelete={handleRequestDelete}
                onUpdate={updateRole}
                onDragStart={handleRoleDragStart}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
  const { roles, teams, players, setEditingEntity, addRole, updateRole, deleteRole, addTeam } = useVttStore();
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#3b82f6');
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});
  const [nameError, setNameError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'date'>('name');
  const [viewMode, setViewMode] = useState<'detailed' | 'compact'>('detailed');
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<Set<number>>(new Set());
  const [showDashboard, setShowDashboard] = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(new Set());
  const [draggedRoleId, setDraggedRoleId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamColor, setNewTeamColor] = useState('#6366f1');
  const [showCreateTeam, setShowCreateTeam] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [filterUnique, setFilterUnique] = useState<string>('all');
  const [filterDistribution, setFilterDistribution] = useState<string>('all');
  const [filterUsage, setFilterUsage] = useState<string>('all');

  const [showDependencies, setShowDependencies] = useState(false);
  const [roleDependencies, setRoleDependencies] = useState<Record<string, string[]>>(() => {
    try { const saved = localStorage.getItem('roleDependencies'); return saved ? JSON.parse(saved) : {}; } catch { return {}; }
  });

  const [showPresets, setShowPresets] = useState(false);
  const [savedPresets, setSavedPresets] = useState<Array<{ name: string; roles: any[]; teams: any[]; createdAt: string }>>(() => {
    try { const saved = localStorage.getItem('rolePresets'); return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  const [newPresetName, setNewPresetName] = useState('');

  const [showHistory, setShowHistory] = useState(false);
  const [changeHistory, setChangeHistory] = useState<Array<{ action: string; roleName: string; timestamp: string; details: string }>>(() => {
    try { const saved = localStorage.getItem('roleChangeHistory'); return saved ? JSON.parse(saved) : []; } catch { return []; }
  });

  const [sectionOrder, setSectionOrder] = useState(() => {
    try { const saved = localStorage.getItem('rolesTabSectionOrder'); return saved ? JSON.parse(saved) : ['createRole', 'rolesList']; } catch { return ['createRole', 'rolesList']; }
  });

  const [openSections, setOpenSections] = useState({
    createRole: true,
    rolesList: true,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => { try { localStorage.setItem('rolesTabSectionOrder', JSON.stringify(sectionOrder)); } catch {} }, [sectionOrder]);
  useEffect(() => { try { localStorage.setItem('roleDependencies', JSON.stringify(roleDependencies)); } catch {} }, [roleDependencies]);
  useEffect(() => { try { localStorage.setItem('rolePresets', JSON.stringify(savedPresets)); } catch {} }, [savedPresets]);
  useEffect(() => { try { localStorage.setItem('roleChangeHistory', JSON.stringify(changeHistory)); } catch {} }, [changeHistory]);

  const addHistoryEntry = useCallback((action: string, roleName: string, details: string) => {
    setChangeHistory(prev => [{ action, roleName, timestamp: new Date().toISOString(), details }, ...prev].slice(0, 50));
  }, []);

  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;
    setSavedPresets(prev => [...prev, { name: newPresetName.trim(), roles, teams, createdAt: new Date().toISOString() }]);
    setNewPresetName('');
    addHistoryEntry('save', newPresetName.trim(), `Préréglage sauvegardé avec ${roles.length} rôles`);
  };

  const handleLoadPreset = (preset: typeof savedPresets[0]) => {
    preset.roles.forEach((role: any) => { const { id, ...roleData } = role; addRole(roleData); });
    addHistoryEntry('load', preset.name, `${preset.roles.length} rôles importés`);
    setShowPresets(false);
  };

  const handleDeletePreset = (index: number) => {
    setSavedPresets(prev => prev.filter((_, i) => i !== index));
  };

  const addRoleDependency = (roleId: string, dependentRoleId: string) => {
    setRoleDependencies(prev => ({
      ...prev,
      [roleId]: [...(prev[roleId] || []), dependentRoleId]
    }));
  };

  const removeRoleDependency = (roleId: string, dependentRoleId: string) => {
    setRoleDependencies(prev => ({
      ...prev,
      [roleId]: (prev[roleId] || []).filter(id => id !== dependentRoleId)
    }));
  };

  const toggleRoleSelection = (id: string) => {
    setSelectedRoleIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllRoles = () => {
    const allIds = roles.map(r => r.id);
    setSelectedRoleIds(new Set(allIds));
  };

  const clearSelection = () => setSelectedRoleIds(new Set());

  const handleBulkDelete = useCallback(() => {
    if (selectedRoleIds.size === 0) return;
    selectedRoleIds.forEach(id => deleteRole(id));
    setSelectedRoleIds(new Set());
  }, [selectedRoleIds, deleteRole]);

  const handleBulkTeamAssign = useCallback((teamId: string | null) => {
    if (selectedRoleIds.size === 0) return;
    selectedRoleIds.forEach(id => updateRole(id, { teamId }));
    setSelectedRoleIds(new Set());
  }, [selectedRoleIds, updateRole]);

  const handleAddTeam = () => {
    if (!newTeamName.trim()) return;
    addTeam({ name: newTeamName.trim(), color: newTeamColor, icon: 'Users', description: '' });
    setNewTeamName(''); setNewTeamColor('#6366f1'); setShowCreateTeam(false);
  };

  const roleUsageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    roles.forEach(role => { counts[role.id] = players.filter(p => p.roleId === role.id).length; });
    return counts;
  }, [roles, players]);

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

  const filteredRolesByTeam = useMemo(() => {
    if (!searchQuery.trim() && filterTeam === 'all' && filterUnique === 'all' && filterDistribution === 'all' && filterUsage === 'all') return rolesByTeam;
    const query = searchQuery.toLowerCase();
    const filtered: Record<string, typeof roles> = {};
    Object.entries(rolesByTeam).forEach(([teamId, teamRoles]) => {
      let matching = teamRoles;
      if (query) matching = matching.filter(r => r.name.toLowerCase().includes(query) || (r.description && r.description.toLowerCase().includes(query)));
      if (filterTeam !== 'all') matching = matching.filter(r => (r.teamId || 'no-team') === filterTeam);
      if (filterUnique !== 'all') matching = matching.filter(r => r.isUnique === (filterUnique === 'unique'));
      if (filterDistribution !== 'all') matching = matching.filter(r => r.isSelectableForDistribution === (filterDistribution === 'in'));
      if (filterUsage !== 'all') {
        if (filterUsage === 'used') matching = matching.filter(r => (roleUsageCounts[r.id] || 0) > 0);
        else if (filterUsage === 'unused') matching = matching.filter(r => (roleUsageCounts[r.id] || 0) === 0);
      }
      if (matching.length > 0 || teamId === 'no-team') filtered[teamId] = matching;
    });
    return filtered;
  }, [rolesByTeam, searchQuery, filterTeam, filterUnique, filterDistribution, filterUsage, roleUsageCounts]);

  const sortedFilteredRolesByTeam = useMemo(() => {
    const sorted: Record<string, typeof roles> = {};
    Object.entries(filteredRolesByTeam).forEach(([teamId, teamRoles]) => {
      sorted[teamId] = [...teamRoles].sort((a, b) => sortBy === 'name' ? a.name.localeCompare(b.name, 'fr') : 0);
    });
    return sorted;
  }, [filteredRolesByTeam, sortBy]);

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

    const duplicate = roles.find(r => r.name.toLowerCase() === newRoleName.trim().toLowerCase());
    if (duplicate) { setNameError(`Un rôle nommé "${duplicate.name}" existe déjà.`); return; }
    setNameError('');

    addRole({
      name: newRoleName.trim(),
      color: newRoleColor,
      lives: 1,
      isUnique: true,
      teamId: null,
      tags: [],
      isSelectableForDistribution: false,
      distributionQuantity: 1,
      minCount: 0,
      maxCount: 99,
      isFiller: false,
      isMinMandatory: false,
    });
    addHistoryEntry('add', newRoleName.trim(), 'Rôle créé');
    setNewRoleName('');
  };

  const handleDuplicateRole = (role: typeof roles[0]) => {
    const { id, ...roleData } = role;
    let newName = `${role.name} (Copie)`; let counter = 1;
    while (roles.some(r => r.name === newName)) { newName = `${role.name} (Copie ${counter})`; counter++; }
    addRole({
      ...roleData,
      name: newName,
      isSelectableForDistribution: false,
    });
  };

  const handleRequestDelete = useCallback((id: string, name: string) => setDeleteConfirm({ id, name }), []);
  const handleConfirmDelete = useCallback(() => {
    if (!deleteConfirm) return;
    addHistoryEntry('delete', deleteConfirm.name, 'Rôle supprimé');
    deleteRole(deleteConfirm.id);
    setDeleteConfirm(null);
  }, [deleteConfirm, deleteRole, addHistoryEntry]);

  const handleExportRoles = useCallback(() => {
    const data = { version: '1.0', roles, teams, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `roles-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
  }, [roles, teams]);

  const handleImportRoles = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.roles || !Array.isArray(data.roles)) return;
      data.roles.forEach((role: any) => { const { id, ...roleData } = role; addRole(roleData); });
    } catch {}
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [addRole]);

  const handleImportTemplates = useCallback(() => {
    if (selectedTemplates.size === 0) return;
    const templatesToImport = Array.from(selectedTemplates).map(i => PREDEFINED_ROLE_TEMPLATES[i]);
    templatesToImport.forEach(template => {
      let newName = template.name;
      let counter = 1;
      while (roles.some(r => r.name === newName)) {
        newName = `${template.name} (${counter})`;
        counter++;
      }
      addRole({ ...template, name: newName });
    });
    setSelectedTemplates(new Set());
    setShowTemplates(false);
  }, [selectedTemplates, roles, addRole]);

  const toggleTemplateSelection = (index: number) => {
    setSelectedTemplates(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  };

  const selectAllTemplates = () => {
    const allIndices = PREDEFINED_ROLE_TEMPLATES.map((_, i) => i).filter(i => !roles.some(r => r.name === PREDEFINED_ROLE_TEMPLATES[i].name));
    setSelectedTemplates(new Set(allIndices));
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
      const activeId = active.id as string;
      if (activeId.startsWith('role-')) {
        const roleId = activeId.replace('role-', '');
        const targetTeamId = over.id === 'no-team' ? null : (over.id as string);
        updateRole(roleId, { teamId: targetTeamId });
        setDraggedRoleId(null);
      } else {
        setSectionOrder((items: string[]) => {
          const oldIndex = items.indexOf(activeId);
          const newIndex = items.indexOf(over.id as string);
          return arrayMove(items, oldIndex, newIndex);
        });
      }
    }
  };

  const handleRoleDragStart = (roleId: string) => setDraggedRoleId(roleId);
  const handleRoleDragEnd = () => setDraggedRoleId(null);

  const renderCreateRole = () => (
    <div className="flex flex-col gap-3 px-1">
      <div>
        <input
          type="text"
          placeholder="Nom du rôle"
          value={newRoleName}
          onChange={(e) => { setNewRoleName(e.target.value); setNameError(''); }}
          className={`w-full bg-input border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 ${nameError ? 'border-destructive focus:ring-destructive' : 'border-border focus:ring-ring'}`}
        />
        {nameError && <p className="text-[10px] text-destructive mt-1">{nameError}</p>}
      </div>

      <div className="flex items-center gap-2">
        <ColorPicker
          color={newRoleColor}
          onChange={setNewRoleColor}
          label="Couleur du rôle"
        />
        <button
          onClick={handleAddRole}
          disabled={!newRoleName.trim()}
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={16} /> Ajouter Rôle
        </button>
      </div>
    </div>
  );

  const renderRolesList = () => {
    const hasSearch = searchQuery.trim() !== '';
    const hasSelection = selectedRoleIds.size > 0;
    return (
    <div className="flex flex-col gap-2">
      {roles.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Aucun rôle défini.</p>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => setSortBy(sortBy === 'name' ? 'date' : 'name')} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Trier">
              {sortBy === 'name' ? <><ArrowDownAZ size={10} /> A-Z</> : <><ArrowUpDown size={10} /> Date</>}
            </button>
            <button onClick={() => setViewMode(viewMode === 'detailed' ? 'compact' : 'detailed')} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Vue">
              {viewMode === 'detailed' ? <><LayoutList size={10} /> Détaillée</> : <><List size={10} /> Compacte</>}
            </button>
            <button onClick={() => setShowCreateTeam(!showCreateTeam)} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Créer une équipe"><FolderPlus size={10} /> Équipe</button>
            <div className="flex-1" />
            <button onClick={handleExportRoles} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Exporter les rôles" aria-label="Exporter"><Download size={12} /></button>
            <button onClick={() => fileInputRef.current?.click()} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Importer des rôles" aria-label="Importer"><Upload size={12} /></button>
            <button onClick={() => setShowTemplates(true)} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Importer des modèles prédéfinis" aria-label="Modèles"><Package size={12} /></button>
            <button onClick={() => setShowDashboard(true)} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Statistiques" aria-label="Statistiques"><BarChart3 size={12} /></button>
            <button onClick={() => setShowFilters(!showFilters)} className={`p-1 rounded transition-colors ${showFilters ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`} title="Filtres avancés" aria-label="Filtres"><Filter size={12} /></button>
            <button onClick={() => setShowDependencies(true)} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Dépendances entre rôles" aria-label="Dépendances"><Link2 size={12} /></button>
            <button onClick={() => setShowPresets(true)} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Préréglages" aria-label="Préréglages"><Save size={12} /></button>
            <button onClick={() => setShowHistory(true)} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Historique" aria-label="Historique"><Clock size={12} /></button>
            <button onClick={hasSelection ? clearSelection : selectAllRoles} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title={hasSelection ? "Désélectionner tout" : "Sélectionner tout"} aria-label="Sélectionner">{hasSelection ? <Square size={12} /> : <CheckSquare size={12} />}</button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportRoles} className="hidden" aria-label="Importer des rôles" />
          </div>

          {hasSelection && (
            <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-md border border-primary/20">
              <span className="text-xs font-medium text-primary">{selectedRoleIds.size} sélectionné(s)</span>
              <div className="flex-1" />
              <select onChange={(e) => handleBulkTeamAssign(e.target.value === 'none' ? null : e.target.value)} className="text-xs bg-background border border-border rounded px-2 py-1" defaultValue="none">
                <option value="none">Assigner à...</option>
                <option value="none">Sans équipe</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <button onClick={handleBulkDelete} className="text-xs px-2 py-1 rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors">Supprimer</button>
              <button onClick={clearSelection} className="text-xs px-2 py-1 rounded bg-muted hover:bg-accent transition-colors">Annuler</button>
            </div>
          )}

          {showCreateTeam && (
            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md border border-border">
              <input type="text" placeholder="Nom de l'équipe" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} className="flex-1 bg-input border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
              <ColorPicker color={newTeamColor} onChange={setNewTeamColor} label="Couleur" className="w-8 h-8" />
              <button onClick={handleAddTeam} disabled={!newTeamName.trim()} className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Créer</button>
              <button onClick={() => setShowCreateTeam(false)} className="p-1 text-muted-foreground hover:text-foreground"><X size={14} /></button>
            </div>
          )}

          {showFilters && (
            <div className="flex flex-wrap items-center gap-2 p-2 bg-muted/30 rounded-md border border-border">
              <span className="text-xs font-medium text-muted-foreground">Filtres:</span>
              <select value={filterTeam} onChange={(e) => setFilterTeam(e.target.value)} className="text-xs bg-background border border-border rounded px-2 py-1">
                <option value="all">Toutes les équipes</option>
                <option value="no-team">Sans équipe</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <select value={filterUnique} onChange={(e) => setFilterUnique(e.target.value)} className="text-xs bg-background border border-border rounded px-2 py-1">
                <option value="all">Unique/Multiple</option>
                <option value="unique">Uniques</option>
                <option value="multiple">Multiples</option>
              </select>
              <select value={filterDistribution} onChange={(e) => setFilterDistribution(e.target.value)} className="text-xs bg-background border border-border rounded px-2 py-1">
                <option value="all">Distribution</option>
                <option value="in">Dans distribution</option>
                <option value="out">Hors distribution</option>
              </select>
              <select value={filterUsage} onChange={(e) => setFilterUsage(e.target.value)} className="text-xs bg-background border border-border rounded px-2 py-1">
                <option value="all">Utilisation</option>
                <option value="used">Assignés</option>
                <option value="unused">Non assignés</option>
              </select>
              <button onClick={() => { setFilterTeam('all'); setFilterUnique('all'); setFilterDistribution('all'); setFilterUsage('all'); }} className="text-xs px-2 py-1 rounded bg-muted hover:bg-accent transition-colors">Réinitialiser</button>
            </div>
          )}

          {Object.entries(sortedFilteredRolesByTeam).map(([teamId, teamRoles]) => {
            if (!hasSearch && teamRoles.length === 0) return null;
            if (hasSearch && teamRoles.length === 0 && rolesByTeam[teamId]?.length === 0) return null;

            const team = teamId === 'no-team' ? null : (teams.find(t => t.id === teamId) || null);
            const isExpanded = expandedTeams[teamId] !== false;
            const TeamIcon = team && team.icon ? icons[team.icon as keyof typeof icons] : null;
            const allTeamRoles = hasSearch ? filteredRolesByTeam[teamId] || [] : (rolesByTeam[teamId] || []);
            const displayRoles = hasSearch ? teamRoles : allTeamRoles;

            return (
              <DroppableTeamHeader key={teamId} teamId={teamId} team={team} isExpanded={isExpanded} TeamIcon={TeamIcon} displayRoles={displayRoles} toggleTeam={toggleTeam}>
                <div className={`flex flex-col ${viewMode === 'compact' ? 'gap-0.5' : 'gap-1.5'} pl-4 mt-1 border-l-2 border-border/30 ml-2`}>
                  {displayRoles.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-2">{hasSearch ? 'Aucun résultat' : 'Aucun rôle'}</p>
                  ) : displayRoles.length > 20 ? (
                    <VirtualizedRoleList
                      roles={displayRoles}
                      viewMode={viewMode}
                      roleUsageCounts={roleUsageCounts}
                      selectedRoleIds={selectedRoleIds}
                      toggleRoleSelection={toggleRoleSelection}
                      handleDuplicateRole={handleDuplicateRole}
                      setEditingEntity={setEditingEntity}
                      handleRequestDelete={handleRequestDelete}
                      updateRole={updateRole}
                      handleRoleDragStart={handleRoleDragStart}
                    />
                  ) : (
                    displayRoles.map((role) => {
                      const usageCount = roleUsageCounts[role.id] || 0;
                      const isSelected = selectedRoleIds.has(role.id);
                      if (viewMode === 'compact') {
                        return (
                          <DraggableRoleItem key={role.id} role={role} usageCount={usageCount} isSelected={isSelected} viewMode="compact" onToggleSelect={toggleRoleSelection} onDuplicate={handleDuplicateRole} onEdit={(id) => setEditingEntity({ type: 'role', id })} onDelete={handleRequestDelete} onUpdate={updateRole} onDragStart={handleRoleDragStart} />
                        );
                      }
                      return (
                        <DraggableRoleItem key={role.id} role={role} usageCount={usageCount} isSelected={isSelected} viewMode="detailed" onToggleSelect={toggleRoleSelection} onDuplicate={handleDuplicateRole} onEdit={(id) => setEditingEntity({ type: 'role', id })} onDelete={handleRequestDelete} onUpdate={updateRole} onDragStart={handleRoleDragStart} />
                      );
                    })
                  )}
                </div>
              </DroppableTeamHeader>
            );
          })}
        </>
      )}
    </div>
  );
  };

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
          {roles.length > 0 && (
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input type="text" placeholder="Rechercher un rôle..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-input border border-border rounded-md pl-8 pr-8 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" aria-label="Rechercher un rôle" />
              {searchQuery && (<button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Effacer"><X size={14} /></button>)}
            </div>
          )}
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
                extraHeader={section.extraHeader}
              >
                {section.render()}
              </SortableSection>
            );
          })}
        </div>
      </SortableContext>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-card border border-border rounded-lg p-6 max-w-sm mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3"><div className="p-2 rounded-full bg-destructive/10"><AlertTriangle size={20} className="text-destructive" /></div><h4 className="font-semibold text-sm">Supprimer ce rôle ?</h4></div>
            <p className="text-xs text-muted-foreground mb-1"><strong>"{deleteConfirm.name}"</strong> sera supprimé définitivement.</p>
            <p className="text-[10px] text-muted-foreground italic mb-3">Ce rôle sera retiré de toutes les distributions.</p>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 rounded-md text-sm bg-muted hover:bg-accent transition-colors">Annuler</button>
              <button onClick={handleConfirmDelete} className="px-3 py-1.5 rounded-md text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={() => setShowTemplates(false)}>
          <div className="bg-card border border-border rounded-lg p-6 max-w-lg w-full mx-4 shadow-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-base flex items-center gap-2"><Package size={18} /> Modèles de rôles prédéfinis</h4>
              <button onClick={() => setShowTemplates(false)} className="p-1 rounded hover:bg-accent"><X size={16} /></button>
            </div>
            <div className="flex gap-2 mb-3">
              <button onClick={selectAllTemplates} className="text-xs px-2 py-1 rounded bg-muted hover:bg-accent transition-colors">Sélectionner tous (nouveaux)</button>
              <span className="text-xs text-muted-foreground self-center">{selectedTemplates.size} sélectionné(s)</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 pr-2">
              {PREDEFINED_ROLE_TEMPLATES.map((template, index) => {
                const exists = roles.some(r => r.name === template.name);
                const isSelected = selectedTemplates.has(index);
                return (
                  <label key={index} className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${exists ? 'opacity-50' : ''} ${isSelected ? 'bg-primary/10' : 'hover:bg-accent/50'}`}>
                    <input type="checkbox" checked={isSelected} onChange={() => !exists && toggleTemplateSelection(index)} disabled={exists} className="rounded border-border text-primary focus:ring-primary h-4 w-4 shrink-0" />
                    <div className="w-6 h-6 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: template.color }}><span className="text-white text-xs font-bold">{template.name.charAt(0)}</span></div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium truncate">{template.name}</span>
                      {template.description && <p className="text-[10px] text-muted-foreground truncate">{template.description}</p>}
                    </div>
                    {exists && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">Déjà présent</span>}
                  </label>
                );
              })}
            </div>
            <div className="flex gap-2 justify-end mt-4 pt-3 border-t border-border">
              <button onClick={() => setShowTemplates(false)} className="px-3 py-1.5 rounded-md text-sm bg-muted hover:bg-accent transition-colors">Annuler</button>
              <button onClick={handleImportTemplates} disabled={selectedTemplates.size === 0} className="px-3 py-1.5 rounded-md text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Importer ({selectedTemplates.size})</button>
            </div>
          </div>
        </div>
      )}

      {showDashboard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={() => setShowDashboard(false)}>
          <div className="bg-card border border-border rounded-lg p-6 max-w-2xl w-full mx-4 shadow-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-base flex items-center gap-2"><BarChart3 size={18} /> Dashboard Statistiques</h4>
              <button onClick={() => setShowDashboard(false)} className="p-1 rounded hover:bg-accent"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-primary">{roles.length}</div>
                  <div className="text-xs text-muted-foreground">Rôles totaux</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-500">{teams.length}</div>
                  <div className="text-xs text-muted-foreground">Équipes</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-500">{roles.filter(r => r.isSelectableForDistribution).length}</div>
                  <div className="text-xs text-muted-foreground">Dans distribution</div>
                </div>
              </div>
              <div>
                <h5 className="text-sm font-semibold mb-2">Rôles les plus assignés</h5>
                <div className="space-y-1">
                  {Object.entries(roleUsageCounts).sort((a, b) => b[1] - a[1]).filter(([, c]) => c > 0).slice(0, 5).map(([roleId, count]) => {
                    const role = roles.find(r => r.id === roleId);
                    if (!role) return null;
                    const maxCount = Math.max(...Object.values(roleUsageCounts), 1);
                    return (
                      <div key={roleId} className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: role.color }}><span className="text-white text-[8px] font-bold">{role.name.charAt(0)}</span></div>
                        <span className="text-xs flex-1 truncate">{role.name}</span>
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(count as number / maxCount) * 100}%`, backgroundColor: role.color }} />
                        </div>
                        <span className="text-xs font-medium w-6 text-right">{count}</span>
                      </div>
                    );
                  })}
                  {Object.values(roleUsageCounts).every(c => c === 0) && <p className="text-xs text-muted-foreground italic">Aucun rôle assigné</p>}
                </div>
              </div>
              <div>
                <h5 className="text-sm font-semibold mb-2">Répartition par équipe</h5>
                <div className="space-y-1">
                  {teams.map(team => {
                    const teamRoleCount = roles.filter(r => r.teamId === team.id).length;
                    const TeamIcon = team.icon ? icons[team.icon as keyof typeof icons] : icons.Users;
                    return (
                      <div key={team.id} className="flex items-center gap-2">
                        <div className="p-1 rounded bg-muted/50"><TeamIcon size={12} /></div>
                        <span className="text-xs flex-1 truncate">{team.name}</span>
                        <span className="text-xs font-medium">{teamRoleCount} rôle{teamRoleCount !== 1 ? 's' : ''}</span>
                      </div>
                    );
                  })}
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-muted/50 text-muted-foreground"><icons.Users size={12} /></div>
                    <span className="text-xs flex-1 truncate italic text-muted-foreground">Sans équipe</span>
                    <span className="text-xs font-medium">{roles.filter(r => !r.teamId).length} rôle{roles.filter(r => !r.teamId).length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
              <div>
                <h5 className="text-sm font-semibold mb-2">Rôles uniques vs multiples</h5>
                <div className="flex gap-4">
                  <div className="flex-1 bg-muted/50 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-amber-500">{roles.filter(r => r.isUnique).length}</div>
                    <div className="text-xs text-muted-foreground">Uniques</div>
                  </div>
                  <div className="flex-1 bg-muted/50 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-blue-500">{roles.filter(r => !r.isUnique).length}</div>
                    <div className="text-xs text-muted-foreground">Multiples</div>
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

      {showDependencies && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={() => setShowDependencies(false)}>
          <div className="bg-card border border-border rounded-lg p-6 max-w-lg w-full mx-4 shadow-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-base flex items-center gap-2"><Link2 size={18} /> Dépendances entre rôles</h4>
              <button onClick={() => setShowDependencies(false)} className="p-1 rounded hover:bg-accent"><X size={16} /></button>
            </div>
            <p className="text-xs text-muted-foreground mb-3 italic">Quand un rôle est assigné, les rôles dépendants sont automatiquement suggérés.</p>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {roles.map(role => {
                const deps = roleDependencies[role.id] || [];
                return (
                  <div key={role.id} className="p-2 bg-muted/30 rounded-md border border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-4 h-4 rounded shrink-0" style={{ backgroundColor: role.color }} />
                      <span className="text-sm font-medium">{role.name}</span>
                      <span className="text-[9px] text-muted-foreground">→ {deps.length} dépendance(s)</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {roles.filter(r => r.id !== role.id).map(r => {
                        const isDep = deps.includes(r.id);
                        return (
                          <button key={r.id} onClick={() => isDep ? removeRoleDependency(role.id, r.id) : addRoleDependency(role.id, r.id)} className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${isDep ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
                            {r.name} {isDep ? '✓' : '+'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {roles.length === 0 && <p className="text-xs text-muted-foreground italic text-center">Aucun rôle pour configurer les dépendances.</p>}
            </div>
            <div className="flex justify-end mt-4 pt-3 border-t border-border">
              <button onClick={() => setShowDependencies(false)} className="px-3 py-1.5 rounded-md text-sm bg-muted hover:bg-accent transition-colors">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {showPresets && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={() => setShowPresets(false)}>
          <div className="bg-card border border-border rounded-lg p-6 max-w-lg w-full mx-4 shadow-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-base flex items-center gap-2"><Save size={18} /> Préréglages de composition</h4>
              <button onClick={() => setShowPresets(false)} className="p-1 rounded hover:bg-accent"><X size={16} /></button>
            </div>
            <div className="flex gap-2 mb-3">
              <input type="text" placeholder="Nom du préréglage" value={newPresetName} onChange={(e) => setNewPresetName(e.target.value)} className="flex-1 bg-input border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
              <button onClick={handleSavePreset} disabled={!newPresetName.trim()} className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Sauvegarder</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 pr-2">
              {savedPresets.map((preset, index) => (
                <div key={index} className="flex items-center gap-2 p-2 rounded hover:bg-accent/50 group">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate">{preset.name}</span>
                    <p className="text-[10px] text-muted-foreground">{preset.roles.length} rôles • {new Date(preset.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <button onClick={() => handleLoadPreset(preset)} className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors">Charger</button>
                  <button onClick={() => handleDeletePreset(index)} className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                </div>
              ))}
              {savedPresets.length === 0 && <p className="text-xs text-muted-foreground italic text-center">Aucun préréglage sauvegardé.</p>}
            </div>
            <div className="flex justify-end mt-4 pt-3 border-t border-border">
              <button onClick={() => setShowPresets(false)} className="px-3 py-1.5 rounded-md text-sm bg-muted hover:bg-accent transition-colors">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={() => setShowHistory(false)}>
          <div className="bg-card border border-border rounded-lg p-6 max-w-lg w-full mx-4 shadow-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-base flex items-center gap-2"><Clock size={18} /> Historique des modifications</h4>
              <button onClick={() => setShowHistory(false)} className="p-1 rounded hover:bg-accent"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 pr-2">
              {changeHistory.map((entry, index) => (
                <div key={index} className="flex items-start gap-2 p-2 rounded hover:bg-accent/50">
                  <div className={`p-1 rounded shrink-0 ${entry.action === 'add' ? 'bg-green-100 text-green-700' : entry.action === 'delete' ? 'bg-red-100 text-red-700' : entry.action === 'save' ? 'bg-blue-100 text-blue-700' : entry.action === 'load' ? 'bg-purple-100 text-purple-700' : 'bg-muted text-muted-foreground'}`}>
                    {entry.action === 'add' ? <Plus size={10} /> : entry.action === 'delete' ? <Trash2 size={10} /> : entry.action === 'save' ? <Save size={10} /> : entry.action === 'load' ? <FolderOpen size={10} /> : <Edit2 size={10} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium">{entry.roleName}</span>
                    <p className="text-[10px] text-muted-foreground truncate">{entry.details}</p>
                    <p className="text-[9px] text-muted-foreground">{new Date(entry.timestamp).toLocaleString('fr-FR')}</p>
                  </div>
                </div>
              ))}
              {changeHistory.length === 0 && <p className="text-xs text-muted-foreground italic text-center">Aucune modification enregistrée.</p>}
            </div>
            <div className="flex justify-end mt-4 pt-3 border-t border-border">
              <button onClick={() => { setChangeHistory([]); }} className="text-xs px-2 py-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors mr-2">Effacer</button>
              <button onClick={() => setShowHistory(false)} className="px-3 py-1.5 rounded-md text-sm bg-muted hover:bg-accent transition-colors">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </DndContext>
  );
};
