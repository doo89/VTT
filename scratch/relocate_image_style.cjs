const fs = require('fs');
const path = 'c:/Users/lcdoo/Desktop/VTTApp/src/components/layout/SettingsModal.tsx';
let content = fs.readFileSync(path, 'utf8');

const lines = content.split(/\r?\n/);

// 1. Extract the Image Style block
let styleStartIdx = lines.findIndex(l => l.includes('<label className="text-xs font-bold text-foreground">Style de l\'image (Avatar / Rôle)</label>'));
if (styleStartIdx !== -1) {
    // Back up to the containing div
    while (styleStartIdx > 0 && !lines[styleStartIdx].includes('<div className="flex flex-col gap-1.5 w-fit mt-2 pt-4 border-t border-border/30">')) styleStartIdx--;
    
    // Find end of this div
    let styleEndIdx = styleStartIdx;
    let depth = 1;
    while (styleEndIdx < lines.length - 1 && depth > 0) {
        styleEndIdx++;
        if (lines[styleEndIdx].includes('<div')) depth++;
        if (lines[styleEndIdx].includes('</div>')) depth--;
    }
    
    if (styleStartIdx !== -1 && styleEndIdx < lines.length) {
        const styleBlockLines = lines.splice(styleStartIdx, styleEndIdx - styleStartIdx + 1);
        console.log('Extracted Image Style block');
        
        // 2. Find the target insertion point under "Afficher l'onglet Jeu"
        // The label for "Jeu" ends at </label>
        const targetSearch = `Afficher l'onglet "Jeu" (Plateau principal, actions de base)`;
        const targetLabelIdx = lines.findIndex(l => l.includes(targetSearch));
        
        if (targetLabelIdx !== -1) {
            let labelEndIdx = targetLabelIdx;
            while (labelEndIdx < lines.length && !lines[labelEndIdx].includes('</label>')) labelEndIdx++;
            
            if (labelEndIdx < lines.length) {
                // Adjust indent and styling for the block to look good nested
                const nestedBlock = styleBlockLines.map(l => l.replace('mt-2 pt-4 border-t border-border/30', 'ml-7 mt-1')).join('\n');
                
                lines.splice(labelEndIdx + 1, 0, nestedBlock);
                console.log('Inserted Image Style block under Jeu tab option');
            }
        }
    }
}

fs.writeFileSync(path, lines.join('\n'));
