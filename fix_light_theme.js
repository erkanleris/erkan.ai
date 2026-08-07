const fs = require('fs');
let css = fs.readFileSync('artifacts/erkan-ai/src/index.css', 'utf8');

// Replace rgba(255,255,255) with rgba(var(--text-rgb))
css = css.replace(/rgba?\(\s*255\s*,\s*255\s*,\s*255/gi, 'rgba(var(--text-rgb)');

// Replace #fff and #ffffff with var(--text-main) - being careful not to replace parts of other hexes
css = css.replace(/#ffffff\b/gi, 'var(--text-main)');
css = css.replace(/#fff\b/gi, 'var(--text-main)');

fs.writeFileSync('artifacts/erkan-ai/src/index.css', css);
console.log('done');
