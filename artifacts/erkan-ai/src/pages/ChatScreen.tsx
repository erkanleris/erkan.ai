import { useState, useEffect, useRef, useCallback } from "react";
import {
  createConversation,
  getMessages,
  streamMessage,
  type Message,
} from "../lib/api";

interface Props {
  onBack: () => void;
  conversationId?: number;
  initialMessage?: string;
  mode?: string;
}

/* ── Markdown renderer ───────────────────────────────── */
function renderMarkdown(raw: string): string {
  const lines = raw.split("\n");
  const out: string[] = [];
  let inCode = false;
  let inOl = false;
  let inUl = false;

  const closeList = () => {
    if (inOl) { out.push("</ol>"); inOl = false; }
    if (inUl) { out.push("</ul>"); inUl = false; }
  };

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]!;

    if (line.startsWith("```")) {
      if (!inCode) { closeList(); out.push('<pre class="md-pre"><code>'); inCode = true; }
      else { out.push("</code></pre>"); inCode = false; }
      continue;
    }
    if (inCode) { out.push(escHtml(line)); continue; }

    if (line.startsWith("### ")) { closeList(); out.push(`<h4 class="md-h4">${inline(line.slice(4))}</h4>`); continue; }
    if (line.startsWith("## ")) { closeList(); out.push(`<h3 class="md-h3">${inline(line.slice(3))}</h3>`); continue; }
    if (line.startsWith("# ")) { closeList(); out.push(`<h2 class="md-h2">${inline(line.slice(2))}</h2>`); continue; }

    const olMatch = /^(\d+)\.\s+(.*)$/.exec(line);
    if (olMatch) {
      if (!inOl) { closeList(); out.push('<ol class="md-ol">'); inOl = true; }
      out.push(`<li>${inline(olMatch[2]!)}</li>`);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      if (!inUl) { closeList(); out.push('<ul class="md-ul">'); inUl = true; }
      out.push(`<li>${inline(line.replace(/^[-*]\s+/, ""))}</li>`);
      continue;
    }

    if (line.startsWith("> ")) {
      closeList();
      out.push(`<blockquote class="md-bq">${inline(line.slice(2))}</blockquote>`);
      continue;
    }

    closeList();
    if (line.trim() === "") out.push('<div class="md-br"></div>');
    else out.push(`<p class="md-p">${inline(line)}</p>`);
  }
  closeList();
  if (inCode) out.push("</code></pre>");
  return out.join("");
}

function escHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s: string): string {
  return escHtml(s)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, '<code class="md-code">$1</code>');
}

function MarkdownText({ text }: { text: string }) {
  return <div className="md-root" dir="rtl" dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }} />;
}

/* ── Typing dots ─────────────────────────────────────── */
function TypingDots() {
  return (
    <div className="chat-typing-dots">
      <span /><span /><span />
    </div>
  );
}

/* ── Robot SVG Avatar ───────────────────────────────── */
function RobotAvatar({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} fill="none">
      <rect width="40" height="40" rx="10" fill="url(#rgrad)" />
      <rect x="11" y="14" width="18" height="14" rx="3" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      <circle cx="16" cy="20" r="2.5" fill="#1E88FF" />
      <circle cx="24" cy="20" r="2.5" fill="#1E88FF" />
      <circle cx="16" cy="20" r="1" fill="#fff" />
      <circle cx="24" cy="20" r="1" fill="#fff" />
      <rect x="15" y="24" width="10" height="1.5" rx="0.75" fill="rgba(255,255,255,0.4)" />
      <rect x="18" y="10" width="4" height="4" rx="1" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
      <circle cx="20" cy="10" r="1" fill="#8A2EFF" />
      <rect x="8" y="17" width="3" height="6" rx="1.5" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
      <rect x="29" y="17" width="3" height="6" rx="1.5" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
      <defs>
        <linearGradient id="rgrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1a2a5e" />
          <stop offset="1" stopColor="#2d1060" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ── PRO MAX popup ──────────────────────────────────── */
function ProMaxPopup({ onClose }: { onClose: () => void }) {
  return (
    <div className="promax-overlay" onClick={onClose}>
      <div className="promax-modal" onClick={e => e.stopPropagation()} dir="rtl">
        <div className="promax-glow" />
        <div className="promax-crown">👑</div>
        <h2 className="promax-title">ميزة حصرية PRO MAX</h2>
        <p className="promax-desc">
          توليد الصور بالذكاء الاصطناعي متاح حصرياً لمشتركي خطة PRO MAX.<br />
          ارقِّ اشتراكك الآن واستمتع بقوة DALL·E 3 بلا حدود
        </p>
        <div className="promax-features">
          {["🎨 توليد صور احترافية", "⚡ سرعة أعلى", "🔓 بلا قيود", "🌟 ميزات حصرية"].map(f => (
            <div key={f} className="promax-feat">{f}</div>
          ))}
        </div>
        <button className="promax-upgrade-btn">ترقية الآن — PRO MAX</button>
        <button className="promax-close-btn" onClick={onClose}>ليس الآن</button>
      </div>
    </div>
  );
}

/* ── Message time formatter ─────────────────────────── */
function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
}

/* ── Suggestions ─────────────────────────────────────── */
const SUGGESTIONS: Record<string, string[]> = {
  chat: ["شو أهم اختراعات الذكاء الاصطناعي؟", "اكتب عن مستقبل التعليم", "كيف أحسّن مهاراتي؟", "شو أفضل لغة برمجة أتعلم؟"],
  write: ["اكتب مقال عن التكنولوجيا", "اكتب منشور لـ LinkedIn", "اكتب قصة قصيرة", "اكتب إعلان إبداعي"],
  summarize: ["لخص هذا النص لي", "أعطيني النقاط الرئيسية", "اختصر بـ 3 نقاط", "ما أهم الأفكار؟"],
  ideas: ["أفكار لمشروع تقني", "أفكار للتسويق", "أفكار محتوى سوشيال", "أفكار لتطوير الذات"],
  image: ["صورة مدينة مستقبلية", "شخصية روبوت أنمي", "منظر طبيعي ليلي", "تصميم شعار تقني"],
};

/* ══════════════════════════════════════════════════════
   Main ChatScreen
══════════════════════════════════════════════════════ */
export default function ChatScreen({
  onBack,
  conversationId: initialConvId,
  initialMessage,
  mode = "chat",
}: Props) {
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [convId, setConvId] = useState<number | null>(initialConvId ?? null);
  const [currentMode] = useState(mode);
  const [showProMax, setShowProMax] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [dislikedIds, setDislikedIds] = useState<Set<number>>(new Set());
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, streamingText]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const init = async () => {
      if (initialConvId) {
        const data = await getMessages(initialConvId);
        setMsgs(data as Message[]);
      } else if (initialMessage) {
        const conv = await createConversation(initialMessage.slice(0, 60), currentMode);
        setConvId(conv.id);
        sendMsg(conv.id, initialMessage);
      }
    };
    init().catch(console.error);
  }, []);

  const sendMsg = useCallback(
    (cid: number, text: string) => {
      const userMsg: Message = {
        id: Date.now(),
        conversationId: cid,
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
      };
      setMsgs(prev => [...prev, userMsg]);
      setIsStreaming(true);
      setStreamingText("");

      const abort = new AbortController();
      abortRef.current = abort;
      let full = "";

      streamMessage(
        cid, text, currentMode,
        chunk => { full += chunk; setStreamingText(full); },
        () => {
          setIsStreaming(false);
          setStreamingText("");
          setMsgs(prev => [...prev, {
            id: Date.now() + 1, conversationId: cid,
            role: "assistant", content: full,
            createdAt: new Date().toISOString(),
          }]);
        },
        err => {
          setIsStreaming(false);
          setStreamingText("");
          setMsgs(prev => [...prev, {
            id: Date.now() + 1, conversationId: cid,
            role: "assistant", content: `والله صار خطأ: ${err}`,
            createdAt: new Date().toISOString(),
          }]);
        },
        abort.signal
      );
    },
    [currentMode]
  );

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    // Image mode → PRO MAX gate
    if (currentMode === "image") {
      setShowProMax(true);
      return;
    }

    let cid = convId;
    if (!cid) {
      const conv = await createConversation(text.slice(0, 60), currentMode);
      setConvId(conv.id);
      cid = conv.id;
    }
    sendMsg(cid, text);
  };

  const handleSuggestion = async (s: string) => {
    if (isStreaming) return;
    if (currentMode === "image") { setShowProMax(true); return; }
    setInput("");
    let cid = convId;
    if (!cid) {
      const conv = await createConversation(s.slice(0, 60), currentMode);
      setConvId(conv.id);
      cid = conv.id;
    }
    sendMsg(cid, s);
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setStreamingText("");
  };

  const handleNewChat = () => {
    abortRef.current?.abort();
    setMsgs([]);
    setConvId(null);
    setIsStreaming(false);
    setStreamingText("");
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  };

  const copyText = (id: number, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleLike = (id: number) => setLikedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); dislikedIds.has(id) && setDislikedIds(d => { const x = new Set(d); x.delete(id); return x; }); return n; });
  const toggleDislike = (id: number) => setDislikedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); likedIds.has(id) && setLikedIds(d => { const x = new Set(d); x.delete(id); return x; }); return n; });

  const suggestions = SUGGESTIONS[currentMode] ?? SUGGESTIONS["chat"]!;
  const showSuggestions = msgs.length === 0 && !isStreaming;

  return (
    <div className="chat-root">
      <div className="chat-bg" />
      {showProMax && <ProMaxPopup onClose={() => setShowProMax(false)} />}

      {/* ── Header ── */}
      <header className="chat-header">
        <button className="chat-icon-btn" onClick={onBack} aria-label="back">
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="chat-header-brand">
          <img src="/erkan-ai-logo.png" alt="EA" className="chat-header-logo" />
          <span className="chat-hb-erkan">ERKAN</span>
          <span className="chat-hb-ai"> AI</span>
        </div>

        <button className="chat-icon-btn" style={{ position: "relative" }} aria-label="notifications">
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
            <path d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="chat-notif-dot" />
        </button>
      </header>

      {/* ── AI Info Card ── */}
      <div className="chat-ai-card" dir="rtl">
        <div className="chat-ai-avatar">
          <RobotAvatar size={44} />
          <span className="chat-ai-online-ring" />
        </div>
        <div className="chat-ai-info">
          <div className="chat-ai-name">ERKAN AI</div>
          <div className="chat-ai-status">
            <span className="chat-online-dot" />
            <span className="chat-ai-status-text">متصل الآن</span>
          </div>
        </div>
        <div className="chat-ai-model-badge">
          <span className="chat-ai-model-label">نموذج ذكي</span>
          <span className="chat-ai-model-name">GPT-4o</span>
        </div>
        <button className="chat-ai-menu-btn" aria-label="settings">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>
      </div>

      {/* ── Messages ── */}
      <div className="chat-messages">
        {/* Welcome */}
        {msgs.length === 0 && !isStreaming && (
          <div className="chat-welcome" dir="rtl">
            <div className="chat-welcome-avatar">
              <RobotAvatar size={64} />
              <div className="chat-welcome-pulse" />
            </div>
            <h2 className="chat-welcome-title">أهلاً وسهلاً! 👋</h2>
            <p className="chat-welcome-sub">أنا ERKAN AI، رفيقك الذكي. شو بدك اليوم؟</p>
          </div>
        )}

        {/* History */}
        {msgs.map((msg) => (
          <div key={msg.id} className={`chat-msg-wrap ${msg.role === "user" ? "user" : "ai"}`}>
            {msg.role === "assistant" && (
              <div className="chat-avatar-wrap">
                <RobotAvatar size={32} />
              </div>
            )}
            <div className="chat-msg-col">
              {msg.role === "assistant" && (
                <span className="chat-ai-label">ERKAN AI</span>
              )}
              <div className={`chat-bubble ${msg.role === "user" ? "user-bubble" : "ai-bubble"}`}>
                {msg.role === "user"
                  ? <div className="chat-user-text" dir="rtl">{msg.content}</div>
                  : <MarkdownText text={msg.content} />
                }
                {msg.role === "user" && (
                  <div className="chat-bubble-meta" dir="rtl">
                    <span className="chat-time">{formatTime(msg.createdAt)}</span>
                    <svg viewBox="0 0 24 24" fill="none" width="12" height="12">
                      <path d="M20 6L9 17l-5-5" stroke="rgba(180,220,255,0.7)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
              {msg.role === "assistant" && (
                <div className="chat-msg-actions" dir="rtl">
                  <button className={`chat-act-btn ${copiedId === msg.id ? "active" : ""}`} onClick={() => copyText(msg.id, msg.content)} title="نسخ">
                    {copiedId === msg.id
                      ? <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M20 6L9 17l-5-5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      : <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><rect x="8" y="8" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" stroke="currentColor" strokeWidth="1.5"/></svg>
                    }
                  </button>
                  <button className="chat-act-btn" title="مشاركة">
                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/><circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/><circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="currentColor" strokeWidth="1.5"/></svg>
                  </button>
                  <button className="chat-act-btn" title="قراءة صوتية">
                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </button>
                  <button className="chat-act-btn" title="إعادة توليد" onClick={() => { if (!isStreaming && convId) sendMsg(convId, msgs[msgs.indexOf(msg) - 1]?.content ?? ""); }}>
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
              {msg.role === "assistant" && (
                <span className="chat-ai-time">{formatTime(msg.createdAt)}</span>
              )}
            </div>
          </div>
        ))}

        {/* Streaming bubble */}
        {isStreaming && (
          <div className="chat-msg-wrap ai">
            <div className="chat-avatar-wrap">
              <RobotAvatar size={32} />
            </div>
            <div className="chat-msg-col">
              <span className="chat-ai-label">ERKAN AI</span>
              <div className="chat-bubble ai-bubble">
                {streamingText
                  ? <MarkdownText text={streamingText} />
                  : <TypingDots />
                }
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Suggestions strip ── */}
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

      {/* ── Extra tools row ── */}
      <div className="chat-tools-row" dir="rtl">
        {[
          { icon: "🌐", label: "ترجمة", action: () => handleSuggestion("ترجم هذا النص لي") },
          { icon: "📄", label: "تحليل ملف", action: () => handleSuggestion("حلل هذا المحتوى") },
          { icon: "🎨", label: "إنشاء صورة", action: () => setShowProMax(true) },
          { icon: "···", label: "المزيد", action: () => {} },
        ].map(t => (
          <button key={t.label} className="chat-tool-chip" onClick={t.action}>
            <span className="chat-tool-chip-icon">{t.icon}</span>
            <span className="chat-tool-chip-label">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Input bar ── */}
      <div className="chat-input-bar">
        <div className="chat-input-wrap">
          <button className="chat-input-mic" aria-label="mic">
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
              <rect x="9" y="2" width="6" height="11" rx="3" stroke="white" strokeWidth="1.8" />
              <path d="M5 10a7 7 0 0 0 14 0" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="12" y1="17" x2="12" y2="21" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>

          <textarea
            ref={textareaRef}
            className="chat-input"
            placeholder="اكتب رسالتك هنا..."
            dir="rtl"
            rows={1}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
          />

          {isStreaming ? (
            <button className="chat-stop-btn" onClick={handleStop} aria-label="stop">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              className={`chat-send-btn ${input.trim() ? "active" : ""}`}
              onClick={handleSend}
              disabled={!input.trim()}
              aria-label="send"
            >
              <svg viewBox="0 0 24 24" fill="none" width="17" height="17">
                <path d="M22 2L11 13" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M22 2L15 22l-4-9-9-4 20-7z" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Bottom nav ── */}
      <nav className="chat-bottom-nav">
        <button className="chat-nav-btn" onClick={onBack} dir="rtl">
          <svg viewBox="0 0 24 24" fill="none" width="22" height="22"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>
          <span className="chat-nav-label">الرئيسية</span>
        </button>
        <button className="chat-nav-btn" dir="rtl">
          <svg viewBox="0 0 24 24" fill="none" width="22" height="22"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>
          <span className="chat-nav-label">المحادثات</span>
        </button>
        <button className="chat-nav-center" onClick={handleNewChat} aria-label="new chat">
          <div className="chat-nav-center-ring" />
          <img src="/erkan-ai-logo.png" alt="EA" className="chat-nav-center-img" />
        </button>
        <button className="chat-nav-btn" dir="rtl">
          <svg viewBox="0 0 24 24" fill="none" width="22" height="22"><path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>
          <span className="chat-nav-label">الأدوات</span>
        </button>
        <button className="chat-nav-btn" dir="rtl">
          <svg viewBox="0 0 24 24" fill="none" width="22" height="22"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.6"/></svg>
          <span className="chat-nav-label">الملف الشخصي</span>
        </button>
      </nav>
    </div>
  );
}
