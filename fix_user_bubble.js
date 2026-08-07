const fs = require('fs');
let css = fs.readFileSync('artifacts/erkan-ai/src/index.css', 'utf8');

css = css.replace(/\.user-bubble \{[\s\S]*?color: var\(--text-main\);/m, ".user-bubble {\n  background: var(--bubble-user); color: #ffffff;");
css = css.replace(/\.hs-send-btn\.active \{[\s\S]*?color: var\(--text-main\);/m, ".hs-send-btn.active { background: linear-gradient(135deg, var(--primary), var(--secondary)); color: #ffffff; box-shadow: 0 0 16px rgba(var(--secondary-rgb),0.4); }");

fs.writeFileSync('artifacts/erkan-ai/src/index.css', css);
console.log('done');
