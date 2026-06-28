import React, { useState, useEffect, useRef } from "react";
import { Zap, Terminal, Calendar, FileText, Compass, AlertCircle, ArrowRight, Mic, Mail, HelpCircle, Check } from "lucide-react";
import { synth } from "../utils/synth";
import { runSimulatedTriage, runActiveTriage } from "../utils/triageEngine";
import { db } from "../utils/db";



export default function CommandCenter({ 
  onTriageComplete, 
  setCurrentTab 
}) {
  const [panicInput, setPanicInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechLanguage, setSpeechLanguage] = useState("EN"); // EN or HI
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [pendingTriageResult, setPendingTriageResult] = useState(null);
  const [selectedSlotOption, setSelectedSlotOption] = useState("A"); // A = Auto-arrange, B = Late Afternoon, C = Tomorrow Morning
  const [resultSummary, setResultSummary] = useState(null);
  const [showEmailReschedule, setShowEmailReschedule] = useState(false);
  const consoleBottomRef = useRef(null);

  // Load previous triage results if they exist in DB
  useEffect(() => {
    const tasks = db.getTasks() || [];
    const events = db.getEvents() || [];
    const doc = db.getWorkspaceDoc() || { title: "", markdown: "" };
    const urgency = db.getUrgencyLevel() || "MEDIUM";
    const savedLogs = db.getLogs() || [];

    if (tasks.length > 0 || events.length > 0) {
      setResultSummary({
        urgencyLevel: urgency,
        documentTitle: doc.title,
        suggestedMarkdown: doc.markdown,
        tasks: tasks,
        calendarEvents: events
      });
    }

    if (savedLogs.length > 0) {
      setConsoleLogs(savedLogs);
    }
  }, []);

  const handlePresetClick = (text) => {
    synth.playClick();
    setPanicInput(text);
    setPendingTriageResult(null);
  };

  const addConsoleLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setConsoleLogs((prev) => {
      const updated = [...(prev || []), { timestamp, message, type }];
      db.saveLogs(updated);
      return updated;
    });
  };

  useEffect(() => {
    if (consoleBottomRef.current) {
      consoleBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [consoleLogs]);

  // Advanced Voice Command Parsing Engine
  const executeVoiceCommand = (transcript) => {
    const lower = (transcript || "").toLowerCase().trim();
    
    // Command 1: Open YouTube + Play Query
    const ytPlayEN = lower.match(/(?:youtube\s+(?:and\s+)?play|play\s+)(.*)(?:\s+on\s+youtube)/i) || lower.match(/(?:youtube\s+on\s+play|play\s+)(.*)(?:\s+on\s+youtube)/i);
    const ytPlayHI = lower.match(/यूट्यूब\s+(?:पर\s+)?(.*)\s+(?:चलाओ|बजाओ)/i) || lower.match(/(.*)\s+(?:चलाओ\s+यूट्यूब\s+पर)/i);
    const hasYtKeyword = lower.includes("youtube") || lower.includes("यूट्यूब");

    if (hasYtKeyword && (ytPlayEN || ytPlayHI || lower.includes("play") || lower.includes("चलाओ"))) {
      let query = "";
      if (ytPlayEN && ytPlayEN[1]) {
        query = ytPlayEN[1];
      } else if (ytPlayHI && ytPlayHI[1]) {
        query = ytPlayHI[1];
      } else {
        query = lower.replace("open youtube", "").replace("youtube", "").replace("play", "").replace("चलाओ", "").trim();
      }

      addConsoleLog(`🤖 [Supervisor Agent] Spoken Transcript: "${transcript}"`, "info");
      addConsoleLog(`🤖 [Supervisor Agent] Command Matched: Open YouTube and Play: "${query}"`, "info");
      addConsoleLog(`🌐 [Scheduling Agent] Executing: window.open('https://youtube.com/results?search_query=${encodeURIComponent(query)}', '_blank')`, "tool");
      
      synth.playSuccess();
      setTimeout(() => {
        window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, "_blank");
      }, 1000);
      return true;
    }
    
    // Command 2: Open WhatsApp + Send Message
    const waMsgEN = lower.match(/(?:whatsapp\s+(?:and\s+)?send|send\s+message\s+to\s+)(.*)/i);
    const waMsgHI = lower.match(/व्हाट्सएप\s+(?:पर\s+)?(.*)\s+(?:को\s+संदेश|को\s+मैसेज)/i);
    const hasWaKeyword = lower.includes("whatsapp") || lower.includes("व्हाट्सएप");

    if (hasWaKeyword && (waMsgEN || waMsgHI || lower.includes("message") || lower.includes("मैसेज"))) {
      addConsoleLog(`🤖 [Supervisor Agent] Spoken Transcript: "${transcript}"`, "info");
      addConsoleLog("🤖 [Supervisor Agent] Command Matched: Open WhatsApp Web Chat.", "info");
      addConsoleLog("🌐 [Scheduling Agent] Executing: window.open('https://web.whatsapp.com', '_blank')", "tool");
      
      synth.playSuccess();
      setTimeout(() => {
        window.open("https://web.whatsapp.com", "_blank");
      }, 1000);
      return true;
    }

    // Command 3: Send Mail
    if (
      lower.includes("mail") || 
      lower.includes("email") || 
      lower.includes("ईमेल") || 
      lower.includes("मेल") || 
      lower.includes("bhejo") || 
      lower.includes("send")
    ) {
      addConsoleLog(`🤖 [Supervisor Agent] Spoken Transcript: "${transcript}"`, "info");
      addConsoleLog("🤖 [Supervisor Agent] Command Matched: Create Email Compose Canvas Sheet.", "info");
      
      let recipient = "Recipient";
      let topic = "Updates";

      const mailMatchEN = lower.match(/(?:mail|email|to)\s+([a-zA-Z0-9_\u0900-\u097F]+)\s+(?:about|for|on)\s+(.*)/i);
      const mailMatchHI = lower.match(/([a-zA-Z0-9_\u0900-\u097F]+)\s+(?:ko|को)\s+(?:mail|email|ईमेल)\s+(?:bhejo|भेजें)\s+(.*)/i);

      if (mailMatchEN && mailMatchEN[1]) {
        recipient = mailMatchEN[1];
        topic = mailMatchEN[2] || "Updates";
      } else if (mailMatchHI && mailMatchHI[1]) {
        recipient = mailMatchHI[1];
        topic = mailMatchHI[2] || "Updates";
      } else {
        const words = lower.split(" ");
        const mailIdx = words.findIndex(w => w.includes("mail") || w.includes("email") || w.includes("ईमेल"));
        if (mailIdx !== -1 && words[mailIdx + 1]) {
          recipient = words[mailIdx + 1];
        }
      }

      addConsoleLog(`🛠 [Workspace Agent] Spawning interactive email composer sheet for: ${recipient}`, "tool");
      
      const emailResult = {
        urgencyLevel: "HIGH",
        documentTitle: `Email Workspace: ${recipient}`,
        suggestedMarkdown: `# Draft Email to ${recipient}\n\n**Subject**: Discussion regarding ${topic}\n\n---\n\nHi ${recipient},\n\nI am writing to update you regarding ${topic}.\n\nPlease let me know when you are free to discuss.\n\nBest regards,\nUser`,
        tasks: [
          { id: "e1", text: `Review and edit email template to ${recipient}`, done: false },
          { id: "e2", text: `Press 'Send Email' to submit draft`, done: false }
        ],
        calendarEvents: [
          { title: `Drafting Mail to ${recipient}`, start: new Date().toISOString().slice(0, 16), end: new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16) }
        ]
      };

      synth.playSuccess();
      setTimeout(() => {
        onTriageComplete(emailResult);
        setResultSummary(emailResult);
        addConsoleLog(`✅ Email compose sheet ready for ${recipient}. Redirecting to Workspace...`, "success");
        setCurrentTab("workspace");
      }, 1500);

      return true;
    }

    return false; // Fallback
  };

  // Web Speech API Recording
  const handleMicSimulate = () => {
    synth.playClick();
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      // Select speech locale dynamically
      recognition.lang = speechLanguage === "EN" ? "en-IN" : "hi-IN";
      
      let speechTimeout = setTimeout(() => {
        recognition.abort();
        runFallbackVoiceSimulation();
      }, 6000); // Wait 6 seconds before fallback

      recognition.onstart = () => {
        clearTimeout(speechTimeout);
        setIsRecording(true);
        setPanicInput("");
        setPendingTriageResult(null);
      };

      recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript && transcript.trim()) {
          setPanicInput(transcript);
          
          // Check if transcript matches voice commands
          const commandExecuted = executeVoiceCommand(transcript);
          
          // If no browser commands matched, run full triage engine automatically
          if (!commandExecuted) {
            addConsoleLog(`🤖 [Supervisor Agent] Spoken Transcript: "${transcript}"`, "info");
            addConsoleLog("🤖 [Supervisor Agent] No direct command found. Initiating full Triage Engine parsing...", "info");
            setIsRunning(true);
            
            const mode = localStorage.getItem("airspace_mode") || "simulation";
            const apiKey = localStorage.getItem("airspace_gemini_key") || "";
            
            let result;
            if (mode === "active" && apiKey) {
              result = await runActiveTriage(apiKey, transcript, addConsoleLog);
            } else {
              result = await runSimulatedTriage(transcript, addConsoleLog);
            }
            
            synth.playSuccess();
            setIsRunning(false);
            setPendingTriageResult(result);
          }
        } else {
          runFallbackVoiceSimulation();
        }
      };

      recognition.onerror = (e) => {
        console.warn("Speech API error, falling back", e);
        clearTimeout(speechTimeout);
        recognition.abort();
        runFallbackVoiceSimulation();
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } else {
      runFallbackVoiceSimulation();
    }
  };

  const runFallbackVoiceSimulation = () => {
    setIsRecording(true);
    setPanicInput("");
    setPendingTriageResult(null);
    setTimeout(() => {
      synth.playSuccess();
      setIsRecording(false);
      setPanicInput(
        "I completely forgot I have a full research proposal due tomorrow morning at 9:00 AM. I have a group meeting later today from 3:00 to 4:00 PM, and I haven't even written the introduction or the technical architecture section yet!"
      );
    }, 1800);
  };

  const handleEngage = async () => {
    if (!panicInput.trim()) {
      synth.playAlarm();
      addConsoleLog("⚠️ Please enter a chaotic schedule or select a preset to triage.", "error");
      return;
    }

    // Try executing text commands manually if typed
    const commandExecuted = executeVoiceCommand(panicInput);
    if (commandExecuted) return;

    synth.playTriage();
    setIsRunning(true);
    setPendingTriageResult(null);
    setResultSummary(null);
    setConsoleLogs([]);
    db.saveLogs([]);
    addConsoleLog("🚀 Initializing Airspace Command Center...", "info");

    const mode = localStorage.getItem("airspace_mode") || "simulation";
    const apiKey = localStorage.getItem("airspace_gemini_key") || "";

    let result;
    if (mode === "active" && apiKey) {
      result = await runActiveTriage(apiKey, panicInput, addConsoleLog);
    } else {
      if (mode === "active") {
        addConsoleLog("⚠️ Mode set to Active, but no Gemini API key was found in storage. Defaulting to local simulator.", "error");
      }
      result = await runSimulatedTriage(panicInput, addConsoleLog);
    }

    synth.playSuccess();
    setIsRunning(false);
    setPendingTriageResult(result);
  };

  // Step 3 Confirmation - "Approve & Sync Shield" with interactive slot shifts
  const handleApproveAndSync = () => {
    if (!pendingTriageResult) return;
    
    let finalResult = { ...pendingTriageResult };
    
    // Modify slot based on chosen conflict resolution Option
    if (selectedSlotOption === "B") {
      const d = new Date();
      d.setHours(16, 0, 0, 0);
      const startStr = d.toISOString().slice(0, 16);
      d.setHours(18, 30, 0, 0);
      const endStr = d.toISOString().slice(0, 16);
      
      finalResult.calendarEvents = [{
        title: "Deep Work: Proposal Intro & Architecture (Shifted)",
        start: startStr,
        end: endStr,
        description: "Shifted to avoid 2:30 PM sync conflict"
      }];
      addConsoleLog("📅 [Scheduling Agent] Confirmed Slot Shift: Late Afternoon 4:00 PM today.", "success");
    } else if (selectedSlotOption === "C") {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      const startStr = d.toISOString().slice(0, 16);
      d.setHours(11, 30, 0, 0);
      const endStr = d.toISOString().slice(0, 16);
      
      finalResult.calendarEvents = [{
        title: "Deep Work: Proposal Intro & Architecture (Shifted)",
        start: startStr,
        end: endStr,
        description: "Shifted to avoid 2:30 PM sync conflict"
      }];
      addConsoleLog("📅 [Scheduling Agent] Confirmed Slot Shift: Tomorrow Morning 9:00 AM.", "success");
    } else {
      addConsoleLog("📅 [Scheduling Agent] Confirmed Auto-Reschedule & Sync: Today 12:30 PM.", "success");
    }

    synth.playSuccess();
    onTriageComplete(finalResult);
    setResultSummary(finalResult);
    setPendingTriageResult(null);
    setCurrentTab("workspace");
  };

  const handleResetDatabase = () => {
    synth.playAlarm();
    db.clearDatabase();
    setResultSummary(null);
    setPendingTriageResult(null);
    setConsoleLogs([]);
    setPanicInput("");
    onTriageComplete({
      urgencyLevel: "NONE",
      documentTitle: "",
      suggestedMarkdown: "",
      tasks: [],
      calendarEvents: []
    });
    addConsoleLog("🧹 Persistent database tables cleared successfully.", "info");
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto flex flex-col gap-8 max-w-6xl mx-auto w-full">
      {/* Top Welcome Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            COMMAND <span className="text-gradient">CENTER</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1 font-medium">Autonomous workspace setup, scheduling optimization, and resource draft compilation.</p>
        </div>
        <div className="flex items-center gap-3">
          {(resultSummary || pendingTriageResult || consoleLogs.length > 0) && (
            <button
              onClick={handleResetDatabase}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-cyber-pink/10 hover:bg-cyber-pink/25 border border-cyber-pink/30 text-cyber-pink transition-all"
            >
              Clear Database
            </button>
          )}
          <div className="flex items-center gap-2 text-xs text-slate-550 font-bold bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse"></span>
            ORCHESTRATOR ONLINE
          </div>
        </div>
      </div>

      {/* Onboarding: Voice Command Commands Help Sheet */}
      <div className="glass-panel rounded-3xl p-5 border-slate-805 bg-slate-900/20 flex flex-col md:flex-row gap-6 items-start md:items-center">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-cyber-cyan/10 flex items-center justify-center border border-cyber-cyan/20">
            <HelpCircle className="text-cyber-cyan" size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Voice Actions</h4>
            <p className="text-[11px] text-slate-500">Hindi / English commands</p>
          </div>
        </div>
        
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="flex flex-col gap-0.5">
            <span className="text-cyber-cyan font-bold">1. "Open YouTube and play [X]"</span>
            <p className="text-slate-450 leading-normal text-[11px]">Launches YouTube Search Query in a new tab.</p>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-cyber-cyan font-bold">2. "Open WhatsApp and send message"</span>
            <p className="text-slate-455 leading-normal text-[11px]">Launches WhatsApp Web portal.</p>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-cyber-cyan font-bold">3. "Send mail to X" / "X ko email bhejo"</span>
            <p className="text-slate-455 leading-normal text-[11px]">Creates a separate Compose & Send Email page.</p>
          </div>
        </div>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column - Input and Control */}
        <div className="lg:col-span-7 flex flex-col gap-6">


          {/* Text Area Card */}
          <div className="glass-panel rounded-3xl p-6 border-slate-800 relative overflow-hidden flex flex-col gap-4">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-cyan/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-505 uppercase tracking-widest">
                Chaotic Schedule / Email Dump / Study Topic
              </label>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Mail size={12} className="text-cyber-cyan" />
                <span> briefs: <strong className="text-white">command@airspace.ai</strong></span>
              </div>
            </div>

            {/* Input Wrapper with Mic Button */}
            <div className="flex gap-4 items-start">
              {/* Frantic Microphone Trigger with Language Toggles */}
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={handleMicSimulate}
                  disabled={isRunning}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                    isRecording 
                      ? "bg-cyber-pink/20 text-cyber-pink border-2 border-cyber-pink animate-pulse"
                      : "bg-cyber-red/15 hover:bg-cyber-red/25 text-cyber-red border border-cyber-red/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                  }`}
                  title="Simulate / Record Voice Panic (Rescue Me)"
                >
                  <Mic size={24} className={isRecording ? "animate-bounce" : ""} />
                </button>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Rescue Me</span>
                
                {/* Language Selection Buttons */}
                <div className="flex bg-slate-900 border border-slate-850 rounded-xl p-0.5 mt-1 select-none">
                  <button
                    onClick={() => setSpeechLanguage("EN")}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-black transition-all ${
                      speechLanguage === "EN" 
                        ? "bg-slate-800 text-cyber-cyan" 
                        : "text-slate-500 hover:text-slate-350"
                    }`}
                    title="Set recording to English"
                  >
                    EN
                  </button>
                  <button
                    onClick={() => setSpeechLanguage("HI")}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-black transition-all ${
                      speechLanguage === "HI" 
                        ? "bg-slate-800 text-cyber-purple" 
                        : "text-slate-500 hover:text-slate-350"
                    }`}
                    title="Set recording to Hindi"
                  >
                    HI
                  </button>
                </div>
              </div>

              {/* Text Input Field (White background, Black text for high readability) */}
              <div className="flex-1 relative">
                {isRecording ? (
                  <div className="w-full h-48 bg-slate-955/80 border border-cyber-pink/30 rounded-2xl flex flex-col items-center justify-center gap-3">
                    {/* Audio wave simulation */}
                    <div className="flex items-center gap-1.5 h-6">
                      <span className="w-1.5 bg-cyber-pink rounded h-4 animate-pulse" style={{ animationDelay: "0.1s" }}></span>
                      <span className="w-1.5 bg-cyber-pink rounded h-6 animate-pulse" style={{ animationDelay: "0.2s" }}></span>
                      <span className="w-1.5 bg-cyber-pink rounded h-3 animate-pulse" style={{ animationDelay: "0.3s" }}></span>
                      <span className="w-1.5 bg-cyber-pink rounded h-5 animate-pulse" style={{ animationDelay: "0.4s" }}></span>
                      <span className="w-1.5 bg-cyber-pink rounded h-2 animate-pulse" style={{ animationDelay: "0.5s" }}></span>
                    </div>
                    <span className="text-xs text-cyber-pink font-bold uppercase tracking-wider animate-pulse">
                      Listening in {speechLanguage === "EN" ? "English" : "Hindi"}... Speak Now
                    </span>
                  </div>
                ) : (
                  <textarea
                    value={panicInput}
                    onChange={(e) => setPanicInput(e.target.value)}
                    disabled={isRunning}
                    className="w-full h-48 bg-white border border-slate-300 rounded-2xl p-4 text-sm text-black placeholder-slate-400 focus:outline-none focus:border-cyber-cyan/60 focus:ring-1 focus:ring-cyber-cyan/40 resize-none font-semibold leading-relaxed"
                    placeholder="Describe your panic situation or speak commands (e.g. 'Open YouTube and play lo-fi', 'Rahul ko email bhejo project ke baare mein'). Select speech language on the left..."
                  />
                )}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-550 font-semibold">{panicInput.length} characters</span>
              <button
                onClick={handleEngage}
                disabled={isRunning || isRecording}
                className="px-6 py-3.5 rounded-xl font-extrabold bg-gradient-to-r from-cyber-cyan to-cyber-blue text-cyber-dark flex items-center gap-2 hover:shadow-neon hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 disabled:shadow-none transition-all"
              >
                <Zap size={18} fill="currentColor" />
                ENGAGE TRIAGE ENGINE
              </button>
            </div>
          </div>

          {/* Console Terminal Log */}
          <div className="glass-panel rounded-3xl border-slate-800 overflow-hidden flex flex-col h-64 bg-slate-955/90 relative">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-905 bg-slate-900/30">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <Terminal size={14} className="text-cyber-cyan" /> Multi-Agent Execution Console
              </div>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-800"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-slate-800"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-slate-800"></div>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs flex flex-col gap-2 leading-relaxed">
              {(consoleLogs || []).length === 0 ? (
                <div className="text-slate-600 italic h-full flex items-center justify-center">
                  Terminal idle. Engage the triage engine or speak commands to trigger agent activities.
                </div>
              ) : (
                (consoleLogs || []).map((log, index) => {
                  let colorClass = "text-slate-400";
                  if (log.type === "success") colorClass = "text-cyber-green";
                  if (log.type === "tool") colorClass = "text-cyber-cyan";
                  if (log.type === "error") colorClass = "text-cyber-pink font-bold";
                  
                  return (
                    <div key={index} className="flex gap-2.5 items-start">
                      <span className="text-slate-605 shrink-0">[{log.timestamp}]</span>
                      <span className={`whitespace-pre-wrap ${colorClass}`}>{log.message}</span>
                    </div>
                  );
                })
              )}
              {isRunning && (
                <div className="flex gap-2 items-center text-cyber-cyan text-xs font-bold animate-pulse mt-1">
                  <span>🛫 AIRSPACE_AGENT_RUNNING &gt; [thinking]</span>
                  <span className="w-1.5 h-3 bg-cyber-cyan inline-block"></span>
                </div>
              )}
              <div ref={consoleBottomRef} />
            </div>
          </div>
        </div>

        {/* Right Column - Results Summary / Confirmation Portal */}
        <div className="lg:col-span-5 flex flex-col gap-6 h-full">
          {/* Step 3: Pending Confirmation Shield View */}
          {pendingTriageResult ? (
            <div className="glass-panel-accent border-cyber-pink/35 rounded-3xl p-6 flex flex-col gap-5 relative overflow-hidden animate-slide-up h-full bg-gradient-to-tr from-slate-955 via-slate-900 to-cyber-pink/5">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyber-pink/10 rounded-full blur-2xl"></div>
              
              <div>
                <span className="text-xs font-bold text-cyber-pink uppercase tracking-widest flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyber-pink animate-ping"></span>
                  Step 3: Conflict Reduction Shield
                </span>
                <h3 className="text-xl font-black text-white mt-1.5 flex items-center gap-2">
                  <AlertCircle className="text-cyber-pink shrink-0" size={20} />
                  CALENDAR CONFLICT RESOLUTION
                </h3>
              </div>

              {/* Conflict details */}
              <div className="bg-slate-955/80 border border-slate-850 rounded-2xl p-4 flex flex-col gap-2">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Triage Audit</span>
                <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                  We mapped a 2:30 PM meeting conflict. Please choose your preferred resolution plan:
                </p>
              </div>

              {/* Slot Options with Checkmarks */}
              <div className="flex flex-col gap-2.5">
                {/* Option A */}
                <div 
                  onClick={() => { synth.playClick(); setSelectedSlotOption("A"); }}
                  className={`p-3.5 rounded-2xl border cursor-pointer flex justify-between items-center transition-all ${
                    selectedSlotOption === "A"
                      ? "bg-cyber-cyan/10 border-cyber-cyan text-white shadow-[0_0_10px_rgba(0,240,255,0.08)]"
                      : "bg-slate-950/40 border-slate-850 hover:border-slate-700 text-slate-400"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">Option A: Auto-Reschedule Conflict</span>
                    <span className="text-[10px] text-slate-450 mt-0.5">Keep Today 12:30 PM - 3:00 PM. Send reschedule email.</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                    selectedSlotOption === "A" ? "bg-cyber-cyan border-cyber-cyan text-cyber-dark" : "border-slate-600"
                  }`}>
                    {selectedSlotOption === "A" && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>

                {/* Option B */}
                <div 
                  onClick={() => { synth.playClick(); setSelectedSlotOption("B"); }}
                  className={`p-3.5 rounded-2xl border cursor-pointer flex justify-between items-center transition-all ${
                    selectedSlotOption === "B"
                      ? "bg-cyber-cyan/10 border-cyber-cyan text-white shadow-[0_0_10px_rgba(0,240,255,0.08)]"
                      : "bg-slate-955/40 border-slate-850 hover:border-slate-700 text-slate-400"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">Option B: Late Focus Slot</span>
                    <span className="text-[10px] text-slate-455 mt-0.5">Shift focus session to Today 4:00 PM - 6:30 PM.</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                    selectedSlotOption === "B" ? "bg-cyber-cyan border-cyber-cyan text-cyber-dark" : "border-slate-600"
                  }`}>
                    {selectedSlotOption === "B" && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>

                {/* Option C */}
                <div 
                  onClick={() => { synth.playClick(); setSelectedSlotOption("C"); }}
                  className={`p-3.5 rounded-2xl border cursor-pointer flex justify-between items-center transition-all ${
                    selectedSlotOption === "C"
                      ? "bg-cyber-cyan/10 border-cyber-cyan text-white shadow-[0_0_10px_rgba(0,240,255,0.08)]"
                      : "bg-slate-955/40 border-slate-850 hover:border-slate-700 text-slate-400"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">Option C: Shift to Tomorrow</span>
                    <span className="text-[10px] text-slate-455 mt-0.5">Shift focus session to Tomorrow 9:00 AM - 11:30 AM.</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                    selectedSlotOption === "C" ? "bg-cyber-cyan border-cyber-cyan text-cyber-dark" : "border-slate-600"
                  }`}>
                    {selectedSlotOption === "C" && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>
              </div>

              {/* Reschedule Email Accordion (Only visible for Option A) */}
              {selectedSlotOption === "A" && (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setShowEmailReschedule(!showEmailReschedule)}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-850 rounded-xl text-[10px] font-bold"
                  >
                    {showEmailReschedule ? "Hide Rescheduling Draft" : "View Rescheduling Email Draft"}
                  </button>
                  {showEmailReschedule && (
                    <div className="p-3 bg-slate-955 border border-slate-900 rounded-xl font-mono text-[9px] text-slate-400 whitespace-pre-wrap leading-relaxed animate-slide-down">
                      <strong>To:</strong> group-lead@academic.edu<br/>
                      <strong>Subject:</strong> Rescheduling: 3:00 PM Meeting today<br/><br/>
                      Hi Group,<br/>
                      I have an urgent submission due tomorrow morning at 9:00 AM. Could we reschedule today's 3:00 PM group sync to tomorrow afternoon instead? Thanks!
                    </div>
                  )}
                </div>
              )}

              {/* Major Action Button */}
              <button
                onClick={handleApproveAndSync}
                className="w-full mt-auto py-4 bg-gradient-to-r from-cyber-pink via-cyber-purple to-cyber-blue text-white font-extrabold rounded-2xl hover:shadow-neon-pink hover:scale-[1.02] flex items-center justify-center gap-2 group transition-all"
              >
                APPROVE & SYNC SHIELD
                <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform" />
              </button>
            </div>
          ) : resultSummary ? (
            /* Workspace Configured Summary */
            <div className="glass-panel-accent border-slate-800 rounded-3xl p-6 flex flex-col gap-6 relative overflow-hidden animate-slide-up h-full">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyber-green/5 rounded-full blur-2xl"></div>
              
              <div>
                <span className="text-xs font-bold text-cyber-cyan uppercase tracking-widest">Active Shield Configured</span>
                <h3 className="text-2xl font-extrabold text-white mt-1">Calendar & Workspace Active</h3>
              </div>

              {/* Urgency indicators */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-slate-505 uppercase tracking-wider">Urgency Score</span>
                  <span className={`text-xl font-black ${
                    resultSummary.urgencyLevel === "CRITICAL"
                      ? "text-cyber-red animate-pulse"
                      : resultSummary.urgencyLevel === "HIGH"
                      ? "text-cyber-yellow"
                      : "text-cyber-green"
                  }`}>{resultSummary.urgencyLevel}</span>
                </div>
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-slate-505 uppercase tracking-wider">Workspace Target</span>
                  <span className="text-white text-xs font-bold truncate flex items-center gap-1.5">
                    <FileText size={14} className="text-cyber-cyan shrink-0" />
                    {resultSummary.documentTitle}
                  </span>
                </div>
              </div>

              {/* Scheduled Blocks */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={14} className="text-cyber-cyan" /> Synced Time Blocks
                </span>
                <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                  {(resultSummary.calendarEvents || []).map((ev, idx) => {
                    const startFormatted = new Date(ev.start).toLocaleString([], { 
                      month: 'short', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    });
                    return (
                      <div key={idx} className="bg-slate-950/60 border border-slate-905 rounded-xl p-3 flex justify-between items-center gap-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white">{ev.title}</span>
                          <span className="text-[10px] text-slate-550 font-medium mt-0.5">{startFormatted}</span>
                        </div>
                        <span className="text-[9px] font-bold text-cyber-green border border-cyber-green/20 bg-cyber-green/5 px-2 py-0.5 rounded uppercase">
                          ACTIVE SHIELD
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Button to Workspace */}
              <button
                onClick={() => {
                  synth.playClick();
                  setCurrentTab("workspace");
                }}
                className="w-full mt-auto py-3.5 bg-gradient-to-r from-cyber-cyan to-cyber-blue text-cyber-dark font-extrabold rounded-xl hover:shadow-neon flex items-center justify-center gap-2 group transition-all"
              >
                ENTER FOCUS WORKSPACE
                <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
              </button>
            </div>
          ) : (
            /* Empty Standby State */
            <div className="glass-panel border-slate-800 rounded-3xl p-6 flex flex-col justify-center items-center gap-4 text-center border-dashed h-full min-h-[350px]">
              <div className="w-16 h-16 rounded-full bg-slate-900/80 flex items-center justify-center border border-slate-800">
                <AlertCircle size={28} className="text-slate-655" />
              </div>
              <div>
                <h4 className="text-slate-400 font-bold">Execution Plan Ready</h4>
                <p className="text-slate-550 text-xs mt-1.5 max-w-[280px] mx-auto leading-relaxed">
                  Toggle language, click the red microphone to record voice commands (or try typing them in English or Hindi).
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
