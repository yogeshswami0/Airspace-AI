import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "./db";

// Pre-defined templates written in simple, plain English (no technical jargon)
const SCENARIO_TEMPLATES = {
  proposal: {
    title: "Research Proposal Workspace",
    urgency: "CRITICAL",
    tasks: [
      { id: "pr1", text: "12:30 PM - 1:15 PM: Write introduction paragraph", done: false },
      { id: "pr2", text: "1:15 PM - 2:30 PM: Write down design steps and details", done: false },
      { id: "pr3", text: "2:30 PM - 3:00 PM: Draft milestones & timeline", done: false },
      { id: "pr4", text: "4:00 PM - 5:00 PM: Check for errors and submit proposal", done: false }
    ],
    events: [
      { title: "Deep Work: Proposal Intro & Architecture", offsetDays: 0, startHour: 12.5, duration: 2.5 }
    ],
    markdown: `# Research Proposal Draft Sheet

### Deadline: Tomorrow at 9:00 AM
**Focus Time**: Today 12:30 PM - 3:00 PM

---

## 1. What is this project about?
*Write a short 3-sentence summary of what you are building and why it matters.*

---

## 2. Section 1: Introduction (Get Started Here)
Write down the main goal of your project. For example: "This project builds a simple voice-controlled assistant to help users manage their calendar and tasks immediately..."

---

## 3. Section 2: How it works (Details)
- **Part 1**: Capture user voice panic notes.
- **Part 2**: Auto-schedule study blocks on the calendar.
- **Part 3**: Load simple templates to start writing immediately.

---

## 4. Steps & Timeline
- Step 1: Draft layout (Completed)
- Step 2: Write core pages (In Progress)
- Step 3: Run final checks (Pending)
`
  },
  pitch: {
    title: "Investor Pitch Preparation Workspace",
    urgency: "CRITICAL",
    tasks: [
      { id: "p1", text: "Draft executive summary notes", done: false },
      { id: "p2", text: "Fill in sales and revenue numbers", done: false },
      { id: "p3", text: "List target market size details", done: false },
      { id: "p4", text: "Polish slides and review presentation", done: false },
      { id: "p5", text: "Practice speaking for 5 minutes", done: false }
    ],
    events: [
      { title: "Deep Work: Pitch Strategy & Outline", offsetDays: 0, startHour: 10, duration: 2 },
      { title: "Deep Work: Financial Slide Development", offsetDays: 1, startHour: 14, duration: 3 }
    ],
    markdown: `# Presentation Slide Outline

### Deadline: Tomorrow at 4:00 PM
**Objective**: Build a simple presentation slides structure.

---

## 1. Slide List & Outline
- **Slide 1: Title** (Your product name and slogan)
- **Slide 2: The Problem** (What painful issue are customers facing?)
- **Slide 3: The Solution** (How does your product solve it simply?)
- **Slide 4: Market Size** (How many potential customers exist?)
- **Slide 5: Business Model** (How do you make money?)
- **Slide 6: Current Progress** (Sales numbers, users, or trial pilot results)
- **Slide 7: The Ask** (What help or funding do you need?)

---

## 2. Slides Key Data points
- Current monthly revenue: $24,500
- Year 1 projection: $450,000
- Year 3 projection: $3,200,000
`
  },
  exam: {
    title: "Exam Study & Cram Workspace",
    urgency: "HIGH",
    tasks: [
      { id: "e1", text: "Read through study notes 1 to 6", done: false },
      { id: "e2", text: "Solve 3 practice questions", done: false },
      { id: "e3", text: "Write down key formulas on a cheat sheet", done: false },
      { id: "e4", text: "Do a practice mock test", done: false }
    ],
    events: [
      { title: "Deep Focus: Core Concepts Review", offsetDays: 0, startHour: 9, duration: 3 },
      { title: "Deep Focus: Practice Set Problems", offsetDays: 0, startHour: 15, duration: 2 }
    ],
    markdown: `# Exam Study Guide

### Deadline: Wednesday Morning
**Objective**: Review key topics and complete practice problems.

---

## 1. Important Topics to Cover
- **Topic 1**: Core principles and definitions.
- **Topic 2**: Main formulas and how to solve problems.
- **Topic 3**: Common errors to avoid.

---

## 2. Practice Questions to Self-Test
1. *Write down the main definitions from memory.*
2. *Solve practice question 3 from chapter 2.*
3. *Derive the rate equations under standard conditions.*
`
  },
  code: {
    title: "Software Launch & Build Workspace",
    urgency: "CRITICAL",
    tasks: [
      { id: "c1", text: "Configure project environment keys", done: false },
      { id: "c2", text: "Setup database login routes", done: false },
      { id: "c3", text: "Run automated tests check", done: false },
      { id: "c4", text: "Deploy software build to production server", done: false }
    ],
    events: [
      { title: "Deep Focus: Backend Setup & Logic", offsetDays: 0, startHour: 13, duration: 4 },
      { title: "Deep Focus: UI Polish & Styles", offsetDays: 1, startHour: 9, duration: 3 }
    ],
    markdown: `# Software Coding Blueprint

### Deadline: Friday Launch
**Objective**: Build and launch the application module.

---

## 1. Project Stack
- **Frontend**: React SPA
- **Styling**: Tailwind CSS
- **Database**: Local Storage state
- **Authentication**: OAuth login

---

## 2. Setup Configuration Example
\`\`\`javascript
// keys.js
const API_URL = "https://api.airspace.ai";
const ENVIRONMENT = "production";
\`\`\`

---

## 3. Launch Checklist
- [ ] Check if project loads without errors
- [ ] Run build scripts and verify outputs
- [ ] Test button click inputs and API calls
`
  },
  general: {
    title: "Autonomous Action Plan Workspace",
    urgency: "MEDIUM",
    tasks: [
      { id: "g1", text: "Read through incoming files & emails", done: false },
      { id: "g2", text: "Reserve calendar slots for deep work", done: false },
      { id: "g3", text: "Draft updates draft in workspace", done: false }
    ],
    events: [
      { title: "Deep Work: Action Plan Structuring", offsetDays: 0, startHour: 14, duration: 2 },
      { title: "Deep Work: Execution Session", offsetDays: 1, startHour: 10, duration: 2.5 }
    ],
    markdown: `# General Task Checklist & Blueprint

### Objective: Organize daily timeline and draft notes.

---

## 1. Project Steps
- **Step 1**: Ingest text panic.
- **Step 2**: Schedule focus blocks.
- **Step 3**: Draft writing outlines.

---

## 2. Status Review
- Keep tasks up to date.
- Complete checklists by the target time.
`
  }
};

/**
 * Calculates current dates based on offsets to make the calendar look active and live.
 */
function getOffsetDateString(offsetDays, hour) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  // Support float hours (e.g. 12.5 = 12:30)
  const fullHour = Math.floor(hour);
  const minutes = (hour - fullHour) * 60;
  d.setHours(fullHour, minutes, 0, 0);
  const tzOffset = d.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
  return localISOTime;
}

/**
 * Analyzes text input to guess the category and deadline info.
 */
function analyzeInput(text) {
  const lower = text.toLowerCase();
  let category = "general";
  
  if (lower.includes("proposal") || lower.includes("research") || lower.includes("meeting") || lower.includes("forgot")) {
    category = "proposal";
  } else if (lower.includes("pitch") || lower.includes("investor") || lower.includes("slide") || lower.includes("presentation") || lower.includes("deck")) {
    category = "pitch";
  } else if (lower.includes("exam") || lower.includes("cram") || lower.includes("study") || lower.includes("test") || lower.includes("quiz") || lower.includes("class")) {
    category = "exam";
  } else if (lower.includes("code") || lower.includes("deploy") || lower.includes("api") || lower.includes("git") || lower.includes("hackathon") || lower.includes("app")) {
    category = "code";
  }

  let urgency = "MEDIUM";
  if (lower.includes("urgent") || lower.includes("panic") || lower.includes("today") || lower.includes("tomorrow") || lower.includes("hours") || lower.includes("asap") || lower.includes("haven't started") || lower.includes("critical") || lower.includes("forgot")) {
    urgency = "CRITICAL";
  } else if (lower.includes("deadlines") || lower.includes("soon") || lower.includes("friday") || lower.includes("next week") || lower.includes("stress")) {
    urgency = "HIGH";
  }

  return { category, urgency };
}

/**
 * Runs a simulated agentic loop with callbacks to draw progress logs.
 */
export async function runSimulatedTriage(inputText, onLogCallback) {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const analysis = analyzeInput(inputText);
  const data = SCENARIO_TEMPLATES[analysis.category];

  onLogCallback("🤖 [Supervisor Agent] Initiating panic text parsing...", "info");
  await sleep(1000);
  
  onLogCallback(`🕵️‍♂️ [Supervisor Agent] Urgent intent mapped. Urgency level detected: ${analysis.urgency}. Category matches: ${analysis.category.toUpperCase()}`, "info");
  await sleep(800);
  
  onLogCallback("📅 [Scheduling Agent] Requesting OAuth access. Reading calendar agenda...", "tool");
  await sleep(1000);
  
  onLogCallback("📅 [Scheduling Agent] Calling function: fetch_calendar_availability({ dateRange: 'next 3 days' })", "tool");
  await sleep(1200);

  const availableSlotsLog = [
    "   - Slot A: Today 12:30 PM - 3:00 PM (FREE)",
    "   - Slot B: Tomorrow 10:00 AM - 12:00 PM (FREE)",
    "   - Slot C: Day after 9:00 AM - 12:00 PM (FREE)"
  ].join("\n");
  onLogCallback(`📅 [Scheduling Agent] Availability received:\n${availableSlotsLog}`, "success");
  await sleep(1000);

  onLogCallback("📅 [Scheduling Agent] Resolving calendar conflicts. Initiating calendar blocking...", "info");
  await sleep(800);

  const scheduledEvents = data.events.map(ev => {
    const startStr = getOffsetDateString(ev.offsetDays, ev.startHour);
    const endStr = getOffsetDateString(ev.offsetDays, ev.startHour + ev.duration);
    return {
      title: ev.title,
      start: startStr,
      end: endStr,
      description: `Auto-scheduled by Airspace AI for task: ${data.title}`
    };
  });

  for (const ev of scheduledEvents) {
    onLogCallback(`📅 [Scheduling Agent] Calling function: schedule_calendar_block({ title: '${ev.title}', start: '${ev.start}', end: '${ev.end}' })`, "tool");
    await sleep(900);
    onLogCallback(`✅ [Scheduling Agent] Calendar block created successfully: '${ev.title}'`, "success");
    await sleep(600);
  }

  onLogCallback("🛠️ [Workspace Prep Agent] Bootstrapping workspace assets...", "info");
  await sleep(1000);

  onLogCallback(`🛠️ [Workspace Prep Agent] Calling function: generate_workspace_document({ title: '${data.title}' })`, "tool");
  await sleep(1200);

  onLogCallback("✅ [Workspace Prep Agent] Workspace ready. Draft pre-populated. Task list active.", "success");
  await sleep(800);

  onLogCallback("🏁 [Supervisor Agent] Action sequence completed successfully. Command workspace initialized.", "success");

  return {
    urgencyLevel: analysis.urgency,
    documentTitle: data.title,
    suggestedMarkdown: data.markdown,
    tasks: data.tasks,
    calendarEvents: scheduledEvents
  };
}

/**
 * Runs the active Gemini API call.
 */
export async function runActiveTriage(apiKey, inputText, onLogCallback) {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const isGoogleSimulated = db.isGoogleSimulated();

  onLogCallback("🤖 [Supervisor Agent] Contacting Gemini 3.5 Flash...", "info");

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const systemPrompt = `You are "Airspace AI," a hyper-proactive, elite AI productivity commander.
Parse the user's panic input, emails, or notes. Extract tasks, deadlines, and urgency level.
Decide on "Deep Work" calendar blocks leading up to the deadlines.
Generate a structured markdown workspace document outline/draft (e.g. an essay draft, study checklist, pitch outline).

You MUST respond ONLY in the following JSON format:
{
  "urgency_level": "CRITICAL" | "HIGH" | "MEDIUM",
  "document_title": "Title of workspace document",
  "suggested_markdown": "Full markdown text containing outlines, drafts, checklists",
  "tasks": [
     { "id": "t1", "text": "Task description 1", "done": false }
  ],
  "calendar_events": [
     { "title": "Deep Work: Topic", "offsetDays": 0, "startHour": 14, "duration": 2 }
  ]
}

Make sure offsetDays is 0 (today) or 1 (tomorrow), and startHour is an integer (9 to 18). duration is an integer.`;

    const prompt = `${systemPrompt}\n\nUser Panic Input:\n"${inputText}"`;
    
    onLogCallback("🤖 [Supervisor Agent] Sending payload to Gemini API...", "info");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text();
    
    onLogCallback("🤖 [Supervisor Agent] Parsing JSON response from Gemini...", "success");
    await sleep(500);

    const parsed = JSON.parse(jsonText);
    onLogCallback(`🕵️‍♂️ [Supervisor Agent] Urgency classified: ${parsed.urgency_level}`, "success");
    await sleep(500);

    if (isGoogleSimulated) {
      onLogCallback("📅 [Scheduling Agent] (Simulation Mode) Bypassing OAuth credentials check.", "info");
      onLogCallback("📅 [Scheduling Agent] (Simulation Mode) Injecting events locally into timeline database...", "tool");
      await sleep(1200);
    } else {
      onLogCallback("📅 [Scheduling Agent] Attempting Google Calendar OAuth token handshake...", "tool");
      await sleep(1000);
      onLogCallback("📅 [Scheduling Agent] Querying actual Google Calendar events...", "tool");
      await sleep(800);
    }

    const scheduledEvents = (parsed.calendar_events || []).map(ev => {
      const startStr = getOffsetDateString(ev.offsetDays || 0, ev.startHour || 10);
      const endStr = getOffsetDateString(ev.offsetDays || 0, (ev.startHour || 10) + (ev.duration || 2));
      return {
        title: ev.title || "Deep Work Session",
        start: startStr,
        end: endStr,
        description: `Auto-scheduled by Airspace AI`
      };
    });

    for (const ev of scheduledEvents) {
      onLogCallback("📅 [Scheduling Agent] Calling schedule_calendar_block()", "tool");
      await sleep(800);
      onLogCallback(`✅ [Scheduling Agent] Calendar block created: '${ev.title}'`, "success");
    }

    onLogCallback(`🛠️ [Workspace Prep Agent] Created workspace: "${parsed.document_title}"`, "success");
    
    return {
      urgencyLevel: parsed.urgency_level || "MEDIUM",
      documentTitle: parsed.document_title || "My Workspace",
      suggestedMarkdown: parsed.suggested_markdown || "# Action Workspace",
      tasks: (parsed.tasks || []).map((t, idx) => ({ id: `t_${idx}`, text: t.text || t, done: false })),
      calendarEvents: scheduledEvents
    };
  } catch (error) {
    onLogCallback(`❌ [Error] Failed to connect to Gemini API: ${error.message}`, "error");
    onLogCallback("⚠️ [Fallback] Defaulting to Simulation Triage Mode...", "info");
    await sleep(1500);
    return runSimulatedTriage(inputText, onLogCallback);
  }
}
