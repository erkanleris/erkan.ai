const fs = require('fs');
let css = fs.readFileSync('artifacts/erkan-ai/src/index.css', 'utf8');

css = css.replace(/#0b1d42/gi, 'var(--bg-grad-1)');
css = css.replace(/#040c22/gi, 'var(--bg-grad-2)');
css = css.replace(/#0c1f52/gi, 'var(--bg-grad-1)');
css = css.replace(/#060d2a/gi, 'var(--bg-grad-2)');
css = css.replace(/#050816/gi, 'var(--bg)');
css = css.replace(/#1a0b2e/gi, 'var(--bg-grad-1)');
css = css.replace(/#0a1128/gi, 'var(--bg-grad-1)');
css = css.replace(/#1a2a5e/gi, 'var(--bg-grad-1)');

fs.writeFileSync('artifacts/erkan-ai/src/index.css', css);
console.log('done');
