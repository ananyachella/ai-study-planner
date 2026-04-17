import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, ChevronLeft, Filter, Clock, Calendar, BookOpen } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Task, Subject } from '../../types';
import type { User } from '@supabase/supabase-js';

interface TasksPageProps {
  user: User;
  subjectId?: string;
  onBack?: () => void;
}

type FilterType = 'all' | 'today' | 'pending' | 'completed';
type TaskTypeFilter = 'all' | 'study' | 'review' | 'practice' | 'assessment';

const TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  study: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Study' },
  review: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Review' },
  practice: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Practice' },
  assessment: { bg: 'bg-red-100', text: 'text-red-700', label: 'Assessment' },
};

const COLOR_DOT: Record<string, string> = {
  blue: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  pink: 'bg-pink-500',
  cyan: 'bg-cyan-500',
  orange: 'bg-orange-500',
  teal: 'bg-teal-500',
};

interface TaskWithSubject extends Task {
  subject?: Subject;
}

export default function TasksPage({ user, subjectId, onBack }: TasksPageProps) {
  const [tasks, setTasks] = useState<TaskWithSubject[]>([]);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [typeFilter, setTypeFilter] = useState<TaskTypeFilter>('all');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchTasks();
  }, [subjectId]);

  const fetchTasks = async () => {
    setLoading(true);

    if (subjectId) {
      const [subjectRes, tasksRes] = await Promise.all([
        supabase.from('subjects').select('*').eq('id', subjectId).maybeSingle(),
        supabase.from('tasks').select('*').eq('subject_id', subjectId).order('scheduled_date'),
      ]);
      setSubject(subjectRes.data);
      setTasks(tasksRes.data || []);
    } else {
      const { data } = await supabase
        .from('tasks')
        .select('*, subject:subjects(name, color)')
        .eq('user_id', user.id)
        .order('scheduled_date');
      setTasks((data || []) as TaskWithSubject[]);
    }

    setLoading(false);
  };

  const toggleTask = async (task: TaskWithSubject) => {
    const newCompleted = !task.is_completed;
    await supabase
      .from('tasks')
      .update({
        is_completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null,
      })
      .eq('id', task.id);

    setTasks(prev => prev.map(t =>
      t.id === task.id ? { ...t, is_completed: newCompleted } : t
    ));
  };

  const filteredTasks = tasks.filter(task => {
    const statusMatch =
      filter === 'all' ? true :
      filter === 'today' ? task.scheduled_date === today :
      filter === 'pending' ? !task.is_completed :
      task.is_completed;

    const typeMatch = typeFilter === 'all' ? true : task.task_type === typeFilter;

    return statusMatch && typeMatch;
  });

  const grouped = filteredTasks.reduce<Record<string, TaskWithSubject[]>>((acc, task) => {
    const date = task.scheduled_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(task);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  const totalCount = tasks.length;
  const completedCount = tasks.filter(t => t.is_completed).length;
  const todayCount = tasks.filter(t => t.scheduled_date === today).length;
  const todayCompleted = tasks.filter(t => t.scheduled_date === today && t.is_completed).length;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    if (dateStr === today) return 'Today';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const isPast = (dateStr: string) => dateStr < today;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm mb-5 transition-colors"
        >
          <ChevronLeft size={16} />
          Back to subjects
        </button>
      )}

      {subject && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-3 h-3 rounded-full ${COLOR_DOT[subject.color] || COLOR_DOT.blue}`} />
            <h2 className="font-bold text-slate-900">{subject.name}</h2>
          </div>
          <p className="text-sm text-slate-500 mb-3">{subject.goal}</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${COLOR_DOT[subject.color] || COLOR_DOT.blue}`}
                style={{ width: `${totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-600 shrink-0">
              {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">{completedCount} of {totalCount} tasks completed</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-xl font-bold text-slate-900">{totalCount}</p>
            <p className="text-xs text-slate-500">Total Tasks</p>
          </div>
          <div className="text-center p-3 bg-emerald-50 rounded-xl">
            <p className="text-xl font-bold text-emerald-700">{completedCount}</p>
            <p className="text-xs text-emerald-600">Completed</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-xl">
            <p className="text-xl font-bold text-blue-700">{todayCompleted}/{todayCount}</p>
            <p className="text-xs text-blue-600">Today</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-slate-400 shrink-0" />
          {(['all', 'today', 'pending', 'completed'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                filter === f ? 'bg-slate-900 text-white' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
          <span className="text-slate-300 text-xs">|</span>
          {(['all', 'study', 'review', 'practice', 'assessment'] as TaskTypeFilter[]).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                typeFilter === t
                  ? t === 'all' ? 'bg-slate-900 text-white' : `${TYPE_STYLES[t]?.bg || 'bg-gray-100'} ${TYPE_STYLES[t]?.text || 'text-slate-600'}`
                  : 'bg-gray-100 text-slate-500 hover:bg-gray-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <BookOpen size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No tasks match your filters</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(date => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className={isPast(date) && date !== today ? 'text-slate-300' : 'text-blue-500'} />
                  <h3 className={`text-sm font-bold ${
                    date === today ? 'text-blue-600' :
                    isPast(date) ? 'text-slate-400' : 'text-slate-700'
                  }`}>
                    {formatDate(date)}
                  </h3>
                </div>
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-slate-400">
                  {grouped[date].filter(t => t.is_completed).length}/{grouped[date].length}
                </span>
              </div>

              <div className="space-y-2">
                {grouped[date].map(task => {
                  const typeStyle = TYPE_STYLES[task.task_type] || TYPE_STYLES.study;
                  const subjectColor = task.subject?.color || 'blue';
                  const isExpanded = expandedTask === task.id;

                  return (
                    <div
                      key={task.id}
                      className={`bg-white rounded-xl border transition-all ${
                        task.is_completed ? 'border-gray-100 opacity-70' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-3 p-4">
                        <button
                          onClick={() => toggleTask(task)}
                          className="mt-0.5 shrink-0 transition-transform hover:scale-110"
                        >
                          {task.is_completed ? (
                            <CheckCircle2 size={20} className="text-emerald-500" />
                          ) : (
                            <Circle size={20} className="text-gray-300 hover:text-blue-400 transition-colors" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <button
                              onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                              className="text-left flex-1"
                            >
                              <p className={`text-sm font-medium leading-snug ${
                                task.is_completed ? 'line-through text-slate-400' : 'text-slate-800'
                              }`}>
                                {task.title}
                              </p>
                            </button>
                          </div>

                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeStyle.bg} ${typeStyle.text}`}>
                              {typeStyle.label}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Clock size={11} />
                              {task.duration_minutes}m
                            </span>
                            {task.subject && (
                              <span className="flex items-center gap-1 text-xs text-slate-400">
                                <span className={`w-2 h-2 rounded-full ${COLOR_DOT[subjectColor] || COLOR_DOT.blue}`} />
                                {task.subject.name}
                              </span>
                            )}
                          </div>

                          {isExpanded && task.description && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs text-slate-600 leading-relaxed">{task.description}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
