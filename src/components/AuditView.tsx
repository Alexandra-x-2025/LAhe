import { useEffect, useMemo, useState } from "react";
import { Ban, CheckCircle2, ChevronDown, ChevronRight, FileWarning, Search, ShieldAlert, Terminal } from "lucide-react";
import { CommandExecution, CommandSafety } from "@/src/types";
import { cn } from "@/src/lib/utils";
import { useLanguage } from "@/src/lib/i18n";

function safetyClass(safety: CommandSafety) {
  if (safety === CommandSafety.CRITICAL) return "bg-red-500/10 border-red-500/30 text-red-400";
  if (safety === CommandSafety.MODERATE) return "bg-orange-500/10 border-orange-500/30 text-orange-400";
  return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
}

export default function AuditView() {
  const { language, t } = useLanguage();
  const [records, setRecords] = useState<CommandExecution[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/execute")
      .then((res) => res.json())
      .then((data) => {
        setRecords(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredRecords = records.filter((record) => {
    const value = `${record.command} ${record.safety} ${record.error} ${record.stderr}`.toLowerCase();
    return value.includes(filter.toLowerCase());
  });

  const summary = useMemo(() => {
    return {
      total: records.length,
      blocked: records.filter((record) => record.blocked).length,
      critical: records.filter((record) => record.safety === CommandSafety.CRITICAL).length,
      failed: records.filter((record) => !record.blocked && record.error).length,
    };
  }, [records]);

  const selectedRecord = filteredRecords.find((record) => record.id === selectedId);

  if (loading) {
    return <div className="animate-pulse text-arch-text-muted font-mono text-xs">{language === "en" ? "Loading command audit..." : "正在加载命令审计..."}</div>;
  }

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex flex-col gap-4 border-b border-arch-border pb-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-3">
            <ShieldAlert className="text-arch-blue" size={22} />
            {t("nav.audit")}
          </h2>
          <div className="text-[10px] font-mono text-arch-text-muted uppercase">
            {language === "en" ? "Total" : "总计"}: {summary.total}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: language === "en" ? "Recorded" : "已记录", value: summary.total, icon: Terminal, color: "text-arch-blue" },
            { label: language === "en" ? "Blocked" : "已阻止", value: summary.blocked, icon: Ban, color: "text-red-400" },
            { label: "Critical", value: summary.critical, icon: FileWarning, color: "text-orange-400" },
            { label: language === "en" ? "Failed" : "失败", value: summary.failed, icon: CheckCircle2, color: "text-arch-text-muted" },
          ].map((item) => (
            <div key={item.label} className="bg-arch-surface-light border border-arch-border rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-arch-text-muted mb-1">{item.label}</div>
                <div className="text-xl font-bold text-white font-mono">{item.value}</div>
              </div>
              <item.icon className={item.color} size={18} />
            </div>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-arch-text-muted" size={16} />
          <input
            type="text"
            placeholder={language === "en" ? "Filter commands, safety levels, or errors..." : "过滤命令、风险等级或错误..."}
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="w-full bg-arch-surface-light border border-arch-border rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:border-arch-blue/50 transition-all font-mono placeholder:text-arch-text-muted"
          />
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="py-20 text-center text-gray-600">
          <ShieldAlert size={40} className="mx-auto mb-4 opacity-20" />
          <p className="text-sm">{language === "en" ? "No command audit records found." : "暂无命令审计记录。"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 min-h-0">
          <div className="bg-black/30 rounded-2xl border border-arch-border overflow-hidden min-h-[360px]">
            <div className="grid grid-cols-[110px_110px_1fr_100px_140px] px-6 py-3 border-b border-arch-border bg-arch-surface/50 text-[10px] font-bold text-arch-text-muted uppercase tracking-[0.18em]">
              <span>{language === "en" ? "Status" : "状态"}</span>
              <span>{language === "en" ? "Safety" : "风险"}</span>
              <span>{language === "en" ? "Command" : "命令"}</span>
              <span>{language === "en" ? "Exit" : "退出码"}</span>
              <span>{language === "en" ? "Time" : "时间"}</span>
            </div>
            <div className="overflow-y-auto custom-scrollbar max-h-[520px]">
              {filteredRecords.map((record) => (
                <button
                  key={record.id}
                  onClick={() => setSelectedId((current) => current === record.id ? null : record.id)}
                  className={cn(
                    "w-full grid grid-cols-[110px_110px_1fr_100px_140px] gap-0 px-6 py-4 border-b border-arch-border/30 last:border-0 hover:bg-white/[0.03] transition-colors items-start text-left",
                    selectedId === record.id && "bg-white/[0.04]"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {selectedId === record.id ? <ChevronDown size={13} className="text-arch-text-muted" /> : <ChevronRight size={13} className="text-arch-text-muted" />}
                    <span className={cn(
                      "text-[9px] font-bold px-2 py-1 rounded uppercase border",
                      record.blocked ? "bg-red-500/10 border-red-500/30 text-red-400" : record.error ? "bg-orange-500/10 border-orange-500/30 text-orange-400" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    )}>
                      {record.blocked ? (language === "en" ? "Blocked" : "阻止") : record.error ? (language === "en" ? "Failed" : "失败") : "OK"}
                    </span>
                  </div>
                  <div>
                    <span className={cn("text-[9px] font-bold px-2 py-1 rounded uppercase border", safetyClass(record.safety))}>
                      {record.safety}
                    </span>
                  </div>
                  <div className="min-w-0 pr-4">
                    <code className="text-xs text-blue-300 break-all">{record.command}</code>
                    {(record.error || record.stderr || record.stdout) && (
                      <p className="mt-2 text-[10px] text-arch-text-muted line-clamp-2">
                        {(record.error || record.stderr || record.stdout).replace(/\s+/g, " ")}
                      </p>
                    )}
                  </div>
                  <div className="font-mono text-xs text-arch-text-secondary">
                    {record.exit_code === null ? "-" : record.exit_code}
                  </div>
                  <div className="font-mono text-[10px] text-arch-text-muted">
                    {new Date(record.timestamp).toLocaleString(language === "en" ? "en-US" : "zh-CN")}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-arch-surface/40 border border-arch-border rounded-2xl overflow-hidden min-h-[360px]">
            {selectedRecord ? (
              <div className="h-full flex flex-col">
                <div className="px-5 py-4 border-b border-arch-border bg-arch-surface/50">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="text-sm font-bold text-white">{language === "en" ? "Audit Detail" : "审计详情"}</h3>
                    <span className={cn("text-[9px] font-bold px-2 py-1 rounded uppercase border", safetyClass(selectedRecord.safety))}>
                      {selectedRecord.safety}
                    </span>
                  </div>
                  <code className="block text-xs text-blue-300 break-all">{selectedRecord.command}</code>
                </div>

                <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
                    <div className="bg-black/30 border border-arch-border rounded-lg p-3">
                      <div className="text-arch-text-muted uppercase mb-1">{language === "en" ? "Confirmed" : "已确认"}</div>
                      <div className="text-white">{selectedRecord.confirmed ? "true" : "false"}</div>
                    </div>
                    <div className="bg-black/30 border border-arch-border rounded-lg p-3">
                      <div className="text-arch-text-muted uppercase mb-1">{language === "en" ? "Blocked" : "已阻止"}</div>
                      <div className="text-white">{selectedRecord.blocked ? "true" : "false"}</div>
                    </div>
                    <div className="bg-black/30 border border-arch-border rounded-lg p-3">
                      <div className="text-arch-text-muted uppercase mb-1">{language === "en" ? "Exit Code" : "退出码"}</div>
                      <div className="text-white">{selectedRecord.exit_code === null ? "-" : selectedRecord.exit_code}</div>
                    </div>
                    <div className="bg-black/30 border border-arch-border rounded-lg p-3">
                      <div className="text-arch-text-muted uppercase mb-1">{language === "en" ? "Time" : "时间"}</div>
                      <div className="text-white">{new Date(selectedRecord.timestamp).toLocaleString(language === "en" ? "en-US" : "zh-CN")}</div>
                    </div>
                  </div>

                  {[
                    { label: "stdout", value: selectedRecord.stdout },
                    { label: "stderr", value: selectedRecord.stderr },
                    { label: "error", value: selectedRecord.error },
                  ].map((section) => (
                    <div key={section.label}>
                      <div className="text-[10px] font-bold text-arch-text-muted uppercase tracking-[0.18em] mb-2">{section.label}</div>
                      <pre className="min-h-20 max-h-56 overflow-auto custom-scrollbar rounded-xl border border-arch-border bg-black/50 p-3 text-[11px] text-arch-text-secondary whitespace-pre-wrap break-words">
                        {section.value || (language === "en" ? "No output." : "无输出。")}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center text-arch-text-muted p-8">
                <ShieldAlert size={36} className="opacity-20 mb-4" />
                <p className="text-sm">{language === "en" ? "Select a command record to inspect full output." : "选择一条命令记录以查看完整输出。"}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
