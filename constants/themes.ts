import colors from '@/constants/colors';

export type ThemeId = 'night' | 'amoled' | 'light' | 'purple' | 'blue' | 'cyan' | 'green' | 'emerald' | 'yellow' | 'orange' | 'red' | 'pink' | 'rose';
export type ThemePalette = typeof colors.light;

export const themeOptions: { id: ThemeId; title: string; detail: string; preview: string }[] = [
  { id: 'night', title: 'كحلي ليلي', detail: 'الهوية الأساسية لـ ERKAN AI', preview: '#07102a' },
  { id: 'amoled', title: 'أسود AMOLED', detail: 'توفير أكبر للطاقة', preview: '#000000' },
  { id: 'light', title: 'فاتح', detail: 'وضوح أعلى في النهار', preview: '#eef4ff' },
  { id: 'purple', title: 'بنفسجي عميق', detail: 'توهج بنفسجي أكثر', preview: '#160d2e' },
  { id: 'blue', title: 'أزرق ملكي', detail: 'تباين أزرق واضح', preview: '#091b45' },
  { id: 'cyan', title: 'سماوي', detail: 'ألوان أكثر هدوءاً', preview: '#082b3d' },
  { id: 'green', title: 'أخضر', detail: 'لمسة طبيعية', preview: '#092d27' },
  { id: 'emerald', title: 'زمردي', detail: 'توهج أخضر عميق', preview: '#062d2f' },
  { id: 'yellow', title: 'ذهبي', detail: 'توهج دافئ', preview: '#322b0d' },
  { id: 'orange', title: 'برتقالي', detail: 'طاقة أعلى', preview: '#351c0d' },
  { id: 'red', title: 'أحمر', detail: 'تباين قوي', preview: '#350f1b' },
  { id: 'pink', title: 'وردي', detail: 'توهج ناعم', preview: '#32132b' },
  { id: 'rose', title: 'وردي غامق', detail: 'هوية جريئة', preview: '#32101e' },
];

const base = colors.light;
const darkOverrides: Record<Exclude<ThemeId, 'light'>, Partial<ThemePalette>> = {
  night: {},
  amoled: { background: '#000000', card: '#070707', secondary: '#151515', muted: '#101010', border: '#262626', input: '#1d1d1d' },
  purple: { background: '#100a20', card: '#1c1235', secondary: '#2a1c50', muted: '#201442', accent: '#5a2e91', border: '#45306f', input: '#39255d', primary: '#b178ff' },
  blue: { background: '#061433', card: '#0c2450', secondary: '#16366b', muted: '#102957', border: '#244c8d', input: '#1b3b76', primary: '#4b9cff' },
  cyan: { background: '#061f2d', card: '#0b3443', secondary: '#124e5d', muted: '#103c4b', border: '#226678', input: '#1a5667', primary: '#49d8e8' },
  green: { background: '#061d19', card: '#0c342b', secondary: '#145345', muted: '#0d3f34', border: '#236b58', input: '#1b594a', primary: '#54d69e' },
  emerald: { background: '#041f22', card: '#08383a', secondary: '#105654', muted: '#0c4545', border: '#1f716c', input: '#185d5b', primary: '#55e0c1' },
  yellow: { background: '#211d08', card: '#39300e', secondary: '#514516', muted: '#403611', border: '#746121', input: '#5c4b1a', primary: '#f1c75b' },
  orange: { background: '#261207', card: '#44200e', secondary: '#603019', muted: '#4d2512', border: '#82431f', input: '#6b351b', primary: '#ff9a55' },
  red: { background: '#250912', card: '#42101f', secondary: '#5d182b', muted: '#4b1225', border: '#81233d', input: '#6b1b34', primary: '#ff6d86' },
  pink: { background: '#210b1e', card: '#3c1538', secondary: '#5b2053', muted: '#481846', border: '#7e2c73', input: '#682565', primary: '#ff83d6' },
  rose: { background: '#230910', card: '#42121f', secondary: '#5c192c', muted: '#4c1325', border: '#82243e', input: '#6c1c35', primary: '#ff7899' },
};

const lightPalette: ThemePalette = {
  ...base,
  background: '#f3f7ff',
  foreground: '#102044',
  card: '#ffffff',
  cardForeground: '#102044',
  primary: '#1677e8',
  primaryForeground: '#ffffff',
  secondary: '#e3edff',
  secondaryForeground: '#17366d',
  muted: '#eaf1fc',
  mutedForeground: '#627394',
  accent: '#e5d9ff',
  accentForeground: '#3b2170',
  destructive: '#d93554',
  border: '#c8d7ef',
  input: '#dbe7f7',
};

export const themePalettes: Record<ThemeId, ThemePalette> = {
  light: lightPalette,
  ...Object.fromEntries(
    Object.entries(darkOverrides).map(([id, overrides]) => [id, { ...base, ...overrides }]),
  ) as Record<Exclude<ThemeId, 'light'>, ThemePalette>,
};

export function isThemeId(value: string | null): value is ThemeId {
  return Boolean(value && themeOptions.some(theme => theme.id === value));
}