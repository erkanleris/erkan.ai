const fs = require('fs');

let content = fs.readFileSync('artifacts/erkan-ai/src/lib/theme.tsx', 'utf8');

content = content.replace(/export const applyTheme = function applyTheme/g, 'export function applyTheme');

fs.writeFileSync('artifacts/erkan-ai/src/lib/theme.tsx', content, 'utf8');
console.log('done');
