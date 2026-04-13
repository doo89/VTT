const fs = require('fs');
const path = 'c:/Users/lcdoo/Desktop/VTTApp/src/components/layout/SettingsModal.tsx';
let content = fs.readFileSync(path, 'utf8');

const lines = content.split(/\r?\n/);

// 1. Extract the Minimap URL block
let minimapStartIdx = lines.findIndex(l => l.includes('URL de Miniature de la Salle</span>'));
if (minimapStartIdx !== -1) {
    // Back up to the containing div
    // It's the div with className="flex flex-col gap-2 mt-2 pt-4 border-t border-border/30"
    while (minimapStartIdx > 0 && !lines[minimapStartIdx].includes('className="flex flex-col gap-2 mt-2 pt-4 border-t border-border/30"')) minimapStartIdx--;
    
    // Find end of this div
    let minimapEndIdx = minimapStartIdx;
    let depth = 1;
    while (minimapEndIdx < lines.length - 1 && depth > 0) {
        minimapEndIdx++;
        if (lines[minimapEndIdx].includes('<div')) depth++;
        if (lines[minimapEndIdx].includes('</div>')) depth--;
    }
    
    if (minimapStartIdx !== -1 && minimapEndIdx < lines.length) {
        const minimapBlockLines = lines.splice(minimapStartIdx, minimapEndIdx - minimapStartIdx + 1);
        console.log('Extracted Minimap URL block');
        
        // 2. Find the target insertion point under "Afficher l'onglet Salle"
        const targetSearch = `Afficher l'onglet "Salle" (Miniature globale)`;
        const targetLabelIdx = lines.findIndex(l => l.includes(targetSearch));
        
        if (targetLabelIdx !== -1) {
            let labelEndIdx = targetLabelIdx;
            while (labelEndIdx < lines.length && !lines[labelEndIdx].includes('</label>')) labelEndIdx++;
            
            if (labelEndIdx < lines.length) {
                // Adjust indent and styling for the block to look good nested
                const nestedBlock = minimapBlockLines.map(l => l.replace('mt-2 pt-4 border-t border-border/30', 'ml-7 mt-1')).join('\n');
                
                lines.splice(labelEndIdx + 1, 0, nestedBlock);
                console.log('Inserted Minimap URL block under Salle tab option');
            }
        }
    }
}

fs.writeFileSync(path, lines.join('\n'));
