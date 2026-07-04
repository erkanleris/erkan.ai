import { useState, useEffect } from "react";

interface Props {
  onLogin: () => void;
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
        <div
          key={p.id}
          className="particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            boxShadow: `0 0 ${p.size * 4}px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
}

type Tab = "login" | "register";

export default function LoginScreen({ onLogin }: Props) {
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 1200);
  };

  return (
    <div className={`login-root ${mounted ? "login-enter" : ""}`}>
      {/* bg layers */}
      <div className="login-bg" />
      <div className="login-bg-glow-top" />
      <div className="login-bg-glow-bottom" />
      <Particles />

      <div className="login-scroll">
        {/* ── Logo section ── */}
        <div className="login-logo-section">
          <div className="login-logo-ring">
            <div className="login-logo-ring-spin" />
            <div className="login-logo-glass">
              <img
                src="/erkan-ai-logo.png"
                alt="ERKAN AI"
                className="login-logo-img"
                draggable={false}
              />
            </div>
          </div>

          <div className="login-brand-name">
            <span className="login-brand-erkan">ERKAN </span>
            <span className="login-brand-ai">AI</span>
          </div>

          <p className="login-brand-sub">للمستخدم العربي وبيحكي لهجتك</p>
        </div>

        {/* ── Welcome ── */}
        <div className="login-welcome" dir="rtl">
          <h2 className="login-welcome-title">
            مرحباً بك في{" "}
            <span className="login-brand-ai">ERKAN AI</span>
          </h2>
          <p className="login-welcome-sub">
            سجّل دخولك أو أنشئ حساباً جديداً لتبدأ رحلتك معنا
          </p>
        </div>

        {/* ── Tabs ── */}
        <div className="login-tabs" dir="rtl">
          <button
            className={`login-tab ${tab === "login" ? "active" : ""}`}
            onClick={() => setTab("login")}
          >
            تسجيل الدخول
          </button>
          <button
            className={`login-tab ${tab === "register" ? "active" : ""}`}
            onClick={() => setTab("register")}
          >
            إنشاء حساب
          </button>
        </div>

        {/* ── Form card ── */}
        <div className="login-card">
          {tab === "login" ? (
            <>
              {/* Email */}
              <div className="login-field-wrap">
                <div className="login-field">
                  <svg className="login-field-icon" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M2 8l10 7 10-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <input
                    type="email"
                    className="login-input"
                    placeholder="البريد الإلكتروني"
                    dir="rtl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="login-field-wrap">
                <div className="login-field">
                  <svg className="login-field-icon" viewBox="0 0 24 24" fill="none">
                    <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="12" cy="16" r="1.5" fill="currentColor" />
                  </svg>
                  <input
                    type={showPwd ? "text" : "password"}
                    className="login-input"
                    placeholder="كلمة المرور"
                    dir="rtl"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    className="login-eye-btn"
                    onClick={() => setShowPwd((v) => !v)}
                    tabIndex={-1}
                    aria-label={showPwd ? "إخفاء" : "إظهار"}
                  >
                    {showPwd ? (
                      <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.6" />
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me + forgot */}
              <div className="login-row-options" dir="rtl">
                <label className="login-remember">
                  <input
                    type="checkbox"
                    className="login-checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span className="login-checkbox-custom" />
                  <span className="login-remember-label">تذكرني</span>
                </label>
                <button className="login-forgot">نسيت كلمة المرور؟</button>
              </div>

              {/* Login button */}
              <button
                className={`login-btn-primary ${loading ? "loading" : ""}`}
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <span className="login-spinner" />
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                      <polyline points="10,17 15,12 10,7" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="15" y1="12" x2="3" y2="12" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    تسجيل الدخول
                  </>
                )}
              </button>

              {/* Or divider */}
              <div className="login-divider" dir="rtl">
                <span className="login-divider-line" />
                <span className="login-divider-text">أو</span>
                <span className="login-divider-line" />
              </div>

              {/* Google button */}
              <button className="login-btn-google" dir="rtl">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                تسجيل الدخول باستخدام Google
              </button>

              {/* Bottom link */}
              <div className="login-bottom-text" dir="rtl">
                <span className="login-bottom-gray">ليس لديك حساب؟ </span>
                <button className="login-bottom-link" onClick={() => setTab("register")}>
                  إنشاء حساب جديد
                </button>
              </div>
            </>
          ) : (
            /* ── Register tab ── */
            <>
              <div className="login-field-wrap">
                <div className="login-field">
                  <svg className="login-field-icon" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <input type="text" className="login-input" placeholder="الاسم الكامل" dir="rtl" />
                </div>
              </div>
              <div className="login-field-wrap">
                <div className="login-field">
                  <svg className="login-field-icon" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M2 8l10 7 10-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <input type="email" className="login-input" placeholder="البريد الإلكتروني" dir="rtl" />
                </div>
              </div>
              <div className="login-field-wrap">
                <div className="login-field">
                  <svg className="login-field-icon" viewBox="0 0 24 24" fill="none">
                    <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="12" cy="16" r="1.5" fill="currentColor" />
                  </svg>
                  <input type="password" className="login-input" placeholder="كلمة المرور" dir="rtl" />
                </div>
              </div>
              <div className="login-field-wrap">
                <div className="login-field">
                  <svg className="login-field-icon" viewBox="0 0 24 24" fill="none">
                    <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="12" cy="16" r="1.5" fill="currentColor" />
                  </svg>
                  <input type="password" className="login-input" placeholder="تأكيد كلمة المرور" dir="rtl" />
                </div>
              </div>

              <button className="login-btn-primary" onClick={handleLogin}>
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                  <circle cx="9" cy="7" r="4" stroke="white" strokeWidth="1.8" />
                  <line x1="19" y1="8" x2="19" y2="14" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="22" y1="11" x2="16" y2="11" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                إنشاء الحساب
              </button>

              <div className="login-bottom-text" dir="rtl">
                <span className="login-bottom-gray">لديك حساب بالفعل؟ </span>
                <button className="login-bottom-link" onClick={() => setTab("login")}>
                  تسجيل الدخول
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="login-footer" dir="rtl">
          <svg viewBox="0 0 24 24" fill="none" width="15" height="15" style={{ flexShrink: 0 }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 12l2 2 4-4" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>بياناتك محمية ومشفرة بالكامل</span>
        </div>
      </div>
    </div>
  );
}
