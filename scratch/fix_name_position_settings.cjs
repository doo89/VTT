const fs = require('fs');
const path = 'c:/Users/lcdoo/Desktop/VTTApp/src/components/layout/SettingsModal.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/Position du nom \(sans image\) :/g, 'Position du nom :');
content = content.replace(/playerNamePosition: e\.target\.value as 'inside' \| 'bottom'/g, 'playerNamePosition: e.target.value as any');
content = content.replace(/<option value="inside">.*?<\/option>\s*<option value="bottom">.*?<\/option>/s, 
    `<option value="none">Aucun</option>
                             <option value="bottom">En dessous</option>
                             <option value="top">Au dessus</option>
                             <option value="inside">À l'intérieur de la pastille</option>`);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated name position settings via script');
