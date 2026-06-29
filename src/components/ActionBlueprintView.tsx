import React from "react";
import { ActionBlueprint, CoachTone } from "../types";
import { 
  Sparkles, 
  Clock, 
  Flame, 
  Lightbulb, 
  ShieldAlert, 
  User, 
  CheckSquare,
  Bookmark,
  Coffee,
  HelpCircle
} from "lucide-react";

interface ActionBlueprintViewProps {
  blueprint: ActionBlueprint;
  tone: CoachTone;
  onClearBlueprint: () => void;
  themeConfig?: any;
}

export const ActionBlueprintView: React.FC<ActionBlueprintViewProps> = ({
  blueprint,
  tone,
  onClearBlueprint,
  themeConfig,
}) => {
  const isBootcamp = tone.includes("Strict");
  const isDark = themeConfig?.isDark;
  const isCozy = themeConfig?.accentText?.includes("orange") || themeConfig?.accentText?.includes("emerald");

  const textHeading = isDark ? "text-slate-100" : (isCozy ? "text-stone-800" : "text-gray-900");
  const textMuted = isDark ? "text-slate-400" : (isCozy ? "text-stone-500" : "text-gray-500");
  const dividerColor = isDark ? "border-slate-800" : "border-gray-100";
  const cardBgColor = isDark ? "bg-[#131B2E]" : "bg-white";
  const cardBorderColor = isDark ? "border-slate-800" : (isCozy ? "border-[#E8E2D5]" : "border-gray-200");

  // Timeline variables
  const timelineLineColor = isDark ? "border-slate-800" : (isCozy ? "border-stone-200" : "border-indigo-100");
  const timelineDotColor = isDark ? "border-purple-500 bg-[#0A0E1A]" : (isCozy ? "border-orange-500 bg-white" : "border-indigo-600 bg-white");
  const timelineCardBg = isDark ? "bg-[#1E293B]" : "bg-white";
  const timelineCardBorder = isDark ? "border-slate-800 hover:border-purple-500/50" : (isCozy ? "border-stone-150 hover:border-orange-200" : "border-gray-100 hover:border-indigo-200");
  const timelineBadge = isDark ? "bg-purple-950/60 text-purple-300" : (isCozy ? "bg-orange-50 text-orange-700" : "bg-indigo-50 text-indigo-700");

  // Recommendation variables
  const recBgColor = isDark ? "bg-[#131B2E]" : "bg-white";
  const recItemStyle = isDark ? "bg-[#1E293B] text-slate-300 border-slate-800" : (isCozy ? "bg-stone-50 text-stone-700 border-stone-100" : "bg-gray-50 text-gray-700 border-gray-100");

  const [showResetConfirm, setShowResetConfirm] = React.useState(false);

  return (
    <div id="ai-blueprint-container" className="space-y-6">
      {/* Dynamic Header Badge */}
      <div className={`flex items-center justify-between border-b pb-4 ${dividerColor}`}>
        <div className="flex items-center gap-2">
          <div className={`rounded-lg p-2 ${isDark ? "bg-purple-950 text-purple-400" : (isCozy ? "bg-orange-50 text-orange-600" : "bg-indigo-100 text-indigo-700")}`}>
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h2 className={`text-xl font-bold tracking-tight ${textHeading}`}>
              Active Action Blueprint
            </h2>
            <p className={`text-xs ${textMuted}`}>
              Formulated by Task Completer AI using Gemini
            </p>
          </div>
        </div>

        {!showResetConfirm ? (
          <button
            id="btn-clear-blueprint"
            onClick={() => setShowResetConfirm(true)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? "text-slate-400 hover:text-red-400 hover:bg-slate-800/40" : "text-gray-400 hover:text-red-600 hover:bg-red-50"
            }`}
          >
            Reset Blueprint
          </button>
        ) : (
          <div className="flex items-center gap-1.5 animate-fade-in">
            <span className="text-[11px] font-bold text-red-500 mr-1">Are you sure?</span>
            <button
              id="btn-confirm-reset-blueprint"
              onClick={() => {
                setShowResetConfirm(false);
                onClearBlueprint();
              }}
              className="text-[11px] font-bold px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md cursor-pointer transition-colors"
            >
              Yes, Reset
            </button>
            <button
              id="btn-cancel-reset-blueprint"
              onClick={() => setShowResetConfirm(false)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* 1. Overall Urgency Analysis */}
      <div id="ai-urgency-analysis" className={`rounded-xl border p-5 ${
        isDark 
          ? "border-blue-950 bg-blue-950/20" 
          : (isCozy ? "border-orange-150 bg-orange-50/20" : "border-blue-100 bg-blue-50/30")
      }`}>
        <div className="flex items-start gap-3">
          <div className={`rounded-full p-1.5 text-white shrink-0 ${isDark ? "bg-blue-600" : (isCozy ? "bg-orange-500" : "bg-blue-500")}`}>
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-1 ${
              isDark ? "text-blue-300" : (isCozy ? "text-orange-900" : "text-blue-900")
            }`}>
              Cognitive Urgency & Situation Analysis
            </h3>
            <p className={`text-sm font-normal leading-relaxed ${
              isDark ? "text-blue-100" : (isCozy ? "text-stone-700" : "text-blue-950")
            }`}>
              {blueprint.urgencyAnalysis}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Conflicts Detected Section (Conditional) */}
      {blueprint.conflictsDetected && blueprint.conflictsDetected.length > 0 && (
        <div id="ai-conflicts-container" className={`rounded-xl border p-5 ${
          isDark ? "border-red-950 bg-red-950/20" : "border-red-200 bg-red-50/50"
        }`}>
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-red-600 p-1.5 text-white shrink-0">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div className="w-full">
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-2 ${
                isDark ? "text-red-300" : "text-red-900"
              }`}>
                Potential Scheduling Conflicts & Procrastination Pitfalls
              </h3>
              <ul className="space-y-1.5">
                {blueprint.conflictsDetected.map((conflict, idx) => (
                  <li key={idx} className={`text-xs font-medium flex items-start gap-1.5 ${
                    isDark ? "text-red-200" : "text-red-950"
                  }`}>
                    <span className="text-red-500 font-bold shrink-0">•</span>
                    <span>{conflict}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 3. The Hourly / Sequence Schedule Block */}
      <div id="ai-schedule-container" className="space-y-3">
        <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${textHeading}`}>
          <Bookmark className={`h-4 w-4 ${isDark ? "text-purple-400" : (isCozy ? "text-orange-500" : "text-indigo-500")}`} />
          Recommended Order of Operations
        </h3>

        <div className={`relative border-l-2 ml-3.5 pl-5 space-y-4 ${timelineLineColor}`}>
          {blueprint.schedule && blueprint.schedule.length > 0 ? (
            blueprint.schedule.map((item, index) => (
              <div key={index} className="relative group">
                {/* Timeline Dot */}
                <div className={`absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 transition-all group-hover:scale-125 ${timelineDotColor}`} />
                
                <div className={`rounded-lg border p-4 transition-all duration-200 ${timelineCardBg} ${timelineCardBorder} shadow-xs`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${timelineBadge}`}>
                      {item.timeWindow}
                    </span>
                  </div>
                  <h4 className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-gray-900"}`}>
                    {item.taskTitle}
                  </h4>
                  <p className={`text-xs mt-1 leading-relaxed font-normal ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                    <span className={`font-semibold ${isDark ? "text-slate-300" : "text-gray-700"}`}>Focus Tip:</span> {item.focusTip}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-gray-500 italic pl-2">No schedule blocks compiled.</div>
          )}
        </div>
      </div>

      {/* 4. Actionable Productivity Recommendations */}
      <div id="ai-recommendations-container" className={`rounded-xl border p-5 shadow-xs space-y-3 ${recBgColor} ${cardBorderColor}`}>
        <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${textHeading}`}>
          <Lightbulb className="h-4 w-4 text-amber-500" />
          Personalized Recommendations
        </h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {blueprint.recommendations && blueprint.recommendations.map((recommendation, idx) => (
            <li 
              key={idx} 
              className={`flex items-start gap-2.5 rounded-lg p-3 text-xs border ${recItemStyle}`}
            >
              <div className="rounded-full bg-amber-100 text-amber-700 p-1 shrink-0 mt-0.5">
                <Coffee className="h-3 w-3" />
              </div>
              <span className="font-normal leading-relaxed">{recommendation}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 5. The Motivational Coach Speech Banner (dynamic color & font size depending on mode) */}
      <div 
        id="ai-coaching-box" 
        className={`rounded-2xl border-2 p-6 transition-all relative overflow-hidden ${
          isBootcamp 
            ? (isDark ? "bg-red-950/20 border-red-900/40 text-red-200" : "bg-red-50/90 border-red-200 text-red-950") 
            : (isDark ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-200" : "bg-emerald-50/80 border-emerald-200 text-emerald-950")
        }`}
      >
        {/* Large backdrops indicator */}
        <div className="absolute right-4 bottom-2 opacity-5 pointer-events-none select-none">
          <Flame className="h-32 w-32" />
        </div>

        <div className="flex items-start gap-4">
          <div className={`rounded-full p-2 text-white shrink-0 ${isBootcamp ? "bg-red-600" : "bg-emerald-600"}`}>
            <User className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-1.5">
              Coaching Feed • {tone}
            </h4>
            <blockquote className="text-base font-semibold italic leading-relaxed tracking-tight">
              "{blueprint.coachingMessage}"
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  );
};
