import React, { useState } from "react";
import { Calendar as CalendarIcon, Clock, Trash2, CheckCircle2, ChevronLeft, ChevronRight, HelpCircle, Plus } from "lucide-react";
import { synth } from "../utils/synth";

export default function CalendarView({ calendarEvents, setCalendarEvents }) {
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Manual scheduling form states
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newDuration, setNewDuration] = useState("1.5");
  const [newDesc, setNewDesc] = useState("");

  const handleDelete = (index) => {
    synth.playAlarm();
    const updated = (calendarEvents || []).filter((_, idx) => idx !== index);
    setCalendarEvents(updated);
    setSelectedEvent(null);
  };

  const handleToggleComplete = (index) => {
    synth.playSuccess();
    const updated = (calendarEvents || []).map((ev, idx) => {
      if (idx === index) {
        return { ...ev, completed: !ev.completed };
      }
      return ev;
    });
    setCalendarEvents(updated);
    // Sync active selection view
    if (selectedEvent && selectedEvent.originalIndex === index) {
      setSelectedEvent({ ...selectedEvent, completed: !selectedEvent.completed });
    }
  };

  // Add Manual Calendar Block
  const handleAddCustomEvent = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate || !newTime) {
      synth.playAlarm();
      return;
    }

    synth.playSuccess();
    // Parse start and end string
    const startStr = `${newDate}T${newTime}`;
    const durationMs = parseFloat(newDuration) * 60 * 60 * 1000;
    const endStr = new Date(new Date(startStr).getTime() + durationMs).toISOString().slice(0, 16);

    const newEvent = {
      title: newTitle,
      start: startStr,
      end: endStr,
      description: newDesc || "Manually scheduled calendar block",
      completed: false
    };

    setCalendarEvents([...(calendarEvents || []), newEvent]);
    
    // Clear inputs
    setNewTitle("");
    setNewDate("");
    setNewTime("");
    setNewDesc("");
  };

  // Group events by day to show in a day-by-day feed with null safety
  const getGroupedEvents = () => {
    const groups = {};
    (calendarEvents || []).forEach((ev, index) => {
      if (!ev || !ev.start) return;
      const dateObj = new Date(ev.start);
      const dayKey = dateObj.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
      if (!groups[dayKey]) groups[dayKey] = [];
      groups[dayKey].push({ ...ev, originalIndex: index });
    });
    return groups;
  };

  const grouped = getGroupedEvents();
  const sortedDays = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));

  return (
    <div className="flex-1 p-8 overflow-y-auto flex flex-col gap-8 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            CALENDAR <span className="text-gradient">TIMELINE</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1 font-medium">Review scheduled deep-focus work blocks mapped automatically leading to deadlines.</p>
        </div>
        
        {/* Navigation Indicator */}
        <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-xl p-1">
          <button className="p-2 text-slate-400 hover:text-slate-200 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-bold text-slate-300 px-3 uppercase tracking-wider">Schedule Agenda</span>
          <button className="p-2 text-slate-400 hover:text-slate-200 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Agenda Stream */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {(calendarEvents || []).length === 0 ? (
            <div className="glass-panel border-slate-800 rounded-3xl p-12 text-center border-dashed flex flex-col justify-center items-center gap-4 bg-slate-900/10">
              <div className="w-16 h-16 rounded-full bg-slate-900/80 flex items-center justify-center border border-slate-800">
                <CalendarIcon size={28} className="text-slate-655" />
              </div>
              <div>
                <h4 className="text-slate-400 font-bold">No Sessions Scheduled</h4>
                <p className="text-slate-550 text-xs mt-1.5 max-w-[280px] mx-auto leading-relaxed">
                  Engage the Triage Engine inside the Command Center or fill in the manual scheduler to book focus slots.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {sortedDays.map((day) => (
                <div key={day} className="flex flex-col gap-3">
                  <h3 className="text-sm font-bold text-cyber-cyan uppercase tracking-widest pl-1">{day}</h3>
                  <div className="flex flex-col gap-3">
                    {grouped[day].map((ev) => {
                      const startDate = new Date(ev.start);
                      const endDate = new Date(ev.end);
                      const timeStr = `${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                      
                      return (
                        <div
                          key={ev.originalIndex}
                          onClick={() => {
                            synth.playClick();
                            setSelectedEvent({ ...ev, originalIndex: ev.originalIndex });
                          }}
                          className={`glass-panel rounded-2xl p-5 border-slate-800 hover:border-cyber-cyan/35 hover:bg-slate-900/40 cursor-pointer flex justify-between items-center transition-all ${
                            ev.completed ? "border-cyber-green/20 bg-cyber-green/[0.02] opacity-70" : ""
                          }`}
                        >
                          <div className="flex gap-4 items-center">
                            {/* Complete Checkbox */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleComplete(ev.originalIndex);
                              }}
                              className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                                ev.completed 
                                  ? "bg-cyber-green border-cyber-green text-cyber-dark" 
                                  : "border-slate-700 text-transparent hover:border-cyber-cyan"
                              }`}
                            >
                              <CheckCircle2 size={16} />
                            </button>
                            
                            <div className="flex flex-col">
                              <span className={`text-sm font-bold ${ev.completed ? "line-through text-slate-500" : "text-white"}`}>
                                {ev.title}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mt-1">
                                <Clock size={12} className="text-cyber-cyan" />
                                {timeStr}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[9px] font-bold text-cyber-cyan border border-cyber-cyan/35 bg-cyber-cyan/10 px-2 py-0.5 rounded uppercase tracking-wider">
                              🛫 Airspace Focus Slot
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Event Details Panel OR Manual Scheduler Form */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {selectedEvent ? (
            <div className="glass-panel-accent border-slate-800 rounded-3xl p-6 flex flex-col gap-6 relative overflow-hidden animate-slide-up">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyber-cyan/5 rounded-full blur-2xl"></div>
              
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-cyber-cyan uppercase tracking-widest">Selected Focus Slot</span>
                  <h3 className="text-xl font-extrabold text-white mt-1">{selectedEvent.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-bold hover:text-slate-200"
                >
                  Close Detail
                </button>
              </div>

              <div className="flex flex-col gap-4 text-xs">
                <div className="flex flex-col gap-1">
                  <span className="text-slate-505 font-semibold uppercase tracking-wider text-[10px]">Date & Time</span>
                  <span className="text-slate-200 font-bold">
                    {new Date(selectedEvent.start).toLocaleDateString([], { dateStyle: 'full' })}
                  </span>
                  <span className="text-cyber-cyan font-semibold mt-0.5">
                    {new Date(selectedEvent.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedEvent.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-slate-505 font-semibold uppercase tracking-wider text-[10px]">Description</span>
                  <p className="text-slate-400 leading-relaxed font-medium">
                    {selectedEvent.description || "No description provided."}
                  </p>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-slate-550 font-semibold uppercase tracking-wider text-[10px]">Status</span>
                  <span className={`font-bold flex items-center gap-1.5 ${selectedEvent.completed ? "text-cyber-green" : "text-cyber-yellow"}`}>
                    <span className={`w-2 h-2 rounded-full ${selectedEvent.completed ? "bg-cyber-green" : "bg-cyber-yellow animate-pulse"}`}></span>
                    {selectedEvent.completed ? "Completed & Logged" : "Active / Upcoming Focus Block"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 border-t border-slate-800 pt-6 mt-2">
                <button
                  onClick={() => handleToggleComplete(selectedEvent.originalIndex)}
                  className={`flex-1 py-3 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all ${
                    selectedEvent.completed
                      ? "bg-slate-800 hover:bg-slate-700 text-slate-350"
                      : "bg-gradient-to-r from-cyber-green/20 to-cyber-green/30 border border-cyber-green/40 hover:bg-cyber-green/45 text-cyber-green"
                  }`}
                >
                  <CheckCircle2 size={15} />
                  {selectedEvent.completed ? "Mark Incomplete" : "Complete Block"}
                </button>
                
                <button
                  onClick={() => handleDelete(selectedEvent.originalIndex)}
                  className="p-3 bg-cyber-pink/10 hover:bg-cyber-pink/20 border border-cyber-pink/35 text-cyber-pink font-bold rounded-xl transition-all"
                  title="Remove from agenda"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ) : (
            /* Manual Calendar Scheduling Form */
            <div className="glass-panel border-slate-800 rounded-3xl p-6 flex flex-col gap-4 relative">
              <div className="flex items-center gap-1.5">
                <Plus className="text-cyber-cyan" size={18} />
                <h4 className="text-white font-extrabold uppercase text-xs tracking-wider">Book Custom Focus Slot</h4>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Instantly schedule work tasks directly to your local calendar database.</p>

              <form onSubmit={handleAddCustomEvent} className="flex flex-col gap-3 font-outfit text-xs mt-1">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Event Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Finish chemistry practice problems"
                    required
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-black font-semibold focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Date</label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-black font-semibold focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Start Time</label>
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-black font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Hours Duration</label>
                    <select
                      value={newDuration}
                      onChange={(e) => setNewDuration(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-black font-semibold focus:outline-none"
                    >
                      <option value="0.5">30 mins</option>
                      <option value="1.0">1.0 hour</option>
                      <option value="1.5">1.5 hours</option>
                      <option value="2.0">2.0 hours</option>
                      <option value="3.0">3.0 hours</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Short Description</label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Describe targets..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-black font-semibold focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3 bg-gradient-to-r from-cyber-cyan to-cyber-blue text-cyber-dark font-extrabold rounded-xl hover:shadow-neon flex items-center justify-center gap-1.5 transition-all text-xs"
                >
                  <Plus size={14} />
                  SCHEDULE FOCUS SLOT
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
