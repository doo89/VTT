const fs = require('fs');
const path = 'c:/Users/lcdoo/Desktop/VTTApp/src/components/layout/SettingsModal.tsx';
let lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);

// Filter out duplicate declarations of expandedSmartphone
let found = false;
let newLines = lines.filter(line => {
  if (line.includes('const [expandedSmartphone, setExpandedSmartphone]')) {
    if (!found) {
      found = true;
      return true;
    }
    return false;
  }
  return true;
});

fs.writeFileSync(path, newLines.join('\r\n'));
console.log('Successfully removed duplicate state in SettingsModal.tsx');
