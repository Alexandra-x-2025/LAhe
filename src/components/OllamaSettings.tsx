import { useState, useEffect } from "react";
import {
  Settings,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Terminal,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { useLanguage } from "@/src/lib/i18n";

interface OllamaStatus {
  isRunning: boolean;
  baseUrl: string;
  version?: string;
  currentConfig?: {
    baseUrl: string;
    model: string;
  };
  availableModels?: OllamaModel[];
  error?: string;
}

interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

const RECOMMENDED_MODELS = [
  { id: "qwen3.5:0.8b", label: "qwen3.5:0.8b", desc: "ollama.pull.qwen.desc", size: "~500MB" },
  { id: "llama3.1:8b", label: "llama3.1:8b", desc: "ollama.pull.llama.desc", size: "~4.7GB" },
];

export default function OllamaSettings() {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<OllamaStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  // 加载初始状态
  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  const checkStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/ollama/status");
      const data = await res.json();
      setStatus(data);
      if (data.currentConfig) {
        setBaseUrl(data.currentConfig.baseUrl);
        setSelectedModel(data.currentConfig.model);
      }
    } catch (error) {
      setStatus({ isRunning: false, baseUrl: "", error: String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoDetect = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/ollama/status?baseUrl=http://localhost:11434");
      const data = await res.json();
      setStatus(data);
      if (data.isRunning) {
        setBaseUrl("http://localhost:11434");
        if (data.availableModels && data.availableModels.length > 0) {
          setSelectedModel(data.availableModels[0].name);
        }
      }
    } catch (error) {
      console.error("Auto-detect failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!baseUrl || !selectedModel) return;

    setIsConnecting(true);
    try {
      const res = await fetch("/api/ollama/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl, model: selectedModel }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Connection failed");
      }

      setSuccessMessage(language === "en" ? "Configuration saved! Restart the service to apply changes." : "配置已保存！重启服务以应用更改。");
      await checkStatus();

      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      console.error("Connect failed:", error);
      alert(error instanceof Error ? error.message : (language === "en" ? "Connection failed" : "连接失败"));
    } finally {
      setIsConnecting(false);
    }
  };

  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
  };

  const formatSize = (bytes: number) => {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <>
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-arch-text-muted hover:text-arch-text-primary"
        title={t("ollama.settings.tooltip")}
      >
        <Settings size={16} />
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Modal Content */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-2xl bg-arch-surface border border-arch-border rounded-2xl shadow-2xl overflow-hidden"
              >
                {/* Header */}
                <div className="p-6 border-b border-arch-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-arch-blue/10 flex items-center justify-center">
                      <Settings size={20} className="text-arch-blue" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">{t("ollama.title")}</h2>
                      <p className="text-xs text-arch-text-muted">{t("ollama.description")}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <XCircle size={20} className="text-arch-text-muted" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  {/* Status Card */}
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-arch-border/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isLoading ? (
                          <Loader2 className="animate-spin text-arch-text-muted" size={20} />
                        ) : status?.isRunning ? (
                          <CheckCircle size={20} className="text-green-500" />
                        ) : (
                          <XCircle size={20} className="text-red-500" />
                        )}
                        <div>
                          <div className="font-medium text-sm">
                            {isLoading ? t("ollama.status.checking") :
                             status?.isRunning ? t("ollama.status.running") :
                             t("ollama.status.notRunning")}
                          </div>
                          {status?.version && (
                            <div className="text-[10px] text-arch-text-muted">
                              {t("ollama.version")}: {status.version}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={checkStatus}
                        disabled={isLoading}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <RefreshCw size={16} className={cn(isLoading && "animate-spin", "text-arch-text-muted")} />
                      </button>
                    </div>
                  </div>

                  {/* Ollama Not Installed Guide */}
                  {!status?.isRunning && (
                    <div className="space-y-4">
                      <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <Terminal size={20} className="text-orange-500 shrink-0" />
                          <div className="flex-1">
                            <h4 className="font-bold text-orange-500 mb-1">{t("ollama.reinstall.ollama")}</h4>
                            <p className="text-sm text-arch-text-secondary mb-3">
                              {t("ollama.reinstall.ollama.desc")}{" "}
                              <a
                                href="https://ollama.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-orange-500 hover:underline flex items-center gap-1 inline-flex"
                              >
                                {t("ollama.install.link")} <ExternalLink size={12} />
                              </a>
                            </p>
                            <button
                              onClick={() => setShowInstallGuide(!showInstallGuide)}
                              className="text-sm text-orange-500 hover:text-orange-400 font-medium"
                            >
                              {showInstallGuide ? (language === "en" ? "Hide Guide" : "隐藏指南") :
                               (language === "en" ? "Show Setup Guide" : "显示设置指南")}
                              {showInstallGuide ? <ChevronUp size={14} className="inline ml-1" /> :
                               <ChevronDown size={14} className="inline ml-1" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {showInstallGuide && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4"
                          >
                            <div className="bg-slate-900/50 rounded-xl p-4 border border-arch-border/50">
                              <h5 className="font-bold text-sm mb-3 flex items-center gap-2">
                                <Zap size={16} className="text-arch-blue" />
                                {t("ollama.install.start")}
                              </h5>
                              <p className="text-xs text-arch-text-muted mb-3">{t("ollama.install.start.desc")}</p>
                              <div className="bg-black rounded-lg p-3 font-mono text-sm text-green-400 relative group">
                                <code>ollama serve</code>
                                <button
                                  onClick={() => copyCommand("ollama serve")}
                                  className="absolute right-2 top-2 p-1 hover:bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Copy size={14} className="text-arch-text-muted" />
                                </button>
                              </div>
                            </div>

                            <div className="bg-slate-900/50 rounded-xl p-4 border border-arch-border/50">
                              <h5 className="font-bold text-sm mb-3 flex items-center gap-2">
                                <Zap size={16} className="text-arch-blue" />
                                {t("ollama.install.pull")}
                              </h5>
                              <p className="text-xs text-arch-text-muted mb-3">{t("ollama.install.pull.desc")}</p>
                              {RECOMMENDED_MODELS.map((model) => (
                                <div key={model.id} className="mb-2">
                                  <div className="bg-black rounded-lg p-3 font-mono text-sm text-green-400 relative group">
                                    <code>ollama pull {model.id}</code>
                                    <button
                                      onClick={() => copyCommand(`ollama pull ${model.id}`)}
                                      className="absolute right-2 top-2 p-1 hover:bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Copy size={14} className="text-arch-text-muted" />
                                    </button>
                                  </div>
                                  <p className="text-[10px] text-arch-text-muted mt-1 ml-1">
                                    {t(model.desc)} ({model.size})
                                  </p>
                                </div>
                              ))}
                            </div>

                            <button
                              onClick={checkStatus}
                              className="w-full py-3 bg-arch-blue text-white rounded-xl font-bold hover:bg-arch-blue/80 transition-colors"
                            >
                              {language === "en" ? "I've Set Up Ollama, Check Again" : "我已设置好 Ollama，重新检测"}
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Configuration Form */}
                  {status?.isRunning && (
                    <div className="space-y-4">
                      {/* Base URL */}
                      <div>
                        <label className="block text-sm font-medium mb-2">{t("ollama.baseUrl")}</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={baseUrl}
                            onChange={(e) => setBaseUrl(e.target.value)}
                            placeholder={t("ollama.baseUrl.placeholder")}
                            className="flex-1 bg-slate-900 border border-arch-border rounded-lg px-4 py-2.5 text-sm focus:border-arch-blue/50 focus:ring-1 focus:ring-arch-blue/20 outline-none"
                          />
                          <button
                            onClick={handleAutoDetect}
                            disabled={isLoading}
                            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-arch-text-primary rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                          >
                            <RefreshCw size={14} className={cn(isLoading && "animate-spin")} />
                            {t("ollama.detect")}
                          </button>
                        </div>
                      </div>

                      {/* Model Selection */}
                      <div>
                        <label className="block text-sm font-medium mb-2">{t("ollama.model")}</label>
                        <select
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          className="w-full bg-slate-900 border border-arch-border rounded-lg px-4 py-2.5 text-sm focus:border-arch-blue/50 focus:ring-1 focus:ring-arch-blue/20 outline-none cursor-pointer"
                        >
                          <option value="">{t("ollama.model.placeholder")}</option>
                          {status.availableModels?.map((model) => (
                            <option key={model.name} value={model.name}>
                              {model.name} ({formatSize(model.size)})
                            </option>
                          ))}
                        </select>

                        {/* Model List */}
                        {status.availableModels && status.availableModels.length > 0 && (
                          <div className="mt-3">
                            <div className="text-[10px] font-bold text-arch-text-muted uppercase tracking-wider mb-2">
                              {t("ollama.models.available")}
                            </div>
                            <div className="space-y-1">
                              {status.availableModels.map((model) => (
                                <div
                                  key={model.name}
                                  onClick={() => setSelectedModel(model.name)}
                                  className={cn(
                                    "p-3 rounded-lg cursor-pointer transition-colors border",
                                    selectedModel === model.name
                                      ? "bg-arch-blue/10 border-arch-blue/30"
                                      : "bg-slate-900/50 border-arch-border/30 hover:bg-slate-900/80"
                                  )}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className={cn(
                                        "w-2 h-2 rounded-full",
                                        selectedModel === model.name ? "bg-arch-blue" : "bg-arch-text-muted"
                                      )} />
                                      <span className="font-medium text-sm">{model.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] text-arch-text-muted">
                                      <span>{formatSize(model.size)}</span>
                                      <span>{model.details.family}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {status.availableModels?.length === 0 && (
                          <div className="mt-3 text-center py-4 bg-slate-900/30 rounded-lg border border-arch-border/30">
                            <Terminal size={24} className="mx-auto text-arch-text-muted mb-2" />
                            <p className="text-sm text-arch-text-muted">{t("ollama.noModels")}</p>
                          </div>
                        )}
                      </div>

                      {/* Success Message */}
                      {successMessage && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-sm text-green-400"
                        >
                          {successMessage}
                        </motion.div>
                      )}

                      {/* Connect Button */}
                      <button
                        onClick={handleConnect}
                        disabled={!baseUrl || !selectedModel || isConnecting}
                        className={cn(
                          "w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                          !baseUrl || !selectedModel
                            ? "bg-slate-800 text-arch-text-muted cursor-not-allowed"
                            : "bg-arch-blue text-white hover:bg-arch-blue/80 shadow-lg shadow-arch-blue/20"
                        )}
                      >
                        {isConnecting ? (
                          <>
                            <Loader2 className="animate-spin" size={16} />
                            {language === "en" ? "Connecting..." : "连接中..."}
                          </>
                        ) : (
                          <>
                            <Zap size={16} />
                            {t("ollama.connect")}
                          </>
                        )}
                      </button>

                      {/* Quick Actions */}
                      {status.availableModels && status.availableModels.length === 0 && (
                        <div className="border-t border-arch-border pt-4">
                          <div className="text-[10px] font-bold text-arch-text-muted uppercase tracking-wider mb-3">
                            {t("ollama.quickActions")}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {RECOMMENDED_MODELS.map((model) => (
                              <a
                                key={model.id}
                                href={`ollama://pull/${model.id}`}
                                className="bg-slate-900/50 border border-arch-border/50 rounded-lg p-3 hover:bg-slate-900/80 hover:border-arch-blue/30 transition-all"
                              >
                                <div className="font-medium text-sm text-arch-blue">{t(model.label)}</div>
                                <div className="text-[10px] text-arch-text-muted mt-1">{t(model.desc)}</div>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}