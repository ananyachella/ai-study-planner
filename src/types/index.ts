export type TaskType = 'study' | 'review' | 'practice' | 'assessment';
export type Priority = 'low' | 'medium' | 'high';
export type PlanStatus = 'active' | 'completed' | 'paused';
export type SubjectColor = 'blue' | 'emerald' | 'amber' | 'red' | 'pink' | 'cyan' | 'orange' | 'teal';

export interface StudyPlan {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: PlanStatus;
  created_at: string;
  updated_at: string;
  subjects?: Subject[];
}

export interface Subject {
  id: string;
  plan_id: string;
  user_id: string;
  name: string;
  goal: string;
  deadline: string;
  priority: Priority;
  hours_per_day: number;
  color: SubjectColor;
  total_hours: number;
  completed_hours: number;
  created_at: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  subject_id: string;
  user_id: string;
  title: string;
  description: string;
  scheduled_date: string;
  duration_minutes: number;
  is_completed: boolean;
  completed_at: string | null;
  task_type: TaskType;
  created_at: string;
  subject?: Subject;
}

export interface TaskInput {
  title: string;
  description: string;
  scheduled_date: string;
  duration_minutes: number;
  task_type: TaskType;
}

export type Page = 'dashboard' | 'plans' | 'subjects' | 'tasks' | 'progress';

export interface NavState {
  page: Page;
  planId?: string;
  subjectId?: string;
}
