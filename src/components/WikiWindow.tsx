import React, { useState, useRef, useEffect } from 'react';
import { useVttStore } from '../store';
import { Book, X, Bold, Italic, Underline, List, ListOrdered, Palette, Type } from 'lucide-react';

export const WikiWindow: React.FC = () => {
  const { wiki: storeWiki, setWiki } = useVttStore();
  const wiki = storeWiki || { isOpen: false, isDetached: false, x: 400, y: 200, content: '' };
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  if (!wiki.isOpen || !wiki.isDetached) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!(e.target as HTMLElement).closest('.drag-handle')) return;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: wiki.x,
      initY: wiki.y
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setWiki({
      x: dragRef.current.initX + dx,
      y: dragRef.current.initY + dy
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
      dragRef.current = null;
    }
  };

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setWiki({ content: editorRef.current.innerHTML });
    }
  };

  const onInput = () => {
    if (editorRef.current) {
      setWiki({ content: editorRef.current.innerHTML });
    }
  };

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== wiki.content) {
      editorRef.current.innerHTML = wiki.content;
    }
  }, []);

  return (
    <div
      className="fixed bg-card border border-border shadow-2xl rounded-xl overflow-hidden flex flex-col z-[150] w-[500px] h-[600px] touch-none"
      style={{
        left: wiki.x,
        top: wiki.y,
        transition: isDragging ? 'none' : 'opacity 0.2s',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="drag-handle flex items-center justify-between bg-muted p-3 cursor-grab active:cursor-grabbing border-b border-border">
        <div className="flex items-center gap-2 text-sm font-bold text-blue-400 select-none">
          <Book size={16} /> Wiki
        </div>
        <div className="flex items-center gap-1 text-white">
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              setWiki({ isDetached: false });
            }}
            className="p-1.5 hover:bg-accent hover:text-foreground text-muted-foreground rounded transition-colors text-[10px] font-bold uppercase tracking-tighter"
            title="Rattacher au panneau"
          >
            Rattacher
          </button>
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              setWiki({ isOpen: false });
            }}
            className="p-1 hover:bg-destructive hover:text-white text-muted-foreground rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 p-2 bg-muted/30 border-b border-border">
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('bold')} className="p-1.5 hover:bg-accent rounded text-foreground" title="Gras"><Bold size={16} /></button>
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('italic')} className="p-1.5 hover:bg-accent rounded text-foreground" title="Italique"><Italic size={16} /></button>
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('underline')} className="p-1.5 hover:bg-accent rounded text-foreground" title="Souligné"><Underline size={16} /></button>
        <div className="w-px h-4 bg-border mx-1" />
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('insertUnorderedList')} className="p-1.5 hover:bg-accent rounded text-foreground" title="Puces"><List size={16} /></button>
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('insertOrderedList')} className="p-1.5 hover:bg-accent rounded text-foreground" title="Liste ordonnée"><ListOrdered size={16} /></button>
        <div className="w-px h-4 bg-border mx-1" />
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('foreColor', '#3b82f6')} className="p-1.5 hover:bg-accent rounded text-blue-500" title="Bleu"><Palette size={16} /></button>
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('foreColor', '#ef4444')} className="p-1.5 hover:bg-accent rounded text-red-500" title="Rouge"><Palette size={16} /></button>
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('foreColor', '#eab308')} className="p-1.5 hover:bg-accent rounded text-yellow-500" title="Jaune"><Palette size={16} /></button>
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('foreColor', '#ffffff')} className="p-1.5 hover:bg-accent rounded text-white" title="Blanc"><Palette size={16} /></button>
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('removeFormat')} className="p-1.5 hover:bg-accent rounded text-foreground" title="Effacer mise en forme"><Type size={16} /></button>
      </div>

      <div 
        ref={editorRef}
        contentEditable
        onInput={onInput}
        className="flex-1 p-4 overflow-y-auto custom-scrollbar focus:outline-none prose prose-invert max-w-none text-sm leading-relaxed text-foreground"
        style={{ minHeight: '100px' }}
      />
    </div>
  );
};
