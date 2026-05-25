import React, { useState, useRef, useEffect } from 'react';
import { useVttStore, initialState } from '../store';
import { Book, X, Bold, Italic, Underline, List, ListOrdered, Palette, Type, Search, Undo2, Redo2, Heading1, Heading2, Image as ImageIcon, Download, Upload, FileJson, FileText } from 'lucide-react';

export const WikiWindow: React.FC = () => {
  const storeWiki = useVttStore(state => state.wiki);
  const setWiki = useVttStore(state => state.setWiki);
  const wiki = storeWiki || initialState.wiki || { isOpen: false, isDetached: false, x: 400, y: 200, content: '' };
  
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedCount, setHighlightedCount] = useState(0);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // Undo/Redo history
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const maxHistory = 50;

  const addToHistory = (content: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    if (newHistory[newHistory.length - 1] !== content) {
      newHistory.push(content);
      if (newHistory.length > maxHistory) {
        newHistory.shift();
      }
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0 && editorRef.current) {
      const newIndex = historyIndex - 1;
      editorRef.current.innerHTML = history[newIndex];
      setHistoryIndex(newIndex);
      setWiki({ content: history[newIndex] });
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1 && editorRef.current) {
      const newIndex = historyIndex + 1;
      editorRef.current.innerHTML = history[newIndex];
      setHistoryIndex(newIndex);
      setWiki({ content: history[newIndex] });
    }
  };

  // Sync editor content with store content when window opens
  useEffect(() => {
    if (editorRef.current && wiki.isOpen && wiki.isDetached) {
      if (editorRef.current.innerHTML !== wiki.content) {
        editorRef.current.innerHTML = wiki.content;
        if (historyIndex === -1) {
          setHistory([wiki.content]);
          setHistoryIndex(0);
        }
      }
    }
  }, [wiki.isOpen, wiki.isDetached, wiki.content]);

  // Highlight search results
  useEffect(() => {
    if (searchTerm && editorRef.current) {
      const content = editorRef.current.innerHTML;
      const regex = new RegExp(`(${searchTerm})`, 'gi');
      setHighlightedCount((content.match(regex) || []).length);
    } else {
      setHighlightedCount(0);
    }
  }, [searchTerm]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, historyIndex]);

  // Make H2/H3 clickable for collapsible sections
  useEffect(() => {
    if (editorRef.current) {
      const headings = editorRef.current.querySelectorAll('h2, h3');
      headings.forEach(h => {
        h.addEventListener('click', () => {
          h.classList.toggle('collapsed');
        });
      });
    }
  }, [wiki.content]);

  if (!wiki.isOpen || !wiki.isDetached) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.drag-handle')) return;
    if (target.closest('button')) return;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: wiki.x || 400,
      initY: wiki.y || 200
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
      const newContent = editorRef.current.innerHTML;
      setWiki({ content: newContent });
      addToHistory(newContent);
    }
    editorRef.current?.focus();
  };

  const onInput = () => {
    if (editorRef.current) {
      setWiki({ content: editorRef.current.innerHTML });
    }
  };

  const handleBlur = () => {
    if (editorRef.current) {
      addToHistory(editorRef.current.innerHTML);
    }
  };

  const toggleDetached = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWiki({ isDetached: false });
  };

  const closeWiki = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWiki({ isOpen: false });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editorRef.current) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imgHtml = `<img src="${event.target?.result}" alt="${file.name}" style="max-width:100%;height:auto;margin:10px 0;" />`;
        document.execCommand('insertHTML', false, imgHtml);
        if (editorRef.current) {
          addToHistory(editorRef.current.innerHTML);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const exportWiki = (format: 'html' | 'md' | 'json') => {
    const content = wiki.content || '';
    let exportContent = '';
    let mimeType = 'text/plain';
    let extension = format;

    if (format === 'json') {
      exportContent = JSON.stringify({ title: 'Wiki Export', content, exportedAt: new Date().toISOString() }, null, 2);
      mimeType = 'application/json';
    } else if (format === 'html') {
      exportContent = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Wiki Export</title></head>
<body>${content}</body>
</html>`;
      mimeType = 'text/html';
    } else if (format === 'md') {
      // Simple HTML to Markdown conversion
      let md = content
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
        .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
        .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<b>(.*?)<\/b>/gi, '**$1**')
        .replace(/<em>(.*?)<\/em>/gi, '*$1*')
        .replace(/<i>(.*?)<\/i>/gi, '*$1*')
        .replace(/<u>(.*?)<\/u>/gi, '_$1_')
        .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
        .replace(/<br[^>]*>/gi, '\n')
        .replace(/<[^>]+>/g, '');
      exportContent = md;
      mimeType = 'text/markdown';
    }

    const blob = new Blob([exportContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wiki-export-${new Date().toISOString().split('T')[0]}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importWiki = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.html,.md,.json,.txt';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          try {
            // Try to parse as JSON first
            const json = JSON.parse(content);
            if (json.content) {
              setWiki({ content: json.content });
              if (editorRef.current) {
                editorRef.current.innerHTML = json.content;
                addToHistory(json.content);
              }
              return;
            }
          } catch {}
          // Otherwise treat as HTML or Markdown
          setWiki({ content });
          if (editorRef.current) {
            editorRef.current.innerHTML = content;
            addToHistory(content);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div
      className="fixed bg-card border border-border shadow-2xl rounded-xl overflow-hidden flex flex-col z-[150] w-[500px] h-[600px] touch-none"
      style={{
        left: wiki.x || 400,
        top: wiki.y || 200,
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
        <div className="flex items-center gap-1">
          <button
            onClick={toggleDetached}
            className="p-1.5 hover:bg-accent hover:text-foreground text-muted-foreground rounded transition-colors text-[10px] font-bold uppercase tracking-tighter"
            title="Rattacher au panneau"
          >
            Rattacher
          </button>
          <button
            onClick={closeWiki}
            className="p-1 hover:bg-destructive hover:text-white text-muted-foreground rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-muted/30 border-b border-border">
        <button onMouseDown={(e) => e.preventDefault()} onClick={handleUndo} disabled={historyIndex <= 0} className="p-1.5 hover:bg-accent rounded text-foreground disabled:opacity-30 disabled:cursor-not-allowed" title="Annuler (Ctrl+Z)"><Undo2 size={16} /></button>
        <button onMouseDown={(e) => e.preventDefault()} onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-1.5 hover:bg-accent rounded text-foreground disabled:opacity-30 disabled:cursor-not-allowed" title="Rétablir (Ctrl+Y)"><Redo2 size={16} /></button>
        <div className="w-px h-4 bg-border mx-1" />
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('formatBlock', 'H1')} className="p-1.5 hover:bg-accent rounded text-foreground" title="Titre H1"><Heading1 size={16} /></button>
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('formatBlock', 'H2')} className="p-1.5 hover:bg-accent rounded text-foreground" title="Sous-titre H2"><Heading2 size={16} /></button>
        <div className="w-px h-4 bg-border mx-1" />
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
        <div className="w-px h-4 bg-border mx-1" />
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => imageInputRef.current?.click()} className="p-1.5 hover:bg-accent rounded text-foreground" title="Insérer une image"><ImageIcon size={16} /></button>
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => exportWiki('html')} className="p-1.5 hover:bg-accent rounded text-foreground" title="Exporter HTML"><Download size={16} /></button>
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => exportWiki('md')} className="p-1.5 hover:bg-accent rounded text-foreground" title="Exporter Markdown"><FileText size={16} /></button>
        <button onMouseDown={(e) => e.preventDefault()} onClick={importWiki} className="p-1.5 hover:bg-accent rounded text-foreground" title="Importer"><Upload size={16} /></button>
        <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-2 p-2 bg-muted/20 border-b border-border">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher dans le wiki..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-7 pr-2 py-1 text-xs bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        {searchTerm && (
          <span className="text-[10px] text-muted-foreground font-medium">
            {highlightedCount} résultat{highlightedCount > 1 ? 's' : ''}
          </span>
        )}
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="p-1 hover:bg-accent rounded text-muted-foreground"
            title="Effacer la recherche"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div 
        ref={editorRef}
        contentEditable
        onInput={onInput}
        onBlur={handleBlur}
        className="flex-1 p-4 overflow-y-auto custom-scrollbar focus:outline-none text-sm leading-relaxed text-foreground wiki-content"
        style={{ minHeight: '100px' }}
      >
        <style>{`
          .wiki-content h2, .wiki-content h3 {
            cursor: pointer;
            position: relative;
            padding-left: 20px;
          }
          .wiki-content h2::before, .wiki-content h3::before {
            content: '▼';
            position: absolute;
            left: 0;
            font-size: 0.7em;
            transition: transform 0.2s;
          }
          .wiki-content h2.collapsed::before, .wiki-content h3.collapsed::before {
            transform: rotate(-90deg);
          }
          .wiki-content h2 + *, .wiki-content h3 + * {
            transition: max-height 0.3s ease, opacity 0.3s ease;
          }
          .wiki-content h2.collapsed + *, .wiki-content h3.collapsed + * {
            max-height: 0;
            opacity: 0;
            overflow: hidden;
          }
        `}</style>
      </div>
    </div>
  );
};
