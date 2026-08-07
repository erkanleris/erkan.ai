import { useLang } from "../lib/i18n";
import { useTheme, PRESET_THEMES, ThemeName } from "../lib/theme";
import { Check, ChevronLeft, ChevronRight, Palette } from "lucide-react";

interface Props {
  onBack: () => void;
}

// Hex converter helpers
function hexToRgbTuple(hex: string) {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex[1] + hex[2], 16);
    g = parseInt(hex[3] + hex[4], 16);
    b = parseInt(hex[5] + hex[6], 16);
  }
  return `${r}, ${g}, ${b}`;
}

function rgbTupleToHex(tuple: string) {
  const parts = tuple.split(",").map(p => parseInt(p.trim(), 10));
  if (parts.length !== 3 || parts.some(isNaN)) return "#ffffff";
  return "#" + parts.map(p => {
    const hex = p.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
}

export default function ThemeScreen({ onBack }: Props) {
  const { t, locale } = useLang();
  const { theme, setTheme, customColors, setCustomColors } = useTheme();
  const isRtl = locale !== "turkish";

  const themesList: { id: ThemeName; label: string; colors: any }[] = [
    { id: "dark", label: t("themeDark"), colors: PRESET_THEMES.dark },
    { id: "amoled", label: t("themeAmoled"), colors: PRESET_THEMES.amoled },
    { id: "light", label: t("themeLight"), colors: PRESET_THEMES.light },
    { id: "purple", label: t("themePurple"), colors: PRESET_THEMES.purple },
    { id: "blue", label: t("themeBlue"), colors: PRESET_THEMES.blue },
    { id: "cyan", label: t("themeCyan"), colors: PRESET_THEMES.cyan },
    { id: "green", label: t("themeGreen"), colors: PRESET_THEMES.green },
    { id: "emerald", label: t("themeEmerald"), colors: PRESET_THEMES.emerald },
    { id: "yellow", label: t("themeYellow"), colors: PRESET_THEMES.yellow },
    { id: "orange", label: t("themeOrange"), colors: PRESET_THEMES.orange },
    { id: "red", label: t("themeRed"), colors: PRESET_THEMES.red },
    { id: "pink", label: t("themePink"), colors: PRESET_THEMES.pink },
    { id: "rose", label: t("themeRose"), colors: PRESET_THEMES.rose },
    { id: "custom", label: t("themeCustom"), colors: customColors },
  ];

  const updateCustomColor = (key: keyof typeof customColors, hexValue: string) => {
    const newColors = { ...customColors };
    
    // For properties expecting RGB tuple
    if (["bg", "primary", "secondary", "surface", "textMuted"].includes(key)) {
      newColors[key] = hexToRgbTuple(hexValue);
      // Auto-derive gradients if changing bg
      if (key === "bg") {
        newColors.bgGrad1 = hexValue;
        newColors.bgGrad2 = hexValue; // Simplification, could be darkened
      }
    } 
    // For properties expecting direct CSS value
    else {
      newColors[key] = hexValue;
    }

    // Auto update bubbles if primary/secondary change
    if (key === "primary" || key === "secondary") {
      newColors.bubbleUser = `linear-gradient(135deg, rgb(${newColors.primary}), rgb(${newColors.secondary}))`;
    }
    
    if (key === "surface") {
      newColors.bubbleAi = `rgba(${newColors.surface}, 0.6)`;
    }

    setCustomColors(newColors);
  };

  return (
    <div className="prf2-root" dir={isRtl ? "rtl" : "ltr"}>
      <div className="prf2-bg" />
      <div className="prf2-bg-radial" />

      <header className="prf2-header">
        <button className="prf2-back-btn" onClick={onBack}>
          {isRtl ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
        </button>
        <span className="prf2-header-title">{t("themeTitle")}</span>
        <div style={{ width: 40 }} />
      </header>

      <div className="prf2-scroll" style={{ padding: "20px 20px 100px" }}>
        <p className="text-center text-[var(--text-muted)] opacity-80 mb-6" style={{ fontSize: "0.95rem" }}>
          {t("themeDesc")}
        </p>

        <div className="grid grid-cols-2 gap-4">
          {themesList.map((tItem) => (
            <button
              key={tItem.id}
              className={`theme-card ${theme === tItem.id ? "active" : ""}`}
              onClick={() => setTheme(tItem.id)}
            >
              <div className="theme-card-preview" style={{ 
                background: `rgb(${tItem.colors.bg})`, 
                borderColor: `rgba(${tItem.colors.primary}, 0.5)`,
                boxShadow: theme === tItem.id ? `0 0 12px rgba(${tItem.colors.primary}, 0.3)` : "none"
              }}>
                <div className="theme-preview-bubble-user" style={{ background: tItem.colors.bubbleUser }} />
                <div className="theme-preview-bubble-ai" style={{ background: tItem.colors.bubbleAi, border: `1px solid rgba(${tItem.colors.textMuted}, 0.1)` }} />
              </div>
              <div className="theme-card-label">
                <span>{tItem.label}</span>
                {theme === tItem.id && <Check size={16} color={`rgb(${tItem.colors.primary})`} />}
              </div>
            </button>
          ))}
        </div>

        {theme === "custom" && (
          <div className="theme-custom-panel mt-6" style={{ background: "rgba(var(--surface-rgb), 0.5)", padding: 20, borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
            <h3 className="mb-4 text-[var(--text-main)] font-semibold flex items-center gap-2">
              <Palette size={18} /> {t("themeCustomTitle")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "bg", label: t("customBg"), val: rgbTupleToHex(customColors.bg) },
                { key: "primary", label: t("customPrimary"), val: rgbTupleToHex(customColors.primary) },
                { key: "secondary", label: t("customSecondary"), val: rgbTupleToHex(customColors.secondary) },
                { key: "surface", label: t("customSurface"), val: rgbTupleToHex(customColors.surface) },
                { key: "textMain", label: t("customText"), val: customColors.textMain.startsWith("#") ? customColors.textMain : "#ffffff" },
                { key: "textMuted", label: t("customTextMuted"), val: rgbTupleToHex(customColors.textMuted) },
              ].map((picker) => (
                <div key={picker.key} className="flex items-center justify-between bg-black/20 p-2 rounded-lg border border-white/5">
                  <span className="text-[var(--text-main)] text-sm">{picker.label}</span>
                  <input 
                    type="color" 
                    value={picker.val} 
                    onChange={(e) => updateCustomColor(picker.key as any, e.target.value)}
                    className="w-10 h-10 rounded border-0 p-0 cursor-pointer bg-transparent"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
