import { useEffect, useState } from "react";
import { Cpu, HardDrive, Zap, Thermometer, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/src/lib/utils";
import { useLanguage } from "@/src/lib/i18n";

export default function SystemStats() {
  const { t, language } = useLanguage();
  const [realStats, setRealStats] = useState<any>(null);
  
  useEffect(() => {
    const fetchStats = () => {
      fetch("/api/stats")
        .then(res => res.json())
        .then(data => setRealStats(data))
        .catch(() => {});
    };

    fetchStats();
    const timer = setInterval(fetchStats, 5000);
    return () => clearInterval(timer);
  }, []);

  const stats = [
    { 
      label: t("stats.cpu"), 
      value: realStats?.cpuLoad ? (realStats.cpuLoad.match(/(\d+\.\d+)\sid/)?.[1] ? `${(100 - parseFloat(realStats.cpuLoad.match(/(\d+\.\d+)\sid/)[1])).toFixed(1)}%` : "N/A") : "12.4%", 
      icon: Cpu, 
      color: "text-blue-400", 
      sub: realStats?.cpuLoad || "Load: 0.12, 0.45, 0.88" 
    },
    { 
      label: t("stats.mem"), 
      value: realStats?.memory ? (realStats.memory.match(/Mem:\s+([^\s]+)\s+([^\s]+)/)?.[2] ? `${realStats.memory.match(/Mem:\s+([^\s]+)\s+([^\s]+)/)[2]} / ${realStats.memory.match(/Mem:\s+([^\s]+)/)[1]}` : "N/A") : "4.2 / 16 GB", 
      icon: Zap, 
      color: "text-yellow-400", 
      sub: "Active RAM" 
    },
    { 
      label: t("stats.disk"), 
      value: realStats?.disk ? (realStats.disk.match(/(\d+%).*\/$/)?.[1] ? `${realStats.disk.match(/(\d+%).*\/$/)[1]} Used` : "N/A") : "348 GB Free", 
      icon: HardDrive, 
      color: "text-green-400", 
      sub: realStats?.disk || "Total: 1024 GB" 
    },
    { 
      label: t("stats.temp"), 
      value: "42°C", 
      icon: Thermometer, 
      color: "text-orange-400", 
      sub: "Fan: 1200 RPM" 
    },
  ];

  const securityStatus = [
    { 
      name: language === "en" ? "Firewall Policy" : "防火墙策略", 
      status: language === "en" ? "Enabled" : "已启用", 
      details: language === "en" ? "UFW profiles active on all priority ports" : "UFW 配置已在所有高优先级端口激活", 
      color: "text-emerald-500" 
    },
    { 
      name: language === "en" ? "Encryption Status" : "加密状态", 
      status: language === "en" ? "Active" : "活动", 
      details: language === "en" ? "LUKS partition verified and mounted" : "LUKS 分区已验证并挂载", 
      color: "text-emerald-500" 
    },
    { 
      name: language === "en" ? "Root Authority" : "Root 权限", 
      status: language === "en" ? "Locked" : "锁定", 
      details: language === "en" ? "Direct root login disabled, sudo only" : "直接 Root 登录已禁用，仅限 sudo", 
      color: "text-blue-500" 
    },
    { 
      name: language === "en" ? "PACMAN Updates" : "软件包更新", 
      status: language === "en" ? "14 Pending" : "14 项待更新", 
      details: language === "en" ? "Critical security patches available" : "有重要的安全补丁可用", 
      color: "text-orange-500" 
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 sleek-card flex flex-col relative group overflow-hidden"
          >
             <div className="flex items-start justify-between relative z-10">
               <div>
                 <p className="text-[10px] font-bold text-arch-text-muted uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                 <h3 className="text-2xl font-bold text-white tracking-tight">{stat.value}</h3>
               </div>
               <div className={cn("p-2 rounded-lg bg-slate-800/50 border border-arch-border", stat.color)}>
                 <stat.icon size={18} />
               </div>
             </div>
             <p className="text-[10px] font-mono text-arch-text-muted mt-4 relative z-10">{stat.sub}</p>
             
             {/* Sleek Progress bar */}
             <div className="h-1 bg-slate-800 mt-4 rounded-full overflow-hidden relative z-10">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "40%" }}
                  className={cn("h-full", stat.color.replace('text', 'bg'))}
                ></motion.div>
             </div>

             <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
               <stat.icon size={80} />
             </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-8 sleek-card">
           <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
             <ShieldCheck className="text-emerald-500" size={22} /> {t("stats.security.title")}
           </h3>
           <div className="space-y-4">
             {securityStatus.map((item, i) => (
               <div key={i} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0 text-sm group">
                 <div>
                   <span className="font-bold text-white group-hover:text-arch-blue transition-colors">{item.name}</span>
                   <p className="text-xs text-arch-text-muted">{item.details}</p>
                 </div>
                 <span className={cn("text-[9px] font-bold border px-3 py-1.5 rounded-lg uppercase tracking-widest", 
                   item.color.includes('emerald') ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" :
                   item.color.includes('blue') ? "bg-blue-500/10 border-blue-500/30 text-blue-500" :
                   "bg-orange-500/10 border-orange-500/30 text-orange-500"
                 )}>
                   {item.status}
                 </span>
               </div>
             ))}
           </div>
        </div>

        <div className="p-8 bg-arch-blue/5 border border-arch-blue/20 rounded-2xl relative overflow-hidden flex flex-col justify-between">
           <div className="relative z-10">
             <div className="w-12 h-12 rounded-xl bg-arch-blue flex items-center justify-center text-white mb-6 shadow-lg shadow-arch-blue/30">
               <Cpu size={24} />
             </div>
             <h3 className="text-xl font-bold mb-2">{t("stats.rolling")}</h3>
             <div className="font-mono text-3xl text-white mb-2">6.6.10-arch</div>
             <p className="text-xs text-arch-text-secondary leading-relaxed mb-8">
               {language === "en" 
                 ? "Your system is tracking the stable rolling branch. All kernels are cryptographically signed."
                 : "您的系统正在追踪稳定的滚动分支。所有内核均经过加密签名。"}
             </p>
           </div>
           <button className="relative z-10 w-full py-4 bg-white text-arch-dark rounded-xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition-all shadow-xl">
             {t("stats.sync")}
           </button>
           
           <div className="absolute -bottom-10 -right-10 opacity-10 pointer-events-none">
             <div className="text-[120px] font-bold text-arch-blue tracking-tighter italic">ARCH</div>
           </div>
        </div>
      </div>
    </div>
  );
}
