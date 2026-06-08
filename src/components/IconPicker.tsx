import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { Search } from 'lucide-react';

interface IconPickerProps {
  selectedIcon: string;
  onChange: (iconName: string) => void;
  onClose?: () => void;
}

// Une sélection d'icônes adaptées aux jeux de plateau / rôle
const SUGGESTED_ICONS = [
  'Sword', 'Shield', 'Skull', 'Eye', 'Moon', 'Sun', 'Heart', 'Ghost', 'Flame',
  'Crown', 'Scroll', 'Compass', 'Book', 'Map', 'Key', 'Lock', 'Unlock', 'Hourglass',
  'Wrench', 'Hammer', 'Anchor', 'Gem', 'Trophy', 'Activity', 'AlertTriangle',
  'Award', 'Bell', 'Bomb', 'Briefcase', 'Camera', 'Cloud', 'Coins', 'Crosshair',
  'Feather', 'Fingerprint', 'Flag', 'Gift', 'HelpCircle', 'Home', 'Info', 'Leaf',
  'Lightbulb', 'MapPin', 'Music', 'PenTool', 'Search', 'Send', 'Settings', 'Share2',
  'Star', 'ThumbsUp', 'Trash2', 'User', 'Users', 'Zap', 'Wind', 'Dribbble', 'Compass'
];

export const IconPicker: React.FC<IconPickerProps> = ({
  selectedIcon,
  onChange,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrer les icônes disponibles dynamiquement
  const filteredIcons = SUGGESTED_ICONS.filter(name =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-4 shadow-xl w-64 max-h-80 flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
        <span className="text-sm font-semibold text-neutral-200">Choisir une icône</span>
        {onClose && (
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 text-xs"
          >
            Fermer
          </button>
        )}
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-700"
        />
      </div>

      {/* Grille d'icônes */}
      <div className="flex-1 overflow-y-auto grid grid-cols-5 gap-2 pr-1 min-h-[150px]">
        {filteredIcons.map((iconName) => {
          // Résoudre l'icône dynamiquement depuis l'objet Icons
          const IconComponent = (Icons as any)[iconName] || Icons.HelpCircle;

          return (
            <button
              key={iconName}
              title={iconName}
              onClick={() => {
                onChange(iconName);
                if (onClose) onClose();
              }}
              className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                selectedIcon === iconName
                  ? 'bg-neutral-800 text-amber-400 border border-amber-500/50'
                  : 'bg-neutral-950 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 border border-transparent'
              }`}
            >
              <IconComponent className="h-5 w-5" />
            </button>
          );
        })}
        {filteredIcons.length === 0 && (
          <div className="col-span-5 text-center text-xs text-neutral-500 py-6">
            Aucune icône trouvée
          </div>
        )}
      </div>
    </div>
  );
};
