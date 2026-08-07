import { useState, useEffect, useRef, useCallback } from "react";
import {
  createConversation, getMessages, streamMessage, generateImage,
  type Message, type User,
} from "../lib/api";
import { useLang } from "../lib/i18n";
import { Copy, Share, RefreshCw, ThumbsUp, ThumbsDown, Globe, FileText, Image as ImageIcon, PlusCircle, Crown, AlertTriangle, Send, Download, Sparkles, Check } from "lucide-react";

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
function MarkdownText({ text, dir }: { text: string; dir: string }) { return <div className="md-root" dir={dir} dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }} />; }
function TypingDots() { return <div className="chat-typing-dots"><span /><span /><span /></div>; }
function RobotAvatar({ size = 28 }: { size?: number }) {
  return <svg viewBox="0 0 40 40" width={size} height={size} fill="none"><rect width="40" height="40" rx="10" fill="url(#rgrad)" /><rect x="11" y="14" width="18" height="14" rx="3" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" /><circle cx="16" cy="20" r="2.5" fill="#1E88FF" /><circle cx="24" cy="20" r="2.5" fill="#1E88FF" /><circle cx="16" cy="20" r="1" fill="#fff" /><circle cx="24" cy="20" r="1" fill="#fff" /><rect x="15" y="24" width="10" height="1.5" rx="0.75" fill="rgba(255,255,255,0.4)" /><rect x="18" y="10" width="4" height="4" rx="1" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" /><circle cx="20" cy="10" r="1" fill="#8A2EFF" /><rect x="8" y="17" width="3" height="6" rx="1.5" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" /><rect x="29" y="17" width="3" height="6" rx="1.5" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" /><defs><linearGradient id="rgrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse"><stop stopColor="#1a2a5e" /><stop offset="1" stopColor="#2d1060" /></linearGradient></defs></svg>;
}

function ProMaxPopup({ onClose, onNavigate, t, isRtl }: { onClose: () => void; onNavigate?: (s: string) => void; t: any; isRtl: boolean }) {
  return (
    <div className="promax-overlay" onClick={onClose}>
      <div className="promax-modal" onClick={e => e.stopPropagation()} dir={isRtl ? "rtl" : "ltr"}>
        <div className="promax-glow" />
        <div className="text-5xl mb-3 text-purple-400"><Crown /></div>
        <h2 className="promax-title">{t("exclusive")}</h2>
        <p className="promax-desc">{t("promaxImgDesc")}</p>
        <div className="promax-features">
          {[t("featImg1"), t("featImg2"), t("featImg3"), t("featImg4")].map(f => <div key={f} className="promax-feat">{f}</div>)}
        </div>
        <button className="promax-upgrade-btn" onClick={() => { onClose(); onNavigate?.("plans"); }}>{t("upgradeNow")}</button>
        <button className="promax-close-btn" onClick={onClose}>{t("notNow")}</button>
      </div>
    </div>
  );
}

function LimitReachedPopup({ onClose, onNavigate, plan, t, isRtl }: { onClose: () => void; onNavigate?: (s: string) => void; plan?: string; t: any; isRtl: boolean }) {
  return (
    <div className="promax-overlay" onClick={onClose}>
      <div className="promax-modal" onClick={e => e.stopPropagation()} dir={isRtl ? "rtl" : "ltr"}>
        <div className="promax-glow" style={{ background: "radial-gradient(circle, rgba(239,68,68,0.3) 0%, transparent 70%)" }} />
        <div className="text-5xl mb-3 text-red-500"><AlertTriangle /></div>
        <h2 className="promax-title">{t("limitTitle")}</h2>
        <p className="promax-desc">
          {plan === "free" ? t("freeLimit") : t("proLimit")}
        </p>
        <button className="promax-upgrade-btn" onClick={() => { onClose(); onNavigate?.("plans"); }}>{t("upgradeBtn")}</button>
        <button className="promax-close-btn" onClick={onClose}>{t("later")}</button>
      </div>
    </div>
  );
}

const getSuggestions = (mode: string, t: any) => {
  if (mode === "write") return [t("sugWrite1"), t("sugWrite2"), t("sugWrite3"), t("sugWrite4")];
  if (mode === "summarize") return [t("sugSum1"), t("sugSum2"), t("sugSum3"), t("sugSum4")];
  if (mode === "ideas") return [t("sugIdeas1"), t("sugIdeas2"), t("sugIdeas3"), t("sugIdeas4")];
  if (mode === "image") return [t("sugImg1"), t("sugImg2"), t("sugImg3"), t("sugImg4")];
  return [t("sugChat1"), t("sugChat2"), t("sugChat3"), t("sugChat4")];
};

export default function ChatScreen({ onBack, conversationId: initialConvId, initialMessage, mode = "chat", user, onNavigate }: Props) {
  const { t, locale, formatTime } = useLang();
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

  const isRtl = locale !== "turkish";

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
          setMsgs(prev => [...prev, { id: Date.now() + 1, conversationId: cid, role: "assistant", content: `Error: ${err}`, createdAt: new Date().toISOString() }]);
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

  const suggestions = getSuggestions(currentMode, t);
  const showSuggestions = msgs.length === 0 && !isStreaming;
  const isProMax = user?.subscriptionType === "pro_max";

  return (
    <div className="chat-root">
      <div className="chat-bg" />
      {showProMax && <ProMaxPopup onClose={() => setShowProMax(false)} onNavigate={onNavigate} t={t} isRtl={isRtl} />}
      {showLimit && <LimitReachedPopup onClose={() => setShowLimit(false)} onNavigate={onNavigate} plan={limitPlan} t={t} isRtl={isRtl} />}

      <header className="chat-header" dir={isRtl ? "rtl" : "ltr"}>
        <button className="chat-icon-btn" onClick={onBack} aria-label="back">
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <div className="chat-header-brand" dir="ltr">
          <img src="/erkan-ai-logo.png" alt="EA" className="chat-header-logo" />
          <span className="chat-hb-erkan">ERKAN</span><span className="chat-hb-ai"> AI</span>
        </div>
        <button className="chat-icon-btn" onClick={handleNewChat} aria-label="new chat" title={t("newTool")}>
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
      </header>

      <div className="chat-ai-card" dir={isRtl ? "rtl" : "ltr"}>
        <div className="chat-ai-avatar"><RobotAvatar size={44} /><span className="chat-ai-online-ring" /></div>
        <div className="chat-ai-info">
          <div className="chat-ai-name">ERKAN AI</div>
          <div className="chat-ai-status"><span className="chat-online-dot" /><span className="chat-ai-status-text">{t("aiStatus")}</span></div>
        </div>
        <div className="chat-ai-model-badge">
          <span className="chat-ai-model-label">{t("smartModel")}</span>
          <span className="chat-ai-model-name">ERKAN AI</span>
        </div>
        {user && (
          <div className={`chat-plan-badge plan-badge-${user.subscriptionType}`}>
            {user.subscriptionType === "free" ? t("freePlan") : user.subscriptionType === "pro" ? "PRO" : "PRO MAX"}
          </div>
        )}
      </div>

      <div className="chat-messages" dir={isRtl ? "rtl" : "ltr"}>
        {msgs.length === 0 && !isStreaming && (
          <div className="chat-welcome">
            <div className="chat-welcome-avatar"><RobotAvatar size={64} /><div className="chat-welcome-pulse" /></div>
            <h2 className="chat-welcome-title">{t("chatWelcTitle")}</h2>
            <p className="chat-welcome-sub">{t("chatWelcSub")}</p>
          </div>
        )}

        {currentMode === "image" && generatedImage && (
          <div className="chat-generated-image-wrap">
            <p className="chat-gen-img-label">{t("genImgLabel")}</p>
            <img src={generatedImage} alt="Generated" className="chat-generated-image" />
            <button className="chat-gen-img-dl" onClick={() => { const a = document.createElement("a"); a.href = generatedImage!; a.download = "erkan-ai-image.png"; a.click(); }}>
              <Download size={16} /> {t("dlImg")}
            </button>
          </div>
        )}

        {currentMode === "image" && imageLoading && (
          <div className="chat-image-loading">
            <div className="chat-image-loading-spinner" />
            <p>{t("generatingImg")}</p>
          </div>
        )}

        {msgs.map((msg) => (
          <div key={msg.id} className={`chat-msg-wrap ${msg.role === "user" ? "user" : "ai"}`}>
            {msg.role === "assistant" && <div className="chat-avatar-wrap"><RobotAvatar size={32} /></div>}
            <div className="chat-msg-col">
              {msg.role === "assistant" && <span className="chat-ai-label">ERKAN AI</span>}
              <div className={`chat-bubble ${msg.role === "user" ? "user-bubble" : "ai-bubble"}`}>
                {msg.role === "user" ? <div className="chat-user-text" dir={isRtl ? "rtl" : "ltr"}>{msg.content}</div> : <MarkdownText text={msg.content} dir={isRtl ? "rtl" : "ltr"} />}
                {msg.role === "user" && (
                  <div className="chat-bubble-meta" dir={isRtl ? "rtl" : "ltr"}>
                    <span className="chat-time">{formatTime(msg.createdAt)}</span>
                    <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M20 6L9 17l-5-5" stroke="rgba(180,220,255,0.7)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                )}
              </div>
              {msg.role === "assistant" && (
                <div className="chat-msg-actions" dir={isRtl ? "rtl" : "ltr"}>
                  <button className={`chat-act-btn ${copiedId === msg.id ? "active" : ""}`} onClick={() => copyText(msg.id, msg.content)} title={t("copy")}>
                    {copiedId === msg.id ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
                  </button>
                  <button className="chat-act-btn" title={t("share")} onClick={() => { if (navigator.share) navigator.share({ text: msg.content }).catch(() => {}); else copyText(msg.id, msg.content); }}>
                    <Share size={14} />
                  </button>
                  <button className="chat-act-btn" title={t("regenerate")} onClick={() => { if (!isStreaming && convId) { const prev = msgs[msgs.indexOf(msg) - 1]; if (prev) sendMsg(convId, prev.content); } }}>
                    <RefreshCw size={14} />
                  </button>
                  <div className="chat-act-divider" />
                  <button className={`chat-act-btn ${likedIds.has(msg.id) ? "liked" : ""}`} onClick={() => toggleLike(msg.id)} title={t("like")}>
                    <ThumbsUp size={14} className={likedIds.has(msg.id) ? "fill-[#1E88FF] text-[#1E88FF]" : ""} />
                  </button>
                  <button className={`chat-act-btn ${dislikedIds.has(msg.id) ? "disliked" : ""}`} onClick={() => toggleDislike(msg.id)} title={t("dislike")}>
                    <ThumbsDown size={14} className={dislikedIds.has(msg.id) ? "fill-red-500 text-red-500" : ""} />
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
              <div className="chat-bubble ai-bubble">{streamingText ? <MarkdownText text={streamingText} dir={isRtl ? "rtl" : "ltr"} /> : <TypingDots />}</div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {showSuggestions && (
        <div className="chat-suggestions-wrap" dir={isRtl ? "rtl" : "ltr"}>
          <div className="chat-suggestions">
            {suggestions.map(s => (
              <button key={s} className="chat-suggestion-chip" onClick={() => handleSuggestion(s)}>
                <Sparkles size={14} className="chip-star" /> {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="chat-tools-row" dir={isRtl ? "rtl" : "ltr"}>
        {[
          { icon: <Globe size={16} />, label: t("transTool"), action: () => handleSuggestion(t("transAction")) },
          { icon: <FileText size={16} />, label: t("analyzeTool"), action: () => handleSuggestion(t("analyzeAction")) },
          { icon: <ImageIcon size={16} />, label: t("imgTool"), action: () => { if (!isProMax) setShowProMax(true); else if (input.trim()) handleSend(); } },
          { icon: <PlusCircle size={16} />, label: t("newTool"), action: handleNewChat },
        ].map(tObj => (
          <button key={tObj.label} className="chat-tool-chip" onClick={tObj.action}>
            <span className="chat-tool-chip-icon">{tObj.icon}</span>
            <span className="chat-tool-chip-label">{tObj.label}</span>
          </button>
        ))}
      </div>

      <div className="chat-input-bar">
        <div className="chat-input-wrap" dir={isRtl ? "rtl" : "ltr"}>
          <button className="chat-input-mic" aria-label="mic" onClick={() => onNavigate?.("chat", { mode: currentMode })}>
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><rect x="9" y="2" width="6" height="11" rx="3" stroke="white" strokeWidth="1.8" /><path d="M5 10a7 7 0 0 0 14 0" stroke="white" strokeWidth="1.8" strokeLinecap="round" /><line x1="12" y1="17" x2="12" y2="21" stroke="white" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </button>
          <textarea ref={textareaRef} className="chat-input" placeholder={currentMode === "image" ? t("imgInput") : t("chatInput")} rows={1} value={input} onChange={handleTextareaChange} onKeyDown={handleKeyDown} />
          {isStreaming
            ? <button className="chat-stop-btn" onClick={handleStop} aria-label="stop"><svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><rect x="6" y="6" width="12" height="12" rx="2" /></svg></button>
            : <button className={`chat-send-btn ${input.trim() ? "active" : ""}`} onClick={handleSend} disabled={!input.trim()} aria-label="send"><Send size={16} className={isRtl ? "rotate-180" : ""} color="#fff" /></button>}
        </div>
      </div>
    </div>
  );
}
