import { useState, useEffect } from "react";
import { Clock, MousePointer2, ChevronRight } from "lucide-react";
import { Interaction } from "@/src/types";
import { useLanguage } from "@/src/lib/i18n";

export default function HistoryView() {
  const [history, setHistory] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { language, t } = useLanguage();

  useEffect(() => {
    fetch("/api/history")
      .then(res => res.json())
      .then(data => {
        setHistory(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="animate-pulse text-gray-500 font-mono text-xs">{language === "en" ? "Loading kernel history..." : "正在加载内核记录..."}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-arch-border pb-4">
        <h2 className="text-xl font-bold tracking-tight">{t("nav.history")}</h2>
        <div className="text-[10px] font-mono text-gray-500 uppercase">{language === "en" ? "Total" : "总计"}: {history.length} {language === "en" ? "Entries" : "条记录"}</div>
      </div>

      {history.length === 0 ? (
        <div className="py-20 text-center text-gray-600">
          <Clock size={40} className="mx-auto mb-4 opacity-20" />
          <p className="text-sm">{language === "en" ? "No history recorded yet." : "暂无历史记录。"}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {history.map((item) => (
            <div 
              key={item.id}
              className="group p-4 bg-arch-surface-light border border-arch-border rounded-xl hover:border-slate-600 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-arch-blue shadow-[0_0_8px_rgba(23,147,209,0.4)]"></div>
                  <h3 className="font-semibold text-sm text-arch-text-primary group-hover:text-white transition-colors">{item.query}</h3>
                </div>
                <span className="text-[10px] font-mono text-arch-text-muted">{new Date(item.timestamp).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-arch-text-secondary line-clamp-1 ml-4 group-hover:text-arch-text-primary transition-colors">
                {item.response.replace(/[#*`]/g, '')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
