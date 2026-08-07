import { useState, useEffect } from "react";
import { useLang, localesInfo, localeToCountry, Locale } from "../lib/i18n";
import { updateProfile, type User } from "../lib/api";
import { Check, ChevronRight, Globe, ChevronLeft, AlertTriangle } from "lucide-react";

interface Props {
  onBack: () => void;
  user: User | null;
}

export default function LanguageScreen({ onBack, user }: Props) {
  const { locale, t } = useLang();
  const [step, setStep] = useState<1 | 2>(1);
  const [tempLang, setTempLang] = useState<"ar" | "tr">(locale === "turkish" ? "tr" : "ar");
  const [tempLocale, setTempLocale] = useState<Locale>(locale);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const isRtl = tempLang === "ar" || tempLocale !== "turkish";

  const handleConfirm = () => {
    setDownloading(true);
    setDownloadError(null);
    const start = Date.now();
    const duration = 3000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min((elapsed / duration) * 100, 100);
      setProgress(Math.floor(p));
      if (p >= 100) {
        clearInterval(interval);
        finish();
      }
    }, 50);
  };

  const finish = async () => {
    if (user) {
      try {
        await updateProfile({ country: localeToCountry[tempLocale] });
      } catch (err) {
        setDownloading(false);
        setDownloadError((err as Error).message || "Failed to sync profile");
        return;
      }
    }
    localStorage.setItem("erkan_locale", tempLocale);
    localStorage.setItem("erkan_welcome", "true");
    window.location.reload();
  };

  const targetText = tempLocale === "turkish" ? "Dil paketi indiriliyor..." :
                     tempLocale === "egyptian" ? "بننزّل حزمة اللغة..." :
                     tempLocale === "saudi" ? "جاري تحميل حزمة اللغة..." :
                     tempLocale === "jordanian" ? "بنحمل حزمة اللغة..." :
                     "عم ننزل حزمة اللغة...";

  if (downloadError) {
    return (
      <div className="dl-overlay">
        <div className="text-red-500 mb-4"><AlertTriangle size={48} /></div>
        <h2 className="dl-text text-red-500 text-center mb-4">{downloadError}</h2>
        <button className="lang-confirm-btn" style={{ maxWidth: 200 }} onClick={() => {
          setDownloadError(null);
          handleConfirm();
        }}>
          {t("tryAgain")}
        </button>
      </div>
    );
  }

  if (downloading) {
    return (
      <div className="dl-overlay">
        <div className="dl-spinner" />
        <h2 className="dl-text">{targetText}</h2>
        <div className="dl-bar-track">
          <div className="dl-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div style={{ color: "rgba(255,255,255,0.5)", fontFamily: "Inter", fontWeight: 700 }}>
          {progress}%
        </div>
      </div>
    );
  }

  return (
    <div className="lang-root" dir={isRtl ? "rtl" : "ltr"}>
      <div className="lang-bg" />
      
      <header className="lang-header">
        <button className="lang-back-btn" onClick={step === 2 ? () => setStep(1) : onBack}>
          {isRtl ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
        </button>
        <span className="lang-header-title">{t("langTitle")}</span>
        <div style={{ width: 40 }} />
      </header>

      <div className="lang-body">
        {step === 1 ? (
          <>
            <h2 className="lang-step-title">{t("langSelTitle")}</h2>
            <div className="lang-main-options">
              <button 
                className={`lang-btn ${tempLang === "ar" ? "active" : ""}`}
                onClick={() => setTempLang("ar")}
              >
                <span className="lang-btn-text">العربية</span>
                {tempLang === "ar" && <Check className="text-blue-400" />}
              </button>
              <button 
                className={`lang-btn ${tempLang === "tr" ? "active" : ""}`}
                onClick={() => {
                  setTempLang("tr");
                  setTempLocale("turkish");
                }}
              >
                <span className="lang-btn-text">Türkçe</span>
                {tempLang === "tr" && <Check className="text-blue-400" />}
              </button>
            </div>

            <button 
              className="lang-confirm-btn"
              onClick={() => {
                if (tempLang === "ar") setStep(2);
                else handleConfirm();
              }}
            >
              {tempLang === "ar" ? (isRtl ? "التالي" : "İleri") : t("confirmLang")}
            </button>
          </>
        ) : (
          <>
            <h2 className="lang-step-title">{t("dialectTitle")}</h2>
            <div className="lang-dialect-grid">
              {localesInfo.map(loc => (
                <button
                  key={loc.id}
                  className={`dialect-btn ${tempLocale === loc.id ? "active" : ""}`}
                  onClick={() => setTempLocale(loc.id as Locale)}
                >
                  <span className="dialect-flag">{loc.flag}</span>
                  <span className="dialect-name">{loc.label}</span>
                  {tempLocale === loc.id && <Check size={18} className="text-purple-400" style={{ marginLeft: "auto" }} />}
                </button>
              ))}
            </div>

            <button className="lang-confirm-btn" onClick={handleConfirm}>
              <Globe size={20} />
              <span>{t("confirmLang")}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
