import React, { useRef, useState, useEffect } from 'react';
import { useVttStore } from '../store';
import { Tag, X, Move, GripHorizontal, Minimize2, Maximize2, Grid3X3, ArrowUpDown } from 'lucide-react';
import * as icons from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates, useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export const TagDistributorWindow: React.FC = () => {
  const { tagDistributorState, setTagDistributorState, tags, updateTagModel, reorderDistributorTags } = useVttStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [cols, setCols] = useState(1);
  const [compactMode, setCompactMode] = useState(false);
  const [sortMode, setSortMode] = useState<'order' | 'alpha'>('order');
  const [dragMode, setDragMode] = useState<'distribute' | 'reorder'>('distribute');
  const distributorRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number, y: number, startX: number, startY: number } | null>(null);
  const resizeStartRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const tagsInDistributor = tags
    .filter(tag => tag.isInDistributor)
    .sort((a, b) => {
      if (sortMode === 'alpha') {
        return a.name.localeCompare(b.name, 'fr');
      }
      return (a.distributorOrder ?? 999999) - (b.distributorOrder ?? 999999);
    });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = tagsInDistributor.findIndex(t => t.id === active.id);
      const newIndex = tagsInDistributor.findIndex(t => t.id === over.id);
      const newOrder = arrayMove(tagsInDistributor, oldIndex, newIndex).map(t => t.id);
      reorderDistributorTags(newOrder);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragStartRef.current) return;
      
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      
      setTagDistributorState({
        x: dragStartRef.current.startX + dx,
        y: dragStartRef.current.startY + dy
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, setTagDistributorState]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !resizeStartRef.current) return;
      const dx = e.clientX - resizeStartRef.current.startX;
      const newWidth = Math.max(260, Math.min(600, resizeStartRef.current.startWidth + dx));
      if (distributorRef.current) {
        distributorRef.current.style.width = `${newWidth}px`;
        const newCols = Math.floor((newWidth - 24) / 80);
        setCols(Math.max(1, Math.min(newCols, 6)));
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      resizeStartRef.current = null;
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const SortableTagItem = ({ tag }: { tag: typeof tagsInDistributor[0] }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tag.id });
    const IconComponent = icons[tag.icon as keyof typeof icons] || Tag;
    
    const isReorderMode = dragMode === 'reorder';

    const style = {
      transform: isReorderMode ? CSS.Transform.toString(transform) : undefined,
      transition: isReorderMode ? transition : undefined,
      opacity: isReorderMode && isDragging ? 0.5 : 1,
    };

    const dragHandlers = isReorderMode ? {
      ...attributes,
      ...listeners,
    } : {
      draggable: true,
      onDragStart: (e: React.DragEvent) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'new_marker', data: tag }));
      }
    };

    return (
      <div
        ref={isReorderMode ? setNodeRef : undefined}
        style={style}
        {...dragHandlers}
        className={`flex flex-col items-center p-2 rounded-md border border-border bg-card hover:bg-accent/50 cursor-grab active:cursor-grabbing transform transition-all active:scale-95 ${compactMode ? 'gap-1' : 'gap-2'}`}
        title={isReorderMode ? "Glisser pour réorganiser dans la grille" : "Glisser vers la salle ou un joueur"}
      >
        <div 
          className={`${compactMode ? 'w-8 h-8' : 'w-10 h-10'} rounded flex items-center justify-center shrink-0 shadow-sm`} 
          style={{ backgroundColor: tag.color, color: '#fff' }}
        >
          {React.createElement(IconComponent as any, { size: compactMode ? 16 : 20 })}
        </div>
        {!compactMode && (
          <>
            <span className="text-xs font-semibold text-center truncate w-full">{tag.name}</span>
            {(tag.lives !== null || tag.points !== null) && (
              <span className="text-[9px] text-muted-foreground text-center">
                {[tag.lives !== null ? `♥${tag.lives}` : null, tag.points !== null ? `★${tag.points}` : null].filter(Boolean).join(' | ')}
              </span>
            )}
          </>
        )}
        {compactMode && <span className="text-[9px] font-semibold text-center truncate w-full">{tag.name}</span>}
      </div>
    );
  };

  if (!tagDistributorState.isDetached || tagsInDistributor.length === 0) return null;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
    <div
      ref={distributorRef}
      className={`fixed z-[100] bg-background border border-border shadow-2xl rounded-lg overflow-hidden flex flex-col ${isDragging ? 'opacity-90' : ''}`}
      style={{
        left: tagDistributorState.x,
        top: tagDistributorState.y,
        width: 300,
        minWidth: 260,
        maxHeight: '60vh'
      }}
    >
      <div 
        className="bg-accent/50 p-2 flex items-center justify-between border-b border-border cursor-move select-none"
        onMouseDown={(e) => {
          setIsDragging(true);
          dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            startX: tagDistributorState.x,
            startY: tagDistributorState.y
          };
        }}
      >
        <div className="flex items-center gap-2 font-bold text-sm text-foreground">
          <GripHorizontal size={14} className="text-muted-foreground" />
          Distributeur de Tags ({tagsInDistributor.length})
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDragMode(dragMode === 'distribute' ? 'reorder' : 'distribute')}
            className={`p-1 rounded transition-colors ${dragMode === 'reorder' ? 'bg-amber-500/20 text-amber-500' : 'text-muted-foreground hover:text-foreground'}`}
            title={dragMode === 'reorder' ? "Mode actuel : Réorganisation (Glisser pour trier)" : "Mode actuel : Distribution (Glisser vers la salle/joueur)"}
          >
            {dragMode === 'reorder' ? <Move size={14} /> : <Tag size={14} />}
          </button>
          <button
            onClick={() => setSortMode(sortMode === 'order' ? 'alpha' : 'order')}
            className={`p-1 rounded transition-colors ${sortMode === 'order' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            title={sortMode === 'order' ? "Tri: Ordre personnalisé" : "Tri: Alphabétique"}
          >
            <ArrowUpDown size={14} />
          </button>
          <button
            onClick={() => setCompactMode(!compactMode)}
            className={`p-1 rounded transition-colors ${compactMode ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            title={compactMode ? "Mode détaillé" : "Mode compact"}
          >
            {compactMode ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
          <button
            onClick={() => {
              const newCols = cols >= 6 ? 1 : cols + 1;
              setCols(newCols);
              if (distributorRef.current) {
                distributorRef.current.style.width = `${newCols * 80 + 24}px`;
              }
            }}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            title={`Colonnes: ${cols}`}
          >
            <Grid3X3 size={14} />
          </button>
          <button
            onClick={() => setTagDistributorState({ isDetached: false })}
            className="p-1 text-muted-foreground hover:text-primary transition-colors rounded hover:bg-accent"
            title="Rattacher"
            onMouseDown={e => e.stopPropagation()}
          >
            <X size={16} />
          </button>
        </div>
      </div>
      
      <div 
        className="p-3 grid gap-2 overflow-y-auto custom-scrollbar"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        <SortableContext items={tagsInDistributor.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tagsInDistributor.map(tag => (
            <SortableTagItem key={tag.id} tag={tag} />
          ))}
        </SortableContext>
      </div>
      
      <div className="p-2 bg-muted/30 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{tagsInDistributor.length} tag{tagsInDistributor.length > 1 ? 's' : ''} disponible{tagsInDistributor.length > 1 ? 's' : ''}</span>
        <button
          onClick={() => {
            tagsInDistributor.forEach(tag => updateTagModel(tag.id, { isInDistributor: false }));
          }}
          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-destructive/10 text-destructive transition-colors"
          title="Vider le distributeur"
        >
          <X size={12} /> Vider
        </button>
      </div>
    </div>
    </DndContext>
  );
};
