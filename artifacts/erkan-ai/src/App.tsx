import { useEffect, useState } from "react";

function CircuitPattern({ side }: { side: "left" | "right" }) {
  const flip = side === "right";
  return (
    <svg
      className="circuit-pattern"
      style={{ transform: flip ? "scaleX(-1)" : undefined }}
      viewBox="0 0 160 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`cg-${side}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#4f8ef7" stopOpacity="0" />
          <stop offset="60%" stopColor="#6c4af7" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <line x1="140" y1="50" x2="80" y2="50" stroke={`url(#cg-${side})`} strokeWidth="1.2" />
      <line x1="80" y1="50" x2="80" y2="120" stroke={`url(#cg-${side})`} strokeWidth="1.2" />
      <line x1="80" y1="120" x2="30" y2="120" stroke={`url(#cg-${side})`} strokeWidth="1.2" />
      <circle cx="30" cy="120" r="4" fill="none" stroke="#6c4af7" strokeWidth="1.2" opacity="0.7" />
      <circle cx="30" cy="120" r="2" fill="#6c4af7" opacity="0.5" />

      <line x1="150" y1="170" x2="100" y2="170" stroke={`url(#cg-${side})`} strokeWidth="1.2" />
      <line x1="100" y1="170" x2="100" y2="240" stroke={`url(#cg-${side})`} strokeWidth="1.2" />
      <line x1="100" y1="240" x2="50" y2="240" stroke={`url(#cg-${side})`} strokeWidth="1.2" />
      <circle cx="50" cy="240" r="4" fill="none" stroke="#4f8ef7" strokeWidth="1.2" opacity="0.7" />
      <circle cx="50" cy="240" r="2" fill="#4f8ef7" opacity="0.5" />

      <line x1="130" y1="300" x2="70" y2="300" stroke={`url(#cg-${side})`} strokeWidth="1.2" />
      <line x1="70" y1="300" x2="70" y2="360" stroke={`url(#cg-${side})`} strokeWidth="1.2" />
      <circle cx="70" cy="360" r="4" fill="none" stroke="#a855f7" strokeWidth="1.2" opacity="0.7" />
      <circle cx="70" cy="360" r="2" fill="#a855f7" opacity="0.5" />

      <line x1="155" y1="400" x2="90" y2="400" stroke={`url(#cg-${side})`} strokeWidth="1" />
      <line x1="90" y1="400" x2="90" y2="440" stroke={`url(#cg-${side})`} strokeWidth="1" />
      <line x1="90" y1="440" x2="40" y2="440" stroke={`url(#cg-${side})`} strokeWidth="1" />
      <circle cx="40" cy="440" r="3.5" fill="none" stroke="#6c4af7" strokeWidth="1" opacity="0.6" />
      <circle cx="40" cy="440" r="1.5" fill="#6c4af7" opacity="0.4" />

      <line x1="145" y1="80" x2="110" y2="80" stroke="#4f8ef7" strokeWidth="0.8" opacity="0.3" />
      <line x1="155" y1="200" x2="120" y2="200" stroke="#a855f7" strokeWidth="0.8" opacity="0.25" />
      <line x1="145" y1="330" x2="115" y2="330" stroke="#4f8ef7" strokeWidth="0.8" opacity="0.25" />
    </svg>
  );
}

function EALogo() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="ea-logo-svg">
      <defs>
        <linearGradient id="eGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="50%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id="aGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4f8ef7" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="circuitGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <path
        d="M20 20 L20 140 L90 140 L90 118 L44 118 L44 90 L80 90 L80 68 L44 68 L44 42 L90 42 L90 20 Z"
        fill="url(#eGrad)"
        filter="url(#logoGlow)"
      />

      <path
        d="M108 140 L134 20 L160 20 L186 140 L162 140 L157 112 L137 112 L132 140 Z M141 92 L153 92 L147 52 Z"
        fill="url(#aGrad)"
        filter="url(#logoGlow)"
      />

      <g filter="url(#softGlow)">
        <line x1="158" y1="48" x2="185" y2="48" stroke="url(#circuitGrad)" strokeWidth="1.8" />
        <line x1="185" y1="48" x2="185" y2="65" stroke="url(#circuitGrad)" strokeWidth="1.8" />
        <circle cx="185" cy="65" r="3.5" fill="none" stroke="#a855f7" strokeWidth="1.5" />
        <circle cx="185" cy="65" r="1.5" fill="#a855f7" />

        <line x1="165" y1="70" x2="195" y2="70" stroke="url(#circuitGrad)" strokeWidth="1.5" />
        <circle cx="195" cy="70" r="3" fill="none" stroke="#60a5fa" strokeWidth="1.5" />
        <circle cx="195" cy="70" r="1.2" fill="#60a5fa" />

        <line x1="168" y1="82" x2="190" y2="82" stroke="url(#circuitGrad)" strokeWidth="1.5" />
        <line x1="190" y1="82" x2="190" y2="95" stroke="url(#circuitGrad)" strokeWidth="1.5" />
        <circle cx="190" cy="95" r="3" fill="none" stroke="#818cf8" strokeWidth="1.5" />
        <circle cx="190" cy="95" r="1.2" fill="#818cf8" />
      </g>
    </svg>
  );
}

export default function App() {
  const [progress, setProgress] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(70), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (displayProgress < progress) {
      const step = setTimeout(() => {
        setDisplayProgress((p) => Math.min(p + 1, progress));
      }, 14);
      return () => clearTimeout(step);
    }
  }, [displayProgress, progress]);

  return (
    <div className="splash-root">
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
        <div className="logo-wrapper">
          <div className="ring-outer" />
          <div className="ring-inner" />
          <div className="logo-glass">
            <EALogo />
          </div>
        </div>

        <div className="app-name">
          <span className="app-name-erkan">ERKAN </span>
          <span className="app-name-ai">AI</span>
        </div>

        <p className="slogan-arabic" dir="rtl">
          ذكاء اصطناعي بلا حدود
        </p>

        <div className="loader-section">
          <div className="loading-bar-track">
            <div
              className="loading-bar-fill"
              style={{ width: `${displayProgress}%` }}
            />
            <div
              className="loading-bar-glow"
              style={{ width: `${displayProgress}%` }}
            />
          </div>
          <p className="loading-text-arabic" dir="rtl">
            جاري التحميل...
          </p>
        </div>
      </div>
    </div>
  );
}
