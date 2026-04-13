const fs = require('fs');
const path = 'c:/Users/lcdoo/Desktop/VTTApp/src/components/layout/SettingsModal.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = 'Afficher l\'onglet "Salle" (Miniature globale)';
const newPart = `                          Afficher l'onglet "Salle" (Miniature globale)
                        </label>
                        <label className="flex items-center gap-3 text-sm cursor-pointer hover:text-primary transition-colors">
                          <input
                            type="checkbox"
                            checked={displaySettings.smartphoneTabs?.wiki ?? true}
                            onChange={(e) => updateDisplaySettings({ smartphoneTabs: { ...(displaySettings.smartphoneTabs || { game: true, players: true, room: true, wiki: true }), wiki: e.target.checked } })}
                            className="rounded border-border w-4 h-4 text-primary"
                          />
                          Afficher l'onglet "Wiki" (Notes & Rôles)
                        </label>`;

if (content.includes(target)) {
    // We need to replace the whole label block
    const lines = content.split(/\r?\n/);
    const targetLineIdx = lines.findIndex(l => l.includes(target));
    if (targetLineIdx !== -1) {
        // Find the start of the label (the line before which has <label...)
        let startIdx = targetLineIdx;
        while (startIdx > 0 && !lines[startIdx].includes('<label')) startIdx--;
        
        // Find the end of the label (the line which has </label>)
        let endIdx = targetLineIdx;
        while (endIdx < lines.length && !lines[endIdx].includes('</label>')) endIdx++;
        
        if (startIdx !== -1 && endIdx !== -1) {
            const newContent = [
                ...lines.slice(0, startIdx),
                `                        <label className="flex items-center gap-3 text-sm cursor-pointer hover:text-primary transition-colors">
                          <input
                            type="checkbox"
                            checked={displaySettings.smartphoneTabs?.room ?? true}
                            onChange={(e) => updateDisplaySettings({ smartphoneTabs: { ...(displaySettings.smartphoneTabs || { game: true, players: true, room: true, wiki: true }), room: e.target.checked } })}
                            className="rounded border-border w-4 h-4 text-primary"
                          />
                          Afficher l'onglet "Salle" (Miniature globale)
                        </label>
                        <label className="flex items-center gap-3 text-sm cursor-pointer hover:text-primary transition-colors">
                          <input
                            type="checkbox"
                            checked={displaySettings.smartphoneTabs?.wiki ?? true}
                            onChange={(e) => updateDisplaySettings({ smartphoneTabs: { ...(displaySettings.smartphoneTabs || { game: true, players: true, room: true, wiki: true }), wiki: e.target.checked } })}
                            className="rounded border-border w-4 h-4 text-primary"
                          />
                          Afficher l'onglet "Wiki" (Notes & Rôles)
                        </label>`,
                ...lines.slice(endIdx + 1)
            ].join('\n');
            fs.writeFileSync(path, newContent);
            console.log('Successfully patched SettingsModal.tsx');
        }
    }
} else {
    console.error('Target not found');
    process.exit(1);
}
