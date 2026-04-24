import { useState, useEffect } from "react";
import { Clock, Calendar, Plus, Play, Pause, Trash2, AlertCircle } from "lucide-react";
import { useLanguage } from "@/src/lib/i18n";
import { CronJob } from "@/src/types";
import { motion } from "motion/react";
import { cn } from "@/src/lib/utils";

export default function Scheduler() {
  const { t, language } = useLanguage();
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cron")
      .then(res => res.json())
      .then(data => {
        setJobs(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="animate-pulse text-arch-text-muted font-mono">{language === "en" ? "Initializing task orchestrator..." : "正在完成任务编排..."}</div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <Clock className="text-arch-blue" />
            {t("nav.cron")}
          </h2>
          <p className="text-sm text-arch-text-secondary">
            {language === "en" 
              ? "Automated system maintenance and periodic diagnostics orchestration."
              : "自动化系统维护和周期性诊断编排。"}
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-arch-blue text-white rounded-lg text-xs font-bold hover:bg-arch-blue/80 transition-all shadow-lg shadow-arch-blue/20">
          <Plus size={14} /> {language === "en" ? "Schedule Task" : "新建任务"}
        </button>
      </div>

      <div className="bg-arch-surface/40 backdrop-blur-md rounded-2xl border border-arch-border overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_100px_120px] px-8 py-4 border-b border-arch-border bg-arch-surface/50 text-[10px] font-bold text-arch-text-muted uppercase tracking-[0.2em]">
          <span>Task Definition</span>
          <span>Schedule</span>
          <span>Status</span>
          <span>Last Execution</span>
        </div>
        
        <div className="divide-y divide-arch-border/50">
          {jobs.map((job) => (
            <div key={job.id} className="grid grid-cols-[1fr_120px_100px_120px] px-8 py-5 items-center hover:bg-white/[0.02] transition-colors group">
              <div className="flex flex-col gap-1">
                <span className="font-bold text-white group-hover:text-arch-blue transition-colors">{job.name}</span>
                <code className="text-[10px] text-arch-text-muted bg-slate-900/50 px-2 py-0.5 rounded w-fit">{job.command}</code>
              </div>
              <div className="font-mono text-xs text-blue-400">{job.schedule}</div>
              <div>
                <span className={cn(
                  "text-[9px] font-bold px-2 py-0.5 rounded uppercase border",
                  job.status === "active" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "bg-red-500/10 border-red-500/30 text-red-400"
                )}>
                  {job.status}
                </span>
              </div>
              <div className="text-[10px] font-mono text-arch-text-muted">
                {job.last_run ? new Date(job.last_run).toLocaleTimeString() : "Never"}
              </div>
            </div>
          ))}
          
          {jobs.length === 0 && (
            <div className="p-12 text-center text-arch-text-muted space-y-4">
              <Calendar size={40} className="mx-auto opacity-10" />
              <p className="text-sm">{language === "en" ? "No scheduled routines found." : "未发现已调度的常规任务。"}</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 sleek-card flex items-start gap-4 bg-orange-500/5 border-orange-500/20">
        <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={20} />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-orange-500 uppercase tracking-wider">{language === "en" ? "Security Advisory" : "安全建议"}</h4>
          <p className="text-xs text-arch-text-secondary leading-relaxed">
            {language === "en" 
              ? "Automated tasks execute with elevated kernel priorities. Ensure all scheduled shell commands are audited through the primary neural map before activation."
              : "自动化任务以提升的内核优先级执行。在激活前，请确保所有调度的 Shell 命令都已通过主神经图谱进行审计。"}
          </p>
        </div>
      </div>
    </div>
  );
}
