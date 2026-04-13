const fs = require('fs');
const path = 'c:/Users/lcdoo/Desktop/VTTApp/src/components/layout/SettingsModal.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetSearch = `Afficher les Rôles`;

if (content.includes(targetSearch)) {
    const lines = content.split(/\r?\n/);
    const targetIdx = lines.findIndex(l => l.includes(targetSearch));
    
    // Find the end of the roles checkbox label
    let labelEndIdx = targetIdx;
    while (labelEndIdx < lines.length && !lines[labelEndIdx].includes('</label>')) labelEndIdx++;
    
    if (labelEndIdx < lines.length) {
        const newFilters = `                          <div className="flex flex-col gap-1.5 ml-5 mt-1">
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
                          </div>`;
        
        const newLines = [
            ...lines.slice(0, labelEndIdx + 1),
            newFilters,
            ...lines.slice(labelEndIdx + 1)
        ];
        
        fs.writeFileSync(path, newLines.join('\n'));
        console.log('Successfully added sub-filters for roles');
    }
} else {
    console.error('Target label not found');
    process.exit(1);
}
