const fs = require('fs');

let content = fs.readFileSync('artifacts/erkan-ai/src/lib/theme.tsx', 'utf8');

const validationFn = `
function isValidThemeColors(obj: any): obj is ThemeColors {
  if (!obj || typeof obj !== 'object') return false;
  const required = ['bg', 'bgGrad1', 'bgGrad2', 'primary', 'secondary', 'surface', 'textMain', 'textMuted', 'bubbleUser', 'bubbleAi'];
  return required.every(key => typeof obj[key] === 'string');
}

// Synchronous initialization
let initialTheme: ThemeName = 'dark';
let initialCustomColors: ThemeColors = { ...PRESET_THEMES.custom };

if (typeof window !== 'undefined') {
  try {
    const savedTheme = localStorage.getItem('erkan_theme');
    const savedCustomRaw = localStorage.getItem('erkan_custom_theme');
    
    if (savedCustomRaw) {
      try {
        const parsed = JSON.parse(savedCustomRaw);
        if (isValidThemeColors(parsed)) {
          initialCustomColors = parsed;
        }
      } catch (e) {}
    }

    if (savedTheme && (PRESET_THEMES as any)[savedTheme]) {
      initialTheme = savedTheme as ThemeName;
    }

    const colorsToApply = initialTheme === 'custom' ? initialCustomColors : PRESET_THEMES[initialTheme];
    applyTheme(colorsToApply);
  } catch(e) {}
}
`;

content = content.replace(/export const applyTheme =/, validationFn + '\nexport const applyTheme =');

const oldProvider = `export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeName>('dark');
  const [customColors, setCustomColorsState] = useState<ThemeColors>(PRESET_THEMES.custom);

  useEffect(() => {
    const savedTheme = localStorage.getItem('erkan_theme') as ThemeName;
    const savedCustom = localStorage.getItem('erkan_custom_theme');
    
    if (savedCustom) {
      try {
        setCustomColorsState(JSON.parse(savedCustom));
      } catch (e) {}
    }
    
    if (savedTheme && PRESET_THEMES[savedTheme]) {
      setThemeState(savedTheme);
      applyTheme(savedTheme === 'custom' && savedCustom ? JSON.parse(savedCustom) : PRESET_THEMES[savedTheme]);
    } else {
      applyTheme(PRESET_THEMES.dark);
    }
  }, []);`;

const newProvider = `export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeName>(initialTheme);
  const [customColors, setCustomColorsState] = useState<ThemeColors>(initialCustomColors);
`;

content = content.replace(oldProvider, newProvider);

fs.writeFileSync('artifacts/erkan-ai/src/lib/theme.tsx', content, 'utf8');
console.log('done');
