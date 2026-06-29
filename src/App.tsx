import { useState, useEffect } from "react";
import { Task, ActionBlueprint, CoachTone, Priority, TaskStatus } from "./types";
import { TaskCard } from "./components/TaskCard";
import { TaskEditor } from "./components/TaskEditor";
import { ActionBlueprintView } from "./components/ActionBlueprintView";
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle,
  FileText,
  ListTodo,
  TrendingUp,
  BrainCircuit,
  MessageSquare,
  RefreshCw,
  Zap,
  Info
} from "lucide-react";

// Pre-configured templates to help users test out stressful contexts
const PRESET_SCENARIOS = [
  {
    label: "💼 Work Crunch",
    text: "So much on my plate! I have to send the Q3 marketing proposal by tomorrow 4 PM. Need to schedule a follow-up with the product team. My inbox is flooded with 45 unread emails. Also, I haven't prepared the deck for Friday's board meeting yet and I'm super stressed that I won't have time to complete it.",
  },
  {
    label: "🎓 Student Finals",
    text: "My physics exam is this Thursday at 9 AM and I barely understand thermodynamics. I also have an essay draft for literature due tomorrow night. My room is a complete mess and I feel so guilty about sitting around. Need to return library books by Friday too.",
  },
  {
    label: "🏡 General Chaos",
    text: "Car needs an oil change ASAP. Rent is due on Tuesday. I promised to host dinner for 4 friends on Saturday night but haven't planned the menu or cleaned the kitchen. Also, I need to cancel my gym subscription before they charge me again on the 1st.",
  },
];

const getFallbackBlueprint = (tasks: Task[], tone: CoachTone): ActionBlueprint => {
  const isStrict = tone.includes("Strict");
  
  const schedule = tasks.map((t, index) => {
    let timeWindow = "Focus Block";
    if (index === 0) timeWindow = "Morning Focus (9:00 AM)";
    else if (index === 1) timeWindow = "Mid-Day Focus (11:30 AM)";
    else if (index === 2) timeWindow = "Afternoon Power (2:00 PM)";
    else if (index === 3) timeWindow = "Evening Wrap-up (4:30 PM)";
    else timeWindow = `Slot #${index + 1}`;

    return {
      timeWindow,
      taskTitle: t.title,
      focusTip: t.priority === "High" 
        ? "High priority task! Minimize all distractions and turn off notifications." 
        : "Steady focus. Keep a steady pace and clear your mind."
    };
  });

  const coachingMessage = isStrict 
    ? "Time to stop planning and start executing. Every task on this board represents a commitment to yourself. No excuses, no delays—let's crush these targets right now!"
    : "Take a deep breath. You have a structured, clear list of tasks here, and we can take them one step at a time. Be kind to yourself, and let's make some gentle progress today.";

  const urgencyAnalysis = tasks.length > 0
    ? `You have ${tasks.length} active tasks scheduled. Focus on high-priority targets first to relieve cognitive load.`
    : "No active tasks in your queue. Ready for your next brain dump to organize your thoughts!";

  const conflictsDetected: string[] = [];
  const highPriority = tasks.filter(t => t.priority === 'High' && t.status !== 'Completed');
  if (highPriority.length > 1) {
    conflictsDetected.push(`Multiple High Priority tasks (${highPriority.length}) are active. Focus on one at a time to prevent burnout.`);
  }

  const recommendations = isStrict
    ? [
        "Focus on the absolute highest priority first—do not multitask.",
        "Set a 25-minute Pomodoro timer and work with 100% single-task focus.",
        "Eliminate phone and tab distractions immediately."
      ]
    : [
        "Take a short 5-minute stretch or breathing break between tasks.",
        "Celebrate completing small steps to build positive momentum.",
        "Remember, progress is better than perfection. You've got this!"
      ];

  return {
    coachingMessage,
    urgencyAnalysis,
    conflictsDetected,
    schedule,
    recommendations
  };
};

export default function App() {
  // --- Persistent States from LocalStorage ---
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem("tca_tasks");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [blueprint, setBlueprint] = useState<ActionBlueprint | null>(() => {
    try {
      const saved = localStorage.getItem("tca_blueprint");
      if (saved) return JSON.parse(saved);
      
      // If there is no saved blueprint but we have tasks, auto-generate fallback blueprint
      const savedTasksStr = localStorage.getItem("tca_tasks");
      const savedTasks = savedTasksStr ? JSON.parse(savedTasksStr) : [];
      if (savedTasks && savedTasks.length > 0) {
        const savedTone = localStorage.getItem("tca_coach_tone") || "Encouraging & Supportive";
        const normalizedTone = (savedTone.includes("Strict") || savedTone.includes("Bootcamp") || savedTone.includes("No-Nonsense")) 
          ? "Strict & No-Nonsense" 
          : "Encouraging & Supportive";
        return getFallbackBlueprint(savedTasks, normalizedTone as CoachTone);
      }
      return null;
    } catch {
      return null;
    }
  });

  const [backupBlueprint, setBackupBlueprint] = useState<ActionBlueprint | null>(() => {
    try {
      const saved = localStorage.getItem("tca_blueprint_backup");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [rawText, setRawText] = useState(() => {
    return localStorage.getItem("tca_raw_text") || "";
  });

  const [coachTone, setCoachTone] = useState<CoachTone>(() => {
    const saved = localStorage.getItem("tca_coach_tone");
    if (saved && (saved.includes("Strict") || saved.includes("Bootcamp") || saved.includes("No-Nonsense"))) {
      return "Strict & No-Nonsense";
    }
    return "Encouraging & Supportive";
  });

  // --- UI and Editing States ---
  const [designTheme, setDesignTheme] = useState<'professional' | 'midnight' | 'warm'>(() => {
    const saved = localStorage.getItem("tca_design_theme");
    if (saved === "minimal") return "midnight";
    return (saved as any) || "professional";
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterPriority, setFilterPriority] = useState<"All" | Priority>("All");
  const [filterStatus, setFilterStatus] = useState<"All" | TaskStatus | "Active">("All");

  // Custom confirmation dialog states to bypass iframe-blocked window.confirm
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);
  const [clarificationRequest, setClarificationRequest] = useState<{ message: string; options: string[] } | null>(null);

  // Save changes to LocalStorage automatically whenever they modify the state
  useEffect(() => {
    localStorage.setItem("tca_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (blueprint) {
      localStorage.setItem("tca_blueprint", JSON.stringify(blueprint));
    } else {
      localStorage.removeItem("tca_blueprint");
    }
  }, [blueprint]);

  useEffect(() => {
    if (tasks.length === 0) {
      if (blueprint) {
        setBlueprint(null);
      }
    } else if (!blueprint && !backupBlueprint) {
      setBlueprint(getFallbackBlueprint(tasks, coachTone));
    }
  }, [tasks, blueprint, backupBlueprint, coachTone]);

  useEffect(() => {
    if (blueprint && blueprint.schedule && tasks.length > 0) {
      const activeTitles = new Set(tasks.map(t => t.title));
      const filteredSchedule = blueprint.schedule.filter(item => activeTitles.has(item.taskTitle));
      if (filteredSchedule.length !== blueprint.schedule.length) {
        setBlueprint({
          ...blueprint,
          schedule: filteredSchedule
        });
      }
    }
  }, [tasks, blueprint]);

  useEffect(() => {
    if (backupBlueprint) {
      localStorage.setItem("tca_blueprint_backup", JSON.stringify(backupBlueprint));
    } else {
      localStorage.removeItem("tca_blueprint_backup");
    }
  }, [backupBlueprint]);

  useEffect(() => {
    localStorage.setItem("tca_raw_text", rawText);
  }, [rawText]);

  useEffect(() => {
    localStorage.setItem("tca_coach_tone", coachTone);
  }, [coachTone]);

  useEffect(() => {
    localStorage.setItem("tca_design_theme", designTheme);
  }, [designTheme]);

  // --- Action Handlers ---
  const generatePlanWithText = async (textToSubmit: string, mergeOption?: boolean) => {
    setIsLoading(true);
    setError(null);
    setClarificationRequest(null);

    const activeMerge = mergeOption !== undefined ? mergeOption : isMerging;
    if (mergeOption !== undefined) {
      setIsMerging(mergeOption);
    }

    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rawText: textToSubmit,
          tone: coachTone,
          existingTasks: activeMerge ? tasks : [],
          currentLocalTime: {
            isoString: new Date().toISOString(),
            localString: new Date().toLocaleString(),
            dayOfWeek: new Date().toLocaleDateString(undefined, { weekday: "long" }),
            timeOnly: new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status code ${response.status}`);
      }

      const data = await response.json();
      
      // If server returned a clarification request, handle it in UI
      if (data.clarificationRequest) {
        setClarificationRequest(data.clarificationRequest);
        return;
      }

      // Update local storage and component states
      if (data.tasks && Array.isArray(data.tasks)) {
        // Map any newly generated tasks with random IDs and current timestamp
        const parsedTasks: Task[] = data.tasks.map((t: any) => ({
          id: t.id || Math.random().toString(36).substring(2, 11),
          title: t.title,
          deadline: t.deadline || "No specific deadline",
          priority: (t.priority === "High" || t.priority === "Medium" || t.priority === "Low") ? t.priority : "Medium",
          status: (t.status === "Not Started" || t.status === "In Progress" || t.status === "Completed") ? t.status : "Not Started",
          notes: t.notes || "",
          estimatedUrgency: t.estimatedUrgency || "",
          numericalContext: t.numericalContext ? {
            quantity: t.numericalContext.quantity || undefined,
            repetitions: t.numericalContext.repetitions || undefined,
            sets: t.numericalContext.sets || undefined,
            duration: t.numericalContext.duration || undefined,
            pages: t.numericalContext.pages || undefined,
            chapters: t.numericalContext.chapters || undefined,
            sessions: t.numericalContext.sessions || undefined,
          } : undefined,
          createdAt: t.createdAt || new Date().toISOString(),
        }));

        // Merge or replace tasks
        setTasks(parsedTasks);
      }

      if (data.blueprint) {
        setBlueprint(data.blueprint);
      }
    } catch (err: any) {
      console.error("Plan compilation error:", err);
      setError(err.message || "An unexpected error occurred while communicating with Task Completer AI. Please verify your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!rawText.trim()) {
      setError("Please write down some tasks, deadlines, or thoughts before generating a plan.");
      return;
    }
    
    const previousPlanExists = tasks.length > 0 || blueprint !== null;
    if (previousPlanExists) {
      setShowReplaceConfirm(true);
    } else {
      await generatePlanWithText(rawText, false);
    }
  };

  const handleReplacePlan = async () => {
    setTasks([]);
    setBlueprint(null);
    setBackupBlueprint(null);
    localStorage.removeItem("tca_tasks");
    localStorage.removeItem("tca_blueprint");
    localStorage.removeItem("tca_blueprint_backup");
    setShowReplaceConfirm(false);
    await generatePlanWithText(rawText, false);
  };

  const handleMergePlan = async () => {
    setShowReplaceConfirm(false);
    await generatePlanWithText(rawText, true);
  };

  const handleClarify = async (selectedOption: string) => {
    const updatedText = `${rawText}\n\n[Clarification context: The user selected this date/time clarification choice: "${selectedOption}"]`;
    setRawText(updatedText);
    setClarificationRequest(null);
    await generatePlanWithText(updatedText, isMerging);
  };

  // Preset Scenario loader helper
  const handleApplyPreset = (scenarioText: string) => {
    setRawText(scenarioText);
    setError(null);
  };

  // Add a brand new task manually
  const handleAddTask = (taskData: Omit<Task, "id" | "createdAt">) => {
    const newTask: Task = {
      ...taskData,
      id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
    setShowAddForm(false);
  };

  // Update an existing task details (from edit mode)
  const handleUpdateTask = (taskData: Omit<Task, "id" | "createdAt">) => {
    if (!editingTask) return;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === editingTask.id
          ? { ...t, ...taskData }
          : t
      )
    );
    setEditingTask(null);
  };

  // Delete a task completely
  const handleDeleteTask = (id: string) => {
    setTaskToDeleteId(id);
  };

  // Cycle status of task
  const handleStatusChange = (id: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
  };

  // Quick checkbox complete/incomplete toggle
  const handleToggleComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const newStatus: TaskStatus = t.status === "Completed" ? "Not Started" : "Completed";
          return { ...t, status: newStatus };
        }
        return t;
      })
    );
  };

  // Clear all tasks
  const handleClearAllTasks = () => {
    setShowClearConfirm(true);
  };

  // Stats Counters
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const highPriorityTasks = tasks.filter((t) => t.priority === "High" && t.status !== "Completed").length;
  const totalWeight = tasks.reduce((sum, t) => {
    if (t.status === "Completed") return sum + 100;
    if (t.status === "In Progress") return sum + 50;
    return sum; // "Not Started" counts as 0
  }, 0);
  const progressPercent = totalTasks > 0 ? Math.round(totalWeight / totalTasks) : 0;

  // Filter Logic
  const filteredTasks = tasks.filter((t) => {
    const priorityMatch = filterPriority === "All" || t.priority === filterPriority;
    
    let statusMatch = true;
    if (filterStatus === "Completed") {
      statusMatch = t.status === "Completed";
    } else if (filterStatus === "In Progress") {
      statusMatch = t.status === "In Progress";
    } else if (filterStatus === "Not Started") {
      statusMatch = t.status === "Not Started";
    } else if (filterStatus === "Active") {
      statusMatch = t.status !== "Completed";
    }

    return priorityMatch && statusMatch;
  });

  const themeConfig = {
    professional: {
      bg: "bg-sky-50/30",
      accentText: "text-blue-700",
      accentBg: "bg-blue-600",
      accentBorder: "border-blue-100",
      cardBg: "bg-white",
      cardBorder: "border-slate-200",
      buttonPrimary: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100",
      panelBg: "bg-blue-50/20",
      headerIconBg: "bg-blue-600",
      badgeColor: "bg-blue-50 text-blue-700",
      textHeading: "text-slate-900",
      textBody: "text-slate-600",
      textMuted: "text-slate-400",
      textLabel: "text-slate-700",
      presetButton: "bg-gray-50 border-slate-200 hover:bg-gray-100 text-slate-700",
      inputBg: "bg-white",
      inputBorder: "border-slate-300",
      inputText: "text-slate-800",
      inputPlaceholder: "placeholder-slate-400",
      isDark: false,
    },
    midnight: {
      bg: "bg-[#0A0F1D]",
      accentText: "text-purple-400",
      accentBg: "bg-purple-600",
      accentBorder: "border-purple-900/60",
      cardBg: "bg-[#131B2E]",
      cardBorder: "border-slate-800/80",
      buttonPrimary: "bg-blue-600 hover:bg-blue-500 text-white shadow-none",
      panelBg: "bg-[#1E293B]/60 border border-slate-800/80",
      headerIconBg: "bg-purple-600",
      badgeColor: "bg-purple-950/60 text-purple-300",
      textHeading: "text-white",
      textBody: "text-slate-300",
      textMuted: "text-slate-500",
      textLabel: "text-slate-400",
      presetButton: "bg-slate-800/80 border-slate-700 hover:bg-slate-700/80 text-slate-200",
      inputBg: "bg-[#1E293B]",
      inputBorder: "border-slate-800",
      inputText: "text-slate-100",
      inputPlaceholder: "placeholder-slate-500",
      isDark: true,
    },
    warm: {
      bg: "bg-[#FAF7F0]",
      accentText: "text-orange-600",
      accentBg: "bg-orange-500",
      accentBorder: "border-orange-100",
      cardBg: "bg-white",
      cardBorder: "border-[#E8E2D5]",
      buttonPrimary: "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-100",
      panelBg: "bg-[#FDFBF7] border border-[#E8E2D5]",
      headerIconBg: "bg-orange-500",
      badgeColor: "bg-orange-50 text-orange-800",
      textHeading: "text-stone-800",
      textBody: "text-stone-600",
      textMuted: "text-stone-400",
      textLabel: "text-stone-700",
      presetButton: "bg-stone-50 border-stone-200 hover:bg-stone-100 text-stone-700",
      inputBg: "bg-white",
      inputBorder: "border-[#E8E2D5]",
      inputText: "text-stone-800",
      inputPlaceholder: "placeholder-stone-400",
      isDark: false,
    }
  }[designTheme];

  return (
    <div className={`min-h-screen ${themeConfig.bg} py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-500`}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Dynamic Style Preview Switcher */}
        <div id="design-theme-switcher" className={`w-full flex flex-col sm:flex-row sm:items-center justify-between border rounded-xl p-4 sm:px-4 sm:py-3 shadow-xs gap-4 sm:gap-3 ${themeConfig.isDark ? 'bg-[#131B2E] border-slate-800/80' : 'bg-white border-gray-200/80'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-2 w-full sm:w-auto">
            <span className={`font-semibold text-[10px] uppercase tracking-widest text-center sm:text-left ${themeConfig.isDark ? 'text-slate-400' : 'text-gray-500'}`}>Aesthetic Design Mode:</span>
            <div className={`grid grid-cols-3 sm:flex sm:items-center gap-1.5 sm:gap-1 p-1 sm:p-0.5 rounded-lg w-full sm:w-auto ${themeConfig.isDark ? 'bg-slate-800/60' : 'bg-gray-100'}`}>
              {(["professional", "midnight", "warm"] as const).map((styleName) => (
                <button
                  key={styleName}
                  id={`btn-theme-${styleName}`}
                  onClick={() => setDesignTheme(styleName)}
                  className={`px-1 py-2 sm:px-3.5 sm:py-1.5 rounded-md text-[9px] min-[375px]:text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center text-center leading-tight ${
                    designTheme === styleName
                      ? `${themeConfig.accentBg} text-white shadow-sm`
                      : (themeConfig.isDark ? "text-slate-400 hover:text-white" : "text-gray-600 hover:text-gray-900")
                  }`}
                >
                  {styleName === "professional" && "💼 Professional Blue"}
                  {styleName === "midnight" && "🌌 Midnight Focus"}
                  {styleName === "warm" && "🍁 Warm & Cozy"}
                </button>
              ))}
            </div>
          </div>
          <div className={`flex items-center justify-center sm:justify-end gap-1.5 text-[11px] font-semibold uppercase tracking-wider ${themeConfig.isDark ? 'text-slate-500' : 'text-gray-400'}`}>
            <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
            <span>Interactive Layout Options</span>
          </div>
        </div>

        {/* APP HEADER */}
        <header id="app-header" className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-6 ${themeConfig.isDark ? 'border-slate-800/80' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`rounded-2xl ${themeConfig.headerIconBg} p-3 text-white shadow-md`}>
              <BrainCircuit className="h-7 w-7" />
            </div>
            <div>
              <h1 id="app-title" className={`text-3xl font-bold tracking-tight ${themeConfig.accentText}`}>
                Task Completer AI
              </h1>
              <p className={`text-sm font-medium mt-0.5 ${themeConfig.textMuted}`}>
                Intelligent Productivity Orchestrator powered by Gemini
              </p>
            </div>
          </div>

          {/* Productivity Stats Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className={`rounded-xl border ${themeConfig.cardBorder} ${themeConfig.cardBg} p-3 shadow-sm flex items-center gap-3 min-w-[120px]`}>
              <div className="rounded-lg bg-emerald-500/10 text-emerald-500 p-2">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <div className={`text-xs font-semibold uppercase tracking-wider ${themeConfig.textMuted}`}>Done</div>
                <div className={`text-lg font-semibold leading-none mt-1 ${themeConfig.textHeading}`}>
                  {completedTasks} <span className="text-xs font-medium opacity-70">/ {totalTasks}</span>
                </div>
              </div>
            </div>

            <div className={`rounded-xl border ${themeConfig.cardBorder} ${themeConfig.cardBg} p-3 shadow-sm flex items-center gap-3 min-w-[120px]`}>
              <div className="rounded-lg bg-red-500/10 text-red-500 p-2">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <div className={`text-xs font-semibold uppercase tracking-wider ${themeConfig.textMuted}`}>Urgent</div>
                <div className={`text-lg font-semibold leading-none mt-1 ${themeConfig.textHeading}`}>
                  {highPriorityTasks}
                </div>
              </div>
            </div>

            <div className={`rounded-xl border ${themeConfig.cardBorder} ${themeConfig.cardBg} p-3 shadow-sm flex items-center gap-3 min-w-[120px]`}>
              <div className={`rounded-lg ${themeConfig.badgeColor} p-2`}>
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <div className={`text-xs font-semibold uppercase tracking-wider ${themeConfig.textMuted}`}>Progress</div>
                <div className={`text-lg font-semibold leading-none mt-1 ${themeConfig.textHeading}`}>
                  {progressPercent}%
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN MULTI-PANEL VIEW */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT SIDEBAR: INPUT & BLUEPRINT COMPILER */}
          <section className="lg:col-span-5 space-y-6">
            
            {/* Direct Input Card */}
            <div className={`rounded-2xl border ${themeConfig.cardBorder} ${themeConfig.cardBg} p-6 shadow-sm space-y-5 transition-all duration-300`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-lg font-bold tracking-tight flex items-center gap-2 ${themeConfig.textHeading}`}>
                  <FileText className={`h-5 w-5 ${themeConfig.accentText}`} />
                  Your Thoughts & Tasks
                </h2>
                <div className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${themeConfig.textMuted}`}>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Ready
                </div>
              </div>

              {/* Preset Scenarios Buttons */}
              <div className="space-y-1.5">
                <div className={`text-xs font-semibold uppercase tracking-wider ${themeConfig.textMuted}`}>
                  Quick-load Sample Scenarios:
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRESET_SCENARIOS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleApplyPreset(preset.text)}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${themeConfig.presetButton}`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stress input Area */}
              <div className="space-y-1.5">
                <label className={`block text-xs font-semibold uppercase tracking-wider ${themeConfig.textLabel}`}>
                  Write down stressful thoughts, deadlines, and random details:
                </label>
                <textarea
                  id="user-thoughts-textarea"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="e.g., I have 3 deadlines on Monday. Physics report must be submitted. I am super worried about forgetting my doctor's appointment. Need to clean the house before guests arrive..."
                  className={`w-full h-44 rounded-xl border p-4 text-sm outline-none transition-all resize-none focus:ring-1 focus:ring-indigo-500 ${themeConfig.inputBg} ${themeConfig.inputBorder} ${themeConfig.inputText} ${themeConfig.inputPlaceholder}`}
                />
              </div>

              {/* Coach Selector */}
              <div className="space-y-1.5">
                <label className={`block text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${themeConfig.textLabel}`}>
                  <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
                  AI Coach Tone Profile
                </label>
                <select
                  id="coach-tone-select"
                  value={coachTone}
                  onChange={(e) => setCoachTone(e.target.value as CoachTone)}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors focus:ring-1 focus:ring-indigo-500 ${themeConfig.inputBg} ${themeConfig.inputBorder} ${themeConfig.inputText}`}
                >
                  <option value="Encouraging & Supportive" className={themeConfig.isDark ? "bg-slate-900 text-white" : ""}>🌸 Encouraging & Supportive</option>
                  <option value="Strict & No-Nonsense" className={themeConfig.isDark ? "bg-slate-900 text-white" : ""}>🔥 Strict & No-Nonsense</option>
                </select>
              </div>

              {/* Clarification Request Panel */}
              {clarificationRequest && (
                <div id="clarification-panel" className={`rounded-xl border p-4 space-y-3 shadow-xs transition-all duration-300 animate-fade-in ${
                  themeConfig.isDark 
                    ? "border-purple-900/60 bg-purple-950/20 text-purple-200" 
                    : "border-purple-200 bg-purple-50 text-purple-950"
                }`}>
                  <div className="flex items-start gap-2.5">
                    <HelpCircle className="h-5 w-5 shrink-0 mt-0.5 text-purple-500 animate-pulse" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300">
                        📅 Date Clarification Required
                      </h4>
                      <p className="text-xs leading-relaxed">
                        {clarificationRequest.message}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 pt-1">
                    {clarificationRequest.options.map((option, idx) => (
                      <button
                        key={idx}
                        id={`btn-clarify-option-${idx}`}
                        onClick={() => handleClarify(option)}
                        className={`w-full text-left text-xs font-medium px-3 py-2 rounded-lg transition-all border flex items-center justify-between cursor-pointer ${
                          themeConfig.isDark 
                            ? "bg-[#1E293B] hover:bg-purple-950/40 border-purple-900/60 text-purple-200" 
                            : "bg-white hover:bg-purple-100 border-purple-200 text-purple-900 shadow-xs"
                        }`}
                      >
                        <span>{option}</span>
                        <Sparkles className="h-3.5 w-3.5 text-purple-500 shrink-0 animate-pulse" />
                      </button>
                    ))}
                    <button
                      id="btn-clarify-dismiss"
                      onClick={() => setClarificationRequest(null)}
                      className="w-full text-center text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-gray-700 py-1 cursor-pointer transition-colors"
                    >
                      Dismiss & Edit thoughts
                    </button>
                  </div>
                </div>
              )}

              {/* Generate Plan Button & Feedback Panel */}
              <div className="pt-2">
                <button
                  id="btn-generate-plan"
                  onClick={handleGeneratePlan}
                  disabled={isLoading}
                  className={`relative w-full rounded-xl ${themeConfig.buttonPrimary} font-semibold text-sm py-3 px-4 transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer`}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-white" />
                      <span>Compiling Blueprint via Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 text-amber-300 fill-amber-300 animate-bounce" />
                      <span>Generate Plan</span>
                    </>
                  )}
                </button>
              </div>

              {/* Error Box */}
              {error && (
                <div id="api-error-banner" className={`rounded-xl border p-4 space-y-2 ${themeConfig.isDark ? "border-red-950 bg-red-950/20 text-red-200" : "border-red-200 bg-red-50 text-red-800"}`}>
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider">Plan Compilation Failed</h4>
                      <p className="text-xs mt-1 leading-relaxed">{error}</p>
                    </div>
                  </div>
                  <button
                    id="btn-retry-generate"
                    onClick={() => generatePlanWithText(rawText, isMerging)}
                    className={`w-full text-center text-xs font-semibold py-1.5 rounded-lg transition-colors cursor-pointer ${
                      themeConfig.isDark ? "bg-red-900/40 hover:bg-red-900/60 text-red-200" : "bg-red-100 hover:bg-red-200 text-red-800"
                    }`}
                  >
                    Retry Plan Compilation
                  </button>
                </div>
              )}
            </div>

            {/* Quick Informational / Instruction Box */}
            <div className={`rounded-2xl p-5 space-y-2 ${themeConfig.panelBg}`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${themeConfig.textHeading}`}>
                <Info className={`h-4 w-4 ${themeConfig.accentText}`} />
                How to operate Task Completer AI
              </h3>
              <p className={`text-xs leading-relaxed font-normal ${themeConfig.textBody}`}>
                Dump your unorganized schedules, stressful deadlines, or chaotic work requirements in the text area. 
                Select your preferred coach profile and hit <span className="font-semibold">Generate Plan</span>. Gemini will extract actionable tasks, deadlines, assign proper priority levels, and draft an order of operations timeline with personalized suggestions.
              </p>
            </div>
          </section>

          {/* RIGHT SIDEBAR: DASHBOARD AND BLUEPRINT OUTCOME */}
          <section className="lg:col-span-7 space-y-6">
            
            {/* AI Active Blueprint Outcome */}
            {blueprint && (
              <div className={`rounded-2xl border ${themeConfig.cardBorder} ${themeConfig.cardBg} p-6 shadow-sm transition-all duration-300`}>
                <ActionBlueprintView
                  blueprint={blueprint}
                  tone={coachTone}
                  onClearBlueprint={() => {
                    if (blueprint) {
                      setBackupBlueprint(blueprint);
                    }
                    setBlueprint(null);
                  }}
                  themeConfig={themeConfig}
                />
              </div>
            )}

            {!blueprint && backupBlueprint && (
              <div id="blueprint-restore-banner" className={`rounded-2xl border border-dashed p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 ${
                themeConfig.isDark 
                  ? "border-purple-900/60 bg-purple-950/10 text-purple-200" 
                  : "border-purple-200 bg-purple-50/70 text-purple-950"
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`rounded-lg p-2 shrink-0 ${themeConfig.isDark ? "bg-purple-950 text-purple-400" : "bg-purple-100 text-purple-700"}`}>
                    <Sparkles className="h-4 w-4 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      Recoverable AI Blueprint Found
                    </h4>
                    <p className={`text-[11px] leading-relaxed mt-0.5 ${themeConfig.isDark ? "text-slate-400" : "text-slate-600"}`}>
                      Did you accidentally reset or clear your blueprint? You can restore your last active plan and its schedule.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    id="btn-restore-blueprint"
                    onClick={() => {
                      setBlueprint(backupBlueprint);
                      setBackupBlueprint(null);
                    }}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-white ${themeConfig.accentBg}`}
                  >
                    <RefreshCw className="h-3 w-3" />
                    Restore Blueprint
                  </button>
                  <button
                    id="btn-discard-backup"
                    onClick={() => {
                      setBackupBlueprint(null);
                    }}
                    className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      themeConfig.isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-gray-150 text-gray-500"
                    }`}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Dashboard / Tasks Container */}
            <div className={`rounded-2xl border ${themeConfig.cardBorder} ${themeConfig.cardBg} p-6 shadow-sm space-y-5 transition-all duration-300`}>
              
              {/* Dashboard Headers */}
              <div className={`flex flex-wrap items-center justify-between gap-4 border-b pb-4 ${themeConfig.isDark ? 'border-slate-800/80' : 'border-gray-100'}`}>
                <div className="flex items-center gap-2">
                  <ListTodo className={`h-5 w-5 ${themeConfig.accentText}`} />
                  <div>
                    <h2 className={`text-lg font-bold tracking-tight ${themeConfig.textHeading}`}>
                      Task Action Hub
                    </h2>
                    <p className={`text-xs font-medium ${themeConfig.textMuted}`}>
                      Manage progress, refine, or manually expand your active task list
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="btn-trigger-add-task"
                    onClick={() => {
                      setEditingTask(null);
                      setShowAddForm(!showAddForm);
                    }}
                    className={`flex items-center gap-1 text-xs font-semibold text-white ${themeConfig.accentBg} px-3.5 py-2 rounded-lg transition-colors shadow-sm cursor-pointer`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Custom Task
                  </button>

                  {tasks.length > 0 && (
                    <button
                      id="btn-clear-all"
                      onClick={handleClearAllTasks}
                      className={`text-xs font-semibold px-2.5 py-2 rounded-lg transition-colors cursor-pointer ${
                        themeConfig.isDark ? "text-slate-500 hover:text-red-400 hover:bg-slate-800/40" : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                      }`}
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              {/* Task Editor (Add or Edit) Area */}
              {(showAddForm || editingTask) && (
                <div className={`rounded-xl border ${themeConfig.accentBorder} ${themeConfig.panelBg} p-5 shadow-sm transition-all animate-fadeIn`}>
                  <TaskEditor
                    taskToEdit={editingTask}
                    onSubmit={editingTask ? handleUpdateTask : handleAddTask}
                    themeConfig={themeConfig}
                    onCancel={() => {
                      setEditingTask(null);
                      setShowAddForm(false);
                    }}
                  />
                </div>
              )}

              {/* Filters Panel */}
              {tasks.length > 0 && (
                <div className={`flex flex-wrap items-center justify-between gap-4 rounded-xl p-3.5 border ${
                  themeConfig.isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-gray-50/80 border-gray-100'
                }`}>
                  {/* Status Filters */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-xs font-semibold uppercase tracking-wider mr-1 ${themeConfig.textMuted}`}>Status:</span>
                    {(["All", "Active", "Not Started", "In Progress", "Completed"] as const).map((statusVal) => (
                      <button
                        key={statusVal}
                        id={`filter-status-${statusVal.toLowerCase().replace(" ", "-")}`}
                        onClick={() => setFilterStatus(statusVal)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                          filterStatus === statusVal
                            ? `${themeConfig.accentBg} text-white shadow-sm`
                            : (themeConfig.isDark 
                                ? "bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80" 
                                : "bg-white text-gray-600 hover:text-gray-900 border border-gray-200")
                        }`}
                      >
                        {statusVal}
                      </button>
                    ))}
                  </div>

                  {/* Priority Filters */}
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-semibold uppercase tracking-wider mr-1 ${themeConfig.textMuted}`}>Urgency:</span>
                    {(["All", "High", "Medium", "Low"] as const).map((priorityVal) => (
                      <button
                        key={priorityVal}
                        id={`filter-priority-${priorityVal.toLowerCase()}`}
                        onClick={() => setFilterPriority(priorityVal)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                          filterPriority === priorityVal
                            ? `${themeConfig.accentBg} text-white shadow-sm`
                            : (themeConfig.isDark 
                                ? "bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80" 
                                : "bg-white text-gray-600 hover:text-gray-900 border border-gray-200")
                        }`}
                      >
                        {priorityVal}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks List / Grid */}
              <div className="space-y-4">
                {filteredTasks.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        themeConfig={themeConfig}
                        onStatusChange={handleStatusChange}
                        onEdit={(t) => {
                          setShowAddForm(false);
                          setEditingTask(t);
                          // scroll to task editor smoothly
                          document.getElementById("task-editor-form")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        onDelete={handleDeleteTask}
                        onToggleComplete={handleToggleComplete}
                      />
                    ))}
                  </div>
                ) : (
                  <div className={`rounded-xl border border-dashed py-12 px-4 text-center ${
                    themeConfig.isDark ? 'border-slate-800' : 'border-gray-200'
                  }`}>
                    <ListTodo className={`mx-auto h-12 w-12 stroke-[1.5] mb-3 ${
                      themeConfig.isDark ? 'text-slate-700' : 'text-gray-300'
                    }`} />
                    {tasks.length === 0 ? (
                      <>
                        <h3 className={`text-sm font-bold uppercase tracking-wider ${themeConfig.textHeading}`}>
                          No active action blueprint or tasks
                        </h3>
                        <p className={`text-xs max-w-sm mx-auto mt-1 leading-relaxed font-normal ${themeConfig.textMuted}`}>
                          Type down your stressful day above or use one of our templates to generate a plan with Gemini. Or, manually add custom tasks using the button above.
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className={`text-sm font-bold uppercase tracking-wider ${themeConfig.textHeading}`}>
                          No tasks match the active filters
                        </h3>
                        <p className={`text-xs mt-1 font-normal ${themeConfig.textMuted}`}>
                          Try adjusting or resetting your priority or status filters above.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

            </div>

          </section>

        </main>
      </div>

      {/* 1. Custom Confirmation Modal for Clearing All Tasks */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-xl space-y-4 ${themeConfig.cardBg} ${themeConfig.cardBorder}`}>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                <Trash2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className={`text-base font-bold tracking-tight ${themeConfig.textHeading}`}>
                  Wipe Dashboard Clean?
                </h3>
                <p className={`text-xs leading-relaxed ${themeConfig.textBody}`}>
                  Are you sure you want to delete all tasks and clear your current AI blueprint? This action is permanent and cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                id="btn-cancel-clear"
                onClick={() => setShowClearConfirm(false)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  themeConfig.isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Cancel
              </button>
              <button
                id="btn-confirm-clear"
                onClick={() => {
                  setTasks([]);
                  setBlueprint(null);
                  setRawText("");
                  setEditingTask(null);
                  setShowAddForm(false);
                  setShowClearConfirm(false);
                  setClarificationRequest(null);
                  setFilterPriority("All");
                  setFilterStatus("All");
                  setError(null);
                  
                  // Clean up local storage items
                  localStorage.removeItem("tca_tasks");
                  localStorage.removeItem("tca_blueprint");
                  localStorage.removeItem("tca_raw_text");
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Wipe Clean
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Custom Confirmation Modal for Deleting a Single Task */}
      {taskToDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-xl space-y-4 ${themeConfig.cardBg} ${themeConfig.cardBorder}`}>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className={`text-base font-bold tracking-tight ${themeConfig.textHeading}`}>
                  Delete Task?
                </h3>
                <p className={`text-xs leading-relaxed ${themeConfig.textBody}`}>
                  Are you sure you want to delete this task from your checklist?
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                id="btn-cancel-delete"
                onClick={() => setTaskToDeleteId(null)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  themeConfig.isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete"
                onClick={() => {
                  setTasks((prev) => prev.filter((t) => t.id !== taskToDeleteId));
                  if (editingTask?.id === taskToDeleteId) {
                    setEditingTask(null);
                  }
                  setTaskToDeleteId(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Custom Confirmation Modal for Replacing/Merging Plan */}
      {showReplaceConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-xl space-y-4 ${themeConfig.cardBg} ${themeConfig.cardBorder}`}>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                <HelpCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1 bg-transparent">
                <h3 className={`text-base font-bold tracking-tight ${themeConfig.textHeading}`}>
                  Replace the current task plan with this new one?
                </h3>
                <p className={`text-xs leading-relaxed ${themeConfig.textBody}`}>
                  You already have an active plan. Choose <strong>Replace</strong> to clear all existing tasks and start fresh, or <strong>Merge</strong> to incorporate your new thoughts into the existing list.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
              <button
                id="btn-cancel-replace-confirm"
                onClick={() => setShowReplaceConfirm(false)}
                className={`w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  themeConfig.isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Cancel
              </button>
              <button
                id="btn-confirm-merge"
                onClick={handleMergePlan}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Merge
              </button>
              <button
                id="btn-confirm-replace"
                onClick={handleReplacePlan}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Replace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
