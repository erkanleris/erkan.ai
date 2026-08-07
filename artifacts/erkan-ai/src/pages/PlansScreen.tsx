import { useState } from "react";
import { type User } from "../lib/api";
import { useLang } from "../lib/i18n";
import { Crown, Gem, Gift, Key, Star } from "lucide-react";

interface Props {
  user: User | null;
  onNavigate: (screen: string, data?: unknown) => void;
  onBack: () => void;
}

export default function PlansScreen({ user, onNavigate, onBack }: Props) {
  const { t, locale, formatDate } = useLang();
  const currentPlan = user?.subscriptionType ?? "free";
  
  const isRtl = locale !== "turkish";

  const PLANS = [
    {
      id: "free",
      icon: <Gift size={28} />,
      name: t("freePlan"),
      sub: t("startFree"),
      price: t("priceFree"),
      color: "#ffffff",
      border: "rgba(255,255,255,0.25)",
      glow: "rgba(255,255,255,0.08)",
      btnClass: "plan-btn-free",
      btnLabel: t("startFree"),
      features: [
        t("planFreeFeat1"),
        t("planFreeFeat2"),
        t("planFreeFeat3"),
        t("planFreeFeat4"),
      ],
    },
    {
      id: "pro",
      icon: <Crown size={28} />,
      name: t("proPlan"),
      sub: t("planProSub"),
      price: t("pricePro"),
      color: "#1f8bff",
      border: "rgba(31,139,255,0.7)",
      glow: "rgba(31,139,255,0.15)",
      btnClass: "plan-btn-pro",
      btnLabel: t("subNow"),
      badge: null,
      features: [
        t("planProFeat1"),
        t("planProFeat2"),
        t("planProFeat3"),
        t("planProFeat4"),
        t("planProFeat5"),
        t("planProFeat6"),
      ],
    },
    {
      id: "pro_max",
      icon: <Gem size={28} />,
      name: t("promaxPlan"),
      sub: t("planProMaxSub"),
      price: t("priceProMax"),
      color: "#a855f7",
      border: "rgba(168,85,247,0.8)",
      glow: "rgba(168,85,247,0.18)",
      btnClass: "plan-btn-promax",
      btnLabel: t("subNow"),
      badge: t("planProMaxBadge"),
      features: [
        t("planProMaxFeat1"),
        t("planProMaxFeat2"),
        t("planProMaxFeat3"),
        t("planProMaxFeat4"),
        t("planProMaxFeat5"),
        t("planProMaxFeat6"),
        t("planProMaxFeat7"),
        t("planProMaxFeat8"),
        t("planProMaxFeat9"),
        t("planProMaxFeat10"),
        t("planProMaxFeat11"),
        t("planProMaxFeat12"),
      ],
    },
  ];

  const handlePlanBtn = (planId: string) => {
    if (planId === "free") { onBack(); return; }
    onNavigate("activate", { plan: planId });
  };

  return (
    <div className="plans-root" dir={isRtl ? "rtl" : "ltr"}>
      <div className="plans-bg" />
      <div className="plans-bg-radial" />

      <header className="plans-header" dir={isRtl ? "rtl" : "ltr"}>
        <button className="plans-back-btn" onClick={onBack} aria-label="back">
          <svg viewBox="0 0 24 24" fill="none" width="22" height="22" style={{ transform: isRtl ? "none" : "rotate(180deg)" }}>
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="plans-title">{t("plansTitle")}</h1>
        <div style={{ width: 40 }} />
      </header>

      <p className="plans-subtitle">{t("plansSub")}</p>

      {user?.subscriptionType !== "free" && user?.subscriptionExpiresAt && (
        <div className="plans-current-badge">
          <span>{t("currPlanBadge", { plan: currentPlan === "pro" ? "PRO" : "PRO MAX" })}</span>
          <span className="plans-expires">{t("expires", { date: formatDate(user.subscriptionExpiresAt) })}</span>
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
                  <Star size={14} className="inline mr-1" /> {plan.badge}
                </div>
              )}
              {isCurrent && <div className="plan-current-tag">{t("currPlanBtn")} ✓</div>}

              <div className="plan-icon-wrap">
                <div className="plan-icon-hex" style={{ color: plan.color }}>
                  {plan.icon}
                </div>
              </div>

              <h2 className="plan-name" style={{ color: plan.color }}>{plan.name}</h2>
              <p className="plan-sub-text">{plan.sub}</p>

              <div className="plan-price-row" dir="ltr">
                <span className="plan-currency">$</span>
                <span className="plan-price">{plan.price}</span>
                <span className="plan-period">{t("mo")}</span>
              </div>

              <div className="plan-divider" />

              <p className="plan-features-title">{t("featuresTitle")}</p>
              <ul className="plan-features-list">
                {plan.features.map((f) => (
                  <li key={f} className="plan-feature-item">
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
                {isCurrent ? t("currPlanBtn") : plan.btnLabel}
              </button>
            </div>
          );
        })}

        <div className="plans-activate-hint">
          <div className="plans-hint-icon"><Key size={20} /></div>
          <p>{t("haveCodeHint")}</p>
          <button className="plans-activate-btn" onClick={() => onNavigate("activate", {})}>
            {t("enterCode")}
          </button>
        </div>

        <div style={{ height: 32 }} />
      </div>
    </div>
  );
}
