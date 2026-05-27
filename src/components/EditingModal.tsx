import React from 'react';
import { useVttStore } from '../store';
import * as icons from 'lucide-react';
import { X, Trash2, Play, Pause, Square, Keyboard, Mic } from 'lucide-react';
import { uploadFileToStorage, deleteFileFromStorage } from '../lib/supabase';
import { ColorPicker } from './ColorPicker';
import { TagModelForm, TagInstanceForm } from './tags';
import { TEAM_ICONS, TAG_ICONS } from '../lib/icons';
import { getAudio, isIdbUrl, idbUrlToKey } from '../lib/audio-storage';

export const EditingModal: React.FC = () => {
  const { editingEntity, setEditingEntity, players, playerTemplates, roles, teams, tags, tagCategories, markers, soundboard, handouts, actions, updatePlayer, updatePlayerTemplate, updateRole, updateTeam, updateTagModel, updateTagCategory, updateMarker, updateSoundButton, removeSoundButton, addLog } = useVttStore();
  const [activeRoleTab, setActiveRoleTab] = React.useState<'general' | 'distribution' | 'appearance' | 'tags'>('general');
  const [roleNameError, setRoleNameError] = React.useState('');
  const [activePlayerTemplateTab, setActivePlayerTemplateTab] = React.useState<'general' | 'appearance' | 'preview'>('general');
  const [activeTeamTab, setActiveTeamTab] = React.useState<'general' | 'appearance' | 'members'>('general');
  const [templateNameError, setTemplateNameError] = React.useState('');
  const [teamNameError, setTeamNameError] = React.useState('');
  const [teamIconSearch, setTeamIconSearch] = React.useState('');
  const [tagSearchQuery, setTagSearchQuery] = React.useState('');
  
  // Test audio for sound buttons
  const testAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isTesting, setIsTesting] = React.useState(false);
  // Keyboard shortcut capture
  const [capturingShortcut, setCapturingShortcut] = React.useState(false);
  const [capturingShortcutIndex, setCapturingShortcutIndex] = React.useState<number | null>(null);
  // Audio recording
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordingDuration, setRecordingDuration] = React.useState(0);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);
  const recordingTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  React.useEffect(() => {
    if (capturingShortcutIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const key = e.key.length === 1 ? e.key : '';
      if (key) {
        updateSoundButton(capturingShortcutIndex, { shortcut: key.toLowerCase() });
      }
      setCapturingShortcut(false);
      setCapturingShortcutIndex(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [capturingShortcutIndex]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const handleImageFile = async (file: File, onUpdate: (url: string) => void) => {
    const supabaseUrl = await uploadFileToStorage(file);
    if (supabaseUrl) {
      onUpdate(supabaseUrl);
    } else {
      const base64 = await fileToBase64(file);
      onUpdate(base64);
    }
  };

  // Stop test audio when closing or changing entity
  React.useEffect(() => {
    return () => {
      if (testAudioRef.current) {
        testAudioRef.current.pause();
        testAudioRef.current = null;
        setIsTesting(false);
      }
    };
  }, [editingEntity?.id, editingEntity?.type]);

  const [initialNotes, setInitialNotes] = React.useState<string | null>(null);

  // Focus trap
  const modalRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!editingEntity) return;
    const modal = modalRef.current;
    if (!modal) return;

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const getFocusable = () => Array.from(modal.querySelectorAll<HTMLElement>(focusableSelector));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    const timer = setTimeout(() => {
      const focusable = getFocusable();
      if (focusable.length > 0 && !focusable.includes(document.activeElement as HTMLElement)) {
        focusable[0].focus();
      }
    }, 50);

    modal.addEventListener('keydown', handleKeyDown);
    return () => {
      modal.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [editingEntity]);

  // Reset tab when editing entity changes
  React.useEffect(() => {
    setActiveRoleTab('general');
    setRoleNameError('');
    setActivePlayerTemplateTab('general');
    setActiveTeamTab('general');
    setTemplateNameError('');
    setTeamNameError('');
    setTeamIconSearch('');
    
    if (editingEntity?.type === 'playerNotes') {
        const player = useVttStore.getState().players.find(p => p.id === editingEntity.id);
        setInitialNotes(player?.privateNotes || '');
    } else if (editingEntity?.type === 'playerPublicNotes') {
        const player = useVttStore.getState().players.find(p => p.id === editingEntity.id);
        setInitialNotes(player?.publicNotes || '');
    } else {
        setInitialNotes(null);
    }
  }, [editingEntity?.id, editingEntity?.type]);

  if (!editingEntity) return null;

  const handleClose = () => {
    if (editingEntity.type === 'playerNotes') {
        const player = useVttStore.getState().players.find(p => p.id === editingEntity.id);
        if (player && (player.privateNotes || '') !== initialNotes) {
            addLog(`Notes privées modifiées pour ${player.name}`, 'note');
        }
    } else if (editingEntity.type === 'playerPublicNotes') {
        const player = useVttStore.getState().players.find(p => p.id === editingEntity.id);
        if (player && (player.publicNotes || '') !== initialNotes) {
            addLog(`Notes publiques modifiées pour ${player.name}`, 'note');
        }
    }
    setEditingEntity(null);
  };

  let entityTitle = '';
  let entityContent = null;

  if (editingEntity.type === 'playerTemplate') {
    const template = playerTemplates.find(p => p.id === editingEntity.id);
    if (!template) return null;

    const instanceCount = players.filter(pl => pl.name === template.name && pl.color === template.color).length;
    const selectedShape = template.shape || 'circle';

    const handleDuplicateTemplate = () => {
      let newName = `${template.name} (Copie)`;
      let counter = 1;
      while (playerTemplates.some(p => p.name === newName)) {
        newName = `${template.name} (Copie ${counter})`;
        counter++;
      }
      const { id, ...templateData } = template;
      useVttStore.getState().addPlayerTemplate({ ...templateData, name: newName });
    };

    const handleValidateTemplateName = (value: string) => {
      if (value.trim() && playerTemplates.some(p => p.id !== template.id && p.name.toLowerCase() === value.trim().toLowerCase())) {
        setTemplateNameError(`Un modèle nommé "${value.trim}" existe déjà.`);
      } else {
        setTemplateNameError('');
      }
      updatePlayerTemplate(template.id, { name: value });
    };

    const SHAPES: { value: string; label: string; svg: React.ReactNode }[] = [
      { value: 'circle', label: 'Rond', svg: <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="currentColor" /></svg> },
      { value: 'square', label: 'Carré', svg: <svg viewBox="0 0 40 40"><rect x="6" y="6" width="28" height="28" rx="2" fill="currentColor" /></svg> },
      { value: 'oval', label: 'Ovale', svg: <svg viewBox="0 0 40 40"><ellipse cx="20" cy="20" rx="16" ry="10" fill="currentColor" /></svg> },
      { value: 'triangle', label: 'Triangle', svg: <svg viewBox="0 0 40 40"><polygon points="20,4 36,36 4,36" fill="currentColor" /></svg> },
      { value: 'trapezoid', label: 'Trapèze', svg: <svg viewBox="0 0 40 40"><polygon points="12,8 28,8 36,32 4,32" fill="currentColor" /></svg> },
      { value: 'octagon', label: 'Octogone', svg: <svg viewBox="0 0 40 40"><polygon points="14,4 26,4 36,14 36,26 26,36 14,36 4,26 4,14" fill="currentColor" /></svg> },
      { value: 'star', label: 'Étoile', svg: <svg viewBox="0 0 40 40"><polygon points="20,2 25,14 38,14 27,22 31,36 20,28 9,36 13,22 2,14 15,14" fill="currentColor" /></svg> },
      { value: 'pentagon', label: 'Pentagone', svg: <svg viewBox="0 0 40 40"><polygon points="20,3 37,15 31,35 9,35 3,15" fill="currentColor" /></svg> },
      { value: 'hexagon', label: 'Hexagone', svg: <svg viewBox="0 0 40 40"><polygon points="20,3 36,12 36,28 20,37 4,28 4,12" fill="currentColor" /></svg> },
      { value: 'diamond', label: 'Diamant', svg: <svg viewBox="0 0 40 40"><polygon points="20,3 37,20 20,37 3,20" fill="currentColor" /></svg> },
      { value: 'shield', label: 'Bouclier', svg: <svg viewBox="0 0 40 40"><path d="M20,3 L36,10 L36,22 C36,30 28,36 20,38 C12,36 4,30 4,22 L4,10 Z" fill="currentColor" /></svg> },
      { value: 'cross', label: 'Croix', svg: <svg viewBox="0 0 40 40"><polygon points="14,4 26,4 26,14 36,14 36,26 26,26 26,36 14,36 14,26 4,26 4,14 14,14" fill="currentColor" /></svg> },
      { value: 'heart', label: 'Cœur', svg: <svg viewBox="0 0 40 40"><path d="M20,36 C12,28 4,22 4,14 C4,8 8,4 14,4 C17,4 19,6 20,8 C21,6 23,4 26,4 C32,4 36,8 36,14 C36,22 28,28 20,36Z" fill="currentColor" /></svg> },
      { value: 'crescent', label: 'Croissant', svg: <svg viewBox="0 0 40 40"><path d="M24,4 C14,4 6,12 6,22 C6,32 14,38 24,38 C18,34 14,28 14,22 C14,16 18,10 24,4Z" fill="currentColor" /></svg> },
      { value: 'werewolfCard', label: 'Loup-Garou', svg: <svg viewBox="0 0 40 40"><polygon points="14.4 14.4, 15.2 8.8, 17.6 4.0, 22.0 0.8, 24.4 3.2, 25.2 7.2, 24.8 11.2, 25.6 14.4, 31.2 15.2, 36.0 17.6, 39.2 22.0, 36.8 24.4, 32.8 25.2, 28.8 24.8, 25.6 25.6, 24.8 31.2, 22.4 36.0, 18.0 39.2, 15.6 36.8, 14.8 32.8, 15.2 28.8, 14.4 25.6, 8.8 24.8, 4.0 22.4, 0.8 18.0, 3.2 15.6, 7.2 14.8, 11.2 15.2" fill="currentColor" /></svg> },
    ];

    entityTitle = `Modifier Modèle: ${template.name}`;
    entityContent = (
      <div className="flex flex-col h-full w-full">
        {/* Header with duplicate button */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: template.color }}>
              {template.imageUrl ? <img src={template.imageUrl} className="w-full h-full rounded-full object-cover" alt="" /> : template.name.charAt(0)}
            </div>
            <div>
              <span className="text-sm font-medium">{template.name}</span>
              <span className="text-[10px] text-muted-foreground ml-2">×{instanceCount} instance{instanceCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <button
            onClick={handleDuplicateTemplate}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-muted hover:bg-accent transition-colors"
            title="Dupliquer ce modèle"
          >
            <icons.Copy size={12} /> Dupliquer
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-4 shrink-0">
          {(['general', 'appearance', 'preview'] as const).map(tab => (
            <button
              key={tab}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex-1 ${
                activePlayerTemplateTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActivePlayerTemplateTab(tab)}
            >
              {tab === 'general' ? 'Général' : tab === 'appearance' ? 'Apparence' : 'Aperçu'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
          {/* TAB: General */}
          {activePlayerTemplateTab === 'general' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium" htmlFor={`template-name-${template.id}`}>Nom</label>
                <input
                  id={`template-name-${template.id}`}
                  type="text"
                  value={template.name}
                  onChange={(e) => handleValidateTemplateName(e.target.value)}
                  className={`bg-input border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 ${templateNameError ? 'border-destructive focus:ring-destructive' : 'border-border focus:ring-ring'}`}
                />
                {templateNameError && <p className="text-[10px] text-destructive mt-1">{templateNameError}</p>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium" htmlFor={`template-role-${template.id}`}>Rôle par défaut</label>
                <select
                  id={`template-role-${template.id}`}
                  value={template.roleId || ''}
                  onChange={(e) => updatePlayerTemplate(template.id, { roleId: e.target.value || null })}
                  className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Aucun rôle</option>
                  {roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium" htmlFor={`template-team-${template.id}`}>Équipe par défaut</label>
                <select
                  id={`template-team-${template.id}`}
                  value={template.teamId || ''}
                  onChange={(e) => updatePlayerTemplate(template.id, { teamId: e.target.value || null })}
                  className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Aucune équipe</option>
                  {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-sm font-medium">Couleur</label>
                  <ColorPicker
                    color={template.color}
                    onChange={(c) => updatePlayerTemplate(template.id, { color: c })}
                    label="Couleur"
                    className="!w-10 !h-10"
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-sm font-medium" htmlFor={`template-size-${template.id}`}>Taille (px)</label>
                  <input
                    id={`template-size-${template.id}`}
                    type="number"
                    min={10}
                    max={200}
                    value={template.size}
                    onChange={(e) => updatePlayerTemplate(template.id, { size: Math.max(10, Math.min(200, parseInt(e.target.value) || 40)) })}
                    className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium" htmlFor={`template-desc-${template.id}`}>Description / Mémo MJ</label>
                <textarea
                  id={`template-desc-${template.id}`}
                  value={template.description || ''}
                  onChange={(e) => updatePlayerTemplate(template.id, { description: e.target.value })}
                  placeholder="Note pour le MJ : rôle dans la partie, comportement attendu..."
                  className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring min-h-[60px] resize-none"
                />
              </div>
            </div>
          )}

          {/* TAB: Appearance */}
          {activePlayerTemplateTab === 'appearance' && (
            <div className="flex flex-col gap-4">
              {/* Shape Grid */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Forme du pion</label>
                <div className="grid grid-cols-4 gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                  {SHAPES.map(shape => (
                    <button
                      key={shape.value}
                      onClick={() => updatePlayerTemplate(template.id, { shape: shape.value as any })}
                      className={`flex flex-col items-center gap-1 p-2 rounded-md border transition-all ${
                        selectedShape === shape.value
                          ? 'bg-primary/10 border-primary ring-1 ring-primary/30'
                          : 'bg-background/50 border-border/50 hover:bg-muted'
                      }`}
                      title={shape.label}
                    >
                      <div className="w-8 h-8" style={{ color: template.color }}>
                        {shape.svg}
                      </div>
                      <span className="text-[9px] font-medium text-muted-foreground">{shape.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Upload */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Image / Icône</label>
                <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) await handleImageFile(file, (url) => updatePlayerTemplate(template.id, { imageUrl: url }));
                    }}
                    className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={template.imageUrl || ''}
                    onChange={(e) => updatePlayerTemplate(template.id, { imageUrl: e.target.value })}
                    placeholder="Ou collez l'URL d'une image..."
                    className="bg-input border border-border rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  />

                  {template.imageUrl && (
                    <div className="flex items-center gap-3 mt-1 pt-2 border-t border-border/30">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 shadow-sm flex items-center justify-center" style={{ backgroundColor: template.color }}>
                        <img src={template.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col flex-1 gap-1">
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Style Smartphone</span>
                        <div className="flex items-center gap-2">
                          <select
                            value={template.smartphoneImageStyle || 'circle'}
                            onChange={(e) => updatePlayerTemplate(template.id, { smartphoneImageStyle: e.target.value as any })}
                            className="bg-background border border-border rounded px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-ring flex-1"
                          >
                            <option value="circle">Rond</option>
                            <option value="square">Carré</option>
                            <option value="original">Taille réelle</option>
                            <option value="background">Fond de carte</option>
                          </select>
                          <button
                            onClick={async () => {
                              if (template.imageUrl) await deleteFileFromStorage(template.imageUrl);
                              updatePlayerTemplate(template.id, { imageUrl: undefined });
                            }}
                            className="flex items-center justify-center p-1.5 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white rounded transition-colors"
                            title="Supprimer l'image"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: Preview */}
          {activePlayerTemplateTab === 'preview' && (
            <div className="flex flex-col gap-4">
              {/* Canvas Preview */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Aperçu sur le Canvas</label>
                <div className="flex items-center justify-center p-6 bg-muted/20 rounded-lg border border-border/50 min-h-[180px]">
                  <div className="relative">
                    <div
                      className="flex items-center justify-center text-white font-bold shadow-lg"
                      style={{
                        width: `${Math.max(48, template.size)}px`,
                        height: `${Math.max(48, template.size)}px`,
                        backgroundColor: template.color,
                        clipPath: selectedShape === 'circle' ? 'circle(50%)' :
                          selectedShape === 'square' ? 'inset(0)' :
                          selectedShape === 'oval' ? 'ellipse(50% 35% at 50% 50%)' :
                          selectedShape === 'triangle' ? 'polygon(50% 0%, 100% 100%, 0% 100%)' :
                          selectedShape === 'trapezoid' ? 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)' :
                          selectedShape === 'octagon' ? 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' :
                          selectedShape === 'star' ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' :
                          selectedShape === 'pentagon' ? 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' :
                          selectedShape === 'hexagon' ? 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' :
                          selectedShape === 'diamond' ? 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' :
                          selectedShape === 'shield' ? 'polygon(50% 0%, 100% 25%, 100% 65%, 50% 100%, 0% 65%, 0% 25%)' :
                          selectedShape === 'cross' ? 'polygon(35% 0%, 65% 0%, 65% 35%, 100% 35%, 100% 65%, 65% 65%, 65% 100%, 35% 100%, 35% 65%, 0% 65%, 0% 35%, 35% 35%)' :
                          selectedShape === 'heart' ? 'polygon(50% 15%, 65% 0%, 85% 0%, 100% 15%, 100% 40%, 85% 65%, 50% 100%, 15% 65%, 0% 40%, 0% 15%, 15% 0%, 35% 0%)' :
                          selectedShape === 'crescent' ? 'polygon(60% 0%, 40% 5%, 20% 15%, 10% 30%, 5% 50%, 10% 70%, 20% 85%, 40% 95%, 60% 100%, 45% 85%, 35% 70%, 30% 50%, 35% 30%, 45% 15%)' :
                          selectedShape === 'werewolfCard' ? 'polygon(36% 36%, 38% 22%, 44% 10%, 55% 2%, 61% 8%, 63% 18%, 62% 28%, 64% 36%, 78% 38%, 90% 44%, 98% 55%, 92% 61%, 82% 63%, 72% 62%, 64% 64%, 62% 78%, 56% 90%, 45% 98%, 39% 92%, 37% 82%, 38% 72%, 36% 64%, 22% 62%, 10% 56%, 2% 45%, 8% 39%, 18% 37%, 28% 38%)' :
                          'circle(50%)',
                      }}
                    >
                      {template.imageUrl && (
                        <img src={template.imageUrl} alt="" className="w-full h-full object-cover" style={{ borderRadius: selectedShape === 'circle' ? '50%' : selectedShape === 'square' ? '0' : '0' }} />
                      )}
                      {!template.imageUrl && (
                        <span style={{ fontSize: `${Math.max(14, template.size * 0.4)}px` }}>{template.name.charAt(0)}</span>
                      )}
                    </div>
                    {instanceCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center shadow">
                        {instanceCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Smartphone Preview */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-center flex items-center justify-center gap-2">
                  <icons.Smartphone size={14} className="text-primary" />
                  Aperçu Smartphone
                </label>
                <div className="relative mx-auto w-full max-w-[200px] aspect-[9/18] bg-[#09090b] rounded-[32px] border-[6px] border-[#18181b] shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/5">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-20 bg-[#18181b] rounded-b-xl z-20" />
                  <div className="flex-1 flex flex-col p-3 pt-8 overflow-hidden relative">
                    <div className="flex-1 flex flex-col items-center bg-[#18181b] rounded-xl border border-white/5 p-3 shadow-xl overflow-hidden relative">
                      {(() => {
                        const style = template.smartphoneImageStyle || 'circle';
                        return (
                          <>
                            {style === 'background' && template.imageUrl && (
                              <div className="absolute inset-0 z-0 opacity-40">
                                <img src={template.imageUrl} alt="" className="w-full h-full object-cover blur-sm brightness-50" />
                              </div>
                            )}
                            <div className="flex flex-col items-center gap-3 w-full z-10 py-2">
                              {style !== 'background' && (
                                <div
                                  className={`flex items-center justify-center border-3 border-[#09090b] bg-[#09090b] overflow-hidden shadow-lg ${
                                    style === 'square' ? 'w-16 h-16 rounded-xl' :
                                    style === 'original' ? 'max-w-[80%] rounded-lg' :
                                    'w-16 h-16 rounded-full'
                                  }`}
                                  style={{ borderColor: template.color }}
                                >
                                  {template.imageUrl ? (
                                    <img src={template.imageUrl} alt="" className={`w-full h-full ${style === 'original' ? 'object-contain' : 'object-cover'}`} />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: template.color }}>
                                      {template.name.charAt(0)}
                                    </div>
                                  )}
                                </div>
                              )}
                              <div className="text-center">
                                <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest">Joueur</span>
                                <h4 className="text-base font-black leading-none" style={{ color: template.color }}>{template.name}</h4>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-3 bg-muted/30 rounded-lg border border-border/50 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Forme</span>
                  <span className="font-medium capitalize">{selectedShape}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Taille</span>
                  <span className="font-medium">{template.size}px</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Instances</span>
                  <span className="font-medium">{instanceCount}</span>
                </div>
                {template.roleId && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Rôle</span>
                    <span className="font-medium">{roles.find(r => r.id === template.roleId)?.name || '—'}</span>
                  </div>
                )}
                {template.teamId && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Équipe</span>
                    <span className="font-medium">{teams.find(t => t.id === template.teamId)?.name || '—'}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } else if (editingEntity.type === 'player') {
    const player = players.find(p => p.id === editingEntity.id);
    if (!player) return null;

    entityTitle = `Modifier Joueur: ${player.name}`;
    entityContent = (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor={`player-name-${player.id}`}>Nom</label>
          <input
            id={`player-name-${player.id}`}
            type="text"
            value={player.name}
            onChange={(e) => updatePlayer(player.id, { name: e.target.value })}
            className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-sm font-medium">Couleur</label>
            <div className="flex items-center gap-3">
              <ColorPicker
                color={player.color}
                onChange={(c) => updatePlayer(player.id, { color: c })}
                label="Couleur"
                className="!w-10 !h-10"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-sm font-medium" htmlFor={`player-size-${player.id}`}>Taille (Rayon px)</label>
            <input
              id={`player-size-${player.id}`}
              type="number"
              value={player.size}
              onChange={(e) => updatePlayer(player.id, { size: Math.max(10, parseInt(e.target.value) || 40) })}
              className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor={`player-shape-${player.id}`}>Forme du pion</label>
          <select
            id={`player-shape-${player.id}`}
            value={player.shape || ''}
            onChange={(e) => updatePlayer(player.id, { shape: (e.target.value || undefined) as any })}
            className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Utiliser le défaut</option>
            <option value="circle">Rond</option>
            <option value="square">Carré</option>
            <option value="oval">Ovale</option>
            <option value="triangle">Triangle</option>
            <option value="trapezoid">Trapèze</option>
            <option value="octagon">Octogone</option>
            <option value="star">Étoile</option>
            <option value="pentagon">Pentagone</option>
            <option value="hexagon">Hexagone</option>
            <option value="diamond">Diamant</option>
            <option value="shield">Bouclier</option>
            <option value="cross">Croix</option>
            <option value="heart">Cœur</option>
            <option value="crescent">Croissant</option>
            <option value="werewolfCard">Carte Loup-Garou</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor={`player-image-file-${player.id}`}>Image / Icône</label>
          <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex flex-col gap-2">
              <input
                id={`player-image-file-${player.id}`}
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    await handleImageFile(file, (url) => updatePlayer(player.id, { imageUrl: url }));
                  }
                }}
                className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
              <label className="sr-only" htmlFor={`player-image-url-${player.id}`}>URL de l'image (Joueur)</label>
              <input
                id={`player-image-url-${player.id}`}
                type="text"
                value={player.imageUrl || ''}
                onChange={(e) => updatePlayer(player.id, { imageUrl: e.target.value })}
                placeholder="Ou collez l'URL d'une image ici..."
                className="bg-input border border-border rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {player.imageUrl && (
              <div className="flex items-center gap-3 mt-1 pt-2 border-t border-border/30">
                <img src={player.imageUrl} alt="Preview" className="w-12 h-12 rounded-full object-cover border-2 border-primary/20 shadow-sm" />
                <div className="flex flex-col flex-1">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Aperçu & Style Smartphone</span>
                  <div className="flex items-center gap-2">
                    <label className="sr-only" htmlFor={`player-image-style-${player.id}`}>Style Smartphone</label>
                    <select
                      id={`player-image-style-${player.id}`}
                      value={player.smartphoneImageStyle || 'circle'}
                      onChange={(e) => updatePlayer(player.id, { smartphoneImageStyle: e.target.value as any })}
                      className="bg-background border border-border rounded px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-ring flex-1"
                    >
                      <option value="circle">Rond</option>
                      <option value="square">Carré</option>
                      <option value="original">Taille réelle</option>
                      <option value="background">Fond de carte</option>
                    </select>
                    <button
                      onClick={async () => {
                        if (player.imageUrl) await deleteFileFromStorage(player.imageUrl);
                        updatePlayer(player.id, { imageUrl: undefined });
                      }}
                      className="flex items-center justify-center p-1.5 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white rounded transition-colors"
                      title="Supprimer l'image"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor={`player-role-${player.id}`}>Rôle</label>
          <select
            id={`player-role-${player.id}`}
            value={player.roleId || ''}
            onChange={(e) => updatePlayer(player.id, { roleId: e.target.value || null })}
            className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Aucun rôle</option>
            {roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor={`player-team-${player.id}`}>Équipe</label>
          <select
            id={`player-team-${player.id}`}
            value={player.teamId || ''}
            onChange={(e) => updatePlayer(player.id, { teamId: e.target.value || null })}
            className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Aucune équipe</option>
            {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        {/* Persistent Stats */}
        <div className="grid grid-cols-3 gap-3 border-t border-border pt-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase" htmlFor={`player-lives-${player.id}`}>Vies Actuelles</label>
            <input
              id={`player-lives-${player.id}`}
              type="number"
              value={player.lives ?? roles.find(r => r.id === player.roleId)?.lives ?? 0}
              onChange={(e) => updatePlayer(player.id, { lives: parseInt(e.target.value) || 0 })}
              className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase" htmlFor={`player-points-${player.id}`}>Points</label>
            <input
              id={`player-points-${player.id}`}
              type="number"
              value={player.points || 0}
              onChange={(e) => updatePlayer(player.id, { points: parseInt(e.target.value) || 0 })}
              className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase" htmlFor={`player-votes-${player.id}`}>Votes</label>
            <input
              id={`player-votes-${player.id}`}
              type="number"
              value={player.votes || 0}
              onChange={(e) => updatePlayer(player.id, { votes: parseInt(e.target.value) || 0 })}
              className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="dead-player"
              checked={player.isDead}
              onChange={(e) => updatePlayer(player.id, { isDead: e.target.checked })}
              className="w-4 h-4 rounded border-border text-primary focus:ring-ring cursor-pointer"
            />
            <label htmlFor="dead-player" className="text-sm font-medium text-destructive whitespace-nowrap cursor-pointer">
              Joueur Mort
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="sleeping-player"
              checked={player.isSleeping || false}
              onChange={(e) => updatePlayer(player.id, { isSleeping: e.target.checked })}
              className="w-4 h-4 rounded border-border text-primary focus:ring-ring cursor-pointer"
            />
            <label htmlFor="sleeping-player" className="text-sm font-medium text-indigo-400 whitespace-nowrap cursor-pointer">
              Joueur Dort
            </label>
          </div>
        </div>
      </div>
    );
  } else if (editingEntity.type === 'role') {
    const role = roles.find(r => r.id === editingEntity.id);
    if (!role) return null;

    const playerCount = players.filter(p => p.roleId === role.id).length;
    const team = teams.find(t => t.id === role.teamId);

    const handleDuplicateRole = () => {
      let newName = `${role.name} (Copie)`;
      let counter = 1;
      while (roles.some(r => r.name === newName)) {
        newName = `${role.name} (Copie ${counter})`;
        counter++;
      }
      const { id, ...roleData } = role;
      useVttStore.getState().addRole({ ...roleData, name: newName, isSelectableForDistribution: false });
    };

    const handleValidateRoleName = (value: string) => {
      if (value.trim() && roles.some(r => r.id !== role.id && r.name.toLowerCase() === value.trim().toLowerCase())) {
        setRoleNameError(`Un rôle nommé "${value.trim}" existe déjà.`);
      } else {
        setRoleNameError('');
      }
      updateRole(role.id, { name: value });
    };

    const toggleRoleTag = (tagId: string) => {
      const currentTags = role.tags || [];
      const hasTag = currentTags.some(t => t.id === tagId);
      const newTags = hasTag
        ? currentTags.filter(t => t.id !== tagId)
        : [...currentTags, tags.find(t => t.id === tagId)!].filter(Boolean);
      updateRole(role.id, { tags: newTags });
    };

    const filteredTags = tagSearchQuery.trim()
      ? tags.filter(t => t.name.toLowerCase().includes(tagSearchQuery.toLowerCase()))
      : tags;

    const roleTagIds = new Set((role.tags || []).map(t => t.id));

    entityTitle = `Modifier Rôle: ${role.name}`;
    entityContent = (
      <div className="flex flex-col h-full w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm" style={{ backgroundColor: role.color }}>
              {role.imageUrl ? (
                <img src={role.imageUrl} className="w-full h-full rounded-full object-cover" alt="" />
              ) : (
                role.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <span className="text-sm font-medium">{role.name}</span>
              <span className="text-[10px] text-muted-foreground ml-2">×{playerCount} joueur{playerCount !== 1 ? 's' : ''} • {role.isUnique ? 'Unique' : `${role.distributionQuantity ?? 1} ex.`}</span>
            </div>
          </div>
          <button
            onClick={handleDuplicateRole}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-muted hover:bg-accent transition-colors"
            title="Dupliquer ce rôle"
          >
            <icons.Copy size={12} /> Dupliquer
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-4 shrink-0">
          {(['general', 'distribution', 'appearance', 'tags'] as const).map(tab => (
            <button
              key={tab}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors flex-1 ${
                activeRoleTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveRoleTab(tab)}
            >
              {tab === 'general' ? 'Général' : tab === 'distribution' ? 'Distribution' : tab === 'appearance' ? 'Apparence' : 'Tags'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
          {/* TAB: General */}
          {activeRoleTab === 'general' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium" htmlFor={`role-name-${role.id}`}>Nom</label>
                <input
                  id={`role-name-${role.id}`}
                  type="text"
                  value={role.name}
                  onChange={(e) => handleValidateRoleName(e.target.value)}
                  className={`bg-input border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 ${roleNameError ? 'border-destructive focus:ring-destructive' : 'border-border focus:ring-ring'}`}
                />
                {roleNameError && <p className="text-[10px] text-destructive mt-1">{roleNameError}</p>}
              </div>

              <div className="flex gap-4 items-end">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-sm font-medium" htmlFor={`role-team-${role.id}`}>Équipe</label>
                  <select
                    id={`role-team-${role.id}`}
                    value={role.teamId || ''}
                    onChange={(e) => updateRole(role.id, { teamId: e.target.value || null })}
                    className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">-- Aucune --</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <label className="text-sm font-medium">Couleur</label>
                  <ColorPicker
                    color={role.color}
                    onChange={(c) => updateRole(role.id, { color: c })}
                    label="Couleur"
                    className="!w-10 !h-10"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium" htmlFor={`role-lives-${role.id}`}>Vies</label>
                <input
                  id={`role-lives-${role.id}`}
                  type="number"
                  min={0}
                  value={role.lives}
                  onChange={(e) => updateRole(role.id, { lives: parseInt(e.target.value) || 0 })}
                  className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="unique-role-edit"
                  checked={role.isUnique}
                  onChange={(e) => updateRole(role.id, { isUnique: e.target.checked })}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-ring cursor-pointer"
                />
                <label htmlFor="unique-role-edit" className="text-sm font-medium cursor-pointer">
                  Rôle Unique (un seul joueur peut l'avoir)
                </label>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium" htmlFor={`role-desc-${role.id}`}>Description</label>
                <textarea
                  id={`role-desc-${role.id}`}
                  value={role.description || ''}
                  onChange={(e) => updateRole(role.id, { description: e.target.value })}
                  placeholder="Ex: Si tué la nuit, ressuscite le lendemain..."
                  className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring min-h-[60px] resize-none"
                />
              </div>
            </div>
          )}

          {/* TAB: Distribution */}
          {activeRoleTab === 'distribution' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                <input
                  type="checkbox"
                  id="role-in-distribution"
                  checked={role.isSelectableForDistribution ?? false}
                  onChange={(e) => updateRole(role.id, { isSelectableForDistribution: e.target.checked })}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-ring cursor-pointer"
                />
                <label htmlFor="role-in-distribution" className="text-sm font-medium cursor-pointer">
                  Inclure dans la distribution automatique
                </label>
              </div>

              {!role.isSelectableForDistribution && (
                <p className="text-xs text-amber-500 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                  Ce rôle ne sera pas proposé lors de la distribution automatique.
                </p>
              )}

              {!role.isUnique && (
                <div className="flex flex-col gap-3 p-3 bg-muted/20 border-l-2 border-primary/30 rounded-r-lg">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest min-w-[80px]" htmlFor={`role-default-count-${role.id}`}>Par défaut</label>
                    <input
                      id={`role-default-count-${role.id}`}
                      type="number"
                      min="0"
                      value={role.distributionQuantity ?? 1}
                      onChange={(e) => updateRole(role.id, { distributionQuantity: parseInt(e.target.value) || 0 })}
                      className="w-20 bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-center font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest min-w-[80px]" htmlFor={`role-min-count-${role.id}`}>Minimum</label>
                    <input
                      id={`role-min-count-${role.id}`}
                      type="number"
                      min="0"
                      value={role.minCount ?? 0}
                      onChange={(e) => updateRole(role.id, { minCount: parseInt(e.target.value) || 0 })}
                      className="w-20 bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-center font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest min-w-[80px]" htmlFor={`role-max-count-${role.id}`}>Maximum</label>
                    <input
                      id={`role-max-count-${role.id}`}
                      type="number"
                      min="0"
                      value={role.maxCount ?? 99}
                      onChange={(e) => updateRole(role.id, { maxCount: parseInt(e.target.value) || 0 })}
                      className="w-20 bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-center font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-2 pt-2 border-t border-border/30">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isFiller-edit"
                        checked={role.isFiller || false}
                        onChange={(e) => updateRole(role.id, { isFiller: e.target.checked })}
                        className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-ring cursor-pointer"
                      />
                      <label htmlFor="isFiller-edit" className="text-xs font-medium cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                        Compléter automatiquement si pas assez de joueurs
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isMinMandatory-edit"
                        checked={role.isMinMandatory || false}
                        onChange={(e) => updateRole(role.id, { isMinMandatory: e.target.checked })}
                        className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-ring cursor-pointer"
                      />
                      <label htmlFor="isMinMandatory-edit" className="text-xs font-medium cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                        Minimum obligatoire
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {role.isUnique && (
                <p className="text-xs text-muted-foreground italic p-3 bg-muted/20 rounded-lg">
                  Les paramètres de distribution ne s'appliquent pas aux rôles uniques.
                </p>
              )}
            </div>
          )}

          {/* TAB: Appearance */}
          {activeRoleTab === 'appearance' && (
            <div className="grid grid-cols-2 gap-6 h-full min-h-[450px]">
              {/* Left Column: Settings */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">Image du rôle</label>
                  <div className="flex flex-col gap-3 p-4 bg-muted/30 rounded-xl border border-border/50">
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) await handleImageFile(file, (url) => updateRole(role.id, { imageUrl: url }));
                        }}
                        className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={role.imageUrl || ''}
                          onChange={(e) => updateRole(role.id, { imageUrl: e.target.value })}
                          placeholder="Ou collez l'URL d'une image..."
                          className="bg-input border border-border rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring flex-1"
                        />
                        {role.imageUrl && (
                          <button
                            onClick={async () => {
                              if (role.imageUrl) await deleteFileFromStorage(role.imageUrl);
                              updateRole(role.id, { imageUrl: undefined });
                            }}
                            className="flex items-center justify-center p-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white rounded-md transition-colors"
                            title="Supprimer l'image"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border/30 flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Style d'affichage</label>
                      <select
                        value={role.smartphoneImageStyle || 'circle'}
                        onChange={(e) => updateRole(role.id, { smartphoneImageStyle: e.target.value as any })}
                        className="bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="circle">Rond</option>
                        <option value="square">Carré</option>
                        <option value="original">Taille réelle</option>
                        <option value="background">Fond de carte</option>
                      </select>
                      <p className="text-[10px] text-muted-foreground italic">
                        Définit comment l'image sera affichée sur l'écran du joueur.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Smartphone Preview */}
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-center flex items-center justify-center gap-2">
                  <icons.Smartphone size={14} className="text-primary" />
                  Aperçu Smartphone
                </label>

                <div className="relative mx-auto w-full max-w-[240px] aspect-[9/18] bg-[#09090b] rounded-[40px] border-[8px] border-[#18181b] shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/5">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-24 bg-[#18181b] rounded-b-2xl z-20" />
                  <div className="flex-1 flex flex-col p-4 pt-10 overflow-hidden relative">
                    <div className="flex flex-col gap-0.5 mb-4 opacity-50">
                      <div className="h-1.5 w-12 bg-zinc-800 rounded-full" />
                      <div className="h-3 w-20 bg-zinc-700 rounded-full" />
                    </div>

                    {(() => {
                      const effectiveStyle = role.smartphoneImageStyle || 'circle';
                      return (
                        <div className="flex-1 flex flex-col items-center bg-[#18181b] rounded-2xl border border-white/5 p-4 shadow-xl overflow-hidden relative">
                          {team && (
                            <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: team.color }} />
                          )}

                          {effectiveStyle === 'background' && role.imageUrl && (
                            <div className="absolute inset-0 z-0 opacity-40">
                              <img src={role.imageUrl} alt="" className="w-full h-full object-cover blur-sm brightness-50" />
                            </div>
                          )}

                          <div className="flex flex-col items-center gap-4 w-full z-10 py-2">
                            {effectiveStyle !== 'background' && (
                              <div
                                className={`flex items-center justify-center border-4 border-[#09090b] bg-[#09090b] overflow-hidden shadow-lg transition-all ${
                                  effectiveStyle === 'square' ? 'w-24 h-24 rounded-2xl' :
                                  effectiveStyle === 'original' ? 'max-w-full rounded-lg' :
                                  'w-24 h-24 rounded-full'
                                }`}
                                style={{ borderColor: role.color }}
                              >
                                {role.imageUrl ? (
                                  <img src={role.imageUrl} alt="" className={`w-full h-full ${effectiveStyle === 'original' ? 'object-contain' : 'object-cover'}`} />
                                ) : (
                                  <icons.UserCircle2 size={40} className="text-zinc-700" />
                                )}
                              </div>
                            )}

                            <div className="text-center flex flex-col gap-1">
                              <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Votre Rôle</span>
                              <h4 className="text-lg font-black leading-none" style={{ color: role.color || '#fff' }}>
                                {role.name || 'Nom du Rôle'}
                              </h4>
                              {team && (
                                <div className="inline-flex items-center justify-center px-2 py-0.5 rounded-full mt-1 border border-white/5 bg-black/40">
                                  <span className="text-[8px] font-bold" style={{ color: team.color }}>{team.name}</span>
                                </div>
                              )}
                            </div>

                            <div className="mt-2 pt-2 border-t border-white/5 w-full">
                              <p className="text-[9px] text-zinc-500 italic text-center leading-relaxed line-clamp-3">
                                {role.description || 'La description du rôle apparaîtra ici sur le smartphone du joueur...'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="mt-auto pt-4 flex justify-around opacity-20">
                      <div className="h-6 w-6 rounded-full bg-zinc-800" />
                      <div className="h-6 w-6 rounded-full bg-zinc-800" />
                      <div className="h-6 w-6 rounded-full bg-zinc-800" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Tags & Members */}
          {activeRoleTab === 'tags' && (
            <div className="flex flex-col gap-4">
              {/* Tags Section */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Tags attachés</label>
                  <span className="text-[10px] text-muted-foreground">{role.tags?.length || 0} sélectionné(s)</span>
                </div>

                {role.tags && role.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-muted/20 rounded-md border border-border/50">
                    {role.tags.map(tag => {
                      const category = tagCategories.find(c => c.id === tag.categoryId);
                      return (
                        <button
                          key={tag.id}
                          onClick={() => toggleRoleTag(tag.id)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors hover:opacity-80"
                          style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color, color: tag.color }}
                        >
                          {tag.name}
                          <icons.X size={10} />
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="relative">
                  <icons.Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Rechercher un tag..."
                    value={tagSearchQuery}
                    onChange={(e) => setTagSearchQuery(e.target.value)}
                    className="w-full bg-input border border-border rounded-md pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                {tags.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Aucun tag défini dans le jeu.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-muted/10 rounded-md border border-border/30">
                    {filteredTags.map(tag => {
                      const isSelected = roleTagIds.has(tag.id);
                      const category = tagCategories.find(c => c.id === tag.categoryId);
                      return (
                        <button
                          key={tag.id}
                          onClick={() => toggleRoleTag(tag.id)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all ${
                            isSelected
                              ? 'ring-1 ring-offset-1'
                              : 'opacity-60 hover:opacity-100'
                          }`}
                          style={{
                            backgroundColor: isSelected ? `${tag.color}30` : 'transparent',
                            borderColor: tag.color,
                            color: tag.color,
                          }}
                        >
                          {isSelected && <icons.Check size={10} />}
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Members Section */}
              <div className="flex flex-col gap-2 pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Joueurs avec ce rôle</h5>
                  <span className="text-[10px] text-muted-foreground">{playerCount}</span>
                </div>

                {playerCount === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Aucun joueur n'a ce rôle actuellement.</p>
                ) : (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {players.filter(p => p.roleId === role.id).map(player => (
                      <div key={player.id} className="flex items-center gap-2 p-1.5 bg-muted/20 rounded text-xs">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: player.color }} />
                        <span className="flex-1 truncate">{player.name}</span>
                        {player.isDead && <span className="text-[9px] text-destructive">Mort</span>}
                        {player.isSleeping && <span className="text-[9px] text-indigo-400">Dort</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } else if (editingEntity.type === 'team') {
    const team = teams.find(t => t.id === editingEntity.id);
    if (!team) return null;

    const roleCount = roles.filter(r => r.teamId === team.id).length;
    const playerCount = players.filter(p => p.teamId === team.id).length;
    const templateCount = playerTemplates.filter(pt => pt.teamId === team.id).length;
    const TeamIconComponent = (icons[team.icon as keyof typeof icons] || icons.Users) as React.ComponentType<any>;

    const handleDuplicateTeam = () => {
      let newName = `${team.name} (Copie)`;
      let counter = 1;
      while (teams.some(t => t.name === newName)) {
        newName = `${team.name} (Copie ${counter})`;
        counter++;
      }
      const { id, ...teamData } = team;
      useVttStore.getState().addTeam({ ...teamData, name: newName });
    };

    const handleValidateTeamName = (value: string) => {
      if (value.trim() && teams.some(t => t.id !== team.id && t.name.toLowerCase() === value.trim().toLowerCase())) {
        setTeamNameError(`Une équipe nommée "${value.trim}" existe déjà.`);
      } else {
        setTeamNameError('');
      }
      updateTeam(team.id, { name: value });
    };

    const filteredIcons = teamIconSearch.trim()
      ? TEAM_ICONS.filter(name => name.toLowerCase().includes(teamIconSearch.toLowerCase()))
      : TEAM_ICONS;

    entityTitle = `Modifier Équipe: ${team.name}`;
    entityContent = (
      <div className="flex flex-col h-full w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: team.color }}>
              {team.imageUrl ? (
                <img src={team.imageUrl} className="w-full h-full rounded-full object-cover" alt="" />
              ) : (
                <TeamIconComponent size={16} />
              )}
            </div>
            <div>
              <span className="text-sm font-medium">{team.name}</span>
              <span className="text-[10px] text-muted-foreground ml-2">{roleCount} rôles • {playerCount} joueurs</span>
            </div>
          </div>
          <button
            onClick={handleDuplicateTeam}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-muted hover:bg-accent transition-colors"
            title="Dupliquer cette équipe"
          >
            <icons.Copy size={12} /> Dupliquer
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-4 shrink-0">
          {(['general', 'appearance', 'members'] as const).map(tab => (
            <button
              key={tab}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex-1 ${
                activeTeamTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTeamTab(tab)}
            >
              {tab === 'general' ? 'Général' : tab === 'appearance' ? 'Apparence' : 'Membres'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
          {/* TAB: General */}
          {activeTeamTab === 'general' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium" htmlFor={`team-name-${team.id}`}>Nom de l'équipe</label>
                <input
                  id={`team-name-${team.id}`}
                  type="text"
                  value={team.name}
                  onChange={(e) => handleValidateTeamName(e.target.value)}
                  className={`bg-input border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 ${teamNameError ? 'border-destructive focus:ring-destructive' : 'border-border focus:ring-ring'}`}
                />
                {teamNameError && <p className="text-[10px] text-destructive mt-1">{teamNameError}</p>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium" htmlFor={`team-desc-${team.id}`}>Description / Mémo</label>
                <textarea
                  id={`team-desc-${team.id}`}
                  value={team.description || ''}
                  onChange={(e) => updateTeam(team.id, { description: e.target.value })}
                  placeholder="Objectifs, notes, stratégie..."
                  className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring min-h-[60px] resize-none"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-sm font-medium">Couleur</label>
                  <ColorPicker
                    color={team.color}
                    onChange={(c) => updateTeam(team.id, { color: c })}
                    label="Couleur"
                    className="!w-10 !h-10"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Icône</label>
                <div className="relative">
                  <icons.Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Rechercher une icône..."
                    value={teamIconSearch}
                    onChange={(e) => setTeamIconSearch(e.target.value)}
                    className="w-full bg-input border border-border rounded-md pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring mb-2"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 bg-input border border-border rounded-md p-2 max-h-40 overflow-y-auto">
                  {filteredIcons.length === 0 ? (
                    <p className="text-xs text-muted-foreground w-full text-center py-2">Aucune icône trouvée</p>
                  ) : (
                    filteredIcons.map((iconName: string) => {
                      const IconComponent = (icons[iconName as keyof typeof icons] || icons.Users) as React.ComponentType<any>;
                      if (!IconComponent) return null;
                      return (
                        <button
                          key={iconName}
                          onClick={() => updateTeam(team.id, { icon: iconName })}
                          className={`p-2 rounded-md transition-colors flex items-center justify-center ${
                            team.icon === iconName
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'
                          }`}
                          title={iconName}
                        >
                          <IconComponent size={18} />
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: Appearance */}
          {activeTeamTab === 'appearance' && (
            <div className="flex flex-col gap-4">
              {/* Preview */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Aperçu</label>
                <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-lg border border-border/50">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg" style={{ backgroundColor: team.color }}>
                    {team.imageUrl ? (
                      <img src={team.imageUrl} className="w-full h-full rounded-full object-cover" alt="" />
                    ) : (
                      <TeamIconComponent size={32} />
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold" style={{ color: team.color }}>{team.name}</h4>
                    <p className="text-xs text-muted-foreground">{roleCount} rôles • {playerCount} joueurs placés</p>
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Image de l'équipe</label>
                <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) await handleImageFile(file, (url) => updateTeam(team.id, { imageUrl: url }));
                    }}
                    className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={team.imageUrl || ''}
                    onChange={(e) => updateTeam(team.id, { imageUrl: e.target.value })}
                    placeholder="Ou collez l'URL d'une image..."
                    className="bg-input border border-border rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  />

                  {team.imageUrl && (
                    <div className="flex items-center gap-3 mt-1 pt-2 border-t border-border/30">
                      <img src={team.imageUrl} alt="Preview" className="w-12 h-12 rounded-lg object-cover border-2 border-primary/20 shadow-sm" />
                      <button
                        onClick={async () => {
                          if (team.imageUrl) await deleteFileFromStorage(team.imageUrl);
                          updateTeam(team.id, { imageUrl: undefined });
                        }}
                        className="flex items-center justify-center p-1.5 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white rounded transition-colors"
                        title="Supprimer l'image"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: Members */}
          {activeTeamTab === 'members' && (
            <div className="flex flex-col gap-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-muted/30 rounded-md p-2 text-center">
                  <div className="text-lg font-bold">{roleCount}</div>
                  <div className="text-[10px] text-muted-foreground">Rôles</div>
                </div>
                <div className="bg-muted/30 rounded-md p-2 text-center">
                  <div className="text-lg font-bold">{playerCount}</div>
                  <div className="text-[10px] text-muted-foreground">Joueurs</div>
                </div>
                <div className="bg-muted/30 rounded-md p-2 text-center">
                  <div className="text-lg font-bold">{templateCount}</div>
                  <div className="text-[10px] text-muted-foreground">Modèles</div>
                </div>
              </div>

              {/* Roles */}
              <div className="flex flex-col gap-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rôles de l'équipe</h5>
                {roleCount === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Aucun rôle assigné à cette équipe.</p>
                ) : (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {roles.filter(r => r.teamId === team.id).map(role => (
                      <div key={role.id} className="flex items-center gap-2 p-1.5 bg-muted/20 rounded text-xs">
                        <div className="w-3 h-3 rounded shrink-0" style={{ backgroundColor: role.color }} />
                        <span className="flex-1 truncate">{role.name}</span>
                        <span className="text-[9px] text-muted-foreground">{role.isUnique ? 'Unique' : 'Multiple'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Players */}
              <div className="flex flex-col gap-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Joueurs placés</h5>
                {playerCount === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Aucun joueur placé pour cette équipe.</p>
                ) : (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {players.filter(p => p.teamId === team.id).map(player => (
                      <div key={player.id} className="flex items-center gap-2 p-1.5 bg-muted/20 rounded text-xs">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: player.color }} />
                        <span className="flex-1 truncate">{player.name}</span>
                        {player.isDead && <span className="text-[9px] text-destructive">Mort</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } else if (editingEntity.type === 'tagCategory') {
    const category = tagCategories.find(c => c.id === editingEntity.id);
    if (!category) return null;

    entityTitle = `Modifier Catégorie: ${category.name}`;
    entityContent = (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor={`tag-category-name-${category.id}`}>Nom de la catégorie</label>
          <input
            id={`tag-category-name-${category.id}`}
            type="text"
            value={category.name}
            onChange={(e) => updateTagCategory(category.id, { name: e.target.value })}
            className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex flex-col gap-1 mt-2">
          <label className="text-sm font-medium">Icône</label>
          <div className="flex flex-wrap gap-1 bg-input border border-border rounded-md p-2 max-h-32 overflow-y-auto custom-scrollbar">
            {TAG_ICONS.map((iconName: string) => {
              const IconComponent = (icons as any)[iconName];
              if (!IconComponent) return null;
              return (
                <button
                  key={iconName}
                  onClick={() => updateTagCategory(category.id, { icon: iconName })}
                  className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${
                    category.icon === iconName
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'
                  }`}
                  title={iconName}
                >
                  <IconComponent size={16} />
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Couleur</label>
          <ColorPicker
            color={category.color}
            onChange={(c) => updateTagCategory(category.id, { color: c })}
            label="Couleur"
            className="!w-10 !h-10"
          />
        </div>
      </div>
    );
  } else if (editingEntity.type === 'tagModel') {
    const tag = tags.find(t => t.id === editingEntity.id);
    if (!tag) return null;
    entityTitle = `Modifier Tag: ${tag.name}`;
    entityContent = <TagModelForm tagId={editingEntity.id} onClose={handleClose} />;
  } else if (editingEntity.type === 'tagInstance') {
    entityTitle = (() => {
      if (editingEntity.parentId) {
        const p = players.find(pl => pl.id === editingEntity.parentId);
        if (!p) return '';
        const t = p.tags.find(tg => tg.instanceId === editingEntity.id);
        return t ? `Modifier Tag de ${p.name}: ${t.name}` : '';
      }
      const m = markers.find(mk => mk.tag.instanceId === editingEntity.id);
      return m ? `Modifier Marqueur: ${m.tag.name}` : '';
    })();
    entityContent = <TagInstanceForm instanceId={editingEntity.id} parentId={editingEntity.parentId} onClose={handleClose} />;
  } else if (editingEntity.type === 'playerNotes') {
    const player = players.find(p => p.id === editingEntity.id);
    if (!player) return null;

    entityTitle = `Notes privées: ${player.name}`;
    entityContent = (
      <div className="flex flex-col gap-4 min-h-[300px]">
        <div className="flex flex-col gap-2 h-full flex-1">
          <label className="text-sm font-medium text-muted-foreground" htmlFor={`player-private-notes-${player.id}`}>Ces notes sont visibles uniquement par vous (MJ)</label>
          <textarea
            id={`player-private-notes-${player.id}`}
            value={player.privateNotes || ''}
            onChange={(e) => updatePlayer(player.id, { privateNotes: e.target.value })}
            placeholder="Ajouter des notes secrètes sur ce joueur..."
            className="flex-1 min-h-[250px] bg-input border border-border rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none custom-scrollbar"
            autoFocus
          />
        </div>
      </div>
    );
  } else if (editingEntity.type === 'playerPublicNotes') {
    const player = players.find(p => p.id === editingEntity.id);
    if (!player) return null;

    entityTitle = `Notes publiques: ${player.name}`;
    entityContent = (
      <div className="flex flex-col gap-4 min-h-[300px]">
        <div className="flex flex-col gap-2 h-full flex-1">
          <label className="sr-only" htmlFor={`player-public-notes-${player.id}`}>Notes publiques</label>
          <textarea
            id={`player-public-notes-${player.id}`}
            value={player.publicNotes || ''}
            onChange={(e) => updatePlayer(player.id, {
              publicNotes: e.target.value,
              publicNotesTimestamp: Date.now()
            })}
            placeholder="Ajouter des notes publiques sur ce joueur..."
            className="flex-1 min-h-[200px] bg-input border border-border rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none custom-scrollbar"
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-2 mt-4">
          <label className="text-sm font-medium flex items-center gap-2">
            <input
              type="checkbox"
              checked={player.publicNotesSendToPlayer !== false} // Default to true
              onChange={(e) => updatePlayer(player.id, { publicNotesSendToPlayer: e.target.checked })}
              className="rounded border-border bg-input"
            />
            Envoyer au joueur (sur smartphone)
          </label>
          <label className="text-sm font-medium flex items-center gap-2">
            <input
              type="checkbox"
              checked={player.publicNotesNoticeBoard || false}
              onChange={(e) => updatePlayer(player.id, { publicNotesNoticeBoard: e.target.checked })}
              className="rounded border-border bg-input"
            />
            Panneau d'affichage (smartphone)
          </label>
        </div>
      </div>
    );
  } else if (editingEntity.type === 'soundButton') {
    const index = parseInt(editingEntity.id as string);
    const btn = soundboard.buttons.find(b => b.index === index) || { index, name: '', audioUrl: '', isOneShot: true, color: '#3b82f6', icon: 'Music' };

    entityTitle = `Paramètres du Son`;
    entityContent = (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor={`sound-name-${index}`}>Nom du son</label>
          <input
            id={`sound-name-${index}`}
            type="text"
            value={btn.name}
            onChange={(e) => updateSoundButton(index, { name: e.target.value })}
            className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder={`Son ${index + 1}`}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Raccourci clavier</label>
          <div className="flex items-center gap-2">
            <div
              onClick={() => { setCapturingShortcut(true); setCapturingShortcutIndex(index); }}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md border text-sm font-bold transition-all cursor-pointer ${
                capturingShortcut && capturingShortcutIndex === index
                  ? 'border-pink-500 bg-pink-500/10 text-pink-400 animate-pulse'
                  : btn.shortcut
                    ? 'border-border bg-muted text-foreground'
                    : 'border-dashed border-border text-muted-foreground hover:border-pink-500/50'
              }`}
            >
              {capturingShortcut && capturingShortcutIndex === index ? (
                <><Keyboard size={14} /> Appuyez sur une touche...</>
              ) : btn.shortcut ? (
                <><Keyboard size={14} /> Touche : <span className="text-lg font-black tracking-widest uppercase">{btn.shortcut}</span></>
              ) : (
                <><Keyboard size={14} /> Cliquez pour assigner une touche</>
              )}
            </div>
            {btn.shortcut && (
              <button
                onClick={() => updateSoundButton(index, { shortcut: undefined })}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                title="Supprimer le raccourci"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Catégorie</label>
          <input
            type="text"
            value={btn.category || ''}
            onChange={(e) => updateSoundButton(index, { category: e.target.value || undefined })}
            placeholder="Ex: Ambiance, Combat, Personnages..."
            className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            list="sound-categories"
          />
          <datalist id="sound-categories">
            {Array.from(new Set(soundboard.buttons.map(b => b.category).filter(Boolean))).map(cat => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Fichier audio (.mp3, .wav, .ogg)</label>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor={`sound-file-${index}`}>Sélectionner un fichier audio</label>
            <input
              id={`sound-file-${index}`}
              type="file"
              accept=".mp3,audio/mpeg,.wav,audio/wav,.ogg,audio/ogg"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    updateSoundButton(index, { audioUrl: reader.result as string });
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="text-sm flex-1 text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-px flex-1 bg-border/50" />
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">ou</span>
            <div className="h-px flex-1 bg-border/50" />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                if (isRecording) {
                  mediaRecorderRef.current?.stop();
                  mediaStreamRef.current?.getTracks().forEach(t => t.stop());
                  if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
                  setIsRecording(false);
                  setRecordingDuration(0);
                } else {
                  try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    mediaStreamRef.current = stream;
                    const recorder = new MediaRecorder(stream);
                    const chunks: Blob[] = [];
                    recorder.ondataavailable = (e) => chunks.push(e.data);
                    recorder.onstop = () => {
                      const blob = new Blob(chunks, { type: 'audio/webm' });
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        if (reader.result) updateSoundButton(index, { audioUrl: reader.result as string });
                      };
                      reader.readAsDataURL(blob);
                      stream.getTracks().forEach(t => t.stop());
                    };
                    mediaRecorderRef.current = recorder;
                    recorder.start();
                    setIsRecording(true);
                    setRecordingDuration(0);
                    const startTime = Date.now();
                    recordingTimerRef.current = setInterval(() => {
                      setRecordingDuration(Math.floor((Date.now() - startTime) / 1000));
                    }, 200);
                  } catch (err) {
                    console.error("Microphone access denied", err);
                  }
                }
              }}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-bold uppercase transition-all ${
                isRecording
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-accent border border-border'
              }`}
            >
              <Mic size={14} />
              {isRecording ? `Arrêter ${recordingDuration}s` : 'Enregistrer (micro)'}
            </button>
          </div>
        </div>
          {btn.audioUrl && (
            <>
              <div className="text-xs text-green-500 font-medium mt-1 flex items-center gap-1">
                Fichier chargé.
              </div>

              {/* Volume & Test Section */}
              <div className="flex flex-col gap-2 mt-2 p-3 bg-muted/20 rounded-lg border border-border/50">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground" htmlFor={`sound-volume-${index}`}>
                    Volume : {Math.round((btn.volume ?? 1) * 100)}%
                  </label>
                </div>
                <input
                  id={`sound-volume-${index}`}
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={btn.volume ?? 1}
                  onChange={(e) => {
                    const newVol = parseFloat(e.target.value);
                    updateSoundButton(index, { volume: newVol });
                    if (testAudioRef.current) {
                      testAudioRef.current.volume = newVol;
                    }
                  }}
                  className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => {
                      if (isTesting && testAudioRef.current) {
                        testAudioRef.current.pause();
                        setIsTesting(false);
                      } else {
                        if (testAudioRef.current) {
                          testAudioRef.current.pause();
                        }
                        const audio = new Audio();
                        audio.volume = btn.volume ?? 1;
                        audio.onended = () => setIsTesting(false);
                        testAudioRef.current = audio;

                        const testSrc = btn.audioUrl;
                        if (isIdbUrl(testSrc)) {
                          getAudio(idbUrlToKey(testSrc)).then(base64 => {
                            if (base64 && testAudioRef.current) {
                              testAudioRef.current.src = base64;
                              testAudioRef.current.load();
                              testAudioRef.current.play();
                            }
                          });
                        } else {
                          audio.src = testSrc;
                          audio.play();
                        }
                        setIsTesting(true);
                      }
                    }}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] py-2 rounded flex items-center justify-center gap-2 font-bold uppercase transition-colors"
                  >
                    {isTesting ? <Pause size={12} /> : <Play size={12} />}
                    {isTesting ? 'Pause' : 'Tester'}
                  </button>
                  <button
                    onClick={() => {
                      if (testAudioRef.current) {
                        testAudioRef.current.pause();
                        testAudioRef.current.currentTime = 0;
                        testAudioRef.current = null;
                        setIsTesting(false);
                      }
                    }}
                    className="flex-1 bg-red-900/20 hover:bg-red-900/40 text-red-400 text-[10px] py-2 rounded flex items-center justify-center gap-2 border border-red-900/30 font-bold uppercase transition-colors"
                  >
                    <Square size={12} /> Stop
                  </button>
                </div>
              </div>
            </>
          )}

        <div className="flex flex-col gap-1 mt-2">
          <label className="text-sm font-medium">Icône</label>
          <div className="flex flex-wrap gap-1 bg-input border border-border rounded-md p-2 max-h-32 overflow-y-auto custom-scrollbar">
            {TAG_ICONS.map((iconName: string) => {
              const IconComponent = icons[iconName as keyof typeof icons];
              if (!IconComponent) return null;
              return (
                <button
                  key={iconName}
                  onClick={() => updateSoundButton(index, { icon: iconName })}
                  className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${
                    btn.icon === iconName
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'
                  }`}
                  title={iconName}
                >
                  {React.createElement(IconComponent as any, { size: 16 })}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Image de fond optionnelle</label>
          <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex flex-col gap-2">
              <label className="sr-only" htmlFor={`sound-image-file-${index}`}>Sélectionner une image de fond</label>
              <input
                id={`sound-image-file-${index}`}
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    await handleImageFile(file, (url) => updateSoundButton(index, { imageUrl: url }));
                  }
                }}
                className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
              <label className="sr-only" htmlFor={`sound-image-url-${index}`}>URL de l'image de fond</label>
              <input
                id={`sound-image-url-${index}`}
                type="text"
                value={btn.imageUrl || ''}
                onChange={(e) => updateSoundButton(index, { imageUrl: e.target.value })}
                placeholder="Ou collez l'URL d'une image ici..."
                className="bg-input border border-border rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {btn.imageUrl && (
              <div className="flex items-center gap-3 mt-1 pt-2 border-t border-border/30">
                <img src={btn.imageUrl} alt="Preview" className="w-12 h-12 rounded-md object-cover border-2 border-primary/20 shadow-sm" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Aperçu</span>
                  <button
                    onClick={async () => {
                      if (btn.imageUrl) await deleteFileFromStorage(btn.imageUrl);
                      updateSoundButton(index, { imageUrl: undefined });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 text-destructive hover:bg-destructive text-[11px] font-bold hover:text-destructive-foreground rounded-md transition-all shadow-sm"
                  >
                    <Trash2 size={12} /> Supprimer l'image
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 mt-2">
          <label className="text-sm font-medium">Couleur d'accentuation</label>
          <ColorPicker
            color={btn.color || '#3b82f6'}
            onChange={(c) => updateSoundButton(index, { color: c })}
            label="Couleur"
            className="!w-10 !h-10"
          />
        </div>

        <div className="flex flex-col gap-1 mt-2 border-t border-border pt-4">
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer" htmlFor={`sound-oneshot-${index}`}>
            <input
              id={`sound-oneshot-${index}`}
              type="checkbox"
              checked={btn.isOneShot}
              onChange={(e) => updateSoundButton(index, { isOneShot: e.target.checked })}
              className="rounded border-border w-4 h-4"
            />
            1 coup (jouer une fois)
          </label>
          <p className="text-xs text-muted-foreground ml-6">
            Si décoché, le son sera lu en boucle jusqu'au prochain clic.
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer" htmlFor={`sound-ambient-${index}`}>
            <input
              id={`sound-ambient-${index}`}
              type="checkbox"
              checked={btn.isAmbient || false}
              onChange={(e) => updateSoundButton(index, { isAmbient: e.target.checked })}
              className="rounded border-border w-4 h-4"
            />
            <span>Ambiance <span className="text-muted-foreground font-normal">(crossfade automatique)</span></span>
          </label>
          <p className="text-xs text-muted-foreground ml-6">
            Les sons d'ambiance se fondent progressivement lors du changement (fondu enchaîné).
          </p>
        </div>

        {btn.audioUrl && (
          <div className="mt-4 pt-4 border-t border-border">
            <button
              onClick={() => {
                removeSoundButton(index);
                handleClose();
              }}
              className="flex items-center gap-2 w-full justify-center px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-md text-sm font-medium transition-colors"
            >
              <Trash2 size={16} /> Supprimer le son
            </button>
          </div>
        )}
      </div>
    );
  }

  const isTagEntity = editingEntity.type === 'tagModel' || editingEntity.type === 'tagInstance';
  const isWiderModal = isTagEntity;
  const isRoleModal = editingEntity.type === 'role';

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div ref={modalRef} className={`bg-card w-full ${isRoleModal ? 'max-w-3xl min-h-[500px]' : isWiderModal ? 'max-w-2xl min-h-[400px]' : 'max-w-md'} rounded-xl shadow-xl border border-border flex flex-col overflow-hidden max-h-[90vh]`}>
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <h2 className="font-bold text-lg">{entityTitle}</h2>
          <button
            onClick={handleClose}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
            aria-label="Fermer"
            title="Fermer"
          >
            <X size={20} />
          </button>
        </div>
        <div className={`p-6 flex-1 flex flex-col ${isWiderModal ? 'overflow-hidden' : ''}`}>
          {entityContent}
        </div>
        {!isTagEntity && (
          <div className="p-4 border-t border-border flex justify-end bg-muted/30">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium"
            >
              Terminé
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
