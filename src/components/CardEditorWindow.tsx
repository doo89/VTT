import React, { useState, useRef, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { useVttStore } from '../store';
import type { Role, CardStyle, EntityId } from '../types';
import { uploadFileToStorage } from '../lib/supabase';
import { exportCardAsImage, exportCardsToPdfGrid, captureCardBase64 } from '../lib/utils/card-export';
import { IconPicker } from './IconPicker';

interface CardEditorWindowProps {
  roleId?: EntityId | null; // S'il est fourni, on édite ce rôle, sinon on en crée un nouveau
  onClose: () => void;
}

const DEFAULT_STYLE: CardStyle = {
  backgroundType: 'gradient',
  backgroundColor: '#1a1a1a',
  backgroundGradient: 'linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)',
  borderStyle: 'double',
  borderColor: '#d4af37',
  fontFamily: 'Georgia',
  textColor: '#ffffff',
  titleColor: '#d4af37',
  descriptionColor: '#e0e0e0',
  teamColor: '#a855f7',
  layout: 'image-top',
  imageZoom: 1,
  imageOffset: { x: 0, y: 0 },
  badgePosition: 'top-right'
};

const GOOGLE_FONTS = [
  { name: 'Georgia (Serif classique)', value: 'Georgia, serif' },
  { name: 'Cinzel (Fantasy / Gothique)', value: '"Cinzel", serif' },
  { name: 'Special Elite (Machine à écrire)', value: '"Special Elite", monospace' },
  { name: 'Inter (Moderne & Épuré)', value: '"Inter", sans-serif' },
  { name: 'Almendra (Médiéval)', value: '"Almendra", serif' },
  { name: 'Creepster (Horreur)', value: '"Creepster", cursive' }
];

export const CardEditorWindow: React.FC<CardEditorWindowProps> = ({
  roleId,
  onClose
}) => {
  const { roles, addRole, updateRole, teams } = useVttStore();
  const cardRef = useRef<HTMLDivElement>(null);

  // Charger le rôle existant ou initialiser les valeurs par défaut
  const editingRole = roleId ? roles.find((r: Role) => r.id === roleId) : null;

  const [name, setName] = useState(editingRole?.name || 'Nouveau Rôle');
  const [description, setDescription] = useState(editingRole?.description || 'Description des capacités...');
  const [teamId, setTeamId] = useState<EntityId | null>(editingRole?.teamId || null);
  const [color, setColor] = useState(editingRole?.color || '#ffffff');
  const [lives, setLives] = useState(editingRole?.lives || 1);
  const [isUnique, setIsUnique] = useState(editingRole?.isUnique ?? true);
  const [imageUrl, setImageUrl] = useState(editingRole?.imageUrl || '');
  const [selectedIcon, setSelectedIcon] = useState<string>('HelpCircle');

  // Styles de la carte
  const [cardStyle, setCardStyle] = useState<CardStyle>(
    editingRole?.cardStyle || DEFAULT_STYLE
  );

  // États UI d'édition
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [gradientStart, setGradientStart] = useState('#1f1c2c');
  const [gradientEnd, setGradientEnd] = useState('#928dab');
  const [gradientAngle, setGradientAngle] = useState(135);

  // Mettre à jour la chaîne de dégradé lorsque les couleurs ou l'angle changent
  useEffect(() => {
    if (cardStyle.backgroundType === 'gradient') {
      setCardStyle(prev => ({
        ...prev,
        backgroundGradient: `linear-gradient(${gradientAngle}deg, ${gradientStart} 0%, ${gradientEnd} 100%)`
      }));
    }
  }, [gradientStart, gradientEnd, gradientAngle, cardStyle.backgroundType]);

  // Charger les Google Fonts requis pour la prévisualisation
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Special+Elite&family=Almendra:ital,wght@0,400;0,700;1,400&family=Creepster&family=Inter:wght@400;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadFileToStorage(file);
      if (url) {
        setImageUrl(url);
      } else {
        alert("Erreur lors de l'upload de l'image. Veuillez vérifier la connexion Supabase.");
      }
    } catch (err) {
      console.error(err);
      alert("Une erreur inattendue est survenue.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    const roleData = {
      name,
      description,
      teamId,
      color,
      lives,
      isUnique,
      imageUrl: imageUrl || undefined,
      tags: editingRole?.tags || [],
      smartphoneImageStyle: editingRole?.smartphoneImageStyle || 'original',
      cardStyle
    };

    if (editingRole) {
      updateRole(editingRole.id, roleData);
    } else {
      addRole(roleData);
    }
    onClose();
  };

  const handleExportPng = async () => {
    if (!cardRef.current) return;
    await exportCardAsImage(cardRef.current, name, 'png');
  };

  const handleExportPdf = async () => {
    if (!cardRef.current) return;
    const base64 = await captureCardBase64(cardRef.current);
    if (base64) {
      await exportCardsToPdfGrid([base64], `carte_${name.replace(/\s+/g, '_')}.pdf`);
    }
  };

  // Trouver l'équipe sélectionnée pour obtenir sa couleur/icône par défaut
  const selectedTeam = teams.find((t: any) => t.id === teamId);

  // Déterminer la bordure CSS en fonction du style choisi
  const getBorderStyle = (): React.CSSProperties => {
    const borderColor = cardStyle.borderColor || '#d4af37';
    switch (cardStyle.borderStyle) {
      case 'thin':
        return { border: `2px solid ${borderColor}` };
      case 'double':
        return { border: `6px double ${borderColor}` };
      case 'gothic':
        return {
          border: `4px double ${borderColor}`,
          boxShadow: 'inset 0 0 15px rgba(0, 0, 0, 0.9), 0 5px 15px rgba(0,0,0,0.5)',
          borderRadius: '4px'
        };
      case 'neon':
        return {
          border: `2px solid ${borderColor}`,
          boxShadow: `0 0 10px ${borderColor}, inset 0 0 10px ${borderColor}`,
          borderRadius: '8px'
        };
      case 'fantasy':
        return {
          border: `3px solid ${borderColor}`,
          outline: `1px solid ${borderColor}`,
          outlineOffset: '-4px',
          borderRadius: '12px'
        };
      case 'none':
      default:
        return { border: 'none' };
    }
  };

  // Obtenir le style de fond CSS
  const getBackgroundStyle = (): React.CSSProperties => {
    switch (cardStyle.backgroundType) {
      case 'color':
        return { backgroundColor: cardStyle.backgroundColor };
      case 'gradient':
        return { background: cardStyle.backgroundGradient };
      case 'image':
        return {
          backgroundImage: `url(${cardStyle.backgroundImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: cardStyle.backgroundImagePosition || 'center'
        };
      default:
        return { backgroundColor: '#1a1a1a' };
    }
  };

  // Composant d'affichage d'icône dynamique
  const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
    const IconComponent = (Icons as any)[name] || Icons.HelpCircle;
    return <IconComponent className={className} />;
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[999] overflow-y-auto p-4 md:p-6 text-neutral-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <Icons.Layers className="h-6 w-6 text-amber-500" />
            <h2 className="text-xl font-bold tracking-wide">
              {editingRole ? 'Modifier le Rôle' : 'Créateur de Cartes de Rôle'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-neutral-800 rounded-lg transition-all text-neutral-400 hover:text-neutral-200">
            <Icons.X className="h-6 w-6" />
          </button>
        </div>

        {/* Content Wrapper */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel: Form controls */}
          <div className="space-y-6 pr-2">
            {/* Infos de base */}
            <div className="bg-neutral-950/40 p-4 border border-neutral-800 rounded-xl space-y-4">
              <h3 className="text-sm font-semibold text-amber-500 uppercase tracking-wider">Informations du Rôle</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">Nom du Rôle</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 transition-all text-neutral-200 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">Équipe</label>
                  <select
                    value={teamId || ''}
                    onChange={(e) => {
                      const id = e.target.value;
                      setTeamId(id || null);
                      const t = teams.find((x: any) => x.id === id);
                      if (t) {
                        setCardStyle(prev => ({ ...prev, teamColor: t.color }));
                      }
                    }}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 transition-all text-neutral-200"
                  >
                    <option value="">Neutre / Sans équipe</option>
                    {teams.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Description des Pouvoirs</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 transition-all text-neutral-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">Points de Vie (Vies)</label>
                  <input
                    type="number"
                    min={0}
                    value={lives}
                    onChange={(e) => setLives(parseInt(e.target.value) || 1)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 transition-all text-neutral-200"
                  />
                </div>
                <div className="flex items-center justify-start h-full pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-400 select-none">
                    <input
                      type="checkbox"
                      checked={isUnique}
                      onChange={(e) => setIsUnique(e.target.checked)}
                      className="accent-amber-500 h-4 w-4"
                    />
                    Unique (une seule carte en jeu)
                  </label>
                </div>
              </div>
            </div>

            {/* Design & WYSIWYG */}
            <div className="bg-neutral-950/40 p-4 border border-neutral-800 rounded-xl space-y-4">
              <h3 className="text-sm font-semibold text-amber-500 uppercase tracking-wider">Style & Design (WYSIWYG)</h3>

              {/* Background style */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-neutral-400">Type d'arrière-plan</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['color', 'gradient', 'image'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setCardStyle(prev => ({ ...prev, backgroundType: type }))}
                      className={`py-1.5 px-3 rounded-lg border text-xs font-medium capitalize transition-all ${
                        cardStyle.backgroundType === type
                          ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      {type === 'color' ? 'Couleur' : type === 'gradient' ? 'Dégradé' : 'Image URL'}
                    </button>
                  ))}
                </div>

                {cardStyle.backgroundType === 'color' && (
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">Couleur de fond</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={cardStyle.backgroundColor}
                        onChange={(e) => setCardStyle(prev => ({ ...prev, backgroundColor: e.target.value }))}
                        className="h-8 w-12 rounded border border-neutral-700 cursor-pointer bg-neutral-950"
                      />
                      <input
                        type="text"
                        value={cardStyle.backgroundColor}
                        onChange={(e) => setCardStyle(prev => ({ ...prev, backgroundColor: e.target.value }))}
                        className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs"
                      />
                    </div>
                  </div>
                )}

                {cardStyle.backgroundType === 'gradient' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Début dégradé</label>
                        <input
                          type="color"
                          value={gradientStart}
                          onChange={(e) => setGradientStart(e.target.value)}
                          className="h-8 w-full rounded border border-neutral-700 cursor-pointer bg-neutral-950"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Fin dégradé</label>
                        <input
                          type="color"
                          value={gradientEnd}
                          onChange={(e) => setGradientEnd(e.target.value)}
                          className="h-8 w-full rounded border border-neutral-700 cursor-pointer bg-neutral-950"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1">Angle ({gradientAngle}°)</label>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={gradientAngle}
                        onChange={(e) => setGradientAngle(parseInt(e.target.value))}
                        className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {cardStyle.backgroundType === 'image' && (
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">URL de l'image de fond</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={cardStyle.backgroundImageUrl || ''}
                      onChange={(e) => setCardStyle(prev => ({ ...prev, backgroundImageUrl: e.target.value }))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-300 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Borders and typography */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">Style de bordure</label>
                  <select
                    value={cardStyle.borderStyle}
                    onChange={(e) => setCardStyle(prev => ({ ...prev, borderStyle: e.target.value as any }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none text-neutral-200"
                  >
                    <option value="none">Sans bordure</option>
                    <option value="thin">Fine</option>
                    <option value="double">Double classique</option>
                    <option value="gothic">Gothique sombre</option>
                    <option value="neon">Néon lumineux</option>
                    <option value="fantasy">Fantasy ornements</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">Couleur bordure</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={cardStyle.borderColor}
                      onChange={(e) => setCardStyle(prev => ({ ...prev, borderColor: e.target.value }))}
                      className="h-9 w-12 rounded border border-neutral-700 cursor-pointer bg-neutral-950"
                    />
                    <input
                      type="text"
                      value={cardStyle.borderColor}
                      onChange={(e) => setCardStyle(prev => ({ ...prev, borderColor: e.target.value }))}
                      className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">Police d'écriture</label>
                  <select
                    value={cardStyle.fontFamily}
                    onChange={(e) => setCardStyle(prev => ({ ...prev, fontFamily: e.target.value }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none text-neutral-200"
                  >
                    {GOOGLE_FONTS.map(f => (
                      <option key={f.value} value={f.value}>{f.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">Couleur des textes</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={cardStyle.textColor}
                      onChange={(e) => setCardStyle(prev => ({ ...prev, textColor: e.target.value }))}
                      className="h-9 w-12 rounded border border-neutral-700 cursor-pointer bg-neutral-950"
                    />
                    <input
                      type="text"
                      value={cardStyle.textColor}
                      onChange={(e) => setCardStyle(prev => ({ ...prev, textColor: e.target.value }))}
                      className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Illustration de la carte */}
            <div className="bg-neutral-950/40 p-4 border border-neutral-800 rounded-xl space-y-4">
              <h3 className="text-sm font-semibold text-amber-500 uppercase tracking-wider">Illustration / Icône</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">Illustration principale</label>
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="URL d'image externe..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-300"
                    />
                    <div className="flex items-center gap-2">
                      <label className="flex-1 cursor-pointer bg-neutral-800 hover:bg-neutral-700 text-neutral-200 py-1.5 px-3 rounded-lg text-xs font-medium text-center transition-all">
                        {isUploading ? 'Téléversement...' : 'Uploader un fichier'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={isUploading}
                          className="hidden"
                        />
                      </label>
                      {imageUrl && (
                        <button
                          onClick={() => setImageUrl('')}
                          className="p-1.5 bg-red-950/50 border border-red-900 rounded-lg text-red-400 hover:bg-red-900 hover:text-red-200 transition-all text-xs"
                        >
                          Retirer
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">Icône alternative (Lucide)</label>
                  <div className="relative">
                    <button
                      onClick={() => setShowIconPicker(!showIconPicker)}
                      className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-lg px-3 py-2 text-sm flex items-center justify-between text-neutral-300"
                    >
                      <span className="flex items-center gap-2">
                        <DynamicIcon name={selectedIcon} className="h-5 w-5 text-amber-500" />
                        {selectedIcon}
                      </span>
                      <Icons.ChevronDown className="h-4 w-4 text-neutral-500" />
                    </button>

                    {showIconPicker && (
                      <div className="absolute z-[1000] top-full right-0 mt-2">
                        <IconPicker
                          selectedIcon={selectedIcon}
                          onChange={(icon) => {
                            setSelectedIcon(icon);
                            setShowIconPicker(false);
                          }}
                          onClose={() => setShowIconPicker(false)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Disposition de l'image */}
              {imageUrl && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1">Zoom ({Math.round((cardStyle.imageZoom ?? 1) * 100)}%)</label>
                      <input
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.1"
                        value={cardStyle.imageZoom ?? 1}
                        onChange={(e) => setCardStyle(prev => ({ ...prev, imageZoom: parseFloat(e.target.value) }))}
                        className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 mb-1">Agencement</label>
                      <select
                        value={cardStyle.layout}
                        onChange={(e) => setCardStyle(prev => ({ ...prev, layout: e.target.value as any }))}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200"
                      >
                        <option value="image-top">Image haut</option>
                        <option value="image-center">Image centre</option>
                        <option value="image-background">Image en arrière-plan</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Live Card Preview & Exports */}
          <div className="flex flex-col items-center justify-between border-l border-neutral-800/50 pl-6 gap-6 min-h-[500px]">
            <div className="w-full flex justify-center py-4">
              {/* Le conteneur de la carte - format physique Poker standard (largeur/hauteur ~ 6.3cm x 8.8cm -> ratio ~ 1.4) */}
              <div
                ref={cardRef}
                style={{
                  ...getBorderStyle(),
                  ...getBackgroundStyle(),
                  fontFamily: cardStyle.fontFamily,
                  color: cardStyle.textColor,
                  aspectRatio: '63/88',
                  width: '280px'
                }}
                className="rounded-xl relative overflow-hidden flex flex-col p-4 shadow-2xl select-none"
              >
                {/* Header (Nom + Vies) */}
                <div className="flex justify-between items-start z-10">
                  <h4
                    style={{ color: cardStyle.titleColor || cardStyle.textColor }}
                    className="font-bold text-lg tracking-wide drop-shadow-md truncate max-w-[80%]"
                  >
                    {name}
                  </h4>
                  {lives > 0 && (
                    <div className="bg-red-650 border border-red-500 px-2 py-0.5 rounded-md flex items-center gap-0.5 text-xs font-bold shadow-md">
                      <Icons.Heart className="h-3 w-3 fill-white text-white" />
                      <span>{lives}</span>
                    </div>
                  )}
                </div>

                {/* Subtitle / Équipe */}
                {selectedTeam && (
                  <div
                    style={{
                      backgroundColor: cardStyle.teamColor || selectedTeam.color,
                      color: '#ffffff'
                    }}
                    className="z-10 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mt-1 w-max shadow-sm"
                  >
                    {selectedTeam.name}
                  </div>
                )}

                {/* Zone Illustration / Icône */}
                <div className="flex-1 flex items-center justify-center relative my-3 overflow-hidden rounded-lg bg-neutral-950/40 border border-neutral-850/50 min-h-[120px]">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={name}
                      style={{
                        transform: `scale(${cardStyle.imageZoom ?? 1}) translate(${cardStyle.imageOffset?.x || 0}px, ${cardStyle.imageOffset?.y || 0}px)`,
                        objectFit: cardStyle.layout === 'image-background' ? 'cover' : 'contain'
                      }}
                      className="w-full h-full object-center transition-all duration-75"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-neutral-500/80">
                      <DynamicIcon name={selectedIcon} className="h-16 w-16 mb-2 stroke-[1.2]" />
                    </div>
                  )}
                </div>

                {/* Capacités / Description */}
                <div
                  style={{ color: cardStyle.descriptionColor || cardStyle.textColor }}
                  className="z-10 bg-black/60 backdrop-blur-sm border border-neutral-800/40 rounded-lg p-2.5 text-[11px] leading-relaxed max-h-[85px] overflow-y-auto"
                >
                  {description}
                </div>

                {/* Footer décoratif ou ID unique */}
                <div className="flex justify-between items-center text-[8px] text-neutral-500/80 mt-2 z-10 pt-1 border-t border-neutral-800/30">
                  <span>VTT APP ROLE GENERATOR</span>
                  <span>{isUnique ? 'UNIQUE' : 'STANDART'}</span>
                </div>
              </div>
            </div>

            {/* Action buttons under card */}
            <div className="w-full space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleExportPng}
                  className="flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-750 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-md active:scale-95"
                >
                  <Icons.Download className="h-4 w-4" />
                  Exporter PNG
                </button>
                <button
                  onClick={handleExportPdf}
                  className="flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-750 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-md active:scale-95"
                >
                  <Icons.FileText className="h-4 w-4" />
                  Planche PDF
                </button>
              </div>

              <div className="flex gap-3 pt-2 border-t border-neutral-800">
                <button
                  onClick={onClose}
                  className="flex-1 bg-neutral-950 border border-neutral-850 hover:bg-neutral-850 hover:text-neutral-200 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-neutral-950 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all shadow-lg shadow-amber-500/15"
                >
                  {editingRole ? 'Enregistrer' : 'Créer le Rôle'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
