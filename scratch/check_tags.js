
import fs from 'fs';

const content = fs.readFileSync('c:\\Users\\lcdoo\\Desktop\\VTTApp\\src\\components\\layout\\SettingsModal.tsx', 'utf8');

function checkTags(content) {
    const stack = [];
    const tagRegex = /<(\/?[a-zA-Z0-9]+)(?:\s+[^>]*?)?>/g;
    let match;
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        while ((match = tagRegex.exec(line)) !== null) {
            const fullTag = match[0];
            const tagName = match[1];
            
            // Skip self-closing tags
            if (fullTag.endsWith('/>')) continue;
            // Skip common self-closing HTML tags if not marked with /> (though in JSX they should be)
            if (['input', 'img', 'br', 'hr', 'link', 'meta'].includes(tagName.toLowerCase())) continue;

            if (tagName.startsWith('/')) {
                const closingName = tagName.substring(1);
                if (stack.length === 0) {
                    console.log(`Error: Extra closing tag </${closingName}> at line ${i + 1}`);
                } else {
                    const last = stack.pop();
                    if (last.name !== closingName) {
                        console.log(`Error: Mismatched tag. Expected </${last.name}> but found </${closingName}> at line ${i + 1} (opened at line ${last.line})`);
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

checkTags(content);
