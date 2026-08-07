const fs = require('fs');
let css = fs.readFileSync('artifacts/erkan-ai/src/index.css', 'utf8');

// Insert root variables right after * { ... }
const rootVars = `
:root {
  --bg-rgb: 2, 8, 23;
  --bg: rgb(var(--bg-rgb));
  --bg-grad-1: #0b1f4a;
  --bg-grad-2: #060e2a;

  --primary-rgb: 31, 139, 255;
  --primary: rgb(var(--primary-rgb));
  
  --secondary-rgb: 168, 85, 247;
  --secondary: rgb(var(--secondary-rgb));

  --surface-rgb: 16, 24, 58;
  --surface: rgba(var(--surface-rgb), 0.93);
  
  --text-rgb: 255, 255, 255;
  --text-main: #ffffff;
  
  --bubble-user: linear-gradient(135deg, var(--primary), var(--secondary));
  --bubble-ai: rgba(var(--surface-rgb), 0.6);
  --bubble-ai-border: rgba(var(--text-rgb), 0.08);

  --nav-bg: rgba(var(--surface-rgb), 0.85);
}
`;

css = css.replace(/(\* \{.*?\})/, "$1\n\n" + rootVars);

// Replace RGBs
const rgbReplacements = [
  { rgx: /rgba?\(\s*(168|99|138|108)\s*,\s*(85|102|46|74)\s*,\s*(247|241|255|247)/g, val: 'rgba(var(--secondary-rgb)' },
  { rgx: /rgba?\(\s*(31|79|59)\s*,\s*(139|142|130)\s*,\s*(255|247|246)/g, val: 'rgba(var(--primary-rgb)' },
  { rgx: /rgba?\(\s*(16|9|30|18|14|8|6)\s*,\s*(24|13|40|28|19|12|10)\s*,\s*(58|36|90|68|36|30|28)/g, val: 'rgba(var(--surface-rgb)' },
  { rgx: /rgba?\(\s*2\s*,\s*8\s*,\s*23/g, val: 'rgba(var(--bg-rgb)' },
];

rgbReplacements.forEach(r => {
  css = css.replace(r.rgx, r.val);
});

// Replace Hex
const hexReplacements = [
  { rgx: /#020817/g, val: 'var(--bg)' },
  { rgx: /#(1f8bff|3b82f6|4f8ef7)/gi, val: 'var(--primary)' },
  { rgx: /#(a855f7|6c3eff|7c3aed|6366f1|6c4af7|8a2eff)/gi, val: 'var(--secondary)' },
  { rgx: /#0b1f4a/g, val: 'var(--bg-grad-1)' },
  { rgx: /#060e2a/g, val: 'var(--bg-grad-2)' },
];

hexReplacements.forEach(r => {
  css = css.replace(r.rgx, r.val);
});

// Replace chat bubbles
css = css.replace(/\.user-bubble \{[\s\S]*?background:[^;]+;/m, ".user-bubble {\n  background: var(--bubble-user);");
css = css.replace(/\.ai-bubble \{[\s\S]*?background:[^;]+; border:[^;]+;/m, ".ai-bubble {\n  background: var(--bubble-ai); border: 1px solid var(--bubble-ai-border);");

fs.writeFileSync('artifacts/erkan-ai/src/index.css', css);
console.log('done');
