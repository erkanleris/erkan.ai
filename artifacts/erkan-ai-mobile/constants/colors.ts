/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#ffffff',
    tint: '#1f8bff',

    // Core surfaces
    background: '#020817',
    foreground: '#ffffff',

    // Cards / elevated surfaces
    card: '#10183a',
    cardForeground: '#ffffff',

    // Primary action color (buttons, links, active states)
    primary: '#1f8bff',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#0b1f4a',
    secondaryForeground: '#dfe9ff',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#060e2a',
    mutedForeground: '#9aaed2',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#a855f7',
    accentForeground: '#eee9ff',

    // Destructive actions (delete, error states)
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#26365d',
    input: '#26365d',

    // Web parity tokens used by shared mobile surfaces.
    backgroundTop: '#0b1f4a',
    backgroundBottom: '#060e2a',
    surfaceOverlay: '#10183a99',
    primarySoft: '#1f8bff1a',
    secondarySoft: '#a855f71a',
    teal: '#22c7b4',
    success: '#55dfb0',
    dangerSurface: '#401b2d',
    blueSurface: '#122850',
    purpleSurface: '#4d2d93',
    borderSubtle: '#ffffff14',
    bubbleUserStart: '#1f8bff',
    bubbleUserEnd: '#a855f7',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 18,
};

export default colors;
