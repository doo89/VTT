import React, { useState, useRef } from 'react';
import { useVttStore } from '../store';
import { Book, X, ArrowUpRight, Bold, Italic, List, Eye, Edit3, Lock, Unlock, EyeOff } from 'lucide-react';

import { renderMarkdown } from '../lib/utils';

export const CampaignJournalWindow: React.FC = () => {
  const storeCampaignJournal = useVttStore(state => state.campaignJournal);
  const updateCampaignJournal = useVttStore(state => state.updateCampaignJournal);
  const campaignJournal = storeCampaignJournal || {
    isOpen: false,
    isDetached: false,
    x: 400,
    y: 200,
    publicContent: '',
    privateContent: '',
    permission: 'readonly' as const,
    lockHolderId: null,
    lockHolderName: null,
    lockExpiration: null,
  };
  const [activeTab, setActiveTab] = useState<'public' | 'private'>('public');
  const [isPreview, setIsPreview] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const publicTextareaRef = useRef<HTMLTextAreaElement>(null);
  const privateTextareaRef = useRef<HTMLTextAreaElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);

  if (!campaignJournal.isOpen) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.drag-handle')) return;
    if (target.closest('button') || target.closest('select')) return;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: campaignJournal.x,
      initY: campaignJournal.y
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    updateCampaignJournal({
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

  const insertMarkdown = (format: 'bold' | 'italic' | 'list') => {
    const textarea = activeTab === 'public' ? publicTextareaRef.current : privateTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    
    let formatted = '';
    if (format === 'bold') {
      formatted = `**${selected || 'texte'}**`;
    } else if (format === 'italic') {
      formatted = `*${selected || 'texte'}*`;
    } else if (format === 'list') {
      if (selected.includes('\n')) {
        formatted = selected.split('\n').map(line => line.startsWith('- ') ? line : `- ${line}`).join('\n');
      } else {
        formatted = `- ${selected || 'élément'}`;
      }
    }

    const newValue = text.substring(0, start) + formatted + text.substring(end);
    
    if (activeTab === 'public') {
      updateCampaignJournal({ publicContent: newValue });
    } else {
      updateCampaignJournal({ privateContent: newValue });
    }

    // Refocus and restore selection
    setTimeout(() => {
      textarea.focus();
      const offset = format === 'list' ? 2 : (format === 'bold' ? 2 : 1);
      if (selected) {
        textarea.setSelectionRange(start, start + formatted.length);
      } else {
        const wordLen = format === 'bold' ? 5 : (format === 'italic' ? 5 : 7);
        textarea.setSelectionRange(start + offset, start + offset + wordLen);
      }
    }, 0);
  };

  return (
    <div
      className="fixed bg-card border border-border shadow-2xl rounded-xl overflow-hidden flex flex-col z-[150] w-[500px] h-[550px] touch-none"
      style={{
        left: campaignJournal.x,
        top: campaignJournal.y,
        transition: isDragging ? 'none' : 'opacity 0.2s',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Header / Drag Handle */}
      <div className="drag-handle flex items-center justify-between bg-muted p-3 cursor-grab active:cursor-grabbing border-b border-border">
        <div className="flex items-center gap-2 text-sm font-bold text-amber-500 select-none">
          <Book size={16} /> Journal de Campagne
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              updateCampaignJournal({ isDetached: false });
            }}
            className="p-1.5 hover:bg-accent hover:text-foreground text-muted-foreground rounded transition-colors text-[10px] font-bold uppercase tracking-tighter flex items-center gap-1"
            title="Rattacher au panneau gauche"
          >
            <ArrowUpRight size={12} className="rotate-180" /> Rattacher
          </button>
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              updateCampaignJournal({ isOpen: false });
            }}
            className="p-1 hover:bg-destructive hover:text-white text-muted-foreground rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="p-3 bg-card border-b border-border flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          {/* Permission Settings */}
          <div className="flex items-center gap-2 bg-background/50 border border-border rounded-lg px-2.5 py-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Joueurs:</span>
            <select
              value={campaignJournal.permission}
              onChange={(e) => updateCampaignJournal({ permission: e.target.value as any })}
              className="bg-transparent border-none text-xs font-bold text-foreground focus:ring-0 cursor-pointer outline-none"
            >
              <option value="hidden">Masqué</option>
              <option value="readonly">Lecture seule</option>
              <option value="editable">Éditable</option>
            </select>
            <div className="ml-1 text-muted-foreground">
              {campaignJournal.permission === 'hidden' && <EyeOff size={13} className="text-red-500" />}
              {campaignJournal.permission === 'readonly' && <Eye size={13} className="text-blue-500" />}
              {campaignJournal.permission === 'editable' && <Edit3 size={13} className="text-green-500" />}
            </div>
          </div>

          {/* Active Locks info (GM sees who locks) */}
          {campaignJournal.permission === 'editable' && campaignJournal.lockHolderId && (
            <div className="flex items-center gap-2">
              <div className="text-[11px] font-medium bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                <Lock size={10} /> Verrouillé par {campaignJournal.lockHolderName}
              </div>
              <button
                onClick={() => updateCampaignJournal({ lockHolderId: null, lockHolderName: null, lockExpiration: null })}
                className="text-[10px] font-bold px-2 py-0.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-all border border-red-500/30"
                title="Déverrouiller le journal pour tous les joueurs"
              >
                Déverrouiller
              </button>
            </div>
          )}
          {campaignJournal.permission === 'editable' && !campaignJournal.lockHolderId && (
            <div className="text-[11px] font-medium bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Unlock size={10} /> Modifiable par les joueurs
            </div>
          )}
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-border">
          <button
            onClick={() => { setActiveTab('public'); setIsPreview(false); }}
            className={`flex-1 py-1.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'public'
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Journal Public
          </button>
          <button
            onClick={() => { setActiveTab('private'); setIsPreview(false); }}
            className={`flex-1 py-1.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'private'
                ? 'border-red-500 text-red-500'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Notes Secrètes (MJ Uniquement)
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-background/30">
        {/* Editor Toolbar (hidden in preview mode) */}
        {!isPreview && (
          <div className="flex items-center gap-1.5 p-2 bg-muted/30 border-b border-border">
            <button
              onClick={() => insertMarkdown('bold')}
              className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground"
              title="Gras (Ctrl+B)"
            >
              <Bold size={15} />
            </button>
            <button
              onClick={() => insertMarkdown('italic')}
              className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground"
              title="Italique (Ctrl+I)"
            >
              <Italic size={15} />
            </button>
            <button
              onClick={() => insertMarkdown('list')}
              className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground"
              title="Liste à puces"
            >
              <List size={15} />
            </button>
            <div className="ml-auto">
              <button
                onClick={() => setIsPreview(true)}
                className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 bg-accent hover:bg-accent/80 text-foreground rounded transition-all"
              >
                <Eye size={12} /> Aperçu
              </button>
            </div>
          </div>
        )}

        {isPreview && (
          <div className="flex items-center justify-between p-2 bg-amber-500/5 border-b border-border text-[11px] font-bold text-amber-500">
            <span>Aperçu du rendu final</span>
            <button
              onClick={() => setIsPreview(false)}
              className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-500 rounded hover:bg-amber-500/30 transition-all"
            >
              <Edit3 size={12} /> Éditer
            </button>
          </div>
        )}

        {/* Text Area or Preview Render */}
        <div className="flex-1 p-3 min-h-0 overflow-y-auto custom-scrollbar">
          {isPreview ? (
            <div
              className="prose prose-sm dark:prose-invert max-w-none break-words select-text"
              dangerouslySetInnerHTML={{
                __html: renderMarkdown(
                  activeTab === 'public'
                    ? campaignJournal.publicContent
                    : campaignJournal.privateContent
                ) || '<em class="text-muted-foreground">Aucun contenu rédigé pour le moment. Rédigez en Markdown ou cliquez sur "Éditer".</em>'
              }}
            />
          ) : activeTab === 'public' ? (
            <textarea
              ref={publicTextareaRef}
              value={campaignJournal.publicContent}
              onChange={(e) => updateCampaignJournal({ publicContent: e.target.value })}
              placeholder="Rédigez ici le journal public de la campagne (les joueurs y auront accès selon les permissions)..."
              className="w-full h-full bg-transparent border-none resize-none focus:ring-0 p-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          ) : (
            <textarea
              ref={privateTextareaRef}
              value={campaignJournal.privateContent}
              onChange={(e) => updateCampaignJournal({ privateContent: e.target.value })}
              placeholder="Notes privées pour le MJ. Personne d'autre ne peut les voir, même via les flux de synchronisation..."
              className="w-full h-full bg-transparent border-none resize-none focus:ring-0 p-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          )}
        </div>
      </div>
    </div>
  );
};
