import { useState, useRef, useEffect } from "react";
import { activateCode, type User } from "../lib/api";

interface Props {
  user: User | null;
  onBack: () => void;
  onActivated: (user: User) => void;
}

const WHATSAPP_NUM = "905382262557";
const WHATSAPP_MSG = encodeURIComponent("مرحباً، أرغب في شراء كود تفعيل برو ماكس لتطبيق ERKAN AI.");

export default function ActivateScreen({ user, onBack, onActivated }: Props) {
  const [code, setCode] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => { setTimeout(() => inputRefs[0].current?.focus(), 300); }, []);

  const handleInput = (idx: number, val: string) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
    const newCode = [...code];
    newCode[idx] = clean;
    setCode(newCode);
    setError("");
    if (clean.length === 4 && idx < 3) inputRefs[idx + 1]?.current?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) inputRefs[idx - 1]?.current?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
    const parts = [pasted.slice(0, 4), pasted.slice(4, 8), pasted.slice(8, 12), pasted.slice(12, 16)];
    setCode(parts);
    setError("");
    const lastFilled = parts.findLastIndex((p) => p.length > 0);
    inputRefs[Math.min(lastFilled + 1, 3)]?.current?.focus();
  };

  const handleActivate = async () => {
    const fullCode = code.join("");
    if (fullCode.length < 16) {
      setError("يجب أن يتكون كود التفعيل من 16 حرفاً ورقماً");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await activateCode(fullCode);
      setSuccess(true);
      if (user) {
        onActivated({ ...user, subscriptionType: result.plan, subscriptionExpiresAt: result.expiresAt });
      }
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes("not found") || msg.includes("غير موجود") || msg.includes("Invalid") || msg.includes("غير صحيح")) {
        setError("كود التفعيل غير صحيح");
      } else if (msg.includes("used") || msg.includes("مستخدم")) {
        setError("تم استخدام هذا الكود مسبقاً");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = () => {
    window.open(`https://wa.me/${WHATSAPP_NUM}?text=${WHATSAPP_MSG}`, "_blank");
  };

  const fullCode = code.join("");
  const isReady = fullCode.length === 16;

  /* ── Success screen ── */
  if (success) {
    return (
      <div className="act2-root">
        <div className="act2-bg" />
        <div className="act2-success-wrap">
          <div className="act2-success-ring">
            <span className="act2-success-emoji">🎉</span>
          </div>
          <h2 className="act2-success-title" dir="rtl">تم التفعيل بنجاح!</h2>
          <p className="act2-success-desc" dir="rtl">
            تم تفعيل اشتراك برو ماكس بنجاح.<br />جميع الصفحات والأدوات متاحة الآن.
          </p>
          <button className="act2-done-btn" onClick={onBack}>
            💎 الذهاب للرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="act2-root">
      <div className="act2-bg" />
      <div className="act2-bg-glow" />

      {/* Header */}
      <header className="act2-header">
        <button className="act2-back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="act2-header-title" dir="rtl">تفعيل برو ماكس</span>
        <div style={{ width: 40 }} />
      </header>

      <div className="act2-body">

        {/* Hero */}
        <div className="act2-hero" dir="rtl">
          <div className="act2-hero-badge">💎 PRO MAX</div>
          <h2 className="act2-hero-title">افتح قوة الذكاء الاصطناعي الكاملة</h2>
          <p className="act2-hero-desc">
            أدخل كود التفعيل المكوّن من <strong>16 حرفاً ورقماً</strong> للحصول على جميع الميزات
          </p>
        </div>

        {/* Code input */}
        <div className="act2-code-section" onPaste={handlePaste}>
          <div className="act2-code-label" dir="rtl">كود التفعيل</div>
          <div className="act2-code-boxes">
            {code.map((part, i) => (
              <input
                key={i}
                ref={inputRefs[i]}
                className={`act2-code-box ${part.length === 4 ? "filled" : ""}`}
                value={part}
                onChange={(e) => handleInput(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                maxLength={4}
                placeholder="XXXX"
                autoCapitalize="characters"
                spellCheck={false}
                dir="ltr"
              />
            ))}
          </div>
          <div className="act2-code-hint" dir="rtl">مثال: ABCD · EF12 · GH34 · IJ56</div>
        </div>

        {/* Error */}
        {error && (
          <div className="act2-error" dir="rtl">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Activate button */}
        <button
          className={`act2-activate-btn ${isReady && !loading ? "ready" : ""}`}
          onClick={handleActivate}
          disabled={!isReady || loading}
        >
          {loading ? <span className="act2-spinner" /> : "🚀 تفعيل الاشتراك"}
        </button>

        {/* Divider */}
        <div className="act2-divider" dir="rtl">
          <span>أو</span>
        </div>

        {/* Buy via WhatsApp */}
        <button className="act2-whatsapp-btn" onClick={openWhatsApp}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          شراء كود برو ماكس عبر واتساب
        </button>

        {/* Features list */}
        <div className="act2-features" dir="rtl">
          <div className="act2-features-title">ما ستحصل عليه مع برو ماكس:</div>
          {[
            "💬 محادثات غير محدودة",
            "🎨 توليد الصور بالذكاء الاصطناعي",
            "✍️ أدوات الكتابة والتلخيص",
            "💡 أفكار وإلهام إبداعي",
            "🔓 فتح جميع الأدوات",
          ].map(f => (
            <div key={f} className="act2-feature-item">{f}</div>
          ))}
        </div>

      </div>
    </div>
  );
}
