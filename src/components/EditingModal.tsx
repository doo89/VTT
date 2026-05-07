import React from 'react';
import { useVttStore } from '../store';
import * as icons from 'lucide-react';
import { X, Trash2, Play, Pause, Square } from 'lucide-react';
import { uploadFileToStorage, deleteFileFromStorage } from '../lib/supabase';
import { ColorPicker } from './ColorPicker';

const TEAM_ICONS = [
  'Users', 'Shield', 'Sword', 'Heart', 'Star', 'Flag', 'Skull', 'Ghost',
  'Crown', 'Flame', 'Zap', 'Droplet', 'Sun', 'Moon', 'Eye', 'Feather',
  'Key', 'Anchor', 'Axe', 'Castle', 'Crosshair', 'Hexagon', 'Sprout', 'Target', 'Gem',
  'Wind', 'Waves', 'Mountain', 'Trees', 'Cloud', 'Compass', 'Map', 'FlaskConical',
  'Scroll', 'Book', 'Wand', 'Hammer', 'Pickaxe', 'LifeBuoy', 'Tent', 'Rocket',
  'Fish', 'Bird', 'Bug', 'Leaf', 'Smile', 'Angry', 'Lightbulb', 'Music', 'Bell',
  'Gift', 'Coffee', 'Trash2', 'Camera', 'Lock', 'Unlock', 'Ear', 'Pointer',
  'ArrowBigUp', 'ArrowBigDown', 'ArrowBigLeft', 'ArrowBigRight', 'RefreshCw',
  'Dna', 'Magnet', 'Infinity', 'Aperture', 'Atom', 'Battery', 'Bicycle',
  'Bus', 'Car', 'Candy', 'Citrus', 'Cookie', 'Clover', 'CloudLightning',
  'Egg', 'Fingerprint', 'Grape', 'Gamepad2', 'Gavel', 'Glasses', 'Hand', 'HeartPulse',
  'Heater', 'IceCream', 'Lamp', 'Languages', 'Mail', 'Microscope', 'MoonStar',
  'Palmtree', 'Paperclip', 'Peace', 'Pencil', 'Piano', 'Pizza', 'Plane',
  'Puzzle', 'Radiation', 'Rainbow', 'Rat', 'Robot', 'Siren', 'Snowflake',
  'Speaker', 'Stethoscope', 'Syringe', 'Telescope', 'Thermometer', 'Ticket',
  'Timer', 'Trophy', 'Truck', 'Turtle', 'Umbrella', 'Usb', 'User', 'VenetianMask',
  'Volcano', 'Wallet', 'Watch', 'Wrench', 'YingYang'
];

export const TAG_ICONS = [
  'Tag', 'Shield', 'Sword', 'Heart', 'Star', 'Flag', 'Skull', 'Ghost',
  'Crown', 'Flame', 'Zap', 'Droplet', 'Sun', 'Moon', 'Eye', 'Feather',
  'Key', 'Anchor', 'Axe', 'Castle', 'Crosshair', 'Hexagon', 'Sprout', 'Target', 'Gem',
  'Wind', 'Waves', 'Mountain', 'Trees', 'Cloud', 'Compass', 'Map', 'FlaskConical',
  'Scroll', 'Book', 'Wand', 'Hammer', 'Pickaxe', 'LifeBuoy', 'Tent', 'Rocket',
  'Fish', 'Bird', 'Bug', 'Leaf', 'Smile', 'Angry', 'Lightbulb', 'Music', 'Bell',
  'Gift', 'Coffee', 'Trash2', 'Camera', 'Lock', 'Unlock', 'Ear', 'Pointer',
  'ArrowBigUp', 'ArrowBigDown', 'ArrowBigLeft', 'ArrowBigRight', 'RefreshCw',
  'Dna', 'Magnet', 'Infinity', 'Aperture', 'Atom', 'Battery', 'Bicycle',
  'Bus', 'Car', 'Candy', 'Citrus', 'Cookie', 'Clover', 'CloudLightning',
  'Egg', 'Fingerprint', 'Grape', 'Gamepad2', 'Gavel', 'Glasses', 'Hand', 'HeartPulse',
  'Heater', 'IceCream', 'Lamp', 'Languages', 'Mail', 'Microscope', 'MoonStar',
  'Palmtree', 'Paperclip', 'Peace', 'Pencil', 'Piano', 'Pizza', 'Plane',
  'Puzzle', 'Radiation', 'Rainbow', 'Rat', 'Robot', 'Siren', 'Snowflake',
  'Speaker', 'Stethoscope', 'Syringe', 'Telescope', 'Thermometer', 'Ticket',
  'Timer', 'Trophy', 'Truck', 'Turtle', 'Umbrella', 'Usb', 'User', 'VenetianMask',
  'Volcano', 'Wallet', 'Watch', 'Wrench', 'YingYang'
];

export const EditingModal: React.FC = () => {
  const { editingEntity, setEditingEntity, players, playerTemplates, roles, teams, tags, tagCategories, markers, soundboard, handouts, actions, updatePlayer, updatePlayerTemplate, updateRole, updateTeam, updateTagModel, updateTagCategory, updateMarker, updateSoundButton, removeSoundButton, addLog } = useVttStore();
  const [activeTagTab, setActiveTagTab] = React.useState<'general' | 'appearance' | 'fields' | 'container' | 'smartphone'>('general');
  const [activeRoleTab, setActiveRoleTab] = React.useState<'general' | 'appearance' | 'tags'>('general');
  const [tagSearchQuery, setTagSearchQuery] = React.useState('');
  const [expandedContainerCategories, setExpandedContainerCategories] = React.useState<Record<string, boolean>>({});
  const [isSmartphoneFiltersExpanded, setIsSmartphoneFiltersExpanded] = React.useState(false);
  
  // Test audio for sound buttons
  const testAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isTesting, setIsTesting] = React.useState(false);

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

  const tagsByCategory = React.useMemo(() => {
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

  const [initialNotes, setInitialNotes] = React.useState<string | null>(null);

  // Reset tab when editing entity changes
  React.useEffect(() => {
    setActiveTagTab('general');
    setActiveRoleTab('general');
    setIsSmartphoneFiltersExpanded(false);
    
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

    entityTitle = `Modifier Modèle de Joueur: ${template.name}`;
    entityContent = (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Nom</label>
          <input
            type="text"
            value={template.name}
            onChange={(e) => updatePlayerTemplate(template.id, { name: e.target.value })}
            className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-sm font-medium">Couleur</label>
            <div className="flex items-center gap-3">
              <ColorPicker
                color={template.color}
                onChange={(c) => updatePlayerTemplate(template.id, { color: c })}
                label="Couleur"
                className="!w-10 !h-10"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-sm font-medium">Taille (Rayon px)</label>
            <input
              type="number"
              value={template.size}
              onChange={(e) => updatePlayerTemplate(template.id, { size: Math.max(10, parseInt(e.target.value) || 40) })}
              className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Forme du pion</label>
          <select
            value={template.shape || ''}
            onChange={(e) => updatePlayerTemplate(template.id, { shape: (e.target.value || undefined) as any })}
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
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Image / Icône (Modèle)</label>
          <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = await uploadFileToStorage(file);
                    if (url) {
                      updatePlayerTemplate(template.id, { imageUrl: url });
                    }
                  }
                }}
                className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
              <input
                type="text"
                value={template.imageUrl || ''}
                onChange={(e) => updatePlayerTemplate(template.id, { imageUrl: e.target.value })}
                placeholder="Ou collez l'URL d'une image ici..."
                className="bg-input border border-border rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {template.imageUrl && (
              <div className="flex items-center gap-3 mt-1 pt-2 border-t border-border/30">
                <div className="relative group">
                  <img src={template.imageUrl} alt="Preview" className="w-12 h-12 rounded-full object-cover border-2 border-primary/20 shadow-sm" />
                </div>
                <div className="flex flex-col flex-1">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Aperçu & Style Smartphone</span>
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
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Équipe par défaut</label>
          <select
            value={template.teamId || ''}
            onChange={(e) => updatePlayerTemplate(template.id, { teamId: e.target.value || null })}
            className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Aucune équipe</option>
            {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
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
          <label className="text-sm font-medium">Nom</label>
          <input
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
            <label className="text-sm font-medium">Taille (Rayon px)</label>
            <input
              type="number"
              value={player.size}
              onChange={(e) => updatePlayer(player.id, { size: Math.max(10, parseInt(e.target.value) || 40) })}
              className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Forme du pion</label>
          <select
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
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Image / Icône</label>
          <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = await uploadFileToStorage(file);
                    if (url) {
                      updatePlayer(player.id, { imageUrl: url });
                    }
                  }
                }}
                className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
              <input
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
                    <select
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
          <label className="text-sm font-medium">Rôle</label>
          <select
            value={player.roleId || ''}
            onChange={(e) => updatePlayer(player.id, { roleId: e.target.value || null })}
            className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Aucun rôle</option>
            {roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Équipe</label>
          <select
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
            <label className="text-xs font-semibold text-muted-foreground uppercase">Vies Actuelles</label>
            <input
              type="number"
              value={player.lives ?? roles.find(r => r.id === player.roleId)?.lives ?? 0}
              onChange={(e) => updatePlayer(player.id, { lives: parseInt(e.target.value) || 0 })}
              className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Points</label>
            <input
              type="number"
              value={player.points || 0}
              onChange={(e) => updatePlayer(player.id, { points: parseInt(e.target.value) || 0 })}
              className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Votes</label>
            <input
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

    entityTitle = `Modifier Rôle: ${role.name}`;
    entityContent = (
      <div className="flex flex-col h-full w-full">
        {/* Tabs */}
        <div className="flex border-b border-border mb-4 sticky top-0 bg-card z-10 shrink-0">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex-1 ${activeRoleTab === 'general' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveRoleTab('general')}
          >
            Général
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex-1 ${activeRoleTab === 'appearance' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveRoleTab('appearance')}
          >
            Apparence
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex-1 ${activeRoleTab === 'tags' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveRoleTab('tags')}
          >
            Tags
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
          {activeRoleTab === 'general' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Nom</label>
                <input
                  type="text"
                  value={role.name}
                  onChange={(e) => updateRole(role.id, { name: e.target.value })}
                  className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="flex gap-4 items-end">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-sm font-medium">Équipe (réelle)</label>
                  <select
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
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-sm font-medium">Vies</label>
                <input
                  type="number"
                  value={role.lives}
                  onChange={(e) => updateRole(role.id, { lives: parseInt(e.target.value) || 0 })}
                  className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
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

              {!role.isUnique && (
                <div className="ml-6 flex flex-col gap-3 mt-2 p-3 bg-muted/20 border-l-2 border-primary/30 rounded-r-lg">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest min-w-[100px]">Par défaut:</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="number"
                        min="0"
                        value={role.defaultCount ?? role.distributionQuantity ?? 1}
                        onChange={(e) => updateRole(role.id, { defaultCount: parseInt(e.target.value) || 0, distributionQuantity: parseInt(e.target.value) || 0 })}
                        className="w-20 bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-center font-mono"
                      />
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="isFiller-edit"
                            checked={role.isFiller || false}
                            onChange={(e) => updateRole(role.id, { isFiller: e.target.checked })}
                            className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-ring cursor-pointer"
                          />
                          <label htmlFor="isFiller-edit" className="text-[11px] font-medium cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                            Compléter avec
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
                          <label htmlFor="isMinMandatory-edit" className="text-[11px] font-medium cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                            Minimum obligatoire
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest min-w-[100px]">Minimum:</label>
                    <input
                      type="number"
                      min="0"
                      value={role.minCount ?? 0}
                      onChange={(e) => updateRole(role.id, { minCount: parseInt(e.target.value) || 0 })}
                      className="w-20 bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-center font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest min-w-[100px]">Maximum:</label>
                    <input
                      type="number"
                      min="0"
                      value={role.maxCount ?? 99}
                      onChange={(e) => updateRole(role.id, { maxCount: parseInt(e.target.value) || 0 })}
                      className="w-20 bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-center font-mono"
                    />
                  </div>
                </div>
              )}
              
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Description libre</label>
                <textarea
                  value={role.description || ''}
                  onChange={(e) => updateRole(role.id, { description: e.target.value })}
                  placeholder="Ex: Si tué la nuit, ressuscite le lendemain..."
                  className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring min-h-[80px]"
                />
              </div>
            </div>
          )}

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
                          if (file) {
                            const url = await uploadFileToStorage(file);
                            if (url) {
                              updateRole(role.id, { imageUrl: url });
                            }
                          }
                        }}
                        className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={role.imageUrl || ''}
                          onChange={(e) => updateRole(role.id, { imageUrl: e.target.value })}
                          placeholder="Ou collez l'URL d'une image ici..."
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
                  {/* Smartphone Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-24 bg-[#18181b] rounded-b-2xl z-20" />
                  
                  {/* Smartphone Screen Content */}
                  <div className="flex-1 flex flex-col p-4 pt-10 overflow-hidden relative">
                    {/* Mock Header */}
                    <div className="flex flex-col gap-0.5 mb-4 opacity-50">
                      <div className="h-1.5 w-12 bg-zinc-800 rounded-full" />
                      <div className="h-3 w-20 bg-zinc-700 rounded-full" />
                    </div>

                    {/* Mock Role Card (simplified version of PlayerView.tsx) */}
                    {(() => {
                      const effectiveStyle = role.smartphoneImageStyle || 'circle';
                      const team = teams.find(t => t.id === role.teamId);
                      
                      return (
                        <div className="flex-1 flex flex-col items-center bg-[#18181b] rounded-2xl border border-white/5 p-4 shadow-xl overflow-hidden relative">
                          {team && (
                            <div 
                              className="absolute top-0 left-0 w-full h-1" 
                              style={{ backgroundColor: team.color }}
                            />
                          )}

                          {/* Background Image Style */}
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

                    {/* Mock Bottom Tabs */}
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

          {activeRoleTab === 'tags' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium">Tags attachés</label>
                  <div className="relative">
                    <icons.Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Filtrer les tags..."
                      value={tagSearchQuery}
                      onChange={(e) => setTagSearchQuery(e.target.value)}
                      className="bg-input border border-border rounded-md pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring w-48"
                    />
                  </div>
                </div>
                {tags.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Aucun tag défini dans le jeu.</p>
                ) : (
                  <select
                    multiple
                    value={(role.tags || []).map(t => t.id)}
                    onChange={(e) => {
                      const options = Array.from(e.target.selectedOptions);
                      const selectedVisibleIds = options.map(o => o.value);
                      
                      const currentSelectedIds = (role.tags || []).map(t => t.id);
                      const filteredTags = tags.filter(t => t.name.toLowerCase().includes(tagSearchQuery.toLowerCase()));
                      const filteredTagIds = filteredTags.map(t => t.id);
                      
                      // Keep tags that are selected but NOT currently visible (filtered out)
                      const selectedHiddenIds = currentSelectedIds.filter(id => !filteredTagIds.includes(id));
                      
                      const finalIds = [...selectedHiddenIds, ...selectedVisibleIds];
                      const newTags = tags.filter(t => finalIds.includes(t.id));
                      updateRole(role.id, { tags: newTags });
                    }}
                    className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring min-h-[150px] custom-scrollbar"
                  >
                    {tags
                      .filter(t => t.name.toLowerCase().includes(tagSearchQuery.toLowerCase()))
                      .map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                  </select>
                )}
                <p className="text-xs text-muted-foreground mt-1">Maintenez Ctrl (ou Cmd sur Mac) pour sélectionner plusieurs tags.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } else if (editingEntity.type === 'team') {
    const team = teams.find(t => t.id === editingEntity.id);
    if (!team) return null;

    entityTitle = `Modifier Équipe: ${team.name}`;
    entityContent = (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Nom de l'équipe</label>
          <input
            type="text"
            value={team.name}
            onChange={(e) => updateTeam(team.id, { name: e.target.value })}
            className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Description de l'équipe (Mémo)</label>
          <textarea
            value={team.description || ''}
            onChange={(e) => updateTeam(team.id, { description: e.target.value })}
            placeholder="Description, objectifs ou notes sur l'équipe..."
            className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring min-h-[80px] resize-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Image de l'équipe</label>
          <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = await uploadFileToStorage(file);
                    if (url) {
                      updateTeam(team.id, { imageUrl: url });
                    }
                  }
                }}
                className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
              <input
                type="text"
                value={team.imageUrl || ''}
                onChange={(e) => updateTeam(team.id, { imageUrl: e.target.value })}
                placeholder="Ou collez l'URL d'une image ici..."
                className="bg-input border border-border rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

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
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Icône de l'équipe</label>
          <div className="flex flex-wrap gap-1.5 bg-input border border-border rounded-md p-2 max-h-40 overflow-y-auto">
            {TEAM_ICONS.map((iconName: string) => {
              const IconComponent = icons[iconName as keyof typeof icons];
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
                  {React.createElement(IconComponent as any, { size: 20 })}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Couleur</label>
          <ColorPicker
            color={team.color}
            onChange={(c) => updateTeam(team.id, { color: c })}
            label="Couleur"
            className="!w-10 !h-10"
          />
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
          <label className="text-sm font-medium">Nom de la catégorie</label>
          <input
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
    entityContent = (
      <div className="flex flex-col h-full w-full">
        {/* Tabs */}
        <div className="flex border-b border-border mb-4 sticky top-0 bg-card z-10 shrink-0">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex-1 ${activeTagTab === 'general' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTagTab('general')}
          >
            Général
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex-1 ${activeTagTab === 'appearance' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTagTab('appearance')}
          >
            Apparence
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex-1 ${activeTagTab === 'fields' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTagTab('fields')}
          >
            Champs
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex-1 ${activeTagTab === 'smartphone' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTagTab('smartphone')}
          >
            Smartphone
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex-1 ${activeTagTab === 'container' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTagTab('container')}
          >
            Container
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-[300px]">
          {activeTagTab === 'general' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Nom</label>
                <input
                  type="text"
                  value={tag.name}
                  onChange={(e) => updateTagModel(tag.id, { name: e.target.value })}
                  className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Catégorie</label>
                <select
                  value={tag.categoryId || ''}
                  onChange={(e) => updateTagModel(tag.id, { categoryId: e.target.value || null })}
                  className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Sans catégorie</option>
                  {tagCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2 mt-4">
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tag.showInTooltip !== false}
                    onChange={(e) => updateTagModel(tag.id, { showInTooltip: e.target.checked })}
                    className="rounded border-border w-4 h-4"
                  />
                  Visible dans l'info-bulle (au survol du joueur)
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tag.showInGameTab !== false}
                    onChange={(e) => updateTagModel(tag.id, { showInGameTab: e.target.checked })}
                    className="rounded border-border w-4 h-4"
                  />
                  Visible dans l'onglet Jeu (sous le joueur)
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tag.showOnSmartphone || false}
                    onChange={(e) => updateTagModel(tag.id, { showOnSmartphone: e.target.checked })}
                    className="rounded border-border w-4 h-4"
                  />
                  Visible sur smartphone (version joueur)
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tag.visibleInWiki || false}
                    onChange={(e) => updateTagModel(tag.id, { visibleInWiki: e.target.checked })}
                    className="rounded border-border w-4 h-4"
                  />
                  Visible dans le WIKI
                </label>
              </div>
            </div>
          )}

          {activeTagTab === 'container' && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground mb-2">
                Ce tag peut servir de "Container". Lorsqu'il est appliqué à un joueur, tous les tags sélectionnés ici seront appliqués en même temps avec lui.
              </p>
              <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-2 pb-2">
                {tagCategories.map(cat => {
                  const catTags = tagsByCategory[cat.id]?.filter(t => t.id !== tag.id);
                  if (!catTags || catTags.length === 0) return null;
                  
                  const CatIcon = icons[cat.icon as keyof typeof icons] || icons.Folder;
                  const isExpanded = expandedContainerCategories[cat.id] ?? true;

                  const handleToggleCat = () => {
                    setExpandedContainerCategories(prev => ({ ...prev, [cat.id]: !isExpanded }));
                  };

                  return (
                    <div key={cat.id} className="flex flex-col bg-card border border-border rounded-md overflow-hidden">
                      <button 
                        onClick={handleToggleCat}
                        className="flex items-center justify-between bg-muted/50 hover:bg-muted p-2 transition-colors w-full text-left"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <div className="p-1 rounded bg-background shadow-sm" style={{ color: cat.color }}>
                            {React.createElement(CatIcon as any, { size: 14 })}
                          </div>
                          <span className="font-semibold text-sm flex-1">{cat.name}</span>
                          <span className="text-xs text-muted-foreground bg-background px-1.5 rounded-full border border-border">
                            {catTags.length}
                          </span>
                        </div>
                        {isExpanded ? <icons.ChevronDown size={14} className="text-muted-foreground" /> : <icons.ChevronRight size={14} className="text-muted-foreground" />}
                      </button>

                      {isExpanded && (
                        <div className="flex flex-col gap-1 p-2 bg-background/50 border-t border-border">
                          {catTags.map(otherTag => (
                            <label key={otherTag.id} className="flex items-center gap-3 p-2 hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer transition-colors">
                              <input
                                type="checkbox"
                                checked={tag.childTagIds?.includes(otherTag.id) || false}
                                onChange={(e) => {
                                  const currentList = tag.childTagIds || [];
                                  const newList = e.target.checked
                                    ? [...currentList, otherTag.id]
                                    : currentList.filter((id: string) => id !== otherTag.id);
                                  updateTagModel(tag.id, { childTagIds: newList });
                                }}
                                className="rounded border-border w-4 h-4"
                              />
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: otherTag.color }} />
                              <span className="text-sm font-medium flex-1">{otherTag.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Uncategorized Tags */}
                {(() => {
                  const noCatTags = tagsByCategory['no-category']?.filter(t => t.id !== tag.id);
                  if (!noCatTags || noCatTags.length === 0) return null;
                  
                  const isExpanded = expandedContainerCategories['no-category'] ?? true;

                  const handleToggleCat = () => {
                    setExpandedContainerCategories(prev => ({ ...prev, ['no-category']: !isExpanded }));
                  };

                  return (
                    <div className="flex flex-col bg-card border border-border rounded-md overflow-hidden">
                      <button 
                        onClick={handleToggleCat}
                        className="flex items-center justify-between bg-muted/50 hover:bg-muted p-2 transition-colors w-full text-left"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <div className="p-1 rounded bg-background shadow-sm text-muted-foreground">
                            <icons.Folder size={14} />
                          </div>
                          <span className="font-semibold text-sm flex-1 text-muted-foreground italic">Sans catégorie</span>
                          <span className="text-xs text-muted-foreground bg-background px-1.5 rounded-full border border-border">
                            {noCatTags.length}
                          </span>
                        </div>
                        {isExpanded ? <icons.ChevronDown size={14} className="text-muted-foreground" /> : <icons.ChevronRight size={14} className="text-muted-foreground" />}
                      </button>
                      
                      {isExpanded && (
                        <div className="flex flex-col gap-1 p-2 bg-background/50 border-t border-border">
                          {noCatTags.map(otherTag => (
                            <label key={otherTag.id} className="flex items-center gap-3 p-2 hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer transition-colors">
                              <input
                                type="checkbox"
                                checked={tag.childTagIds?.includes(otherTag.id) || false}
                                onChange={(e) => {
                                  const currentList = tag.childTagIds || [];
                                  const newList = e.target.checked
                                    ? [...currentList, otherTag.id]
                                    : currentList.filter((id: string) => id !== otherTag.id);
                                  updateTagModel(tag.id, { childTagIds: newList });
                                }}
                                className="rounded border-border w-4 h-4"
                              />
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: otherTag.color }} />
                              <span className="text-sm font-medium flex-1">{otherTag.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {tags.filter(t => t.id !== tag.id).length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-4">Aucun autre tag disponible</div>
                )}
              </div>
            </div>
          )}

          {activeTagTab === 'appearance' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Icône du tag</label>
                <div className="flex flex-wrap gap-1 bg-input border border-border rounded-md p-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {TAG_ICONS.map((iconName: string) => {
                    const IconComponent = icons[iconName as keyof typeof icons];
                    if (!IconComponent) return null;
                    return (
                      <button
                        key={iconName}
                        onClick={() => updateTagModel(tag.id, { icon: iconName })}
                        className={`p-2 rounded-md transition-colors flex items-center justify-center ${
                          tag.icon === iconName
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'
                        }`}
                        title={iconName}
                      >
                        {React.createElement(IconComponent as any, { size: 20 })}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Image personnalisée</label>
                <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await uploadFileToStorage(file);
                          if (url) {
                            updateTagModel(tag.id, { imageUrl: url });
                          }
                        }
                      }}
                      className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={tag.imageUrl || ''}
                      onChange={(e) => updateTagModel(tag.id, { imageUrl: e.target.value })}
                      placeholder="Ou collez l'URL d'une image ici..."
                      className="bg-input border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>

                  {tag.imageUrl && (
                    <div className="flex items-center gap-3 mt-1 pt-2 border-t border-border/30">
                      <img src={tag.imageUrl} alt="Preview" className="w-14 h-14 rounded-md object-cover border-2 border-primary/20 shadow-sm" />
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Aperçu</span>
                        <button
                          onClick={async () => {
                            if (tag.imageUrl) await deleteFileFromStorage(tag.imageUrl);
                            updateTagModel(tag.id, { imageUrl: undefined });
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
                <label className="text-sm font-medium">Couleur</label>
                <div className="flex items-center gap-3">
                  <ColorPicker
                    color={tag.color}
                    onChange={(c) => updateTagModel(tag.id, { color: c })}
                    label="Couleur"
                    className="!w-10 !h-10"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTagTab === 'fields' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium" title="Ordre d'Appel Jour">Appel Jour</label>
                  <input
                    type="text"
                    value={tag.callOrderDay ?? ''}
                    onChange={(e) => updateTagModel(tag.id, { callOrderDay: e.target.value })}
                    className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring text-center"
                    placeholder="ex: 5 ou +2"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium" title="Ordre d'Appel Nuit">Appel Nuit</label>
                  <input
                    type="text"
                    value={tag.callOrderNight ?? ''}
                    onChange={(e) => updateTagModel(tag.id, { callOrderNight: e.target.value })}
                    className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring text-center"
                    placeholder="ex: 5 ou +2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-muted-foreground">Ajout Vie</label>
                  <input
                    type="text"
                    value={tag.lives ?? ''}
                    onChange={(e) => updateTagModel(tag.id, { lives: e.target.value })}
                    className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="ex: 1 ou +1"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-muted-foreground">Votes</label>
                  <input
                    type="text"
                    value={tag.votes ?? ''}
                    onChange={(e) => updateTagModel(tag.id, { votes: e.target.value })}
                    className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="ex: 10 ou -2"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-muted-foreground">Points</label>
                  <input
                    type="text"
                    value={tag.points ?? ''}
                    onChange={(e) => updateTagModel(tag.id, { points: e.target.value })}
                    className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="ex: 100 ou +50"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-muted-foreground">Uses</label>
                  <input
                    type="text"
                    value={tag.uses ?? ''}
                    onChange={(e) => updateTagModel(tag.id, { uses: e.target.value })}
                    className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="ex: 3"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer mt-2">
                    <input
                      type="checkbox"
                      checked={tag.autoDeleteOnZeroUses || false}
                      onChange={(e) => updateTagModel(tag.id, { autoDeleteOnZeroUses: e.target.checked })}
                      className="rounded border-border w-3.5 h-3.5"
                    />
                    Suppr. auto à 0
                  </label>
                </div>
              </div>

              <div className="flex gap-4 mb-2">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs font-medium text-muted-foreground">Vu comme rôle (info-bulle)</label>
                  <select
                    value={tag.seenAsRoleId || ''}
                    onChange={(e) => updateTagModel(tag.id, { seenAsRoleId: e.target.value || null })}
                    className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">-- Aucun --</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs font-medium text-muted-foreground">Vu dans équipe (info-bulle)</label>
                  <select
                    value={tag.seenInTeamId || ''}
                    onChange={(e) => updateTagModel(tag.id, { seenInTeamId: e.target.value || null })}
                    className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">-- Identique à réelle --</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1 mt-2">
                <label className="text-sm font-medium text-muted-foreground">Texte libre</label>
                <textarea
                  value={tag.description || ''}
                  onChange={(e) => updateTagModel(tag.id, { description: e.target.value })}
                  className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring min-h-[100px] resize-y"
                  placeholder="Saisissez un texte libre ici..."
                />
              </div>
            </div>
          )}

          {activeTagTab === 'smartphone' && (
            <div className="flex flex-col gap-4">

              <div className="flex flex-col gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <icons.Smartphone size={16} className="text-blue-400" />
                  Interface Smartphone
                </h4>

                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-muted-foreground">Sélection de joueur(s) sur Smartphone</p>
                  <div className="flex flex-col gap-2 bg-background/50 p-2 rounded-md border border-border">
                    <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                      <input
                        type="radio"
                        name="playerSelectorMode"
                        checked={!tag.isMultiPlayerSelector && !tag.isSinglePlayerSelector}
                        onChange={() => updateTagModel(tag.id, { isMultiPlayerSelector: false, isSinglePlayerSelector: false })}
                        className="w-4 h-4 text-primary"
                      />
                      Aucun (Action simple)
                    </label>
                    <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                      <input
                        type="radio"
                        name="playerSelectorMode"
                        checked={tag.isSinglePlayerSelector || false}
                        onChange={() => updateTagModel(tag.id, { isMultiPlayerSelector: false, isSinglePlayerSelector: true })}
                        className="w-4 h-4 text-primary"
                      />
                      Sélecteur de joueur (le joueur choisit UN joueur)
                    </label>
                    <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                      <input
                        type="radio"
                        name="playerSelectorMode"
                        checked={tag.isMultiPlayerSelector || false}
                        onChange={() => updateTagModel(tag.id, { isMultiPlayerSelector: true, isSinglePlayerSelector: false })}
                        className="w-4 h-4 text-primary"
                      />
                      Sélecteur multi-joueurs (le joueur choisit PLUSIEURS joueurs)
                    </label>
                  </div>

                  {(tag.isSinglePlayerSelector || tag.isMultiPlayerSelector) && (
                    <div className="flex flex-col gap-2 mt-2 p-3 bg-muted/20 border-l-2 border-primary/30 rounded-r-lg">
                      <button 
                        onClick={() => setIsSmartphoneFiltersExpanded(!isSmartphoneFiltersExpanded)}
                        className="flex items-center justify-between w-full text-left"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Filtres du sélecteur</span>
                        {isSmartphoneFiltersExpanded ? <icons.ChevronDown size={14} className="text-muted-foreground" /> : <icons.ChevronRight size={14} className="text-muted-foreground" />}
                      </button>

                      {isSmartphoneFiltersExpanded && (
                        <div className="flex flex-col gap-3 mt-1 animate-in slide-in-from-top-1 duration-200">
                          {/* Two-column grid for filters */}
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            <div className="flex flex-col gap-2">
                              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer group">
                                <input type="checkbox" checked={tag.smartphoneFilterAlive || false} onChange={e => updateTagModel(tag.id, { smartphoneFilterAlive: e.target.checked })} className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-ring" />
                                <span className="group-hover:text-primary transition-colors">Tout les joueurs vivants</span>
                              </label>
                              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer group">
                                <input type="checkbox" checked={tag.smartphoneFilterDead || false} onChange={e => updateTagModel(tag.id, { smartphoneFilterDead: e.target.checked })} className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-ring" />
                                <span className="group-hover:text-primary transition-colors">Tout les joueurs morts</span>
                              </label>
                              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer group">
                                <input type="checkbox" checked={tag.smartphoneFilterMyRole || false} onChange={e => updateTagModel(tag.id, { smartphoneFilterMyRole: e.target.checked })} className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-ring" />
                                <span className="group-hover:text-primary transition-colors">Tout les joueurs ayant mon rôle</span>
                              </label>
                              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer group">
                                <input type="checkbox" checked={tag.smartphoneFilterNotMe || false} onChange={e => updateTagModel(tag.id, { smartphoneFilterNotMe: e.target.checked })} className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-ring" />
                                <span className="group-hover:text-primary transition-colors">Sauf moi</span>
                              </label>
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer group">
                                <input type="checkbox" checked={tag.smartphoneFilterNotMyRole || false} onChange={e => updateTagModel(tag.id, { smartphoneFilterNotMyRole: e.target.checked })} className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-ring" />
                                <span className="group-hover:text-primary transition-colors">Sauf les joueurs ayant mon rôle</span>
                              </label>
                              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer group">
                                <input type="checkbox" checked={tag.smartphoneFilterMyTeam || false} onChange={e => updateTagModel(tag.id, { smartphoneFilterMyTeam: e.target.checked })} className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-ring" />
                                <span className="group-hover:text-primary transition-colors">Tout les joueurs de mon équipes</span>
                              </label>
                              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer group">
                                <input type="checkbox" checked={tag.smartphoneFilterNotMyTeam || false} onChange={e => updateTagModel(tag.id, { smartphoneFilterNotMyTeam: e.target.checked })} className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-ring" />
                                <span className="group-hover:text-primary transition-colors">Sauf les joueurs de mon équipe</span>
                              </label>
                            </div>
                          </div>

                          {/* Tag selector filter (bottom line) */}
                          <div className="flex items-center gap-2 w-full pt-2 border-t border-border/10">
                            <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer group shrink-0">
                              <input type="checkbox" checked={tag.smartphoneFilterNotThisTag || false} onChange={e => updateTagModel(tag.id, { smartphoneFilterNotThisTag: e.target.checked })} className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-ring" />
                              <span className="group-hover:text-primary transition-colors">Sauf les joueurs ayant ce tag :</span>
                            </label>
                            <select 
                              value={tag.smartphoneFilterExcludeTagId || ''} 
                              onChange={e => updateTagModel(tag.id, { smartphoneFilterExcludeTagId: e.target.value || null })}
                              className="bg-background border border-border/80 rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-primary flex-1 h-7 text-foreground cursor-pointer hover:border-primary/50 transition-colors shadow-sm"
                              disabled={!tag.smartphoneFilterNotThisTag}
                            >
                              <option value="">Sélectionner un tag...</option>
                              {[...tags].sort((a,b) => a.name.localeCompare(b.name)).map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-border/10">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Information à retourner</span>
                            <div className="flex flex-wrap gap-x-4 gap-y-2">
                              {[
                                { key: 'none', label: 'Aucun' },
                                { key: 'real_role', label: 'Rôle réel' },
                                { key: 'real_team', label: 'Equipe réelle' },
                                { key: 'seen_role', label: 'Vu comme rôle' },
                                { key: 'seen_team', label: 'Vu dans l’équipe' }
                              ].map(info => (
                                <label key={info.key} className="flex items-center gap-2 text-xs text-foreground cursor-pointer group">
                                  <input
                                    type="radio"
                                    name={`returnInfo-model-${tag.id}`}
                                    checked={(tag.smartphoneReturnInfo || 'none') === info.key}
                                    onChange={() => updateTagModel(tag.id, { smartphoneReturnInfo: info.key as any })}
                                    className="w-3 h-3 text-primary"
                                  />
                                  <span className="group-hover:text-primary transition-colors">{info.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/10">
                            <label className="flex items-center gap-2 text-[11px] text-foreground cursor-pointer group shrink-0">
                              <input 
                                type="checkbox" 
                                checked={tag.smartphoneIsCheckRoleEnabled || false} 
                                onChange={e => updateTagModel(tag.id, { smartphoneIsCheckRoleEnabled: e.target.checked })} 
                                className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-ring" 
                              />
                              <span className="group-hover:text-primary transition-colors">A bien le rôle de :</span>
                            </label>
                            <select 
                              value={tag.smartphoneCheckRoleId || ''} 
                              onChange={e => updateTagModel(tag.id, { smartphoneCheckRoleId: e.target.value || null })}
                              className="bg-background border border-border/80 rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-primary flex-1 h-7 text-foreground cursor-pointer hover:border-primary/50 transition-colors shadow-sm"
                              disabled={!tag.smartphoneIsCheckRoleEnabled}
                            >
                              <option value="">Sélectionner un rôle...</option>
                              {[...roles].sort((a,b) => a.name.localeCompare(b.name)).map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                              ))}
                            </select>
                          </div>

                          {(tag.isMultiPlayerSelector || false) && tag.smartphoneIsCheckRoleEnabled && (
                            <div className="flex items-center gap-4 mt-1 ml-6">
                              <label className="flex items-center gap-2 text-[10px] text-foreground cursor-pointer group">
                                <input 
                                  type="checkbox" 
                                  checked={tag.smartphoneCheckRoleVague || false} 
                                  onChange={e => updateTagModel(tag.id, { smartphoneCheckRoleVague: e.target.checked })} 
                                  className="w-3 h-3 rounded border-border text-primary focus:ring-ring" 
                                />
                                <span className="group-hover:text-primary transition-colors">Réponse vague</span>
                              </label>
                              <label className="flex items-center gap-2 text-[10px] text-foreground cursor-pointer group">
                                <input 
                                  type="checkbox" 
                                  checked={tag.smartphoneCheckRoleCount || false} 
                                  onChange={e => updateTagModel(tag.id, { smartphoneCheckRoleCount: e.target.checked })} 
                                  className="w-3 h-3 rounded border-border text-primary focus:ring-ring" 
                                />
                                <span className="group-hover:text-primary transition-colors">Combien</span>
                              </label>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Texte du bouton d'action</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      value={tag.smartphoneButtonText || ''}
                      onChange={(e) => updateTagModel(tag.id, { smartphoneButtonText: e.target.value })}
                      placeholder="Ex: Utiliser la potion"
                      className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring w-1/2"
                    />
                    <label className="flex items-center gap-2 text-[11px] text-foreground cursor-pointer hover:text-primary transition-colors whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={tag.smartphoneShowPastille || false}
                        onChange={(e) => updateTagModel(tag.id, { smartphoneShowPastille: e.target.checked })}
                        className="rounded border-border w-3.5 h-3.5 text-primary"
                      />
                      Afficher la pastille tag au dessus du joueur
                    </label>
                  </div>
                  {tag.smartphoneButtonText && (
                    <label className="flex items-center gap-2 text-[11px] text-foreground cursor-pointer mt-1 ml-1 hover:text-primary transition-colors">
                      <input
                        type="checkbox"
                        checked={tag.smartphoneAutoDelete || false}
                        onChange={(e) => updateTagModel(tag.id, { smartphoneAutoDelete: e.target.checked })}
                        className="rounded border-border w-3.5 h-3.5 text-primary"
                      />
                      Suppression automatique (efface le tag après clic)
                    </label>
                  )}
                </div>


                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Retour au smartphone (popup)</label>
                  <input
                    type="text"
                    value={tag.smartphonePlayerFeedback || ''}
                    onChange={(e) => updateTagModel(tag.id, { smartphonePlayerFeedback: e.target.value })}
                    placeholder="Ex: Action envoyée au MJ."
                    className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <p className="text-[10px] text-muted-foreground leading-tight">Ce message s'affiche en popup sur le smartphone du joueur quand il appuie sur le bouton.</p>
                </div>


                <div className="flex flex-col gap-1 mt-2">
                  <label className="text-xs font-medium text-muted-foreground">Message retour au MJ (popup)</label>
                  <input
                    type="text"
                    value={tag.smartphoneButtonFeedback || ''}
                    onChange={(e) => updateTagModel(tag.id, { smartphoneButtonFeedback: e.target.value })}
                    placeholder="Ex: La sorciere utilise sa potion de vie"
                    className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <p className="text-[10px] text-muted-foreground leading-tight">Ce message s'affiche en popup chez le MJ quand le joueur appuie sur le bouton.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground italic">Fusionner aux joueurs</label>
                    <select
                      value={tag.smartphoneMergeTagId || ''}
                      onChange={(e) => updateTagModel(tag.id, { smartphoneMergeTagId: e.target.value || null })}
                      className="bg-background border border-border/80 rounded-md px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground h-9 shadow-sm"
                    >
                      <option value="">-- Aucun --</option>
                      {[...tags].filter(t => t.id !== tag.id).sort((a,b) => a.name.localeCompare(b.name)).map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground italic">Me fusionner ce Tag</label>
                    <select
                      value={tag.smartphoneSelfMergeTagId || ''}
                      onChange={(e) => updateTagModel(tag.id, { smartphoneSelfMergeTagId: e.target.value || null })}
                      className="bg-background border border-border/80 rounded-md px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground h-9 shadow-sm"
                    >
                      <option value="">-- Aucun --</option>
                      {[...tags].sort((a,b) => a.name.localeCompare(b.name)).map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1 mt-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground italic">Déclencher une Action</label>
                  <select
                    value={tag.smartphoneActionId || ''}
                    onChange={(e) => updateTagModel(tag.id, { smartphoneActionId: e.target.value || null })}
                    className="bg-background border border-border/80 rounded-md px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground h-9 shadow-sm"
                  >
                    <option value="">-- Aucune --</option>
                    {[...actions].sort((a,b) => a.name.localeCompare(b.name)).map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>



                <div className="flex flex-col gap-1 mt-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 italic flex items-center gap-2">
                    <icons.BookOpen size={12} className="text-primary/50" />
                    Associer une Aide de Jeu
                  </label>
                  <select
                    value={tag.handoutId || ''}
                    onChange={(e) => updateTagModel(tag.id, { handoutId: e.target.value || null })}
                    className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Aucune (Optionnel)</option>
                    {[...handouts].sort((a,b) => a.name.localeCompare(b.name)).map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-1 bg-primary/5 p-2 rounded border border-primary/10 italic">
                    L'image de cette aide s'affichera dans une galerie sur le smartphone du joueur possédant ce tag.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } else if (editingEntity.type === 'tagInstance') {
    let tag: any = null;
    let updateTagInstance: (updates: any) => void;

    // Check if it's attached to a player
    if (editingEntity.parentId) {
      const player = players.find(p => p.id === editingEntity.parentId);
      if (!player) return null;
      tag = player.tags.find(t => t.instanceId === editingEntity.id);
      if (!tag) return null;

      updateTagInstance = (updates: any) => {
        const newTags = player.tags.map(t => t.instanceId === tag.instanceId ? { ...t, ...updates } : t);
        updatePlayer(player.id, { tags: newTags });
      };
      entityTitle = `Modifier Tag de ${player.name}: ${tag.name}`;
    } else {
      // Otherwise, it's a standalone marker on the canvas
      const marker = markers.find((m: any) => m.tag.instanceId === editingEntity.id);
      if (!marker) return null;
      tag = marker.tag;

      updateTagInstance = (updates: any) => {
        updateMarker(marker.id, { tag: { ...tag, ...updates } });
      };
      entityTitle = `Modifier Marqueur: ${tag.name}`;
    }

    entityContent = (
      <div className="flex flex-col h-full w-full">
        {/* Tabs */}
        <div className="flex border-b border-border mb-4 sticky top-0 bg-card z-10 shrink-0">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex-1 ${activeTagTab === 'general' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTagTab('general')}
          >
            Général
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex-1 ${activeTagTab === 'appearance' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTagTab('appearance')}
          >
            Apparence
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex-1 ${activeTagTab === 'fields' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTagTab('fields')}
          >
            Champs
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex-1 ${activeTagTab === 'smartphone' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTagTab('smartphone')}
          >
            Smartphone
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex-1 ${activeTagTab === 'container' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTagTab('container')}
          >
            Container
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-[300px]">
          {activeTagTab === 'general' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Nom</label>
                <input
                  type="text"
                  value={tag.name}
                  onChange={(e) => updateTagInstance({ name: e.target.value })}
                  className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="flex flex-col gap-2 mt-4">
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tag.showInTooltip !== false}
                    onChange={(e) => updateTagInstance({ showInTooltip: e.target.checked })}
                    className="rounded border-border w-4 h-4"
                  />
                  Visible dans l'info-bulle (au survol du joueur)
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tag.showInGameTab !== false}
                    onChange={(e) => updateTagInstance({ showInGameTab: e.target.checked })}
                    className="rounded border-border w-4 h-4"
                  />
                  Visible dans l'onglet Jeu (sous le joueur)
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tag.showOnSmartphone || false}
                    onChange={(e) => updateTagInstance({ showOnSmartphone: e.target.checked })}
                    className="rounded border-border w-4 h-4"
                  />
                  Visible sur smartphone (version joueur)
                </label>
              </div>
            </div>
          )}

          {activeTagTab === 'appearance' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Icône du tag</label>
                <div className="flex flex-wrap gap-1 bg-input border border-border rounded-md p-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {TAG_ICONS.map((iconName: string) => {
                    const IconComponent = icons[iconName as keyof typeof icons];
                    if (!IconComponent) return null;
                    return (
                      <button
                        key={iconName}
                        onClick={() => updateTagInstance({ icon: iconName })}
                        className={`p-2 rounded-md transition-colors flex items-center justify-center ${
                          tag.icon === iconName
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'
                        }`}
                        title={iconName}
                      >
                        {React.createElement(IconComponent as any, { size: 20 })}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Image personnalisée</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await uploadFileToStorage(file);
                        if (url) {
                          updateTagInstance({ imageUrl: url });
                        }
                      }
                    }}
                    className="text-sm flex-1 text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                  {tag.imageUrl && (
                    <button
                      onClick={() => updateTagInstance({ imageUrl: undefined })}
                      className="p-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
                      title="Supprimer l'image"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                {tag.imageUrl && (
                  <div className="mt-2 w-16 h-16 rounded-md overflow-hidden border border-border">
                    <img src={tag.imageUrl} alt={tag.name} className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1 mt-2">
                <label className="text-sm font-medium">Couleur</label>
                <div className="flex items-center gap-3">
                  <ColorPicker
                    color={tag.color}
                    onChange={(c) => updateTagInstance({ color: c })}
                    label="Couleur"
                    className="!w-10 !h-10"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTagTab === 'fields' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium" title="Ordre d'Appel Jour">Appel Jour</label>
                  <input
                    type="text"
                    value={tag.callOrderDay ?? ''}
                    onChange={(e) => updateTagInstance({ callOrderDay: e.target.value })}
                    className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring text-center"
                    placeholder="ex: 5 ou +2"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium" title="Ordre d'Appel Nuit">Appel Nuit</label>
                  <input
                    type="text"
                    value={tag.callOrderNight ?? ''}
                    onChange={(e) => updateTagInstance({ callOrderNight: e.target.value })}
                    className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring text-center"
                    placeholder="ex: 5 ou +2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-muted-foreground">Ajout Vie</label>
                  <input
                    type="text"
                    value={tag.lives ?? ''}
                    onChange={(e) => updateTagInstance({ lives: e.target.value })}
                    className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="ex: 1 ou +1"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-muted-foreground">Votes</label>
                  <input
                    type="text"
                    value={tag.votes ?? ''}
                    onChange={(e) => updateTagInstance({ votes: e.target.value })}
                    className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="ex: 10 ou -2"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-muted-foreground">Points</label>
                  <input
                    type="text"
                    value={tag.points ?? ''}
                    onChange={(e) => updateTagInstance({ points: e.target.value })}
                    className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="ex: 100 ou +50"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-muted-foreground">Uses</label>
                  <input
                    type="text"
                    value={tag.uses ?? ''}
                    onChange={(e) => updateTagInstance({ uses: e.target.value })}
                    className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="ex: 3"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer mt-2">
                    <input
                      type="checkbox"
                      checked={tag.autoDeleteOnZeroUses || false}
                      onChange={(e) => updateTagInstance({ autoDeleteOnZeroUses: e.target.checked })}
                      className="rounded border-border w-3.5 h-3.5"
                    />
                    Suppr. auto à 0
                  </label>
                </div>
              </div>

              <div className="flex gap-4 mb-2">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs font-medium text-muted-foreground">Vu comme rôle (info-bulle)</label>
                  <select
                    value={tag.seenAsRoleId || ''}
                    onChange={(e) => updateTagInstance({ seenAsRoleId: e.target.value || null })}
                    className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">-- Aucun --</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs font-medium text-muted-foreground">Vu dans équipe (info-bulle)</label>
                  <select
                    value={tag.seenInTeamId || ''}
                    onChange={(e) => updateTagInstance({ seenInTeamId: e.target.value || null })}
                    className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">-- Identique à réelle --</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1 mt-2">
                <label className="text-sm font-medium text-muted-foreground">Texte libre</label>
                <textarea
                  value={tag.description || ''}
                  onChange={(e) => updateTagInstance({ description: e.target.value })}
                  className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring min-h-[100px] resize-y"
                  placeholder="Saisissez un texte libre ici..."
                />
              </div>
            </div>
          )}

          {activeTagTab === 'smartphone' && (
            <div className="flex flex-col gap-4">

              <div className="flex flex-col gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <icons.Smartphone size={16} className="text-blue-400" />
                  Interface Smartphone
                </h4>

                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-muted-foreground">Sélection de joueur(s) sur Smartphone</p>
                  <div className="flex flex-col gap-2 bg-background/50 p-2 rounded-md border border-border">
                    <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                      <input
                        type="radio"
                        name="playerSelectorModeInstance"
                        checked={!tag.isMultiPlayerSelector && !tag.isSinglePlayerSelector}
                        onChange={() => updateTagInstance({ isMultiPlayerSelector: false, isSinglePlayerSelector: false })}
                        className="w-4 h-4 text-primary"
                      />
                      Aucun (Action simple)
                    </label>
                    <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                      <input
                        type="radio"
                        name="playerSelectorModeInstance"
                        checked={tag.isSinglePlayerSelector || false}
                        onChange={() => updateTagInstance({ isMultiPlayerSelector: false, isSinglePlayerSelector: true })}
                        className="w-4 h-4 text-primary"
                      />
                      Sélecteur de joueur (le joueur choisit UN joueur)
                    </label>
                    <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                      <input
                        type="radio"
                        name="playerSelectorModeInstance"
                        checked={tag.isMultiPlayerSelector || false}
                        onChange={() => updateTagInstance({ isMultiPlayerSelector: true, isSinglePlayerSelector: false })}
                        className="w-4 h-4 text-primary"
                      />
                      Sélecteur multi-joueurs (le joueur choisit PLUSIEURS joueurs)
                    </label>
                  </div>

                  {(tag.isSinglePlayerSelector || tag.isMultiPlayerSelector) && (
                    <div className="flex flex-col gap-2 mt-2 p-3 bg-muted/20 border-l-2 border-primary/30 rounded-r-lg">
                      <button 
                        onClick={() => setIsSmartphoneFiltersExpanded(!isSmartphoneFiltersExpanded)}
                        className="flex items-center justify-between w-full text-left"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Filtres du sélecteur</span>
                        {isSmartphoneFiltersExpanded ? <icons.ChevronDown size={14} className="text-muted-foreground" /> : <icons.ChevronRight size={14} className="text-muted-foreground" />}
                      </button>

                      {isSmartphoneFiltersExpanded && (
                        <div className="flex flex-col gap-3 mt-1 animate-in slide-in-from-top-1 duration-200">
                          {/* Two-column grid for filters */}
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            <div className="flex flex-col gap-2">
                              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer group">
                                <input type="checkbox" checked={tag.smartphoneFilterAlive || false} onChange={e => updateTagInstance({ smartphoneFilterAlive: e.target.checked })} className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-ring" />
                                <span className="group-hover:text-primary transition-colors">Tout les joueurs vivants</span>
                              </label>
                              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer group">
                                <input type="checkbox" checked={tag.smartphoneFilterDead || false} onChange={e => updateTagInstance({ smartphoneFilterDead: e.target.checked })} className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-ring" />
                                <span className="group-hover:text-primary transition-colors">Tout les joueurs morts</span>
                              </label>
                              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer group">
                                <input type="checkbox" checked={tag.smartphoneFilterMyRole || false} onChange={e => updateTagInstance({ smartphoneFilterMyRole: e.target.checked })} className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-ring" />
                                <span className="group-hover:text-primary transition-colors">Tout les joueurs ayant mon rôle</span>
                              </label>
                              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer group">
                                <input type="checkbox" checked={tag.smartphoneFilterNotMe || false} onChange={e => updateTagInstance({ smartphoneFilterNotMe: e.target.checked })} className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-ring" />
                                <span className="group-hover:text-primary transition-colors">Sauf moi</span>
                              </label>
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer group">
                                <input type="checkbox" checked={tag.smartphoneFilterNotMyRole || false} onChange={e => updateTagInstance({ smartphoneFilterNotMyRole: e.target.checked })} className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-ring" />
                                <span className="group-hover:text-primary transition-colors">Sauf les joueurs ayant mon rôle</span>
                              </label>
                              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer group">
                                <input type="checkbox" checked={tag.smartphoneFilterMyTeam || false} onChange={e => updateTagInstance({ smartphoneFilterMyTeam: e.target.checked })} className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-ring" />
                                <span className="group-hover:text-primary transition-colors">Tout les joueurs de mon équipes</span>
                              </label>
                              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer group">
                                <input type="checkbox" checked={tag.smartphoneFilterNotMyTeam || false} onChange={e => updateTagInstance({ smartphoneFilterNotMyTeam: e.target.checked })} className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-ring" />
                                <span className="group-hover:text-primary transition-colors">Sauf les joueurs de mon équipe</span>
                              </label>
                            </div>
                          </div>

                          {/* Tag selector filter (bottom line) */}
                          <div className="flex items-center gap-2 w-full pt-2 border-t border-border/10">
                            <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer group shrink-0">
                              <input type="checkbox" checked={tag.smartphoneFilterNotThisTag || false} onChange={e => updateTagInstance({ smartphoneFilterNotThisTag: e.target.checked })} className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-ring" />
                              <span className="group-hover:text-primary transition-colors">Sauf les joueurs ayant ce tag :</span>
                            </label>
                            <select 
                              value={tag.smartphoneFilterExcludeTagId || ''} 
                              onChange={e => updateTagInstance({ smartphoneFilterExcludeTagId: e.target.value || null })}
                              className="bg-background border border-border/80 rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-primary flex-1 h-7 text-foreground cursor-pointer hover:border-primary/50 transition-colors shadow-sm"
                              disabled={!tag.smartphoneFilterNotThisTag}
                            >
                              <option value="">Sélectionner un tag...</option>
                              {[...tags].sort((a,b) => a.name.localeCompare(b.name)).map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-border/10">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Information à retourner</span>
                            <div className="flex flex-wrap gap-x-4 gap-y-2">
                              {[
                                { key: 'none', label: 'Aucun' },
                                { key: 'real_role', label: 'Rôle réel' },
                                { key: 'real_team', label: 'Equipe réelle' },
                                { key: 'seen_role', label: 'Vu comme rôle' },
                                { key: 'seen_team', label: 'Vu dans l’équipe' }
                              ].map(info => (
                                <label key={info.key} className="flex items-center gap-2 text-xs text-foreground cursor-pointer group">
                                  <input
                                    type="radio"
                                    name={`returnInfo-instance-${tag.id}`}
                                    checked={(tag.smartphoneReturnInfo || 'none') === info.key}
                                    onChange={() => updateTagInstance({ smartphoneReturnInfo: info.key as any })}
                                    className="w-3.5 h-3.5 text-primary"
                                  />
                                  <span className="group-hover:text-primary transition-colors">{info.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/10">
                            <label className="flex items-center gap-2 text-[11px] text-foreground cursor-pointer group shrink-0">
                              <input 
                                type="checkbox" 
                                checked={tag.smartphoneIsCheckRoleEnabled || false} 
                                onChange={e => updateTagInstance({ smartphoneIsCheckRoleEnabled: e.target.checked })} 
                                className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-ring" 
                              />
                              <span className="group-hover:text-primary transition-colors">A bien le rôle de :</span>
                            </label>
                            <select 
                              value={tag.smartphoneCheckRoleId || ''} 
                              onChange={e => updateTagInstance({ smartphoneCheckRoleId: e.target.value || null })}
                              className="bg-background border border-border/80 rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-primary flex-1 h-7 text-foreground cursor-pointer hover:border-primary/50 transition-colors shadow-sm"
                              disabled={!tag.smartphoneIsCheckRoleEnabled}
                            >
                              <option value="">Sélectionner un rôle...</option>
                              {[...roles].sort((a,b) => a.name.localeCompare(b.name)).map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                              ))}
                            </select>
                          </div>

                          {(tag.isMultiPlayerSelector || false) && tag.smartphoneIsCheckRoleEnabled && (
                            <div className="flex items-center gap-4 mt-1 ml-6">
                              <label className="flex items-center gap-2 text-[10px] text-foreground cursor-pointer group">
                                <input 
                                  type="checkbox" 
                                  checked={tag.smartphoneCheckRoleVague || false} 
                                  onChange={e => updateTagInstance({ smartphoneCheckRoleVague: e.target.checked })} 
                                  className="w-3 h-3 rounded border-border text-primary focus:ring-ring" 
                                />
                                <span className="group-hover:text-primary transition-colors">Réponse vague</span>
                              </label>
                              <label className="flex items-center gap-2 text-[10px] text-foreground cursor-pointer group">
                                <input 
                                  type="checkbox" 
                                  checked={tag.smartphoneCheckRoleCount || false} 
                                  onChange={e => updateTagInstance({ smartphoneCheckRoleCount: e.target.checked })} 
                                  className="w-3 h-3 rounded border-border text-primary focus:ring-ring" 
                                />
                                <span className="group-hover:text-primary transition-colors">Combien</span>
                              </label>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Texte du bouton d'action</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      value={tag.smartphoneButtonText || ''}
                      onChange={(e) => updateTagInstance({ smartphoneButtonText: e.target.value })}
                      placeholder="Ex: Utiliser la potion…"
                      className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring w-1/2"
                    />
                    <label className="flex items-center gap-2 text-[11px] text-foreground cursor-pointer hover:text-primary transition-colors whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={tag.smartphoneShowPastille || false}
                        onChange={(e) => updateTagInstance({ smartphoneShowPastille: e.target.checked })}
                        className="rounded border-border w-3.5 h-3.5 text-primary"
                      />
                      Afficher la pastille tag au dessus du joueur
                    </label>
                  </div>
                  {tag.smartphoneButtonText && (
                    <label className="flex items-center gap-2 text-[11px] text-foreground cursor-pointer mt-1 ml-1 hover:text-primary transition-colors">
                      <input
                        type="checkbox"
                        checked={tag.smartphoneAutoDelete || false}
                        onChange={(e) => updateTagInstance({ smartphoneAutoDelete: e.target.checked })}
                        className="rounded border-border w-3.5 h-3.5 text-primary"
                      />
                      Suppression automatique (efface le tag après clic)
                    </label>
                  )}
                  <p className="text-[10px] text-muted-foreground leading-tight">Si rempli, un bouton apparaît sur le smartphone du joueur possédant ce tag.</p>
                </div>


                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Message retour au smartphone (popup)</label>
                  <input
                    type="text"
                    value={tag.smartphonePlayerFeedback || ''}
                    onChange={(e) => updateTagInstance({ smartphonePlayerFeedback: e.target.value })}
                    placeholder="Ex: Action envoyée au MJ."
                    className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <p className="text-[10px] text-muted-foreground leading-tight">Ce message s'affiche en popup sur le smartphone du joueur quand il appuie sur le bouton.</p>
                </div>


                <div className="flex flex-col gap-1 mt-2">
                  <label className="text-xs font-medium text-muted-foreground">Message retour au MJ (popup)</label>
                  <input
                    type="text"
                    value={tag.smartphoneButtonFeedback || ''}
                    onChange={(e) => updateTagInstance({ smartphoneButtonFeedback: e.target.value })}
                    placeholder="Ex: La sorcière utilise sa potion de vie"
                    className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <p className="text-[10px] text-muted-foreground leading-tight">Ce message s'affiche en popup chez le MJ quand le joueur appuie sur le bouton.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground italic">Fusionner aux joueurs</label>
                    <select
                      value={tag.smartphoneMergeTagId || ''}
                      onChange={(e) => updateTagInstance({ smartphoneMergeTagId: e.target.value || null })}
                      className="bg-background border border-border/80 rounded-md px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground h-9 shadow-sm"
                    >
                      <option value="">-- Aucun --</option>
                      {[...tags].sort((a,b) => a.name.localeCompare(b.name)).map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground italic">Me fusionner ce Tag</label>
                    <select
                      value={tag.smartphoneSelfMergeTagId || ''}
                      onChange={(e) => updateTagInstance({ smartphoneSelfMergeTagId: e.target.value || null })}
                      className="bg-background border border-border/80 rounded-md px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground h-9 shadow-sm"
                    >
                      <option value="">-- Aucun --</option>
                      {[...tags].sort((a,b) => a.name.localeCompare(b.name)).map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1 mt-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground italic">Déclencher une Action</label>
                  <select
                    value={tag.smartphoneActionId || ''}
                    onChange={(e) => updateTagInstance({ smartphoneActionId: e.target.value || null })}
                    className="bg-background border border-border/80 rounded-md px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground h-9 shadow-sm"
                  >
                    <option value="">-- Aucune --</option>
                    {[...actions].sort((a,b) => a.name.localeCompare(b.name)).map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>



                <div className="flex flex-col gap-1 mt-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 italic flex items-center gap-2">
                    <icons.BookOpen size={12} className="text-primary/50" />
                    Associer une Aide de Jeu
                  </label>
                  <select
                    value={tag.handoutId || ''}
                    onChange={(e) => updateTagInstance({ handoutId: e.target.value || null })}
                    className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Aucune (Optionnel)</option>
                    {[...handouts].sort((a,b) => a.name.localeCompare(b.name)).map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-1 bg-primary/5 p-2 rounded border border-primary/10 italic">
                    L'image de cette aide s'affichera dans une galerie sur le smartphone du joueur possédant ce tag.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTagTab === 'container' && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground mb-2">
                Ce tag peut servir de "Container". Lorsqu'il est appliqué à un joueur, tous les tags sélectionnés ici seront appliqués en même temps avec lui.
              </p>
              <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-2 pb-2">
                {tagCategories.map(cat => {
                  const catTags = tagsByCategory[cat.id]?.filter(t => t.id !== tag.id);
                  if (!catTags || catTags.length === 0) return null;
                  
                  const CatIcon = icons[cat.icon as keyof typeof icons] || icons.Folder;
                  const isExpanded = expandedContainerCategories[cat.id] ?? true;

                  const handleToggleCat = () => {
                    setExpandedContainerCategories(prev => ({ ...prev, [cat.id]: !isExpanded }));
                  };

                  return (
                    <div key={cat.id} className="flex flex-col bg-card border border-border rounded-md overflow-hidden">
                      <button 
                        onClick={handleToggleCat}
                        className="flex items-center justify-between bg-muted/50 hover:bg-muted p-2 transition-colors w-full text-left"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <div className="p-1 rounded bg-background shadow-sm" style={{ color: cat.color }}>
                            {React.createElement(CatIcon as any, { size: 14 })}
                          </div>
                          <span className="font-semibold text-sm flex-1">{cat.name}</span>
                          <span className="text-xs text-muted-foreground bg-background px-1.5 rounded-full border border-border">
                            {catTags.length}
                          </span>
                        </div>
                        {isExpanded ? <icons.ChevronDown size={14} className="text-muted-foreground" /> : <icons.ChevronRight size={14} className="text-muted-foreground" />}
                      </button>

                      {isExpanded && (
                        <div className="flex flex-col gap-1 p-2 bg-background/50 border-t border-border">
                          {catTags.map(otherTag => (
                            <label key={otherTag.id} className="flex items-center gap-3 p-2 hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer transition-colors">
                              <input
                                type="checkbox"
                                checked={tag.childTagIds?.includes(otherTag.id) || false}
                                onChange={(e) => {
                                  const currentList = tag.childTagIds || [];
                                  const newList = e.target.checked
                                    ? [...currentList, otherTag.id]
                                    : currentList.filter((id: string) => id !== otherTag.id);
                                  updateTagInstance({ childTagIds: newList });
                                }}
                                className="rounded border-border w-4 h-4"
                              />
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: otherTag.color }} />
                              <span className="text-sm font-medium flex-1">{otherTag.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Uncategorized Tags */}
                {(() => {
                  const noCatTags = tagsByCategory['no-category']?.filter(t => t.id !== tag.id);
                  if (!noCatTags || noCatTags.length === 0) return null;
                  
                  const isExpanded = expandedContainerCategories['no-category'] ?? true;

                  const handleToggleCat = () => {
                    setExpandedContainerCategories(prev => ({ ...prev, ['no-category']: !isExpanded }));
                  };

                  return (
                    <div className="flex flex-col bg-card border border-border rounded-md overflow-hidden">
                      <button 
                        onClick={handleToggleCat}
                        className="flex items-center justify-between bg-muted/50 hover:bg-muted p-2 transition-colors w-full text-left"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <div className="p-1 rounded bg-background shadow-sm text-muted-foreground">
                            <icons.Folder size={14} />
                          </div>
                          <span className="font-semibold text-sm flex-1 text-muted-foreground italic">Sans catégorie</span>
                          <span className="text-xs text-muted-foreground bg-background px-1.5 rounded-full border border-border">
                            {noCatTags.length}
                          </span>
                        </div>
                        {isExpanded ? <icons.ChevronDown size={14} className="text-muted-foreground" /> : <icons.ChevronRight size={14} className="text-muted-foreground" />}
                      </button>
                      
                      {isExpanded && (
                        <div className="flex flex-col gap-1 p-2 bg-background/50 border-t border-border">
                          {noCatTags.map(otherTag => (
                            <label key={otherTag.id} className="flex items-center gap-3 p-2 hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer transition-colors">
                              <input
                                type="checkbox"
                                checked={tag.childTagIds?.includes(otherTag.id) || false}
                                onChange={(e) => {
                                  const currentList = tag.childTagIds || [];
                                  const newList = e.target.checked
                                    ? [...currentList, otherTag.id]
                                    : currentList.filter((id: string) => id !== otherTag.id);
                                  updateTagInstance({ childTagIds: newList });
                                }}
                                className="rounded border-border w-4 h-4"
                              />
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: otherTag.color }} />
                              <span className="text-sm font-medium flex-1">{otherTag.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {tags.filter(t => t.id !== tag.id).length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-4">Aucun autre tag disponible</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } else if (editingEntity.type === 'playerNotes') {
    const player = players.find(p => p.id === editingEntity.id);
    if (!player) return null;

    entityTitle = `Notes privées: ${player.name}`;
    entityContent = (
      <div className="flex flex-col gap-4 min-h-[300px]">
        <div className="flex flex-col gap-2 h-full flex-1">
          <label className="text-sm font-medium text-muted-foreground">Ces notes sont visibles uniquement par vous (MJ)</label>
          <textarea
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
          <textarea
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
          <label className="text-sm font-medium">Nom du son</label>
          <input
            type="text"
            value={btn.name}
            onChange={(e) => updateSoundButton(index, { name: e.target.value })}
            className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder={`Son ${index + 1}`}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Fichier audio (.mp3, .wav, .ogg)</label>
          <div className="flex items-center gap-2">
            <input
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
          {btn.audioUrl && (
            <>
              <div className="text-xs text-green-500 font-medium mt-1 flex items-center gap-1">
                Fichier chargé.
              </div>

              {/* Volume & Test Section */}
              <div className="flex flex-col gap-2 mt-2 p-3 bg-muted/20 rounded-lg border border-border/50">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Volume : {Math.round((btn.volume ?? 1) * 100)}%
                  </label>
                </div>
                <input
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
                        const audio = new Audio(btn.audioUrl);
                        audio.volume = btn.volume ?? 1;
                        audio.onended = () => setIsTesting(false);
                        testAudioRef.current = audio;
                        audio.play();
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
        </div>

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
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = await uploadFileToStorage(file);
                    if (url) {
                      updateSoundButton(index, { imageUrl: url });
                    }
                  }
                }}
                className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
              <input
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
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input
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

  const isWiderModal = editingEntity.type === 'tagModel' || editingEntity.type === 'tagInstance';
  const isRoleModal = editingEntity.type === 'role';

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className={`bg-card w-full ${isRoleModal ? 'max-w-3xl min-h-[500px]' : isWiderModal ? 'max-w-2xl min-h-[400px]' : 'max-w-md'} rounded-xl shadow-xl border border-border flex flex-col overflow-hidden max-h-[90vh]`}>
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <h2 className="font-bold text-lg">{entityTitle}</h2>
          <button
            onClick={handleClose}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className={`p-6 flex-1 flex flex-col ${isWiderModal ? 'overflow-hidden' : ''}`}>
          {entityContent}
        </div>
        <div className="p-4 border-t border-border flex justify-end bg-muted/30">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium"
          >
            Terminé
          </button>
        </div>
      </div>
    </div>
  );
};
