import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import CommandCenter from "./components/CommandCenter";
import CalendarView from "./components/CalendarView";
import WorkspaceView from "./components/WorkspaceView";
import SettingsModal from "./components/SettingsModal";
import { MessageSquare, X, Zap } from "lucide-react";
import { synth } from "./utils/synth";
import { db } from "./utils/db";

export default function App() {
  const [currentTab, setCurrentTab] = useState("command");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Core Application Workspace State (Loaded from DB)
  const [urgencyLevel, setUrgencyLevel] = useState("NONE");
  const [documentTitle, setDocumentTitle] = useState("");
  const [suggestedMarkdown, setSuggestedMarkdown] = useState("");
  const [tasks, setTasks] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);

  // Toast Notification popup state
  const [toastMessage, setToastMessage] = useState(null);

  // Load from DB on Mount
  useEffect(() => {
    const dbTasks = db.getTasks();
    const dbEvents = db.getEvents();
    const dbDoc = db.getWorkspaceDoc();
    const dbUrgency = db.getUrgencyLevel();

    setTasks(dbTasks || []);
    setCalendarEvents(dbEvents || []);
    setDocumentTitle(dbDoc.title || "");
    setSuggestedMarkdown(dbDoc.markdown || "");
    setUrgencyLevel(dbTasks.length > 0 || dbEvents.length > 0 ? dbUrgency : "NONE");
  }, []);

  // Sync state modifications back to DB
  const handleTriageComplete = (triageData) => {
    if (!triageData) return;
    
    const nextUrgency = triageData.urgencyLevel || "NONE";
    const nextTitle = triageData.documentTitle || "";
    const nextMarkdown = triageData.suggestedMarkdown || "";
    const nextTasks = triageData.tasks || [];
    const nextEvents = triageData.calendarEvents || [];

    setUrgencyLevel(nextUrgency);
    setDocumentTitle(nextTitle);
    setSuggestedMarkdown(nextMarkdown);
    setTasks(nextTasks);
    setCalendarEvents(nextEvents);

    // Write to persistent dataset
    db.saveUrgencyLevel(nextUrgency);
    db.saveWorkspaceDoc(nextTitle, nextMarkdown);
    db.saveTasks(nextTasks);
    db.saveEvents(nextEvents);

    // Pop up "Execution Plan Ready" toast message immediately
    setToastMessage("🚀 EXECUTION PLAN READY! Mapped calendar blocks & generated outline. Click to proceed.");
    synth.playSuccess();
    setTimeout(() => {
      setToastMessage(null);
    }, 6000);
  };

  const handleTasksChange = (newTasks) => {
    const safeTasks = newTasks || [];
    setTasks(safeTasks);
    db.saveTasks(safeTasks);
  };

  const handleEventsChange = (newEvents) => {
    const safeEvents = newEvents || [];
    setCalendarEvents(safeEvents);
    db.saveEvents(safeEvents);
  };

  const handleMarkdownChange = (newMarkdown) => {
    const safeMarkdown = newMarkdown || "";
    setSuggestedMarkdown(safeMarkdown);
    db.saveWorkspaceDoc(documentTitle, safeMarkdown);
  };

  // AI Assistant bubble state
  const [assistantOpen, setAssistantOpen] = useState(true);
  const [assistantMsg, setAssistantMsg] = useState("Awaiting your input, Commander. Load a preset or dump your deadline panic into the Command Center to initiate triage.");

  // Count pending goals with null safety
  const pendingCount = (tasks || []).filter(t => !t.done).length;

  // Dynamically update assistant bubble messages
  useEffect(() => {
    if (pendingCount > 0) {
      setAssistantMsg(`🚨 CO-PILOT ALERT: You have ${pendingCount} pending task(s) to finish! Please open the Focus Workspace checklist to complete them.`);
    } else if (urgencyLevel === "CRITICAL") {
      setAssistantMsg("⚠️ CRITICAL LEVEL: Focus blocks are scheduled. Toggle the Focus Workspace, start the Pomodoro counter, and activate the synthesized Focus Hum to block out distractions!");
    } else if (urgencyLevel === "HIGH") {
      setAssistantMsg("⚡ HIGH URGENCY: Key tasks have been committed to the database. Review focus blocks on the Calendar and check off completed goals.");
    } else if (urgencyLevel === "MEDIUM") {
      setAssistantMsg("💡 MEDIUM URGENCY: Blueprint workspace active. Begin working at your own pace. All state transitions persist in the local dataset.");
    } else {
      setAssistantMsg("💤 Standby mode. Ready to ingest chaotic schedules and auto-generate task databases.");
    }
  }, [urgencyLevel, pendingCount]);

  return (
    <div className="flex bg-cyber-dark min-h-screen text-slate-200">
      {/* Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openSettings={() => setSettingsOpen(true)}
        urgencyLevel={urgencyLevel}
        tasks={tasks}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
      />

      {/* Main Panel Viewport */}
      <main className="flex-1 flex flex-col min-w-0 h-screen relative overflow-hidden bg-gradient-to-b from-slate-900/10 to-slate-950/40">
        
        {/* Dynamic Toast Popup Notification (At top center) */}
        {toastMessage && (
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 min-w-[320px] max-w-md bg-slate-950 border border-cyber-cyan rounded-2xl p-4 shadow-[0_0_25px_rgba(0,240,255,0.25)] flex items-center justify-between gap-3 animate-slide-down">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyber-cyan animate-ping"></span>
              <p className="text-xs text-cyber-cyan font-bold tracking-wider leading-relaxed">{toastMessage}</p>
            </div>
            <button 
              onClick={() => setToastMessage(null)}
              className="text-slate-500 hover:text-slate-200 p-1"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Render only active tab */}
        <div className="flex-1 flex flex-col overflow-y-auto" key={currentTab}>
          {currentTab === "command" && (
            <CommandCenter 
              onTriageComplete={handleTriageComplete} 
              setCurrentTab={setCurrentTab}
            />
          )}
          {currentTab === "calendar" && (
            <CalendarView 
              calendarEvents={calendarEvents} 
              setCalendarEvents={handleEventsChange} 
            />
          )}
          {currentTab === "workspace" && (
            <WorkspaceView
              documentTitle={documentTitle}
              suggestedMarkdown={suggestedMarkdown}
              setSuggestedMarkdown={handleMarkdownChange}
              tasks={tasks}
              setTasks={handleTasksChange}
            />
          )}
        </div>
      </main>

      {/* Settings Panel Modal */}
      <SettingsModal 
        isOpen={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
      />

      {/* Floating AI Co-Pilot Widget */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 max-w-sm font-outfit select-none">
        {assistantOpen && (
          <div className="bg-slate-955/95 border border-cyber-cyan/35 rounded-2xl p-4 shadow-[0_0_20px_rgba(0,240,255,0.15)] flex flex-col gap-2 relative animate-slide-up glass-panel">
            {/* Close Button */}
            <button 
              onClick={() => {
                synth.playClick();
                setAssistantOpen(false);
              }}
              className="absolute top-2.5 right-2.5 text-slate-500 hover:text-slate-350"
            >
              <X size={14} />
            </button>
            <div className="flex items-center gap-1.5 text-cyber-cyan text-[10px] font-black uppercase tracking-widest mt-0.5">
              <Zap size={10} fill="currentColor" /> Airspace Co-Pilot
            </div>
            <p className="text-xs text-slate-300 font-medium leading-relaxed pr-2">
              {assistantMsg}
            </p>
          </div>
        )}
        <div className="relative">
          {/* Red Alert Notification Badge for Pending Tasks */}
          {pendingCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 z-50 bg-cyber-pink border border-cyber-dark text-white font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow-md">
              {pendingCount}
            </span>
          )}
          <button
            onClick={() => {
              synth.playClick();
              setAssistantOpen(!assistantOpen);
            }}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyber-cyan to-cyber-blue text-cyber-dark flex items-center justify-center font-bold hover:shadow-neon hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)]"
            title="Talk with AI Co-Pilot"
          >
            <MessageSquare size={22} fill="currentColor" className="text-cyber-dark" />
          </button>
        </div>
      </div>
    </div>
  );
}
