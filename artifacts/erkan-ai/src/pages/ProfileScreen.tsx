import { useState, useEffect, useRef } from "react";
import {
  getProfile, updateProfile, changePassword, deleteAccount,
  authLogout, getSubscriptionStatus,
  type User, type SubscriptionStatus,
} from "../lib/api";

interface Props {
  user: User;
  onUserUpdate: (u: User) => void;
  onLogout: () => void;
  onBack: () => void;
  onNavigate?: (screen: string, data?: unknown) => void;
}

/* ─── helpers ────────────────────────────── */
function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });
}
function daysSince(iso: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}
function planLabel(p: string) {
  return p === "pro_max" ? "PRO MAX" : p === "pro" ? "PRO" : "مجاني";
}
function planColor(p: string) {
  return p === "pro_max" ? "#a855f7" : p === "pro" ? "#1e88ff" : "#64748b";
}
function planGlow(p: string) {
  return p === "pro_max"
    ? "0 0 24px rgba(168,85,247,0.4)"
    : p === "pro"
    ? "0 0 24px rgba(30,136,255,0.4)"
    : "none";
}
function planEmoji(p: string) {
  return p === "pro_max" ? "💎" : p === "pro" ? "👑" : "⚡";
}

/* ─── UserIdCard ────────────────────────── */
function UserIdCard({ uid, onCopied }: { uid: string; onCopied: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(uid); } catch { /* fallback */ }
    setCopied(true);
    onCopied();
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="prf2-uid-card" dir="rtl">
      <div className="prf2-uid-label">معرّفك الشخصي</div>
      <div className="prf2-uid-row">
        <span className="prf2-uid-value">{uid}</span>
        <button className="prf2-uid-copy-btn" onClick={copy} title="نسخ">
          {copied ? (
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M20 6L9 17l-5-5" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          )}
        </button>
      </div>
      <div className="prf2-uid-note">لا يمكن تعديل المعرّف • يُستخدم للتعريف والدعم الفني</div>
    </div>
  );
}

/* ─── Toast ────────────────────────────── */
type ToastType = "success" | "error" | "info";
function Toast({ msg, type, onDone }: { msg: string; type: ToastType; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); }, []);
  const colors: Record<ToastType, string> = {
    success: "rgba(22,163,74,0.95)",
    error: "rgba(185,28,28,0.95)",
    info: "rgba(30,58,138,0.95)",
  };
  const icons: Record<ToastType, string> = { success: "✓", error: "✕", info: "ℹ" };
  return (
    <div className="prf2-toast" style={{ background: colors[type] }} dir="rtl">
      <span className="prf2-toast-icon">{icons[type]}</span>
      {msg}
    </div>
  );
}

/* ─── Spinner ──────────────────────────── */
function Spin({ size = 16 }: { size?: number }) {
  return <span className="prf2-spin" style={{ width: size, height: size }} />;
}

/* ─── Avatar ───────────────────────────── */
function AvatarUpload({
  avatarUrl, name, plan,
  onUpload,
}: {
  avatarUrl: string | null; name: string; plan: string;
  onUpload: (b64: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(avatarUrl);
  const [busy, setBusy] = useState(false);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const S = 300;
        const canvas = document.createElement("canvas");
        canvas.width = S; canvas.height = S;
        const ctx = canvas.getContext("2d")!;
        const r = Math.max(S / img.width, S / img.height);
        const w = img.width * r; const h = img.height * r;
        ctx.drawImage(img, (S - w) / 2, (S - h) / 2, w, h);
        const b64 = canvas.toDataURL("image/jpeg", 0.88);
        setPreview(b64);
        onUpload(b64);
        setBusy(false);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const initials = name.split(" ").map(w => w[0] ?? "").join("").toUpperCase().slice(0, 2);

  return (
    <div
      className="prf2-avatar-wrap"
      style={{ boxShadow: planGlow(plan) }}
      onClick={() => inputRef.current?.click()}
    >
      {preview
        ? <img src={preview} alt={name} className="prf2-avatar-img" />
        : <div className="prf2-avatar-letters">{initials}</div>
      }
      <div className={`prf2-avatar-overlay ${busy ? "busy" : ""}`}>
        {busy ? <Spin size={22} /> : (
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
              stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
            <circle cx="12" cy="13" r="4" stroke="white" strokeWidth="1.8" />
          </svg>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={pick} />
    </div>
  );
}

/* ─── Change Password Modal ─────────────── */
function PwdModal({ onClose, onSave }: { onClose: () => void; onSave: (c: string, n: string) => Promise<void> }) {
  const [curr, setCurr] = useState(""); const [next, setNext] = useState(""); const [conf, setConf] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");

  const save = async () => {
    if (!curr || !next || !conf) { setErr("جميع الحقول مطلوبة"); return; }
    if (next.length < 6) { setErr("كلمة المرور الجديدة ٦ أحرف على الأقل"); return; }
    if (next !== conf) { setErr("كلمتا المرور غير متطابقتين"); return; }
    setBusy(true); setErr("");
    try { await onSave(curr, next); onClose(); }
    catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <div className="prf2-modal-bg" onClick={onClose}>
      <div className="prf2-modal" dir="rtl" onClick={e => e.stopPropagation()}>
        <div className="prf2-modal-handle" />
        <h3 className="prf2-modal-title">🔑 تغيير كلمة المرور</h3>
        {err && <div className="prf2-modal-err">{err}</div>}
        {[
          { label: "كلمة المرور الحالية", val: curr, set: setCurr },
          { label: "كلمة المرور الجديدة", val: next, set: setNext },
          { label: "تأكيد كلمة المرور", val: conf, set: setConf },
        ].map(f => (
          <div key={f.label} className="prf2-modal-field">
            <label className="prf2-modal-label">{f.label}</label>
            <input type="password" className="prf2-modal-input" value={f.val}
              onChange={e => f.set(e.target.value)} placeholder="••••••" />
          </div>
        ))}
        <div className="prf2-modal-row">
          <button className="prf2-modal-cancel" onClick={onClose}>إلغاء</button>
          <button className="prf2-modal-confirm" onClick={save} disabled={busy}>
            {busy ? <Spin /> : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Delete Confirm Modal ──────────────── */
function DeleteModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const go = async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); } };
  return (
    <div className="prf2-modal-bg" onClick={onClose}>
      <div className="prf2-modal" dir="rtl" onClick={e => e.stopPropagation()}>
        <div className="prf2-modal-handle" />
        <div className="prf2-delete-emoji">⚠️</div>
        <h3 className="prf2-modal-title">حذف الحساب نهائياً</h3>
        <p className="prf2-modal-desc">
          سيتم حذف جميع بياناتك ومحادثاتك بشكل نهائي. هذا الإجراء لا يمكن التراجع عنه.
        </p>
        <div className="prf2-modal-row">
          <button className="prf2-modal-cancel" onClick={onClose}>إلغاء</button>
          <button className="prf2-modal-delete-btn" onClick={go} disabled={busy}>
            {busy ? <Spin /> : "حذف نهائياً"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Edit Profile Modal ────────────────── */
function EditModal({
  user, onClose, onSaved,
}: { user: User; onClose: () => void; onSaved: (u: User) => void }) {
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio ?? "");
  const [gender, setGender] = useState(user.gender ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const save = async () => {
    if (!name.trim()) { setErr("الاسم مطلوب"); return; }
    setBusy(true); setErr("");
    try {
      const updated = await updateProfile({ name: name.trim(), username: username.trim(), bio: bio.trim(), gender });
      onSaved({ ...user, ...updated });
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <div className="prf2-modal-bg" onClick={onClose}>
      <div className="prf2-modal" dir="rtl" onClick={e => e.stopPropagation()}>
        <div className="prf2-modal-handle" />
        <h3 className="prf2-modal-title">✏️ تعديل الملف الشخصي</h3>
        {err && <div className="prf2-modal-err">{err}</div>}
        <div className="prf2-modal-field">
          <label className="prf2-modal-label">الاسم الكامل</label>
          <input className="prf2-modal-input" value={name} onChange={e => setName(e.target.value)} placeholder="اسمك الكامل" />
        </div>
        <div className="prf2-modal-field">
          <label className="prf2-modal-label">اسم المستخدم</label>
          <div style={{ position: "relative" }}>
            <input className="prf2-modal-input" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="username" dir="ltr" style={{ textAlign: "left", paddingRight: 32 }} />
            <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(30,136,255,0.6)", fontSize: "0.9rem" }}>@</span>
          </div>
        </div>
        <div className="prf2-modal-field">
          <label className="prf2-modal-label">نبذة شخصية</label>
          <textarea className="prf2-modal-input" value={bio} onChange={e => setBio(e.target.value)}
            placeholder="أخبرنا عن نفسك..." rows={3} style={{ resize: "none" }} />
        </div>
        <div className="prf2-modal-field">
          <label className="prf2-modal-label">الجنس</label>
          <div className="prf2-gender-row">
            <button
              type="button"
              className={`prf2-gender-btn ${gender === "male" ? "prf2-gender-active-m" : ""}`}
              onClick={() => setGender(gender === "male" ? "" : "male")}
            >
              👨 ذكر
            </button>
            <button
              type="button"
              className={`prf2-gender-btn ${gender === "female" ? "prf2-gender-active-f" : ""}`}
              onClick={() => setGender(gender === "female" ? "" : "female")}
            >
              👩 أنثى
            </button>
          </div>
        </div>
        <div className="prf2-modal-row">
          <button className="prf2-modal-cancel" onClick={onClose}>إلغاء</button>
          <button className="prf2-modal-confirm" onClick={save} disabled={busy}>
            {busy ? <Spin /> : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   ProfileScreen
════════════════════════════════════════ */
export default function ProfileScreen({ user: initUser, onUserUpdate, onLogout, onBack, onNavigate }: Props) {
  const [user, setUser] = useState<User>(initUser);
  const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);
  const [modal, setModal] = useState<"pwd" | "delete" | "edit" | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    getProfile()
      .then(u => { setUser(u); onUserUpdate(u); })
      .catch(() => {});
    getSubscriptionStatus()
      .then(setSubStatus)
      .catch(() => {});
  }, []);

  const toast$ = (msg: string, type: ToastType = "success") => setToast({ msg, type });

  const handleAvatarUpload = async (b64: string) => {
    try {
      const u = await updateProfile({ avatarUrl: b64 });
      const merged = { ...user, ...u };
      setUser(merged); onUserUpdate(merged);
      toast$("تم تحديث الصورة ✓");
    } catch (e) { toast$((e as Error).message, "error"); }
  };

  const handleSaved = (u: User) => {
    setUser(u); onUserUpdate(u);
    toast$("تم الحفظ بنجاح ✓");
    setModal(null);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await authLogout(); } catch { /* ignore */ }
    onLogout();
  };

  const handleDelete = async () => {
    await deleteAccount();
    onLogout();
  };

  const plan = user.subscriptionType ?? "free";
  const pct = subStatus ? Math.min(100, Math.round((subStatus.dailyUsed / subStatus.dailyLimit) * 100)) : 0;
  const remaining = subStatus ? subStatus.dailyLimit - subStatus.dailyUsed : 0;

  return (
    <div className="prf2-root">
      {/* background */}
      <div className="prf2-bg" />
      <div className="prf2-bg-radial" />

      {/* modals */}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      {modal === "pwd" && (
        <PwdModal onClose={() => setModal(null)} onSave={async (c, n) => {
          await changePassword(c, n);
          toast$("تم تغيير كلمة المرور ✓");
        }} />
      )}
      {modal === "delete" && <DeleteModal onClose={() => setModal(null)} onConfirm={handleDelete} />}
      {modal === "edit" && <EditModal user={user} onClose={() => setModal(null)} onSaved={handleSaved} />}

      {/* ── Header ── */}
      <header className="prf2-header">
        <button className="prf2-back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="prf2-header-title" dir="rtl">الملف الشخصي</span>
        <button className="prf2-edit-top-btn" onClick={() => setModal("edit")} title="تعديل">
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <div className="prf2-scroll">

        {/* ── Hero card ── */}
        <div className="prf2-hero">
          <div className="prf2-hero-cover" style={{ background: plan === "pro_max" ? "linear-gradient(135deg,#1a0533,#2d0b5a,#12063a)" : plan === "pro" ? "linear-gradient(135deg,#020d2a,#072258,#04091e)" : "linear-gradient(135deg,#0a0f22,#111827,#070b18)" }} />
          <div className="prf2-hero-body">
            <AvatarUpload avatarUrl={user.avatarUrl} name={user.name} plan={plan} onUpload={handleAvatarUpload} />
            <div className="prf2-hero-info" dir="rtl">
              <div className="prf2-hero-name">{user.name}</div>
              <div className="prf2-hero-handle">@{user.username}</div>
              {user.bio && <div className="prf2-hero-bio">{user.bio}</div>}
              <div
                className="prf2-plan-badge"
                style={{ background: `${planColor(plan)}22`, border: `1px solid ${planColor(plan)}55`, color: planColor(plan), boxShadow: planGlow(plan) }}
              >
                {planEmoji(plan)} {planLabel(plan)}
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="prf2-stats" dir="rtl">
          {[
            { icon: "💬", val: user.conversationCount, label: "محادثة" },
            { icon: "🎨", val: user.imageCount, label: "صورة" },
            { icon: "📅", val: daysSince(user.createdAt), label: "يوم معنا" },
          ].map(s => (
            <div key={s.label} className="prf2-stat">
              <span className="prf2-stat-icon">{s.icon}</span>
              <span className="prf2-stat-val">{s.val}</span>
              <span className="prf2-stat-lbl">{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── Subscription card ── */}
        <div className="prf2-section" dir="rtl">
          <div className="prf2-section-title">الاشتراك</div>
          <div className="prf2-sub-card" style={{ borderColor: `${planColor(plan)}40` }}>
            <div className="prf2-sub-top">
              <div>
                <div className="prf2-sub-plan-name" style={{ color: planColor(plan) }}>
                  {planEmoji(plan)} خطة {planLabel(plan)}
                </div>
                {plan !== "free" && user.subscriptionExpiresAt && (
                  <div className="prf2-sub-exp">تنتهي في {fmtDate(user.subscriptionExpiresAt)}</div>
                )}
                {plan === "free" && (
                  <div className="prf2-sub-exp">ترقّ للحصول على ميزات أكثر</div>
                )}
              </div>
              <div className="prf2-sub-icon" style={{ background: `${planColor(plan)}18` }}>
                <span style={{ fontSize: "1.5rem" }}>{planEmoji(plan)}</span>
              </div>
            </div>

            {/* Daily usage bar */}
            {subStatus && (
              <div className="prf2-usage">
                <div className="prf2-usage-row">
                  <span className="prf2-usage-label">الاستخدام اليومي</span>
                  <span className="prf2-usage-nums">
                    <span style={{ color: "#fff" }}>{subStatus.dailyUsed}</span>
                    <span style={{ color: "rgba(150,170,220,0.5)" }}>/{subStatus.dailyLimit}</span>
                  </span>
                </div>
                <div className="prf2-usage-track">
                  <div className="prf2-usage-fill" style={{
                    width: `${pct}%`,
                    background: pct > 90
                      ? "linear-gradient(90deg,#ef4444,#dc2626)"
                      : pct > 70
                      ? "linear-gradient(90deg,#f59e0b,#d97706)"
                      : `linear-gradient(90deg,${planColor(plan)},${planColor(plan)}99)`,
                  }} />
                </div>
                <div className="prf2-usage-remain">
                  {remaining > 0 ? `${remaining} رسالة متبقية اليوم` : "انتهى الحد اليومي"}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="prf2-sub-actions">
              <button className="prf2-sub-btn outline" onClick={() => onNavigate?.("activate")}>
                🔑 تفعيل كود
              </button>
              <button className="prf2-sub-btn primary" style={{ background: `linear-gradient(135deg,${planColor(plan === "free" ? "pro" : plan)},${planColor(plan === "free" ? "pro_max" : plan)}99)` }}
                onClick={() => onNavigate?.("plans")}>
                {plan === "free" ? "⬆️ ترقية الخطة" : "📋 عرض الخطط"}
              </button>
            </div>
          </div>
        </div>

        {/* ── User ID card ── */}
        {user.userId && (
          <div className="prf2-section" dir="rtl">
            <div className="prf2-section-title">معرّف المستخدم</div>
            <UserIdCard uid={user.userId} onCopied={() => toast$("تم نسخ المعرّف ✓")} />
          </div>
        )}

        {/* ── Account info ── */}
        <div className="prf2-section" dir="rtl">
          <div className="prf2-section-title">معلومات الحساب</div>
          <div className="prf2-info-card">
            {[
              { icon: "📧", label: "البريد الإلكتروني", val: user.email },
              { icon: "🗓️", label: "تاريخ إنشاء الحساب", val: fmtDate(user.createdAt) },
              { icon: "🕐", label: "آخر تسجيل دخول", val: fmtDate(user.lastLoginAt) },
              { icon: "💬", label: "عدد المحادثات", val: String(user.conversationCount) },
            ].map((row, i, arr) => (
              <div key={row.label} className="prf2-info-row" style={i < arr.length - 1 ? { borderBottom: "1px solid rgba(255,255,255,0.05)" } : {}}>
                <span className="prf2-info-val">{row.val}</span>
                <div className="prf2-info-left">
                  <span className="prf2-info-icon">{row.icon}</span>
                  <span className="prf2-info-label">{row.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Settings ── */}
        <div className="prf2-section" dir="rtl">
          <div className="prf2-section-title">الإعدادات</div>
          <div className="prf2-menu-card">
            {[
              {
                icon: "✏️", label: "تعديل الملف الشخصي",
                sub: `${user.name} · @${user.username}`,
                onClick: () => setModal("edit"),
              },
              {
                icon: "🔑", label: "تغيير كلمة المرور",
                sub: "آخر تغيير: غير محدد",
                onClick: () => setModal("pwd"),
              },
              {
                icon: "ℹ️", label: "معلومات المطور",
                sub: "ERKAN AI · فريق TRSY",
                onClick: () => onNavigate?.("devinfo"),
              },
            ].map((item, i, arr) => (
              <div key={item.label}>
                <button className="prf2-menu-row" onClick={item.onClick}>
                  <svg className="prf2-menu-chevron" viewBox="0 0 24 24" fill="none" width="16" height="16">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="prf2-menu-text">
                    <span className="prf2-menu-label">{item.label}</span>
                    <span className="prf2-menu-sub">{item.sub}</span>
                  </div>
                  <span className="prf2-menu-icon">{item.icon}</span>
                </button>
                {i < arr.length - 1 && <div className="prf2-menu-divider" />}
              </div>
            ))}
          </div>
        </div>

        {/* ── Follow us ── */}
        <button
          className="prf2-follow-btn"
          onClick={() => window.open("https://www.instagram.com/erkanleriscom?igsh=MWw0MWIyc3loN25paQ==", "_blank")}
          dir="rtl"
        >
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20" stroke="currentColor" strokeWidth="1.8">
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <circle cx="12" cy="12" r="5" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" strokeWidth="0" />
          </svg>
          <span>تابعنا على إنستغرام</span>
          <span className="prf2-follow-handle">@erkanleriscom</span>
        </button>

        {/* ── Danger zone ── */}
        <div className="prf2-danger" dir="rtl">
          <button className="prf2-logout-btn" onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? <Spin /> : (
              <>
                <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                تسجيل الخروج
              </>
            )}
          </button>
          <button className="prf2-delete-btn" onClick={() => setModal("delete")}>
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
              <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            حذف الحساب نهائياً
          </button>
        </div>

        {/* ── Footer ── */}
        <div className="prf2-footer" dir="rtl">
          <span className="prf2-footer-logo">ERKAN AI</span>
          <span className="prf2-footer-ver">v1.0.0</span>
        </div>

        <div style={{ height: 50 }} />
      </div>
    </div>
  );
}
