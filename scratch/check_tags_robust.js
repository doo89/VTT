
import fs from 'fs';

const content = fs.readFileSync('c:\\Users\\lcdoo\\Desktop\\VTTApp\\src\\components\\layout\\SettingsModal.tsx', 'utf8');

function robustCheck(content) {
    const stack = [];
    const lines = content.split('\n');
    let inComment = false;
    let inMultilineComment = false;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // Remove strings to avoid picking up tags inside them
        line = line.replace(/(["'`])(?:(?=(\\?))\2.)*?\1/g, '""');
        
        // Remove single line comments
        line = line.replace(/\/\/.*$/, '');

        // Handle multiline comments
        if (inMultilineComment) {
            if (line.includes('*/')) {
                line = line.substring(line.indexOf('*/') + 2);
                inMultilineComment = false;
            } else {
                continue;
            }
        }
        if (line.includes('/*')) {
            if (line.includes('*/')) {
                line = line.replace(/\/\*.*?\*\//g, '');
            } else {
                line = line.substring(0, line.indexOf('/*'));
                inMultilineComment = true;
            }
        }

        const tagRegex = /<(\/?[a-zA-Z][a-zA-Z0-9]*)/g;
        let match;
        while ((match = tagRegex.exec(line)) !== null) {
            const tagName = match[1];
            const startPos = match.index;
            const endPos = line.indexOf('>', startPos);
            
            if (endPos === -1) continue; // Tag spans multiple lines, simplified here

            const fullTag = line.substring(startPos, endPos + 1);
            
            // Skip self-closing tags
            if (fullTag.endsWith('/>')) continue;
            // Common self-closing in HTML (though JSX usually requires />)
            if (['input', 'img', 'br', 'hr', 'meta', 'link'].includes(tagName.toLowerCase())) continue;

            if (tagName.startsWith('/')) {
                const name = tagName.substring(1);
                if (stack.length === 0) {
                    console.log(`Error: Extra closing tag </${name}> at line ${i + 1}`);
                } else {
                    const last = stack.pop();
                    if (last.name !== name) {
                        console.log(`Error: Mismatched tag. Expected </${last.name}> (from line ${last.line}) but found </${name}> at line ${i + 1}`);
                        stack.push(last); // Put it back to continue
                    }
                }
            } else {
                stack.push({ name: tagName, line: i + 1 });
            }
        }
    }

    while (stack.length > 0) {
        const last = stack.pop();
        console.log(`Error: Unclosed tag <${last.name}> opened at line ${last.line}`);
    }
}

robustCheck(content);
