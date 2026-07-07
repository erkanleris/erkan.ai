import { useState, useEffect, useRef } from "react";
import { getProfile, updateProfile, changePassword, deleteAccount, authLogout, type User } from "../lib/api";

interface Props {
  user: User;
  onUserUpdate: (u: User) => void;
  onLogout: () => void;
  onBack: () => void;
  onNavigate?: (screen: string, data?: unknown) => void;
}

/* ── Toast ─────────────────────────────────── */
type ToastType = "success" | "error" | "info";
function Toast({ msg, type, onDone }: { msg: string; type: ToastType; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, []);
  return (
    <div className={`prof-toast prof-toast-${type}`} dir="rtl">
      <span className="prof-toast-icon">
        {type === "success" ? "✓" : type === "error" ? "✕" : "ℹ"}
      </span>
      {msg}
    </div>
  );
}

/* ── Subscription badge ─────────────────────── */
function SubBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    free: { label: "مجاني", cls: "sub-free" },
    pro: { label: "PRO", cls: "sub-pro" },
    pro_max: { label: "PRO MAX", cls: "sub-max" },
  };
  const m = map[type] ?? map["free"]!;
  return <span className={`prof-sub-badge ${m.cls}`}>{m.label}</span>;
}

/* ── Avatar with upload ─────────────────────── */
function AvatarUpload({ avatarUrl, name, onUpload }: { avatarUrl: string | null; name: string; onUpload: (base64: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [uploading, setUploading] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const SIZE = 240;
        canvas.width = SIZE; canvas.height = SIZE;
        const ctx = canvas.getContext("2d")!;
        const ratio = Math.max(SIZE / img.width, SIZE / img.height);
        const w = img.width * ratio; const h = img.height * ratio;
        ctx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h);
        const base64 = canvas.toDataURL("image/jpeg", 0.85);
        setPreview(base64);
        onUpload(base64);
        setUploading(false);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="prof-avatar-wrap" onClick={() => inputRef.current?.click()} title="تغيير الصورة">
      {preview
        ? <img src={preview} alt={name} className="prof-avatar-img" />
        : <div className="prof-avatar-initials">{initials}</div>
      }
      <div className={`prof-avatar-overlay ${uploading ? "loading" : ""}`}>
        {uploading
          ? <div className="prof-avatar-spinner" />
          : <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/><circle cx="12" cy="13" r="4" stroke="white" strokeWidth="1.8"/></svg>
        }
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
    </div>
  );
}

/* ── Change Password Modal ──────────────────── */
function PasswordModal({ onClose, onSave }: { onClose: () => void; onSave: (curr: string, next: string) => Promise<void> }) {
  const [curr, setCurr] = useState(""); const [next, setNext] = useState(""); const [conf, setConf] = useState("");
  const [loading, setLoading] = useState(false); const [err, setErr] = useState("");

  const handleSave = async () => {
    if (!curr || !next || !conf) { setErr("جميع الحقول مطلوبة"); return; }
    if (next.length < 6) { setErr("كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل"); return; }
    if (next !== conf) { setErr("كلمتا المرور غير متطابقتين"); return; }
    setLoading(true); setErr("");
    try { await onSave(curr, next); onClose(); }
    catch (e) { setErr((e as Error).message); }
    finally { setLoading(false); }
  };

  return (
    <div className="prof-modal-overlay" onClick={onClose}>
      <div className="prof-modal" dir="rtl" onClick={e => e.stopPropagation()}>
        <h3 className="prof-modal-title">تغيير كلمة المرور</h3>
        {err && <div className="prof-modal-err">{err}</div>}
        {[
          { label: "كلمة المرور الحالية", val: curr, set: setCurr },
          { label: "كلمة المرور الجديدة", val: next, set: setNext },
          { label: "تأكيد كلمة المرور الجديدة", val: conf, set: setConf },
        ].map(f => (
          <div key={f.label} className="prof-modal-field">
            <label className="prof-field-label">{f.label}</label>
            <input type="password" className="prof-field-input" value={f.val} onChange={e => f.set(e.target.value)} placeholder="••••••" />
          </div>
        ))}
        <div className="prof-modal-btns">
          <button className="prof-modal-cancel" onClick={onClose}>إلغاء</button>
          <button className="prof-modal-save" onClick={handleSave} disabled={loading}>
            {loading ? <div className="prof-btn-spinner" /> : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Delete Confirm Modal ───────────────────── */
function DeleteModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => Promise<void> }) {
  const [loading, setLoading] = useState(false);
  const handle = async () => { setLoading(true); try { await onConfirm(); } finally { setLoading(false); } };
  return (
    <div className="prof-modal-overlay" onClick={onClose}>
      <div className="prof-modal" dir="rtl" onClick={e => e.stopPropagation()}>
        <div className="prof-delete-icon">🗑️</div>
        <h3 className="prof-modal-title">حذف الحساب نهائياً</h3>
        <p className="prof-modal-desc">سيتم حذف جميع بياناتك، محادثاتك، وصورك بشكل نهائي ولا يمكن التراجع عن هذا الإجراء.</p>
        <div className="prof-modal-btns">
          <button className="prof-modal-cancel" onClick={onClose}>إلغاء</button>
          <button className="prof-modal-delete" onClick={handle} disabled={loading}>
            {loading ? <div className="prof-btn-spinner" /> : "حذف نهائياً"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Date helpers ───────────────────────────── */
function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });
}
function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

/* ══════════════════════════════════════════════
   ProfileScreen
══════════════════════════════════════════════ */
export default function ProfileScreen({ user: initialUser, onUserUpdate, onLogout, onBack, onNavigate }: Props) {
  const [user, setUser] = useState<User>(initialUser);
  const [name, setName] = useState(initialUser.name);
  const [username, setUsername] = useState(initialUser.username);
  const [bio, setBio] = useState(initialUser.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    getProfile().then(u => { setUser(u); setName(u.name); setUsername(u.username); setBio(u.bio ?? ""); }).catch(() => {});
  }, []);

  const showToast = (msg: string, type: ToastType = "success") => setToast({ msg, type });

  const handleSave = async () => {
    if (!name.trim()) { showToast("الاسم لا يمكن أن يكون فارغاً", "error"); return; }
    setSaving(true);
    try {
      const updated = await updateProfile({ name: name.trim(), username: username.trim(), bio: bio.trim() });
      const newUser = { ...user, ...updated };
      setUser(newUser); onUserUpdate(newUser);
      showToast("تم حفظ التعديلات بنجاح ✓");
    } catch (e) { showToast((e as Error).message, "error"); }
    finally { setSaving(false); }
  };

  const handleAvatarUpload = async (base64: string) => {
    try {
      const updated = await updateProfile({ avatarUrl: base64 });
      const newUser = { ...user, ...updated };
      setUser(newUser); onUserUpdate(newUser);
      showToast("تم تحديث الصورة بنجاح ✓");
    } catch (e) { showToast((e as Error).message, "error"); }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await authLogout(); onLogout(); }
    catch { onLogout(); }
  };

  const handleDelete = async () => {
    await deleteAccount();
    onLogout();
  };

  const hasChanges = name.trim() !== user.name || username.trim() !== user.username || bio.trim() !== (user.bio ?? "");

  return (
    <div className="prof-root">
      <div className="prof-bg" />
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      {showPwdModal && <PasswordModal onClose={() => setShowPwdModal(false)} onSave={changePassword} />}
      {showDeleteModal && <DeleteModal onClose={() => setShowDeleteModal(false)} onConfirm={handleDelete} />}

      {/* Header */}
      <header className="prof-header">
        <button className="prof-icon-btn" onClick={onBack} aria-label="back">
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="prof-header-title" dir="rtl">الملف الشخصي</h1>
        <div style={{ width: 40 }} />
      </header>

      <div className="prof-scroll">
        {/* Avatar + Name */}
        <div className="prof-identity" dir="rtl">
          <AvatarUpload avatarUrl={user.avatarUrl} name={user.name} onUpload={handleAvatarUpload} />
          <div className="prof-identity-info">
            <div className="prof-user-name">{user.name}</div>
            <div className="prof-user-handle">@{user.username}</div>
            <div className="prof-user-badges">
              <SubBadge type={user.subscriptionType} />
              {user.bio && <span className="prof-user-bio-tag">لديه نبذة</span>}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="prof-stats-row" dir="rtl">
          {[
            { label: "محادثة", value: user.conversationCount, icon: "💬" },
            { label: "صورة", value: user.imageCount, icon: "🎨" },
            { label: "يوم", value: daysSince(user.createdAt), icon: "📅" },
          ].map(s => (
            <div key={s.label} className="prof-stat-card">
              <span className="prof-stat-icon">{s.icon}</span>
              <span className="prof-stat-value">{s.value}</span>
              <span className="prof-stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Account info */}
        <div className="prof-section" dir="rtl">
          <h2 className="prof-section-title">معلومات الحساب</h2>
          <div className="prof-info-card">
            {[
              { label: "البريد الإلكتروني", value: user.email, icon: "📧" },
              { label: "تاريخ إنشاء الحساب", value: fmtDate(user.createdAt), icon: "🗓️" },
              { label: "آخر تسجيل دخول", value: fmtDate(user.lastLoginAt), icon: "🕐" },
              { label: "نوع الاشتراك", value: user.subscriptionType === "free" ? "مجاني" : user.subscriptionType === "pro" ? "PRO" : "PRO MAX", icon: "⭐" },
            ].map(item => (
              <div key={item.label} className="prof-info-row">
                <span className="prof-info-value">{item.value}</span>
                <div className="prof-info-left">
                  <span className="prof-info-icon">{item.icon}</span>
                  <span className="prof-info-label">{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Edit profile */}
        <div className="prof-section" dir="rtl">
          <h2 className="prof-section-title">تعديل الملف الشخصي</h2>
          <div className="prof-edit-card">
            <div className="prof-field">
              <label className="prof-field-label">الاسم الكامل</label>
              <input className="prof-field-input" value={name} onChange={e => setName(e.target.value)} placeholder="اسمك الكامل" dir="rtl" />
            </div>
            <div className="prof-field">
              <label className="prof-field-label">اسم المستخدم</label>
              <div className="prof-field-prefix-wrap">
                <input className="prof-field-input" value={username} onChange={e => setUsername(e.target.value)} placeholder="username" dir="ltr" style={{ textAlign: "left" }} />
                <span className="prof-field-prefix">@</span>
              </div>
            </div>
            <div className="prof-field">
              <label className="prof-field-label">نبذة شخصية</label>
              <textarea className="prof-field-textarea" value={bio} onChange={e => setBio(e.target.value)} placeholder="أخبر الجميع عن نفسك..." dir="rtl" rows={3} />
            </div>
            <button className={`prof-save-btn ${!hasChanges || saving ? "disabled" : ""}`} onClick={handleSave} disabled={!hasChanges || saving}>
              {saving ? <><div className="prof-btn-spinner" /> جاري الحفظ...</> : "حفظ التعديلات"}
            </button>
          </div>
        </div>

        {/* Settings */}
        <div className="prof-section" dir="rtl">
          <h2 className="prof-section-title">الإعدادات</h2>
          <div className="prof-settings-card">
            <button className="prof-setting-row" onClick={() => setShowPwdModal(true)}>
              <svg viewBox="0 0 24 24" fill="none" width="18" height="18" className="prof-setting-chevron" style={{ transform: "rotate(180deg)" }}><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <div className="prof-setting-text">
                <span className="prof-setting-label">تغيير كلمة المرور</span>
                <span className="prof-setting-sub">آخر تغيير: غير محدد</span>
              </div>
              <div className="prof-setting-icon-wrap">🔑</div>
            </button>
            <div className="prof-setting-divider" />
            <button className="prof-setting-row" onClick={() => showToast("هذه الميزة قادمة قريباً", "info")}>
              <svg viewBox="0 0 24 24" fill="none" width="18" height="18" className="prof-setting-chevron" style={{ transform: "rotate(180deg)" }}><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <div className="prof-setting-text">
                <span className="prof-setting-label">الإشعارات</span>
                <span className="prof-setting-sub">تخصيص الإشعارات</span>
              </div>
              <div className="prof-setting-icon-wrap">🔔</div>
            </button>
            <div className="prof-setting-divider" />
            <button className="prof-setting-row" onClick={() => showToast("هذه الميزة قادمة قريباً", "info")}>
              <svg viewBox="0 0 24 24" fill="none" width="18" height="18" className="prof-setting-chevron" style={{ transform: "rotate(180deg)" }}><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <div className="prof-setting-text">
                <span className="prof-setting-label">الخصوصية والأمان</span>
                <span className="prof-setting-sub">إدارة بياناتك الشخصية</span>
              </div>
              <div className="prof-setting-icon-wrap">🛡️</div>
            </button>
          </div>
        </div>

        {/* Subscription management */}
        <div className="prof-section" dir="rtl">
          <h2 className="prof-section-title">الاشتراك</h2>
          <div className="prof-sub-card">
            <div className="prof-sub-info">
              <SubBadge type={user.subscriptionType} />
              {user.subscriptionType !== "free" && user.subscriptionExpiresAt && (
                <span className="prof-sub-expires">تنتهي: {fmtDate(user.subscriptionExpiresAt)}</span>
              )}
            </div>
            <div className="prof-sub-actions">
              <button className="prof-sub-btn" onClick={() => onNavigate?.("activate")}>🔑 تفعيل كود</button>
              <button className="prof-sub-btn primary" onClick={() => onNavigate?.("plans")}>
                {user.subscriptionType === "free" ? "⬆️ ترقية الخطة" : "📋 الخطط"}
              </button>
            </div>
          </div>
        </div>

        {/* Admin panel (hidden, accessed by tapping header title 5 times) */}
        <div className="prof-section" dir="rtl">
          <h2 className="prof-section-title">الإعدادات المتقدمة</h2>
          <div className="prof-settings-card">
            <button className="prof-setting-row" onClick={() => onNavigate?.("admin")}>
              <svg viewBox="0 0 24 24" fill="none" width="18" height="18" className="prof-setting-chevron" style={{ transform: "rotate(180deg)" }}><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <div className="prof-setting-text">
                <span className="prof-setting-label">لوحة الإدارة</span>
                <span className="prof-setting-sub">إدارة الأكواد والمستخدمين</span>
              </div>
              <div className="prof-setting-icon-wrap">🛡️</div>
            </button>
          </div>
        </div>

        {/* Logout + Delete */}
        <div className="prof-danger-section">
          <button className="prof-logout-btn" onClick={handleLogout} disabled={loggingOut} dir="rtl">
            {loggingOut ? <div className="prof-btn-spinner" /> : (
              <><svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> تسجيل الخروج</>
            )}
          </button>
          <button className="prof-delete-account-btn" onClick={() => setShowDeleteModal(true)} dir="rtl">
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            حذف الحساب نهائياً
          </button>
        </div>

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
