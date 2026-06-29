import React from "react";
import { Task, Priority, TaskStatus } from "../types";
import { 
  CheckCircle2, 
  Circle, 
  Play, 
  Trash2, 
  Edit3, 
  Calendar, 
  AlertCircle, 
  Tag, 
  Sparkles,
  Check,
  Layers,
  Repeat,
  Clock,
  BookOpen,
  Book,
  Flame
} from "lucide-react";

interface TaskCardProps {
  task: Task;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
  themeConfig?: any;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStatusChange,
  onEdit,
  onDelete,
  onToggleComplete,
  themeConfig,
}) => {
  const { id, title, deadline, priority, status, notes, estimatedUrgency } = task;
  const isCompleted = status === "Completed";
  const isDark = themeConfig?.isDark;
  const isCozy = themeConfig?.accentText?.includes("orange") || themeConfig?.accentText?.includes("emerald");

  // Priority styling configurations
  const priorityStyles = {
    High: {
      bg: isDark ? "bg-red-950/40 text-red-300 border-red-900/60" : "bg-red-50 text-red-700 border-red-200",
      badge: "bg-red-600 text-white",
      dot: "bg-red-600",
    },
    Medium: {
      bg: isDark ? "bg-amber-950/40 text-amber-300 border-amber-900/60" : "bg-amber-50 text-amber-700 border-amber-200",
      badge: "bg-amber-500 text-white",
      dot: "bg-amber-500",
    },
    Low: {
      bg: isDark ? "bg-blue-950/40 text-blue-300 border-blue-900/60" : "bg-blue-50 text-blue-700 border-blue-200",
      badge: "bg-blue-500 text-white",
      dot: "bg-blue-500",
    },
  }[priority];

  // Status styling configurations
  const statusStyles = isDark ? {
    "Completed": "border-emerald-950 bg-emerald-950/20 text-emerald-400 shadow-sm",
    "In Progress": "border-blue-900 bg-[#1E293B] text-slate-100 shadow-md ring-1 ring-blue-950",
    "Not Started": "border-slate-800 bg-[#131B2E] text-slate-300 shadow-sm hover:shadow-md hover:border-slate-700",
  }[status] : (isCozy ? {
    "Completed": "border-[#C3D2BC] bg-[#E6ECE3] text-[#3E5C31] shadow-xs",
    "In Progress": "border-orange-200 bg-white text-stone-800 shadow-md ring-1 ring-orange-100",
    "Not Started": "border-stone-200 bg-white text-stone-700 shadow-sm hover:shadow-md hover:border-stone-150",
  }[status] : {
    "Completed": "border-emerald-300 bg-emerald-50/40 text-emerald-900 shadow-sm",
    "In Progress": "border-blue-200 bg-white text-gray-900 shadow-md ring-1 ring-blue-100",
    "Not Started": "border-gray-200 bg-white text-gray-900 shadow-sm hover:shadow-md",
  }[status]);

  const cardBorderDivider = isDark ? "border-slate-800" : (isCozy ? "border-stone-100" : "border-gray-100");
  const editBtnStyle = isDark 
    ? "text-purple-400 hover:text-purple-300 hover:bg-purple-950/40" 
    : (isCozy ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50" : "text-gray-600 hover:text-indigo-600 hover:bg-indigo-50");
  const deleteBtnStyle = isDark 
    ? "text-red-400 hover:text-red-300 hover:bg-red-950/40 ml-auto" 
    : "text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto";

  return (
    <div
      id={`task-card-${id}`}
      className={`group relative flex flex-col justify-between rounded-xl border p-5 transition-all duration-300 ${statusStyles} ${
        isCompleted ? "opacity-90" : ""
      }`}
    >
      {/* Accent Ribbon or Glow for Active Urgent Tasks */}
      {!isCompleted && priority === "High" && (
        <div className="absolute top-0 left-0 h-1 w-full rounded-t-xl bg-red-600 animate-pulse" />
      )}

      {/* Card Header */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <button
              id={`btn-complete-${id}`}
              onClick={() => onToggleComplete(id)}
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
                isCompleted
                  ? "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700"
                  : (isDark 
                      ? "border-slate-700 hover:border-purple-500 hover:bg-purple-950/40 text-transparent hover:text-purple-400"
                      : (isCozy 
                          ? "border-stone-300 hover:border-orange-500 hover:bg-orange-50 text-transparent hover:text-orange-500"
                          : "border-gray-300 hover:border-emerald-500 hover:bg-emerald-50 text-transparent hover:text-emerald-500"
                        )
                    )
              }`}
              title={isCompleted ? "Mark as Incomplete" : "Mark as Completed"}
            >
              {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : <Check className="h-3 w-3" />}
            </button>
            
            <h3
              className={`font-bold tracking-tight text-base sm:text-lg transition-all ${
                isCompleted 
                  ? (isDark ? "line-through text-slate-500 decoration-slate-600 decoration-2" : (isCozy ? "line-through text-stone-400 decoration-stone-400/60 decoration-2" : "line-through text-gray-400 decoration-gray-400/60 decoration-2"))
                  : (isDark ? "text-slate-100" : (isCozy ? "text-stone-800" : "text-gray-900"))
              }`}
            >
              {title}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${priorityStyles.badge}`}
            >
              {priority}
            </span>
          </div>
        </div>

        {/* Notes / Stress Context */}
        {notes && (
          <p className={`text-xs mt-2 mb-4 leading-relaxed ${
            isCompleted 
              ? (isDark ? "text-slate-500" : "text-gray-400") 
              : (isDark ? "text-slate-300" : (isCozy ? "text-stone-600" : "text-gray-600"))
          }`}>
            {notes}
          </p>
        )}

        {/* Numerical Context Targets */}
        {task.numericalContext && (
          <div className="flex flex-wrap gap-1.5 mt-1.5 mb-3">
            {task.numericalContext.quantity && (
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${
                isDark 
                  ? "bg-purple-950/30 text-purple-300 border-purple-900/40" 
                  : (isCozy ? "bg-orange-50 text-orange-800 border-orange-150" : "bg-indigo-50 text-indigo-800 border-indigo-150")
              }`} title="Quantity">
                <Tag className="h-3 w-3 shrink-0" />
                <span>{task.numericalContext.quantity}</span>
              </span>
            )}
            {task.numericalContext.sets && (
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${
                isDark 
                  ? "bg-cyan-950/30 text-cyan-300 border-cyan-900/40" 
                  : "bg-cyan-50 text-cyan-800 border-cyan-150"
              }`} title="Sets">
                <Layers className="h-3 w-3 shrink-0" />
                <span>{task.numericalContext.sets}</span>
              </span>
            )}
            {task.numericalContext.repetitions && (
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${
                isDark 
                  ? "bg-sky-950/30 text-sky-300 border-sky-900/40" 
                  : "bg-sky-50 text-sky-800 border-sky-150"
              }`} title="Repetitions">
                <Repeat className="h-3 w-3 shrink-0" />
                <span>{task.numericalContext.repetitions}</span>
              </span>
            )}
            {task.numericalContext.duration && (
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${
                isDark 
                  ? "bg-amber-950/30 text-amber-300 border-amber-900/40" 
                  : "bg-amber-50 text-amber-800 border-amber-150"
              }`} title="Duration">
                <Clock className="h-3 w-3 shrink-0" />
                <span>{task.numericalContext.duration}</span>
              </span>
            )}
            {task.numericalContext.pages && (
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${
                isDark 
                  ? "bg-emerald-950/30 text-emerald-300 border-emerald-900/40" 
                  : "bg-emerald-50 text-emerald-800 border-emerald-150"
              }`} title="Pages">
                <BookOpen className="h-3 w-3 shrink-0" />
                <span>{task.numericalContext.pages}</span>
              </span>
            )}
            {task.numericalContext.chapters && (
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${
                isDark 
                  ? "bg-rose-950/30 text-rose-300 border-rose-900/40" 
                  : "bg-rose-50 text-rose-800 border-rose-150"
              }`} title="Chapters">
                <Book className="h-3 w-3 shrink-0" />
                <span>{task.numericalContext.chapters}</span>
              </span>
            )}
            {task.numericalContext.sessions && (
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${
                isDark 
                  ? "bg-teal-950/30 text-teal-300 border-teal-900/40" 
                  : "bg-teal-50 text-teal-800 border-teal-150"
              }`} title="Study Sessions">
                <Flame className="h-3 w-3 shrink-0" />
                <span>{task.numericalContext.sessions}</span>
              </span>
            )}
          </div>
        )}

        {/* Urgency Explanation from AI */}
        {estimatedUrgency && !isCompleted && (
          <div className={`flex items-start gap-1.5 rounded-lg p-2.5 text-[11px] font-medium mb-3 ${
            isDark 
              ? "bg-[#1E293B]/70 text-purple-300 border border-slate-800" 
              : (isCozy ? "bg-orange-50/70 text-orange-950" : "bg-indigo-50/70 text-indigo-950")
          }`}>
            <Sparkles className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${isDark ? "text-purple-400" : (isCozy ? "text-orange-500" : "text-indigo-600")}`} />
            <span>AI: {estimatedUrgency}</span>
          </div>
        )}
      </div>

      {/* Card Footer & Attributes */}
      <div className={`mt-4 border-t pt-3 ${cardBorderDivider}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Deadline */}
          <div className={`flex items-center gap-1.5 font-medium ${isDark ? "text-slate-400" : "text-gray-500"}`}>
            <Calendar className={`h-3.5 w-3.5 ${isDark ? "text-slate-500" : "text-gray-400"}`} />
            <span className={isCompleted ? "line-through" : ""}>{deadline || "No deadline"}</span>
          </div>

          {/* Quick status cycle toggle */}
          {!isCompleted && (
            <div className="flex items-center gap-1">
              <span className={`text-[11px] mr-1 ${isDark ? "text-slate-500" : "text-gray-400"}`}>Status:</span>
              <button
                id={`btn-status-toggle-${id}`}
                onClick={() => onStatusChange(id, status === "Not Started" ? "In Progress" : "Not Started")}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors duration-200 cursor-pointer ${
                  status === "In Progress"
                    ? (isDark 
                        ? "bg-blue-950 text-blue-300 hover:bg-blue-900" 
                        : (isCozy ? "bg-orange-100 text-orange-800 hover:bg-orange-200" : "bg-blue-100 text-blue-700 hover:bg-blue-200")
                      )
                    : (isDark 
                        ? "bg-slate-800 text-slate-300 hover:bg-slate-700" 
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )
                }`}
              >
                {status}
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className={`flex items-center justify-end gap-1.5 mt-3 pt-2 border-t border-dashed ${cardBorderDivider}`}>
          <button
            id={`btn-edit-${id}`}
            onClick={() => onEdit(task)}
            className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${editBtnStyle}`}
          >
            <Edit3 className="h-3.5 w-3.5" />
            Edit
          </button>
          
          <button
            id={`btn-delete-${id}`}
            onClick={() => onDelete(id)}
            className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${deleteBtnStyle}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
