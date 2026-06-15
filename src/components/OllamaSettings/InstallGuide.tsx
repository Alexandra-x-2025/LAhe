import { Terminal, ExternalLink, Copy, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "@/src/lib/i18n";

interface InstallGuideProps {
  show: boolean;
  onToggle: () => void;
  onCheckAgain: () => void;
}

const RECOMMENDED_MODELS = [
  { id: "qwen3.5:0.8b", descKey: "ollama.pull.qwen.desc", size: "~500MB" },
  { id: "llama3.1:8b", descKey: "ollama.pull.llama.desc", size: "~4.7GB" },
];

export function InstallGuide({ show, onToggle, onCheckAgain }: InstallGuideProps) {
  const { t, language } = useLanguage();

  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
  };

  return (
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
              onClick={onToggle}
              className="text-sm text-orange-500 hover:text-orange-400 font-medium"
            >
              {show ? (language === "en" ? "Hide Guide" : "隐藏指南") :
               (language === "en" ? "Show Setup Guide" : "显示设置指南")}
              {show ? <ChevronUp size={14} className="inline ml-1" /> :
               <ChevronDown size={14} className="inline ml-1" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {show && (
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
                    {t(model.descKey)} ({model.size})
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={onCheckAgain}
              className="w-full py-3 bg-arch-blue text-white rounded-xl font-bold hover:bg-arch-blue/80 transition-colors"
            >
              {language === "en" ? "I've Set Up Ollama, Check Again" : "我已设置好 Ollama，重新检测"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}