/**
 * BlueprintChatWidget - Construction AI Assistant
 * 
 * Widget chatbot interaktif dengan tema blueprint/technical construction.
 * Menggunakan framer-motion untuk animasi yang smooth dan construction-themed.
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, X, Minimize2, Maximize2, Loader2, Sparkles, Clock, FileText } from "lucide-react";
import clsx from "clsx";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface BlueprintChatProps {
  enabled?: boolean;
  defaultOpen?: boolean;
  accentColor?: string;
}

// Blueprint grid pattern
const BlueprintGrid = ({ className = "" }: { className?: string }) => (
  <svg
    className={clsx("absolute inset-0 w-full h-full opacity-[0.03]", className)}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern id="blueprint-grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path
          d="M 40 0 L 0 0 0 40"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#blueprint-grid)" />
  </svg>
);

// Construction loading indicator
const ConstructionLoader = () => (
  <div className="flex items-center gap-2 px-4 py-3">
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-cyan-400 rounded-full"
          animate={{
            y: [0, -6, 0],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
    <span className="text-xs text-slate-400 font-mono">
      <motion.span
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        Membangun respons...
      </motion.span>
    </span>
  </div>
);

// Typing animation for assistant response
const TypingIndicator = ({ text }: { text: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl rounded-tl-sm border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 max-w-[85%]"
    >
      <div className="flex items-center gap-2 mb-2">
        <FileText size={14} className="text-cyan-400" />
        <span className="text-[10px] uppercase tracking-widest text-cyan-400/60 font-mono">
          blueprint.doc
        </span>
      </div>
      <div className="text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">
        {text}
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="inline-block ml-1 w-2 h-4 bg-cyan-400/60"
        />
      </div>
    </motion.div>
  );
};

export function BlueprintChatWidget({
  enabled = true,
  defaultOpen = false,
  accentColor = "#67e8f9",
}: BlueprintChatProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const streamingRef = useRef(false);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, displayedText]);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `_selamat datang di SANATA CONSTRUCTION_

🏗️ *Asisten Virtual* — saya siap membantu Anda soal rencana bangun dan renovasi.

Silakan tanyakan apa saja, atau pilih topik di bawah:

📋 *Renovasi Rumah* — estimate biaya & timeline
🔧 *Layanan* — apa saja yang kami tawarkan  
📍 *Survei Lokasi* — bagaimana prosesnya
💬 *Konsultasi* — jadwal bicara dengan tim kami`,
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  // Send message to AI
  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim() || isTyping) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setError(null);
    setDisplayedText("");

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Page-Title": document.title,
          "X-Page-URL": window.location.href,
        },
        body: JSON.stringify({
          messages: messages
            .filter((m) => m.id !== "welcome")
            .concat([userMsg])
            .map((m) => ({
              role: m.role,
              content: m.content,
            })),
          temperature: 0.7,
          maxTokens: 800,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Gagal mengirim pesan");
      }

      const data = await response.json();
      const assistantContent = data.data?.content || "Maaf, saya tidak dapat memproses permintaan Anda saat ini.";

      // Typewriter effect
      streamingRef.current = true;
      let currentText = "";
      for (const char of assistantContent) {
        if (!streamingRef.current) break;
        currentText += char;
        setDisplayedText(currentText);
        await new Promise((resolve) => setTimeout(resolve, 15 + Math.random() * 20));
      }

      if (streamingRef.current) {
        const assistantMsg: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: assistantContent,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setDisplayedText("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsTyping(false);
      streamingRef.current = false;
    }
  }, [messages, isTyping]);

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isTyping) {
      sendMessage(input.trim());
    }
  };

  // Handle keyboard
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Quick actions
  const quickActions = [
    { label: "Estimasi Biaya", action: "Bagaimana estimasi biaya renovasi rumah 2 lantai?" },
    { label: "Layanan", action: "Layanan apa saja yang ditawarkan Sanata?" },
    { label: "Proses", action: "Bagaimana proses pengerjaan proyek?" },
  ];

  if (!enabled) return null;

  return (
    <>
      {/* Blueprint floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 left-6 z-50 group"
            aria-label="Buka asisten virtual"
          >
            <div className="relative">
              {/* Pulse ring */}
              <motion.div
                className="absolute inset-0 rounded-full bg-cyan-400/20"
                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              {/* Button */}
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-cyan-400/50 bg-slate-950/95 shadow-[0_8px_32px_rgba(103,232,249,0.25)] backdrop-blur-xl transition-all group-hover:border-cyan-400 group-hover:shadow-[0_8px_48px_rgba(103,232,249,0.4)]">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Bot size={24} className="text-cyan-400" />
                </motion.div>
                
                {/* Online indicator */}
                <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                </span>
              </div>
            </div>
            
            {/* Label */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              whileHover={{ opacity: 1, x: 0 }}
              className="absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-cyan-400/30 bg-slate-950/95 px-3 py-1.5 text-sm text-cyan-300 backdrop-blur-xl"
            >
              <span className="flex items-center gap-2">
                <Sparkles size={14} />
                Blueprint Assistant
              </span>
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-24 left-4 z-50 w-[min(22rem,calc(100vw-2rem))] md:bottom-28 md:left-8"
          >
            <div className="flex flex-col overflow-hidden rounded-3xl border border-cyan-400/20 bg-slate-950/95 shadow-[0_25px_80px_rgba(0,0,0,0.5),0_0_40px_rgba(103,232,249,0.1)] backdrop-blur-xl">
              {/* Blueprint header */}
              <div className="relative overflow-hidden border-b border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 to-transparent px-5 py-4">
                <BlueprintGrid className="text-cyan-400" />
                
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Construction icon */}
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/10">
                        <Bot size={20} className="text-cyan-400" />
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                      </span>
                    </div>
                    
                    <div>
                      <h2 className="text-sm font-semibold text-white font-mono tracking-wide">
                        BLUEPRINT ASSISTANT
                      </h2>
                      <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Clock size={10} />
                        <span className="font-mono">ONLINE</span>
                        <span className="mx-1 opacity-30">|</span>
                        <span>Sanata Construction</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setIsMinimized(true)}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
                      aria-label="Minimize"
                    >
                      <Minimize2 size={16} />
                    </button>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
                      aria-label="Close"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                
                {/* Blueprint decoration line */}
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
                  animate={{ opacity: [0.3, 0.8, 0.3], x: [-100, 100, -100] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[28rem] min-h-[20rem]">
                <BlueprintGrid className="text-cyan-400/20" />
                
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={clsx(
                      "flex gap-3",
                      message.role === "user" && "flex-row-reverse"
                    )}
                  >
                    {/* Avatar */}
                    <div
                      className={clsx(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        message.role === "user"
                          ? "bg-cyan-500/20 text-cyan-400"
                          : "bg-slate-800 text-slate-400"
                      )}
                    >
                      {message.role === "user" ? <User size={14} /> : <Bot size={14} />}
                    </div>
                    
                    {/* Message bubble */}
                    <div
                      className={clsx(
                        "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                        message.role === "user"
                          ? "rounded-tr-sm bg-cyan-500/20 text-white border border-cyan-400/20"
                          : "rounded-tl-sm bg-slate-800/80 text-slate-200 border border-slate-700/50"
                      )}
                    >
                      {/* Blueprint file header for assistant */}
                      {message.role === "assistant" && message.id !== "welcome" && (
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700/50">
                          <FileText size={12} className="text-cyan-400/60" />
                          <span className="text-[10px] uppercase tracking-widest text-cyan-400/40 font-mono">
                            blueprint.doc
                          </span>
                        </div>
                      )}
                      
                      {/* Content with markdown-like formatting */}
                      <div className="whitespace-pre-wrap">
                        {message.content.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).map((part, i) => {
                          if (part.startsWith("**") && part.endsWith("**")) {
                            return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
                          }
                          if (part.startsWith("*") && part.endsWith("*")) {
                            return <em key={i} className="text-cyan-300">{part.slice(1, -1)}</em>;
                          }
                          if (part.startsWith("`") && part.endsWith("`")) {
                            return <code key={i} className="px-1.5 py-0.5 rounded bg-slate-900/80 text-cyan-300 font-mono text-xs">{part.slice(1, -1)}</code>;
                          }
                          return part;
                        })}
                      </div>
                      
                      {/* Timestamp */}
                      <div className="mt-2 text-[10px] text-slate-500 font-mono">
                        {message.timestamp.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Typing indicator */}
                {isTyping && displayedText && (
                  <TypingIndicator text={displayedText} />
                )}
                
                {/* Loading indicator */}
                {isTyping && !displayedText && (
                  <ConstructionLoader />
                )}

                {/* Error message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-xs text-red-300"
                  >
                    ⚠️ {error}
                  </motion.div>
                )}

                {/* Quick actions */}
                {!isTyping && messages.length <= 2 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">
                      // Quick Actions
                    </p>
                    <div className="grid gap-2">
                      {quickActions.map((action, i) => (
                        <motion.button
                          key={action.label}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          onClick={() => sendMessage(action.action)}
                          className="flex items-center gap-2 rounded-lg border border-cyan-400/20 bg-cyan-500/5 px-3 py-2 text-left text-xs text-slate-300 transition-colors hover:border-cyan-400/40 hover:bg-cyan-500/10"
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded border border-cyan-400/30 bg-cyan-500/10 text-[10px] text-cyan-400 font-mono">
                            {i + 1}
                          </span>
                          {action.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="border-t border-cyan-400/10 p-4">
                <form onSubmit={handleSubmit} className="relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ketik pertanyaan Anda..."
                    disabled={isTyping}
                    rows={1}
                    className="w-full resize-none rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 py-3 pr-12 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50"
                  />
                  
                  <button
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-cyan-400 transition-colors disabled:opacity-30 hover:bg-cyan-400/10 disabled:hover:bg-transparent"
                  >
                    {isTyping ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </form>
                
                <p className="mt-2 text-center text-[10px] text-slate-500">
                  <span className="font-mono">Powered by </span>
                  <span className="text-cyan-400/60">SANATA</span>
                  <span className="mx-1 opacity-30">×</span>
                  <span className="text-cyan-400/40">BluePack AI</span>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimized state */}
      <AnimatePresence>
        {isOpen && isMinimized && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => setIsMinimized(false)}
            className="fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-full border border-cyan-400/30 bg-slate-950/95 px-4 py-2 text-sm text-cyan-300 shadow-lg backdrop-blur-xl transition-colors hover:border-cyan-400/50"
          >
            <Bot size={16} />
            <span className="font-mono">BLUEPRINT</span>
            <Maximize2 size={14} />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}

export default BlueprintChatWidget;
