import React, { useState, useEffect, useRef } from "react";
import { CheckSquare, FileEdit, Eye, Play, Pause, RotateCcw, Copy, Check, Headphones, Plus, Trash2, Send } from "lucide-react";
import { synth } from "../utils/synth";
import { db } from "../utils/db";

export default function WorkspaceView({ 
  documentTitle, 
  suggestedMarkdown, 
  setSuggestedMarkdown, 
  tasks, 
  setTasks 
}) {
  const [editMode, setEditMode] = useState(false); // false = Preview, true = Editor
  const [copied, setCopied] = useState(false);
  const [droneActive, setDroneActive] = useState(false);
  
  // Email Sheet Compose States
  const isEmailWorkspace = documentTitle && (documentTitle || "").toLowerCase().includes("email");
  const [mailTo, setMailTo] = useState("");
  const [mailSubject, setMailSubject] = useState("");
  const [mailBody, setMailBody] = useState("");
  const [mailSending, setMailSending] = useState(false);
  const [mailSent, setMailSent] = useState(false);
  const [userEmail, setUserEmail] = useState("user@airspace.ai");

  // Pomodoro states
  const [timeRemaining, setTimeRemaining] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState(25); // 25, 5, 15
  const timerRef = useRef(null);

  // New custom goal
  const [newGoalText, setNewGoalText] = useState("");

  // Sync email states when suggestedMarkdown or title shifts
  useEffect(() => {
    if (isEmailWorkspace && suggestedMarkdown) {
      const text = suggestedMarkdown || "";
      const toMatch = text.match(/Draft Email to (.*)/i);
      const subMatch = text.match(/\*\*Subject\*\*:\s*(.*)/i);
      const bodyParts = text.split("---");
      const bodyText = bodyParts[bodyParts.length - 1] || "";
      
      setMailTo(toMatch ? toMatch[1].trim() : "Recipient");
      setMailSubject(subMatch ? subMatch[1].trim() : "Discussion");
      setMailBody(bodyText.trim());
      setMailSent(false);
      setMailSending(false);
      setUserEmail(db.getUserEmail());
    }
  }, [suggestedMarkdown, documentTitle]);

  // Clean focus hum on unmount
  useEffect(() => {
    return () => {
      synth.stopFocusHum();
    };
  }, []);

  // Timer Countdown Logic
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerRunning(false);
            synth.playTimerFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  const handleTimerModeChange = (minutes) => {
    synth.playClick();
    setTimerMode(minutes);
    setTimeRemaining(minutes * 60);
    setTimerRunning(false);
  };

  const handleStartPauseTimer = () => {
    synth.playClick();
    setTimerRunning(!timerRunning);
  };

  const handleResetTimer = () => {
    synth.playClick();
    setTimerRunning(false);
    setTimeRemaining(timerMode * 60);
  };

  const handleDroneToggle = () => {
    synth.playClick();
    if (droneActive) {
      synth.stopFocusHum();
      setDroneActive(false);
    } else {
      synth.startFocusHum();
      setDroneActive(true);
    }
  };

  // Copy workspace content
  const handleCopy = () => {
    synth.playSuccess();
    navigator.clipboard.writeText(suggestedMarkdown || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  // Task Operations
  const handleToggleTask = (id) => {
    synth.playClick();
    setTasks(prev => (prev || []).map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;
    synth.playClick();
    const newTask = {
      id: `custom_${Date.now()}`,
      text: newGoalText,
      done: false
    };
    setTasks(prev => [...(prev || []), newTask]);
    setNewGoalText("");
  };

  const handleDeleteTask = (id) => {
    synth.playAlarm();
    setTasks(prev => (prev || []).filter(t => t.id !== id));
  };

  // Send Email Action
  const handleSendEmailSubmit = () => {
    synth.playClick();
    setMailSending(true);

    setTimeout(() => {
      synth.playSuccess();
      setMailSending(false);
      setMailSent(true);

      // Auto-complete the task list goals relating to sending drafts
      setTasks(prev => (prev || []).map(t => {
        if (t.text.toLowerCase().includes("send") || t.text.toLowerCase().includes("mail") || t.text.toLowerCase().includes("draft")) {
          return { ...t, done: true };
        }
        return t;
      }));
    }, 1800);
  };

  // Quick Markdown Parser using lightweight Regexes for safe HTML injection
  const renderMarkdown = (text) => {
    if (!text) return '<p class="text-slate-500 italic text-center py-10">No active workspace layout loaded. Run the Triage Engine in the Command Center to populate this panel.</p>';
    
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h4 class="text-xs font-bold text-cyber-cyan uppercase tracking-wider mt-5 mb-2 font-outfit">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 class="text-sm font-bold text-white border-b border-slate-800/80 pb-1.5 mt-6 mb-3 uppercase tracking-widest">$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2 class="text-lg font-black text-white mt-2 mb-4 bg-gradient-to-r from-cyber-cyan to-cyber-blue -webkit-background-clip text text-gradient-cyan">$1</h2>');

    // Code blocks
    html = html.replace(/```javascript([\s\S]*?)```/gim, '<pre class="bg-slate-950/80 p-4 rounded-xl border border-slate-900 font-mono text-[11px] text-slate-300 my-4 overflow-x-auto leading-relaxed">$1</pre>');
    html = html.replace(/```([\s\S]*?)```/gim, '<pre class="bg-slate-950/80 p-4 rounded-xl border border-slate-900 font-mono text-[11px] text-slate-300 my-4 overflow-x-auto leading-relaxed">$1</pre>');

    // Lines
    html = html.replace(/^---$/gim, '<hr class="border-slate-800/80 my-6" />');

    // Lists
    html = html.replace(/^- (.*$)/gim, '<li class="text-xs text-slate-300 list-disc ml-5 my-1.5">$1</li>');

    // Bold/Italics
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>');

    return html;
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const progressPercent = ((timerMode * 60 - timeRemaining) / (timerMode * 60)) * 100;

  return (
    <div className="flex-1 p-8 overflow-y-auto flex flex-col gap-8 max-w-6xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            FOCUS <span className="text-gradient">WORKSPACE</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1 font-medium">Execute drafted blueprints, slide outlines, code segments, and track goals.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Tasks Checklist */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass-panel rounded-3xl p-6 border-slate-800 flex flex-col gap-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
              <CheckSquare size={14} className="text-cyber-cyan" /> Focus Goals Checklist
            </div>

            {/* Add Custom Goal (White background, Black text for high readability) */}
            <form onSubmit={handleAddTask} className="flex gap-2">
              <input
                type="text"
                value={newGoalText}
                onChange={(e) => setNewGoalText(e.target.value)}
                placeholder="Add custom workspace goal..."
                className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-black placeholder-slate-400 focus:outline-none focus:border-cyber-cyan/60 font-medium"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-cyber-cyan/15 text-cyber-cyan hover:bg-cyber-cyan/25 border border-cyber-cyan/20 transition-all"
              >
                <Plus size={16} />
              </button>
            </form>

            {/* Tasks checklist container */}
            <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
              {(tasks || []).length === 0 ? (
                <div className="text-slate-655 italic text-xs py-4 text-center">
                  No active goals loaded. Run a triage to initialize database checklist.
                </div>
              ) : (
                (tasks || []).map((task) => (
                  <div 
                    key={task.id} 
                    className={`flex items-center justify-between p-3 rounded-xl border border-slate-900 bg-slate-955/40 group transition-all ${
                      task.done ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex gap-3 items-center flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={task.done}
                        onChange={() => handleToggleTask(task.id)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyber-cyan focus:ring-cyber-cyan shrink-0 cursor-pointer"
                      />
                      <span className={`text-xs font-semibold truncate ${task.done ? "line-through text-slate-500" : "text-slate-300"}`}>
                        {task.text}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-slate-655 hover:text-cyber-pink opacity-0 group-hover:opacity-100 p-1 rounded transition-all shrink-0"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pomodoro Focus Timer Card */}
          <div className="glass-panel rounded-3xl p-6 border-slate-800 flex flex-col items-center gap-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyber-blue/5 rounded-full blur-2xl"></div>
            
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Focus Timer</span>
              {/* Drone Synthesizer Button */}
              <button
                onClick={handleDroneToggle}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                  droneActive
                    ? "bg-cyber-cyan/15 text-cyber-cyan border-cyber-cyan/35 shadow-[0_0_10px_rgba(0,240,255,0.15)]"
                    : "bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-200"
                }`}
                title="Toggle focus hum (low sound oscillation drone)"
              >
                <Headphones size={12} />
                {droneActive ? "DRONE ON" : "DRONE OFF"}
              </button>
            </div>

            {/* Circular Timer Visual */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle 
                  cx="72" 
                  cy="72" 
                  r="64" 
                  className="stroke-slate-850" 
                  strokeWidth="6" 
                  fill="transparent" 
                />
                <circle 
                  cx="72" 
                  cy="72" 
                  r="64" 
                  className="stroke-cyber-cyan transition-all duration-300" 
                  strokeWidth="6" 
                  fill="transparent" 
                  strokeDasharray={2 * Math.PI * 64}
                  strokeDashoffset={2 * Math.PI * 64 * (1 - progressPercent / 100)}
                />
              </svg>
              <div className="flex flex-col items-center z-10">
                <span className="text-3xl font-black text-white font-mono leading-none tracking-tight">
                  {formatTime(timeRemaining)}
                </span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1.5">
                  {timerMode === 25 ? "Focus Session" : "Break Session"}
                </span>
              </div>
            </div>

            {/* Pomodoro Presets */}
            <div className="flex gap-2">
              {[
                { label: "Pomodoro", mins: 25 },
                { label: "Short Break", mins: 5 },
                { label: "Long Break", mins: 15 }
              ].map((m) => (
                <button
                  key={m.mins}
                  onClick={() => handleTimerModeChange(m.mins)}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                    timerMode === m.mins
                      ? "bg-cyber-cyan/15 text-cyber-cyan border-cyber-cyan/35"
                      : "bg-slate-900 border-slate-855 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Controls */}
            <div className="flex gap-3 w-full mt-1">
              <button
                onClick={handleStartPauseTimer}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyber-cyan to-cyber-blue text-cyber-dark hover:shadow-neon flex items-center justify-center gap-1.5 transition-all"
              >
                {timerRunning ? (
                  <>
                    <Pause size={14} fill="currentColor" />
                    PAUSE TIMER
                  </>
                ) : (
                  <>
                    <Play size={14} fill="currentColor" />
                    START FOCUS
                  </>
                )}
              </button>
              <button
                onClick={handleResetTimer}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-855 border border-slate-850 text-slate-400 hover:text-slate-200 transition-all"
                title="Reset timer"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Markdown Editor / Email Compose Sheet */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="glass-panel rounded-3xl border-slate-805 flex flex-col h-[520px] overflow-hidden">
            {/* Toolbar Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-900 bg-slate-900/20 shrink-0">
              <div className="flex items-center gap-2">
                <FileEdit size={16} className="text-cyber-cyan" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">{documentTitle || "Blueprint Workspace"}</h3>
              </div>
              
              <div className="flex items-center gap-4">
                {!isEmailWorkspace && (
                  <div className="flex bg-slate-900/90 border border-slate-855 rounded-xl p-0.5">
                    <button
                      onClick={() => {
                        synth.playClick();
                        setEditMode(false);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        !editMode 
                          ? "bg-slate-800 text-white" 
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Eye size={12} />
                      Preview
                    </button>
                    <button
                      onClick={() => {
                        synth.playClick();
                        setEditMode(true);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        editMode 
                          ? "bg-slate-800 text-white" 
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <FileEdit size={12} />
                      Editor
                    </button>
                  </div>
                )}

                {/* Copy Button */}
                <button
                  onClick={handleCopy}
                  className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
                    copied
                      ? "bg-cyber-green/10 border-cyber-green/35 text-cyber-green"
                      : "bg-slate-900 border-slate-855 text-slate-400 hover:text-slate-200"
                  }`}
                  title="Copy document to clipboard"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Document Body (Renders dedicated Email compose sheets or Markdown sheets) */}
            <div className="flex-1 overflow-y-auto p-6 font-outfit min-h-0 bg-slate-955/20">
              {isEmailWorkspace ? (
                /* Dedicated Email Compose Screen */
                mailSent ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center gap-4 animate-slide-up">
                    <div className="w-16 h-16 rounded-full bg-cyber-green/10 border border-cyber-green/30 flex items-center justify-center text-cyber-green text-3xl">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white uppercase tracking-wider">Email Dispatched Successfully!</h4>
                      <p className="text-xs text-slate-450 mt-1 max-w-[280px] leading-relaxed">
                        The message from <strong>{userEmail}</strong> to <strong>{mailTo}</strong> has been sent. The related workspace checkoff task has been marked complete.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full flex flex-col gap-4 font-outfit animate-slide-up">
                    {/* From Field - Read-only showing the saved user email address */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">From</label>
                      <input
                        type="text"
                        value={userEmail}
                        disabled={true}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-400 font-semibold focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">To</label>
                      <input
                        type="text"
                        value={mailTo}
                        onChange={(e) => setMailTo(e.target.value)}
                        disabled={mailSending}
                        className="w-full bg-white border border-slate-350 rounded-xl px-4 py-2.5 text-xs text-black font-semibold focus:outline-none focus:border-cyber-cyan/50"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-505 uppercase tracking-widest">Subject</label>
                      <input
                        type="text"
                        value={mailSubject}
                        onChange={(e) => setMailSubject(e.target.value)}
                        disabled={mailSending}
                        className="w-full bg-white border border-slate-355 rounded-xl px-4 py-2.5 text-xs text-black font-semibold focus:outline-none focus:border-cyber-cyan/50"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-550 uppercase tracking-widest">Message Body</label>
                      <textarea
                        value={mailBody}
                        onChange={(e) => setMailBody(e.target.value)}
                        disabled={mailSending}
                        className="w-full bg-white border border-slate-360 rounded-2xl p-4 text-xs text-black font-medium h-56 resize-none focus:outline-none focus:ring-1 focus:ring-cyber-cyan/40"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleSendEmailSubmit}
                        disabled={mailSending}
                        className="px-6 py-3 bg-gradient-to-r from-cyber-cyan to-cyber-blue text-cyber-dark font-extrabold rounded-xl hover:shadow-neon hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 flex items-center gap-2 transition-all text-xs"
                      >
                        <Send size={14} />
                        {mailSending ? "SENDING DRAFT..." : "SEND EMAIL NOW"}
                      </button>
                    </div>
                  </div>
                )
              ) : editMode ? (
                /* Standard Markdown Editor sheet */
                <textarea
                  value={suggestedMarkdown || ""}
                  onChange={(e) => setSuggestedMarkdown(e.target.value)}
                  className="w-full h-full bg-white border border-slate-300 rounded-2xl p-4 text-black font-mono text-xs focus:outline-none resize-none leading-relaxed focus:ring-1 focus:ring-cyber-cyan/40"
                  placeholder="# Write your workspace documentation..."
                />
              ) : (
                /* Standard HTML renderer */
                <div 
                  className="markdown-body text-slate-300 text-xs leading-relaxed space-y-4 font-outfit"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(suggestedMarkdown || "") }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
