import { useState, useRef, useEffect } from "react";
import { Send, Loader2, ShieldCheck, AlertTriangle, Terminal as TerminalIcon } from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { CommandSafety, ArchCommand } from "@/src/types";
import { useLanguage } from "@/src/lib/i18n";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const ARCH_SYSTEM_PROMPT = `You are the Arch Linux AI Assistant. Your goal is to help users manage their Arch Linux system.
Always provide commands using standard Arch Linux tools (pacman, systemctl, journalctl, ip, etc.).

For every request that involves a command, you MUST return a response that includes one or more command blocks.
Also, classify the safety of the command:
- SOFT: Informational or read-only (e.g., ip addr, pacman -Qs)
- MODERATE: System changes that require confirmation (e.g., pacman -S, systemctl start)
- CRITICAL: Destructive or highly sensitive changes (e.g., rm -rf, mkfs, dd, modifying /etc/fstab)

SELF-GROWTH CAPABILITIES:
- If you learn something important about the user's setup (e.g. hostnames, specialized hardware, user preferences), you can save a "Memory Node".
- If you find a recurring complex workflow that can be simplified, you can save a "Skill".

FORMATS:
- [AUDIT]: {"command": "...", "safety": "...", "explanation": "..."}
- [MEMORY]: {"category": "...", "content": "...", "importance": 1-5} [OPTIONAL]
- [SKILL]: {"name": "...", "pattern": "...", "commands": "..."} [OPTIONAL]

IMPORTANT: Please respond in the same language as the user's request (English or Chinese).`;

export default function Console() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string; audit?: ArchCommand }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t, language } = useLanguage();

  const [memoryContext, setMemoryContext] = useState("");
  const [skillsContext, setSkillsContext] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/memory").then(res => res.json()),
      fetch("/api/skills").then(res => res.json())
    ]).then(([m, s]) => {
      if (Array.isArray(m)) setMemoryContext(JSON.stringify(m.slice(0, 5)));
      if (Array.isArray(s)) setSkillsContext(JSON.stringify(s.slice(0, 5)));
    });
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const fullPrompt = `${ARCH_SYSTEM_PROMPT}\n\nCURRENT CONTEXT:\nPersistent Memory: ${memoryContext}\nLearned Skills: ${skillsContext}`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [...messages.map(m => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.content }] })), { role: "user", parts: [{ text: userMessage }] }],
        config: {
          systemInstruction: fullPrompt,
        },
      });

      const responseText = result.text || (language === "en" ? "Sorry, I couldn't generate a response." : "抱歉，我无法生成回复。");
      
      // Parse technical blocks
      let audit: ArchCommand | undefined;
      let cleanText = responseText;

      const auditMatch = responseText.match(/\[AUDIT\]:\s*(\{.*\})/);
      if (auditMatch) {
        try {
          audit = JSON.parse(auditMatch[1]);
          cleanText = cleanText.replace(/\[AUDIT\]:\s*\{.*\}/, "");
        } catch (e) {}
      }

      const memoryMatch = responseText.match(/\[MEMORY\]:\s*(\{.*\})/);
      if (memoryMatch) {
         try {
           const mem = JSON.parse(memoryMatch[1]);
           fetch("/api/memory", { 
             method: "POST", 
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify(mem) 
           });
           cleanText = cleanText.replace(/\[MEMORY\]:\s*\{.*\}/, "");
         } catch (e) {}
      }

      const skillMatch = responseText.match(/\[SKILL\]:\s*(\{.*\})/);
      if (skillMatch) {
        try {
          const skill = JSON.parse(skillMatch[1]);
          fetch("/api/skills", { 
            method: "POST", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(skill) 
          });
          cleanText = cleanText.replace(/\[SKILL\]:\s*\{.*\}/, "");
        } catch (e) {}
      }

      setMessages((prev) => [...prev, { role: "ai", content: cleanText, audit }]);

      // Save to history in background
      fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMessage, response: cleanText }),
      });

    } catch (error) {
      console.error("AI Error:", error);
      setMessages((prev) => [...prev, { role: "ai", content: language === "en" ? "Error communicating with the kernel (Gemini API). Please check your connection." : "与内核（Gemini API）通信时出错。请检查您的连接。" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Console Output */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-10 pr-4 custom-scrollbar pb-20"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30">
            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-700 flex items-center justify-center">
              <TerminalIcon size={40} className="text-arch-blue" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold tracking-tight text-white">{t("console.initialized")}</h3>
              <p className="text-sm max-w-sm text-arch-text-secondary">{t("console.welcome")}</p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex flex-col gap-4",
              msg.role === "user" ? "items-end" : "items-start"
            )}
          >
            {msg.role === "ai" && (
              <div className="flex items-center gap-2 text-[10px] font-bold text-arch-blue uppercase tracking-widest pl-2">
                <div className="w-6 h-6 rounded-md bg-arch-blue flex items-center justify-center text-white">
                  <TerminalIcon size={14} />
                </div>
                {language === "en" ? "Assistant Node" : "助手节点"}
              </div>
            )}
            
            <div className={cn(
              "max-w-[85%] px-6 py-4 text-sm leading-relaxed",
              msg.role === "user" 
                ? "bg-blue-600/10 border border-blue-500/30 rounded-2xl rounded-tr-none text-blue-100 shadow-sm" 
                : "text-arch-text-primary"
            )}>
              <div className="prose prose-invert prose-sm max-w-none prose-p:text-arch-text-primary prose-p:leading-relaxed prose-pre:bg-black prose-pre:border prose-pre:border-arch-border prose-pre:rounded-xl">
                <ReactMarkdown>
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>

            {msg.audit && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl bg-black border border-arch-border rounded-xl overflow-hidden shadow-2xl"
              >
                <div className="bg-slate-800/50 px-4 py-2.5 flex justify-between items-center border-b border-arch-border/50">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-arch-text-secondary uppercase tracking-tighter">
                    <ShieldCheck size={14} className="text-arch-blue" /> {t("console.audit.title")}
                  </div>
                  <span className={cn(
                    "text-[9px] font-bold px-2 py-0.5 rounded uppercase border",
                    msg.audit.safety === CommandSafety.SOFT ? "bg-green-500/10 border-green-500/30 text-green-400" :
                    msg.audit.safety === CommandSafety.MODERATE ? "bg-orange-500/10 border-orange-500/30 text-orange-400" :
                    "bg-red-500/10 border-red-500/30 text-red-500"
                  )}>
                    {msg.audit.safety === CommandSafety.SOFT ? (language === "en" ? "Dry-Run Passed" : "模拟执行通过") : 
                     msg.audit.safety === CommandSafety.MODERATE ? (language === "en" ? "Auth Required" : "需要授权") : (language === "en" ? "Restricted Access" : "受限访问")}
                  </span>
                </div>
                <div className="p-5 font-mono text-sm space-y-2 text-blue-300">
                  <div className="flex">
                    <span className="text-arch-blue mr-2">$</span>
                    <span>{msg.audit.command}</span>
                  </div>
                  <div className="text-slate-500 text-[11px] italic mt-2">
                    # {msg.audit.explanation}
                  </div>
                </div>
                
                {msg.audit.safety !== CommandSafety.SOFT && (
                  <div className="bg-orange-500/5 border-t border-arch-border px-4 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="text-orange-500 shrink-0" size={18} />
                      <div className="text-xs text-arch-text-secondary">
                        <span className="font-bold text-orange-500">{t("console.audit.security")}</span> {t("console.audit.mod")}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(msg.audit?.explanation || "")}`, "_blank")}
                        className="px-3 py-1.5 hover:bg-slate-800 text-[10px] rounded-lg transition-colors border border-transparent hover:border-arch-border"
                      >
                        {t("console.audit.diff")}
                      </button>
                      <button 
                        onClick={async () => {
                          if (!msg.audit?.command) return;
                          try {
                            const res = await fetch("/api/execute", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ command: msg.audit.command })
                            });
                            const data = await res.json();
                            if (data.error) throw new Error(data.error);
                            
                            setMessages(prev => [...prev, { 
                              role: "ai", 
                              content: (language === "en" ? "Execution Output:\n" : "执行输出：\n") + "```\n" + (data.stdout || data.stderr || "Success (No output)") + "\n```" 
                            }]);
                          } catch (e: any) {
                            setMessages(prev => [...prev, { 
                              role: "ai", 
                              content: (language === "en" ? "Execution Failed: " : "执行失败：") + e.message 
                            }]);
                          }
                        }}
                        className="px-4 py-1.5 bg-arch-blue text-white text-[10px] rounded-lg font-bold shadow-lg shadow-arch-blue/20 hover:bg-arch-blue/80 transition-all"
                      >
                        {t("console.audit.execute")}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-3 text-arch-blue/60 text-[10px] font-bold uppercase tracking-[0.2em] pl-2 animate-pulse">
            <Loader2 className="animate-spin" size={14} />
            {t("console.processing")}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="relative group max-w-5xl mx-auto w-full sticky bottom-0 pt-4 bg-arch-dark/95 backdrop-blur-sm">
        <div className="relative flex items-center bg-arch-surface-light sleek-border rounded-2xl shadow-xl focus-within:border-arch-blue/40 focus-within:ring-1 focus-within:ring-arch-blue/20 transition-all overflow-hidden p-1.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={t("console.placeholder")}
            className="flex-1 bg-transparent border-none outline-none px-6 py-3.5 text-sm font-medium placeholder:text-arch-text-muted"
          />
          <div className="absolute right-4 flex items-center gap-3">
             <span className="hidden md:inline-block text-[9px] font-bold text-arch-text-muted bg-slate-800 px-2.5 py-1.5 rounded-lg border border-arch-border uppercase tracking-widest">
               {language === "en" ? "Ctrl + Enter" : "Ctrl + 回车"}
             </span>
             <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="w-10 h-10 bg-arch-blue text-white rounded-xl hover:bg-arch-blue/80 disabled:opacity-50 disabled:bg-gray-700 transition-all flex items-center justify-center shadow-lg shadow-arch-blue/20"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-[9px] font-bold text-arch-text-muted px-4 justify-center">
            <button className="uppercase hover:text-arch-text-primary transition-colors tracking-[0.1em]">{language === "en" ? "Analyze Logs" : "分析日志"}</button>
            <span className="opacity-20 text-arch-text-muted">|</span>
            <button className="uppercase hover:text-arch-text-primary transition-colors tracking-[0.1em]">{language === "en" ? "AUR Search" : "AUR 搜索"}</button>
            <span className="opacity-20 text-arch-text-muted">|</span>
            <button className="uppercase hover:text-arch-text-primary transition-colors tracking-[0.1em]">{language === "en" ? "Hardware Diagnostic" : "硬件诊断"}</button>
        </div>
      </div>
    </div>
  );
}
