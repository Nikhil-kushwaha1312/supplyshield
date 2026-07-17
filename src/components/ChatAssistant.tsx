import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Trash2, User, Bot } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ChatMessage {
  sender: "user" | "bot";
  text: string;
}

const SHORTCUTS = [
  "Which warehouse is most vulnerable?",
  "Suggest alternate suppliers.",
  "What if Mumbai Port closes?",
  "Predict next month's risk.",
  "Optimize routes for Diwali surge.",
];

function TypingIndicator() {
  return (
    <div className="flex gap-2.5 items-end">
      <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)" }}>
        <Sparkles className="h-3.5 w-3.5" style={{ color: "#818cf8" }} />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-bl-sm" style={{ background: "rgba(15,23,42,0.7)", border: "1px solid rgba(51,65,85,0.5)" }}>
        <div className="flex items-center gap-1.5">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>
    </div>
  );
}

export default function ChatAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "bot",
      text: "Greetings. I am ShieldBot, your AI Supply Chain Resilience Consultant. Ask me anything about bottlenecks, weather vulnerabilities, alternate routes, or active stress test anomalies in India's logistics grid.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;
    const updatedMessages = [...messages, { sender: "user", text: textToSend } as ChatMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages, userMessage: textToSend }),
      });
      const data = await response.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { sender: "bot", text: data.reply }]);
      } else {
        setMessages((prev) => [...prev, { sender: "bot", text: "Communication protocols encountered an unexpected delay. Please verify your connection or active parameters." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { sender: "bot", text: "Neural relays failed to respond. Please ensure GEMINI_API_KEY is configured in your platform secrets." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(input);
    }
  };

  return (
    <div className="glass rounded-2xl flex flex-col overflow-hidden" style={{ height: 580 }}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(51,65,85,0.4)" }}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(217,70,239,0.3))", border: "1px solid rgba(99,102,241,0.35)" }}>
              <Sparkles className="h-4 w-4" style={{ color: "#a5b4fc" }} />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-900" style={{ background: "#10b981", boxShadow: "0 0 6px #10b981" }} />
          </div>
          <div>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.01em" }}>
              ShieldBot Decision Co-Pilot
            </h3>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#34d399", fontWeight: 600 }}>
              ● Online · Gemini Flash Active
            </span>
          </div>
        </div>

        <button
          onClick={() => setMessages([{ sender: "bot", text: "Session cleared. How can I assist you with logistics risk modeling?" }])}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all duration-150"
          style={{ color: "#475569", fontFamily: "'JetBrains Mono', monospace" }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#475569"; }}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>

      {/* ── Messages ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => {
            const isUser = msg.sender === "user";
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className={`flex items-end gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={
                    isUser
                      ? { background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.35)" }
                      : { background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }
                  }
                >
                  {isUser
                    ? <User className="h-3.5 w-3.5" style={{ color: "#818cf8" }} />
                    : <Sparkles className="h-3.5 w-3.5" style={{ color: "#818cf8" }} />
                  }
                </div>

                {/* Bubble */}
                <div
                  className="max-w-[78%] px-4 py-3 rounded-2xl"
                  style={
                    isUser
                      ? {
                        background: "linear-gradient(135deg, rgba(79,70,229,0.25), rgba(99,102,241,0.15))",
                        border: "1px solid rgba(99,102,241,0.3)",
                        borderBottomRightRadius: 4,
                      }
                      : {
                        background: "rgba(15,23,42,0.7)",
                        border: "1px solid rgba(51,65,85,0.5)",
                        borderBottomLeftRadius: 4,
                      }
                  }
                >
                  <p style={{ fontSize: 12.5, lineHeight: 1.65, color: isUser ? "#e0e7ff" : "#cbd5e1", fontFamily: "'Inter', sans-serif", whiteSpace: "pre-wrap" }}>
                    {msg.text}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <TypingIndicator />
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Shortcuts ──────────────────────────────────────── */}
      <div className="px-4 py-2.5 flex-shrink-0" style={{ borderTop: "1px solid rgba(51,65,85,0.35)", background: "rgba(2,8,23,0.3)" }}>
        <span className="section-label block mb-2">Quick Questions</span>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {SHORTCUTS.map((sc, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(sc)}
              disabled={loading}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs cursor-pointer transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none"
              style={{
                background: "rgba(15,23,42,0.6)",
                border: "1px solid rgba(51,65,85,0.5)",
                color: "#64748b",
                fontFamily: "'Inter', sans-serif",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.color = "#a5b4fc";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(99,102,241,0.4)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.color = "#64748b";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(51,65,85,0.5)";
              }}
            >
              {sc}
            </button>
          ))}
        </div>
      </div>

      {/* ── Input ──────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="px-4 py-3.5 flex gap-2.5 flex-shrink-0" style={{ borderTop: "1px solid rgba(51,65,85,0.4)" }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder="Ask about bottlenecks, risks, alternate routes…"
          className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-150"
          style={{
            background: "rgba(2,8,23,0.7)",
            border: "1px solid rgba(51,65,85,0.6)",
            color: "#e2e8f0",
            fontFamily: "'Inter', sans-serif",
            fontSize: 12.5,
          }}
          onFocus={e => { e.target.style.borderColor = "rgba(99,102,241,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
          onBlur={e => { e.target.style.borderColor = "rgba(51,65,85,0.6)"; e.target.style.boxShadow = "none"; }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-150 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: input.trim() && !loading ? "linear-gradient(135deg, #4f46e5, #7c3aed)" : "rgba(51,65,85,0.3)",
            boxShadow: input.trim() && !loading ? "0 2px 12px rgba(99,102,241,0.3)" : "none",
          }}
        >
          <Send className="h-4 w-4 text-white" />
        </button>
      </form>
    </div>
  );
}
