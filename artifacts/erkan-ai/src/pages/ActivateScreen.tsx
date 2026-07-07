import { useState, useRef, useEffect } from "react";
import { activateCode, type User } from "../lib/api";

interface Props {
  user: User | null;
  onBack: () => void;
  onActivated: (user: User) => void;
}

export default function ActivateScreen({ user, onBack, onActivated }: Props) {
  const [code, setCode] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ planName: string; expiresAt: string } | null>(null);
  const [error, setError] = useState("");
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => { inputRefs[0].current?.focus(); }, []);

  const handleInput = (idx: number, val: string) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
    const newCode = [...code];
    newCode[idx] = clean;
    setCode(newCode);
    setError("");
    if (clean.length === 4 && idx < 3) {
      inputRefs[idx + 1]?.current?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      inputRefs[idx - 1]?.current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
    const parts = [pasted.slice(0, 4), pasted.slice(4, 8), pasted.slice(8, 12), pasted.slice(12, 16)];
    setCode(parts);
    setError("");
    const lastFilled = parts.findLastIndex((p) => p.length > 0);
    const focusIdx = Math.min(lastFilled + 1, 3);
    inputRefs[focusIdx]?.current?.focus();
  };

  const handleActivate = async () => {
    const fullCode = code.join("");
    if (fullCode.length < 16) { setError("أدخل الكود كاملاً (16 حرف/رقم)"); return; }
    setLoading(true);
    setError("");
    try {
      const result = await activateCode(fullCode);
      setSuccess({ planName: result.planName, expiresAt: result.expiresAt });
      if (user) {
        onActivated({ ...user, subscriptionType: result.plan, subscriptionExpiresAt: result.expiresAt });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fullCode = code.join("");
  const isReady = fullCode.length === 16;

  if (success) {
    return (
      <div className="activate-root">
        <div className="activate-bg" />
        <div className="activate-success-wrap">
          <div className="activate-success-icon">🎉</div>
          <h2 className="activate-success-title" dir="rtl">تم التفعيل بنجاح!</h2>
          <p className="activate-success-plan" dir="rtl">
            خطة <strong>{success.planName}</strong> مفعّلة
          </p>
          <p className="activate-success-expires" dir="rtl">
            تنتهي في: {new Date(success.expiresAt).toLocaleDateString("ar-SA", {
              year: "numeric", month: "long", day: "numeric",
            })}
          </p>
          <button className="activate-done-btn" onClick={onBack}>
            الرجوع للرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="activate-root">
      <div className="activate-bg" />
      <div className="activate-bg-radial" />

      <header className="activate-header">
        <button className="activate-back-btn" onClick={onBack} aria-label="back">
          <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="activate-title">تفعيل الاشتراك</h1>
        <div style={{ width: 40 }} />
      </header>

      <div className="activate-body">
        <div className="activate-key-icon">🔑</div>
        <h2 className="activate-heading" dir="rtl">أدخل كود التفعيل</h2>
        <p className="activate-desc" dir="rtl">
          أدخل الكود المكوّن من 16 حرف/رقم الذي حصلت عليه من الإدارة
        </p>

        <div className="activate-code-inputs" onPaste={handlePaste}>
          {code.map((part, i) => (
            <input
              key={i}
              ref={inputRefs[i]}
              className={`activate-code-box ${part.length === 4 ? "filled" : ""}`}
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

        {error && (
          <div className="activate-error" dir="rtl">
            <span>⚠️</span> {error}
          </div>
        )}

        <p className="activate-format-hint" dir="rtl">
          مثال: ABCD-EF12-GH34-IJ56
        </p>

        <button
          className={`activate-submit-btn ${isReady ? "ready" : ""}`}
          onClick={handleActivate}
          disabled={!isReady || loading}
        >
          {loading ? (
            <span className="activate-spinner" />
          ) : (
            <>🚀 تفعيل الاشتراك</>
          )}
        </button>

        <button className="activate-plans-link" onClick={onBack}>
          عرض الخطط والأسعار
        </button>
      </div>
    </div>
  );
}
