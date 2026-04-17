import { useEffect, useState } from 'react';
import { BookOpen, CheckCircle2, Clock, Target, TrendingUp, Circle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Task, Subject } from '../../types';
import type { User } from '@supabase/supabase-js';

interface DashboardProps {
  user: User;
  onNavigate: (page: 'tasks' | 'plans') => void;
}

interface Stats {
  totalPlans: number;
  activePlans: number;
  totalTasks: number;
  completedTasks: number;
  todayTasks: Task[];
  upcomingDeadlines: Subject[];
}

const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-100 text-amber-700 border-amber-200',
  red: 'bg-red-100 text-red-700 border-red-200',
  pink: 'bg-pink-100 text-pink-700 border-pink-200',
  cyan: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  orange: 'bg-orange-100 text-orange-700 border-orange-200',
  teal: 'bg-teal-100 text-teal-700 border-teal-200',
};

const TYPE_STYLES: Record<string, string> = {
  study: 'bg-blue-50 text-blue-600',
  review: 'bg-amber-50 text-amber-600',
  practice: 'bg-emerald-50 text-emerald-600',
  assessment: 'bg-red-50 text-red-600',
};

export default function Dashboard({ user, onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<Stats>({
    totalPlans: 0,
    activePlans: 0,
    totalTasks: 0,
    completedTasks: 0,
    todayTasks: [],
    upcomingDeadlines: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const today = new Date().toISOString().split('T')[0];

    const [plansRes, tasksRes, todayRes, deadlinesRes] = await Promise.all([
      supabase.from('study_plans').select('id, status').eq('user_id', user.id),
      supabase.from('tasks').select('id, is_completed').eq('user_id', user.id),
      supabase
        .from('tasks')
        .select('*, subject:subjects(name, color)')
        .eq('user_id', user.id)
        .eq('scheduled_date', today)
        .order('task_type'),
      supabase
        .from('subjects')
        .select('*')
        .eq('user_id', user.id)
        .gte('deadline', today)
        .order('deadline')
        .limit(4),
    ]);

    const plans = plansRes.data || [];
    const tasks = tasksRes.data || [];

    setStats({
      totalPlans: plans.length,
      activePlans: plans.filter(p => p.status === 'active').length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.is_completed).length,
      todayTasks: (todayRes.data || []) as Task[],
      upcomingDeadlines: (deadlinesRes.data || []) as Subject[],
    });
    setLoading(false);
  };

  const toggleTask = async (task: Task) => {
    await supabase
      .from('tasks')
      .update({
        is_completed: !task.is_completed,
        completed_at: !task.is_completed ? new Date().toISOString() : null,
      })
      .eq('id', task.id);

    setStats(prev => ({
      ...prev,
      todayTasks: prev.todayTasks.map(t =>
        t.id === task.id ? { ...t, is_completed: !t.is_completed } : t
      ),
      completedTasks: !task.is_completed ? prev.completedTasks + 1 : prev.completedTasks - 1,
    }));
  };

  const completionRate = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  const greetingName = user.user_metadata?.full_name?.split(' ')[0]
    || user.email?.split('@')[0]
    || 'there';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Plans', value: stats.totalPlans, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Plans', value: stats.activePlans, icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Tasks Done', value: stats.completedTasks, icon: CheckCircle2, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Completion Rate', value: `${completionRate}%`, icon: TrendingUp, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  ];

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          {greeting}, {greetingName}!
        </h2>
        <p className="text-slate-500 mt-1">
          {stats.todayTasks.length > 0
            ? `You have ${stats.todayTasks.filter(t => !t.is_completed).length} tasks scheduled for today.`
            : 'No tasks scheduled for today. Create a study plan to get started!'}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={17} className="text-slate-400" />
              <h3 className="font-semibold text-slate-900">Today's Tasks</h3>
            </div>
            <span className="text-xs text-slate-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {stats.todayTasks.filter(t => t.is_completed).length}/{stats.todayTasks.length} done
            </span>
          </div>

          <div className="divide-y divide-gray-50">
            {stats.todayTasks.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-slate-400 text-sm">No tasks for today</p>
                <button
                  onClick={() => onNavigate('plans')}
                  className="mt-3 text-blue-600 text-sm font-medium hover:underline"
                >
                  Create a study plan →
                </button>
              </div>
            ) : (
              stats.todayTasks.slice(0, 5).map(task => (
                <div key={task.id} className="px-6 py-3.5 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                  <button onClick={() => toggleTask(task)} className="mt-0.5 shrink-0">
                    {task.is_completed ? (
                      <CheckCircle2 size={18} className="text-emerald-500" />
                    ) : (
                      <Circle size={18} className="text-gray-300 hover:text-blue-400 transition-colors" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${task.is_completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${TYPE_STYLES[task.task_type] || TYPE_STYLES.study}`}>
                        {task.task_type}
                      </span>
                      <span className="text-xs text-slate-400">{task.duration_minutes}m</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {stats.todayTasks.length > 5 && (
            <div className="px-6 py-3 border-t border-gray-100">
              <button onClick={() => onNavigate('tasks')} className="text-sm text-blue-600 font-medium hover:underline">
                View all {stats.todayTasks.length} tasks →
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Target size={17} className="text-slate-400" />
            <h3 className="font-semibold text-slate-900">Upcoming Deadlines</h3>
          </div>

          <div className="divide-y divide-gray-50">
            {stats.upcomingDeadlines.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-slate-400 text-sm">No upcoming deadlines</p>
                <button
                  onClick={() => onNavigate('plans')}
                  className="mt-3 text-blue-600 text-sm font-medium hover:underline"
                >
                  Add a subject →
                </button>
              </div>
            ) : (
              stats.upcomingDeadlines.map(subject => {
                const deadline = new Date(subject.deadline);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const progress = subject.total_hours > 0
                  ? Math.round((subject.completed_hours / subject.total_hours) * 100)
                  : 0;
                const colorClass = COLOR_MAP[subject.color] || COLOR_MAP.blue;

                return (
                  <div key={subject.id} className="px-6 py-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${colorClass}`}>
                          {subject.name}
                        </span>
                      </div>
                      <span className={`text-xs font-semibold ${daysLeft <= 3 ? 'text-red-500' : daysLeft <= 7 ? 'text-amber-500' : 'text-slate-400'}`}>
                        {daysLeft === 0 ? 'Due today' : daysLeft === 1 ? '1 day left' : `${daysLeft} days left`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2 truncate">{subject.goal}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 shrink-0">{progress}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {stats.totalTasks > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Overall Progress</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <span className="text-sm font-bold text-slate-700 shrink-0">{completionRate}%</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {stats.completedTasks} of {stats.totalTasks} total tasks completed
          </p>
        </div>
      )}
    </div>
  );
}
