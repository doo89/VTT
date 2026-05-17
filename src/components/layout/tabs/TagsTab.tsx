import { Plus, Trash2, Edit2, Tag, icons, ChevronDown, ChevronRight, Copy, GripVertical } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { useVttStore } from '../../../store';
import { ColorPicker } from '../../ColorPicker';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './TagsTab.css';

function SortableSection({ id, children, isOpen, title, onToggle }: {
  id: string;
  children: React.ReactNode;
  isOpen: boolean;
  title: string;
  onToggle: () => void;
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

export const TagsTab: React.FC = () => {
  const { tags, tagCategories, addTagModel, updateTagModel, deleteTagModel, setEditingEntity, addTagCategory, deleteTagCategory } = useVttStore();
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#10b981');
  const [newTagCategoryId, setNewTagCategoryId] = useState<string | null>(null);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6366f1');
  const [newCategoryIcon, setNewCategoryIcon] = useState('Folder');

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const [sectionOrder, setSectionOrder] = useState([
    'createCategory',
    'createTag',
    'tagList',
  ]);

  const [openSections, setOpenSections] = useState({
    createCategory: false,
    createTag: true,
    tagList: true,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const tagsByCategory = useMemo(() => {
    const grouped: Record<string, typeof tags> = {
      'no-category': []
    };

    tagCategories.forEach(c => grouped[c.id] = []);

    tags.forEach(tag => {
      if (tag.categoryId && grouped[tag.categoryId]) {
        grouped[tag.categoryId].push(tag);
      } else {
        grouped['no-category'].push(tag);
      }
    });

    return grouped;
  }, [tags, tagCategories]);

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const handleAddTagModel = () => {
    if (!newTagName.trim()) return;

    addTagModel({
      name: newTagName,
      color: newTagColor,
      points: null,
      lives: null,
      votes: null,
      uses: null,
      callOrderDay: null,
      callOrderNight: null,
      autoDeleteOnZeroUses: false,
      description: "",
      icon: "Tag",
      showInTooltip: true,
      showInGameTab: true,
      categoryId: newTagCategoryId,
    });
    setNewTagName('');
    setNewTagColor('#10b981');
    setNewTagCategoryId(null);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    addTagCategory({
      name: newCategoryName,
      color: newCategoryColor,
      icon: newCategoryIcon
    });
    setNewCategoryName('');
    setNewCategoryColor('#6366f1');
    setNewCategoryIcon('Folder');
  };

  const handleDuplicateTag = (tag: typeof tags[0]) => {
    const { id, ...tagData } = tag;
    addTagModel({
      ...tagData,
      name: `${tag.name} (Copie)`,
      isInDistributor: false
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

  const renderCreateCategory = () => (
    <div className="flex flex-col gap-3 px-1">
      <input
        id="new-category-name"
        type="text"
        placeholder="Nom de la catégorie"
        aria-label="Nom de la catégorie"
        value={newCategoryName}
        onChange={(e) => setNewCategoryName(e.target.value)}
        className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <div className="flex items-center justify-between gap-3">
        <ColorPicker
          color={newCategoryColor}
          onChange={setNewCategoryColor}
          label="Couleur"
          className="flex-1"
        />
        <button
          onClick={handleAddCategory}
          disabled={!newCategoryName.trim()}
          className="flex items-center gap-1 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={16} /> Ajouter
        </button>
      </div>
    </div>
  );

  const renderCreateTag = () => (
    <div className="flex flex-col gap-3 px-1">
      <input
        id="new-tag-name"
        type="text"
        placeholder="Nom du tag"
        aria-label="Nom du tag"
        value={newTagName}
        onChange={(e) => setNewTagName(e.target.value)}
        className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />

      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Couleur</label>
          <ColorPicker
            color={newTagColor}
            onChange={setNewTagColor}
            label="Couleur"
            className="w-10 h-10"
          />
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <label htmlFor="new-tag-category" className="text-xs font-medium text-muted-foreground">Catégorie</label>
          <select
            id="new-tag-category"
            value={newTagCategoryId || ''}
            onChange={(e) => setNewTagCategoryId(e.target.value || null)}
            className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring h-10"
          >
            <option value="">Sans catégorie</option>
            {tagCategories.map(cat => (
              <option 
                key={cat.id} 
                value={cat.id} 
                className="tag-category-option"
                style={{ '--cat-color': cat.color } as React.CSSProperties}
              >
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <button
          onClick={handleAddTagModel}
          disabled={!newTagName.trim()}
          className="flex items-center gap-1 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
        >
          <Plus size={16} /> Ajouter le Tag
        </button>
      </div>
    </div>
  );

  const renderTagList = () => (
    <div className="flex flex-col gap-2 mt-2 px-1">
      {tagCategories.map(cat => {
        const catTags = tagsByCategory[cat.id];
        if (!catTags) return null;
        const CatIcon = icons[cat.icon as keyof typeof icons] || icons.Folder;
        
        return (
          <div 
            key={cat.id} 
            className="flex flex-col mb-2 bg-card border border-border rounded-md overflow-hidden"
            style={{ '--cat-color': cat.color } as React.CSSProperties}
          >
            <div className="flex items-center justify-between bg-muted/50 hover:bg-muted p-2 transition-colors group">
              <button 
                onClick={() => toggleCategory(cat.id)}
                className="flex items-center gap-2 flex-1 text-left"
              >
                <div className="p-1 rounded bg-background shadow-sm tag-category-icon-wrapper">
                  <CatIcon size={14} />
                </div>
                <span className="font-semibold text-sm flex-1 tag-category-name">
                  {cat.name}
                </span>
                <span className="text-xs text-muted-foreground bg-background px-1.5 rounded-full border border-border">
                  {catTags.length}
                </span>
                {expandedCategories[cat.id] ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
              </button>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingEntity({ type: 'tagCategory', id: cat.id }); }}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md"
                  title="Modifier catégorie"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteTagCategory(cat.id); }}
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                  title="Supprimer catégorie"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            
            {expandedCategories[cat.id] && (
              <div className="flex flex-col gap-1 p-2 bg-background/50 border-t border-border">
                {catTags.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-2">Aucun tag</p>
                ) : (
                  catTags.map(tag => {
                    const IconComponent = icons[tag.icon as keyof typeof icons] || Tag;
                    return (
                      <div 
                        key={tag.id} 
                        className="flex items-center justify-between p-2 rounded-md border border-border bg-card hover:bg-accent/50 group"
                        style={{ '--tag-color': tag.color } as React.CSSProperties}
                      >
                        <div className="flex items-center gap-2 overflow-hidden flex-1">
                          <input
                            type="checkbox"
                            checked={tag.isInDistributor || false}
                            onChange={(e) => updateTagModel(tag.id, { isInDistributor: e.target.checked })}
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4 shrink-0 cursor-pointer"
                            title="Ajouter au Distributeur"
                          />
                          <div className="w-6 h-6 rounded flex items-center justify-center shrink-0 tag-model-icon-wrapper">
                            <IconComponent size={12} />
                          </div>
                          <span className="text-sm font-medium truncate">{tag.name}</span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => handleDuplicateTag(tag)}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md"
                            title="Dupliquer"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={() => setEditingEntity({ type: 'tagModel', id: tag.id })}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md"
                            title="Modifier"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => deleteTagModel(tag.id)}
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
            )}
          </div>
        );
      })}

      {/* Uncategorized Tags */}
      {tagsByCategory['no-category'] && tagsByCategory['no-category'].length > 0 && (
        <div className="flex flex-col mb-2 bg-card border border-border rounded-md overflow-hidden">
           <button 
              onClick={() => toggleCategory('no-category')}
              className="flex items-center gap-2 w-full text-left bg-muted/50 hover:bg-muted p-2 transition-colors"
            >
              <div className="p-1 rounded bg-background shadow-sm text-muted-foreground">
                <icons.Folder size={14} />
              </div>
              <span className="font-semibold text-sm flex-1 text-muted-foreground italic">Sans catégorie</span>
              <span className="text-xs text-muted-foreground bg-background px-1.5 rounded-full border border-border">
                {tagsByCategory['no-category'].length}
              </span>
              {expandedCategories['no-category'] ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
            </button>
            {expandedCategories['no-category'] && (
              <div className="flex flex-col gap-1 p-2 bg-background/50 border-t border-border">
                {tagsByCategory['no-category'].map(tag => {
                  const IconComponent = icons[tag.icon as keyof typeof icons] || Tag;
                  return (
                        <div 
                          key={tag.id} 
                          className="flex items-center justify-between p-2 rounded-md border border-border bg-card hover:bg-accent/50 group"
                          style={{ '--tag-color': tag.color } as React.CSSProperties}
                        >
                          <div className="flex items-center gap-2 overflow-hidden flex-1">
                            <input
                              type="checkbox"
                              checked={tag.isInDistributor || false}
                              onChange={(e) => updateTagModel(tag.id, { isInDistributor: e.target.checked })}
                              className="rounded border-border text-primary focus:ring-primary h-4 w-4 shrink-0 cursor-pointer"
                              title="Ajouter au Distributeur"
                            />
                            <div className="w-6 h-6 rounded flex items-center justify-center shrink-0 tag-model-icon-wrapper">
                              <IconComponent size={12} />
                            </div>
                            <span className="text-sm font-medium truncate">{tag.name}</span>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              onClick={() => handleDuplicateTag(tag)}
                              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md"
                              title="Dupliquer"
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              onClick={() => setEditingEntity({ type: 'tagModel', id: tag.id })}
                              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md"
                              title="Modifier"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => deleteTagModel(tag.id)}
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
            )}
        </div>
      )}

      {tags.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2 italic">Aucun modèle de tag.</p>
      )}
    </div>
  );

  const sectionContent: Record<string, { title: string; render: () => React.ReactNode }> = {
    createCategory: { title: 'Créer une Catégorie', render: renderCreateCategory },
    createTag: { title: 'Créer un Tag', render: renderCreateTag },
    tagList: { title: 'Modèles Disponibles', render: renderTagList },
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
