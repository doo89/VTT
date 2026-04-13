const fs = require('fs');
const path = 'c:/Users/lcdoo/Desktop/VTTApp/src/components/layout/SettingsModal.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetDivSearch = '<div className="flex flex-col gap-2 ml-7 mt-1">';

if (content.includes(targetDivSearch)) {
    const lines = content.split(/\r?\n/);
    const startIdx = lines.findIndex(l => l.includes(targetDivSearch));
    
    // Find the matching end div
    let endIdx = startIdx;
    let depth = 1;
    while (endIdx < lines.length - 1 && depth > 0) {
        endIdx++;
        if (lines[endIdx].includes('<div')) depth++;
        if (lines[endIdx].includes('</div>')) depth--;
    }
    
    if (startIdx !== -1 && endIdx < lines.length) {
        // Wrap with conditional
        const newLines = [
            ...lines.slice(0, startIdx),
            `                        {(displaySettings.smartphoneTabs?.wiki ?? true) && (`,
            ...lines.slice(startIdx, endIdx + 1),
            `                        )}`,
            ...lines.slice(endIdx + 1)
        ];
        
        fs.writeFileSync(path, newLines.join('\n'));
        console.log('Successfully wrapped Wiki sub-settings in conditional block');
    }
} else {
    console.error('Target div not found');
    process.exit(1);
}
