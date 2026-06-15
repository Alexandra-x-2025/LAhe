import { useState, useEffect } from "react";
import { Settings, XCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "@/src/lib/i18n";
import { OllamaStatusCard } from "./OllamaStatusCard";
import { InstallGuide } from "./InstallGuide";
import { ConfigForm } from "./ConfigForm";

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

export interface OllamaSettingsProps {
  onOpen?: () => void;
}

export function OllamaSettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t, language } = useLanguage();
  const [status, setStatus] = useState<OllamaStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showInstallGuide, setShowInstallGuide] = useState(false);

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

      setSuccessMessage(t("ollama.config.success"));
      await checkStatus();

      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      console.error("Connect failed:", error);
      alert(error instanceof Error ? error.message : (language === "en" ? "Connection failed" : "连接失败"));
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
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
                <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                  <XCircle size={20} className="text-arch-text-muted" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {/* Status Card */}
                <OllamaStatusCard
                  isLoading={isLoading}
                  isRunning={status?.isRunning}
                  version={status?.version}
                  onRefresh={checkStatus}
                />

                {/* Ollama Not Installed Guide */}
                {!status?.isRunning && (
                  <InstallGuide
                    show={showInstallGuide}
                    onToggle={() => setShowInstallGuide(!showInstallGuide)}
                    onCheckAgain={checkStatus}
                  />
                )}

                {/* Configuration Form */}
                {status?.isRunning && (
                  <ConfigForm
                    baseUrl={baseUrl}
                    selectedModel={selectedModel}
                    isLoading={isLoading}
                    isConnecting={isConnecting}
                    availableModels={status.availableModels}
                    successMessage={successMessage}
                    onBaseUrlChange={setBaseUrl}
                    onModelChange={setSelectedModel}
                    onAutoDetect={handleAutoDetect}
                    onConnect={handleConnect}
                  />
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function OllamaSettings({ onOpen }: OllamaSettingsProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
    onOpen?.();
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-arch-text-muted hover:text-arch-text-primary"
        title={t("ollama.settings.tooltip")}
      >
        <Settings size={16} />
      </button>

      <OllamaSettingsModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}