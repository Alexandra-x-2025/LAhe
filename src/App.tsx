/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Terminal, Database, Activity, History, ShieldAlert, Cpu, HardDrive, Info, Languages, Brain, Clock as ClockIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import Console from "@/src/components/Console";
import AuditView from "@/src/components/AuditView";
import HistoryView from "@/src/components/HistoryView";
import LogViewer from "@/src/components/LogViewer";
import SystemStats from "@/src/components/SystemStats";
import NeuralMap from "@/src/components/NeuralMap";
import Scheduler from "@/src/components/Scheduler";
import OllamaSettings from "@/src/components/OllamaSettings";
import { useLanguage } from "@/src/lib/i18n";

type View = "console" | "history" | "audit" | "logs" | "stats" | "skills" | "cron";

export default function App() {
  const [activeView, setActiveView] = useState<View>("console");
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { language, setLanguage, t } = useLanguage();

  const navItems = [
    { id: "console", label: t("nav.console"), icon: Terminal },
    { id: "history", label: t("nav.history"), icon: History },
    { id: "audit", label: t("nav.audit"), icon: ShieldAlert },
    { id: "logs", label: t("nav.logs"), icon: Database },
    { id: "stats", label: t("nav.stats"), icon: Activity },
    { id: "skills", label: t("nav.skills"), icon: Brain },
    { id: "cron", label: t("nav.cron"), icon: ClockIcon },
  ];

  return (
    <div className="flex h-screen w-full bg-arch-dark overflow-hidden font-sans text-arch-text-primary">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="flex flex-col border-r border-arch-border bg-arch-surface shadow-xl z-20"
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-arch-blue flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-arch-blue/20">
            A
          </div>
          {isSidebarOpen && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold text-lg tracking-tight whitespace-nowrap"
            >
              LA<span className="text-arch-blue">he</span>
            </motion.span>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
          <div className={cn("text-[10px] font-bold text-arch-text-muted uppercase tracking-[0.2em] px-3 mb-4", !isSidebarOpen && "text-center")}>
            {isSidebarOpen ? (language === "en" ? "Navigation" : "导航菜单") : "••"}
          </div>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as View)}
              className={cn(
                "w-full flex items-center gap-4 px-3 py-2.5 rounded-lg transition-all duration-200 group relative mb-1 text-left",
                activeView === item.id 
                  ? "bg-slate-800/80 text-white shadow-sm ring-1 ring-white/10" 
                  : "text-arch-text-secondary hover:bg-slate-800/40 hover:text-arch-text-primary"
              )}
            >
              <item.icon size={18} className={cn(activeView === item.id ? "text-arch-blue" : "text-arch-text-muted group-hover:text-arch-text-secondary")} strokeWidth={activeView === item.id ? 2.5 : 2} />
              {isSidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
              {activeView === item.id && (
                <motion.div 
                  layoutId="active-indicator"
                  className="absolute left-0 w-1 h-5 bg-arch-blue rounded-r-full"
                />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-arch-border bg-arch-header/30">
          <button 
            onClick={() => setLanguage(language === "en" ? "zh" : "en")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors mb-3 text-arch-text-muted hover:text-arch-text-primary"
          >
            <Languages size={14} />
            {isSidebarOpen && <span className="text-[10px] font-bold uppercase tracking-wider">{language === "en" ? "English" : "简体中文"}</span>}
          </button>
          <div className="flex items-center justify-between text-[10px] font-mono text-arch-text-muted">
            {isSidebarOpen ? (
              <>
                <span>v0.4.2-stable</span>
                <span className="text-arch-blue font-bold">pacman-hook: active</span>
              </>
            ) : (
              <ShieldAlert size={14} className="mx-auto text-arch-blue" />
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-16 border-b border-arch-border flex items-center justify-between px-8 bg-arch-header backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-8">
            <div className="flex flex-col text-[11px]">
              <span className="text-arch-text-muted uppercase font-bold tracking-wider">{t("header.kernel")}</span>
              <span className="font-mono text-white">6.6.10-arch1-1</span>
            </div>
            <div className="flex flex-col text-[11px] hidden md:flex">
              <span className="text-arch-text-muted uppercase font-bold tracking-wider">{t("header.uptime")}</span>
              <span className="font-mono text-white">2d 14h 22m</span>
            </div>
            <div className="flex flex-col text-[11px]">
              <span className="text-arch-text-muted uppercase font-bold tracking-wider">{t("header.updates")}</span>
              <span className="text-arch-blue font-mono">14 {t("header.pending")}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-[10px] font-bold text-arch-text-secondary uppercase mb-1">CPU: 12%</div>
                <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "12%" }}
                    className="h-full bg-arch-blue"
                  />
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-arch-border flex items-center justify-center text-[10px] font-bold text-arch-text-muted hover:text-white hover:border-slate-600 transition-colors cursor-pointer">
                root
              </div>
            </div>

            {/* Ollama Settings */}
            <OllamaSettings />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative custom-scrollbar bg-[radial-gradient(circle_at_50%_0%,rgba(23,147,209,0.03)_0%,transparent_50%)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeView === "console" && <Console />}
              {activeView === "history" && <HistoryView />}
              {activeView === "audit" && <AuditView />}
              {activeView === "logs" && <LogViewer />}
              {activeView === "stats" && <SystemStats />}
              {activeView === "skills" && <NeuralMap />}
              {activeView === "cron" && <Scheduler />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Global Technical Accents */}
        <div className="absolute bottom-4 right-8 pointer-events-none opacity-20">
          <pre className="text-[8px] font-mono leading-none">
{`                   -
                  ---
                 -----
                -------
               ---------
              -----------
             -------------
            ---------------
           -----------------
          -------------------
         ---------------------
        -----------------------`}
          </pre>
        </div>
      </main>
    </div>
  );
}
