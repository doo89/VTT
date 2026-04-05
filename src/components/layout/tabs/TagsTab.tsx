import { Plus, Trash2, Edit2, Tag, icons, ChevronDown, ChevronRight } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { useVttStore } from '../../../store';
import { ColorPicker } from '../../ColorPicker';


export const TagsTab: React.FC = () => {
  const { tags, tagCategories, addTagModel, deleteTagModel, setEditingEntity, addTagCategory, deleteTagCategory } = useVttStore();
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#10b981');

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6366f1');
  const [newCategoryIcon, setNewCategoryIcon] = useState('Folder');

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

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
      categoryId: null,
    });
    setNewTagName('');
    setNewTagColor('#10b981');
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

  return (
    <div className="flex flex-col gap-6">
      {/* Create Category Section */}
      <section className="flex flex-col gap-3">
        <h3 className="font-semibold text-sm border-b border-border pb-1">Créer une Catégorie</h3>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Nom de la catégorie"
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
      </section>

      {/* Create Tag Section */}
      <section className="flex flex-col gap-3">
        <h3 className="font-semibold text-sm border-b border-border pb-1">Créer un Tag</h3>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Nom du tag"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />

          <ColorPicker
            color={newTagColor}
            onChange={setNewTagColor}
            label="Couleur"
          />

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
      </section>

      {/* Tag List Section */}
      <section className="flex flex-col gap-3">
        <h3 className="font-semibold text-sm border-b border-border pb-1">Modèles Disponibles</h3>
        
        <div className="flex flex-col gap-2 mt-2">
          {tagCategories.map(cat => {
            const catTags = tagsByCategory[cat.id];
            if (!catTags) return null;
            const CatIcon = icons[cat.icon as keyof typeof icons] || icons.Folder;
            
            return (
              <div key={cat.id} className="flex flex-col mb-2 bg-card border border-border rounded-md overflow-hidden">
                <div className="flex items-center justify-between bg-muted/50 hover:bg-muted p-2 transition-colors group">
                  <button 
                    onClick={() => toggleCategory(cat.id)}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    <div className="p-1 rounded bg-background shadow-sm" style={{ color: cat.color }}>
                      <CatIcon size={14} />
                    </div>
                    <span className="font-semibold text-sm flex-1">{cat.name}</span>
                    <span className="text-xs text-muted-foreground bg-background px-1.5 rounded-full border border-border">
                      {catTags.length}
                    </span>
                    {expandedCategories[cat.id] ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteTagCategory(cat.id); }}
                    className="p-1.5 ml-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Supprimer catégorie"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                
                {expandedCategories[cat.id] && (
                  <div className="flex flex-col gap-1 p-2 bg-background/50 border-t border-border">
                    {catTags.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic text-center py-2">Aucun tag</p>
                    ) : (
                      catTags.map(tag => {
                        const IconComponent = icons[tag.icon as keyof typeof icons] || Tag;
                        return (
                          <div key={tag.id} className="flex items-center justify-between p-2 rounded-md border border-border bg-card hover:bg-accent/50 group">
                            <div className="flex items-center gap-2 overflow-hidden flex-1">
                              <div className="w-6 h-6 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: tag.color, color: '#fff' }}>
                                <IconComponent size={12} />
                              </div>
                              <span className="text-sm font-medium truncate">{tag.name}</span>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
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
                        <div key={tag.id} className="flex items-center justify-between p-2 rounded-md border border-border bg-card hover:bg-accent/50 group">
                          <div className="flex items-center gap-2 overflow-hidden flex-1">
                            <div className="w-6 h-6 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: tag.color, color: '#fff' }}>
                              <IconComponent size={12} />
                            </div>
                            <span className="text-sm font-medium truncate">{tag.name}</span>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
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
      </section>
    </div>
  );
};
