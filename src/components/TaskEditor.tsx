import React, { useState, useEffect } from "react";
import { Task, Priority, TaskStatus } from "../types";
import { Plus, Check, X, Tag, Calendar, AlignLeft, Info } from "lucide-react";

interface TaskEditorProps {
  taskToEdit?: Task | null;
  onSubmit: (taskData: Omit<Task, "id" | "createdAt">) => void;
  onCancel: () => void;
  themeConfig?: any;
}

export const TaskEditor: React.FC<TaskEditorProps> = ({
  taskToEdit,
  onSubmit,
  onCancel,
  themeConfig,
}) => {
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [status, setStatus] = useState<TaskStatus>("Not Started");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const isDark = themeConfig?.isDark;
  const isCozy = themeConfig?.accentText?.includes("orange") || themeConfig?.accentText?.includes("emerald");

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDeadline(taskToEdit.deadline || "");
      setPriority(taskToEdit.priority);
      setStatus(taskToEdit.status);
      setNotes(taskToEdit.notes || "");
    } else {
      setTitle("");
      setDeadline("");
      setPriority("Medium");
      setStatus("Not Started");
      setNotes("");
    }
    setError("");
  }, [taskToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Task title is required!");
      return;
    }
    onSubmit({
      title: title.trim(),
      deadline: deadline.trim() || "No deadline",
      priority,
      status,
      notes: notes.trim() || undefined,
      numericalContext: taskToEdit?.numericalContext,
    });
    // Reset if adding new
    if (!taskToEdit) {
      setTitle("");
      setDeadline("");
      setPriority("Medium");
      setStatus("Not Started");
      setNotes("");
    }
  };

  const labelColor = isDark ? "text-slate-300" : (isCozy ? "text-stone-700" : "text-gray-700");
  const headingColor = isDark ? "text-slate-100" : (isCozy ? "text-stone-800" : "text-gray-900");
  const dividerColor = isDark ? "border-slate-800" : "border-gray-100";
  const inputStyle = isDark 
    ? "bg-[#1E293B] border-slate-700 text-slate-100 placeholder-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500" 
    : (isCozy 
        ? "bg-white border-stone-300 text-stone-800 placeholder-stone-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500" 
        : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
      );

  return (
    <form id="task-editor-form" onSubmit={handleSubmit} className="space-y-4">
      <div className={`flex items-center justify-between border-b pb-3 ${dividerColor}`}>
        <h3 className={`text-sm font-bold uppercase tracking-wider ${headingColor}`}>
          {taskToEdit ? "Edit Task Details" : "Quick Add Custom Task"}
        </h3>
        {taskToEdit && (
          <button
            type="button"
            onClick={onCancel}
            className={`rounded p-1 transition-colors cursor-pointer ${
              isDark ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {error && (
        <div className={`text-xs font-semibold p-2.5 rounded-lg border ${
          isDark ? "bg-red-950/40 text-red-300 border-red-900/60" : "bg-red-50 text-red-600 border-red-200"
        }`}>
          {error}
        </div>
      )}

      {/* Task Title */}
      <div>
        <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${labelColor}`}>
          Task Title *
        </label>
        <div className="relative">
          <input
            id="editor-input-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Complete math assignment, Prep presentation"
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all ${inputStyle}`}
          />
        </div>
      </div>

      {/* Deadline & Priority Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Deadline */}
        <div>
          <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1 ${labelColor}`}>
            <Calendar className="h-3.5 w-3.5 text-gray-400" />
            Deadline / Due Time
          </label>
          <input
            id="editor-input-deadline"
            type="text"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            placeholder="e.g., By 5 PM, Friday, July 1st"
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${inputStyle}`}
          />
        </div>

        {/* Priority Dropdown */}
        <div>
          <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1 ${labelColor}`}>
            <Tag className="h-3.5 w-3.5 text-gray-400" />
            Urgency / Priority
          </label>
          <select
            id="editor-input-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${inputStyle}`}
          >
            <option value="High" className={isDark ? "bg-slate-900 text-white" : ""}>🔴 High Priority</option>
            <option value="Medium" className={isDark ? "bg-slate-900 text-white" : ""}>🟡 Medium Priority</option>
            <option value="Low" className={isDark ? "bg-slate-900 text-white" : ""}>🔵 Low Priority</option>
          </select>
        </div>
      </div>

      {/* Status & Helper Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Status Dropdown */}
        <div>
          <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1 ${labelColor}`}>
            <Info className="h-3.5 w-3.5 text-gray-400" />
            Status
          </label>
          <select
            id="editor-input-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${inputStyle}`}
          >
            <option value="Not Started" className={isDark ? "bg-slate-900 text-white" : ""}>⚪ Not Started</option>
            <option value="In Progress" className={isDark ? "bg-slate-900 text-white" : ""}>🔵 In Progress</option>
            <option value="Completed" className={isDark ? "bg-slate-900 text-white" : ""}>🟢 Completed</option>
          </select>
        </div>

        {/* Notes / Details */}
        <div>
          <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1 ${labelColor}`}>
            <AlignLeft className="h-3.5 w-3.5 text-gray-400" />
            Notes & Context
          </label>
          <input
            id="editor-input-notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Avoid distractions, ask teammate for help"
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${inputStyle}`}
          />
        </div>
      </div>

      {/* Button Row */}
      <div className="flex justify-end gap-2 pt-2">
        {taskToEdit && (
          <button
            id="btn-cancel-edit"
            type="button"
            onClick={onCancel}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
              isDark 
                ? "bg-slate-800 text-slate-300 hover:bg-slate-700" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Cancel
          </button>
        )}
        <button
          id="btn-submit-task"
          type="submit"
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors cursor-pointer ${
            themeConfig?.buttonPrimary || "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {taskToEdit ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {taskToEdit ? "Update Task" : "Add Task"}
        </button>
      </div>
    </form>
  );
};
