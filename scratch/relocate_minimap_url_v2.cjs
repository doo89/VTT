const fs = require('fs');
const path = 'c:/Users/lcdoo/Desktop/VTTApp/src/components/layout/SettingsModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Finding the Minimap URL block
const searchStr = 'URL de Miniature de la Salle';
const textIdx = content.indexOf(searchStr);

if (textIdx !== -1) {
    const lines = content.split(/\r?\n/);
    let targetIdx = lines.findIndex(l => l.includes(searchStr));
    
    // Find the containing div (start of the block)
    let startIdx = targetIdx;
    while (startIdx > 0 && !lines[startIdx].includes('className="flex flex-col gap-2 mt-2 pt-4 border-t border-border/30"')) startIdx--;
    
    // Find end of this div (end of the block)
    let endIdx = startIdx;
    let depth = 1;
    while (endIdx < lines.length - 1 && depth > 0) {
        endIdx++;
        if (lines[endIdx].includes('<div')) depth++;
        if (lines[endIdx].includes('</div>')) depth--;
    }
    
    if (startIdx !== -1 && endIdx < lines.length) {
        const blockLines = lines.splice(startIdx, endIdx - startIdx + 1);
        console.log('Successfully extracted Minimap block');
        
        // 2. Find insertion point
        const insertionSearch = 'Afficher l\'onglet "Salle" (Miniature globale)';
        const insertionLineIdx = lines.findIndex(l => l.includes(insertionSearch));
        
        if (insertionLineIdx !== -1) {
            let labelEndIdx = insertionLineIdx;
            while (labelEndIdx < lines.length && !lines[labelEndIdx].includes('</label>')) labelEndIdx++;
            
            if (labelEndIdx < lines.length) {
                // Adjust style for nested look
                const nestedBlock = blockLines.map(l => l.replace('mt-2 pt-4 border-t border-border/30', 'ml-7 mt-1')).join('\n');
                lines.splice(labelEndIdx + 1, 0, nestedBlock);
                console.log('Successfully inserted Minimap block');
                
                fs.writeFileSync(path, lines.join('\n'));
            }
        }
    }
} else {
    console.error('Text "URL de Miniature de la Salle" not found');
    process.exit(1);
}
