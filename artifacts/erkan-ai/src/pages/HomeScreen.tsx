import { useState, useEffect } from "react";
import { getConversations, deleteConversation, type Conversation, type User } from "../lib/api";

interface Props {
  onNavigate: (screen: string, data?: unknown) => void;
  user?: User | null;
}

const TOOLS = [
  { id: "chat", label: "محادثة ذكية", sub: "تحدث مع الذكاء الاصطناعي", color: "#1f8bff", bg: "rgba(31,139,255,0.12)",
    icon: <svg viewBox="0 0 32 32" fill="none" width="36" height="36"><circle cx="16" cy="16" r="14" fill="url(#t1g)" opacity="0.15"/><path d="M8 10h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-4 3V12a2 2 0 0 1 2-2z" fill="url(#t1g)" /><circle cx="12" cy="16" r="1.5" fill="white" /><circle cx="16" cy="16" r="1.5" fill="white" /><circle cx="20" cy="16" r="1.5" fill="white" /><defs><linearGradient id="t1g" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#1f8bff"/><stop offset="1" stopColor="#6c3eff"/></linearGradient></defs></svg> },
  { id: "write", label: "كتابة نصوص", sub: "مقالات، محتوى، ومنشورات", color: "#a855f7", bg: "rgba(168,85,247,0.12)",
    icon: <svg viewBox="0 0 32 32" fill="none" width="36" height="36"><circle cx="16" cy="16" r="14" fill="url(#t2g)" opacity="0.15"/><path d="M8 22l2-6 12-12 4 4-12 12-6 2z" fill="url(#t2g)" /><path d="M20 6l4 4" stroke="white" strokeWidth="1.5" /><defs><linearGradient id="t2g" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#a855f7"/><stop offset="1" stopColor="#6366f1"/></linearGradient></defs></svg> },
  { id: "summarize", label: "تلخيص", sub: "لخّص النصوص الطويلة", color: "#06b6d4", bg: "rgba(6,182,212,0.12)",
    icon: <svg viewBox="0 0 32 32" fill="none" width="36" height="36"><circle cx="16" cy="16" r="14" fill="url(#t3g)" opacity="0.15"/><rect x="8" y="9" width="16" height="2.5" rx="1.25" fill="url(#t3g)" /><rect x="8" y="14" width="12" height="2.5" rx="1.25" fill="url(#t3g)" /><rect x="8" y="19" width="8" height="2.5" rx="1.25" fill="url(#t3g)" /><defs><linearGradient id="t3g" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#06b6d4"/><stop offset="1" stopColor="#1f8bff"/></linearGradient></defs></svg> },
  { id: "ideas", label: "أفكار وإلهام", sub: "احصل على أفكار إبداعية", color: "#f59e0b", bg: "rgba(245,158,11,0.12)",
    icon: <svg viewBox="0 0 32 32" fill="none" width="36" height="36"><circle cx="16" cy="16" r="14" fill="url(#t4g)" opacity="0.15"/><path d="M16 7a7 7 0 0 1 5 12l-1 2H12l-1-2A7 7 0 0 1 16 7z" fill="url(#t4g)" /><rect x="13" y="21" width="6" height="2" rx="1" fill="url(#t4g)" /><rect x="14" y="23.5" width="4" height="1.5" rx="0.75" fill="url(#t4g)" /><defs><linearGradient id="t4g" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f59e0b"/><stop offset="1" stopColor="#ef4444"/></linearGradient></defs></svg> },
  { id: "image", label: "صور بالذكاء", sub: "أنشئ صوراً احترافية", color: "#ec4899", bg: "rgba(236,72,153,0.12)",
    icon: <svg viewBox="0 0 32 32" fill="none" width="36" height="36"><circle cx="16" cy="16" r="14" fill="url(#t5g)" opacity="0.15"/><rect x="6" y="9" width="20" height="15" rx="2" fill="url(#t5g)" /><circle cx="11" cy="13.5" r="2" fill="white" opacity="0.9" /><path d="M6 21l6-5 4 4 3-3 7 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><defs><linearGradient id="t5g" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ec4899"/><stop offset="1" stopColor="#8b5cf6"/></linearGradient></defs></svg> },
];

type NavTab = "home" | "tools" | "chats" | "profile";

export default function HomeScreen({ onNavigate, user }: Props) {
  const userName = user?.name ?? "مستخدم";
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(false);

  const loadConversations = () => {
    setLoadingConvs(true);
    getConversations().then(setConversations).catch(() => {}).finally(() => setLoadingConvs(false));
  };

  useEffect(() => { loadConversations(); }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    onNavigate("chat", { initialMessage: input, mode: "chat" });
    setInput("");
  };

  const handleDeleteConv = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    await deleteConversation(id).catch(() => {});
    setConversations(prev => prev.filter(c => c.id !== id));
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (mins < 60) return `منذ ${mins} د`;
    if (hours < 24) return `منذ ${hours} س`;
    return `منذ ${days} يوم`;
  };

  const isPro = user?.subscriptionType === "pro" || user?.subscriptionType === "pro_max";
  const isProMax = user?.subscriptionType === "pro_max";

  return (
    <div className="home-root home-enter">
      <div className="home-bg" />
      <div className="home-bg-radial" />

      <header className="hs-header">
        <button className="hs-menu-btn" onClick={() => onNavigate("profile")} aria-label="Menu">
          <span className="hs-menu-line" /><span className="hs-menu-line short" /><span className="hs-menu-line" />
        </button>
        <div className="hs-logo-center">
          <img src="/erkan-ai-logo.png" alt="EA" className="hs-header-logo-img" draggable={false} />
          <span className="hs-header-brand">
            <span className="hs-hb-erkan">ERKAN </span><span className="hs-hb-ai">AI</span>
          </span>
        </div>
        <button className="hs-notif-btn" onClick={() => onNavigate("plans")} aria-label="Plans" title="الخطط والأسعار">
          {isPro ? (
            <span style={{ fontSize: 20 }}>{isProMax ? "💎" : "👑"}</span>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </header>

      <div className="hs-scroll">
        {/* ── Home tab ── */}
        {activeTab === "home" && (
          <>
            <div className="hs-greeting" dir="rtl">
              <div className="hs-greet-row"><span className="hs-wave">👋</span><h1 className="hs-greet-name">مرحباً {userName}</h1></div>
              <p className="hs-greet-sub">شو بدك نساعدك فيه اليوم؟</p>
              <p className="hs-greet-tagline">وللمستخدم العربي وبلهجتك</p>
            </div>

            <div className="hs-search-wrap">
              <div className="hs-search-bar">
                <button className="hs-mic-btn" onClick={() => onNavigate("chat", { mode: "chat" })} aria-label="Voice input">
                  <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                    <rect x="9" y="2" width="6" height="12" rx="3" fill="url(#micg)" />
                    <path d="M5 11a7 7 0 0 0 14 0" stroke="url(#micg)" strokeWidth="1.7" strokeLinecap="round" />
                    <line x1="12" y1="18" x2="12" y2="22" stroke="url(#micg)" strokeWidth="1.7" strokeLinecap="round" />
                    <defs><linearGradient id="micg" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#1f8bff"/><stop offset="1" stopColor="#8a2eff"/></linearGradient></defs>
                  </svg>
                </button>
                <input
                  className="hs-search-input" placeholder="اكتب سؤالك أو طلبك هنا..." dir="rtl"
                  value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <button className={`hs-send-btn ${input.trim() ? "active" : ""}`} onClick={handleSend} aria-label="Send">
                  <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                    <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <path d="M22 2L15 22l-4-9-9-4 20-7z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="hs-section-label" dir="rtl"><span className="hs-section-icon">✨</span> الأدوات السريعة</div>
            <div className="hs-tools-grid">
              {TOOLS.map((t) => (
                <button key={t.id} className="hs-tool-card"
                  style={{ "--tool-color": t.color, "--tool-bg": t.bg } as React.CSSProperties}
                  onClick={() => onNavigate("chat", { mode: t.id })}>
                  <div className="hs-tool-icon">{t.icon}</div>
                  <div className="hs-tool-label" dir="rtl">{t.label}</div>
                  <div className="hs-tool-sub" dir="rtl">{t.sub}</div>
                </button>
              ))}
            </div>

            {!isPro && (
              <button className="hs-pro-banner" onClick={() => onNavigate("plans")}>
                <div className="hs-pro-crown">👑</div>
                <div className="hs-pro-text" dir="rtl">
                  <div className="hs-pro-title">PRO MAX ✨</div>
                  <div className="hs-pro-desc">أطلق العنان لقوة الذكاء الاصطناعي الكاملة</div>
                </div>
                <div className="hs-pro-btn">جرب الآن</div>
                <div className="hs-pro-glow" />
              </button>
            )}

            {isPro && (
              <div className="hs-pro-active-banner" dir="rtl">
                <span>{isProMax ? "💎" : "👑"}</span>
                <div>
                  <div className="hs-pro-active-title">خطة {isProMax ? "PRO MAX" : "PRO"} مفعّلة</div>
                  {user?.subscriptionExpiresAt && (
                    <div className="hs-pro-active-exp">تنتهي: {new Date(user.subscriptionExpiresAt).toLocaleDateString("ar-SA")}</div>
                  )}
                </div>
                <button className="hs-manage-sub-btn" onClick={() => onNavigate("plans")}>إدارة</button>
              </div>
            )}

            <div className="hs-section-label" dir="rtl"><span className="hs-section-icon">💬</span> آخر المحادثات</div>
            {conversations.length === 0 ? (
              <div className="hs-empty-convs" dir="rtl"><p>لا توجد محادثات بعد. ابدأ محادثة جديدة!</p></div>
            ) : (
              <div className="hs-convs-list">
                {conversations.slice(0, 5).map((c) => (
                  <button key={c.id} className="hs-conv-item" onClick={() => onNavigate("chat", { conversationId: c.id, mode: c.mode })}>
                    <div className="hs-conv-icon">
                      <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                        <path d="M8 10h8M8 14h5" stroke="url(#cig)" strokeWidth="1.6" strokeLinecap="round" />
                        <path d="M5 5h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 3V7a2 2 0 0 1 2-2z" stroke="url(#cig)" strokeWidth="1.5" />
                        <defs><linearGradient id="cig" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#1f8bff"/><stop offset="1" stopColor="#8a2eff"/></linearGradient></defs>
                      </svg>
                    </div>
                    <div className="hs-conv-body" dir="rtl">
                      <div className="hs-conv-title">{c.title}</div>
                      <div className="hs-conv-date">{formatDate(c.updatedAt)}</div>
                    </div>
                    <button className="hs-conv-menu" onClick={(e) => handleDeleteConv(e, c.id)} aria-label="Delete" title="حذف">
                      <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </button>
                  </button>
                ))}
                {conversations.length > 5 && (
                  <button className="hs-see-all-btn" onClick={() => setActiveTab("chats")} dir="rtl">
                    عرض الكل ({conversations.length}) ←
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Tools tab ── */}
        {activeTab === "tools" && (
          <div className="hs-tab-content">
            <h2 className="hs-tab-heading" dir="rtl">🛠️ جميع الأدوات</h2>
            <div className="hs-tools-grid-full">
              {TOOLS.map((t) => (
                <button key={t.id} className="hs-tool-card"
                  style={{ "--tool-color": t.color, "--tool-bg": t.bg } as React.CSSProperties}
                  onClick={() => onNavigate("chat", { mode: t.id })}>
                  <div className="hs-tool-icon">{t.icon}</div>
                  <div className="hs-tool-label" dir="rtl">{t.label}</div>
                  <div className="hs-tool-sub" dir="rtl">{t.sub}</div>
                </button>
              ))}
            </div>
            <div className="hs-tools-extra" dir="rtl">
              <h3 className="hs-tools-extra-title">🔐 أدوات PRO MAX</h3>
              {["إنشاء مواقع ويب", "تطوير تطبيقات", "كتابة الأكواد", "إدارة قواعد البيانات"].map(t => (
                <button key={t} className="hs-promax-tool-item" onClick={() => onNavigate("plans")}>
                  <span>🔒</span> <span dir="rtl">{t}</span>
                  <span className="hs-promax-badge">PRO MAX</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Conversations tab ── */}
        {activeTab === "chats" && (
          <div className="hs-tab-content">
            <div className="hs-tab-header" dir="rtl">
              <h2 className="hs-tab-heading">💬 المحادثات</h2>
              <button className="hs-refresh-btn" onClick={loadConversations} disabled={loadingConvs}>
                {loadingConvs ? "..." : "🔄"}
              </button>
            </div>
            {conversations.length === 0 ? (
              <div className="hs-empty-convs" dir="rtl"><p>لا توجد محادثات بعد.</p></div>
            ) : (
              <div className="hs-convs-list">
                {conversations.map((c) => (
                  <button key={c.id} className="hs-conv-item" onClick={() => onNavigate("chat", { conversationId: c.id, mode: c.mode })}>
                    <div className="hs-conv-icon">
                      <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                        <path d="M8 10h8M8 14h5" stroke="url(#cig2)" strokeWidth="1.6" strokeLinecap="round" />
                        <path d="M5 5h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 3V7a2 2 0 0 1 2-2z" stroke="url(#cig2)" strokeWidth="1.5" />
                        <defs><linearGradient id="cig2" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#1f8bff"/><stop offset="1" stopColor="#8a2eff"/></linearGradient></defs>
                      </svg>
                    </div>
                    <div className="hs-conv-body" dir="rtl">
                      <div className="hs-conv-title">{c.title}</div>
                      <div className="hs-conv-date">{formatDate(c.updatedAt)} · {c.mode}</div>
                    </div>
                    <button className="hs-conv-menu" onClick={(e) => handleDeleteConv(e, c.id)} title="حذف">
                      <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </button>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ height: 100 }} />
      </div>

      <nav className="hs-bottom-nav">
        <button className={`hs-nav-btn ${activeTab === "home" ? "active" : ""}`} onClick={() => setActiveTab("home")}>
          <HomeIcon active={activeTab === "home"} /><span className="hs-nav-label">الرئيسية</span>
        </button>
        <button className={`hs-nav-btn ${activeTab === "tools" ? "active" : ""}`} onClick={() => setActiveTab("tools")}>
          <ToolsIcon active={activeTab === "tools"} /><span className="hs-nav-label">الأدوات</span>
        </button>
        <button className="hs-nav-center-btn" onClick={() => onNavigate("chat", { mode: "chat" })} aria-label="New Chat">
          <img src="/erkan-ai-logo.png" alt="EA" className="hs-nav-center-img" draggable={false} />
          <div className="hs-nav-center-ring" />
        </button>
        <button className={`hs-nav-btn ${activeTab === "chats" ? "active" : ""}`} onClick={() => setActiveTab("chats")}>
          <ChatIcon active={activeTab === "chats"} /><span className="hs-nav-label">المحادثات</span>
        </button>
        <button className={`hs-nav-btn ${activeTab === "profile" ? "active" : ""}`} onClick={() => onNavigate("profile")}>
          <ProfileIcon active={activeTab === "profile"} /><span className="hs-nav-label">ملفي</span>
        </button>
      </nav>
    </div>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  const c = active ? "#818cf8" : "rgba(150,168,215,0.5)";
  return <svg viewBox="0 0 24 24" fill="none" width="22" height="22"><path d="M3 12L12 4l9 8" stroke={c} strokeWidth="1.6" strokeLinecap="round" /><path d="M5 10v9a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-9" stroke={c} strokeWidth="1.6" strokeLinecap="round" /></svg>;
}
function ToolsIcon({ active }: { active: boolean }) {
  const c = active ? "#818cf8" : "rgba(150,168,215,0.5)";
  return <svg viewBox="0 0 24 24" fill="none" width="22" height="22"><rect x="3" y="3" width="8" height="8" rx="1.5" stroke={c} strokeWidth="1.6" /><rect x="13" y="3" width="8" height="8" rx="1.5" stroke={c} strokeWidth="1.6" /><rect x="3" y="13" width="8" height="8" rx="1.5" stroke={c} strokeWidth="1.6" /><rect x="13" y="13" width="8" height="8" rx="1.5" stroke={c} strokeWidth="1.6" /></svg>;
}
function ChatIcon({ active }: { active: boolean }) {
  const c = active ? "#818cf8" : "rgba(150,168,215,0.5)";
  return <svg viewBox="0 0 24 24" fill="none" width="22" height="22"><path d="M5 5h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 3V7a2 2 0 0 1 2-2z" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function ProfileIcon({ active }: { active: boolean }) {
  const c = active ? "#818cf8" : "rgba(150,168,215,0.5)";
  return <svg viewBox="0 0 24 24" fill="none" width="22" height="22"><circle cx="12" cy="8" r="4" stroke={c} strokeWidth="1.6" /><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" stroke={c} strokeWidth="1.6" strokeLinecap="round" /></svg>;
}
