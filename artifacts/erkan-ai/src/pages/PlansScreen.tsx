import { useState } from "react";
import { type User } from "../lib/api";

interface Props {
  user: User | null;
  onNavigate: (screen: string, data?: unknown) => void;
  onBack: () => void;
}

const PLANS = [
  {
    id: "free",
    icon: "🎁",
    name: "الخطة المجانية",
    sub: "ابدأ مجاناً",
    price: "0",
    color: "#ffffff",
    border: "rgba(255,255,255,0.25)",
    glow: "rgba(255,255,255,0.08)",
    btnClass: "plan-btn-free",
    btnLabel: "ابدأ مجاناً",
    features: [
      "30 رسالة يومياً",
      "دردشة بالذكاء الاصطناعي",
      "تصميم الصور الأساسية",
      "الوصول إلى أدوات محدودة",
      "دعم فني محدود",
    ],
  },
  {
    id: "pro",
    icon: "👑",
    name: "باقة برو",
    sub: "ذكاء يساعدك على الإبداع",
    price: "9.99",
    color: "#1f8bff",
    border: "rgba(31,139,255,0.7)",
    glow: "rgba(31,139,255,0.15)",
    btnClass: "plan-btn-pro",
    btnLabel: "اشترك الآن",
    badge: null,
    features: [
      "120 رسالة يومياً",
      "أحدث نموذج للدردشة",
      "سرعة أعلى في الاستجابة",
      "أولوية في أوقات الذروة",
      "تصميم الصور بجودة عالية",
      "تحليل الملفات والمستندات",
      "دعم فني متقدم",
    ],
  },
  {
    id: "pro_max",
    icon: "💎",
    name: "باقة برو ماكس",
    sub: "للمحترفين وأصحاب المشاريع",
    price: "19.99",
    color: "#a855f7",
    border: "rgba(168,85,247,0.8)",
    glow: "rgba(168,85,247,0.18)",
    btnClass: "plan-btn-promax",
    btnLabel: "اشترك الآن",
    badge: "الأقوى على الإطلاق",
    features: [
      "كل مميزات باقة برو",
      "تصميم الصور بالذكاء الاصطناعي",
      "تحليل الصور والملفات",
      "إنشاء مواقع ويب احترافية",
      "إنشاء تطبيقات (Android و iOS)",
      "كتابة الأكواد وتنفيذها",
      "قواعد البيانات وإدارتها",
      "ربط APIs والخدمات الخارجية",
      "حفظ وإدارة المشاريع",
      "أولوية قصوى في المعالجة",
      "الوصول لجميع الميزات الجديدة فور إطلاقها",
      "دعم فني متقدم وأولوية في الدعم",
    ],
  },
];

export default function PlansScreen({ user, onNavigate, onBack }: Props) {
  const currentPlan = user?.subscriptionType ?? "free";
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handlePlanBtn = (planId: string) => {
    if (planId === "free") { onBack(); return; }
    setSelectedPlan(planId);
    onNavigate("activate", { plan: planId });
  };

  return (
    <div className="plans-root">
      <div className="plans-bg" />
      <div className="plans-bg-radial" />

      <header className="plans-header">
        <button className="plans-back-btn" onClick={onBack} aria-label="back">
          <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="plans-title" dir="rtl">الخطط والأسعار</h1>
        <div style={{ width: 40 }} />
      </header>

      <p className="plans-subtitle" dir="rtl">اختر الخطة المناسبة لك وفعّلها بكود التفعيل</p>

      {user?.subscriptionType !== "free" && user?.subscriptionExpiresAt && (
        <div className="plans-current-badge" dir="rtl">
          <span>خطتك الحالية: {currentPlan === "pro" ? "PRO" : "PRO MAX"}</span>
          <span className="plans-expires">تنتهي: {new Date(user.subscriptionExpiresAt).toLocaleDateString("ar-SA")}</span>
        </div>
      )}

      <div className="plans-scroll">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          return (
            <div
              key={plan.id}
              className={`plan-card ${isCurrent ? "plan-card-current" : ""}`}
              style={{
                "--plan-color": plan.color,
                "--plan-border": plan.border,
                "--plan-glow": plan.glow,
              } as React.CSSProperties}
            >
              {plan.badge && (
                <div className="plan-badge">
                  <span>⭐</span> {plan.badge}
                </div>
              )}
              {isCurrent && <div className="plan-current-tag">خطتك الحالية ✓</div>}

              <div className="plan-icon-wrap">
                <div className="plan-icon-hex">
                  <span className="plan-icon-emoji">{plan.icon}</span>
                </div>
              </div>

              <h2 className="plan-name" dir="rtl" style={{ color: plan.color }}>{plan.name}</h2>
              <p className="plan-sub-text" dir="rtl">{plan.sub}</p>

              <div className="plan-price-row" dir="rtl">
                <span className="plan-currency">$</span>
                <span className="plan-price">{plan.price}</span>
                <span className="plan-period">/ شهر</span>
              </div>

              <div className="plan-divider" />

              <p className="plan-features-title" dir="rtl">المميزات</p>
              <ul className="plan-features-list">
                {plan.features.map((f) => (
                  <li key={f} className="plan-feature-item" dir="rtl">
                    <span className="plan-check" style={{ color: plan.color }}>✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`plan-action-btn ${plan.btnClass} ${isCurrent ? "plan-btn-current" : ""}`}
                onClick={() => handlePlanBtn(plan.id)}
                disabled={isCurrent && plan.id === "free"}
              >
                {isCurrent ? "الخطة الحالية" : plan.btnLabel}
              </button>
            </div>
          );
        })}

        <div className="plans-activate-hint" dir="rtl">
          <div className="plans-hint-icon">🔑</div>
          <p>لديك كود تفعيل؟</p>
          <button className="plans-activate-btn" onClick={() => onNavigate("activate", {})}>
            أدخل كود التفعيل
          </button>
        </div>

        <div style={{ height: 32 }} />
      </div>
    </div>
  );
}
