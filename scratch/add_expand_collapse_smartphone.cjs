const fs = require('fs');
const path = 'c:/Users/lcdoo/Desktop/VTTApp/src/components/layout/SettingsModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add expandedSmartphone state
const stateMatch = /const \[expandedOutils, setExpandedOutils\] = useState<Record<string, boolean>>\({ soundboard: true, scoreboard: true, logs: true }\);/;
if (content.match(stateMatch)) {
  content = content.replace(stateMatch, `$&\n  const [expandedSmartphone, setExpandedSmartphone] = useState<Record<string, boolean>>({ game: true, players: true, room: true, wiki: true });`);
}

// 1. Jeu
content = content.replace(
  /<label className="flex items-center gap-3 text-sm cursor-pointer hover:text-primary transition-colors">\s*<input\s*type="checkbox"\s*checked=\{displaySettings\.smartphoneTabs\?\.game \?\? true\}\s*onChange=\{\(e\) => updateDisplaySettings\(\{ smartphoneTabs: \{ \.\.\.\(displaySettings\.smartphoneTabs \|\| \{ game: true, players: true, room: true \}\), game: e\.target\.checked \} \}\)\}\s*className="rounded border-border w-4 h-4 text-primary"\s*\/>\s*Afficher l'onglet "Jeu" \(Plateau principal, actions de base\)\s*<\/label>/,
  `<div className="flex items-center justify-between">
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
                        </div>`
);
content = content.replace(
  /\{\(displaySettings\.smartphoneTabs\?\.game \?\? true\) && \(/,
  `{(displaySettings.smartphoneTabs?.game ?? true) && expandedSmartphone.game && (`
);

// 2. Joueurs
content = content.replace(
  /<label className="flex items-center gap-3 text-sm cursor-pointer hover:text-primary transition-colors">\s*<input\s*type="checkbox"\s*checked=\{displaySettings\.smartphoneTabs\?\.players \?\? true\}\s*onChange=\{\(e\) => updateDisplaySettings\(\{ smartphoneTabs: \{ \.\.\.\(displaySettings\.smartphoneTabs \|\| \{ game: true, players: true, room: true \}\), players: e\.target\.checked \} \}\)\}\s*className="rounded border-border w-4 h-4 text-primary"\s*\/>\s*Afficher l'onglet "Joueurs" \(Liste des joueurs en jeu\)\s*<\/label>/,
  `<div className="flex items-center justify-between border-t border-border/10 pt-2 pb-0.5">
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
                        </div>`
);
content = content.replace(
  /\{\(displaySettings\.smartphoneTabs\?\.players \?\? true\) && \(/,
  `{(displaySettings.smartphoneTabs?.players ?? true) && expandedSmartphone.players && (`
);

// 3. Salle
content = content.replace(
  /<label className="flex items-center gap-3 text-sm cursor-pointer hover:text-primary transition-colors">\s*<input\s*type="checkbox"\s*checked=\{displaySettings\.smartphoneTabs\?\.room \?\? true\}\s*onChange=\{\(e\) => updateDisplaySettings\(\{ smartphoneTabs: \{ \.\.\.\(displaySettings\.smartphoneTabs \|\| \{ game: true, players: true, room: true, wiki: true \}\), room: e\.target\.checked \} \}\)\}\s*className="rounded border-border w-4 h-4 text-primary"\s*\/>\s*Afficher l'onglet "Salle" \(Miniature globale\)\s*<\/label>/,
  `<div className="flex items-center justify-between border-t border-border/10 pt-2 pb-0.5">
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
                        </div>`
);
content = content.replace(
  /\{\(displaySettings\.smartphoneTabs\?\.room \?\? true\) && \(/,
  `{(displaySettings.smartphoneTabs?.room ?? true) && expandedSmartphone.room && (`
);

// 4. Wiki
content = content.replace(
  /<label className="flex items-center gap-3 text-sm cursor-pointer hover:text-primary transition-colors">\s*<input\s*type="checkbox"\s*checked=\{displaySettings\.smartphoneTabs\?\.wiki \?\? true\}\s*onChange=\{\(e\) => updateDisplaySettings\(\{ smartphoneTabs: \{ \.\.\.\(displaySettings\.smartphoneTabs \|\| \{ game: true, players: true, room: true, wiki: true \}\), wiki: e\.target\.checked \} \}\)\}\s*className="rounded border-border w-4 h-4 text-primary"\s*\/>\s*Afficher l'onglet "Wiki" \(Notes & Rôles\)\s*<\/label>/,
  `<div className="flex items-center justify-between border-t border-border/10 pt-2 pb-0.5">
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
                        </div>`
);
content = content.replace(
  /\{\(displaySettings\.smartphoneTabs\?\.wiki \?\? true\) && \(/g,
  `{(displaySettings.smartphoneTabs?.wiki ?? true) && expandedSmartphone.wiki && (`
);

fs.writeFileSync(path, content);
console.log('Successfully updated SettingsModal.tsx');
