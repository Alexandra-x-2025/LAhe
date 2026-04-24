import { useState, useEffect } from "react";
import { Brain, Cpu, Database, Save, Trash2, Milestone } from "lucide-react";
import { useLanguage } from "@/src/lib/i18n";
import { Skill, MemoryItem } from "@/src/types";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";

export default function NeuralMap() {
  const { t, language } = useLanguage();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [memory, setMemory] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/skills").then(res => res.json()),
      fetch("/api/memory").then(res => res.json())
    ]).then(([s, m]) => {
      setSkills(s);
      setMemory(m);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="animate-pulse text-arch-text-muted font-mono">{language === "en" ? "Synchronizing synaptic weightings..." : "正在同步突触权重..."}</div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
          <Brain className="text-arch-blue" />
          {t("nav.skills")}
        </h2>
        <p className="text-sm text-arch-text-secondary">
          {language === "en" 
            ? "Exploration of the agent's learned processes and persistent contextual nodes."
            : "探索助手的学习过程和持久化上下文节点。"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Skills Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
             <h3 className="text-xs font-bold uppercase tracking-widest text-arch-text-muted flex items-center gap-2">
               <Cpu size={14} className="text-arch-blue" />
               {language === "en" ? "Skill Process Memory" : "技能过程记忆"}
             </h3>
             <span className="text-[10px] font-mono text-arch-blue">{skills.length} Loaded</span>
          </div>
          
          <div className="grid gap-3">
            {skills.map((skill) => (
              <motion.div 
                key={skill.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="sleek-card p-5 group hover:border-arch-blue/40 transition-colors bg-arch-surface/40 backdrop-blur-sm"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="font-bold text-white group-hover:text-arch-blue transition-colors">{skill.name}</div>
                  <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-arch-blue/10 text-arch-blue border border-arch-blue/20">
                    Efficacy: {(skill.efficacy * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="text-xs text-arch-text-secondary mb-4 line-clamp-2 italic font-mono">
                  {skill.pattern}
                </div>
                <div className="flex gap-2">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-800 text-gray-400 uppercase tracking-tighter">
                    {language === "en" ? "Self-Generated" : "自动生成"}
                  </span>
                </div>
              </motion.div>
            ))}
            {skills.length === 0 && (
              <div className="p-8 border border-dashed border-arch-border rounded-xl text-center text-arch-text-muted text-xs">
                {language === "en" ? "No specialized skills generated yet." : "尚未生成专业技能。"}
              </div>
            )}
          </div>
        </div>

        {/* Memory Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
             <h3 className="text-xs font-bold uppercase tracking-widest text-arch-text-muted flex items-center gap-2">
               <Database size={14} className="text-emerald-500" />
               {language === "en" ? "Persistent Contextual Nodes" : "持久化上下文节点"}
             </h3>
             <span className="text-[10px] font-mono text-emerald-500">{memory.length} Active</span>
          </div>

          <div className="grid gap-3">
            {memory.map((item) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="sleek-card p-5 bg-arch-surface/40 backdrop-blur-sm border-emerald-500/10 hover:border-emerald-500/30 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Milestone size={12} className="text-emerald-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/80">{item.category}</span>
                </div>
                <p className="text-sm text-arch-text-primary leading-relaxed">
                  {item.content}
                </p>
                <div className="mt-4 pt-4 border-t border-arch-border/50 flex justify-between items-center text-[10px] text-arch-text-muted font-mono uppercase">
                  <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                  <span>IMPT: {item.importance}</span>
                </div>
              </motion.div>
            ))}
            {memory.length === 0 && (
              <div className="p-8 border border-dashed border-arch-border rounded-xl text-center text-arch-text-muted text-xs">
                {language === "en" ? "Memory buffer is currently empty." : "记忆缓冲区当前为空。"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
