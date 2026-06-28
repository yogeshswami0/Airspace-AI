class LocalDatabase {
  constructor() {
    this.KEYS = {
      TASKS: "airspace_db_tasks",
      EVENTS: "airspace_db_events",
      DOC_TITLE: "airspace_db_doc_title",
      DOC_MARKDOWN: "airspace_db_doc_markdown",
      URGENCY: "airspace_db_urgency",
      LOGS: "airspace_db_logs",
      GOOGLE_SIMULATED: "airspace_db_google_simulated",
      USER_EMAIL: "airspace_db_user_email"
    };
  }

  // User Email identity
  getUserEmail() {
    return localStorage.getItem(this.KEYS.USER_EMAIL) || "user@airspace.ai";
  }

  saveUserEmail(email) {
    localStorage.setItem(this.KEYS.USER_EMAIL, email || "user@airspace.ai");
  }

  // Google Simulated Configuration
  isGoogleSimulated() {
    const val = localStorage.getItem(this.KEYS.GOOGLE_SIMULATED);
    return val === null ? true : val === "true";
  }

  saveGoogleSimulated(val) {
    localStorage.setItem(this.KEYS.GOOGLE_SIMULATED, val ? "true" : "false");
  }

  // Tasks operations
  getTasks() {
    try {
      const data = localStorage.getItem(this.KEYS.TASKS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to read tasks from database", e);
      return [];
    }
  }

  saveTasks(tasks) {
    try {
      localStorage.setItem(this.KEYS.TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.error("Failed to save tasks to database", e);
    }
  }

  // Events operations
  getEvents() {
    try {
      const data = localStorage.getItem(this.KEYS.EVENTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to read events from database", e);
      return [];
    }
  }

  saveEvents(events) {
    try {
      localStorage.setItem(this.KEYS.EVENTS, JSON.stringify(events));
    } catch (e) {
      console.error("Failed to save events to database", e);
    }
  }

  // Workspace Document operations
  getWorkspaceDoc() {
    return {
      title: localStorage.getItem(this.KEYS.DOC_TITLE) || "",
      markdown: localStorage.getItem(this.KEYS.DOC_MARKDOWN) || ""
    };
  }

  saveWorkspaceDoc(title, markdown) {
    localStorage.setItem(this.KEYS.DOC_TITLE, title);
    localStorage.setItem(this.KEYS.DOC_MARKDOWN, markdown);
  }

  // Urgency Level operations
  getUrgencyLevel() {
    return localStorage.getItem(this.KEYS.URGENCY) || "MEDIUM";
  }

  saveUrgencyLevel(level) {
    localStorage.setItem(this.KEYS.URGENCY, level);
  }

  // Logs operations
  getLogs() {
    try {
      const data = localStorage.getItem(this.KEYS.LOGS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to read logs", e);
      return [];
    }
  }

  saveLogs(logs) {
    try {
      localStorage.setItem(this.KEYS.LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error("Failed to save logs", e);
    }
  }

  // Clear/Reset all tables
  clearDatabase() {
    Object.values(this.KEYS).forEach(key => localStorage.removeItem(key));
  }
}

export const db = new LocalDatabase();
