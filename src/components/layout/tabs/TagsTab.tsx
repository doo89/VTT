import { Plus, Trash2, Edit2, Tag, icons, ChevronDown, ChevronRight, Copy, GripVertical, AlertTriangle, Search, X, ArrowUpDown, ArrowDownAZ, List, LayoutList, Download, Upload, Package, BarChart3 } from 'lucide-react';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useVttStore } from '../../../store';
import { ColorPicker } from '../../ColorPicker';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './TagsTab.css';
import { PREDEFINED_TAG_TEMPLATES } from '../../../lib/tag-templates';

const TAG_ICONS = Object.keys(icons).filter(k => typeof (icons as any)[k] === 'function').slice(0, 120);

function SortableSection({ id, children, isOpen, title, onToggle }: {
  id: string;
  children: React.ReactNode;
  isOpen: boolean;
  title: string;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <section ref={setNodeRef} style={style} className="flex flex-col gap-3">
      <div className="flex items-center justify-between bg-accent/30 hover:bg-accent/50 p-2 rounded cursor-pointer transition-colors group" onClick={onToggle}>
        <div className="flex items-center gap-2">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-accent/80 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
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

import type { TagModel } from '../../../types';

interface TagListItemProps {
  tag: TagModel;
  usageCount: number;
  viewMode: 'detailed' | 'compact';
  onDuplicate: (tag: TagModel) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  onUpdate: (id: string, updates: any) => void;
  onDragStart: (id: string) => void;
}

const TagListItem = React.memo(function TagListItem({ tag, usageCount, viewMode, onDuplicate, onEdit, onDelete, onUpdate, onDragStart }: TagListItemProps) {
  const IconComponent = icons[tag.icon as keyof typeof icons] || Tag;
  if (viewMode === 'compact') {
    return (
      <div className="flex items-center justify-between px-2 py-1 rounded hover:bg-accent/50 group cursor-grab active:cursor-grabbing" style={{ '--tag-color': tag.color } as React.CSSProperties}
        onMouseDown={() => onDragStart(tag.id)}>
        <div className="flex items-center gap-1.5 overflow-hidden flex-1">
          <div className="w-4 h-4 rounded flex items-center justify-center shrink-0"><IconComponent size={10} /></div>
          <span className="text-xs font-medium truncate">{tag.name}</span>
          {usageCount > 0 && <span className="text-[8px] text-muted-foreground shrink-0">×{usageCount}</span>}
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={(e) => { e.stopPropagation(); onDuplicate(tag); }} className="p-0.5 text-muted-foreground hover:text-foreground" aria-label="Dupliquer"><Copy size={10} /></button>
          <button onClick={(e) => { e.stopPropagation(); onEdit(tag.id); }} className="p-0.5 text-muted-foreground hover:text-foreground" aria-label="Modifier"><Edit2 size={10} /></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(tag.id, tag.name); }} className="p-0.5 text-muted-foreground hover:text-destructive" aria-label="Supprimer"><Trash2 size={10} /></button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between p-2 rounded-md border border-border bg-card hover:bg-accent/50 group cursor-grab active:cursor-grabbing" style={{ '--tag-color': tag.color } as React.CSSProperties}
      onMouseDown={() => onDragStart(tag.id)}>
      <div className="flex items-center gap-2 overflow-hidden flex-1">
        <input type="checkbox" checked={tag.isInDistributor || false} onChange={(e) => onUpdate(tag.id, { isInDistributor: e.target.checked })} className="rounded border-border text-primary focus:ring-primary h-4 w-4 shrink-0 cursor-pointer" title="Ajouter au Distributeur" aria-label="Ajouter au Distributeur" />
        <div className="w-6 h-6 rounded flex items-center justify-center shrink-0 tag-model-icon-wrapper"><IconComponent size={12} /></div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-medium truncate">{tag.name}</span>
          {tag.description && <span className="text-[10px] text-muted-foreground truncate italic">{tag.description}</span>}
        </div>
        {usageCount > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0" title="Utilisé par {usageCount} entité(s)">×{usageCount}</span>}
        {(tag.lives || tag.points || tag.votes || tag.uses) && (
          <div className="flex gap-1 text-[9px] text-muted-foreground shrink-0">
            {tag.lives != null && <span title="Vies">♥{tag.lives}</span>}
            {tag.points != null && <span title="Points">★{tag.points}</span>}
            {tag.votes != null && <span title="Votes">✦{tag.votes}</span>}
            {tag.uses != null && <span title="Utilisations">↻{tag.uses}</span>}
          </div>
        )}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={(e) => { e.stopPropagation(); onDuplicate(tag); }} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md" title="Dupliquer" aria-label="Dupliquer"><Copy size={14} /></button>
        <button onClick={(e) => { e.stopPropagation(); onEdit(tag.id); }} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md" title="Modifier" aria-label="Modifier"><Edit2 size={14} /></button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(tag.id, tag.name); }} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md" title="Supprimer" aria-label="Supprimer"><Trash2 size={14} /></button>
      </div>
    </div>
  );
});

export const TagsTab: React.FC = () => {
  const { tags, tagCategories, addTagModel, updateTagModel, deleteTagModel, setEditingEntity, addTagCategory, deleteTagCategory, players, markers } = useVttStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#10b981');
  const [newTagCategoryId, setNewTagCategoryId] = useState<string | null>(null);
  const [nameError, setNameError] = useState('');

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6366f1');
  const [newCategoryIcon, setNewCategoryIcon] = useState('Folder');
  const [showIconPicker, setShowIconPicker] = useState(false);

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('name');
  const [viewMode, setViewMode] = useState<'detailed' | 'compact'>('detailed');
  const [draggedTagId, setDraggedTagId] = useState<string | null>(null);

  const [sectionOrder, setSectionOrder] = useState(() => {
    try { const saved = localStorage.getItem('tagsTabSectionOrder'); return saved ? JSON.parse(saved) : ['createCategory', 'createTag', 'tagList']; } catch { return ['createCategory', 'createTag', 'tagList']; }
  });

  const [openSections, setOpenSections] = useState({ createCategory: false, createTag: true, tagList: true });
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'tag' | 'category'; id: string; name: string } | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<Set<number>>(new Set());
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => { try { localStorage.setItem('tagsTabSectionOrder', JSON.stringify(sectionOrder)); } catch {} }, [sectionOrder]);

  const toggleSection = (key: keyof typeof openSections) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const tagsByCategory = useMemo(() => {
    const grouped: Record<string, typeof tags> = { 'no-category': [] };
    tagCategories.forEach(c => grouped[c.id] = []);
    tags.forEach(tag => { if (tag.categoryId && grouped[tag.categoryId]) grouped[tag.categoryId].push(tag); else grouped['no-category'].push(tag); });
    return grouped;
  }, [tags, tagCategories]);

  const tagUsageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tags.forEach(tag => { let count = 0; players.forEach(p => { if (p.tags?.some(t => t.id === tag.id)) count++; }); markers.forEach(m => { if (m.tag.id === tag.id) count++; }); counts[tag.id] = count; });
    return counts;
  }, [tags, players, markers]);

  const sortedTagsByCategory = useMemo(() => {
    const sorted: Record<string, typeof tags> = {};
    Object.entries(tagsByCategory).forEach(([catId, catTags]) => {
      sorted[catId] = [...catTags].sort((a, b) => sortBy === 'name' ? a.name.localeCompare(b.name, 'fr') : 0);
    });
    return sorted;
  }, [tagsByCategory, sortBy]);

  const filteredTagsByCategory = useMemo(() => {
    if (!searchQuery.trim()) return sortedTagsByCategory;
    const query = searchQuery.toLowerCase();
    const filtered: Record<string, typeof tags> = {};
    Object.entries(sortedTagsByCategory).forEach(([catId, catTags]) => {
      const matching = catTags.filter(t => t.name.toLowerCase().includes(query));
      if (matching.length > 0 || catId === 'no-category') filtered[catId] = matching;
    });
    return filtered;
  }, [sortedTagsByCategory, searchQuery]);

  const toggleCategory = (catId: string) => setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));

  const handleAddTagModel = () => {
    if (!newTagName.trim()) return;
    const duplicate = tags.find(t => t.name.toLowerCase() === newTagName.trim().toLowerCase());
    if (duplicate) { setNameError(`Un tag nommé "${duplicate.name}" existe déjà.`); return; }
    setNameError('');
    addTagModel({ name: newTagName.trim(), color: newTagColor, points: null, lives: null, votes: null, uses: null, callOrderDay: null, callOrderNight: null, autoDeleteOnZeroUses: false, description: "", icon: "Tag", showInTooltip: true, showInGameTab: true, categoryId: newTagCategoryId });
    setNewTagName(''); setNewTagColor('#10b981'); setNewTagCategoryId(null);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    addTagCategory({ name: newCategoryName.trim(), color: newCategoryColor, icon: newCategoryIcon });
    setNewCategoryName(''); setNewCategoryColor('#6366f1'); setNewCategoryIcon('Folder'); setShowIconPicker(false);
  };

  const handleDuplicateTag = useCallback((tag: TagModel) => {
    const { id, ...tagData } = tag;
    let newName = `${tag.name} (Copie)`; let counter = 1;
    while (tags.some(t => t.name === newName)) { newName = `${tag.name} (Copie ${counter})`; counter++; }
    addTagModel({ ...tagData, name: newName, isInDistributor: false });
  }, [addTagModel, tags]);

  const handleRequestDelete = useCallback((type: 'tag' | 'category', id: string, name: string) => setDeleteConfirm({ type, id, name }), []);
  const handleConfirmDelete = useCallback(() => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'tag') deleteTagModel(deleteConfirm.id); else deleteTagCategory(deleteConfirm.id);
    setDeleteConfirm(null);
  }, [deleteConfirm, deleteTagModel, deleteTagCategory]);

  const handleExportTags = useCallback(() => {
    const data = { version: '1.0', tags, tagCategories, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `tags-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
  }, [tags, tagCategories]);

  const handleImportTags = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.tags || !Array.isArray(data.tags)) return;
      data.tags.forEach((tag: any) => { const { id, ...tagData } = tag; addTagModel(tagData); });
      if (data.tagCategories) data.tagCategories.forEach((cat: any) => { const { id, ...catData } = cat; addTagCategory(catData); });
    } catch {}
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [addTagModel, addTagCategory]);

  const handleTagDragEnd = useCallback((targetCategoryId: string) => {
    if (!draggedTagId) return;
    updateTagModel(draggedTagId, { categoryId: targetCategoryId || null });
    setDraggedTagId(null);
  }, [draggedTagId, updateTagModel]);

  const handleImportTemplates = useCallback(() => {
    if (selectedTemplates.size === 0) return;
    const templatesToImport = Array.from(selectedTemplates).map(i => PREDEFINED_TAG_TEMPLATES[i]);
    templatesToImport.forEach(template => {
      let newName = template.name;
      let counter = 1;
      while (tags.some(t => t.name === newName)) {
        newName = `${template.name} (${counter})`;
        counter++;
      }
      addTagModel({ ...template, name: newName });
    });
    setSelectedTemplates(new Set());
    setShowTemplates(false);
  }, [selectedTemplates, tags, addTagModel]);

  const toggleTemplateSelection = (index: number) => {
    setSelectedTemplates(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  };

  const selectAllTemplates = () => {
    const allIndices = PREDEFINED_TAG_TEMPLATES.map((_, i) => i).filter(i => !tags.some(t => t.name === PREDEFINED_TAG_TEMPLATES[i].name));
    setSelectedTemplates(new Set(allIndices));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSectionOrder((items: string[]) => { const oldIndex = items.indexOf(active.id as string); const newIndex = items.indexOf(over.id as string); return arrayMove(items, oldIndex, newIndex); });
    }
  };

  const renderCreateCategory = () => (
    <div className="flex flex-col gap-3 px-1">
      <input id="new-category-name" type="text" placeholder="Nom de la catégorie" aria-label="Nom de la catégorie" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
      <div className="flex items-center justify-between gap-3">
        <ColorPicker color={newCategoryColor} onChange={setNewCategoryColor} label="Couleur" className="flex-1" />
        <button onClick={() => setShowIconPicker(!showIconPicker)} className="p-2 bg-muted border border-border rounded-md hover:bg-accent transition-colors" title="Choisir une icône" aria-label="Choisir une icône">{React.createElement(icons[newCategoryIcon as keyof typeof icons] || icons.Folder, { size: 18 })}</button>
        <button onClick={handleAddCategory} disabled={!newCategoryName.trim()} className="flex items-center gap-1 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><Plus size={16} /> Ajouter</button>
      </div>
      {showIconPicker && (
        <div className="grid grid-cols-8 gap-1 p-2 bg-muted/30 rounded-md border border-border max-h-32 overflow-y-auto">
          {TAG_ICONS.slice(0, 64).map(iconName => { const IconComp = (icons as any)[iconName]; if (!IconComp) return null; return (<button key={iconName} onClick={() => { setNewCategoryIcon(iconName); setShowIconPicker(false); }} className={`p-1.5 rounded hover:bg-accent transition-colors ${newCategoryIcon === iconName ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`} title={iconName} aria-label={iconName}><IconComp size={16} /></button>); })}
        </div>
      )}
    </div>
  );

  const renderCreateTag = () => (
    <div className="flex flex-col gap-3 px-1">
      <div>
        <input id="new-tag-name" type="text" placeholder="Nom du tag" aria-label="Nom du tag" value={newTagName} onChange={(e) => { setNewTagName(e.target.value); setNameError(''); }} className={`w-full bg-input border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 ${nameError ? 'border-destructive focus:ring-destructive' : 'border-border focus:ring-ring'}`} />
        {nameError && <p className="text-[10px] text-destructive mt-1">{nameError}</p>}
      </div>
      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1"><label className="text-xs font-medium text-muted-foreground">Couleur</label><ColorPicker color={newTagColor} onChange={setNewTagColor} label="Couleur" className="w-10 h-10" /></div>
        <div className="flex flex-col gap-1 flex-1"><label htmlFor="new-tag-category" className="text-xs font-medium text-muted-foreground">Catégorie</label><select id="new-tag-category" value={newTagCategoryId || ''} onChange={(e) => setNewTagCategoryId(e.target.value || null)} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring h-10"><option value="">Sans catégorie</option>{tagCategories.map(cat => (<option key={cat.id} value={cat.id} className="tag-category-option" style={{ '--cat-color': cat.color } as React.CSSProperties}>{cat.name}</option>))}</select></div>
      </div>
      <div className="flex items-center justify-between border-t border-border pt-4"><button onClick={handleAddTagModel} disabled={!newTagName.trim()} className="flex items-center gap-1 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"><Plus size={16} /> Ajouter le Tag</button></div>
    </div>
  );

  const renderTagList = () => {
    const hasSearch = searchQuery.trim() !== '';
    return (
    <div className="flex flex-col gap-2 mt-2 px-1">
      <div className="flex items-center gap-2 mb-1">
        <button onClick={() => setSortBy(sortBy === 'name' ? 'date' : 'name')} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Trier">
          {sortBy === 'name' ? <><ArrowDownAZ size={10} /> A-Z</> : <><ArrowUpDown size={10} /> Date</>}
        </button>
        <button onClick={() => setViewMode(viewMode === 'detailed' ? 'compact' : 'detailed')} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Vue">
          {viewMode === 'detailed' ? <><LayoutList size={10} /> Détaillée</> : <><List size={10} /> Compacte</>}
        </button>
        <div className="flex-1" />
        <button onClick={handleExportTags} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Exporter les tags" aria-label="Exporter"><Download size={12} /></button>
        <button onClick={() => fileInputRef.current?.click()} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Importer des tags" aria-label="Importer"><Upload size={12} /></button>
        <button onClick={() => setShowTemplates(true)} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Importer des modèles prédéfinis" aria-label="Modèles"><Package size={12} /></button>
        <button onClick={() => setShowDashboard(true)} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Statistiques" aria-label="Statistiques"><BarChart3 size={12} /></button>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportTags} className="hidden" aria-label="Importer des tags" />
      </div>
      {tagCategories.map(cat => {
        const catTags = filteredTagsByCategory[cat.id] || [];
        if (!hasSearch && catTags.length === 0 && sortedTagsByCategory[cat.id]?.length === 0) return null;
        if (hasSearch && catTags.length === 0) return null;
        const CatIcon = icons[cat.icon as keyof typeof icons] || icons.Folder;
        const displayTags = hasSearch ? catTags : (sortedTagsByCategory[cat.id] || []);
        return (
          <div key={cat.id} className="flex flex-col mb-2 bg-card border border-border rounded-md overflow-hidden" style={{ '--cat-color': cat.color } as React.CSSProperties}
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); handleTagDragEnd(cat.id); }}>
            <div className="flex items-center justify-between bg-muted/50 hover:bg-muted p-2 transition-colors group">
              <button onClick={() => toggleCategory(cat.id)} className="flex items-center gap-2 flex-1 text-left">
                <div className="p-1 rounded bg-background shadow-sm tag-category-icon-wrapper"><CatIcon size={14} /></div>
                <span className="font-semibold text-sm flex-1 tag-category-name">{cat.name}</span>
                <span className="text-xs text-muted-foreground bg-background px-1.5 rounded-full border border-border">{displayTags.length}</span>
                {expandedCategories[cat.id] ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
              </button>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                <button onClick={(e) => { e.stopPropagation(); setEditingEntity({ type: 'tagCategory', id: cat.id }); }} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md" title="Modifier catégorie" aria-label="Modifier catégorie"><Edit2 size={14} /></button>
                <button onClick={(e) => { e.stopPropagation(); handleRequestDelete('category', cat.id, cat.name); }} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md" title="Supprimer catégorie" aria-label="Supprimer catégorie"><Trash2 size={14} /></button>
              </div>
            </div>
            {expandedCategories[cat.id] && (
              <div className={`flex flex-col ${viewMode === 'compact' ? 'gap-0.5 p-1' : 'gap-1 p-2'} bg-background/50 border-t border-border`}>
                {displayTags.length === 0 ? (<p className="text-xs text-muted-foreground italic text-center py-2">{hasSearch ? 'Aucun résultat' : 'Aucun tag'}</p>) : (
                  displayTags.map(tag => (<TagListItem key={tag.id} tag={tag} usageCount={tagUsageCounts[tag.id] || 0} viewMode={viewMode} onDuplicate={handleDuplicateTag} onEdit={(id) => setEditingEntity({ type: 'tagModel', id })} onDelete={(id, name) => handleRequestDelete('tag', id, name)} onUpdate={updateTagModel} onDragStart={setDraggedTagId} />))
                )}
              </div>
            )}
          </div>
        );
      })}

      {(filteredTagsByCategory['no-category']?.length > 0 || sortedTagsByCategory['no-category']?.length > 0) && (
        <div className="flex flex-col mb-2 bg-card border border-border rounded-md overflow-hidden"
          onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); handleTagDragEnd(''); }}>
           <button onClick={() => toggleCategory('no-category')} className="flex items-center gap-2 w-full text-left bg-muted/50 hover:bg-muted p-2 transition-colors">
              <div className="p-1 rounded bg-background shadow-sm text-muted-foreground"><icons.Folder size={14} /></div>
              <span className="font-semibold text-sm flex-1 text-muted-foreground italic">Sans catégorie</span>
              <span className="text-xs text-muted-foreground bg-background px-1.5 rounded-full border border-border">{(hasSearch ? filteredTagsByCategory['no-category'] : sortedTagsByCategory['no-category'])?.length || 0}</span>
              {expandedCategories['no-category'] ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
            </button>
            {expandedCategories['no-category'] && (
              <div className={`flex flex-col ${viewMode === 'compact' ? 'gap-0.5 p-1' : 'gap-1 p-2'} bg-background/50 border-t border-border`}>
                {(hasSearch ? filteredTagsByCategory['no-category'] : sortedTagsByCategory['no-category'])?.map(tag => (<TagListItem key={tag.id} tag={tag} usageCount={tagUsageCounts[tag.id] || 0} viewMode={viewMode} onDuplicate={handleDuplicateTag} onEdit={(id) => setEditingEntity({ type: 'tagModel', id })} onDelete={(id, name) => handleRequestDelete('tag', id, name)} onUpdate={updateTagModel} onDragStart={setDraggedTagId} />))}
              </div>
            )}
        </div>
      )}
      {tags.length === 0 && (<p className="text-sm text-muted-foreground text-center py-2 italic">Aucun modèle de tag.</p>)}
    </div>
  );
  };

  const sectionContent: Record<string, { title: string; render: () => React.ReactNode }> = {
    createCategory: { title: 'Créer une Catégorie', render: renderCreateCategory },
    createTag: { title: 'Créer un Tag', render: renderCreateTag },
    tagList: { title: 'Modèles Disponibles', render: renderTagList },
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-6 relative">
          {tags.length > 0 && (
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input type="text" placeholder="Rechercher un tag..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-input border border-border rounded-md pl-8 pr-8 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" aria-label="Rechercher un tag" />
              {searchQuery && (<button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Effacer"><X size={14} /></button>)}
            </div>
          )}
          {sectionOrder.map((sectionId: string) => {
            const section = sectionContent[sectionId];
            if (!section) return null;
            return (<SortableSection key={sectionId} id={sectionId} isOpen={openSections[sectionId as keyof typeof openSections]} title={section.title} onToggle={() => toggleSection(sectionId as keyof typeof openSections)}>{section.render()}</SortableSection>);
          })}
        </div>
      </SortableContext>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-card border border-border rounded-lg p-6 max-w-sm mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3"><div className="p-2 rounded-full bg-destructive/10"><AlertTriangle size={20} className="text-destructive" /></div><h4 className="font-semibold text-sm">Supprimer {deleteConfirm.type === 'tag' ? 'ce tag' : 'cette catégorie'} ?</h4></div>
            <p className="text-xs text-muted-foreground mb-1"><strong>"{deleteConfirm.name}"</strong> sera supprimé définitivement.</p>
            {deleteConfirm.type === 'category' && (<p className="text-[10px] text-muted-foreground italic mb-3">Les tags seront déplacés dans "Sans catégorie".</p>)}
            {deleteConfirm.type === 'tag' && (<p className="text-[10px] text-muted-foreground italic mb-3">Ce tag sera retiré de tous les joueurs et marqueurs.</p>)}
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
              <h4 className="font-semibold text-base flex items-center gap-2"><Package size={18} /> Modèles de tags prédéfinis</h4>
              <button onClick={() => setShowTemplates(false)} className="p-1 rounded hover:bg-accent"><X size={16} /></button>
            </div>
            <div className="flex gap-2 mb-3">
              <button onClick={selectAllTemplates} className="text-xs px-2 py-1 rounded bg-muted hover:bg-accent transition-colors">Sélectionner tous (nouveaux)</button>
              <span className="text-xs text-muted-foreground self-center">{selectedTemplates.size} sélectionné(s)</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 pr-2">
              {PREDEFINED_TAG_TEMPLATES.map((template, index) => {
                const exists = tags.some(t => t.name === template.name);
                const isSelected = selectedTemplates.has(index);
                const IconComp = icons[template.icon as keyof typeof icons] || Tag;
                return (
                  <label key={index} className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${exists ? 'opacity-50' : ''} ${isSelected ? 'bg-primary/10' : 'hover:bg-accent/50'}`}>
                    <input type="checkbox" checked={isSelected} onChange={() => !exists && toggleTemplateSelection(index)} disabled={exists} className="rounded border-border text-primary focus:ring-primary h-4 w-4 shrink-0" />
                    <div className="w-6 h-6 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: template.color }}><IconComp size={12} className="text-white" /></div>
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
                  <div className="text-2xl font-bold text-primary">{tags.length}</div>
                  <div className="text-xs text-muted-foreground">Tags totaux</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-500">{tagCategories.length}</div>
                  <div className="text-xs text-muted-foreground">Catégories</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-500">{tags.filter(t => t.isInDistributor).length}</div>
                  <div className="text-xs text-muted-foreground">Dans distributeur</div>
                </div>
              </div>
              <div>
                <h5 className="text-sm font-semibold mb-2">Tags les plus utilisés</h5>
                <div className="space-y-1">
                  {Object.entries(tagUsageCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tagId, count]) => {
                    const tag = tags.find(t => t.id === tagId);
                    if (!tag) return null;
                    const IconComp = icons[tag.icon as keyof typeof icons] || Tag;
                    const maxCount = Math.max(...Object.values(tagUsageCounts), 1);
                    return (
                      <div key={tagId} className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: tag.color }}><IconComp size={10} className="text-white" /></div>
                        <span className="text-xs flex-1 truncate">{tag.name}</span>
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(count / maxCount) * 100}%`, backgroundColor: tag.color }} />
                        </div>
                        <span className="text-xs font-medium w-6 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <h5 className="text-sm font-semibold mb-2">Répartition par catégorie</h5>
                <div className="space-y-1">
                  {tagCategories.map(cat => {
                    const catTagCount = tagsByCategory[cat.id]?.length || 0;
                    const CatIcon = icons[cat.icon as keyof typeof icons] || icons.Folder;
                    return (
                      <div key={cat.id} className="flex items-center gap-2">
                        <div className="p-1 rounded bg-muted/50"><CatIcon size={12} /></div>
                        <span className="text-xs flex-1 truncate">{cat.name}</span>
                        <span className="text-xs font-medium">{catTagCount} tag{catTagCount !== 1 ? 's' : ''}</span>
                      </div>
                    );
                  })}
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-muted/50 text-muted-foreground"><icons.Folder size={12} /></div>
                    <span className="text-xs flex-1 truncate italic text-muted-foreground">Sans catégorie</span>
                    <span className="text-xs font-medium">{tagsByCategory['no-category']?.length || 0} tag{(tagsByCategory['no-category']?.length || 0) !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
              <div>
                <h5 className="text-sm font-semibold mb-2">Tags avec utilisations auto-supprimables</h5>
                <div className="space-y-1">
                  {tags.filter(t => t.autoDeleteOnZeroUses).map(tag => {
                    const IconComp = icons[tag.icon as keyof typeof icons] || Tag;
                    return (
                      <div key={tag.id} className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: tag.color }}><IconComp size={10} className="text-white" /></div>
                        <span className="text-xs flex-1 truncate">{tag.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">Auto-delete</span>
                      </div>
                    );
                  })}
                  {tags.filter(t => t.autoDeleteOnZeroUses).length === 0 && <p className="text-xs text-muted-foreground italic">Aucun tag avec auto-suppression</p>}
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-4 pt-3 border-t border-border">
              <button onClick={() => setShowDashboard(false)} className="px-3 py-1.5 rounded-md text-sm bg-muted hover:bg-accent transition-colors">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </DndContext>
  );
};
