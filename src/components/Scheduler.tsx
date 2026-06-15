import { useState, useEffect } from "react";
import { Clock, Calendar, Plus, Play, Pause, Trash2, AlertCircle, RefreshCw, Zap } from "lucide-react";
import { useLanguage } from "@/src/lib/i18n";
import { CronJob } from "@/src/types";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";

interface ExtendedCronJob extends CronJob {
  running?: boolean;
}

export default function Scheduler() {
  const { t, language } = useLanguage();
  const [jobs, setJobs] = useState<ExtendedCronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newJob, setNewJob] = useState({ name: "", schedule: "0 0 * * *", command: "" });
  const [triggeringJob, setTriggeringJob] = useState<number | null>(null);

  const loadJobs = async () => {
    try {
      const res = await fetch("/api/cron");
      const data = await res.json();
      setJobs(data);
    } catch (error) {
      console.error("Failed to load jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleCreateJob = async () => {
    try {
      const res = await fetch("/api/cron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newJob),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setNewJob({ name: "", schedule: "0 0 * * *", command: "" });
        loadJobs();
      } else {
        const error = await res.json();
        alert(error.error || (language === "en" ? "Failed to create job" : "创建任务失败"));
      }
    } catch (error) {
      console.error("Failed to create job:", error);
      alert(language === "en" ? "Failed to create job" : "创建任务失败");
    }
  };

  const handleToggleJob = async (id: number, enabled: boolean) => {
    try {
      const res = await fetch(`/api/cron/${id}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (res.ok) {
        loadJobs();
      }
    } catch (error) {
      console.error("Failed to toggle job:", error);
    }
  };

  const handleDeleteJob = async (id: number) => {
    if (!confirm(language === "en" ? "Delete this scheduled task?" : "删除此定时任务？")) {
      return;
    }

    try {
      const res = await fetch(`/api/cron/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadJobs();
      }
    } catch (error) {
      console.error("Failed to delete job:", error);
    }
  };

  const handleTriggerJob = async (id: number) => {
    setTriggeringJob(id);
    try {
      const res = await fetch(`/api/cron/${id}/trigger`, {
        method: "POST",
      });
      if (res.ok) {
        await loadJobs();
      } else {
        const error = await res.json();
        alert(error.error || (language === "en" ? "Failed to trigger job" : "触发任务失败"));
      }
    } catch (error) {
      console.error("Failed to trigger job:", error);
    } finally {
      setTriggeringJob(null);
    }
  };

  const CRON_HELP = [
    { expr: "* * * * *", desc: language === "en" ? "Every minute" : "每分钟" },
    { expr: "0 * * * *", desc: language === "en" ? "Every hour" : "每小时" },
    { expr: "0 0 * * *", desc: language === "en" ? "Every day at midnight" : "每天午夜" },
    { expr: "0 0 * * 0", desc: language === "en" ? "Every Sunday at midnight" : "每周日午夜" },
    { expr: "0 0 1 * *", desc: language === "en" ? "First day of each month" : "每月1号" },
  ];

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
        <div className="flex items-center gap-3">
          <button
            onClick={loadJobs}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-arch-text-muted hover:text-arch-text-primary"
            title={language === "en" ? "Refresh" : "刷新"}
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-arch-blue text-white rounded-lg text-xs font-bold hover:bg-arch-blue/80 transition-all shadow-lg shadow-arch-blue/20"
          >
            <Plus size={14} /> {language === "en" ? "Schedule Task" : "新建任务"}
          </button>
        </div>
      </div>

      <div className="bg-arch-surface/40 backdrop-blur-md rounded-2xl border border-arch-border overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_80px_120px_140px] px-8 py-4 border-b border-arch-border bg-arch-surface/50 text-[10px] font-bold text-arch-text-muted uppercase tracking-[0.2em]">
          <span>Task Definition</span>
          <span>Schedule</span>
          <span>Status</span>
          <span>Last Execution</span>
          <span>Actions</span>
        </div>

        <div className="divide-y divide-arch-border/50">
          {jobs.map((job) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-[1fr_120px_80px_120px_140px] px-8 py-5 items-center hover:bg-white/[0.02] transition-colors group"
            >
              <div className="flex flex-col gap-1">
                <span className="font-bold text-white group-hover:text-arch-blue transition-colors flex items-center gap-2">
                  {job.name}
                  {job.running && <Zap size={10} className="text-green-400" />}
                </span>
                <code className="text-[10px] text-arch-text-muted bg-slate-900/50 px-2 py-0.5 rounded w-fit">{job.command}</code>
              </div>
              <div className="font-mono text-xs text-blue-400">{job.schedule}</div>
              <div>
                <button
                  onClick={() => handleToggleJob(job.id, job.status !== "active")}
                  className={cn(
                    "flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded uppercase border transition-colors",
                    job.status === "active"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20"
                      : "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                  )}
                >
                  {job.status === "active" ? (
                    <><Pause size={10} /> {language === "en" ? "Running" : "运行中"}</>
                  ) : (
                    <><Play size={10} /> {language === "en" ? "Stopped" : "已停止"}</>
                  )}
                </button>
              </div>
              <div className="text-[10px] font-mono text-arch-text-muted">
                {job.last_run ? new Date(job.last_run).toLocaleTimeString() : (language === "en" ? "Never" : "从未")}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTriggerJob(job.id)}
                  disabled={triggeringJob === job.id}
                  className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-arch-text-muted hover:text-arch-blue disabled:opacity-50"
                  title={language === "en" ? "Trigger now" : "立即触发"}
                >
                  <Zap size={14} className={triggeringJob === job.id ? "animate-pulse" : ""} />
                </button>
                <button
                  onClick={() => handleDeleteJob(job.id)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-arch-text-muted hover:text-red-400"
                  title={language === "en" ? "Delete" : "删除"}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
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

      {/* Create Task Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-md bg-arch-surface border border-arch-border rounded-2xl shadow-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-arch-border flex items-center justify-between">
                  <h3 className="text-lg font-bold">{language === "en" ? "Create Scheduled Task" : "创建定时任务"}</h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <AlertCircle size={16} className="text-arch-text-muted" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">{language === "en" ? "Task Name" : "任务名称"}</label>
                    <input
                      type="text"
                      value={newJob.name}
                      onChange={(e) => setNewJob({ ...newJob, name: e.target.value })}
                      placeholder={language === "en" ? "e.g., Daily Backup" : "例如：每日备份"}
                      className="w-full bg-slate-900 border border-arch-border rounded-lg px-4 py-2.5 text-sm focus:border-arch-blue/50 focus:ring-1 focus:ring-arch-blue/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === "en" ? "Cron Expression" : "Cron 表达式"}
                      <span className="text-[10px] text-arch-text-muted ml-2">(min hour day month weekday)</span>
                    </label>
                    <input
                      type="text"
                      value={newJob.schedule}
                      onChange={(e) => setNewJob({ ...newJob, schedule: e.target.value })}
                      placeholder="0 0 * * *"
                      className="w-full bg-slate-900 border border-arch-border rounded-lg px-4 py-2.5 text-sm focus:border-arch-blue/50 focus:ring-1 focus:ring-arch-blue/20 outline-none font-mono"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      {CRON_HELP.map((item) => (
                        <button
                          key={item.expr}
                          onClick={() => setNewJob({ ...newJob, schedule: item.expr })}
                          className="text-[9px] px-2 py-1 bg-slate-800 rounded border border-arch-border hover:border-arch-blue/30 transition-colors"
                        >
                          <code>{item.expr}</code>
                          <span className="text-arch-text-muted ml-1">{item.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">{language === "en" ? "Command" : "命令"}</label>
                    <input
                      type="text"
                      value={newJob.command}
                      onChange={(e) => setNewJob({ ...newJob, command: e.target.value })}
                      placeholder="journalctl -p err -b"
                      className="w-full bg-slate-900 border border-arch-border rounded-lg px-4 py-2.5 text-sm focus:border-arch-blue/50 focus:ring-1 focus:ring-arch-blue/20 outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="p-6 border-t border-arch-border flex gap-3">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-arch-text-primary rounded-lg text-sm font-medium transition-colors"
                  >
                    {language === "en" ? "Cancel" : "取消"}
                  </button>
                  <button
                    onClick={handleCreateJob}
                    disabled={!newJob.name || !newJob.command}
                    className="flex-1 py-2.5 bg-arch-blue text-white rounded-lg text-sm font-bold hover:bg-arch-blue/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {language === "en" ? "Create" : "创建"}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
