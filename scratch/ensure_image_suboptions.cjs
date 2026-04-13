const fs = require('fs');
const path = 'c:/Users/lcdoo/Desktop/VTTApp/src/components/layout/SettingsModal.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetSelectLine = '</select>';
const lines = content.split(/\r?\n/);

// Find the select line for smartphoneImageStyle
const selectIdx = lines.findIndex((l, i) => l.includes(targetSelectLine) && i > 500 && i < 600);

if (selectIdx !== -1) {
    // Check if sub-options already exist
    if (!content.includes('smartphoneImageBlur')) {
        const subOptions = `                    {displaySettings.smartphoneImageStyle === 'background' && (
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
        
        lines.splice(selectIdx + 1, 0, subOptions);
        fs.writeFileSync(path, lines.join('\n'));
        console.log('Successfully inserted missing image style sub-options');
    } else {
        console.log('Sub-options already present');
    }
} else {
    console.error('Target select not found');
    process.exit(1);
}
