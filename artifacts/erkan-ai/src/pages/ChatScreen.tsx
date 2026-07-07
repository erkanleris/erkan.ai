import { useState, useEffect, useRef, useCallback } from "react";
import {
  createConversation, getMessages, streamMessage, generateImage,
  type Message, type User,
} from "../lib/api";

interface Props {
  onBack: () => void;
  conversationId?: number;
  initialMessage?: string;
  mode?: string;
  user?: User | null;
  onNavigate?: (screen: string, data?: unknown) => void;
}

function renderMarkdown(raw: string): string {
  const lines = raw.split("\n");
  const out: string[] = [];
  let inCode = false, inOl = false, inUl = false;
  const closeList = () => { if (inOl) { out.push("</ol>"); inOl = false; } if (inUl) { out.push("</ul>"); inUl = false; } };
  for (const line of lines) {
    if (line.startsWith("```")) { if (!inCode) { closeList(); out.push('<pre class="md-pre"><code>'); inCode = true; } else { out.push("</code></pre>"); inCode = false; } continue; }
    if (inCode) { out.push(escHtml(line)); continue; }
    if (line.startsWith("### ")) { closeList(); out.push(`<h4 class="md-h4">${inline(line.slice(4))}</h4>`); continue; }
    if (line.startsWith("## ")) { closeList(); out.push(`<h3 class="md-h3">${inline(line.slice(3))}</h3>`); continue; }
    if (line.startsWith("# ")) { closeList(); out.push(`<h2 class="md-h2">${inline(line.slice(2))}</h2>`); continue; }
    const olMatch = /^(\d+)\.\s+(.*)$/.exec(line);
    if (olMatch) { if (!inOl) { closeList(); out.push('<ol class="md-ol">'); inOl = true; } out.push(`<li>${inline(olMatch[2]!)}</li>`); continue; }
    if (/^[-*]\s+/.test(line)) { if (!inUl) { closeList(); out.push('<ul class="md-ul">'); inUl = true; } out.push(`<li>${inline(line.replace(/^[-*]\s+/, ""))}</li>`); continue; }
    if (line.startsWith("> ")) { closeList(); out.push(`<blockquote class="md-bq">${inline(line.slice(2))}</blockquote>`); continue; }
    closeList();
    if (line.trim() === "") out.push('<div class="md-br"></div>');
    else out.push(`<p class="md-p">${inline(line)}</p>`);
  }
  closeList();
  if (inCode) out.push("</code></pre>");
  return out.join("");
}
function escHtml(s: string) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function inline(s: string): string { return escHtml(s).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>").replace(/`(.*?)`/g, '<code class="md-code">$1</code>'); }
function MarkdownText({ text }: { text: string }) { return <div className="md-root" dir="rtl" dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }} />; }
function TypingDots() { return <div className="chat-typing-dots"><span /><span /><span /></div>; }
function RobotAvatar({ size = 28 }: { size?: number }) {
  return <svg viewBox="0 0 40 40" width={size} height={size} fill="none"><rect width="40" height="40" rx="10" fill="url(#rgrad)" /><rect x="11" y="14" width="18" height="14" rx="3" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" /><circle cx="16" cy="20" r="2.5" fill="#1E88FF" /><circle cx="24" cy="20" r="2.5" fill="#1E88FF" /><circle cx="16" cy="20" r="1" fill="#fff" /><circle cx="24" cy="20" r="1" fill="#fff" /><rect x="15" y="24" width="10" height="1.5" rx="0.75" fill="rgba(255,255,255,0.4)" /><rect x="18" y="10" width="4" height="4" rx="1" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" /><circle cx="20" cy="10" r="1" fill="#8A2EFF" /><rect x="8" y="17" width="3" height="6" rx="1.5" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" /><rect x="29" y="17" width="3" height="6" rx="1.5" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" /><defs><linearGradient id="rgrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse"><stop stopColor="#1a2a5e" /><stop offset="1" stopColor="#2d1060" /></linearGradient></defs></svg>;
}

function ProMaxPopup({ onClose, onNavigate }: { onClose: () => void; onNavigate?: (s: string) => void }) {
  return (
    <div className="promax-overlay" onClick={onClose}>
      <div className="promax-modal" onClick={e => e.stopPropagation()} dir="rtl">
        <div className="promax-glow" />
        <div className="promax-crown">👑</div>
        <h2 className="promax-title">ميزة حصرية PRO MAX</h2>
        <p className="promax-desc">توليد الصور بالذكاء الاصطناعي متاح حصرياً لمشتركي خطة PRO MAX.<br />ارقِّ اشتراكك الآن واستمتع بقوة DALL·E 3 بلا حدود</p>
        <div className="promax-features">
          {["🎨 توليد صور احترافية", "⚡ سرعة أعلى", "🔓 بلا قيود", "🌟 ميزات حصرية"].map(f => <div key={f} className="promax-feat">{f}</div>)}
        </div>
        <button className="promax-upgrade-btn" onClick={() => { onClose(); onNavigate?.("plans"); }}>ترقية الآن — PRO MAX</button>
        <button className="promax-close-btn" onClick={onClose}>ليس الآن</button>
      </div>
    </div>
  );
}

function LimitReachedPopup({ onClose, onNavigate, plan }: { onClose: () => void; onNavigate?: (s: string) => void; plan?: string }) {
  return (
    <div className="promax-overlay" onClick={onClose}>
      <div className="promax-modal" onClick={e => e.stopPropagation()} dir="rtl">
        <div className="promax-glow" style={{ background: "radial-gradient(circle, rgba(239,68,68,0.3) 0%, transparent 70%)" }} />
        <div className="promax-crown">⚠️</div>
        <h2 className="promax-title">وصلت للحد اليومي</h2>
        <p className="promax-desc">
          {plan === "free" ? "خطتك المجانية تسمح بـ 30 رسالة يومياً. قم بترقيتها للحصول على المزيد!" : "خطتك PRO تسمح بـ 120 رسالة يومياً. قم بترقيتها لـ PRO MAX للحصول على رسائل غير محدودة!"}
        </p>
        <button className="promax-upgrade-btn" onClick={() => { onClose(); onNavigate?.("plans"); }}>ترقية الخطة</button>
        <button className="promax-close-btn" onClick={onClose}>لاحقاً</button>
      </div>
    </div>
  );
}

function formatTime(iso: string) { return new Date(iso).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }); }

const SUGGESTIONS: Record<string, string[]> = {
  chat: ["شو أهم اختراعات الذكاء الاصطناعي؟", "اكتب عن مستقبل التعليم", "كيف أحسّن مهاراتي؟", "شو أفضل لغة برمجة أتعلم؟"],
  write: ["اكتب مقال عن التكنولوجيا", "اكتب منشور لـ LinkedIn", "اكتب قصة قصيرة", "اكتب إعلان إبداعي"],
  summarize: ["لخص هذا النص لي", "أعطيني النقاط الرئيسية", "اختصر بـ 3 نقاط", "ما أهم الأفكار؟"],
  ideas: ["أفكار لمشروع تقني", "أفكار للتسويق", "أفكار محتوى سوشيال", "أفكار لتطوير الذات"],
  image: ["مدينة مستقبلية خيالية", "شخصية روبوت أنمي", "منظر طبيعي ليلي", "تصميم شعار تقني"],
};

export default function ChatScreen({ onBack, conversationId: initialConvId, initialMessage, mode = "chat", user, onNavigate }: Props) {
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [convId, setConvId] = useState<number | null>(initialConvId ?? null);
  const [currentMode] = useState(mode);
  const [showProMax, setShowProMax] = useState(false);
  const [showLimit, setShowLimit] = useState(false);
  const [limitPlan, setLimitPlan] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [dislikedIds, setDislikedIds] = useState<Set<number>>(new Set());
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialized = useRef(false);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, streamingText]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const init = async () => {
      if (initialConvId) { const data = await getMessages(initialConvId); setMsgs(data as Message[]); }
      else if (initialMessage) { const conv = await createConversation(initialMessage.slice(0, 60), currentMode); setConvId(conv.id); sendMsg(conv.id, initialMessage); }
    };
    init().catch(console.error);
  }, []);

  const sendMsg = useCallback((cid: number, text: string) => {
    const userMsg: Message = { id: Date.now(), conversationId: cid, role: "user", content: text, createdAt: new Date().toISOString() };
    setMsgs(prev => [...prev, userMsg]);
    setIsStreaming(true);
    setStreamingText("");
    const abort = new AbortController();
    abortRef.current = abort;
    let full = "";
    streamMessage(cid, text, currentMode,
      chunk => { full += chunk; setStreamingText(full); },
      () => { setIsStreaming(false); setStreamingText(""); setMsgs(prev => [...prev, { id: Date.now() + 1, conversationId: cid, role: "assistant", content: full, createdAt: new Date().toISOString() }]); },
      err => {
        setIsStreaming(false); setStreamingText("");
        if (err.includes("الحد اليومي") || err.includes("وصلت للحد")) {
          setLimitPlan(user?.subscriptionType ?? "free"); setShowLimit(true);
        } else {
          setMsgs(prev => [...prev, { id: Date.now() + 1, conversationId: cid, role: "assistant", content: `والله صار خطأ: ${err}`, createdAt: new Date().toISOString() }]);
        }
      },
      abort.signal
    );
  }, [currentMode, user?.subscriptionType]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    if (currentMode === "image") {
      const isProMax = user?.subscriptionType === "pro_max";
      if (!isProMax) { setShowProMax(true); return; }
      setImageLoading(true);
      try { const url = await generateImage(text); setGeneratedImage(url); } catch { /* ignore */ } finally { setImageLoading(false); }
      return;
    }
    let cid = convId;
    if (!cid) { const conv = await createConversation(text.slice(0, 60), currentMode); setConvId(conv.id); cid = conv.id; }
    sendMsg(cid, text);
  };

  const handleSuggestion = async (s: string) => {
    if (isStreaming) return;
    if (currentMode === "image") { const isProMax = user?.subscriptionType === "pro_max"; if (!isProMax) { setShowProMax(true); return; } return; }
    setInput("");
    let cid = convId;
    if (!cid) { const conv = await createConversation(s.slice(0, 60), currentMode); setConvId(conv.id); cid = conv.id; }
    sendMsg(cid, s);
  };

  const handleStop = () => { abortRef.current?.abort(); setIsStreaming(false); setStreamingText(""); };
  const handleNewChat = () => { abortRef.current?.abort(); setMsgs([]); setConvId(null); setIsStreaming(false); setStreamingText(""); setInput(""); setGeneratedImage(null); };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px"; };
  const copyText = (id: number, text: string) => { navigator.clipboard.writeText(text).catch(() => {}); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); };
  const toggleLike = (id: number) => setLikedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleDislike = (id: number) => setDislikedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const suggestions = SUGGESTIONS[currentMode] ?? SUGGESTIONS["chat"]!;
  const showSuggestions = msgs.length === 0 && !isStreaming;
  const isProMax = user?.subscriptionType === "pro_max";

  return (
    <div className="chat-root">
      <div className="chat-bg" />
      {showProMax && <ProMaxPopup onClose={() => setShowProMax(false)} onNavigate={onNavigate} />}
      {showLimit && <LimitReachedPopup onClose={() => setShowLimit(false)} onNavigate={onNavigate} plan={limitPlan} />}

      <header className="chat-header">
        <button className="chat-icon-btn" onClick={onBack} aria-label="back">
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <div className="chat-header-brand">
          <img src="/erkan-ai-logo.png" alt="EA" className="chat-header-logo" />
          <span className="chat-hb-erkan">ERKAN</span><span className="chat-hb-ai"> AI</span>
        </div>
        <button className="chat-icon-btn" onClick={handleNewChat} aria-label="new chat" title="محادثة جديدة">
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
      </header>

      <div className="chat-ai-card" dir="rtl">
        <div className="chat-ai-avatar"><RobotAvatar size={44} /><span className="chat-ai-online-ring" /></div>
        <div className="chat-ai-info">
          <div className="chat-ai-name">ERKAN AI</div>
          <div className="chat-ai-status"><span className="chat-online-dot" /><span className="chat-ai-status-text">متصل الآن</span></div>
        </div>
        <div className="chat-ai-model-badge">
          <span className="chat-ai-model-label">نموذج ذكي</span>
          <span className="chat-ai-model-name">ERKAN AI</span>
        </div>
        {user && (
          <div className={`chat-plan-badge plan-badge-${user.subscriptionType}`}>
            {user.subscriptionType === "free" ? "مجاني" : user.subscriptionType === "pro" ? "PRO" : "PRO MAX"}
          </div>
        )}
      </div>

      <div className="chat-messages">
        {msgs.length === 0 && !isStreaming && (
          <div className="chat-welcome" dir="rtl">
            <div className="chat-welcome-avatar"><RobotAvatar size={64} /><div className="chat-welcome-pulse" /></div>
            <h2 className="chat-welcome-title">أهلاً وسهلاً! 👋</h2>
            <p className="chat-welcome-sub">أنا ERKAN AI، رفيقك الذكي. شو بدك اليوم؟</p>
          </div>
        )}

        {currentMode === "image" && generatedImage && (
          <div className="chat-generated-image-wrap" dir="rtl">
            <p className="chat-gen-img-label">الصورة المولّدة:</p>
            <img src={generatedImage} alt="Generated" className="chat-generated-image" />
            <button className="chat-gen-img-dl" onClick={() => { const a = document.createElement("a"); a.href = generatedImage!; a.download = "erkan-ai-image.png"; a.click(); }}>
              ⬇️ تحميل الصورة
            </button>
          </div>
        )}

        {currentMode === "image" && imageLoading && (
          <div className="chat-image-loading" dir="rtl">
            <div className="chat-image-loading-spinner" />
            <p>جاري توليد الصورة...</p>
          </div>
        )}

        {msgs.map((msg) => (
          <div key={msg.id} className={`chat-msg-wrap ${msg.role === "user" ? "user" : "ai"}`}>
            {msg.role === "assistant" && <div className="chat-avatar-wrap"><RobotAvatar size={32} /></div>}
            <div className="chat-msg-col">
              {msg.role === "assistant" && <span className="chat-ai-label">ERKAN AI</span>}
              <div className={`chat-bubble ${msg.role === "user" ? "user-bubble" : "ai-bubble"}`}>
                {msg.role === "user" ? <div className="chat-user-text" dir="rtl">{msg.content}</div> : <MarkdownText text={msg.content} />}
                {msg.role === "user" && (
                  <div className="chat-bubble-meta" dir="rtl">
                    <span className="chat-time">{formatTime(msg.createdAt)}</span>
                    <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M20 6L9 17l-5-5" stroke="rgba(180,220,255,0.7)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                )}
              </div>
              {msg.role === "assistant" && (
                <div className="chat-msg-actions" dir="rtl">
                  <button className={`chat-act-btn ${copiedId === msg.id ? "active" : ""}`} onClick={() => copyText(msg.id, msg.content)} title="نسخ">
                    {copiedId === msg.id
                      ? <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M20 6L9 17l-5-5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      : <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><rect x="8" y="8" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" stroke="currentColor" strokeWidth="1.5"/></svg>}
                  </button>
                  <button className="chat-act-btn" title="مشاركة" onClick={() => { if (navigator.share) navigator.share({ text: msg.content }).catch(() => {}); else copyText(msg.id, msg.content); }}>
                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/><circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/><circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="currentColor" strokeWidth="1.5"/></svg>
                  </button>
                  <button className="chat-act-btn" title="إعادة توليد" onClick={() => { if (!isStreaming && convId) { const prev = msgs[msgs.indexOf(msg) - 1]; if (prev) sendMsg(convId, prev.content); } }}>
                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M1 4v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3.51 15a9 9 0 1 0 .49-4.07" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <div className="chat-act-divider" />
                  <button className={`chat-act-btn ${likedIds.has(msg.id) ? "liked" : ""}`} onClick={() => toggleLike(msg.id)} title="إعجاب">
                    <svg viewBox="0 0 24 24" fill={likedIds.has(msg.id) ? "#1E88FF" : "none"} width="14" height="14"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </button>
                  <button className={`chat-act-btn ${dislikedIds.has(msg.id) ? "disliked" : ""}`} onClick={() => toggleDislike(msg.id)} title="عدم إعجاب">
                    <svg viewBox="0 0 24 24" fill={dislikedIds.has(msg.id) ? "#ef4444" : "none"} width="14" height="14"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </button>
                </div>
              )}
              {msg.role === "assistant" && <span className="chat-ai-time">{formatTime(msg.createdAt)}</span>}
            </div>
          </div>
        ))}

        {isStreaming && (
          <div className="chat-msg-wrap ai">
            <div className="chat-avatar-wrap"><RobotAvatar size={32} /></div>
            <div className="chat-msg-col">
              <span className="chat-ai-label">ERKAN AI</span>
              <div className="chat-bubble ai-bubble">{streamingText ? <MarkdownText text={streamingText} /> : <TypingDots />}</div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {showSuggestions && (
        <div className="chat-suggestions-wrap">
          <div className="chat-suggestions">
            {suggestions.map(s => (
              <button key={s} className="chat-suggestion-chip" onClick={() => handleSuggestion(s)} dir="rtl">
                <span className="chip-star">✦</span> {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="chat-tools-row" dir="rtl">
        {[
          { icon: "🌐", label: "ترجمة", action: () => handleSuggestion("ترجم هذا النص لي") },
          { icon: "📄", label: "تحليل", action: () => handleSuggestion("حلل هذا المحتوى وأعطيني تقريراً مفصلاً") },
          { icon: "🎨", label: "صورة", action: () => { if (!isProMax) setShowProMax(true); else if (input.trim()) handleSend(); } },
          { icon: "🆕", label: "جديد", action: handleNewChat },
        ].map(t => (
          <button key={t.label} className="chat-tool-chip" onClick={t.action}>
            <span className="chat-tool-chip-icon">{t.icon}</span>
            <span className="chat-tool-chip-label">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="chat-input-bar">
        <div className="chat-input-wrap">
          <button className="chat-input-mic" aria-label="mic" onClick={() => onNavigate?.("chat", { mode: currentMode })}>
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><rect x="9" y="2" width="6" height="11" rx="3" stroke="white" strokeWidth="1.8" /><path d="M5 10a7 7 0 0 0 14 0" stroke="white" strokeWidth="1.8" strokeLinecap="round" /><line x1="12" y1="17" x2="12" y2="21" stroke="white" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </button>
          <textarea ref={textareaRef} className="chat-input" placeholder={currentMode === "image" ? "صف الصورة التي تريد توليدها..." : "اكتب رسالتك هنا..."} dir="rtl" rows={1} value={input} onChange={handleTextareaChange} onKeyDown={handleKeyDown} />
          {isStreaming
            ? <button className="chat-stop-btn" onClick={handleStop} aria-label="stop"><svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><rect x="6" y="6" width="12" height="12" rx="2" /></svg></button>
            : <button className={`chat-send-btn ${input.trim() ? "active" : ""}`} onClick={handleSend} disabled={!input.trim()} aria-label="send"><svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" /><path d="M22 2L15 22l-4-9-9-4 20-7z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></button>}
        </div>
      </div>
    </div>
  );
}
