const fs = require('fs');
const path = 'c:/Users/lcdoo/Desktop/VTTApp/src/components/layout/SettingsModal.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetLabelSearch = `Afficher l'onglet "Wiki" (Notes & Rôles)`;

if (content.includes(targetLabelSearch)) {
    const lines = content.split(/\r?\n/);
    const targetIdx = lines.findIndex(l => l.includes(targetLabelSearch));
    
    // Find the end of the wiki label
    let labelEndIdx = targetIdx;
    while (labelEndIdx < lines.length && !lines[labelEndIdx].includes('</label>')) labelEndIdx++;
    
    if (labelEndIdx < lines.length) {
        const newFields = `                        <div className="flex flex-col gap-2 ml-7 mt-1">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Titre du Wiki</label>
                            <input
                              type="text"
                              value={displaySettings.wikiTitle || 'NOTE DU MAÎTRE DU JEU'}
                              onChange={(e) => updateDisplaySettings({ wikiTitle: e.target.value })}
                              placeholder="Ex: NOTE DU MAÎTRE DU JEU"
                              className="bg-input border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary w-full max-w-[200px]"
                            />
                          </div>
                          <label className="flex items-center gap-2 text-xs cursor-pointer hover:text-primary transition-colors">
                            <input
                              type="checkbox"
                              checked={displaySettings.wikiLightMode || false}
                              onChange={(e) => updateDisplaySettings({ wikiLightMode: e.target.checked })}
                              className="rounded border-border w-3.5 h-3.5 text-primary"
                            />
                            Fond clair (Améliore la lisibilité)
                          </label>
                        </div>`;
        
        const newLines = [
            ...lines.slice(0, labelEndIdx + 1),
            newFields,
            ...lines.slice(labelEndIdx + 1)
        ];
        
        fs.writeFileSync(path, newLines.join('\n'));
        console.log('Successfully added Wiki title and light mode fields');
    }
} else {
    console.error('Target label not found');
    process.exit(1);
}
