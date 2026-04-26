import React, { useState, useRef } from 'react';
import { X, PaintBucket, Users, Smartphone, Settings as SettingsIcon, Image as ImageIcon, Trash2, ArrowUpRight, Grid3X3, Sun, UserCircle2, Tag, ChevronDown, ChevronRight, Moon } from 'lucide-react';
import * as icons from 'lucide-react';
import { useVttStore } from '../../store';
import { ColorPicker } from '../ColorPicker';
import { ThemeToggle } from '../ThemeToggle';
import type { BadgeConfig, BadgeType } from '../../types';


interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'salle' | 'joueurs' | 'tags' | 'smartphone' | 'outils' | 'remote'>('salle');
  const [expandedOutils, setExpandedOutils] = useState<Record<string, boolean>>({ distribution: true, chrono: true, wiki: true, soundboard: true, scoreboard: true, logs: true });
  const [expandedSmartphone, setExpandedSmartphone] = useState<Record<string, boolean>>({ game: true, players: true, room: true, wiki: true });

  const {
    room, setRoom,
    grid, setGrid,
    cycleMode, setCycleMode,
    displaySettings, updateDisplaySettings,
    soundboard, setSoundboard,
    scoreboard, setScoreboard
  } = useVttStore();

  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setRoom({ backgroundImage: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-popover text-popover-foreground rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-border" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/50">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <SettingsIcon size={24} className="text-blue-500" />
            Paramètres
          </h2>
          <button 
            onClick={onClose} 
            className="text-muted-foreground hover:text-foreground hover:bg-accent p-1.5 rounded transition-colors"
            title="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border bg-muted/20 px-2 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('salle')}
            className={`px-4 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'salle' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <PaintBucket size={16} /> Salle & Autres
          </button>
          <button
            onClick={() => setActiveTab('joueurs')}
            className={`px-4 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'joueurs' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <Users size={16} /> Joueurs
          </button>
          <button
            onClick={() => setActiveTab('tags')}
            className={`px-4 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'tags' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <Tag size={16} /> Tags
          </button>
          <button
            onClick={() => setActiveTab('smartphone')}
            className={`px-4 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'smartphone' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <Smartphone size={16} /> Smartphone
          </button>
          <button
            onClick={() => setActiveTab('outils')}
            className={`px-4 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'outils' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <SettingsIcon size={16} /> Outils
          </button>
          <button
            onClick={() => setActiveTab('remote')}
            className={`px-4 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'remote' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <Smartphone size={16} /> Télécommande
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-background">
          
          {/* TAB: SALLE & AUTRES */}
          {activeTab === 'salle' && (
             <div className="flex flex-col gap-6">
               {/* Options Globales */}
               <section>
                 <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2 mb-3">Options Globales</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                   <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Type de cycle</label>
                    <select
                      value={cycleMode}
                      onChange={(e) => setCycleMode(e.target.value as any)}
                      className="bg-input border border-border rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-full max-w-[200px]"
                    >
                      <option value="dayNight">Jour/Nuit</option>
                      <option value="turns">Par tour</option>
                      <option value="none">Aucun</option>
                    </select>

                   </div>
                   <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Priorité au premier plan</label>
                    <select
                      value={displaySettings.foregroundElement}
                      onChange={(e) => updateDisplaySettings({ foregroundElement: e.target.value as any })}
                      className="bg-input border border-border rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-full max-w-[200px]"
                    >
                      <option value="players">Joueurs</option>
                      <option value="markers">Marqueurs</option>
                    </select>
                   </div>
                   
                     <div className="flex flex-col gap-3">
                       <label className="flex items-center gap-2 text-sm cursor-pointer mt-2">
                         <input
                           type="checkbox"
                           checked={displaySettings.showCenter}
                           onChange={(e) => updateDisplaySettings({ showCenter: e.target.checked })}
                           className="rounded border-border w-4 h-4 text-primary"
                         />
                         Afficher le réticule du centre de la salle
                       </label>

                       {cycleMode !== 'none' && (
                         <label className="flex items-center gap-2 text-sm cursor-pointer">
                           <input
                             type="checkbox"
                             checked={displaySettings.showCycleIcon}
                             onChange={(e) => updateDisplaySettings({ showCycleIcon: e.target.checked })}
                             className="rounded border-border w-4 h-4 text-primary"
                           />
                           Afficher l'icône {cycleMode === 'dayNight' ? 'Jour/Nuit' : 'Tours'} au centre
                         </label>
                       )}
                     </div>


                 </div>
               </section>

               {/* Grille */}
               <section>
                 <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2 mb-3 flex items-center gap-2">
                   <Grid3X3 size={16} /> Grille Magnétique
                 </h3>
                 <div className="flex flex-col gap-3">
                   <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grid.enabled}
                      onChange={(e) => setGrid({ ...grid, enabled: e.target.checked })}
                      className="rounded border-border"
                    />
                    Activer la grille
                  </label>
                  {grid.enabled && (
                    <div className="flex items-center gap-2 ml-6">
                      <span className="text-xs text-muted-foreground">Taille (px):</span>
                      <input
                        type="number"
                        value={grid.sizeX}
                        onChange={(e) => setGrid({ ...grid, sizeX: Math.max(10, parseInt(e.target.value) || 50), sizeY: Math.max(10, parseInt(e.target.value) || 50) })}
                        className="w-20 bg-input border border-border rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  )}
                 </div>
               </section>

               {/* Dimensions & Fond */}
               <section>
                 <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2 mb-3 flex items-center gap-2">
                   <PaintBucket size={16} /> Dimensions & Fond de la salle
                 </h3>
                 <div className="flex flex-col gap-4">
                  <div className="flex gap-4">
                    <div className="flex flex-col gap-1 flex-1">
                      <label className="text-xs text-muted-foreground">Largeur (px)</label>
                      <input
                        type="number"
                        value={room.width}
                        onChange={(e) => setRoom({ width: Math.max(100, parseInt(e.target.value) || 2000) })}
                        className="w-full bg-input border border-border rounded px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <label className="text-xs text-muted-foreground">Hauteur (px)</label>
                      <input
                        type="number"
                        value={room.height}
                        onChange={(e) => setRoom({ height: Math.max(100, parseInt(e.target.value) || 1500) })}
                        className="w-full bg-input border border-border rounded px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">Couleur de fond</label>
                    <div className="flex gap-3 items-center">
                      <ColorPicker
                        color={room.backgroundColor}
                        onChange={(c) => setRoom({ backgroundColor: c })}
                        label="Couleur de fond"
                      />
                      <span className="text-sm uppercase font-mono">{room.backgroundColor}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-muted-foreground">Image de fond (URL ou Fichier)</label>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Coller l'URL d'une image (https://...)"
                        value={room.backgroundImage && !room.backgroundImage.startsWith('data:') ? room.backgroundImage : ''}
                        onChange={(e) => setRoom({ backgroundImage: e.target.value })}
                        className="flex-1 bg-input border border-border rounded px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        onClick={() => imageInputRef.current?.click()}
                        className="px-3 py-1.5 bg-muted border border-border rounded text-xs font-medium hover:bg-accent transition-colors flex items-center gap-2 shrink-0"
                        title="Charger un fichier"
                      >
                        <ImageIcon size={14} />
                        Fichier
                      </button>
                    </div>

                    {!room.backgroundImage ? (
                      <div
                        onClick={() => imageInputRef.current?.click()}
                        className="w-full h-32 border-2 border-dashed border-border rounded-md flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-colors mt-1"
                      >
                        <ImageIcon size={28} className="mb-2 opacity-50" />
                        <span className="text-sm font-medium">Ou glisser un fichier ici</span>
                      </div>
                    ) : (
                      <div className="flex flex-col md:flex-row gap-4 items-start mt-1">
                        <div className="relative w-full md:w-48 h-32 rounded-md overflow-hidden border border-border group shrink-0">
                          <div
                            className="absolute inset-0 bg-contain bg-center bg-no-repeat"
                            style={{ backgroundImage: `url(${room.backgroundImage})` }}
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <button
                              onClick={() => setRoom({ backgroundImage: null })}
                              className="p-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                              title="Supprimer l'image"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1 w-full flex-1">
                          <label className="text-xs text-muted-foreground">Style d'affichage de l'image</label>
                          <select
                            value={room.backgroundStyle}
                            onChange={(e) => setRoom({ backgroundStyle: e.target.value as any })}
                            className="bg-input border border-border rounded-md px-3 py-2 text-sm w-full outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="mosaic">Mosaïque (Répéter)</option>
                            <option value="center">Centrer (Taille réelle)</option>
                            <option value="stretch">Étendre (Occuper tout l'espace)</option>
                          </select>
                          <p className="text-[10px] text-muted-foreground mt-2 italic">
                            {room.backgroundImage.startsWith('data:') ? "Image chargée localement" : "Image chargée via URL"}
                          </p>
                        </div>
                      </div>
                    )}
                    <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                  </div>
                </div>
              </section>

                {/* Apparence */}
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2 mb-3 flex items-center gap-2">
                    <Sun size={16} /> Apparence (Thème)
                  </h3>
                  <div className="flex flex-col gap-2 p-3 bg-muted/20 border border-border rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">
                      Choisissez l'ambiance visuelle du logiciel (Clair ou Sombre).
                    </p>
                    <ThemeToggle className="w-fit" />
                  </div>
                </section>
             </div>
          )}

          {/* TAB: JOUEURS */}
          {activeTab === 'joueurs' && (
            <div className="flex flex-col gap-6">


               <section>
                 <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2 mb-3">Affichage des Joueurs</h3>
                 <div className="flex flex-col gap-3">
                   <label className="flex items-center gap-2 text-base font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={displaySettings.showPlayers}
                      onChange={(e) => updateDisplaySettings({ showPlayers: e.target.checked })}
                      className="rounded border-border w-4 h-4 text-primary"
                    />
                    Rendre les joueurs visibles sur le plateau
                  </label>

                  {displaySettings.showPlayers && (
                    <div className="pl-6 flex flex-col gap-4">
                      {/* Affichages basiques */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={displaySettings.showPlayerImage}
                            onChange={(e) => updateDisplaySettings({ showPlayerImage: e.target.checked })}
                            className="rounded border-border w-4 h-4 text-primary"
                          />
                          Afficher l'image du joueur (si définie)
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={displaySettings.showOfflineStatus}
                            onChange={(e) => updateDisplaySettings({ showOfflineStatus: e.target.checked })}
                            className="rounded border-border w-4 h-4 text-primary"
                          />
                          Indiquer lorsqu'un joueur est Hors Ligne
                        </label>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                          <label className="flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={displaySettings.showRoleImage}
                              onChange={(e) => updateDisplaySettings({ showRoleImage: e.target.checked })}
                              className="rounded border-border w-4 h-4 text-primary"
                            />
                            Afficher l'image du rôle (si définie)
                          </label>
                          <label className="flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={displaySettings.showRoleColor}
                              onChange={(e) => updateDisplaySettings({ showRoleColor: e.target.checked })}
                              className="rounded border-border w-4 h-4 text-primary"
                            />
                            Afficher la couleur du rôle
                          </label>
                        </div>
                      </div>

                      {/* Selects */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                         <div className="flex flex-col gap-1.5">
                           <label className="text-xs text-muted-foreground">Priorité si joueur et rôle ont une image :</label>
                           <select
                            value={displaySettings.imagePriority}
                            onChange={(e) => updateDisplaySettings({ imagePriority: e.target.value as 'player' | 'role' })}
                            className="bg-input border border-border rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary w-fit"
                          >
                            <option value="player">Image du Joueur</option>
                            <option value="role">Image du Rôle</option>
                          </select>
                         </div>
                         <div className="flex flex-col gap-1.5">
                           <label className="text-xs text-muted-foreground">Position du nom :</label>
                           <select
                            value={displaySettings.playerNamePosition}
                            onChange={(e) => updateDisplaySettings({ playerNamePosition: e.target.value as any })}
                            className="bg-input border border-border rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary w-fit"
                          >
                            <option value="none">Aucun</option>
                             <option value="bottom">En dessous</option>
                             <option value="top">Au dessus</option>
                             <option value="inside">À l'intérieur de la pastille</option>
                          </select>
                         </div>
                      </div>

                      {/* Info-Bulle */}
                      <div className="mt-4 p-4 rounded-lg bg-muted/20 border border-border/50 flex flex-col gap-3">
                        <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer border-b border-border/30 pb-2">
                          <input
                            type="checkbox"
                            checked={displaySettings.showTooltip}
                            onChange={(e) => updateDisplaySettings({ showTooltip: e.target.checked })}
                            className="rounded border-border w-4 h-4 text-primary"
                          />
                          Afficher l'info-bulle au survol
                        </label>
                        {displaySettings.showTooltip && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 ml-6">
                            <label className="flex items-center gap-2 text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                              <input
                                type="checkbox"
                                checked={displaySettings.showPlayerName ?? true}
                                onChange={(e) => updateDisplaySettings({ showPlayerName: e.target.checked })}
                                className="rounded border-border"
                              /> Afficher le nom
                            </label>
                            <label className="flex items-center gap-2 text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                              <input
                                type="checkbox"
                                checked={displaySettings.showRole}
                                onChange={(e) => updateDisplaySettings({ showRole: e.target.checked })}
                                className="rounded border-border"
                              /> Afficher le rôle
                            </label>
                            <label className="flex items-center gap-2 text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                              <input
                                type="checkbox"
                                checked={displaySettings.showTeam}
                                onChange={(e) => updateDisplaySettings({ showTeam: e.target.checked })}
                                className="rounded border-border"
                              /> Afficher l'équipe
                            </label>
                            <label className="flex items-center gap-2 text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                              <input
                                type="checkbox"
                                checked={displaySettings.showTags}
                                onChange={(e) => updateDisplaySettings({ showTags: e.target.checked })}
                                className="rounded border-border"
                              /> Afficher les Tags
                            </label>
                          </div>
                        )}
                      </div>

                      {/* Pastilles personnalisables */}
                      <div className="mt-4">
                        <h4 className="text-sm border-b border-border/30 pb-2 mb-3">Pastilles (Coins des pions)</h4>
                        <div className="relative mt-6 max-w-2xl mx-auto px-4 py-8 bg-muted/5 rounded-2xl border border-border/20 shadow-inner">
                          {/* Central Preview */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
                            <div className="relative w-24 h-24 rounded-full bg-zinc-900 border-2 border-zinc-700 shadow-2xl overflow-visible pointer-events-auto group mt-[-20px] sm:mt-0">
                              <UserCircle2 className="w-full h-full text-zinc-800 p-2" />
                              <div className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-zinc-800 opacity-20 uppercase tracking-widest select-none">Aperçu</div>
                              
                              {/* Live Badges Preview */}
                              {Object.entries(displaySettings.playerBadges || {}).map(([corner, config]: [string, any]) => {
                                if (config.type === 'none') return null;
                                const isTop = corner.startsWith('top');
                                const isLeft = corner.endsWith('Left');
                                return (
                                  <div 
                                    key={corner}
                                    className="absolute w-7 h-7 rounded-full border-2 border-zinc-900 shadow-lg flex items-center justify-center text-[9px] font-bold overflow-hidden"
                                    style={{ 
                                      top: isTop ? '-4px' : 'auto', 
                                      bottom: !isTop ? '-4px' : 'auto',
                                      left: isLeft ? '-4px' : 'auto',
                                      right: !isLeft ? '-4px' : 'auto',
                                      backgroundColor: config.type === 'team' ? '#3b82f6' : config.bgColor,
                                      color: config.type === 'team' ? '#fff' : config.textColor
                                    }}
                                  >
                                    {config.type === 'team' && <div className="w-full h-full bg-blue-500" />}
                                    {config.type === 'lives' && '3'}
                                    {config.type === 'votes' && '1'}
                                    {config.type === 'points' && '10'}
                                    {config.type === 'uses' && '2'}
                                    {config.type === 'callOrderDay' && '1'}
                                    {config.type === 'callOrderNight' && '2'}
                                    {config.type === 'creationOrder' && '1'}
                                    {config.type === 'sleeping' && <Moon size={12} />}
                                    {config.type === 'connection' && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* 4 Corner Selectors */}
                          <div className="grid grid-cols-2 gap-x-32 gap-y-24 sm:gap-x-48">
                            {[
                                  { key: 'topLeft', label: 'Haut Gauche' },
                                  { key: 'topRight', label: 'Haut Droite' },
                                  { key: 'bottomLeft', label: 'Bas Gauche' },
                                  { key: 'bottomRight', label: 'Bas Droite' }
                                ].map(corner => {
                              const badgeKey = corner.key as keyof typeof displaySettings.playerBadges;
                              const badge = displaySettings.playerBadges?.[badgeKey] || { type: 'none', bgColor: '#000', textColor: '#fff' };

                              const updateBadge = (updates: Partial<BadgeConfig>) => {
                                updateDisplaySettings({
                                  playerBadges: {
                                    ...displaySettings.playerBadges,
                                    [badgeKey]: { ...badge, ...updates }
                                  }
                                });
                              };

                              const isLeft = corner.key.endsWith('Left');

                              return (
                                <div key={corner.key} className={`flex flex-col gap-2 p-3 bg-muted/40 backdrop-blur-sm rounded-xl border border-border/60 hover:border-primary/40 transition-all shadow-sm ${isLeft ? 'items-start' : 'items-end'}`}>
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{corner.label}</span>
                                  <div className="flex items-center gap-2 w-full">
                                    <select
                                      value={badge.type}
                                      onChange={(e) => updateBadge({ type: e.target.value as BadgeType })}
                                      className="flex-1 min-w-0 bg-background border border-border rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                                    >
                                      <option value="none">-- Vide --</option>
                                      <option value="team">Équipe</option>
                                      <option value="lives">Vie</option>
                                      <option value="votes">Voix</option>
                                      <option value="points">Pts</option>
                                      <option value="uses">Uses</option>
                                      <option value="callOrderDay">Appel J</option>
                                      <option value="callOrderNight">Appel N</option>
                                      <option value="connection">Status</option>
                                      <option value="creationOrder">Classement</option>
                                      <option value="sleeping">Éveillé</option>
                                    </select>

                                    {badge.type !== 'none' && badge.type !== 'team' && badge.type !== 'connection' && badge.type !== 'sleeping' && (
                                      <div className="flex items-center gap-1 shrink-0">
                                        <ColorPicker
                                          color={badge.bgColor}
                                          onChange={(c) => updateBadge({ bgColor: c })}
                                          label="Fond"
                                          className="!w-5 !h-5 rounded-full"
                                        />
                                        <ColorPicker
                                          color={badge.textColor}
                                          onChange={(c) => updateBadge({ textColor: c })}
                                          label="Texte"
                                          className="!w-5 !h-5 rounded-full"
                                        />
                                      </div>
                                    )}
                                  </div>
                                  
                                  {badge.type === 'sleeping' && (
                                    <div className="flex flex-col gap-2 p-2 bg-background/50 rounded-lg border border-border/30 mt-2 w-full animate-in slide-in-from-top-1 duration-200">
                                      <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between px-0.5">
                                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">Réveillé</span>
                                          <div className="flex items-center gap-1.5">
                                            <ColorPicker
                                              color={badge.awakeBgColor || '#fbbf24'}
                                              onChange={(c) => updateBadge({ awakeBgColor: c })}
                                              label="Fond"
                                              className="!w-4 !h-4 rounded-full border border-border/50"
                                            />
                                            <ColorPicker
                                              color={badge.awakeTextColor || '#fff'}
                                              onChange={(c) => updateBadge({ awakeTextColor: c })}
                                              label="Texte"
                                              className="!w-4 !h-4 rounded-full border border-border/50"
                                            />
                                          </div>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                          {['Sun', 'Eye', 'Bell', 'User'].map(iconName => (
                                            <button
                                              key={iconName}
                                              onClick={() => updateBadge({ awakeIcon: iconName })}
                                              className={`p-1 rounded hover:bg-primary/20 transition-colors ${badge.awakeIcon === iconName ? 'bg-primary text-white shadow-sm' : 'bg-muted/40 text-muted-foreground'}`}
                                              title={iconName}
                                            >
                                              {React.createElement((icons as any)[iconName], { size: 10 })}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                      <div className="flex flex-col gap-1.5 border-t border-border/20 pt-1.5">
                                        <div className="flex items-center justify-between px-0.5">
                                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">Dort</span>
                                          <div className="flex items-center gap-1.5">
                                            <ColorPicker
                                              color={badge.sleepingBgColor || '#4f46e5'}
                                              onChange={(c) => updateBadge({ sleepingBgColor: c })}
                                              label="Fond"
                                              className="!w-4 !h-4 rounded-full border border-border/50"
                                            />
                                            <ColorPicker
                                              color={badge.sleepingTextColor || '#fff'}
                                              onChange={(c) => updateBadge({ sleepingTextColor: c })}
                                              label="Texte"
                                              className="!w-4 !h-4 rounded-full border border-border/50"
                                            />
                                          </div>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                          {['Moon', 'EyeOff', 'MoonStar', 'BellOff'].map(iconName => (
                                            <button
                                              key={iconName}
                                              onClick={() => updateBadge({ sleepingIcon: iconName })}
                                              className={`p-1 rounded hover:bg-primary/20 transition-colors ${badge.sleepingIcon === iconName ? 'bg-primary text-white shadow-sm' : 'bg-muted/40 text-muted-foreground'}`}
                                              title={iconName}
                                            >
                                              {React.createElement((icons as any)[iconName], { size: 10 })}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          
                          <p className="mt-8 text-center text-[10px] text-muted-foreground uppercase tracking-tighter opacity-50">
                            Configurez l'affichage des informations importantes directement sur les pions du plateau.
                          </p>
                        </div>
                      </div>

                    </div>
                  )}
                 </div>
               </section>
            </div>
          )}

          {/* TAB: TAGS */}
          {activeTab === 'tags' && (
            <div className="flex flex-col gap-6">
              <section>
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2 mb-3">Gestion Globale des Tags</h3>
                <div className="flex flex-col gap-4">
                  <div className="bg-muted/10 border border-border/40 p-4 rounded-lg flex flex-col gap-4">
                    <label className="flex items-center gap-3 text-sm cursor-pointer hover:text-primary transition-colors font-medium">
                      <input
                        type="checkbox"
                        checked={displaySettings.autoMergeTags ?? false}
                        onChange={(e) => updateDisplaySettings({ autoMergeTags: e.target.checked })}
                        className="rounded border-border w-5 h-5 text-primary"
                      />
                      Fusionner automatiquement le tag au joueur
                    </label>
                    <p className="text-[11px] text-muted-foreground pl-8 leading-relaxed -mt-2">
                      Si activé, le glisser-déposer d'un tag (marqueur) sur un joueur fusionnera automatiquement l'entité sans demander de confirmation.
                    </p>



                    <div className="border-t border-border/20 pt-4 mt-2">
                        <label className="flex items-center gap-3 text-sm cursor-pointer hover:text-primary transition-colors font-medium">
                          <input
                            type="checkbox"
                            checked={displaySettings.showTagName}
                            onChange={(e) => updateDisplaySettings({ showTagName: e.target.checked })}
                            className="rounded border-border w-5 h-5 text-primary"
                          />
                          Afficher le nom des tags/marqueurs
                        </label>
                        <p className="text-[11px] text-muted-foreground pl-8 mt-1 leading-relaxed">
                          Affiche le nom du marqueur en permanence sur le plateau.
                        </p>
                        
                        {displaySettings.showTagName && (
                          <div className="pl-8 mt-4 flex flex-col gap-3 border-l-2 border-border/10 ml-2.5 anim-fade-down">
                            <label className="flex items-center gap-2 text-xs cursor-pointer hover:text-primary transition-colors">
                              <input
                                type="checkbox"
                                checked={!!displaySettings.showTagNameSeenAsRole}
                                onChange={(e) => updateDisplaySettings({ showTagNameSeenAsRole: e.target.checked })}
                                className="rounded border-border w-3.5 h-3.5 text-primary"
                              />
                              Rôle vu comme
                            </label>
                            <label className="flex items-center gap-2 text-xs cursor-pointer hover:text-primary transition-colors">
                              <input
                                type="checkbox"
                                checked={!!displaySettings.showTagNameSeenInTeam}
                                onChange={(e) => updateDisplaySettings({ showTagNameSeenInTeam: e.target.checked })}
                                className="rounded border-border w-3.5 h-3.5 text-primary"
                              />
                              Equipe vue comme
                            </label>
                          </div>
                        )}
                    </div>

                    <div className="border-t border-border/20 pt-4 mt-2">
                        <label className="flex items-center gap-3 text-sm cursor-pointer hover:text-primary transition-colors font-medium">
                          <input
                            type="checkbox"
                            checked={displaySettings.showTagTooltip !== false}
                            onChange={(e) => updateDisplaySettings({ showTagTooltip: e.target.checked })}
                            className="rounded border-border w-5 h-5 text-primary"
                          />
                          Afficher l'info bulle des tags
                        </label>
                        <p className="text-[11px] text-muted-foreground pl-8 mt-1 leading-relaxed">
                          Détails au survol d'un tag.
                        </p>
                        {displaySettings.showTagTooltip !== false && (
                          <div className="pl-6 mt-3 grid grid-cols-1 gap-y-2 border-l border-border/10 ml-2.5 anim-fade-down">
                            <label className="flex items-center gap-2 text-[10px] cursor-pointer hover:text-primary transition-colors pr-2">
                              <input
                                type="checkbox"
                                checked={!!displaySettings.showTagNameInTooltip}
                                onChange={(e) => updateDisplaySettings({ showTagNameInTooltip: e.target.checked })}
                                className="rounded border-border w-3 h-3 text-primary"
                              />
                              Nom du Tag
                            </label>
                            <label className="flex items-center gap-2 text-[10px] cursor-pointer hover:text-primary transition-colors pr-2">
                              <input
                                type="checkbox"
                                checked={displaySettings.showTagCallOrderDay !== false}
                                onChange={(e) => updateDisplaySettings({ showTagCallOrderDay: e.target.checked })}
                                className="rounded border-border w-3 h-3 text-primary"
                              />
                              Appel jour
                            </label>
                            <label className="flex items-center gap-2 text-[10px] cursor-pointer hover:text-primary transition-colors pr-2">
                              <input
                                type="checkbox"
                                checked={displaySettings.showTagCallOrderNight !== false}
                                onChange={(e) => updateDisplaySettings({ showTagCallOrderNight: e.target.checked })}
                                className="rounded border-border w-3 h-3 text-primary"
                              />
                              Appel nuit
                            </label>
                            <label className="flex items-center gap-2 text-[10px] cursor-pointer hover:text-primary transition-colors pr-2">
                              <input
                                type="checkbox"
                                checked={displaySettings.showTagLives !== false}
                                onChange={(e) => updateDisplaySettings({ showTagLives: e.target.checked })}
                                className="rounded border-border w-3 h-3 text-primary"
                              />
                              Vie
                            </label>
                            <label className="flex items-center gap-2 text-[10px] cursor-pointer hover:text-primary transition-colors pr-2">
                              <input
                                type="checkbox"
                                checked={displaySettings.showTagVotes !== false}
                                onChange={(e) => updateDisplaySettings({ showTagVotes: e.target.checked })}
                                className="rounded border-border w-3 h-3 text-primary"
                              />
                              Votes
                            </label>
                            <label className="flex items-center gap-2 text-[10px] cursor-pointer hover:text-primary transition-colors pr-2">
                              <input
                                type="checkbox"
                                checked={displaySettings.showTagPoints !== false}
                                onChange={(e) => updateDisplaySettings({ showTagPoints: e.target.checked })}
                                className="rounded border-border w-3 h-3 text-primary"
                              />
                              Points
                            </label>
                            <label className="flex items-center gap-2 text-[10px] cursor-pointer hover:text-primary transition-colors pr-2">
                              <input
                                type="checkbox"
                                checked={displaySettings.showTagUses !== false}
                                onChange={(e) => updateDisplaySettings({ showTagUses: e.target.checked })}
                                className="rounded border-border w-3 h-3 text-primary"
                              />
                              Utilisations
                            </label>
                            <label className="flex items-center gap-2 text-[10px] cursor-pointer hover:text-primary transition-colors pr-2">
                              <input
                                type="checkbox"
                                checked={displaySettings.showTagAutoDelete !== false}
                                onChange={(e) => updateDisplaySettings({ showTagAutoDelete: e.target.checked })}
                                className="rounded border-border w-3 h-3 text-primary"
                              />
                              Suppression auto
                            </label>
                            <label className="flex items-center gap-2 text-[10px] cursor-pointer hover:text-primary transition-colors pr-2">
                              <input
                                type="checkbox"
                                checked={displaySettings.showTagSeenAsRole !== false}
                                onChange={(e) => updateDisplaySettings({ showTagSeenAsRole: e.target.checked })}
                                className="rounded border-border w-3 h-3 text-primary"
                              />
                              Rôle vu
                            </label>
                            <label className="flex items-center gap-2 text-[10px] cursor-pointer hover:text-primary transition-colors pr-2">
                              <input
                                type="checkbox"
                                checked={displaySettings.showTagSeenInTeam !== false}
                                onChange={(e) => updateDisplaySettings({ showTagSeenInTeam: e.target.checked })}
                                className="rounded border-border w-3 h-3 text-primary"
                              />
                              Équipe vue
                            </label>
                            <label className="flex items-center gap-2 text-[10px] cursor-pointer hover:text-primary transition-colors pr-2">
                              <input
                                type="checkbox"
                                checked={displaySettings.showTagDescription !== false}
                                onChange={(e) => updateDisplaySettings({ showTagDescription: e.target.checked })}
                                className="rounded border-border w-3 h-3 text-primary"
                              />
                              Texte libre
                            </label>
                          </div>
                        )}
                    </div>

                    <div className="border-t border-border/20 pt-4 mt-2">
                       <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                         <Smartphone size={16} className="text-primary" />
                         Action Smartphone
                       </h3>
                       <label className="flex items-center gap-3 text-sm cursor-pointer hover:text-primary transition-colors font-medium">
                         <input
                           type="checkbox"
                           checked={displaySettings.showTagSmartphoneIcon !== false}
                           onChange={(e) => updateDisplaySettings({ showTagSmartphoneIcon: e.target.checked })}
                           className="rounded border-border w-5 h-5 text-primary"
                         />
                         Action sur smartphone
                         <div className="bg-blue-500 text-white rounded-full p-0.5 shadow-sm border border-background scale-75">
                           <Smartphone size={8} />
                         </div>
                       </label>
                       <p className="text-[11px] text-muted-foreground pl-8 mt-1 leading-relaxed">
                         Affiche une pastille de téléphone sur les tags ayant une action smartphone configurée.
                       </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* TAB: SMARTPHONE */}
          {activeTab === 'smartphone' && (
            <div className="flex flex-col gap-6">
               <section>
                 <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2 mb-3">Affichage côté Joueur</h3>
                 <div className="flex flex-col gap-5">
                   <div className="flex flex-col gap-2">
                     <p className="text-xs font-bold text-foreground">Onglets visibles sur Smartphone</p>
                     <p className="text-[11px] text-muted-foreground mb-1">Si aucun onglet n'est coché, le contenu de "Jeu" s'affichera par défaut (sans barre de navigation).</p>
                     <div className="flex flex-col gap-2 bg-muted/10 p-3 rounded-md border border-border/40">
                       <div className="flex items-center justify-between">
                          <label className="flex items-center gap-3 text-sm cursor-pointer hover:text-primary transition-colors flex-1">
                            <input
                              type="checkbox"
                              checked={displaySettings.smartphoneTabs?.game ?? true}
                              onChange={(e) => updateDisplaySettings({ smartphoneTabs: { ...(displaySettings.smartphoneTabs || { game: true, players: true, room: true, wiki: true }), game: e.target.checked } })}
                              className="rounded border-border w-4 h-4 text-primary"
                            />
                            Afficher l'onglet "Jeu" (Plateau principal, actions de base)
                          </label>
                          <button
                            onClick={(e) => { e.preventDefault(); setExpandedSmartphone(prev => ({ ...prev, game: !prev.game })) }}
                            className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground"
                          >
                            {expandedSmartphone.game ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                        </div>
                        {(displaySettings.smartphoneTabs?.game ?? true) && expandedSmartphone.game && (
                   <div className="flex flex-col gap-1.5 w-fit ml-7 mt-1">
                    <label className="text-xs font-bold text-foreground">Style de l'image (Avatar / Rôle)</label>
                    <p className="text-xs text-muted-foreground mb-1">Définit la forme de l'image affichée sur l'écran du smartphone des joueurs.</p>
                    <select
                      value={displaySettings.smartphoneImageStyle || 'circle'}
                      onChange={(e) => updateDisplaySettings({ smartphoneImageStyle: e.target.value as any })}
                      className="bg-input border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-w-[200px]"
                    >
                      <option value="circle">Pastille Ronde (Défaut, rognée)</option>
                      <option value="square">Carré (Rognée)</option>
                      <option value="original">Format Original (Entière, centrée)</option>
                      <option value="background">Mettre en plein écran (Image de fond floutée)</option>
                       <option value="none">Aucune (Pas d'image)</option>
                    </select>
                     {displaySettings.smartphoneImageStyle === 'background' && (
                       <div className="flex flex-col gap-3 p-3 bg-muted/10 border-l-2 border-primary/30 mt-2 rounded-r-md">
                         <div className="flex flex-col gap-1">
                           <div className="flex justify-between items-center">
                             <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Niveau de flou ({displaySettings.smartphoneImageBlur ?? 20}%)</label>
                           </div>
                           <input
                             type="range"
                             min="0"
                             max="100"
                             step="1"
                             value={displaySettings.smartphoneImageBlur ?? 20}
                             onChange={(e) => updateDisplaySettings({ smartphoneImageBlur: parseInt(e.target.value) })}
                             className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                           />
                         </div>
                         <div className="flex flex-col gap-1">
                           <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Hauteur minimum (en px)</label>
                           <input
                             type="number"
                             min="0"
                             max="1000"
                             value={displaySettings.smartphoneImageMinHeight || 400}
                             onChange={(e) => updateDisplaySettings({ smartphoneImageMinHeight: parseInt(e.target.value) })}
                             className="bg-input border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary w-24"
                           />
                         </div>
                       </div>
                     )}
                    </div>
                        )}
                       <div className="flex items-center justify-between border-t border-border/10 pt-2 pb-0.5">
                          <label className="flex items-center gap-3 text-sm cursor-pointer hover:text-primary transition-colors flex-1">
                            <input
                              type="checkbox"
                              checked={displaySettings.smartphoneTabs?.players ?? true}
                              onChange={(e) => updateDisplaySettings({ smartphoneTabs: { ...(displaySettings.smartphoneTabs || { game: true, players: true, room: true, wiki: true }), players: e.target.checked } })}
                              className="rounded border-border w-4 h-4 text-primary"
                            />
                            Afficher l'onglet "Joueurs" (Liste des joueurs en jeu)
                          </label>
                          <button
                            onClick={(e) => { e.preventDefault(); setExpandedSmartphone(prev => ({ ...prev, players: !prev.players })) }}
                            className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground"
                          >
                            {expandedSmartphone.players ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                        </div>

                       {(displaySettings.smartphoneTabs?.players ?? true) && expandedSmartphone.players && (
                         <div className="pl-7 flex flex-col gap-2 border-l border-border/30 ml-2 mt-1">
                           <label className="flex items-center gap-3 text-xs cursor-pointer hover:text-primary transition-colors">
                             <input
                               type="checkbox"
                               checked={displaySettings.smartphonePlayersOptions?.allowPrivateNotes ?? true}
                               onChange={(e) => updateDisplaySettings({ smartphonePlayersOptions: { ...(displaySettings.smartphonePlayersOptions || { allowPrivateNotes: true, showDeadPlayers: true, includeSelf: true, allowNotesForDeadPlayers: true, showNotePreview: true }), allowPrivateNotes: e.target.checked } })}
                               className="rounded border-border w-3.5 h-3.5 text-primary"
                             />
                             Mettre des notes privés
                           </label>
                           {(displaySettings.smartphonePlayersOptions?.allowPrivateNotes !== false && displaySettings.smartphonePlayersOptions?.showDeadPlayers !== false) && (
                             <label className="flex items-center gap-3 text-[10px] cursor-pointer hover:text-primary transition-colors pl-6 border-l border-border/20 ml-1.5 -mt-1 mb-1 opacity-80">
                               <input
                                 type="checkbox"
                                 checked={displaySettings.smartphonePlayersOptions?.allowNotesForDeadPlayers ?? true}
                                 onChange={(e) => updateDisplaySettings({ smartphonePlayersOptions: { ...(displaySettings.smartphonePlayersOptions || { allowPrivateNotes: true, showDeadPlayers: true, includeSelf: true, allowNotesForDeadPlayers: true, showNotePreview: true }), allowNotesForDeadPlayers: e.target.checked } })}
                                 className="rounded border-border w-3 h-3 text-primary"
                               />
                               Même aux morts
                             </label>
                           )}
                           {(displaySettings.smartphonePlayersOptions?.allowPrivateNotes !== false) && (
                             <label className="flex items-center gap-3 text-[10px] cursor-pointer hover:text-primary transition-colors pl-6 border-l border-border/20 ml-1.5 -mt-1 mb-1 opacity-80">
                               <input
                                 type="checkbox"
                                 checked={displaySettings.smartphonePlayersOptions?.showNotePreview ?? true}
                                 onChange={(e) => updateDisplaySettings({ smartphonePlayersOptions: { ...(displaySettings.smartphonePlayersOptions || { allowPrivateNotes: true, showDeadPlayers: true, includeSelf: true, allowNotesForDeadPlayers: true, showNotePreview: true }), showNotePreview: e.target.checked } })}
                                 className="rounded border-border w-3 h-3 text-primary"
                               />
                               Visible sous le nom du joueur
                             </label>
                           )}
                           <label className="flex items-center gap-3 text-xs cursor-pointer hover:text-primary transition-colors">
                             <input
                               type="checkbox"
                               checked={displaySettings.smartphonePlayersOptions?.showDeadPlayers ?? true}
                               onChange={(e) => updateDisplaySettings({ smartphonePlayersOptions: { ...(displaySettings.smartphonePlayersOptions || { allowPrivateNotes: true, showDeadPlayers: true, includeSelf: true, allowNotesForDeadPlayers: true, showNotePreview: true }), showDeadPlayers: e.target.checked } })}
                               className="rounded border-border w-3.5 h-3.5 text-primary"
                             />
                             Afficher les morts
                           </label>
                           <label className="flex items-center gap-3 text-xs cursor-pointer hover:text-primary transition-colors">
                             <input
                               type="checkbox"
                               checked={displaySettings.smartphonePlayersOptions?.includeSelf ?? true}
                               onChange={(e) => updateDisplaySettings({ smartphonePlayersOptions: { ...(displaySettings.smartphonePlayersOptions || { allowPrivateNotes: true, showDeadPlayers: true, includeSelf: true, allowNotesForDeadPlayers: true, showNotePreview: true }), includeSelf: e.target.checked } })}
                               className="rounded border-border w-3.5 h-3.5 text-primary"
                             />
                             Inclure le joueur du smartphone
                           </label>
                         </div>
                       )}

                        <div className="flex items-center justify-between border-t border-border/10 pt-2 pb-0.5">
                          <label className="flex items-center gap-3 text-sm cursor-pointer hover:text-primary transition-colors flex-1">
                            <input
                              type="checkbox"
                              checked={displaySettings.smartphoneTabs?.room ?? true}
                              onChange={(e) => updateDisplaySettings({ smartphoneTabs: { ...(displaySettings.smartphoneTabs || { game: true, players: true, room: true, wiki: true }), room: e.target.checked } })}
                              className="rounded border-border w-4 h-4 text-primary"
                            />
                            Afficher l'onglet "Salle" (Miniature globale)
                          </label>
                          <button
                            onClick={(e) => { e.preventDefault(); setExpandedSmartphone(prev => ({ ...prev, room: !prev.room })) }}
                            className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground"
                          >
                            {expandedSmartphone.room ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                        </div>
                        {(displaySettings.smartphoneTabs?.room ?? true) && expandedSmartphone.room && (
                   <div className="flex flex-col gap-2 ml-7 mt-1">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Icône du joueur</label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="url"
                            value={displaySettings.roomMiniaturePlayerIconUrl || ''}
                            onChange={(e) => updateDisplaySettings({ roomMiniaturePlayerIconUrl: e.target.value || null })}
                            placeholder="URL de l'image (défaut: image du joueur)..."
                            className="flex-1 bg-input border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/40"
                          />
                          {displaySettings.roomMiniaturePlayerIconUrl && (
                            <button
                              onClick={() => updateDisplaySettings({ roomMiniaturePlayerIconUrl: null })}
                              className="p-1 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors text-[10px]"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                      <label className="flex items-center gap-3 text-xs cursor-pointer hover:text-primary transition-colors">
                        <input
                          type="checkbox"
                          checked={displaySettings.roomMiniatureSelfAnimation ?? true}
                          onChange={(e) => updateDisplaySettings({ roomMiniatureSelfAnimation: e.target.checked })}
                          className="rounded border-border w-3.5 h-3.5 text-primary"
                        />
                        Animation du joueur (Moi)
                      </label>
                      <label className="flex items-center gap-3 text-xs cursor-pointer hover:text-primary transition-colors">
                        <input
                          type="checkbox"
                          checked={displaySettings.roomMiniatureAnimation ?? true}
                          onChange={(e) => updateDisplaySettings({ roomMiniatureAnimation: e.target.checked })}
                          className="rounded border-border w-3.5 h-3.5 text-primary"
                        />
                        Animation des joueurs (Autres)
                      </label>
                     <div className="flex flex-col gap-1">
                       <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Icône joueur mort (Overly)</label>
                       <div className="flex gap-2 items-center">
                         <input
                           type="url"
                           value={displaySettings.roomMiniatureDeadIconUrl || ''}
                           onChange={(e) => updateDisplaySettings({ roomMiniatureDeadIconUrl: e.target.value || null })}
                           placeholder="URL de l'image..."
                           className="flex-1 bg-input border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/40"
                         />
                         {displaySettings.roomMiniatureDeadIconUrl && (
                           <button
                             onClick={() => updateDisplaySettings({ roomMiniatureDeadIconUrl: null })}
                             className="p-1 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors text-[10px]"
                           >
                             Reset
                           </button>
                         )}
                       </div>
                     </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <ArrowUpRight size={14} className="text-blue-500" />
                        URL de Miniature de la Salle
                      </span>
                      <p className="text-[11px] text-muted-foreground">
                        Cette image s'affiche dans l'onglet "Salle" du smartphone des joueurs pour leur donner une idée de la carte. 
                        Elle doit être une URL publique (ex: Imgur, Discord CDN...). Si vide, l'image de fond de la salle est utilisée si c'est une URL.
                      </p>
                    </div>
                    <div className="flex gap-2 items-center max-w-lg">
                      <input
                        type="url"
                        value={room.minimapImageUrl || ''}
                        onChange={(e) => setRoom({ minimapImageUrl: e.target.value || null })}
                        placeholder="https://i.imgur.com/..."
                        className="flex-1 bg-input border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/40"
                      />
                      {room.minimapImageUrl && (
                        <button
                          onClick={() => setRoom({ minimapImageUrl: null })}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                          title="Effacer"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    {room.minimapImageUrl && (
                      <div className="w-full max-w-sm h-32 mt-2 rounded-lg overflow-hidden border border-border bg-zinc-900 shadow-inner">
                        <img src={room.minimapImageUrl} alt="Aperçu minimap" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    )}
                   </div>
                        )}
                        <div className="flex items-center justify-between border-t border-border/10 pt-2 pb-0.5">
                          <label className="flex items-center gap-3 text-sm cursor-pointer hover:text-primary transition-colors flex-1">
                            <input
                              type="checkbox"
                              checked={displaySettings.smartphoneTabs?.wiki ?? true}
                              onChange={(e) => updateDisplaySettings({ smartphoneTabs: { ...(displaySettings.smartphoneTabs || { game: true, players: true, room: true, wiki: true }), wiki: e.target.checked } })}
                              className="rounded border-border w-4 h-4 text-primary"
                            />
                            Afficher l'onglet "Wiki" (Notes & Rôles)
                          </label>
                          <button
                            onClick={(e) => { e.preventDefault(); setExpandedSmartphone(prev => ({ ...prev, wiki: !prev.wiki })) }}
                            className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground"
                          >
                            {expandedSmartphone.wiki ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                        </div>
                        {(displaySettings.smartphoneTabs?.wiki ?? true) && expandedSmartphone.wiki && (
                        <div className="flex flex-col gap-2 ml-7 mt-1">
                          <label className="flex items-center gap-2 text-xs cursor-pointer hover:text-primary transition-colors">
                            <input
                              type="checkbox"
                              checked={displaySettings.showWikiNotes ?? true}
                              onChange={(e) => updateDisplaySettings({ showWikiNotes: e.target.checked })}
                              className="rounded border-border w-3.5 h-3.5 text-primary"
                            />
                            Afficher les Notes
                          </label>
                          <div className="flex flex-col gap-1 ml-5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Titre du Wiki</label>
                            <input
                              type="text"
                              value={displaySettings.wikiTitle || 'Régles du jeu'}
                              onChange={(e) => updateDisplaySettings({ wikiTitle: e.target.value })}
                              placeholder="Ex: Régles du jeu"
                              className="bg-input border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary w-full max-w-[200px]"
                            />
                          </div>
                          <label className="flex items-center gap-2 text-xs cursor-pointer hover:text-primary transition-colors ml-5">
                            <input
                              type="checkbox"
                              checked={displaySettings.wikiLightMode || false}
                              onChange={(e) => updateDisplaySettings({ wikiLightMode: e.target.checked })}
                              className="rounded border-border w-3.5 h-3.5 text-primary"
                            />
                            Fond clair (Améliore la lisibilité)
                          </label>
                          <label className="flex items-center gap-2 text-xs cursor-pointer hover:text-primary transition-colors">
                            <input
                              type="checkbox"
                              checked={displaySettings.showWikiRoles ?? true}
                              onChange={(e) => updateDisplaySettings({ showWikiRoles: e.target.checked })}
                              className="rounded border-border w-3.5 h-3.5 text-primary"
                            />
                            Afficher les Rôles
                          </label>
                          <div className="flex flex-col gap-1.5 ml-5 mt-1">
                            <label className="flex items-center gap-2 text-xs cursor-pointer hover:text-primary transition-colors">
                              <input
                                type="checkbox"
                                checked={displaySettings.wikiOnlySelectedRoles || false}
                                onChange={(e) => updateDisplaySettings({ wikiOnlySelectedRoles: e.target.checked })}
                                className="rounded border-border w-3.5 h-3.5 text-primary"
                              />
                              Seulement les rôles sélectionnés
                            </label>
                            <label className="flex items-center gap-2 text-xs cursor-pointer hover:text-primary transition-colors">
                              <input
                                type="checkbox"
                                checked={displaySettings.wikiOnlyInPlayRoles || false}
                                onChange={(e) => updateDisplaySettings({ wikiOnlyInPlayRoles: e.target.checked })}
                                className="rounded border-border w-3.5 h-3.5 text-primary"
                              />
                              Seulement les rôles en jeu
                            </label>
                          </div>
                          <label className="flex items-center gap-2 text-xs cursor-pointer hover:text-primary transition-colors">
                            <input
                              type="checkbox"
                              checked={displaySettings.showWikiTags ?? true}
                              onChange={(e) => updateDisplaySettings({ showWikiTags: e.target.checked })}
                              className="rounded border-border w-3.5 h-3.5 text-primary"
                            />
                            Afficher les Tags
                          </label>
                        </div>
                        )}
                     </div>
                   </div>


                 </div>
               </section>

            </div>
          )}

          {/* TAB: OUTILS */}
          {activeTab === 'outils' && (
            <div className="flex flex-col gap-6">
              <section>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-200">
                    Cochez les modules que vous souhaitez afficher dans le panneau latéral droit "Outils".
                  </p>
                </div>
                
                <div className="flex flex-col gap-3">
                  {[
                    { key: 'distribution', label: 'Distribution des Rôles' },
                    { key: 'chrono', label: 'Chronomètre' },
                    { key: 'soundboard', label: 'Boîte à Sons (Soundboard)' },
                    { key: 'scoreboard', label: 'Tableau des Scores' },
                    { key: 'logs', label: 'Log / Historique' },
                    { key: 'tagDistributor', label: 'Distributeur de Tags' },
                    { key: 'wiki', label: 'Wiki / Notes GM' },
                    { key: 'popupCreator', label: 'Créateur de Popup' },
                    { key: 'actionCreator', label: "Créateur d'Actions" },
                    { key: 'checklist', label: 'Checklist pour le MJ' },
                    { key: 'system', label: 'Système & Connexion' }
                  ].map(tool => (
                    <div key={tool.key} className="flex flex-col gap-2">
                    <label className="flex items-center gap-3 p-3 bg-muted/20 border border-border rounded-lg cursor-pointer hover:bg-muted/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={(displaySettings.panels || {})[tool.key as keyof typeof displaySettings.panels] ?? true}
                        onChange={(e) => updateDisplaySettings({ 
                          panels: { 
                            ...(displaySettings.panels || {}), 
                            [tool.key]: e.target.checked 
                          } 
                        })}
                        className="rounded border-border w-5 h-5 text-primary"
                      />
                      <span className="font-semibold text-sm flex-1">{tool.label}</span>
                      {['distribution', 'chrono', 'wiki', 'soundboard', 'scoreboard', 'logs'].includes(tool.key) && (displaySettings.panels || {})[tool.key as keyof typeof displaySettings.panels] !== false && (
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setExpandedOutils(prev => ({ ...prev, [tool.key]: !prev[tool.key] }));
                          }}
                          className="p-1 hover:bg-accent rounded-full transition-colors text-muted-foreground"
                        >
                          {expandedOutils[tool.key as keyof typeof expandedOutils] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>
                      )}
                    </label>
                    {tool.key === 'distribution' && (displaySettings.panels?.distribution ?? true) && expandedOutils.distribution && (
                      <div className="ml-8 flex flex-col gap-2 p-2 bg-muted/10 border-l-2 border-purple-500/30 rounded-r-lg mt-1 mb-2">
                        {[
                          { key: 'distributionResurrectAll', label: 'Ressusciter tous les joueurs' },
                          { key: 'distributionDeleteTags', label: 'Supprimer les tags des joueurs' },
                          { key: 'distributionRemovePastilles', label: 'Enlever les pastilles tags' },
                          { key: 'distributionResetPhase', label: 'Réinitialiser la phase (Jour 1)' },
                          { key: 'distributionResetLives', label: 'Reset Vie' },
                          { key: 'distributionResetPoints', label: 'Reset Points' },
                          { key: 'distributionResetVotes', label: 'Reset Votes' },
                          { key: 'distributionDeletePrivateNotes', label: 'Supprimer les notes privés' },
                          { key: 'distributionDeletePublicNotes', label: 'Supprimer les notes publiques' }
                        ].map(sub => (
                          <label key={sub.key} className="flex items-center gap-2 cursor-pointer group">
                             <input
                               type="checkbox"
                               checked={(displaySettings as any)[sub.key] ?? true}
                               onChange={(e) => updateDisplaySettings({ [sub.key]: e.target.checked })}
                               className="rounded border-border w-4 h-4 text-purple-500 focus:ring-purple-500"
                             />
                             <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                               {sub.label}
                             </span>
                          </label>
                        ))}
                      </div>
                    )}
                    {tool.key === 'chrono' && (displaySettings.panels?.chrono ?? true) && expandedOutils.chrono && (
                      <div className="ml-8 flex flex-col gap-3 p-3 bg-muted/10 border-l-2 border-amber-500/30 rounded-r-lg mt-1 mb-2">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Minutes par défaut</label>
                          <input
                            type="number"
                            min="0"
                            max="99"
                            value={displaySettings.timerDefaultMinutes ?? 5}
                            onChange={(e) => updateDisplaySettings({ timerDefaultMinutes: Math.max(0, parseInt(e.target.value) || 0) })}
                            className="w-20 bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 text-center font-mono font-bold"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Secondes par défaut</label>
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={displaySettings.timerDefaultSeconds ?? 0}
                            onChange={(e) => updateDisplaySettings({ timerDefaultSeconds: Math.max(0, parseInt(e.target.value) || 0) })}
                            className="w-20 bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 text-center font-mono font-bold"
                          />
                        </div>
                      </div>
                    )}
                    {tool.key === 'wiki' && (displaySettings.panels?.wiki ?? true) && expandedOutils.wiki && (
                      <div className="ml-8 flex flex-col gap-3 p-3 bg-muted/10 border-l-2 border-blue-500/30 rounded-r-lg mt-1 mb-2">
                        <label className="flex items-center gap-2 text-xs cursor-pointer hover:text-primary transition-colors">
                          <input
                            type="checkbox"
                            checked={displaySettings.showWikiNotes ?? true}
                            onChange={(e) => updateDisplaySettings({ showWikiNotes: e.target.checked })}
                            className="rounded border-border w-3.5 h-3.5 text-primary"
                          />
                          Afficher les Notes
                        </label>
                        <div className="flex flex-col gap-1 ml-5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Titre du Wiki</label>
                          <input
                            type="text"
                            value={displaySettings.wikiTitle || 'Régles du jeu'}
                            onChange={(e) => updateDisplaySettings({ wikiTitle: e.target.value })}
                            placeholder="Ex: Régles du jeu"
                            className="bg-input border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary w-full max-w-[200px]"
                          />
                        </div>
                        <label className="flex items-center gap-2 text-xs cursor-pointer hover:text-primary transition-colors ml-5">
                          <input
                            type="checkbox"
                            checked={displaySettings.wikiLightMode || false}
                            onChange={(e) => updateDisplaySettings({ wikiLightMode: e.target.checked })}
                            className="rounded border-border w-3.5 h-3.5 text-primary"
                          />
                          Fond clair (Améliore la lisibilité)
                        </label>
                        <label className="flex items-center gap-2 text-xs cursor-pointer hover:text-primary transition-colors">
                          <input
                            type="checkbox"
                            checked={displaySettings.showWikiRoles ?? true}
                            onChange={(e) => updateDisplaySettings({ showWikiRoles: e.target.checked })}
                            className="rounded border-border w-3.5 h-3.5 text-primary"
                          />
                          Afficher les Rôles
                        </label>
                        <div className="flex flex-col gap-1.5 ml-5 mt-1">
                          <label className="flex items-center gap-2 text-xs cursor-pointer hover:text-primary transition-colors">
                            <input
                              type="checkbox"
                              checked={displaySettings.wikiOnlySelectedRoles || false}
                              onChange={(e) => updateDisplaySettings({ wikiOnlySelectedRoles: e.target.checked })}
                              className="rounded border-border w-3.5 h-3.5 text-primary"
                            />
                            Seulement les rôles sélectionnés
                          </label>
                          <label className="flex items-center gap-2 text-xs cursor-pointer hover:text-primary transition-colors">
                            <input
                              type="checkbox"
                              checked={displaySettings.wikiOnlyInPlayRoles || false}
                              onChange={(e) => updateDisplaySettings({ wikiOnlyInPlayRoles: e.target.checked })}
                              className="rounded border-border w-3.5 h-3.5 text-primary"
                            />
                            Seulement les rôles en jeu
                          </label>
                        </div>
                        <label className="flex items-center gap-2 text-xs cursor-pointer hover:text-primary transition-colors">
                          <input
                            type="checkbox"
                            checked={displaySettings.showWikiTags ?? true}
                            onChange={(e) => updateDisplaySettings({ showWikiTags: e.target.checked })}
                            className="rounded border-border w-3.5 h-3.5 text-primary"
                          />
                          Afficher les Tags
                        </label>
                      </div>
                    )}
                    {tool.key === 'scoreboard' && (displaySettings.panels?.scoreboard ?? true) && expandedOutils.scoreboard && (
                      <div className="ml-8 grid grid-cols-2 gap-2 p-3 bg-muted/10 border-l-2 border-yellow-500/30 rounded-r-lg">
                        {[
                          { key: 'showRoles', label: 'Afficher le rôle' },
                          { key: 'showPoints', label: 'Afficher les points' },
                          { key: 'showVotes', label: 'Afficher les votes' },
                          { key: 'showStatus', label: 'Afficher le statut' }
                        ].map(col => (
                          <label key={col.key} className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={(scoreboard as any)[col.key] ?? true}
                              onChange={(e) => {
                                const updates: any = {};
                                updates[col.key] = e.target.checked;
                                if (col.key === 'showVotes') updates.showLives = e.target.checked; 
                                setScoreboard(updates);
                              }}
                              className="rounded border-border w-4 h-4 text-yellow-500 focus:ring-yellow-500"
                            />
                            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                              {col.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                    {tool.key === 'logs' && (displaySettings.panels?.logs ?? true) && expandedOutils.logs && (
                      <div className="ml-8 flex items-center gap-3 p-2 bg-muted/10 border-l-2 border-primary/30">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={displaySettings.recordLogs ?? true}
                            onChange={(e) => updateDisplaySettings({ recordLogs: e.target.checked })}
                            className="rounded-full border-border w-4 h-4 text-teal-400 focus:ring-teal-400"
                          />
                          <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                            {displaySettings.recordLogs ?? true ? 'Écoute activée' : 'Écoute désactivée'}
                          </span>
                        </label>
                      </div>
                    )}
                    </div>
                  ))}
                </div>
              </section>


            </div>
          )}

          {/* TAB: REMOTE */}
          {activeTab === 'remote' && (
            <div className="flex flex-col gap-6">
              <section>
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2 mb-3">Configuration de la Télécommande</h3>
                <div className="flex flex-col gap-4 p-4 bg-muted/20 rounded-lg border border-border">
                  <label className="flex items-center gap-3 text-sm font-bold cursor-pointer hover:text-primary transition-colors">
                    <input
                      type="checkbox"
                      checked={soundboard.remoteEnabled || false}
                      onChange={(e) => setSoundboard({ remoteEnabled: e.target.checked })}
                      className="rounded border-border w-5 h-5 text-primary"
                    />
                    Activer le portail "Soundboard / Télécommande"
                  </label>
                  <p className="text-[11px] text-muted-foreground leading-relaxed pl-8">
                    Si activé, l'URL <code>/remote</code> permettra à un appareil de se connecter à la boîte à sons et à la checklist du MJ à distance.
                  </p>
                  
                  {soundboard.remoteEnabled && (
                    <div className="pl-8 pt-3 border-t border-border/50 flex flex-col gap-4 mt-2">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase font-bold text-foreground tracking-widest">Code d'accès obligatoire</label>
                        <input
                          type="text"
                          value={soundboard.remotePasscode || ''}
                          onChange={(e) => setSoundboard({ remotePasscode: e.target.value })}
                          className="bg-input border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-fit font-mono tracking-widest"
                          placeholder="EX: 1234"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
