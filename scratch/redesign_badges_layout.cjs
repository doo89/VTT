const fs = require('fs');
const path = 'c:/Users/lcdoo/Desktop/VTTApp/src/components/layout/SettingsModal.tsx';
let content = fs.readFileSync(path, 'utf8');

const lines = content.split(/\r?\n/);

// 1. Find the section
const sectionSearch = 'Pastilles (Coins des pions)';
const headerIdx = lines.findIndex(l => l.includes(sectionSearch));

if (headerIdx !== -1) {
    let startIdx = headerIdx + 1;
    while (startIdx < lines.length && !lines[startIdx].includes('.map(corner')) startIdx--;
    
    // Find the end of the map block
    let endIdx = startIdx;
    let braceDepth = 0;
    let foundStart = false;
    while (endIdx < lines.length) {
        if (lines[endIdx].includes('{')) { braceDepth++; foundStart = true; }
        if (lines[endIdx].includes('}')) braceDepth--;
        if (foundStart && braceDepth === 0) break;
        endIdx++;
    }
    
    // Now replace the whole div containing the map with a new layout
    const outerDivStart = startIdx - 1; // <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    const outerDivEnd = endIdx + 1;    // </div>
    
    // We want to capture the corner objects
    const cornerObjects = `[
                              { key: 'topLeft', label: 'Haut Gauche' },
                              { key: 'topRight', label: 'Haut Droite' },
                              { key: 'bottomLeft', label: 'Bas Gauche' },
                              { key: 'bottomRight', label: 'Bas Droite' }
                            ]`;

    const newLayout = `                        <div className="relative mt-6 max-w-2xl mx-auto px-4 py-8 bg-muted/5 rounded-2xl border border-border/20 shadow-inner">
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
                                    {config.type === 'connection' && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* 4 Corner Selectors */}
                          <div className="grid grid-cols-2 gap-x-32 gap-y-24 sm:gap-x-48">
                            {${cornerObjects}.map(corner => {
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
                                <div key={corner.key} className={\`flex flex-col gap-2 p-3 bg-muted/40 backdrop-blur-sm rounded-xl border border-border/60 hover:border-primary/40 transition-all shadow-sm \${isLeft ? 'items-start' : 'items-end'}\`}>
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
                                    </select>

                                    {badge.type !== 'none' && badge.type !== 'team' && badge.type !== 'connection' && (
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
                                </div>
                              );
                            })}
                          </div>
                          
                          <p className="mt-8 text-center text-[10px] text-muted-foreground uppercase tracking-tighter opacity-50">
                            Configurez l'affichage des informations importantes directement sur les pions du plateau.
                          </p>
                        </div>`;

    lines.splice(outerDivStart, outerDivEnd - outerDivStart + 1, newLayout);
    fs.writeFileSync(path, lines.join('\n'));
    console.log('Redesigned Badge/Corner settings with central preview');
} else {
    console.error('Corner section not found');
}
