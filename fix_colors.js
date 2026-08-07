const fs = require('fs');
let css = fs.readFileSync('artifacts/erkan-ai/src/index.css', 'utf8');

css = css.replace(/#000 100%\)/g, 'var(--bg) 100%)');
css = css.replace(/rgba\(0,0,0,0\.(\d+)\)/g, 'rgba(0, 0, 0, 0.$1)');

// Check .hs-header
css = css.replace(/\.hs-header \{[\s\S]*?background: [^;]+;/m, ".hs-header {\n  background: rgba(var(--bg-rgb), 0.85);");

// Check .hs-bottom-nav
// Already using var(--nav-bg)

// Fix .prf2-bg
css = css.replace(/\.prf2-bg \{[\s\S]*?background: [^;]+;/m, ".prf2-bg { position: fixed; inset: 0; background: var(--bg);");

// Fix .prf2-hero-cover gradients if any
// Not easily done via regex since they are inline in JSX. Wait, ProfileScreen.tsx has them inline.
// Let's modify ProfileScreen.tsx directly for hero cover.

fs.writeFileSync('artifacts/erkan-ai/src/index.css', css);
console.log('done');
