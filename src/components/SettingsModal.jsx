import React, { useState, useEffect } from "react";
import { X, Key, Shield, AlertTriangle, Eye, EyeOff, Save, Check } from "lucide-react";
import { synth } from "../utils/synth";
import { db } from "../utils/db";

export default function SettingsModal({ isOpen, onClose }) {
  const [configMode, setConfigMode] = useState("simulation");
  const [geminiKey, setGeminiKey] = useState("");
  const [googleSimulated, setGoogleSimulated] = useState(true);
  const [googleClientId, setGoogleClientId] = useState("");
  const [googleClientSecret, setGoogleClientSecret] = useState("");
  const [userEmail, setUserEmail] = useState("");
  
  const [showKey, setShowKey] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load config from db and localStorage on open
    const savedMode = localStorage.getItem("airspace_mode") || "simulation";
    const savedKey = localStorage.getItem("airspace_gemini_key") || "";
    const savedClientId = localStorage.getItem("airspace_google_client_id") || "";
    const savedSecret = localStorage.getItem("airspace_google_client_secret") || "";
    const isSimulated = db.isGoogleSimulated();
    const savedEmail = db.getUserEmail();

    setConfigMode(savedMode);
    setGeminiKey(savedKey);
    setGoogleClientId(savedClientId);
    setGoogleClientSecret(savedSecret);
    setGoogleSimulated(isSimulated);
    setUserEmail(savedEmail);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    synth.playSuccess();
    localStorage.setItem("airspace_mode", configMode);
    localStorage.setItem("airspace_gemini_key", geminiKey);
    localStorage.setItem("airspace_google_client_id", googleClientId);
    localStorage.setItem("airspace_google_client_secret", googleClientSecret);
    db.saveGoogleSimulated(googleSimulated);
    db.saveUserEmail(userEmail);

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="w-full max-w-lg glass-panel border-slate-800 rounded-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-805/85">
          <div className="flex items-center gap-2.5">
            <SettingsIcon className="text-cyber-cyan" />
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">Mission Configuration</h2>
          </div>
          <button 
            onClick={() => {
              synth.playClick();
              onClose();
            }} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6">
          {/* Mode Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-3">Operational Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  synth.playClick();
                  setConfigMode("simulation");
                }}
                className={`p-4 rounded-2xl flex flex-col gap-1.5 text-left border transition-all ${
                  configMode === "simulation"
                    ? "bg-cyber-cyan/10 border-cyber-cyan text-white shadow-[0_0_15px_rgba(0,240,255,0.1)]"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-sm">Simulation Mode</span>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${configMode === "simulation" ? "border-cyber-cyan" : "border-slate-500"}`}>
                    {configMode === "simulation" && <div className="w-1.5 h-1.5 rounded-full bg-cyber-cyan"></div>}
                  </div>
                </div>
                <p className="text-xs text-slate-500 font-medium">Runs client-side immediately without API keys or OAuth setups.</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  synth.playClick();
                  setConfigMode("active");
                }}
                className={`p-4 rounded-2xl flex flex-col gap-1.5 text-left border transition-all ${
                  configMode === "active"
                    ? "bg-cyber-purple/10 border-cyber-purple text-white shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-sm">Active Mode</span>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${configMode === "active" ? "border-cyber-purple" : "border-slate-500"}`}>
                    {configMode === "active" && <div className="w-1.5 h-1.5 rounded-full bg-cyber-purple"></div>}
                  </div>
                </div>
                <p className="text-xs text-slate-500 font-medium">Binds real Gemini API requests using your client-side key.</p>
              </button>
            </div>
          </div>

          {/* Mode Warning / Info */}
          {configMode === "simulation" ? (
            <div className="bg-cyber-cyan/5 border border-cyber-cyan/20 rounded-2xl p-4 flex gap-3 text-xs text-cyber-cyan/90">
              <Shield size={20} className="shrink-0 text-cyber-cyan mt-0.5" />
              <div>
                <p className="font-bold mb-1">Zero Credentials Required</p>
                <p className="text-slate-400">Simulation mode is optimized to work instantly. The supervisor, scheduler, and workspace agents execute tool calls and logs client-side.</p>
              </div>
            </div>
          ) : (
            <div className="bg-cyber-purple/5 border border-cyber-purple/20 rounded-2xl p-4 flex gap-3 text-xs text-cyber-purple/90">
              <AlertTriangle size={20} className="shrink-0 text-cyber-purple mt-0.5" />
              <div>
                <p className="font-bold mb-1">Gemini API Key Required</p>
                <p className="text-slate-400 font-medium">Binds genuine AI parsing requests. Enter your Gemini API key below. You can simulate Google APIs to bypass OAuth credentials setup.</p>
              </div>
            </div>
          )}

          {/* User Email Address (Universal config) */}
          <div className="flex flex-col gap-2 border-t border-slate-800/60 pt-4">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              User Email Address
            </label>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-black placeholder-slate-400 focus:outline-none focus:border-cyber-cyan/60"
              placeholder="user@airspace.ai"
            />
            <p className="text-[10px] text-slate-500 font-medium">Saved email address used as the sender 'From' identity inside email compose sheets.</p>
          </div>

          {/* Active Mode Form Inputs */}
          {configMode === "active" && (
            <div className="flex flex-col gap-4 animate-slide-up">
              {/* Gemini Key */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Key size={14} className="text-cyber-purple" /> Gemini API Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-black placeholder-slate-400 font-mono pr-12 focus:outline-none focus:border-cyber-purple/60"
                    placeholder="AIzaSy..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      synth.playClick();
                      setShowKey(!showKey);
                    }}
                    className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-350"
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Google API Simulation Toggle */}
              <div className="flex items-center gap-3 p-3 bg-slate-900/40 border border-slate-850 rounded-xl">
                <input
                  type="checkbox"
                  id="google_simulated"
                  checked={googleSimulated}
                  onChange={(e) => {
                    synth.playClick();
                    setGoogleSimulated(e.target.checked);
                  }}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyber-purple focus:ring-cyber-purple cursor-pointer"
                />
                <label htmlFor="google_simulated" className="text-xs font-bold text-slate-200 cursor-pointer select-none">
                  Simulate Google Workspace (No Google OAuth Client ID needed)
                </label>
              </div>

              {/* Google Client ID / Secret (Only shown if Google Simulation is Disabled) */}
              {!googleSimulated && (
                <div className="flex flex-col gap-4 animate-slide-down">
                  {/* Google Client ID */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                      Google Client ID (OAuth)
                    </label>
                    <input
                      type="text"
                      value={googleClientId}
                      onChange={(e) => setGoogleClientId(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-black placeholder-slate-400 font-mono focus:outline-none focus:border-cyber-purple/60"
                      placeholder="xxxx.apps.googleusercontent.com"
                    />
                  </div>

                  {/* Google Client Secret */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                      Google Client Secret
                    </label>
                    <div className="relative">
                      <input
                        type={showSecret ? "text" : "password"}
                        value={googleClientSecret}
                        onChange={(e) => setGoogleClientSecret(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-black placeholder-slate-400 font-mono pr-12 focus:outline-none focus:border-cyber-purple/60"
                        placeholder="GOCSPX-xxxxx"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          synth.playClick();
                          setShowSecret(!showSecret);
                        }}
                        className="absolute right-3.5 top-3.5 text-slate-505 hover:text-slate-350"
                      >
                        {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-800/80 bg-slate-900/40 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saved}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
              saved 
                ? "bg-cyber-green text-cyber-dark shadow-neon-green" 
                : "bg-gradient-to-r from-cyber-cyan to-cyber-blue text-cyber-dark hover:shadow-neon hover:scale-[1.02]"
            }`}
          >
            {saved ? (
              <>
                <Check size={18} />
                SAVED MISSION CONFIG
              </>
            ) : (
              <>
                <Save size={18} />
                SAVE CONFIGURATION
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
