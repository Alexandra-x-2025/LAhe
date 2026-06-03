import { useState, createContext, useContext, ReactNode } from "react";

type Language = "en" | "zh";

interface Translations {
  [key: string]: {
    en: string;
    zh: string;
  };
}

const translations: Translations = {
  // Navigation
  "nav.console": { en: "Command Center", zh: "控制中心" },
  "nav.history": { en: "Interaction History", zh: "交互记录" },
  "nav.logs": { en: "Journalctl Logs", zh: "系统日志" },
  "nav.stats": { en: "System Health", zh: "系统状态" },
  "nav.audit": { en: "Command Audit", zh: "命令审计" },
  "nav.skills": { en: "Neural Map", zh: "神经图谱" },
  "nav.cron": { en: "Task Scheduler", zh: "任务调度" },
  "nav.title": { en: "LAhe", zh: "LAhe" },
  "nav.safety": { en: "Command Safety Active", zh: "命令安全检查已启用" },

  // Header
  "header.kernel": { en: "Kernel", zh: "内核" },
  "header.uptime": { en: "Uptime", zh: "运行时间" },
  "header.updates": { en: "Updates", zh: "更新" },
  "header.pending": { en: "pending", zh: "项待更新" },
  "header.online": { en: "System Online", zh: "系统在线" },

  // Console
  "console.placeholder": { en: "Ask about your system (e.g. 'Troubleshoot my Wi-Fi')...", zh: "询问系统问题 (例如 '排除我的 Wi-Fi 故障')..." },
  "console.initialized": { en: "Kernel Initialized", zh: "内核已初始化" },
  "console.welcome": { en: "Ask about package management, service configuration, or system diagnostics.", zh: "询问有关包管理、服务配置或系统诊断的问题。" },
  "console.processing": { en: "Node Processing...", zh: "节点处理中..." },
  "console.audit.title": { en: "Generated Shell Commands", zh: "生成的 Shell 命令" },
  "console.audit.execute": { en: "Execute Now", zh: "立即执行" },
  "console.audit.diff": { en: "View Diff", zh: "查看差异" },
  "console.audit.security": { en: "Security Check:", zh: "安全检查：" },
  "console.audit.mod": { en: "System modification detected.", zh: "检测到系统修改。" },

  // Stats
  "stats.security.title": { en: "System Security Level", zh: "系统安全等级" },
  "stats.cpu": { en: "CPU Usage", zh: "CPU 使用率" },
  "stats.mem": { en: "Memory (RAM)", zh: "内存 (RAM)" },
  "stats.disk": { en: "Disk (/root)", zh: "磁盘 (/root)" },
  "stats.temp": { en: "Core Temp", zh: "核心温度" },
  "stats.rolling": { en: "Rolling Release", zh: "滚动发行版" },
  "stats.sync": { en: "Sync Repository", zh: "同步软件库" },

  // Logs
  "log.filter": { en: "Filter logs by keyword or source...", zh: "根据关键字或来源过滤日志..." },
  "log.export": { en: "Export", zh: "导出" },
  "log.timestamp": { en: "Timestamp", zh: "时间戳" },
  "log.source": { en: "Source", zh: "来源" },
  "log.message": { en: "Message", zh: "信息" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("zh");

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
