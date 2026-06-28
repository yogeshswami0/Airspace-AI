import React from "react";
import { LayoutDashboard, Calendar, Edit3, Settings, Volume2, VolumeX, ShieldAlert, CheckSquare } from "lucide-react";
import { synth } from "../utils/synth";

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  openSettings, 
  urgencyLevel, 
  tasks, 
  isMuted, 
  setIsMuted 
}) {
  const tabs = [
    { id: "command", label: "Command Center", icon: LayoutDashboard },
    { id: "calendar", label: "Calendar Timeline", icon: Calendar },
    { id: "workspace", label: "Focus Workspace", icon: Edit3 },
  ];

  const handleMuteToggle = () => {
    const nextMuted = synth.toggleMute();
    setIsMuted(nextMuted);
    synth.playClick();
  };

  const doneCount = (tasks || []).filter(t => t.done).length;
  const totalCount = (tasks || []).length;

  return (
    <aside className="w-80 border-r border-slate-805 bg-cyber-dark/80 backdrop-blur-xl flex flex-col justify-between p-6 shrink-0 h-screen select-none sticky top-0">
      {/* Brand Header */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyber-cyan to-cyber-blue flex items-center justify-center neon-border-glow-cyan">
            <span className="text-xl font-extrabold text-cyber-dark">🛫</span>
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-wider flex items-center gap-1">
              AIRSPACE <span className="text-cyber-cyan text-sm px-1.5 py-0.5 rounded bg-cyber-cyan/10 font-bold border border-cyber-cyan/30">AI</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">Autonomous Workspace Orchestrator</p>
          </div>
        </div>

        {/* Tab list */}
        <nav className="flex flex-col gap-2 mt-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  synth.playClick();
                  setCurrentTab(tab.id);
                }}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition-all ${
                  active 
                    ? "bg-gradient-to-r from-cyber-cyan/15 to-cyber-blue/15 text-cyber-cyan border border-cyber-cyan/30 shadow-[0_0_15px_rgba(0,240,255,0.08)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
                }`}
              >
                <Icon size={20} className={active ? "text-cyber-cyan" : "text-slate-400"} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Stats Card */}
      <div className="flex flex-col gap-6">
        <div className="glass-panel rounded-2xl p-5 border-slate-800 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyber-cyan/5 rounded-full blur-2xl"></div>
          <h3 className="text-xs font-semibold text-slate-505 uppercase tracking-widest">Active Mission Stats</h3>
          
          {/* Urgency Badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Triage Level:</span>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
              urgencyLevel === "CRITICAL"
                ? "bg-cyber-pink/10 text-cyber-pink border-cyber-pink/30 neon-border-glow-pink"
                : urgencyLevel === "HIGH"
                ? "bg-cyber-yellow/10 text-cyber-yellow border-cyber-yellow/30"
                : "bg-cyber-green/10 text-cyber-green border-cyber-green/30"
            }`}>
              <ShieldAlert size={14} />
              {urgencyLevel}
            </div>
          </div>

          {/* Checklist progress */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400 flex items-center gap-1.5">
                <CheckSquare size={16} className="text-cyber-cyan" /> Focus Goals:
              </span>
              <span className="font-bold text-white">{doneCount}/{totalCount}</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-cyber-cyan to-cyber-blue h-full transition-all duration-500 rounded-full"
                style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-4">
          <button
            onClick={() => {
              synth.playClick();
              openSettings();
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 text-sm transition-all"
          >
            <Settings size={18} />
            Config
          </button>
          
          <button
            onClick={handleMuteToggle}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 transition-all"
            title={isMuted ? "Unmute sound effects" : "Mute sound effects"}
          >
            {isMuted ? <VolumeX size={18} className="text-cyber-pink" /> : <Volume2 size={18} className="text-cyber-cyan" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
