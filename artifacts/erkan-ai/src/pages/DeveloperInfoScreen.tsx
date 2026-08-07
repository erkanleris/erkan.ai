import { useLang } from "../lib/i18n";

interface Props {
  onBack: () => void;
}

const INSTAGRAM_FOLLOW = "https://www.instagram.com/erkanleriscom?igsh=MWw0MWIyc3loN25paQ==";
const INSTAGRAM_DEV    = "https://www.instagram.com/erkanleris?igsh=MXcxOGs2N3p3NWFwZA==";
const WHATSAPP_NUM     = "905382262557";

export default function DeveloperInfoScreen({ onBack }: Props) {
  const { t, locale } = useLang();
  const openLink = (url: string) => window.open(url, "_blank");
  const openWA   = () => window.open(`https://wa.me/${WHATSAPP_NUM}`, "_blank");

  const isRtl = locale !== "turkish";

  return (
    <div className="dev-root" dir={isRtl ? "rtl" : "ltr"}>
      <div className="dev-bg" />
      <div className="dev-bg-glow" />

      {/* Header */}
      <header className="dev-header">
        <button className="dev-back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20" style={{ transform: isRtl ? "none" : "rotate(180deg)" }}>
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="dev-header-title">{t("devInfo")}</span>
        <div style={{ width: 40 }} />
      </header>

      <div className="dev-body">

        {/* Hero card */}
        <div className="dev-hero-card">
          <div className="dev-hero-logo-wrap">
            <img src="/erkan-ai-logo.png" alt="ERKAN AI" className="dev-hero-logo" draggable={false} />
            <div className="dev-hero-logo-ring" />
          </div>
          <h1 className="dev-hero-name">ERKAN AI</h1>
          <p className="dev-hero-tagline">{t("slogan")}</p>
          <div className="dev-hero-badge">by TRSY</div>
        </div>

        {/* About */}
        <div className="dev-section">
          <div className="dev-section-title">{t("aboutProj")}</div>
          <div className="dev-about-card">
            <p className="dev-about-text">
              {t("aboutText")}
            </p>
          </div>
        </div>

        {/* Team info */}
        <div className="dev-section">
          <div className="dev-section-title">{t("team")}</div>
          <div className="dev-info-card">
            {[
              { icon: "🏷️", label: t("teamName"),      val: "TRSY" },
              { icon: "👑", label: t("teamLeader"),     val: isRtl ? "أركان لياريش" : "Erkan Leris" },
              { icon: "👥", label: t("membersCount"),     val: isRtl ? "6 أعضاء" : "6 Üye" },
              { icon: "🚀", label: t("projName"),      val: "ERKAN AI" },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                className="dev-info-row"
                style={i < arr.length - 1 ? { borderBottom: "1px solid rgba(255,255,255,0.05)" } : {}}
              >
                <span className="dev-info-val">{row.val}</span>
                <div className="dev-info-left">
                  <span className="dev-info-icon">{row.icon}</span>
                  <span className="dev-info-label">{row.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="dev-section">
          <div className="dev-section-title">{t("contactUs")}</div>
          <div className="dev-contact-btns">

            {/* WhatsApp */}
            <button className="dev-contact-btn dev-wa-btn" onClick={openWA}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <div>
                <div className="dev-contact-btn-label">{t("csLabel")}</div>
                <div className="dev-contact-btn-sub" dir="ltr">+{WHATSAPP_NUM}</div>
              </div>
            </button>

            {/* Developer Instagram */}
            <button className="dev-contact-btn dev-ig-btn" onClick={() => openLink(INSTAGRAM_DEV)}>
              <svg viewBox="0 0 24 24" fill="none" width="22" height="22" stroke="currentColor" strokeWidth="1.8">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" strokeWidth="0" />
              </svg>
              <div>
                <div className="dev-contact-btn-label">{t("devAcc")}</div>
                <div className="dev-contact-btn-sub" dir="ltr">@erkanleris</div>
              </div>
            </button>

            {/* Follow Instagram */}
            <button className="dev-contact-btn dev-follow-btn" onClick={() => openLink(INSTAGRAM_FOLLOW)}>
              <svg viewBox="0 0 24 24" fill="none" width="22" height="22" stroke="currentColor" strokeWidth="1.8">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" strokeWidth="0" />
              </svg>
              <div>
                <div className="dev-contact-btn-label">{t("follow")}</div>
                <div className="dev-contact-btn-sub" dir="ltr">@erkanleriscom</div>
              </div>
            </button>

          </div>
        </div>

        {/* Footer */}
        <div className="dev-footer">
          <div className="dev-footer-text">{t("rights")}</div>
          <div className="dev-footer-version">ERKAN AI v2.0</div>
        </div>

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
