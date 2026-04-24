import { useState, useEffect } from "react";
import { Terminal, Search, Filter, Download } from "lucide-react";
import { LogEntry } from "@/src/types";
import { cn } from "@/src/lib/utils";
import { useLanguage } from "@/src/lib/i18n";

export default function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState("");
  const { t, language } = useLanguage();

  useEffect(() => {
    fetch("/api/logs")
      .then(res => res.json())
      .then(setLogs);
  }, []);

  const filteredLogs = logs.filter(l => 
    l.message.toLowerCase().includes(filter.toLowerCase()) || 
    l.source.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-arch-text-muted" size={16} />
          <input 
            type="text" 
            placeholder={t("log.filter")}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-arch-surface-light border border-arch-border rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:border-arch-blue/50 transition-all font-mono placeholder:text-arch-text-muted"
          />
        </div>
        <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-arch-surface-light border border-arch-border text-[10px] font-bold text-arch-text-muted hover:text-white transition-all uppercase tracking-widest">
          <Filter size={14} /> {language === "en" ? "Filter" : "过滤"}
        </button>
        <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-arch-surface-light border border-arch-border text-[10px] font-bold text-arch-text-muted hover:text-white transition-all uppercase tracking-widest">
          <Download size={14} /> {t("log.export")}
        </button>
      </div>

      <div className="flex-1 bg-black/40 rounded-2xl border border-arch-border overflow-hidden flex flex-col font-mono text-[11px] shadow-2xl">
        <div className="grid grid-cols-[140px_100px_1fr] px-6 py-3 border-b border-arch-border bg-arch-surface/50 text-[10px] font-bold text-arch-text-muted uppercase tracking-[0.2em]">
          <span>{t("log.timestamp")}</span>
          <span>{t("log.source")}</span>
          <span>{t("log.message")}</span>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredLogs.map((log, i) => (
            <div 
              key={i} 
              className={cn(
                "grid grid-cols-[140px_100px_1fr] px-6 py-2.5 hover:bg-white/5 transition-colors border-b border-arch-border/20 last:border-0",
                log.message.toLowerCase().includes("error") ? "text-red-400" :
                log.message.toLowerCase().includes("failed") ? "text-orange-400" : "text-arch-text-secondary"
              )}
            >
              <span className="text-arch-text-muted shrink-0">{log.timestamp}</span>
              <span className={cn(
                "font-bold px-2 py-0.5 rounded text-[8px] w-fit uppercase tracking-tighter",
                log.source === "kernel" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                log.source === "systemd" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                log.source === "pacman" ? "bg-arch-blue/10 text-arch-blue border border-arch-blue/20" : "bg-slate-700/50 text-slate-400"
              )}>{log.source}</span>
              <span className="truncate ml-4">{log.message}</span>
            </div>
          ))}
          {filteredLogs.length === 0 && (
            <div className="p-8 text-center text-gray-600">{language === "en" ? "No matching logs found in journalctl buffer." : "journalctl 缓冲区中未找到匹配的日志。"}</div>
          )}
        </div>
      </div>

      <div className="p-4 bg-arch-blue/5 border border-arch-blue/20 rounded-lg flex items-center gap-4">
        <Terminal className="text-arch-blue" size={20} />
        <div className="text-xs">
          <span className="font-bold text-arch-blue uppercase block mb-1">{language === "en" ? "AI Diagnostic Insight" : "AI 诊断见解"}</span>
          <p className="text-gray-400">
            {language === "en" 
              ? <>Detected an issue with <code className="text-blue-300 bg-blue-900/40 px-1 rounded">cups</code> service. Try running <code className="text-arch-blue">systemctl restart cups</code> or asking me for a full diagnostic path.</>
              : <>检测到 <code className="text-blue-300 bg-blue-900/40 px-1 rounded">cups</code> 服务存在问题。请尝试运行 <code className="text-arch-blue">systemctl restart cups</code> 或向我询问完整的诊断路径。</>}
          </p>
        </div>
      </div>
    </div>
  );
}
