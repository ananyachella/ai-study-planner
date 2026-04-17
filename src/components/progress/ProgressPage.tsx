import { useEffect, useState } from 'react';
import { TrendingUp, Award, Flame, BookOpen } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Task } from '../../types';
import type { User } from '@supabase/supabase-js';

interface ProgressPageProps {
  user: User;
}

interface SubjectProgress {
  id: string;
  name: string;
  color: string;
  total_tasks: number;
  completed_tasks: number;
  total_hours: number;
}

const COLOR_BAR: Record<string, string> = {
  blue: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  pink: 'bg-pink-500',
  cyan: 'bg-cyan-500',
  orange: 'bg-orange-500',
  teal: 'bg-teal-500',
};

export default function ProgressPage({ user }: ProgressPageProps) {
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ day: string; completed: number; total: number }[]>([]);
  const [streak, setStreak] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    const [subjectsRes, allTasksRes] = await Promise.all([
      supabase.from('subjects').select('*').eq('user_id', user.id).order('deadline'),
      supabase.from('tasks').select('*').eq('user_id', user.id).order('scheduled_date'),
    ]);

    const subjects = subjectsRes.data || [];
    const allTasks: Task[] = allTasksRes.data || [];

    setTotalTasks(allTasks.length);
    setTotalCompleted(allTasks.filter(t => t.is_completed).length);

    const progress: SubjectProgress[] = subjects.map(subject => {
      const subjectTasks = allTasks.filter(t => t.subject_id === subject.id);
      return {
        id: subject.id,
        name: subject.name,
        color: subject.color,
        total_tasks: subjectTasks.length,
        completed_tasks: subjectTasks.filter(t => t.is_completed).length,
        total_hours: subject.total_hours,
      };
    });
    setSubjectProgress(progress);

    const days: { day: string; completed: number; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayTasks = allTasks.filter(t => t.scheduled_date === dateStr);
      days.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        completed: dayTasks.filter(t => t.is_completed).length,
        total: dayTasks.length,
      });
    }
    setWeeklyData(days);

    let currentStreak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayTasks = allTasks.filter(t => t.scheduled_date === dateStr);
      if (dayTasks.length > 0 && dayTasks.every(t => t.is_completed)) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }
    setStreak(currentStreak);

    setLoading(false);
  };

  const completionRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
  const maxWeeklyCompleted = Math.max(...weeklyData.map(d => d.total), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tasks Completed', value: totalCompleted, icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Completion Rate', value: `${completionRate}%`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Day Streak', value: `${streak}d`, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: 'Subjects', value: subjectProgress.length, icon: BookOpen, color: 'text-cyan-600', bg: 'bg-cyan-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-slate-900 mb-5">Weekly Activity</h3>
        <div className="flex items-end gap-3 h-32">
          {weeklyData.map(({ day, completed, total }) => {
            const heightPct = total > 0 ? (completed / maxWeeklyCompleted) * 100 : 0;
            const totalHeightPct = (total / maxWeeklyCompleted) * 100;
            const isToday = day === new Date().toLocaleDateString('en-US', { weekday: 'short' });

            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div className="relative w-full flex flex-col justify-end" style={{ height: '96px' }}>
                  {total > 0 && (
                    <div
                      className="absolute bottom-0 w-full bg-blue-100 rounded-t-lg"
                      style={{ height: `${totalHeightPct}%` }}
                    />
                  )}
                  {completed > 0 && (
                    <div
                      className="absolute bottom-0 w-full bg-blue-500 rounded-t-lg transition-all"
                      style={{ height: `${heightPct}%` }}
                    />
                  )}
                </div>
                <span className={`text-xs font-medium ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                  {day}
                </span>
                <span className="text-xs text-slate-400">{completed}</span>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-slate-400 mt-2">Blue bars show completed tasks; light blue shows scheduled tasks</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-slate-900 mb-5">Subject Progress</h3>
        {subjectProgress.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">No subjects yet. Create a study plan to get started.</p>
        ) : (
          <div className="space-y-4">
            {subjectProgress.map(subject => {
              const progress = subject.total_tasks > 0
                ? Math.round((subject.completed_tasks / subject.total_tasks) * 100)
                : 0;
              const colorBar = COLOR_BAR[subject.color] || COLOR_BAR.blue;

              return (
                <div key={subject.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${colorBar}`} />
                      <span className="text-sm font-medium text-slate-700">{subject.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">
                        {subject.completed_tasks}/{subject.total_tasks} tasks
                      </span>
                      <span className="text-sm font-bold text-slate-900 w-10 text-right">{progress}%</span>
                    </div>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${colorBar}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {totalCompleted > 0 && (
        <div className="bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Award size={22} />
            <h3 className="font-bold text-lg">Keep it up!</h3>
          </div>
          <p className="text-blue-100 text-sm">
            You've completed {totalCompleted} study tasks with a {completionRate}% completion rate.
            {streak > 0 && ` You're on a ${streak}-day streak!`}
            {' '}Stay consistent to reach your goals.
          </p>
        </div>
      )}
    </div>
  );
}
