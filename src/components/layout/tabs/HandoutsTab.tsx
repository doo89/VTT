import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { useVttStore } from '../../../store';
import { Upload, Trash2, Eye, EyeOff, File as FileIcon, Search, X, AlertCircle, CheckCircle2, Loader2, GripVertical, FolderPlus, Folder, FolderOpen, FileText, Plus, Grid3X3, List, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { useHandoutUpload } from '../../../hooks/useHandoutUpload';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { v4 as uuidv4 } from 'uuid';

function SortableHandoutItem({ handout, categories, onToggle, onDelete, onCategoryChange }: {
  handout: { id: string; name: string; imageUrl: string; type: 'image' | 'pdf' | 'text'; isOpen: boolean; category?: string };
  categories: Array<{ id: string; name: string }>;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onCategoryChange: (id: string, catId: string | undefined) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: handout.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const cat = categories.find(c => c.id === handout.category);

  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between p-2 rounded-md border border-border bg-card hover:bg-accent/50 group">
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-accent/80 mr-1"
      >
        <GripVertical size={14} className="text-muted-foreground" />
      </div>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="w-10 h-10 rounded shrink-0 bg-muted overflow-hidden border border-border flex items-center justify-center">
          {handout.type === 'pdf' ? (
            <FileIcon size={18} className="text-red-500" />
          ) : handout.type === 'text' ? (
            <FileText size={18} className="text-blue-500" />
          ) : (
            <img src={handout.imageUrl} alt={handout.name} className="w-full h-full object-cover" loading="lazy" />
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium truncate" title={handout.name}>{handout.name}</span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">{handout.type}</span>
            {cat && (
              <span className="text-[10px] px-1 py-0.5 rounded bg-muted/50 text-muted-foreground flex items-center gap-0.5">
                <Folder size={8} /> {cat.name}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {categories.length > 0 && (
          <select
            value={handout.category || ''}
            onChange={(e) => onCategoryChange(handout.id, e.target.value || undefined)}
            className="text-[10px] bg-input border border-border rounded px-1 py-0.5 mr-1 max-w-[100px] truncate"
            aria-label="Catégorie"
          >
            <option value="">Sans catégorie</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        <button
          onClick={() => onToggle(handout.id)}
          className={`p-1.5 rounded-md transition-colors ${handout.isOpen ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
          title={handout.isOpen ? "Masquer" : "Afficher"}
          aria-label={handout.isOpen ? "Masquer" : "Afficher"}
        >
          {handout.isOpen ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
        <button
          onClick={() => onDelete(handout.id)}
          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
          title="Supprimer"
          aria-label="Supprimer"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

function HandoutGridCard({ handout, onToggle, onDelete, onOpen }: {
  handout: { id: string; name: string; imageUrl: string; type: 'image' | 'pdf' | 'text'; isOpen: boolean; content?: string };
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onOpen: () => void;
}) {
  return (
    <div className="flex flex-col rounded-md border border-border bg-card hover:bg-accent/50 overflow-hidden group">
      <div className="relative aspect-video bg-muted cursor-pointer" onClick={onOpen}>
        {handout.type === 'pdf' ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <FileIcon size={32} className="text-red-500/60" />
          </div>
        ) : handout.type === 'text' ? (
          <div className="absolute inset-0 flex items-center justify-center p-3">
            <p className="text-[10px] text-muted-foreground line-clamp-4 text-center">{handout.content || 'Note vide'}</p>
          </div>
        ) : (
          <img src={handout.imageUrl} alt={handout.name} className="w-full h-full object-cover" loading="lazy" />
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <Maximize size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <span className={`absolute top-1 right-1 text-[8px] px-1.5 py-0.5 rounded font-bold ${
          handout.type === 'pdf' ? 'bg-red-500/80 text-white' : handout.type === 'text' ? 'bg-blue-500/80 text-white' : 'bg-green-500/80 text-white'
        }`}>
          {handout.type.toUpperCase()}
        </span>
      </div>
      <div className="p-2 flex items-center justify-between gap-1">
        <span className="text-xs font-medium truncate" title={handout.name}>{handout.name}</span>
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={() => onToggle(handout.id)} className={`p-1 rounded ${handout.isOpen ? 'text-primary' : 'text-muted-foreground'}`} aria-label="Toggle">
            {handout.isOpen ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>
          <button onClick={() => onDelete(handout.id)} className="p-1 text-muted-foreground hover:text-destructive" aria-label="Supprimer">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

export const HandoutsTab: React.FC = () => {
  const { handouts, handoutCategories, deleteHandout, toggleHandout, updateHandout, addHandout, addHandoutCategory, deleteHandoutCategory, updateHandoutCategory } = useVttStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newHandoutName, setNewHandoutName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'pdf' | 'text'>('all');
  const [filterCategory, setFilterCategory] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'name' | 'date'>('name');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isDragOver, setIsDragOver] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showTextNote, setShowTextNote] = useState(false);
  const [textNoteTitle, setTextNoteTitle] = useState('');
  const [textNoteContent, setTextNoteContent] = useState('');

  const { isUploading, uploadProgress, errors, uploadFiles, clearErrors } = useHandoutUpload();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      // Visual feedback only; actual reordering would need a custom order field
    }
  };

  const handleFileDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await uploadFiles(files);
      setUploadSuccess(`${files.length} fichier(s) ajouté(s)`);
      setTimeout(() => setUploadSuccess(null), 3000);
    }
  }, [uploadFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const names: Record<string, string> = {};
    if (files.length === 1 && newHandoutName) names[files[0].name] = newHandoutName;
    const result = await uploadFiles(files, names);
    if (result.successCount > 0) {
      setUploadSuccess(`${result.successCount} aide(s) ajoutée(s)`);
      setTimeout(() => setUploadSuccess(null), 3000);
    }
    setNewHandoutName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = useCallback((id: string) => setShowDeleteConfirm(id), []);

  const confirmDelete = useCallback(async (id: string) => {
    const handout = handouts.find(h => h.id === id);
    if (handout?.imageUrl) {
      const { deleteFileFromStorage } = await import('../../../lib/supabase');
      await deleteFileFromStorage(handout.imageUrl);
    }
    deleteHandout(id);
    setShowDeleteConfirm(null);
  }, [handouts, deleteHandout]);

  const handleCategoryChange = useCallback((id: string, catId: string | undefined) => {
    updateHandout(id, { category: catId });
  }, [updateHandout]);

  const handleAddCategory = useCallback(() => {
    if (newCategoryName.trim()) {
      addHandoutCategory({ name: newCategoryName.trim() });
      setNewCategoryName('');
      setShowNewCategory(false);
    }
  }, [newCategoryName, addHandoutCategory]);

  const handleCreateTextNote = useCallback(() => {
    if (textNoteTitle.trim()) {
      addHandout({
        name: textNoteTitle.trim(),
        imageUrl: '',
        type: 'text',
        content: textNoteContent,
        isOpen: true,
        x: 50 + handouts.filter(h => h.isOpen).length * 30,
        y: 50 + handouts.filter(h => h.isOpen).length * 30,
        width: 400,
        height: 300,
        isMaximized: false,
        zIndex: handouts.length + 1,
      });
      setTextNoteTitle('');
      setTextNoteContent('');
      setShowTextNote(false);
      setUploadSuccess('Note créée');
      setTimeout(() => setUploadSuccess(null), 3000);
    }
  }, [textNoteTitle, textNoteContent, handouts, addHandout]);

  const filteredAndSortedHandouts = useMemo(() => {
    let result = [...handouts];
    if (filterType !== 'all') result = result.filter(h => h.type === filterType);
    if (filterCategory) result = result.filter(h => h.category === filterCategory);
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(h => h.name.toLowerCase().includes(query) || (h.content && h.content.toLowerCase().includes(query)));
    }
    if (sortBy === 'name') result.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    return result;
  }, [handouts, filterType, filterCategory, searchQuery, sortBy]);

  const openCount = handouts.filter(h => h.isOpen).length;

  const handleDropZoneRef = useRef<HTMLDivElement>(null);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div
        ref={handleDropZoneRef}
        className={`flex flex-col gap-4 transition-colors ${isDragOver ? 'bg-primary/5 rounded-lg p-2' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleFileDrop}
      >
        {isDragOver && (
          <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center z-10 pointer-events-none">
            <div className="flex flex-col items-center gap-2">
              <Upload size={32} className="text-primary" />
              <span className="text-sm font-medium text-primary">Déposez vos fichiers ici</span>
            </div>
          </div>
        )}

        <section className="flex flex-col gap-2">
          <h3 className="font-semibold text-sm border-b border-border pb-1">Ajouter une Aide de Jeu</h3>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="Nom (optionnel)"
              value={newHandoutName}
              onChange={(e) => setNewHandoutName(e.target.value)}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isUploading ? <><Loader2 size={16} className="animate-spin" /> ({uploadProgress.current}/{uploadProgress.total})</> : <><Upload size={16} /> Fichier(s)</>}
              </button>
              <button
                onClick={() => setShowTextNote(true)}
                className="px-3 py-2 bg-muted border border-border rounded-md text-sm hover:bg-accent transition-colors"
                title="Créer une note textuelle"
              >
                <FileText size={16} />
              </button>
            </div>
            <input type="file" accept="image/*,application/pdf" multiple ref={fileInputRef} onChange={handleUpload} className="hidden" />
            <p className="text-[10px] text-muted-foreground text-center">Glisser-déposer ou sélectionner (max 10MB/fichier)</p>

            {uploadSuccess && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-green-500/10 border border-green-500/20 text-green-500 text-xs">
                <CheckCircle2 size={14} /> {uploadSuccess}
              </div>
            )}
            {errors.length > 0 && (
              <div className="flex flex-col gap-1 p-2 rounded-md bg-red-500/10 border border-red-500/20">
                {errors.map((err, i) => (<div key={i} className="flex items-center gap-2 text-red-500 text-xs"><AlertCircle size={12} /> {err}</div>))}
                <button onClick={clearErrors} className="text-[10px] text-red-400 hover:text-red-300 self-end mt-1">Fermer</button>
              </div>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-border pb-1">
            <h3 className="font-semibold text-sm">
              Mes Aides de Jeu
              <span className="ml-1 text-[10px] text-muted-foreground font-normal">({openCount}/{handouts.length})</span>
            </h3>
            <div className="flex items-center gap-1">
              <button onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')} className="p-1 rounded hover:bg-accent text-muted-foreground" title={viewMode === 'list' ? 'Vue grille' : 'Vue liste'}>
                {viewMode === 'list' ? <Grid3X3 size={14} /> : <List size={14} />}
              </button>
            </div>
          </div>

          {handouts.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-input border border-border rounded-md pl-8 pr-8 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
                {searchQuery && (<button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X size={14} /></button>)}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex gap-1">
                  {(['all', 'image', 'pdf', 'text'] as const).map(type => (
                    <button key={type} onClick={() => setFilterType(type)} className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${filterType === type ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
                      {type === 'all' ? 'Tous' : type === 'image' ? 'Images' : type === 'pdf' ? 'PDF' : 'Notes'}
                    </button>
                  ))}
                </div>
                {handoutCategories.length > 0 && (
                  <select value={filterCategory || ''} onChange={(e) => setFilterCategory(e.target.value || undefined)} className="text-[10px] bg-input border border-border rounded px-1 py-1">
                    <option value="">Toutes catégories</option>
                    {handoutCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
                <button onClick={() => setSortBy(sortBy === 'name' ? 'date' : 'name')} className="ml-auto px-2 py-1 rounded text-[10px] font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  Tri: {sortBy === 'name' ? 'A-Z' : 'Date'}
                </button>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Catégories</span>
                  <button onClick={() => setShowNewCategory(true)} className="p-1 rounded hover:bg-accent text-muted-foreground" title="Nouvelle catégorie">
                    <FolderPlus size={12} />
                  </button>
                </div>
                {handoutCategories.length === 0 && <span className="text-[10px] text-muted-foreground italic">Aucune catégorie</span>}
                <div className="flex flex-wrap gap-1">
                  {handoutCategories.map(cat => {
                    const count = handouts.filter(h => h.category === cat.id).length;
                    return (
                      <div key={cat.id} className="flex items-center gap-1 px-2 py-1 rounded bg-muted/50 text-xs group">
                        <button onClick={() => setFilterCategory(filterCategory === cat.id ? undefined : cat.id)} className={`flex items-center gap-1 ${filterCategory === cat.id ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                          {filterCategory === cat.id ? <FolderOpen size={12} /> : <Folder size={12} />} {cat.name}
                          <span className="text-[9px] text-muted-foreground/60">({count})</span>
                        </button>
                        <button onClick={() => deleteHandoutCategory(cat.id)} className="p-0.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Supprimer catégorie">
                          <X size={10} />
                        </button>
                      </div>
                    );
                  })}
                </div>
                {showNewCategory && (
                  <div className="flex gap-1 mt-1">
                    <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Nom de la catégorie" className="flex-1 bg-input border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring" onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()} autoFocus />
                    <button onClick={handleAddCategory} className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs">OK</button>
                    <button onClick={() => { setShowNewCategory(false); setNewCategoryName(''); }} className="px-2 py-1 bg-muted rounded text-xs">Annuler</button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {filteredAndSortedHandouts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{searchQuery || filterType !== 'all' || filterCategory ? 'Aucun résultat.' : 'Aucune aide de jeu.'}</p>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 gap-2">
                {filteredAndSortedHandouts.map(h => (
                  <HandoutGridCard key={h.id} handout={h} onToggle={toggleHandout} onDelete={handleDelete} onOpen={() => toggleHandout(h.id)} />
                ))}
              </div>
            ) : (
              <SortableContext items={filteredAndSortedHandouts.map(h => h.id)} strategy={verticalListSortingStrategy}>
                {filteredAndSortedHandouts.map(h => (
                  <SortableHandoutItem key={h.id} handout={h} categories={handoutCategories} onToggle={toggleHandout} onDelete={handleDelete} onCategoryChange={handleCategoryChange} />
                ))}
              </SortableContext>
            )}
          </div>
        </section>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={() => setShowDeleteConfirm(null)}>
            <div className="bg-card border border-border rounded-lg p-6 max-w-sm mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h4 className="font-semibold text-sm mb-2">Supprimer cette aide ?</h4>
              <p className="text-xs text-muted-foreground mb-4">Action irréversible. Le fichier sera supprimé du stockage.</p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowDeleteConfirm(null)} className="px-3 py-1.5 rounded-md text-sm bg-muted hover:bg-accent">Annuler</button>
                <button onClick={() => confirmDelete(showDeleteConfirm)} className="px-3 py-1.5 rounded-md text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</button>
              </div>
            </div>
          </div>
        )}

        {showTextNote && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={() => setShowTextNote(false)}>
            <div className="bg-card border border-border rounded-lg p-4 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2"><FileText size={16} /> Nouvelle note</h4>
              <input type="text" value={textNoteTitle} onChange={(e) => setTextNoteTitle(e.target.value)} placeholder="Titre de la note" className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-ring" autoFocus />
              <textarea value={textNoteContent} onChange={(e) => setTextNoteContent(e.target.value)} placeholder="Contenu de la note..." className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm h-32 resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
              <div className="flex gap-2 justify-end mt-3">
                <button onClick={() => { setShowTextNote(false); setTextNoteTitle(''); setTextNoteContent(''); }} className="px-3 py-1.5 rounded-md text-sm bg-muted hover:bg-accent">Annuler</button>
                <button onClick={handleCreateTextNote} disabled={!textNoteTitle.trim()} className="px-3 py-1.5 rounded-md text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">Créer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndContext>
  );
};
