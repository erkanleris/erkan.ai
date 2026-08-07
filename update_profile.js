const fs = require('fs');
let code = fs.readFileSync('artifacts/erkan-ai/src/pages/ProfileScreen.tsx', 'utf8');

const replacement = `              { icon: <Globe size={16} />, label: t("langMenuLabel"), sub: t("langMenuSub"), onClick: () => onNavigate?.("language") },
              { icon: <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="2"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10c0 1.5-.5 2.5-1.5 2.5S19 14 19 13a3 3 0 1 0-6 0c0 3 4.5 4 4.5 7.5 0 1.5-1.5 1.5-5.5 1.5z"/></svg>, label: t("themeTitle"), sub: t("themeSub"), onClick: () => onNavigate?.("theme") },
`;

code = code.replace('{ icon: <Globe size={16} />, label: t("langMenuLabel"), sub: t("langMenuSub"), onClick: () => onNavigate?.("language") },', replacement);

fs.writeFileSync('artifacts/erkan-ai/src/pages/ProfileScreen.tsx', code);
console.log('done');
