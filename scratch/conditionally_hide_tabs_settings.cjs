const fs = require('fs');
const path = 'c:/Users/lcdoo/Desktop/VTTApp/src/components/layout/SettingsModal.tsx';
let content = fs.readFileSync(path, 'utf8');

const lines = content.split(/\r?\n/);

// 1. Handle "Jeu" tab sub-settings
const jeuSearch = 'Afficher l\'onglet "Jeu" (Plateau principal, actions de base)';
const jeuIdx = lines.findIndex(l => l.includes(jeuSearch));
if (jeuIdx !== -1) {
    let labelEndIdx = jeuIdx;
    while (labelEndIdx < lines.length && !lines[labelEndIdx].includes('</label>')) labelEndIdx++;
    
    // The next block should be our relocated Image Style div
    if (labelEndIdx < lines.length && lines[labelEndIdx + 1].includes('className="flex flex-col gap-1.5 w-fit ml-7 mt-1"')) {
        let divStartIdx = labelEndIdx + 1;
        let divEndIdx = divStartIdx;
        let depth = 1;
        while (divEndIdx < lines.length - 1 && depth > 0) {
            divEndIdx++;
            if (lines[divEndIdx].includes('<div')) depth++;
            if (lines[divEndIdx].includes('</div>')) depth--;
        }
        
        if (divStartIdx !== -1 && divEndIdx < lines.length) {
            lines.splice(divEndIdx + 1, 0, '                        )}');
            lines.splice(divStartIdx, 0, '                        {(displaySettings.smartphoneTabs?.game ?? true) && (');
            console.log('Wrapped Jeu sub-settings in conditional block');
        }
    }
}

// 2. Handle "Salle" tab sub-settings
// Note: Indices shift after first splice, so we need to find it again
const salleSearch = 'Afficher l\'onglet "Salle" (Miniature globale)';
const salleIdx = lines.findIndex(l => l.includes(salleSearch));
if (salleIdx !== -1) {
    let labelEndIdx = salleIdx;
    while (labelEndIdx < lines.length && !lines[labelEndIdx].includes('</label>')) labelEndIdx++;
    
    // The next block should be our relocated Minimap URL div
    if (labelEndIdx < lines.length && lines[labelEndIdx + 1].includes('className="flex flex-col gap-2 ml-7 mt-1"')) {
        let divStartIdx = labelEndIdx + 1;
        let divEndIdx = divStartIdx;
        let depth = 1;
        while (divEndIdx < lines.length - 1 && depth > 0) {
            divEndIdx++;
            if (lines[divEndIdx].includes('<div')) depth++;
            if (lines[divEndIdx].includes('</div>')) depth--;
        }
        
        if (divStartIdx !== -1 && divEndIdx < lines.length) {
            lines.splice(divEndIdx + 1, 0, '                        )}');
            lines.splice(divStartIdx, 0, '                        {(displaySettings.smartphoneTabs?.room ?? true) && (');
            console.log('Wrapped Salle sub-settings in conditional block');
        }
    }
}

fs.writeFileSync(path, lines.join('\n'));
