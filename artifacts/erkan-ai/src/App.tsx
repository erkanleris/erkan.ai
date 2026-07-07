import { useEffect, useState, useRef } from "react";
import LoginScreen from "./pages/LoginScreen";
import HomeScreen from "./pages/HomeScreen";
import ChatScreen from "./pages/ChatScreen";
import ProfileScreen from "./pages/ProfileScreen";
import PlansScreen from "./pages/PlansScreen";
import ActivateScreen from "./pages/ActivateScreen";
import DeveloperInfoScreen from "./pages/DeveloperInfoScreen";
import { authMe, type User } from "./lib/api";

function CircuitPattern({ side }: { side: "left" | "right" }) {
  const flip = side === "right";
  return (
    <svg className="circuit-pattern" style={{ transform: flip ? "scaleX(-1)" : undefined }}
      viewBox="0 0 140 560" fill="none">
      <defs>
        <linearGradient id={`cg-${side}`} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#4f8ef7" stopOpacity="0.55" />
          <stop offset="70%" stopColor="#6c4af7" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="135" y1="90" x2="75" y2="90" stroke={`url(#cg-${side})`} strokeWidth="1.3" />
      <line x1="75" y1="90" x2="75" y2="148" stroke={`url(#cg-${side})`} strokeWidth="1.3" />
      <line x1="75" y1="148" x2="28" y2="148" stroke={`url(#cg-${side})`} strokeWidth="1.3" />
      <circle cx="28" cy="148" r="4.5" fill="none" stroke="#6c4af7" strokeWidth="1.3" opacity="0.7" />
      <circle cx="28" cy="148" r="2" fill="#6c4af7" opacity="0.55" />
      <line x1="135" y1="210" x2="95" y2="210" stroke={`url(#cg-${side})`} strokeWidth="1.1" />
      <line x1="95" y1="210" x2="95" y2="268" stroke={`url(#cg-${side})`} strokeWidth="1.1" />
      <line x1="95" y1="268" x2="42" y2="268" stroke={`url(#cg-${side})`} strokeWidth="1.1" />
      <circle cx="42" cy="268" r="4" fill="none" stroke="#4f8ef7" strokeWidth="1.2" opacity="0.65" />
      <circle cx="42" cy="268" r="1.8" fill="#4f8ef7" opacity="0.5" />
      <line x1="130" y1="340" x2="68" y2="340" stroke={`url(#cg-${side})`} strokeWidth="1.2" />
      <line x1="68" y1="340" x2="68" y2="396" stroke={`url(#cg-${side})`} strokeWidth="1.2" />
      <circle cx="68" cy="396" r="4.5" fill="none" stroke="#a855f7" strokeWidth="1.2" opacity="0.65" />
      <circle cx="68" cy="396" r="2" fill="#a855f7" opacity="0.5" />
    </svg>
  );
}

type AppScreen =
  | { name: "loading" }
  | { name: "login" }
  | { name: "home" }
  | { name: "chat"; data?: { conversationId?: number; initialMessage?: string; mode?: string } }
  | { name: "profile" }
  | { name: "plans" }
  | { name: "activate"; data?: { plan?: string } }
  | { name: "devinfo" };

export default function App() {
  const [pct, setPct] = useState(0);
  const [splashOut, setSplashOut] = useState(false);
  const [screen, setScreen] = useState<AppScreen>({ name: "loading" });
  const [user, setUser] = useState<User | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const DURATION = 3800;

  useEffect(() => {
    if (screen.name !== "loading") return;
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const t = Math.min((ts - startRef.current) / DURATION, 1);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      setPct(Math.floor(eased * 100));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setPct(100);
        authMe().then(u => {
          if (u) { setUser(u); setSplashOut(true); setTimeout(() => setScreen({ name: "home" }), 500); }
          else { setSplashOut(true); setTimeout(() => setScreen({ name: "login" }), 500); }
        }).catch(() => { setSplashOut(true); setTimeout(() => setScreen({ name: "login" }), 500); });
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [screen.name]);

  const navigate = (dest: string, data?: unknown) => {
    if (dest === "chat") setScreen({ name: "chat", data: data as { conversationId?: number; initialMessage?: string; mode?: string } });
    else if (dest === "profile") setScreen({ name: "profile" });
    else if (dest === "plans") setScreen({ name: "plans" });
    else if (dest === "activate") setScreen({ name: "activate", data: data as { plan?: string } });
    else if (dest === "devinfo") setScreen({ name: "devinfo" });
    else setScreen({ name: "home" });
  };

  const handleLogin = (u: User) => { setUser(u); setScreen({ name: "home" }); };
  const handleLogout = () => { setUser(null); setScreen({ name: "login" }); };
  const handleUserUpdate = (u: User) => setUser(u);

  if (screen.name === "login") return <LoginScreen onLogin={handleLogin} />;
  if (screen.name === "home") return <HomeScreen onNavigate={navigate} user={user} />;
  if (screen.name === "chat") return (
    <ChatScreen
      onBack={() => setScreen({ name: "home" })}
      conversationId={screen.data?.conversationId}
      initialMessage={screen.data?.initialMessage}
      mode={screen.data?.mode ?? "chat"}
      user={user}
      onNavigate={navigate}
    />
  );
  if (screen.name === "profile") return (
    <ProfileScreen
      user={user!}
      onUserUpdate={handleUserUpdate}
      onLogout={handleLogout}
      onBack={() => setScreen({ name: "home" })}
      onNavigate={navigate}
    />
  );
  if (screen.name === "plans") return (
    <PlansScreen user={user} onNavigate={navigate} onBack={() => setScreen({ name: "home" })} />
  );
  if (screen.name === "activate") return (
    <ActivateScreen
      user={user}
      onBack={() => setScreen({ name: "plans" })}
      onActivated={(u) => { setUser(u); setScreen({ name: "home" }); }}
    />
  );
  if (screen.name === "devinfo") return <DeveloperInfoScreen onBack={() => setScreen({ name: "profile" })} />;

  return (
    <div className={`splash-root ${splashOut ? "splash-fade-out" : ""}`}>
      <div className="bg-gradient" />
      <div className="bg-radial-center" />
      <div className="bg-radial-bottom" />
      <div className="circuit-left"><CircuitPattern side="left" /></div>
      <div className="circuit-right"><CircuitPattern side="right" /></div>
      <div className="content-area">
        <div className="logo-wrapper">
          <div className="halo-outer" /><div className="halo-mid" /><div className="ring-spin" />
          <div className="logo-glass">
            <img src="/erkan-ai-logo.png" alt="ERKAN AI Logo" className="logo-img" draggable={false} />
          </div>
        </div>
        <div className="app-name anim-fade-up" style={{ animationDelay: "0.15s" }}>
          <span className="app-name-erkan">ERKAN </span>
          <span className="app-name-ai">AI</span>
        </div>
        <p className="slogan-arabic anim-fade-up" dir="rtl" style={{ animationDelay: "0.28s" }}>ذكاء اصطناعي بلا حدود</p>
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
