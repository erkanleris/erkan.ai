const fs = require('fs');
let css = fs.readFileSync('artifacts/erkan-ai/src/index.css', 'utf8');

css = css.replace(/\.md-root \{[\s\S]*?color:[^;]+;/m, ".md-root { font-family: \"Cairo\", sans-serif; font-size: 0.95rem; color: var(--text-main);");
css = css.replace(/#e2e8f0/gi, "var(--text-main)");

fs.writeFileSync('artifacts/erkan-ai/src/index.css', css);
console.log('done');
