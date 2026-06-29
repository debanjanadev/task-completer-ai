export type Priority = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'Not Started' | 'In Progress' | 'Completed';
export type CoachTone = 'Encouraging & Supportive' | 'Strict & No-Nonsense';

export interface NumericalContext {
  quantity?: string;      // e.g., "500 words", "2 essays"
  repetitions?: string;   // e.g., "12 reps", "15 times"
  sets?: string;          // e.g., "3 sets", "4 circuits"
  duration?: string;      // e.g., "2 hours", "45 mins"
  pages?: string;         // e.g., "25 pages", "pages 40-55"
  chapters?: string;      // e.g., "Chapter 4", "Chapters 1-3"
  sessions?: string;      // e.g., "2 sessions", "1 session"
}

export interface Task {
  id: string;
  title: string;
  deadline: string;
  priority: Priority;
  status: TaskStatus;
  notes?: string;
  estimatedUrgency?: string; // High/Medium/Low or text description
  numericalContext?: NumericalContext;
  createdAt: string;
}

export interface ScheduleItem {
  timeWindow: string;
  taskTitle: string;
  focusTip: string;
}

export interface ActionBlueprint {
  coachingMessage: string;
  urgencyAnalysis: string;
  conflictsDetected: string[];
  schedule: ScheduleItem[];
  recommendations: string[];
}

export interface GeneratePlanRequest {
  rawText: string;
  tone: CoachTone;
  existingTasks: Task[];
}

export interface GeneratePlanResponse {
  tasks: Task[];
  blueprint: ActionBlueprint;
}
