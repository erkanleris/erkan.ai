import { useState, useEffect, useRef, useCallback } from "react";
import {
  createConversation,
  getMessages,
  streamMessage,
  type Message,
  type Conversation,
} from "../lib/api";

interface Props {
  onBack: () => void;
  conversationId?: number;
  initialMessage?: string;
  mode?: string;
}

const MODE_LABELS: Record<string, string> = {
  chat: "محادثة ذكية",
  write: "كتابة نصوص",
  summarize: "تلخيص",
  ideas: "أفكار وإلهام",
  image: "توليد صور",
};

const MODE_PLACEHOLDERS: Record<string, string> = {
  chat: "اكتب رسالتك هنا...",
  write: "صف ما تريد كتابته...",
  summarize: "الصق النص للتلخيص...",
  ideas: "أخبرني عن موضوعك...",
  image: "صف الصورة التي تريدها...",
};

function TypingDots() {
  return (
    <div className="chat-typing-dots">
      <span /><span /><span />
    </div>
  );
}

function MarkdownText({ text }: { text: string }) {
  const formatted = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br/>");
  return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
}

export default function ChatScreen({ onBack, conversationId: initialConvId, initialMessage, mode = "chat" }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [convId, setConvId] = useState<number | null>(initialConvId ?? null);
  const [currentMode] = useState(mode);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      if (initialConvId) {
        const msgs = await getMessages(initialConvId);
        setMessages(msgs as Message[]);
      } else if (initialMessage) {
        const conv = await createConversation(initialMessage.slice(0, 60), currentMode);
        setConvId(conv.id);
        sendMsg(conv.id, initialMessage);
      }
    };
    init().catch(console.error);
  }, []);

  const sendMsg = useCallback((cid: number, text: string) => {
    const userMsg: Message = {
      id: Date.now(),
      conversationId: cid,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    setStreamingText("");

    const abort = new AbortController();
    abortRef.current = abort;

    let full = "";
    streamMessage(
      cid,
      text,
      currentMode,
      (chunk) => { full += chunk; setStreamingText(full); },
      () => {
        setIsStreaming(false);
        setStreamingText("");
        const aiMsg: Message = {
          id: Date.now() + 1,
          conversationId: cid,
          role: "assistant",
          content: full,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      },
      (err) => {
        setIsStreaming(false);
        setStreamingText("");
        const errMsg: Message = {
          id: Date.now() + 1,
          conversationId: cid,
          role: "assistant",
          content: `عذراً، حدث خطأ: ${err}`,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errMsg]);
      },
      abort.signal
    );
  }, [currentMode]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    let cid = convId;
    if (!cid) {
      const conv = await createConversation(text.slice(0, 60), currentMode);
      setConvId(conv.id);
      cid = conv.id;
    }
    sendMsg(cid, text);
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setStreamingText("");
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

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <div className="chat-root">
      <div className="chat-bg" />

      {/* Header */}
      <header className="chat-header">
        <button className="chat-back-btn" onClick={onBack} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="chat-header-center" dir="rtl">
          <span className="chat-mode-label">{MODE_LABELS[currentMode] ?? "محادثة"}</span>
          <span className="chat-online-dot" />
          <span className="chat-online-text">متصل</span>
        </div>
        <button className="chat-new-btn" onClick={() => { setMessages([]); setConvId(null); }} aria-label="New chat">
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 && !isStreaming && (
          <div className="chat-welcome" dir="rtl">
            <div className="chat-welcome-logo">
              <img src="/erkan-ai-logo.png" alt="EA" width="60" height="60" style={{ borderRadius: 16 }} />
            </div>
            <h2 className="chat-welcome-title">{MODE_LABELS[currentMode]}</h2>
            <p className="chat-welcome-sub">
              {currentMode === "chat" && "اسألني أي شيء، أنا هنا لمساعدتك بلهجتك العربية"}
              {currentMode === "write" && "أخبرني ماذا تريد أن أكتب لك، مقال أو منشور أو محتوى"}
              {currentMode === "summarize" && "الصق النص الذي تريد تلخيصه"}
              {currentMode === "ideas" && "أخبرني عن موضوعك وسأقدم لك أفكاراً إبداعية"}
              {currentMode === "image" && "صف الصورة التي تريد إنشاؤها بالتفصيل"}
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`chat-msg-wrap ${msg.role === "user" ? "user" : "ai"}`}>
            {msg.role === "assistant" && (
              <div className="chat-avatar">
                <img src="/erkan-ai-logo.png" alt="EA" width="28" height="28" style={{ borderRadius: 8 }} />
              </div>
            )}
            <div className={`chat-bubble ${msg.role === "user" ? "user-bubble" : "ai-bubble"}`} dir="rtl">
              <MarkdownText text={msg.content} />
              {msg.role === "assistant" && (
                <div className="chat-bubble-actions">
                  <button className="chat-action-btn" onClick={() => copyText(msg.content)} title="نسخ">
                    <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                      <rect x="8" y="8" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isStreaming && (
          <div className="chat-msg-wrap ai">
            <div className="chat-avatar">
              <img src="/erkan-ai-logo.png" alt="EA" width="28" height="28" style={{ borderRadius: 8 }} />
            </div>
            <div className="chat-bubble ai-bubble" dir="rtl">
              {streamingText ? <MarkdownText text={streamingText} /> : <TypingDots />}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="chat-input-bar">
        <div className="chat-input-wrap">
          <textarea
            ref={textareaRef}
            className="chat-input"
            placeholder={MODE_PLACEHOLDERS[currentMode] ?? "اكتب هنا..."}
            dir="rtl"
            rows={1}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
          />
          {isStreaming ? (
            <button className="chat-stop-btn" onClick={handleStop} aria-label="Stop">
              <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
              </svg>
            </button>
          ) : (
            <button
              className={`chat-send-btn ${input.trim() ? "active" : ""}`}
              onClick={handleSend}
              disabled={!input.trim()}
              aria-label="Send"
            >
              <svg viewBox="0 0 24 24" fill="none" width="17" height="17">
                <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <path d="M22 2L15 22l-4-9-9-4 20-7z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
        <p className="chat-input-hint" dir="rtl">ERKAN AI · اضغط Enter للإرسال</p>
      </div>
    </div>
  );
}
