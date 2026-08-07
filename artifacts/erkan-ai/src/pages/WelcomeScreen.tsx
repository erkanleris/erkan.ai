import { useLang } from "../lib/i18n";
import { Sparkles } from "lucide-react";

export default function WelcomeScreen({ onContinue }: { onContinue: () => void }) {
  const { t, locale } = useLang();
  
  return (
    <div className="welcome-root" dir={locale === "turkish" ? "ltr" : "rtl"}>
      <div className="welcome-bg" />
      <div className="welcome-content">
        <Sparkles className="welcome-icon" size={64} />
        <h1 className="welcome-title">{t("welcomeApp")}</h1>
        <p className="welcome-desc">{t("welcomeMsg")}</p>
        <button className="welcome-btn" onClick={onContinue}>{t("continueBtn")}</button>
      </div>
    </div>
  );
}
