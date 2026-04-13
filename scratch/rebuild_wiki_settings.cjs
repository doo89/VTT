const fs = require('fs');
const path = 'c:/Users/lcdoo/Desktop/VTTApp/src/components/layout/SettingsModal.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetSearch = `<label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Titre du Wiki</label>`;

if (content.includes(targetSearch)) {
    const lines = content.split(/\r?\n/);
    const targetIdx = lines.findIndex(l => l.includes(targetSearch));
    
    // Find the enclosing div
    let divStartIdx = targetIdx;
    while (divStartIdx > 0 && !lines[divStartIdx].includes('<div className="flex flex-col gap-2 ml-7 mt-1">')) divStartIdx--;
    
    let divEndIdx = targetIdx;
    while (divEndIdx < lines.length && !lines[divEndIdx].includes('</div>')) divEndIdx++; // This will find the inner one
    divEndIdx++; // Move past the inner div (title input)
    while (divEndIdx < lines.length && !lines[divEndIdx].includes('</div>')) divEndIdx++; // This will find the outer one 
    
    if (divStartIdx !== -1 && divEndIdx < lines.length) {
        const replacement = `                        <div className="flex flex-col gap-2 ml-7 mt-1">
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
                        </div>`;
        
        const newLines = [
            ...lines.slice(0, divStartIdx),
            replacement,
            ...lines.slice(divEndIdx + 1)
        ];
        
        fs.writeFileSync(path, newLines.join('\n'));
        console.log('Successfully updated Wiki settings arborescence');
    }
} else {
    console.error('Target not found');
    process.exit(1);
}
