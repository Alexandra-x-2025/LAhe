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

  // Ollama Settings
  "ollama.title": { en: "Ollama Configuration", zh: "Ollama 配置" },
  "ollama.description": { en: "Configure your local AI model settings", zh: "配置本地 AI 模型设置" },
  "ollama.status.checking": { en: "Checking...", zh: "检测中..." },
  "ollama.status.running": { en: "Ollama is running", zh: "Ollama 正在运行" },
  "ollama.status.notRunning": { en: "Ollama is not running", zh: "Ollama 未运行" },
  "ollama.baseUrl": { en: "Base URL", zh: "服务地址" },
  "ollama.baseUrl.placeholder": { en: "http://localhost:11434", zh: "http://localhost:11434" },
  "ollama.model": { en: "Model", zh: "模型" },
  "ollama.model.placeholder": { en: "Select a model...", zh: "选择模型..." },
  "ollama.current": { en: "Current Configuration", zh: "当前配置" },
  "ollama.detect": { en: "Auto-detect", zh: "自动检测" },
  "ollama.connect": { en: "One-click Connect", zh: "一键接入" },
  "ollama.loading": { en: "Loading models...", zh: "加载模型..." },
  "ollama.noModels": { en: "No models found. Please install a model first.", zh: "未找到模型。请先安装一个模型。" },
  "ollama.version": { en: "Version", zh: "版本" },
  "ollama.models.available": { en: "Available Models", zh: "可用模型" },
  "ollama.models.size": { en: "Size", zh: "大小" },
  "ollama.models.family": { en: "Family", zh: "家族" },
  "ollama.config.save": { en: "Save Configuration", zh: "保存配置" },
  "ollama.config.success": { en: "Configuration saved successfully and applied immediately.", zh: "配置已保存并立即生效！" },
  "ollama.config.error": { en: "Failed to save configuration", zh: "保存配置失败" },
  "ollama.recommend": { en: "Recommended Models", zh: "推荐模型" },
  "ollama.reinstall.ollama": { en: "Ollama Not Installed", zh: "未安装 Ollama" },
  "ollama.reinstall.ollama.desc": { en: "Ollama is required to use AI features. Install it from", zh: "需要 Ollama 才能使用 AI 功能。从以下位置安装" },
  "ollama.install.link": { en: "ollama.com", zh: "ollama.com" },
  "ollama.install.start": { en: "Start Ollama Service", zh: "启动 Ollama 服务" },
  "ollama.install.start.desc": { en: "Run the following command in your terminal:", zh: "在终端中运行以下命令：" },
  "ollama.install.pull": { en: "Pull a Model", zh: "拉取模型" },
  "ollama.install.pull.desc": { en: "Example command to pull a model:", zh: "拉取模型的示例命令：" },
  "ollama.quickActions": { en: "Quick Actions", zh: "快捷操作" },
  "ollama.pull.qwen": { en: "Pull qwen3.5:0.8b (Fast)", zh: "拉取 qwen3.5:0.8b（快速）" },
  "ollama.pull.qwen.desc": { en: "Lightweight model (~500MB), suitable for most tasks", zh: "轻量级模型（~500MB），适合大多数任务" },
  "ollama.pull.llama": { en: "Pull llama3.1:8b (Balanced)", zh: "拉取 llama3.1:8b（均衡）" },
  "ollama.pull.llama.desc": { en: "Balanced model (~4.7GB), better quality", zh: "均衡模型（~4.7GB），质量更好" },
  "ollama.settings.button": { en: "Settings", zh: "设置" },
  "ollama.settings.tooltip": { en: "Open Ollama Configuration", zh: "打开 Ollama 配置" },
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
