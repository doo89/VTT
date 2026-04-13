const fs = require('fs');
const path = 'c:/Users/lcdoo/Desktop/VTTApp/src/components/layout/SettingsModal.tsx';
let content = fs.readFileSync(path, 'utf8');

const lines = content.split(/\r?\n/);

// 1. Add "Aucune" to the select and the secondary options
const selectSearch = 'Définit la forme de l\'image affichée sur l\'écran du smartphone des joueurs.';
const selectIdx = lines.findIndex(l => l.includes(selectSearch));

if (selectIdx !== -1) {
    // Find the <select>
    let selectLineIdx = selectIdx;
    while (selectLineIdx < lines.length && !lines[selectLineIdx].includes('<select')) selectLineIdx++;
    
    // Find where options end
    let optionsEndIdx = selectLineIdx;
    while (optionsEndIdx < lines.length && !lines[optionsEndIdx].includes('</select>')) optionsEndIdx++;
    
    if (optionsEndIdx < lines.length) {
        // Add "Aucune" option at the end
        lines.splice(optionsEndIdx, 0, `                       <option value="none">Aucune (Pas d'image)</option>`);
        console.log('Added "none" option to image style select');
        
        // Re-find indices because we spliced
        let newOptionsEndIdx = lines.findIndex(l => l.includes('</select>'));
        
        // Add the sub-options if background is selected
        const subOptions = `                     {displaySettings.smartphoneImageStyle === 'background' && (
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
                             value={displaySettings.smartphoneImageMinHeight ?? 400}
                             onChange={(e) => updateDisplaySettings({ smartphoneImageMinHeight: parseInt(e.target.value) })}
                             className="bg-input border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary w-24"
                           />
                         </div>
                       </div>
                     )}`;
        
        lines.splice(newOptionsEndIdx + 1, 0, subOptions);
        console.log('Added blur and min-height sub-options');
    }
}

fs.writeFileSync(path, lines.join('\n'));
