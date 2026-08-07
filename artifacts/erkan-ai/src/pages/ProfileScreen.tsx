import { useState, useEffect, useRef } from "react";
import {
  getProfile, updateProfile, changePassword, deleteAccount,
  authLogout, getSubscriptionStatus,
  type User, type SubscriptionStatus,
} from "../lib/api";
import { useLang } from "../lib/i18n";
import { AlertTriangle, Check, Copy, Edit2, Globe, Info, Key, LogOut, Trash2, User as UserIcon, MessageCircle, Image as ImageIcon, Calendar, Crown, Gem, Zap, Mail, RefreshCw } from "lucide-react";

interface Props {
  user: User;
  onUserUpdate: (u: User) => void;
  onLogout: () => void;
  onBack: () => void;
  onNavigate?: (screen: string, data?: unknown) => void;
}

function daysSince(iso: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

function planLabel(p: string, t: any) {
  return p === "pro_max" ? t("promaxPlan") : p === "pro" ? t("proPlan") : t("freePlan");
}
function planColor(p: string) {
  return p === "pro_max" ? "#a855f7" : p === "pro" ? "#1e88ff" : "#64748b";
}
function planGlow(p: string) {
  return p === "pro_max" ? "0 0 24px rgba(168,85,247,0.4)" : p === "pro" ? "0 0 24px rgba(30,136,255,0.4)" : "none";
}
function planEmoji(p: string) {
  return p === "pro_max" ? <Gem size={14} className="inline mr-1" /> : p === "pro" ? <Crown size={14} className="inline mr-1" /> : <Zap size={14} className="inline mr-1" />;
}
function planEmojiLarge(p: string) {
  return p === "pro_max" ? <Gem size={24} /> : p === "pro" ? <Crown size={24} /> : <Zap size={24} />;
}

function UserIdCard({ uid, onCopied, t, isRtl }: { uid: string; onCopied: () => void; t: any; isRtl: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(uid); } catch { /* fallback */ }
    setCopied(true);
    onCopied();
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="prf2-uid-card" dir={isRtl ? "rtl" : "ltr"}>
      <div className="prf2-uid-label">{t("userIdLabel")}</div>
      <div className="prf2-uid-row">
        <span className="prf2-uid-value">{uid}</span>
        <button className="prf2-uid-copy-btn" onClick={copy} title={t("copy")}>
          {copied ? <Check size={16} color="#22c55e" /> : <Copy size={16} />}
        </button>
      </div>
      <div className="prf2-uid-note">{t("idNote")}</div>
    </div>
  );
}

type ToastType = "success" | "error" | "info";
function Toast({ msg, type, onDone, isRtl }: { msg: string; type: ToastType; onDone: () => void; isRtl: boolean }) {
  useEffect(() => { const timer = setTimeout(onDone, 3200); return () => clearTimeout(timer); }, []);
  const colors: Record<ToastType, string> = {
    success: "rgba(22,163,74,0.95)",
    error: "rgba(185,28,28,0.95)",
    info: "rgba(30,58,138,0.95)",
  };
  return (
    <div className="prf2-toast" style={{ background: colors[type] }} dir={isRtl ? "rtl" : "ltr"}>
      {msg}
    </div>
  );
}

function Spin({ size = 16 }: { size?: number }) {
  return <span className="prf2-spin" style={{ width: size, height: size }} />;
}

function AvatarUpload({ avatarUrl, name, plan, onUpload }: { avatarUrl: string | null; name: string; plan: string; onUpload: (b64: string) => void; }) {
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
        const ratio = Math.max(S / img.width, S / img.height);
        const w = img.width * ratio; const h = img.height * ratio;
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
    <div className="prf2-avatar-wrap" style={{ boxShadow: planGlow(plan) }} onClick={() => inputRef.current?.click()}>
      {preview ? <img src={preview} alt={name} className="prf2-avatar-img" /> : <div className="prf2-avatar-letters">{initials}</div>}
      <div className={`prf2-avatar-overlay ${busy ? "busy" : ""}`}>
        {busy ? <Spin size={22} /> : (
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
            <circle cx="12" cy="13" r="4" stroke="white" strokeWidth="1.8" />
          </svg>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={pick} />
    </div>
  );
}

function PwdModal({ onClose, onSave, t, isRtl }: { onClose: () => void; onSave: (c: string, n: string) => Promise<void>; t: any; isRtl: boolean }) {
  const [curr, setCurr] = useState(""); const [next, setNext] = useState(""); const [conf, setConf] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");

  const save = async () => {
    if (!curr || !next || !conf) { setErr(t("errAll")); return; }
    if (next.length < 6) { setErr(t("errShort")); return; }
    if (next !== conf) { setErr(t("errMismatch")); return; }
    setBusy(true); setErr("");
    try { await onSave(curr, next); onClose(); }
    catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <div className="prf2-modal-bg" onClick={onClose}>
      <div className="prf2-modal" dir={isRtl ? "rtl" : "ltr"} onClick={e => e.stopPropagation()}>
        <div className="prf2-modal-handle" />
        <h3 className="prf2-modal-title"><Key size={20} className="inline mr-2" /> {t("changePass")}</h3>
        {err && <div className="prf2-modal-err">{err}</div>}
        {[
          { label: t("currPass"), val: curr, set: setCurr },
          { label: t("newPass"), val: next, set: setNext },
          { label: t("confPass"), val: conf, set: setConf },
        ].map(f => (
          <div key={f.label} className="prf2-modal-field">
            <label className="prf2-modal-label">{f.label}</label>
            <input type="password" className="prf2-modal-input" value={f.val} onChange={e => f.set(e.target.value)} placeholder="••••••" />
          </div>
        ))}
        <div className="prf2-modal-row">
          <button className="prf2-modal-cancel" onClick={onClose}>{t("cancel")}</button>
          <button className="prf2-modal-confirm" onClick={save} disabled={busy}>{busy ? <Spin /> : t("save")}</button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ onClose, onConfirm, t, isRtl }: { onClose: () => void; onConfirm: () => Promise<void>; t: any; isRtl: boolean }) {
  const [busy, setBusy] = useState(false);
  const go = async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); } };
  return (
    <div className="prf2-modal-bg" onClick={onClose}>
      <div className="prf2-modal" dir={isRtl ? "rtl" : "ltr"} onClick={e => e.stopPropagation()}>
        <div className="prf2-modal-handle" />
        <div className="text-4xl text-center mb-2 text-red-500"><AlertTriangle className="inline-block" size={48} /></div>
        <h3 className="prf2-modal-title">{t("delAccTitle")}</h3>
        <p className="prf2-modal-desc">{t("delAccDesc")}</p>
        <div className="prf2-modal-row">
          <button className="prf2-modal-cancel" onClick={onClose}>{t("cancel")}</button>
          <button className="prf2-modal-delete-btn" onClick={go} disabled={busy}>{busy ? <Spin /> : t("delConfirm")}</button>
        </div>
      </div>
    </div>
  );
}

function EditModal({ user, onClose, onSaved, t, isRtl }: { user: User; onClose: () => void; onSaved: (u: User) => void; t: any; isRtl: boolean }) {
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio ?? "");
  const [gender, setGender] = useState(user.gender ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const save = async () => {
    if (!name.trim()) { setErr(t("errAll")); return; }
    setBusy(true); setErr("");
    try {
      const updated = await updateProfile({ name: name.trim(), username: username.trim(), bio: bio.trim(), gender });
      onSaved({ ...user, ...updated });
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <div className="prf2-modal-bg" onClick={onClose}>
      <div className="prf2-modal" dir={isRtl ? "rtl" : "ltr"} onClick={e => e.stopPropagation()}>
        <div className="prf2-modal-handle" />
        <h3 className="prf2-modal-title"><Edit2 size={20} className="inline mr-2" /> {t("editProfile")}</h3>
        {err && <div className="prf2-modal-err">{err}</div>}
        <div className="prf2-modal-field">
          <label className="prf2-modal-label">{t("fullName")}</label>
          <input className="prf2-modal-input" value={name} onChange={e => setName(e.target.value)} placeholder={t("fullName")} />
        </div>
        <div className="prf2-modal-field">
          <label className="prf2-modal-label">{t("usernameLabel")}</label>
          <div style={{ position: "relative" }}>
            <input className="prf2-modal-input" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="username" dir="ltr" style={{ textAlign: "left", paddingLeft: 32 }} />
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(30,136,255,0.6)", fontSize: "0.9rem" }}>@</span>
          </div>
        </div>
        <div className="prf2-modal-field">
          <label className="prf2-modal-label">{t("bioLabel")}</label>
          <textarea className="prf2-modal-input" value={bio} onChange={e => setBio(e.target.value)} placeholder={t("bioPH")} rows={3} style={{ resize: "none" }} />
        </div>
        <div className="prf2-modal-field">
          <label className="prf2-modal-label">{t("gender")}</label>
          <div className="prf2-gender-row">
            <button type="button" className={`prf2-gender-btn ${gender === "male" ? "prf2-gender-active-m" : ""}`} onClick={() => setGender(gender === "male" ? "" : "male")}>
              <UserIcon size={16} /> {t("male")}
            </button>
            <button type="button" className={`prf2-gender-btn ${gender === "female" ? "prf2-gender-active-f" : ""}`} onClick={() => setGender(gender === "female" ? "" : "female")}>
              <UserIcon size={16} /> {t("female")}
            </button>
          </div>
        </div>
        <div className="prf2-modal-field mt-2">
          <p className="text-xs text-indigo-300 opacity-70 text-center"><Globe size={12} className="inline" /> {t("countryHint")}</p>
        </div>
        <div className="prf2-modal-row mt-2">
          <button className="prf2-modal-cancel" onClick={onClose}>{t("cancel")}</button>
          <button className="prf2-modal-confirm" onClick={save} disabled={busy}>{busy ? <Spin /> : t("save")}</button>
        </div>
      </div>
    </div>
  );
}

export default function ProfileScreen({ user: initUser, onUserUpdate, onLogout, onBack, onNavigate }: Props) {
  const { t, locale, formatDate } = useLang();
  const [user, setUser] = useState<User>(initUser);
  const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);
  const [modal, setModal] = useState<"pwd" | "delete" | "edit" | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const isRtl = locale !== "turkish";

  useEffect(() => {
    getProfile().then(u => { setUser(u); onUserUpdate(u); }).catch(() => {});
    getSubscriptionStatus().then(setSubStatus).catch(() => {});
  }, []);

  const toast$ = (msg: string, type: ToastType = "success") => setToast({ msg, type });

  const handleAvatarUpload = async (b64: string) => {
    try {
      const u = await updateProfile({ avatarUrl: b64 });
      const merged = { ...user, ...u };
      setUser(merged); onUserUpdate(merged);
      toast$(t("toastImg"));
    } catch (e) { toast$((e as Error).message, "error"); }
  };

  const handleSaved = (u: User) => {
    setUser(u); onUserUpdate(u);
    toast$(t("toastSave"));
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
      <div className="prf2-bg" />
      <div className="prf2-bg-radial" />

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} isRtl={isRtl} />}
      {modal === "pwd" && <PwdModal onClose={() => setModal(null)} onSave={async (c, n) => { await changePassword(c, n); toast$(t("toastPass")); }} t={t} isRtl={isRtl} />}
      {modal === "delete" && <DeleteModal onClose={() => setModal(null)} onConfirm={handleDelete} t={t} isRtl={isRtl} />}
      {modal === "edit" && <EditModal user={user} onClose={() => setModal(null)} onSaved={handleSaved} t={t} isRtl={isRtl} />}

      <header className="prf2-header" dir={isRtl ? "rtl" : "ltr"}>
        <button className="prf2-back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="prf2-header-title">{t("profileTitle")}</span>
        <button className="prf2-edit-top-btn" onClick={() => setModal("edit")} title={t("editProfile")}>
          <Edit2 size={18} />
        </button>
      </header>

      <div className="prf2-scroll">
        <div className="prf2-hero">
          <div className="prf2-hero-cover" style={{ background: plan === "pro_max" ? "linear-gradient(135deg,#1a0533,#2d0b5a,#12063a)" : plan === "pro" ? "linear-gradient(135deg,#020d2a,#072258,#04091e)" : "linear-gradient(135deg,#0a0f22,#111827,#070b18)" }} />
          <div className="prf2-hero-body" dir={isRtl ? "rtl" : "ltr"}>
            <AvatarUpload avatarUrl={user.avatarUrl} name={user.name} plan={plan} onUpload={handleAvatarUpload} />
            <div className="prf2-hero-info">
              <div className="prf2-hero-name">{user.name}</div>
              <div className="prf2-hero-handle" dir="ltr">@{user.username}</div>
              {user.bio && <div className="prf2-hero-bio">{user.bio}</div>}
              <div className="prf2-plan-badge" style={{ background: `${planColor(plan)}22`, border: `1px solid ${planColor(plan)}55`, color: planColor(plan), boxShadow: planGlow(plan) }}>
                {planEmoji(plan)} {planLabel(plan, t)}
              </div>
            </div>
          </div>
        </div>

        <div className="prf2-stats" dir={isRtl ? "rtl" : "ltr"}>
          {[
            { icon: <MessageCircle size={20} />, val: user.conversationCount, label: t("convsStat") },
            { icon: <ImageIcon size={20} />, val: user.imageCount, label: t("imgsStat") },
            { icon: <Calendar size={20} />, val: daysSince(user.createdAt), label: t("daysStat") },
          ].map(s => (
            <div key={s.label} className="prf2-stat">
              <span className="prf2-stat-icon">{s.icon}</span>
              <span className="prf2-stat-val">{s.val}</span>
              <span className="prf2-stat-lbl">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="prf2-section" dir={isRtl ? "rtl" : "ltr"}>
          <div className="prf2-section-title">{t("subTitle")}</div>
          <div className="prf2-sub-card" style={{ borderColor: `${planColor(plan)}40` }}>
            <div className="prf2-sub-top">
              <div>
                <div className="prf2-sub-plan-name" style={{ color: planColor(plan) }}>
                  {planLabel(plan, t)}
                </div>
                {plan !== "free" && user.subscriptionExpiresAt && (
                  <div className="prf2-sub-exp">{t("expiresOn", { date: formatDate(user.subscriptionExpiresAt) })}</div>
                )}
                {plan === "free" && (
                  <div className="prf2-sub-exp">{t("upgradeHint")}</div>
                )}
              </div>
              <div className="prf2-sub-icon" style={{ background: `${planColor(plan)}18`, color: planColor(plan) }}>
                {planEmojiLarge(plan)}
              </div>
            </div>

            {subStatus && (
              <div className="prf2-usage">
                <div className="prf2-usage-row">
                  <span className="prf2-usage-label">{t("dailyUsage")}</span>
                  <span className="prf2-usage-nums">
                    <span style={{ color: "#fff" }}>{subStatus.dailyUsed}</span>
                    <span style={{ color: "rgba(150,170,220,0.5)" }}>/{subStatus.dailyLimit}</span>
                  </span>
                </div>
                <div className="prf2-usage-track">
                  <div className="prf2-usage-fill" style={{ width: `${pct}%`, background: pct > 90 ? "linear-gradient(90deg,#ef4444,#dc2626)" : pct > 70 ? "linear-gradient(90deg,#f59e0b,#d97706)" : `linear-gradient(90deg,${planColor(plan)},${planColor(plan)}99)` }} />
                </div>
                <div className="prf2-usage-remain">
                  {remaining > 0 ? t("msgsLeft", { n: remaining }) : t("limitReached")}
                </div>
              </div>
            )}

            <div className="prf2-sub-actions">
              <button className="prf2-sub-btn outline" onClick={() => onNavigate?.("activate")}>
                <Key size={16} /> {t("activateCode")}
              </button>
              <button className="prf2-sub-btn primary" style={{ background: `linear-gradient(135deg,${planColor(plan === "free" ? "pro" : plan)},${planColor(plan === "free" ? "pro_max" : plan)}99)` }} onClick={() => onNavigate?.("plans")}>
                {plan === "free" ? t("upgradePlan") : t("viewPlans")}
              </button>
            </div>
          </div>
        </div>

        {user.userId && (
          <div className="prf2-section" dir={isRtl ? "rtl" : "ltr"}>
            <div className="prf2-section-title">{t("userIdTitle")}</div>
            <UserIdCard uid={user.userId} onCopied={() => toast$(t("toastCopy"))} t={t} isRtl={isRtl} />
          </div>
        )}

        <div className="prf2-section" dir={isRtl ? "rtl" : "ltr"}>
          <div className="prf2-section-title">{t("accInfo")}</div>
          <div className="prf2-info-card">
            {[
              { icon: <Mail size={16} />, label: t("emailLabel"), val: user.email },
              { icon: <Calendar size={16} />, label: t("createdAt"), val: formatDate(user.createdAt) },
              { icon: <RefreshCw size={16} />, label: t("lastLogin"), val: formatDate(user.lastLoginAt) },
              { icon: <MessageCircle size={16} />, label: t("convCount"), val: String(user.conversationCount) },
            ].map((row, i, arr) => (
              <div key={row.label} className="prf2-info-row" style={i < arr.length - 1 ? { borderBottom: "1px solid rgba(255,255,255,0.05)" } : {}}>
                <span className="prf2-info-val" dir="ltr">{row.val}</span>
                <div className="prf2-info-left">
                  <span className="prf2-info-icon">{row.icon}</span>
                  <span className="prf2-info-label">{row.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="prf2-section" dir={isRtl ? "rtl" : "ltr"}>
          <div className="prf2-section-title">{t("settingsTitle")}</div>
          <div className="prf2-menu-card">
            {[
              { icon: <Edit2 size={16} />, label: t("editProfile"), sub: `${user.name} · @${user.username}`, onClick: () => setModal("edit") },
              { icon: <Key size={16} />, label: t("changePass"), sub: "••••••••", onClick: () => setModal("pwd") },
              { icon: <Globe size={16} />, label: t("langMenuLabel"), sub: t("langMenuSub"), onClick: () => onNavigate?.("language") },
              { icon: <Info size={16} />, label: t("devInfo"), sub: "ERKAN AI · TRSY", onClick: () => onNavigate?.("devinfo") },
            ].map((item, i, arr) => (
              <div key={item.label}>
                <button className="prf2-menu-row" onClick={item.onClick}>
                  <svg className="prf2-menu-chevron" viewBox="0 0 24 24" fill="none" width="16" height="16" style={{ transform: isRtl ? "none" : "rotate(180deg)" }}>
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

        <button className="prf2-follow-btn" onClick={() => window.open("https://www.instagram.com/erkanleriscom?igsh=MWw0MWIyc3loN25paQ==", "_blank")} dir={isRtl ? "rtl" : "ltr"}>
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" strokeWidth="0" /></svg>
          <span>{t("followUs")}</span>
          <span className="prf2-follow-handle" dir="ltr">@erkanleriscom</span>
        </button>

        <div className="prf2-danger" dir={isRtl ? "rtl" : "ltr"}>
          <button className="prf2-logout-btn" onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? <Spin /> : <><LogOut size={18} className={isRtl ? "rotate-180" : ""} /> {t("logout")}</>}
          </button>
          <button className="prf2-delete-btn" onClick={() => setModal("delete")}>
            <Trash2 size={18} /> {t("deleteAcc")}
          </button>
        </div>

        <div className="prf2-footer" dir={isRtl ? "rtl" : "ltr"}>
          <span className="prf2-footer-logo">ERKAN AI</span>
          <span className="prf2-footer-ver">v2.0.0</span>
        </div>
        <div style={{ height: 50 }} />
      </div>
    </div>
  );
}
