import { useState, useEffect } from "react";
import { authLogin, authRegister, type User } from "../lib/api";
import { useLang } from "../lib/i18n";
import { AlertCircle, Eye, EyeOff, KeyRound, Mail, User as UserIcon, LogIn, UserPlus } from "lucide-react";

interface Props {
  onLogin: (user: User) => void;
}

function Particles() {
  const particles = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 8 + 6,
    delay: Math.random() * 6,
    color: i % 3 === 0 ? "#4f8ef7" : i % 3 === 1 ? "#8a2eff" : "#a855f7",
  }));
  return (
    <div className="particles-layer" aria-hidden>
      {particles.map((p) => (
        <div key={p.id} className="particle"
          style={{
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size,
            background: p.color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function LoginScreen({ onLogin }: Props) {
  const { t, locale } = useLang();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  const isRtl = locale !== "turkish";

  useEffect(() => { const timer = setTimeout(() => setMounted(true), 30); return () => clearTimeout(timer); }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { setError(t("errEmailPass")); return; }
    setLoading(true); setError("");
    try { const user = await authLogin(email.trim(), password.trim()); onLogin(user); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) { setError(t("errAll")); return; }
    if (regPassword !== regConfirm) { setError(t("errMismatch")); return; }
    if (regPassword.length < 6) { setError(t("errShort")); return; }
    setLoading(true); setError("");
    try { const user = await authRegister(regName.trim(), regEmail.trim(), regPassword.trim()); onLogin(user); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  };

  return (
    <div className={`login-root ${mounted ? "login-enter" : ""}`}>
      <div className="login-bg" />
      <div className="login-bg-glow-top" />
      <div className="login-bg-glow-bottom" />
      <Particles />

      <div className="login-scroll">
        {/* ── Logo ── */}
        <div className="login-logo-section">
          <div className="login-logo-ring">
            <div className="login-logo-ring-spin" />
            <div className="login-logo-glass">
              <img src="/erkan-ai-logo.png" alt="ERKAN AI" className="login-logo-img" draggable={false} />
            </div>
          </div>
          <div className="login-brand-name">
            <span className="login-brand-erkan">ERKAN </span>
            <span className="login-brand-ai">AI</span>
          </div>
          <p className="login-brand-sub" dir={isRtl ? "rtl" : "ltr"}>{t("homeTag")}</p>
        </div>

        {/* ── Welcome ── */}
        <div className="login-welcome" dir={isRtl ? "rtl" : "ltr"}>
          <h2 className="login-welcome-title">{t("loginWelcome")}</h2>
          <p className="login-welcome-sub">{t("loginSub")}</p>
        </div>

        {/* ── Tabs ── */}
        <div className="login-tabs" dir={isRtl ? "rtl" : "ltr"}>
          <button className={`login-tab ${tab === "login" ? "active" : ""}`} onClick={() => { setTab("login"); setError(""); }}>{t("loginBtn")}</button>
          <button className={`login-tab ${tab === "register" ? "active" : ""}`} onClick={() => { setTab("register"); setError(""); }}>{t("registerBtn")}</button>
        </div>

        {/* ── Form card ── */}
        <div className="login-card">
          {error && (
            <div className="login-error-banner" dir={isRtl ? "rtl" : "ltr"}>
              <AlertCircle size={16} className="shrink-0" color="#ef4444" />
              {error}
            </div>
          )}

          {tab === "login" ? (
            <>
              <div className="login-field-wrap">
                <div className="login-field">
                  <Mail className="login-field-icon" />
                  <input type="email" className="login-input" placeholder={t("emailPH")} dir={isRtl ? "rtl" : "ltr"}
                    value={email} onChange={e => setEmail(e.target.value)} autoComplete="email"
                    onKeyDown={e => e.key === "Enter" && handleLogin()} />
                </div>
              </div>

              <div className="login-field-wrap">
                <div className="login-field">
                  <KeyRound className="login-field-icon" />
                  <input type={showPwd ? "text" : "password"} className="login-input" placeholder={t("passPH")} dir={isRtl ? "rtl" : "ltr"}
                    value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password"
                    onKeyDown={e => e.key === "Enter" && handleLogin()} />
                  <button className="login-eye-btn" onClick={() => setShowPwd(v => !v)} tabIndex={-1}>
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="login-row-options" dir={isRtl ? "rtl" : "ltr"}>
                <label className="login-remember">
                  <input type="checkbox" className="login-checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
                  <span className="login-checkbox-custom" />
                  <span className="login-remember-label">{t("remember")}</span>
                </label>
                <button className="login-forgot">{t("forgotPass")}</button>
              </div>

              <button className={`login-btn-primary ${loading ? "loading" : ""}`} onClick={handleLogin} disabled={loading}>
                {loading ? <span className="login-spinner" /> : (
                  <><LogIn size={20} className={isRtl ? "rotate-180" : ""} /> {t("doLogin")}</>
                )}
              </button>

              <div className="login-divider" dir={isRtl ? "rtl" : "ltr"}>
                <span className="login-divider-line" /><span className="login-divider-text">{t("or")}</span><span className="login-divider-line" />
              </div>

              <button className="login-btn-google" dir={isRtl ? "rtl" : "ltr"}>
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {t("loginGoogle")}
              </button>

              <div className="login-bottom-text" dir={isRtl ? "rtl" : "ltr"}>
                <span className="login-bottom-gray">{t("noAcc")} </span>
                <button className="login-bottom-link" onClick={() => { setTab("register"); setError(""); }}>{t("createAcc")}</button>
              </div>
            </>
          ) : (
            <>
              {[
                { label: t("fullName"), type: "text", val: regName, set: setRegName, ph: t("fullName"), icon: <UserIcon className="login-field-icon" /> },
                { label: t("emailPH"), type: "email", val: regEmail, set: setRegEmail, ph: t("emailPH"), icon: <Mail className="login-field-icon" /> },
                { label: t("passPH"), type: "password", val: regPassword, set: setRegPassword, ph: t("passHint"), icon: <KeyRound className="login-field-icon" /> },
                { label: t("confirmPass"), type: "password", val: regConfirm, set: setRegConfirm, ph: t("confirmPass"), icon: <KeyRound className="login-field-icon" /> },
              ].map(f => (
                <div key={f.label} className="login-field-wrap">
                  <div className="login-field">
                    {f.icon}
                    <input type={f.type} className="login-input" placeholder={f.ph} dir={isRtl ? "rtl" : "ltr"}
                      value={f.val} onChange={e => f.set(e.target.value)} />
                  </div>
                </div>
              ))}

              <button className={`login-btn-primary ${loading ? "loading" : ""}`} onClick={handleRegister} disabled={loading}>
                {loading ? <span className="login-spinner" /> : (
                  <><UserPlus size={20} /> {t("registerBtn")}</>
                )}
              </button>

              <div className="login-bottom-text" dir={isRtl ? "rtl" : "ltr"}>
                <span className="login-bottom-gray">{t("haveAcc")} </span>
                <button className="login-bottom-link" onClick={() => { setTab("login"); setError(""); }}>{t("loginBtn")}</button>
              </div>
            </>
          )}
        </div>

        <div className="login-footer" dir={isRtl ? "rtl" : "ltr"}>
          <svg viewBox="0 0 24 24" fill="none" width="15" height="15" style={{ flexShrink: 0 }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 12l2 2 4-4" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>{t("dataProt")}</span>
        </div>
      </div>
    </div>
  );
}
