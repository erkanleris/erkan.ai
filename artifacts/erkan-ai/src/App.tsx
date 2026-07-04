import { useEffect, useState, useRef } from "react";
import HomeScreen from "./pages/HomeScreen";

function CircuitPattern({ side }: { side: "left" | "right" }) {
  const flip = side === "right";
  return (
    <svg
      className="circuit-pattern"
      style={{ transform: flip ? "scaleX(-1)" : undefined }}
      viewBox="0 0 140 560"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`cg-${side}`} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#4f8ef7" stopOpacity="0.55" />
          <stop offset="70%" stopColor="#6c4af7" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Branch 1 */}
      <line x1="135" y1="90" x2="75" y2="90" stroke={`url(#cg-${side})`} strokeWidth="1.3" />
      <line x1="75" y1="90" x2="75" y2="148" stroke={`url(#cg-${side})`} strokeWidth="1.3" />
      <line x1="75" y1="148" x2="28" y2="148" stroke={`url(#cg-${side})`} strokeWidth="1.3" />
      <circle cx="28" cy="148" r="4.5" fill="none" stroke="#6c4af7" strokeWidth="1.3" opacity="0.7" />
      <circle cx="28" cy="148" r="2" fill="#6c4af7" opacity="0.55" />
      {/* Branch 2 */}
      <line x1="135" y1="210" x2="95" y2="210" stroke={`url(#cg-${side})`} strokeWidth="1.1" />
      <line x1="95" y1="210" x2="95" y2="268" stroke={`url(#cg-${side})`} strokeWidth="1.1" />
      <line x1="95" y1="268" x2="42" y2="268" stroke={`url(#cg-${side})`} strokeWidth="1.1" />
      <circle cx="42" cy="268" r="4" fill="none" stroke="#4f8ef7" strokeWidth="1.2" opacity="0.65" />
      <circle cx="42" cy="268" r="1.8" fill="#4f8ef7" opacity="0.5" />
      {/* Branch 3 */}
      <line x1="130" y1="340" x2="68" y2="340" stroke={`url(#cg-${side})`} strokeWidth="1.2" />
      <line x1="68" y1="340" x2="68" y2="396" stroke={`url(#cg-${side})`} strokeWidth="1.2" />
      <circle cx="68" cy="396" r="4.5" fill="none" stroke="#a855f7" strokeWidth="1.2" opacity="0.65" />
      <circle cx="68" cy="396" r="2" fill="#a855f7" opacity="0.5" />
      {/* Branch 4 */}
      <line x1="135" y1="460" x2="88" y2="460" stroke={`url(#cg-${side})`} strokeWidth="1" />
      <line x1="88" y1="460" x2="88" y2="496" stroke={`url(#cg-${side})`} strokeWidth="1" />
      <line x1="88" y1="496" x2="36" y2="496" stroke={`url(#cg-${side})`} strokeWidth="1" />
      <circle cx="36" cy="496" r="3.5" fill="none" stroke="#6c4af7" strokeWidth="1" opacity="0.55" />
      <circle cx="36" cy="496" r="1.5" fill="#6c4af7" opacity="0.4" />
      {/* Accent stubs */}
      <line x1="135" y1="118" x2="108" y2="118" stroke="#4f8ef7" strokeWidth="0.7" opacity="0.28" />
      <line x1="135" y1="238" x2="114" y2="238" stroke="#a855f7" strokeWidth="0.7" opacity="0.24" />
      <line x1="135" y1="370" x2="112" y2="370" stroke="#4f8ef7" strokeWidth="0.7" opacity="0.24" />
      <line x1="135" y1="480" x2="116" y2="480" stroke="#a855f7" strokeWidth="0.7" opacity="0.2" />
    </svg>
  );
}

type Phase = "loading" | "transitioning" | "home";

export default function App() {
  const [pct, setPct] = useState(0);
  const [phase, setPhase] = useState<Phase>("loading");
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  const DURATION = 4200; // ms to go from 0→100

  useEffect(() => {
    if (phase !== "loading") return;

    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      // ease-in-out curve
      const t = Math.min(elapsed / DURATION, 1);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const current = Math.floor(eased * 100);
      setPct(current);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setPct(100);
        setTimeout(() => setPhase("transitioning"), 480);
        setTimeout(() => setPhase("home"), 980);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [phase]);

  if (phase === "home") return <HomeScreen />;

  return (
    <div className={`splash-root ${phase === "transitioning" ? "splash-fade-out" : ""}`}>
      <div className="bg-gradient" />
      <div className="bg-radial-center" />
      <div className="bg-radial-bottom" />

      <div className="circuit-left">
        <CircuitPattern side="left" />
      </div>
      <div className="circuit-right">
        <CircuitPattern side="right" />
      </div>

      <div className="content-area">
        {/* ── Logo ── */}
        <div className="logo-wrapper">
          <div className="halo-outer" />
          <div className="halo-mid" />
          <div className="ring-spin" />
          <div className="logo-glass">
            <img
              src="/erkan-ai-logo.png"
              alt="ERKAN AI Logo"
              className="logo-img"
              draggable={false}
            />
          </div>
        </div>

        {/* ── App Name ── */}
        <div className="app-name anim-fade-up" style={{ animationDelay: "0.15s" }}>
          <span className="app-name-erkan">ERKAN </span>
          <span className="app-name-ai">AI</span>
        </div>

        {/* ── Arabic Slogan ── */}
        <p className="slogan-arabic anim-fade-up" dir="rtl" style={{ animationDelay: "0.28s" }}>
          ذكاء اصطناعي بلا حدود
        </p>

        {/* ── Progress bar + counter ── */}
        <div className="loader-section anim-fade-up" style={{ animationDelay: "0.42s" }}>
          <div className="loading-bar-track">
            <div className="loading-bar-fill" style={{ width: `${pct}%` }} />
            <div className="loading-bar-glow" style={{ width: `${pct}%` }} />
          </div>

          <p className="loading-text-arabic" dir="rtl">جاري التحميل...</p>

          <div className="pct-counter">
            <span className="pct-value">{pct}</span>
            <span className="pct-sign">%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
