import { useState, useEffect, useCallback } from "react";
import {
  adminGenerateCode, adminGetCodes, adminGetUsers, adminDeleteCode,
  type SubscriptionCode, type User,
} from "../lib/api";

interface Props {
  onBack: () => void;
}

const PLAN_NAMES: Record<string, string> = { free: "مجاني", pro: "PRO", pro_max: "PRO MAX" };
const PLAN_COLORS: Record<string, string> = { free: "#888", pro: "#1f8bff", pro_max: "#a855f7" };

type Tab = "generate" | "codes" | "users";

export default function AdminPanel({ onBack }: Props) {
  const [authKey, setAuthKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [tab, setTab] = useState<Tab>("generate");

  const [plan, setPlan] = useState("pro");
  const [duration, setDuration] = useState(30);
  const [note, setNote] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<SubscriptionCode | null>(null);
  const [genError, setGenError] = useState("");

  const [codes, setCodes] = useState<SubscriptionCode[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const loadCodes = useCallback(async () => {
    if (!authKey) return;
    setLoadingData(true);
    try { setCodes(await adminGetCodes(authKey)); } catch { /* ignore */ } finally { setLoadingData(false); }
  }, [authKey]);

  const loadUsers = useCallback(async () => {
    if (!authKey) return;
    setLoadingData(true);
    try { setUsers(await adminGetUsers(authKey)); } catch { /* ignore */ } finally { setLoadingData(false); }
  }, [authKey]);

  useEffect(() => {
    if (!authed) return;
    if (tab === "codes") loadCodes();
    else if (tab === "users") loadUsers();
  }, [tab, authed, loadCodes, loadUsers]);

  const handleAuth = async () => {
    if (!authKey.trim()) { setAuthError("أدخل مفتاح الإدارة"); return; }
    try {
      await adminGetCodes(authKey.trim());
      setAuthed(true);
      setAuthError("");
    } catch (err) {
      setAuthError((err as Error).message.includes("غير صحيح") ? "مفتاح الإدارة غير صحيح" : "خطأ في الاتصال");
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError("");
    setGeneratedCode(null);
    try {
      const code = await adminGenerateCode(authKey, plan, duration, note.trim() || undefined);
      setGeneratedCode(code);
      setNote("");
    } catch (err) {
      setGenError((err as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteCode = async (id: number) => {
    if (!confirm("هل تريد حذف هذا الكود؟")) return;
    try {
      await adminDeleteCode(authKey, id);
      setCodes(prev => prev.filter(c => c.id !== id));
    } catch { /* ignore */ }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatCode = (c: string) => `${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8, 12)}-${c.slice(12)}`;

  if (!authed) {
    return (
      <div className="admin-root">
        <div className="admin-bg" />
        <header className="admin-header">
          <button className="admin-back-btn" onClick={onBack}>
            <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
              <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="admin-title">لوحة الإدارة</h1>
          <div style={{ width: 40 }} />
        </header>

        <div className="admin-auth-body">
          <div className="admin-auth-icon">🛡️</div>
          <h2 className="admin-auth-heading" dir="rtl">أدخل مفتاح الإدارة</h2>
          <p className="admin-auth-desc" dir="rtl">هذه المنطقة محمية. أدخل المفتاح السري للدخول.</p>
          <input
            className="admin-key-input"
            type="password"
            placeholder="ADMIN KEY..."
            value={authKey}
            onChange={(e) => { setAuthKey(e.target.value); setAuthError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleAuth()}
            dir="ltr"
          />
          {authError && <p className="admin-auth-error" dir="rtl">⚠️ {authError}</p>}
          <button className="admin-auth-btn" onClick={handleAuth}>دخول</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-root">
      <div className="admin-bg" />
      <header className="admin-header">
        <button className="admin-back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="admin-title">لوحة الإدارة</h1>
        <button className="admin-logout-btn" onClick={() => { setAuthed(false); setAuthKey(""); }}>خروج</button>
      </header>

      <div className="admin-tabs">
        {(["generate", "codes", "users"] as Tab[]).map((t) => (
          <button
            key={t}
            className={`admin-tab ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "generate" ? "🔑 إنشاء كود" : t === "codes" ? "📋 الأكواد" : "👥 المستخدمون"}
          </button>
        ))}
      </div>

      <div className="admin-body">
        {/* ── Generate Code ── */}
        {tab === "generate" && (
          <div className="admin-generate">
            <h3 className="admin-section-title" dir="rtl">إنشاء كود تفعيل جديد</h3>

            <label className="admin-label" dir="rtl">نوع الخطة</label>
            <div className="admin-plan-btns">
              {["pro", "pro_max"].map((p) => (
                <button
                  key={p}
                  className={`admin-plan-btn ${plan === p ? "active" : ""}`}
                  style={{ "--plan-color": PLAN_COLORS[p] } as React.CSSProperties}
                  onClick={() => setPlan(p)}
                >
                  {p === "pro" ? "👑 PRO" : "💎 PRO MAX"}
                </button>
              ))}
            </div>

            <label className="admin-label" dir="rtl">مدة الاشتراك (أيام)</label>
            <div className="admin-duration-btns">
              {[30, 90, 180, 365].map((d) => (
                <button
                  key={d}
                  className={`admin-dur-btn ${duration === d ? "active" : ""}`}
                  onClick={() => setDuration(d)}
                >
                  {d === 30 ? "شهر" : d === 90 ? "3 أشهر" : d === 180 ? "6 أشهر" : "سنة"}
                </button>
              ))}
            </div>

            <label className="admin-label" dir="rtl">ملاحظة (اختياري)</label>
            <input
              className="admin-note-input"
              placeholder="مثال: للعميل أحمد"
              dir="rtl"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            <button className="admin-generate-btn" onClick={handleGenerate} disabled={generating}>
              {generating ? <span className="admin-spinner" /> : "🎲 إنشاء كود جديد"}
            </button>

            {genError && <p className="admin-gen-error" dir="rtl">⚠️ {genError}</p>}

            {generatedCode && (
              <div className="admin-code-result" dir="rtl">
                <p className="admin-code-result-label">تم الإنشاء بنجاح! 🎉</p>
                <div className="admin-code-display">
                  <span className="admin-code-text">{formatCode(generatedCode.code)}</span>
                  <button className="admin-copy-btn" onClick={() => copyCode(generatedCode.code)}>
                    {copiedCode === generatedCode.code ? "✓ نُسخ" : "📋 نسخ"}
                  </button>
                </div>
                <p className="admin-code-meta">
                  الخطة: <strong style={{ color: PLAN_COLORS[generatedCode.plan] ?? "#fff" }}>{PLAN_NAMES[generatedCode.plan]}</strong>
                  {" · "}{generatedCode.durationDays} يوم
                  {generatedCode.note && ` · ${generatedCode.note}`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Codes List ── */}
        {tab === "codes" && (
          <div className="admin-codes-list">
            <div className="admin-list-header" dir="rtl">
              <h3 className="admin-section-title">جميع الأكواد ({codes.length})</h3>
              <button className="admin-refresh-btn" onClick={loadCodes} disabled={loadingData}>
                {loadingData ? "..." : "🔄 تحديث"}
              </button>
            </div>

            {codes.length === 0 && !loadingData && (
              <p className="admin-empty" dir="rtl">لا توجد أكواد بعد. أنشئ كوداً جديداً!</p>
            )}

            {codes.map((c) => (
              <div key={c.id} className={`admin-code-card ${c.usedBy ? "used" : "unused"}`} dir="rtl">
                <div className="admin-code-card-top">
                  <span className="admin-code-val" onClick={() => copyCode(c.code)} title="نسخ">
                    {formatCode(c.code)}
                  </span>
                  <span className="admin-code-status">
                    {c.usedBy ? "✓ مستخدم" : "◎ متاح"}
                  </span>
                </div>
                <div className="admin-code-card-meta">
                  <span style={{ color: PLAN_COLORS[c.plan] ?? "#fff" }}>{PLAN_NAMES[c.plan]}</span>
                  {" · "}{c.durationDays} يوم
                  {c.note && ` · ${c.note}`}
                </div>
                <div className="admin-code-card-dates">
                  <span>أُنشئ: {new Date(c.createdAt).toLocaleDateString("ar-SA")}</span>
                  {c.usedAt && <span>استُخدم: {new Date(c.usedAt).toLocaleDateString("ar-SA")}</span>}
                </div>
                {!c.usedBy && (
                  <div className="admin-code-card-actions">
                    <button className="admin-copy-sm" onClick={() => copyCode(c.code)}>
                      {copiedCode === c.code ? "✓ نُسخ" : "📋"}
                    </button>
                    <button className="admin-del-btn" onClick={() => handleDeleteCode(c.id)}>🗑️</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Users List ── */}
        {tab === "users" && (
          <div className="admin-users-list">
            <div className="admin-list-header" dir="rtl">
              <h3 className="admin-section-title">المستخدمون ({users.length})</h3>
              <button className="admin-refresh-btn" onClick={loadUsers} disabled={loadingData}>
                {loadingData ? "..." : "🔄 تحديث"}
              </button>
            </div>

            {users.map((u) => (
              <div key={u.id} className="admin-user-card" dir="rtl">
                <div className="admin-user-name">
                  {u.name}
                  <span className="admin-user-badge" style={{ color: PLAN_COLORS[u.subscriptionType] ?? "#888" }}>
                    {PLAN_NAMES[u.subscriptionType] ?? u.subscriptionType}
                  </span>
                </div>
                <div className="admin-user-email">{u.email}</div>
                <div className="admin-user-meta">
                  <span>@{u.username}</span>
                  <span>انضم: {new Date(u.createdAt).toLocaleDateString("ar-SA")}</span>
                  {u.subscriptionExpiresAt && (
                    <span>يملك حتى: {new Date(u.subscriptionExpiresAt).toLocaleDateString("ar-SA")}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
