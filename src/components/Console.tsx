import { useState, useRef, useEffect } from "react";
import { Send, Loader2, ShieldCheck, AlertTriangle, Terminal as TerminalIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { CommandSafety, ArchCommand } from "@/src/types";
import { useLanguage } from "@/src/lib/i18n";

type ConsoleMessage = {
  role: "user" | "ai";
  content: string;
  audits?: ArchCommand[];
};

export default function Console() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ConsoleMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t, language } = useLanguage();

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
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          messages: messages.map(({ role, content }) => ({ role, content })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Local model request failed.");
      }

      const cleanText = data.reply || (language === "en" ? "Sorry, I couldn't generate a response." : "抱歉，我无法生成回复。");
      const audits = Array.isArray(data.commands) ? data.commands : [];

      setMessages((prev) => [...prev, { role: "ai", content: cleanText, audits }]);

      // Save to history in background
      fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMessage, response: cleanText }),
      });

    } catch (error) {
      console.error("AI Error:", error);
      setMessages((prev) => [...prev, { role: "ai", content: language === "en" ? "Error communicating with the local model. Please check whether Ollama is running and the configured model is installed." : "与本地模型通信时出错。请检查 Ollama 是否正在运行，以及配置的模型是否已安装。" }]);
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

            {(msg.audits || []).map((audit, auditIndex) => (
              <motion.div 
                key={`${i}-${auditIndex}`}
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
                    audit.safety === CommandSafety.SOFT ? "bg-green-500/10 border-green-500/30 text-green-400" :
                    audit.safety === CommandSafety.MODERATE ? "bg-orange-500/10 border-orange-500/30 text-orange-400" :
                    "bg-red-500/10 border-red-500/30 text-red-500"
                  )}>
                    {audit.safety === CommandSafety.SOFT ? (language === "en" ? "Read Only" : "只读命令") : 
                     audit.safety === CommandSafety.MODERATE ? (language === "en" ? "Confirmation Required" : "需要确认") : (language === "en" ? "Blocked" : "已阻止")}
                  </span>
                </div>
                <div className="p-5 font-mono text-sm space-y-2 text-blue-300">
                  <div className="flex">
                    <span className="text-arch-blue mr-2">$</span>
                    <span>{audit.command}</span>
                  </div>
                  <div className="text-slate-500 text-[11px] italic mt-2">
                    # {audit.explanation}
                  </div>
                </div>
                
                <div className={cn(
                  "border-t border-arch-border px-4 py-3 flex items-center justify-between gap-4",
                  audit.safety === CommandSafety.CRITICAL ? "bg-red-500/5" : "bg-orange-500/5"
                )}>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={cn(
                      "shrink-0",
                      audit.safety === CommandSafety.CRITICAL ? "text-red-500" : "text-orange-500"
                    )} size={18} />
                    <div className="text-xs text-arch-text-secondary">
                      <span className={cn(
                        "font-bold",
                        audit.safety === CommandSafety.CRITICAL ? "text-red-500" : "text-orange-500"
                      )}>{t("console.audit.security")}</span> {audit.safety === CommandSafety.CRITICAL ? (language === "en" ? "Critical commands are blocked by the local safety gate." : "高危命令会被本地安全门阻止。") : t("console.audit.mod")}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(audit.explanation || "")}`, "_blank")}
                      className="px-3 py-1.5 hover:bg-slate-800 text-[10px] rounded-lg transition-colors border border-transparent hover:border-arch-border"
                    >
                      {t("console.audit.diff")}
                    </button>
                    {audit.safety !== CommandSafety.CRITICAL && (
                      <button 
                        onClick={async () => {
                          if (!audit.command) return;
                          if (audit.safety === CommandSafety.MODERATE) {
                            const confirmed = window.confirm(language === "en"
                              ? `Execute this system-changing command?\n\n${audit.command}`
                              : `确认执行这条可能修改系统状态的命令吗？\n\n${audit.command}`);
                            if (!confirmed) return;
                          }
                          try {
                            const res = await fetch("/api/execute", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ 
                                command: audit.command,
                                safety: audit.safety,
                                confirmed: audit.safety === CommandSafety.MODERATE,
                              })
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
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
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
