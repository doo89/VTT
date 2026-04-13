const fs = require('fs');
const path = 'c:/Users/lcdoo/Desktop/VTTApp/src/components/layout/SettingsModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove the section from the Smartphone tab
const remoteSectionStart = '<section>\n                 <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2 mb-3">Télécommande Soundboard</h3>';
const remoteSectionEnd = '</section>';

const lines = content.split(/\r?\n/);
let startIdx = lines.findIndex(l => l.includes('<h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2 mb-3">Télécommande Soundboard</h3>'));
if (startIdx !== -1) {
    // Back up to the <section>
    while (startIdx > 0 && !lines[startIdx].includes('<section>')) startIdx--;
    
    // Find the end </section>
    let endIdx = startIdx;
    let depth = 0;
    while (endIdx < lines.length) {
        if (lines[endIdx].includes('<section')) depth++;
        if (lines[endIdx].includes('</section>')) depth--;
        if (depth === 0) break;
        endIdx++;
    }
    
    if (startIdx !== -1 && endIdx !== -1) {
        lines.splice(startIdx, endIdx - startIdx + 1);
        console.log('Removed Télécommande Soundboard section from Smartphone tab');
    }
}

// 2. Add the remote settings under the Soundboard tool in Outils tab
const targetToolLine = `{ key: 'soundboard', label: 'Boîte à Sons (Soundboard)' },`;
const toolIdx = lines.findIndex(l => l.includes(targetToolLine));

if (toolIdx !== -1) {
    // We need to find the place after the map loop finishes for the soundboard tool.
    // However, the current code maps over an array and then checks for tool.key inside the loop.
    // I need to find the end of the soundboard label div and insert the block there.
    
    const insertionPoint = lines.findIndex(l => l.includes("{tool.key === 'scoreboard' && (displaySettings.panels?.scoreboard ?? true) && ("));
    
    if (insertionPoint !== -1) {
        const remoteSettingsBlock = `                    {tool.key === 'soundboard' && (displaySettings.panels?.soundboard ?? true) && (
                      <div className="ml-8 flex flex-col gap-4 p-4 bg-muted/20 rounded-lg border border-border mt-1 mb-2">
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
                           Si activé, l'URL <code>/soundboard</code> permettra à un appareil de se connecter à la boîte à sons du MJ à distance (sans voir le jeu). 
                         </p>
                         
                         {soundboard.remoteEnabled && (
                           <div className="pl-8 pt-3 border-t border-border/50 flex flex-col gap-2 mt-2">
                             <label className="text-[10px] uppercase font-bold text-foreground tracking-widest">Code d'accès obligatoire</label>
                             <input
                               type="text"
                               value={soundboard.remotePasscode || ''}
                               onChange={(e) => setSoundboard({ remotePasscode: e.target.value })}
                               className="bg-input border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-fit font-mono tracking-widest"
                               placeholder="EX: 1234"
                             />
                           </div>
                         )}
                      </div>
                    )}`;
        
        lines.splice(insertionPoint, 0, remoteSettingsBlock);
        console.log('Inserted Soundboard Remote settings into Outils tab');
    }
}

fs.writeFileSync(path, lines.join('\n'));
