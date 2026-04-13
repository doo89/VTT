const fs = require('fs');
const path = 'c:/Users/lcdoo/Desktop/VTTApp/src/components/layout/SettingsModal.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetStr = 'Afficher l\'onglet "Salle" (Miniature globale)';
const lines = content.split(/\r?\n/);
const targetIdx = lines.findIndex(l => l.includes(targetStr));

if (targetIdx !== -1) {
    // Find where the conditional block starts
    let blockStartIdx = targetIdx;
    while (blockStartIdx < lines.length && !lines[blockStartIdx].includes('className="flex flex-col gap-2 ml-7 mt-1"')) blockStartIdx++;
    
    if (blockStartIdx < lines.length) {
        const newSettings = `                     <label className="flex items-center gap-3 text-xs cursor-pointer hover:text-primary transition-colors">
                       <input
                         type="checkbox"
                         checked={displaySettings.roomMiniatureAnimation ?? true}
                         onChange={(e) => updateDisplaySettings({ roomMiniatureAnimation: e.target.checked })}
                         className="rounded border-border w-3.5 h-3.5 text-primary"
                       />
                       Animation des joueurs
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
                     </div>`;
        
        lines.splice(blockStartIdx + 1, 0, newSettings);
        fs.writeFileSync(path, lines.join('\n'));
        console.log('Successfully inserted new Room Miniature settings');
    }
} else {
    console.error('Target not found');
    process.exit(1);
}
