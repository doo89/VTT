import React from 'react';
import { useVttStore } from '../store';
import { X, Trash2, icons } from 'lucide-react';
import { uploadImageToStorage, deleteImageFromStorage } from '../lib/supabase';
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

const TAG_ICONS = [
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
  const { editingEntity, setEditingEntity, players, playerTemplates, roles, teams, tags, tagCategories, markers, soundboard, handouts, updatePlayer, updatePlayerTemplate, updateRole, updateTeam, updateTagModel, updateTagCategory, updateMarker, updateSoundButton, removeSoundButton, addLog } = useVttStore();
  const [activeTagTab, setActiveTagTab] = React.useState<'general' | 'appearance' | 'fields' | 'container' | 'smartphone'>('general');
  const [expandedContainerCategories, setExpandedContainerCategories] = React.useState<Record<string, boolean>>({});

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

  if (editingEntity.type === 'tagCategory') {
    const category = tagCategories.find(c => c.id === editingEntity.id);
    if (!category) return null;
    entityTitle = "Modifier la Catégorie";
    entityContent = (
      <>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Nom</label>
          <input
            type="text"
            value={category.name}
            onChange={(e) => updateTagCategory(category.id, { name: e.target.value })}
            className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex flex-col gap-1.5 mt-2">
          <label className="text-xs font-medium text-muted-foreground">Icône</label>
          <div className="flex flex-wrap gap-1 bg-input border border-border rounded-md p-1.5 max-h-32 overflow-y-auto custom-scrollbar">
            {['Folder', 'Bookmark', 'Layers', 'Boxes', 'Library', 'List', 'Hash'].map(iconName => {
              const IconComponent = icons[iconName as keyof typeof icons];
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
                  {React.createElement(IconComponent, { size: 16 })}
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-2">
          <ColorPicker color={category.color} onChange={(c) => updateTagCategory(category.id, { color: c })} label="Couleur de la catégorie" />
        </div>
      </>
    );
  } else if (editingEntity.type === 'playerTemplate') {
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
          <label className="text-sm font-medium">Image / Icône (Modèle)</label>
          <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = await uploadImageToStorage(file);
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
                        if (template.imageUrl) await deleteImageFromStorage(template.imageUrl);
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
          <label className="text-sm font-medium">Image / Icône</label>
          <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = await uploadImageToStorage(file);
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
                        if (player.imageUrl) await deleteImageFromStorage(player.imageUrl);
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
        <div className="flex items-center gap-2 mt-2">
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
      </div>
    );
  } else if (editingEntity.type === 'role') {
    const role = roles.find(r => r.id === editingEntity.id);
    if (!role) return null;

    entityTitle = `Modifier Rôle: ${role.name}`;
    entityContent = (
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
        <div className="flex gap-4">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-sm font-medium">Vies</label>
            <input
              type="number"
              value={role.lives}
              onChange={(e) => updateRole(role.id, { lives: parseInt(e.target.value) || 0 })}
              className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Couleur</label>
            <ColorPicker
              color={role.color}
              onChange={(c) => updateRole(role.id, { color: c })}
              label="Couleur"
              className="!w-10 !h-10"
            />
          </div>
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

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Image du rôle</label>
            <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = await uploadImageToStorage(file);
                      if (url) {
                        updateRole(role.id, { imageUrl: url });
                      }
                    }
                  }}
                  className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                />
                <input
                  type="text"
                  value={role.imageUrl || ''}
                  onChange={(e) => updateRole(role.id, { imageUrl: e.target.value })}
                  placeholder="Ou collez l'URL d'une image ici..."
                  className="bg-input border border-border rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring flex-1"
                />
              </div>

              {role.imageUrl && (
                <div className="flex items-center gap-3 mt-1 pt-2 border-t border-border/30">
                  <img src={role.imageUrl} alt="Preview" className="w-14 h-14 rounded-md object-cover border-2 border-primary/20 shadow-sm" />
                  <div className="flex flex-col flex-1">
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Aperçu & Style Smartphone</span>
                    <div className="flex items-center gap-2">
                      <select
                        value={role.smartphoneImageStyle || 'circle'}
                        onChange={(e) => updateRole(role.id, { smartphoneImageStyle: e.target.value as any })}
                        className="bg-background border border-border rounded px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-ring flex-1"
                      >
                        <option value="circle">Rond</option>
                        <option value="square">Carré</option>
                        <option value="original">Taille réelle</option>
                        <option value="background">Fond de carte</option>
                      </select>
                      <button
                        onClick={async () => {
                          if (role.imageUrl) await deleteImageFromStorage(role.imageUrl);
                          updateRole(role.id, { imageUrl: undefined });
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

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Description libre</label>
            <textarea
              value={role.description || ''}
              onChange={(e) => updateRole(role.id, { description: e.target.value })}
              placeholder="Ex: Si tué la nuit, ressuscite le lendemain..."
              className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring min-h-[80px]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Tags attachés</label>
            {tags.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Aucun tag défini dans le jeu.</p>
            ) : (
              <select
                multiple
                value={(role.tags || []).map(t => t.id)}
                onChange={(e) => {
                  const options = Array.from(e.target.selectedOptions);
                  const selectedTagIds = options.map(o => o.value);
                  const newTags = tags.filter(t => selectedTagIds.includes(t.id));
                  updateRole(role.id, { tags: newTags });
                }}
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-ring focus:border-input outline-none h-24 custom-scrollbar"
                title="Maintenez Ctrl (ou Cmd) pour sélectionner plusieurs tags."
              >
                {tags.map(tag => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
            )}
            <span className="text-[10px] text-muted-foreground leading-tight mt-1">
              Maintenez <kbd className="bg-muted px-1 rounded">Ctrl</kbd> ou <kbd className="bg-muted px-1 rounded">Cmd</kbd> pour sélectionner plusieurs tags.
            </span>
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
          <label className="text-sm font-medium">Icône de l'équipe</label>
          <div className="flex flex-wrap gap-1.5 bg-input border border-border rounded-md p-2 max-h-40 overflow-y-auto">
            {TEAM_ICONS.map(iconName => {
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
                  {React.createElement(IconComponent, { size: 20 })}
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
              </div>
            </div>
          )}

          {activeTagTab === 'container' && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground mb-2">
                Ce tag peut servir de "Container". Lorsqu'il est appliqué à un joueur, tous les tags sélectionnés ici seront appliqués en même temps avec lui.
              </p>
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2 pb-2">
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
                            <CatIcon size={14} />
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
                  {TAG_ICONS.map(iconName => {
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
                        {React.createElement(IconComponent, { size: 20 })}
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
                          const url = await uploadImageToStorage(file);
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
                            if (tag.imageUrl) await deleteImageFromStorage(tag.imageUrl);
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
              <div className="flex flex-col gap-1 mt-4">
                <label className="text-sm font-medium text-muted-foreground">Associer une Aide de Jeu</label>
                <select
                  value={tag.handoutId || ''}
                  onChange={(e) => updateTagModel(tag.id, { handoutId: e.target.value || null })}
                  className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Aucune (Optionnel)</option>
                  {handouts.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  L'image de cette aide s'affichera dans une galerie sur le smartphone du joueur possédant ce tag.
                </p>
              </div>

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
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Texte du bouton</label>
                  <input
                    type="text"
                    value={tag.smartphoneButtonText || ''}
                    onChange={(e) => updateTagModel(tag.id, { smartphoneButtonText: e.target.value })}
                    placeholder="Ex: Utiliser la potion"
                    className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Retour au MJ (popup)</label>
                  <input
                    type="text"
                    value={tag.smartphoneButtonFeedback || ''}
                    onChange={(e) => updateTagModel(tag.id, { smartphoneButtonFeedback: e.target.value })}
                    placeholder="Ex: La sorciere utilise sa potion de vie"
                    className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <p className="text-[10px] text-muted-foreground leading-tight">Ce message s'affiche en popup chez le MJ quand le joueur appuie sur le bouton.</p>
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

                  {(tag.isSinglePlayerSelector || tag.isMultiPlayerSelector) && (
                    <div className="ml-4 flex flex-col gap-2 mt-2 p-3 bg-muted/20 border-l-2 border-primary/30 rounded-r-lg">
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
                              className="w-3.5 h-3.5 text-primary"
                            />
                            <span className="group-hover:text-primary transition-colors">{info.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer mt-1 ml-4">
                  <input
                    type="checkbox"
                    checked={tag.smartphoneShowPastille || false}
                    onChange={(e) => updateTagModel(tag.id, { smartphoneShowPastille: e.target.checked })}
                    className="rounded border-border w-4 h-4"
                  />
                  Afficher la pastille tag au dessus du joueur
                </label>

                <div className="flex flex-col gap-1 mt-2">
                  <label className="text-xs font-medium text-muted-foreground">Fusionner ce Tag</label>
                  <select
                    value={tag.smartphoneMergeTagId || ''}
                    onChange={(e) => updateTagModel(tag.id, { smartphoneMergeTagId: e.target.value || null })}
                    className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">-- Aucun --</option>
                    {tags.filter(t => t.id !== tag.id).map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={tag.smartphoneAutoDelete || false}
                    onChange={(e) => updateTagModel(tag.id, { smartphoneAutoDelete: e.target.checked })}
                    className="rounded border-border w-4 h-4"
                  />
                  Suppression automatique (efface le tag après clic)
                </label>
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
                  {TAG_ICONS.map(iconName => {
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
                        {React.createElement(IconComponent, { size: 20 })}
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
                        const url = await uploadImageToStorage(file);
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
              <div className="flex flex-col gap-1 mt-4">
                <label className="text-sm font-medium text-muted-foreground">Associer une Aide de Jeu</label>
                <select
                  value={tag.handoutId || ''}
                  onChange={(e) => updateTagInstance({ handoutId: e.target.value || null })}
                  className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Aucune (Optionnel)</option>
                  {handouts.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  L'image de cette aide s'affichera dans une galerie sur le smartphone du joueur possédant ce tag.
                </p>
              </div>

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
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Texte du bouton d'action</label>
                  <input
                    type="text"
                    value={tag.smartphoneButtonText || ''}
                    onChange={(e) => updateTagInstance({ smartphoneButtonText: e.target.value })}
                    placeholder="Ex: Utiliser la potion…"
                    className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <p className="text-[10px] text-muted-foreground leading-tight">Si rempli, un bouton apparaît sur le smartphone du joueur possédant ce tag.</p>
                </div>

                <div className="flex flex-col gap-1">
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

                  {(tag.isSinglePlayerSelector || tag.isMultiPlayerSelector) && (
                    <div className="ml-4 flex flex-col gap-2 mt-2 p-3 bg-muted/20 border-l-2 border-primary/30 rounded-r-lg">
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
                  )}
                </div>

                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer mt-1 ml-4">
                  <input
                    type="checkbox"
                    checked={tag.smartphoneShowPastille || false}
                    onChange={(e) => updateTagInstance({ smartphoneShowPastille: e.target.checked })}
                    className="rounded border-border w-4 h-4"
                  />
                  Afficher la pastille tag au dessus du joueur
                </label>

                <div className="flex flex-col gap-1 mt-2">
                  <label className="text-xs font-medium text-muted-foreground">Fusionner ce Tag</label>
                  <select
                    value={tag.smartphoneMergeTagId || ''}
                    onChange={(e) => updateTagInstance({ smartphoneMergeTagId: e.target.value || null })}
                    className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">-- Aucun --</option>
                    {tags.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={tag.smartphoneAutoDelete || false}
                    onChange={(e) => updateTagInstance({ smartphoneAutoDelete: e.target.checked })}
                    className="rounded border-border w-4 h-4"
                  />
                  Suppression automatique (efface le tag après clic)
                </label>
              </div>
            </div>
          )}

          {activeTagTab === 'container' && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground mb-2">
                Ce tag peut servir de "Container". Lorsqu'il est appliqué à un joueur, tous les tags sélectionnés ici seront appliqués en même temps avec lui.
              </p>
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2 pb-2">
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
                            <CatIcon size={14} />
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
            <div className="text-xs text-green-500 font-medium mt-1 flex items-center gap-1">
              Fichier chargé.
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1 mt-2">
          <label className="text-sm font-medium">Icône</label>
          <div className="flex flex-wrap gap-1 bg-input border border-border rounded-md p-2 max-h-32 overflow-y-auto custom-scrollbar">
            {TAG_ICONS.map(iconName => {
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
                  {React.createElement(IconComponent, { size: 16 })}
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
                    const url = await uploadImageToStorage(file);
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
                      if (btn.imageUrl) await deleteImageFromStorage(btn.imageUrl);
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

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className={`bg-card w-full ${isWiderModal ? 'max-w-2xl min-h-[400px]' : 'max-w-md'} rounded-xl shadow-xl border border-border flex flex-col overflow-hidden`}>
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
