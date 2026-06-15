import { Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useLanguage } from "@/src/lib/i18n";

interface OllamaStatusCardProps {
  isLoading: boolean;
  isRunning: boolean | null | undefined;
  version?: string;
  onRefresh: () => void;
}

export function OllamaStatusCard({
  isLoading,
  isRunning,
  version,
  onRefresh,
}: OllamaStatusCardProps) {
  const { t, language } = useLanguage();

  return (
    <div className="bg-slate-900/50 rounded-xl p-4 border border-arch-border/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isLoading ? (
            <Loader2 className="animate-spin text-arch-text-muted" size={20} />
          ) : isRunning ? (
            <CheckCircle size={20} className="text-green-500" />
          ) : (
            <XCircle size={20} className="text-red-500" />
          )}
          <div>
            <div className="font-medium text-sm">
              {isLoading ? t("ollama.status.checking") :
               isRunning ? t("ollama.status.running") :
               t("ollama.status.notRunning")}
            </div>
            {version && (
              <div className="text-[10px] text-arch-text-muted">
                {t("ollama.version")}: {version}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <RefreshCw size={16} className={cn(isLoading && "animate-spin", "text-arch-text-muted")} />
        </button>
      </div>
    </div>
  );
}