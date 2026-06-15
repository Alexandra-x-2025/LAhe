import { RefreshCw, Zap, Terminal } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/src/lib/utils";
import { useLanguage } from "@/src/lib/i18n";

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

interface ConfigFormProps {
  baseUrl: string;
  selectedModel: string;
  isLoading: boolean;
  isConnecting: boolean;
  availableModels?: OllamaModel[];
  successMessage: string;
  onBaseUrlChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onAutoDetect: () => void;
  onConnect: () => void;
}

const RECOMMENDED_MODELS = [
  { id: "qwen3.5:0.8b", label: "qwen3.5:0.8b", descKey: "ollama.pull.qwen.desc" },
  { id: "llama3.1:8b", label: "llama3.1:8b", descKey: "ollama.pull.llama.desc" },
];

export function ConfigForm({
  baseUrl,
  selectedModel,
  isLoading,
  isConnecting,
  availableModels,
  successMessage,
  onBaseUrlChange,
  onModelChange,
  onAutoDetect,
  onConnect,
}: ConfigFormProps) {
  const { t, language } = useLanguage();

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
    <div className="space-y-4">
      {/* Base URL */}
      <div>
        <label className="block text-sm font-medium mb-2">{t("ollama.baseUrl")}</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => onBaseUrlChange(e.target.value)}
            placeholder={t("ollama.baseUrl.placeholder")}
            className="flex-1 bg-slate-900 border border-arch-border rounded-lg px-4 py-2.5 text-sm focus:border-arch-blue/50 focus:ring-1 focus:ring-arch-blue/20 outline-none"
          />
          <button
            onClick={onAutoDetect}
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
          onChange={(e) => onModelChange(e.target.value)}
          className="w-full bg-slate-900 border border-arch-border rounded-lg px-4 py-2.5 text-sm focus:border-arch-blue/50 focus:ring-1 focus:ring-arch-blue/20 outline-none cursor-pointer"
        >
          <option value="">{t("ollama.model.placeholder")}</option>
          {availableModels?.map((model) => (
            <option key={model.name} value={model.name}>
              {model.name} ({formatSize(model.size)})
            </option>
          ))}
        </select>

        {/* Model List */}
        {availableModels && availableModels.length > 0 && (
          <div className="mt-3">
            <div className="text-[10px] font-bold text-arch-text-muted uppercase tracking-wider mb-2">
              {t("ollama.models.available")}
            </div>
            <div className="space-y-1">
              {availableModels.map((model) => (
                <div
                  key={model.name}
                  onClick={() => onModelChange(model.name)}
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

        {availableModels && availableModels.length === 0 && (
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
        onClick={onConnect}
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
            <RefreshCw className="animate-spin" size={16} />
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
      {availableModels && availableModels.length === 0 && (
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
                <div className="text-[10px] text-arch-text-muted mt-1">{t(model.descKey)}</div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}