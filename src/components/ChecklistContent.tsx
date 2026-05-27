import React, { useState } from 'react';
import { Trash2, Settings, Type, CheckSquare, Square, Zap, X, GripVertical, Eye, EyeOff, ChevronDown, ChevronRight, Download, Upload, FolderOpen, Eye as EyeIcon, Search, Filter, Plus, Minus, MessageSquare } from 'lucide-react';
import { useVttStore } from '../store';

export const ChecklistContent: React.FC = () => {
  const { checklist, setChecklist, actions, executeAction } = useVttStore();
  const [openColorPickerId, setOpenColorPickerId] = useState<string | null>(null);
  const [openActionPickerId, setOpenActionPickerId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterColor, setFilterColor] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'checked' | 'unchecked'>('all');
  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);
  const [showSubtaskInputId, setShowSubtaskInputId] = useState<string | null>(null);
  const [newSubtaskContent, setNewSubtaskContent] = useState('');

  // Checklist templates
  const checklistTemplates = [
    {
      id: 'creation-partie',
      name: 'Création de partie',
      icon: '📝',
      items: [
        { id: 't1', type: 'text' as const, content: 'Préparation', color: '#3b82f6', collapsed: false },
        { id: 't2', type: 'checkbox' as const, content: 'Définir le scénario', checked: false, color: '#e4e4e7', showOnSmartphone: true },
        { id: 't3', type: 'checkbox' as const, content: 'Préparer les maps', checked: false, color: '#e4e4e7', showOnSmartphone: true },
        { id: 't4', type: 'checkbox' as const, content: 'Créer les joueurs', checked: false, color: '#e4e4e7', showOnSmartphone: true },
        { id: 't5', type: 'text' as const, content: 'Distribution', color: '#8b5cf6', collapsed: false },
        { id: 't6', type: 'checkbox' as const, content: 'Distribuer les rôles', checked: false, color: '#e4e4e7', showOnSmartphone: true },
        { id: 't7', type: 'checkbox' as const, content: 'Expliquer les règles', checked: false, color: '#e4e4e7', showOnSmartphone: true },
      ]
    },
    {
      id: 'debut-session',
      name: 'Début de session',
      icon: '🎬',
      items: [
        { id: 't1', type: 'text' as const, content: 'Accueil', color: '#22c55e', collapsed: false },
        { id: 't2', type: 'checkbox' as const, content: 'Vérifier les présents', checked: false, color: '#e4e4e7', showOnSmartphone: true },
        { id: 't3', type: 'checkbox' as const, content: 'Lancer la musique d\'ambiance', checked: false, color: '#e4e4e7', showOnSmartphone: true },
        { id: 't4', type: 'text' as const, content: 'Rappel', color: '#eab308', collapsed: false },
        { id: 't5', type: 'checkbox' as const, content: 'Récapitulatif de la dernière session', checked: false, color: '#e4e4e7', showOnSmartphone: true },
        { id: 't6', type: 'checkbox' as const, content: 'Point sur les objectifs', checked: false, color: '#e4e4e7', showOnSmartphone: true },
      ]
    },
    {
      id: 'fin-session',
      name: 'Fin de session',
      icon: '🏁',
      items: [
        { id: 't1', type: 'text' as const, content: 'Clôture', color: '#ef4444', collapsed: false },
        { id: 't2', type: 'checkbox' as const, content: 'Récap de la session', checked: false, color: '#e4e4e7', showOnSmartphone: true },
        { id: 't3', type: 'checkbox' as const, content: 'Noter les XP', checked: false, color: '#e4e4e7', showOnSmartphone: true },
        { id: 't4', type: 'checkbox' as const, content: 'Sauvegarder la partie', checked: false, color: '#e4e4e7', showOnSmartphone: true },
        { id: 't5', type: 'text' as const, content: 'Préparation suivante', color: '#3b82f6', collapsed: false },
        { id: 't6', type: 'checkbox' as const, content: 'Noter les idées pour la prochaine fois', checked: false, color: '#e4e4e7', showOnSmartphone: false },
      ]
    },
    {
      id: 'one-shot',
      name: 'One-Shot',
      icon: '🎲',
      items: [
        { id: 't1', type: 'text' as const, content: 'Introduction', color: '#8b5cf6', collapsed: false },
        { id: 't2', type: 'checkbox' as const, content: 'Présenter le contexte', checked: false, color: '#e4e4e7', showOnSmartphone: true },
        { id: 't3', type: 'checkbox' as const, content: 'Création des personnages', checked: false, color: '#e4e4e7', showOnSmartphone: true },
        { id: 't4', type: 'text' as const, content: 'Scénario', color: '#ef4444', collapsed: false },
        { id: 't5', type: 'checkbox' as const, content: 'Lancer l\'enquête', checked: false, color: '#e4e4e7', showOnSmartphone: true },
        { id: 't6', type: 'checkbox' as const, content: 'Gérer les combats', checked: false, color: '#e4e4e7', showOnSmartphone: true },
        { id: 't7', type: 'checkbox' as const, content: 'Résoudre le mystère', checked: false, color: '#e4e4e7', showOnSmartphone: true },
      ]
    },
    {
      id: 'campagne',
      name: 'Campagne',
      icon: '⚔️',
      items: [
        { id: 't1', type: 'text' as const, content: 'Suivi de campagne', color: '#eab308', collapsed: false },
        { id: 't2', type: 'checkbox' as const, content: 'Mettre à jour le wiki', checked: false, color: '#e4e4e7', showOnSmartphone: false },
        { id: 't3', type: 'checkbox' as const, content: 'Noter les PNJ importants', checked: false, color: '#e4e4e7', showOnSmartphone: false },
        { id: 't4', type: 'checkbox' as const, content: 'Suivre les quêtes en cours', checked: false, color: '#e4e4e7', showOnSmartphone: true },
        { id: 't5', type: 'text' as const, content: 'Gestion', color: '#3b82f6', collapsed: false },
        { id: 't6', type: 'checkbox' as const, content: 'Vérifier les inventaires', checked: false, color: '#e4e4e7', showOnSmartphone: false },
        { id: 't7', type: 'checkbox' as const, content: 'Gérer les absents', checked: false, color: '#e4e4e7', showOnSmartphone: false },
      ]
    },
  ];

  if (!checklist) return null;

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newChecklist = [...checklist];
    const draggedItem = newChecklist[draggedIndex];
    newChecklist.splice(draggedIndex, 1);
    newChecklist.splice(index, 0, draggedItem);
    
    setChecklist(newChecklist);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const uncheckSection = (sectionIndex: number) => {
    const newChecklist = [...checklist];
    for (let i = sectionIndex + 1; i < newChecklist.length; i++) {
      if (newChecklist[i].type === 'text') break;
      if (newChecklist[i].type === 'checkbox') {
        newChecklist[i].checked = false;
      }
    }
    setChecklist(newChecklist);
  };

  const loadTemplate = (template: typeof checklistTemplates[0]) => {
    const newChecklist = template.items.map(item => ({
      ...item,
      id: `${item.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));
    setChecklist(newChecklist);
    setShowTemplatesModal(false);
  };

  const exportChecklist = () => {
    const dataStr = JSON.stringify(checklist, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checklist-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importChecklist = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          setChecklist(imported);
        }
      } catch (err) {
        console.error('Failed to import checklist:', err);
      }
    };
    reader.readAsText(file);
  };

  const addSubtask = (parentId: string) => {
    if (!newSubtaskContent.trim()) return;
    const parentIndex = checklist.findIndex(item => item.id === parentId);
    if (parentIndex === -1) return;
    
    const newChecklist = [...checklist];
    const newSubtask = {
      id: `sub-${Date.now()}`,
      type: 'checkbox' as const,
      content: newSubtaskContent,
      checked: false,
      color: '#a1a1aa',
      parentId,
      showOnSmartphone: true
    };
    
    newChecklist.splice(parentIndex + 1, 0, newSubtask);
    setChecklist(newChecklist);
    setNewSubtaskContent('');
    setShowSubtaskInputId(null);
  };

  const deleteSubtask = (taskId: string) => {
    const newChecklist = checklist.filter(item => item.id !== taskId && item.parentId !== taskId);
    setChecklist(newChecklist);
  };

  const getSectionProgress = (sectionIndex: number) => {
    let total = 0;
    let completed = 0;
    for (let i = sectionIndex + 1; i < checklist.length; i++) {
      if (checklist[i].type === 'text') break;
      if (checklist[i].type === 'checkbox' && (!checklist[i].parentId || checklist[i].parentId === checklist[sectionIndex].id)) {
        total++;
        if (checklist[i].checked) completed++;
      }
    }
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  // Logic to handle grouping and indentation
  let activeSectionCollapsed = false;
  let hasMetSection = false;

  // Calculate progress
  const totalTasks = checklist.filter(item => item.type === 'checkbox' && !item.parentId && (item.showOnSmartphone !== false || !focusMode)).length;
  const completedTasks = checklist.filter(item => item.type === 'checkbox' && !item.parentId && item.checked && (item.showOnSmartphone !== false || !focusMode)).length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Filter checklist for focus mode, search, and filters
  const filteredChecklist = checklist.filter(item => {
    // Focus mode filter
    if (focusMode && item.type === 'checkbox' && item.checked) return false;
    
    // Search filter
    if (searchQuery && !item.content?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    // Color filter
    if (filterColor && item.color !== filterColor) return false;
    
    // Status filter
    if (filterStatus === 'checked' && item.type === 'checkbox' && !item.checked) return false;
    if (filterStatus === 'unchecked' && item.type === 'checkbox' && item.checked) return false;
    
    return true;
  });

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowTemplatesModal(true)}
          className="flex-1 flex items-center justify-center gap-1.5 p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded border border-blue-500/30 transition-colors text-xs font-bold uppercase"
          title="Charger un template"
        >
          <FolderOpen size={14} /> Templates
        </button>
        <button
          onClick={exportChecklist}
          className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded border border-green-500/30 transition-colors"
          title="Exporter la checklist"
        >
          <Download size={14} />
        </button>
        <label className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded border border-green-500/30 transition-colors cursor-pointer" title="Importer une checklist">
          <Upload size={14} />
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importChecklist(file);
              e.target.value = '';
            }}
          />
        </label>
        <button
          onClick={() => setFocusMode(!focusMode)}
          className={`p-2 rounded border transition-colors ${focusMode ? 'bg-purple-500/30 text-purple-400 border-purple-500/50' : 'bg-muted/30 text-muted-foreground border-border/50'}`}
          title="Mode Focus (masquer les tâches cochées)"
        >
          <EyeIcon size={14} />
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-2 p-2 bg-muted/20 rounded border border-border/50">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-8 pr-3 py-1.5 bg-input border border-border rounded text-sm focus:outline-none focus:border-primary/50"
            />
          </div>
          <button
            onClick={() => setFilterStatus(filterStatus === 'all' ? 'unchecked' : filterStatus === 'unchecked' ? 'checked' : 'all')}
            className={`p-2 rounded border transition-colors text-xs font-bold ${filterStatus === 'all' ? 'bg-muted text-muted-foreground' : filterStatus === 'checked' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}
            title="Filtrer par statut"
          >
            {filterStatus === 'all' ? 'Toutes' : filterStatus === 'checked' ? '✓' : '○'}
          </button>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => setFilterColor(null)}
            className={`w-5 h-5 rounded-full border transition-transform ${filterColor === null ? 'ring-2 ring-primary ring-offset-1 ring-offset-background scale-110' : 'hover:scale-110'}`}
            style={{ background: 'linear-gradient(135deg, #e4e4e7, #a1a1aa)' }}
            title="Toutes couleurs"
          />
          {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'].map(c => (
            <button
              key={c}
              onClick={() => setFilterColor(filterColor === c ? null : c)}
              className={`w-5 h-5 rounded-full border border-border/50 transition-transform ${filterColor === c ? 'ring-2 ring-primary ring-offset-1 ring-offset-background scale-110' : 'hover:scale-110'}`}
              style={{ backgroundColor: c }}
              title={`Filtrer par ${c}`}
            />
          ))}
        </div>
      </div>

      {/* Progress bar */}
      {totalTasks > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted/30 rounded border border-border/50">
          <div className="flex-1 h-2 bg-zinc-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className="text-xs font-bold text-green-400 min-w-[3rem] text-right">{progressPercentage}%</span>
        </div>
      )}

      {/* List of blocks */}
      <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto custom-scrollbar pr-1">
        {filteredChecklist.map((item, index) => {
          const isSection = item.type === 'text';
          
          if (isSection) {
            activeSectionCollapsed = item.collapsed || false;
            hasMetSection = true;
          } else {
            if (activeSectionCollapsed) return null;
          }

          const shouldIndent = !isSection && hasMetSection;

          return (
            <div 
              key={item.id} 
              draggable 
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex gap-2 items-center w-full bg-black/40 border border-border/50 rounded-md p-1.5 px-2 transition-all ${draggedIndex === index ? 'opacity-30' : ''} ${shouldIndent ? 'ml-4 w-[calc(100%-1rem)]' : ''} ${isSection ? 'bg-zinc-800/40 border-zinc-700/50' : ''}`}
            >
              <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0">
                 <GripVertical size={14} />
              </div>

              {isSection && (
                <button 
                  onClick={() => {
                    const newChecklist = [...checklist];
                    newChecklist[index].collapsed = !newChecklist[index].collapsed;
                    setChecklist(newChecklist);
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                </button>
              )}

              <div className="flex-1 flex flex-col gap-2">
                {item.type === 'text' && (
                  <div className="flex flex-col gap-1 w-full">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          const newChecklist = [...checklist];
                          newChecklist[index].collapsed = !newChecklist[index].collapsed;
                          setChecklist(newChecklist);
                        }}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {item.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                      </button>
                      <button
                        onClick={() => uncheckSection(index)}
                        className="text-muted-foreground hover:text-orange-400 transition-colors shrink-0 mt-0.5"
                        title="Décocher toutes les cases de la section"
                      >
                        <Square size={13} strokeWidth={3} />
                      </button>
                      <textarea
                        value={item.content || ''}
                        onChange={(e) => {
                          const newChecklist = [...checklist];
                          newChecklist[index].content = e.target.value;
                          setChecklist(newChecklist);
                        }}
                        placeholder="Titre de la section..."
                        style={{ color: item.color || '#e4e4e7' }}
                        className="w-full bg-transparent border-0 text-sm focus:outline-none focus:ring-0 resize-y min-h-[30px] p-0 m-0 font-black uppercase tracking-widest leading-tight"
                      />
                    </div>
                    {/* Section progress bar */}
                    <div className="flex items-center gap-2 ml-7">
                      <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
                          style={{ width: `${getSectionProgress(index)}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-bold text-blue-400 min-w-[2.5rem] text-right">{getSectionProgress(index)}%</span>
                    </div>
                  </div>
                )}
                {item.type === 'checkbox' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.checked || false}
                      onChange={(e) => {
                        const newChecked = e.target.checked;
                        const newChecklist = [...checklist];
                        newChecklist[index].checked = newChecked;
                        setChecklist(newChecklist);
                        
                        // Execute action if provided and becoming checked
                        if (newChecked && item.actionId) {
                          executeAction(item.actionId, {});
                        }
                      }}
                      className="w-4 h-4 rounded border-border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={item.content || ''}
                      onChange={(e) => {
                        const newChecklist = [...checklist];
                        newChecklist[index].content = e.target.value;
                        setChecklist(newChecklist);
                      }}
                      placeholder="Tâche..."
                      style={{ color: item.color || '#e4e4e7' }}
                      className="flex-1 bg-transparent border-0 text-sm focus:outline-none focus:ring-0 px-0 py-0 font-medium h-6"
                    />
                  </div>
                )}
              </div>
              
              {/* Controls for item */}
              <div className="flex items-center gap-1 shrink-0 pl-2 border-l border-border/30 h-6">
                <button 
                  onClick={() => {
                    const newChecklist = [...checklist];
                    newChecklist[index].showOnSmartphone = !(item.showOnSmartphone !== false);
                    setChecklist(newChecklist);
                  }}
                  className={`p-1 rounded transition-colors ${(item.showOnSmartphone !== false) ? 'text-blue-500 hover:text-blue-600' : 'text-muted-foreground hover:text-foreground'}`}
                  title={(item.showOnSmartphone !== false) ? "Visible sur smartphone" : "Masqué sur smartphone"}
                >
                  {(item.showOnSmartphone !== false) ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
              {item.type === 'checkbox' && (
                <div className="relative">
                  <button 
                    onClick={() => setOpenActionPickerId(openActionPickerId === item.id ? null : item.id)}
                    className={`p-1 rounded transition-colors ${item.actionId ? 'text-yellow-500 bg-yellow-500/10' : 'text-muted-foreground hover:text-yellow-500'} ${openActionPickerId === item.id ? 'bg-yellow-500/20' : ''}`}
                    title="Action automatique"
                  >
                    <Zap size={12} fill={item.actionId ? "currentColor" : "none"} />
                  </button>
                  {openActionPickerId === item.id && (
                    <div className="absolute right-0 bottom-full mb-1 w-48 bg-popover border border-border rounded shadow-xl z-[300] flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-150">
                      <div className="flex items-center justify-between p-2 border-b border-border bg-muted/30">
                         <span className="text-[10px] font-black uppercase tracking-widest">Choisir une action</span>
                         <button onClick={() => setOpenActionPickerId(null)} className="text-muted-foreground hover:text-foreground">
                           <X size={10} />
                         </button>
                      </div>
                      <div className="max-h-40 overflow-y-auto custom-scrollbar p-1">
                        <button
                          onClick={() => {
                            const newChecklist = [...checklist];
                            newChecklist[index].actionId = null;
                            setChecklist(newChecklist);
                            setOpenActionPickerId(null);
                          }}
                          className={`w-full text-left px-2 py-1.5 text-[11px] rounded hover:bg-accent transition-colors mb-1 border border-dashed border-border/50 ${!item.actionId ? 'bg-accent/50 text-accent-foreground' : 'text-muted-foreground'}`}
                        >
                          Aucune action
                        </button>
                        {actions.map((action: any) => (
                          <button
                            key={action.id}
                            onClick={() => {
                              const newChecklist = [...checklist];
                              newChecklist[index].actionId = action.id;
                              setChecklist(newChecklist);
                              setOpenActionPickerId(null);
                            }}
                            className={`w-full text-left px-2 py-1.5 text-[11px] rounded hover:bg-accent transition-colors flex items-center gap-2 ${item.actionId === action.id ? 'bg-accent text-accent-foreground font-bold' : ''}`}
                          >
                            <Zap size={10} />
                            <span className="truncate">{action.name}</span>
                          </button>
                        ))}
                        {actions.length === 0 && (
                          <div className="p-2 text-[10px] text-muted-foreground italic text-center">
                            Aucune action créée
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {(item.type === 'text' || item.type === 'checkbox') && (
                <div className="relative">
                  <button 
                    onClick={() => setOpenColorPickerId(openColorPickerId === item.id ? null : item.id)}
                    className={`p-1 rounded transition-colors ${openColorPickerId === item.id ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary'}`}
                    title="Couleur du texte"
                  >
                    <Settings size={12} />
                  </button>
                  {openColorPickerId === item.id && (
                    <div className="absolute right-0 top-full mt-1 flex flex-wrap w-32 bg-popover border border-border p-2 rounded shadow-lg z-[200] gap-1 animate-in fade-in zoom-in duration-75">
                      {['#ffffff', '#e4e4e7', '#a1a1aa', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'].map(c => (
                        <button
                          key={c}
                          onClick={() => {
                            const newChecklist = [...checklist];
                            newChecklist[index].color = c;
                            setChecklist(newChecklist);
                            setOpenColorPickerId(null);
                          }}
                          className={`w-4 h-4 rounded-full border border-border/50 hover:scale-110 transition-transform ${item.color === c ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={() => {
                  const newChecklist = checklist.filter((_, i) => i !== index);
                  setChecklist(newChecklist);
                }}
                className="text-muted-foreground hover:text-white hover:bg-destructive p-1 rounded transition-colors"
                title="Supprimer ce bloc"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        );
      })}
        {filteredChecklist.length === 0 && (
          <p className="text-xs text-muted-foreground italic text-center py-4">
            {focusMode ? 'Toutes les tâches sont cochées !' : 'La checklist est vide.'}
          </p>
        )}
      </div>

      {/* Add buttons */}
      <div className="grid grid-cols-2 gap-2 mt-auto pt-3 border-t border-border bg-background/50 -mx-3 px-3 pb-0 rounded-b-md">
        <button
          onClick={() => setChecklist([...(checklist || []), { id: Date.now().toString() + 't', type: 'text', content: '', color: '#e4e4e7' }])}
          className="flex flex-col items-center justify-center gap-1 p-1.5 bg-muted/40 hover:bg-accent rounded border border-border/50 transition-colors text-muted-foreground hover:text-foreground"
          title="Ajouter une section"
        >
          <Type size={14} />
          <span className="text-[9px] uppercase font-bold text-center">Section</span>
        </button>
        <button
          onClick={() => setChecklist([...(checklist || []), { id: Date.now().toString() + 'c', type: 'checkbox', content: '', checked: false, color: '#e4e4e7' }])}
          className="flex flex-col items-center justify-center gap-1 p-1.5 bg-muted/40 hover:bg-accent rounded border border-border/50 transition-colors text-muted-foreground hover:text-foreground"
          title="Ajouter une tâche"
        >
          <CheckSquare size={14} />
          <span className="text-[9px] uppercase font-bold text-center">Tâche</span>
        </button>
      </div>

      {/* Templates Modal */}
      {showTemplatesModal && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border-2 border-border rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
              <h3 className="font-bold text-lg uppercase tracking-widest text-primary">Templates de checklist</h3>
              <button
                onClick={() => setShowTemplatesModal(false)}
                className="p-2 hover:bg-destructive/20 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto max-h-[60vh] custom-scrollbar">
              {checklistTemplates.map(template => (
                <button
                  key={template.id}
                  onClick={() => loadTemplate(template)}
                  className="p-4 bg-muted/30 hover:bg-primary/20 border border-border hover:border-primary/50 rounded-xl transition-all text-left group active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{template.icon}</span>
                    <span className="font-bold text-sm uppercase tracking-widest group-hover:text-primary transition-colors">{template.name}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {template.items.filter(i => i.type === 'text').length} sections • {template.items.filter(i => i.type === 'checkbox').length} tâches
                  </p>
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-border bg-muted/30 flex justify-end">
              <button
                onClick={() => setShowTemplatesModal(false)}
                className="px-4 py-2 text-sm bg-muted hover:bg-accent text-foreground rounded-lg transition-colors border border-border"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
