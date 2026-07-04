import { useState } from "react";

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="feat-icon-svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="url(#fi1)" />
        <defs>
          <linearGradient id="fi1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>
    ),
    title: "محادثة ذكية",
    sub: "دردش مع الذكاء الاصطناعي بأي لغة",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="feat-icon-svg">
        <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" fill="url(#fi2)" />
        <defs>
          <linearGradient id="fi2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
        </defs>
      </svg>
    ),
    title: "تحليل البيانات",
    sub: "استخرج رؤى دقيقة من بياناتك",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="feat-icon-svg">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z" fill="url(#fi3)" />
        <defs>
          <linearGradient id="fi3" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
      </svg>
    ),
    title: "إنشاء المحتوى",
    sub: "توليد نصوص احترافية بسرعة فائقة",
  },
];

const quickActions = [
  { label: "محادثة جديدة", icon: "💬" },
  { label: "تحليل", icon: "📊" },
  { label: "كتابة", icon: "✍️" },
  { label: "ترجمة", icon: "🌐" },
];

export default function HomeScreen() {
  const [input, setInput] = useState("");

  return (
    <div className="home-root home-enter">
      <div className="home-bg" />
      <div className="home-bg-radial" />

      {/* ── Header ── */}
      <header className="home-header">
        <div className="home-header-logo">
          <img src="/erkan-ai-logo.png" alt="ERKAN AI" className="home-logo-img" draggable={false} />
        </div>
        <div className="home-header-text">
          <span className="home-title-erkan">ERKAN </span>
          <span className="home-title-ai">AI</span>
        </div>
        <button className="home-avatar" aria-label="Profile">
          <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
            <circle cx="12" cy="8" r="4" stroke="#818cf8" strokeWidth="1.6" />
            <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" stroke="#818cf8" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      {/* ── Greeting ── */}
      <div className="home-greeting" dir="rtl">
        <p className="home-greeting-sub">مرحباً بك في</p>
        <p className="home-greeting-main">
          <span className="home-title-erkan">ERKAN</span>{" "}
          <span className="home-title-ai">AI</span>
        </p>
        <p className="home-greeting-slogan">ذكاء اصطناعي بلا حدود</p>
      </div>

      {/* ── Search / Chat bar ── */}
      <div className="home-search-wrapper">
        <div className="home-search-bar">
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18" className="home-search-icon">
            <path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            className="home-search-input"
            placeholder="اسألني أي شيء..."
            dir="rtl"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="home-send-btn" aria-label="Send">
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
              <path d="M22 2L11 13" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M22 2L15 22l-4-9-9-4 20-7z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div className="home-quick-row" dir="rtl">
        {quickActions.map((a) => (
          <button key={a.label} className="home-quick-btn">
            <span className="home-quick-icon">{a.icon}</span>
            <span className="home-quick-label">{a.label}</span>
          </button>
        ))}
      </div>

      {/* ── Features ── */}
      <div className="home-features-label" dir="rtl">الميزات الرئيسية</div>
      <div className="home-features" dir="rtl">
        {features.map((f) => (
          <div key={f.title} className="home-feat-card">
            <div className="home-feat-icon">{f.icon}</div>
            <div className="home-feat-title">{f.title}</div>
            <div className="home-feat-sub">{f.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Bottom nav ── */}
      <nav className="home-nav" dir="rtl">
        {[
          { icon: "🏠", label: "الرئيسية", active: true },
          { icon: "💬", label: "المحادثات", active: false },
          { icon: "⭐", label: "المفضلة", active: false },
          { icon: "⚙️", label: "الإعدادات", active: false },
        ].map((n) => (
          <button key={n.label} className={`home-nav-btn ${n.active ? "active" : ""}`}>
            <span className="home-nav-icon">{n.icon}</span>
            <span className="home-nav-label">{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
