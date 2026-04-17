import { useEffect, useState } from 'react';
import { Plus, Sparkles, Trash2, Target, Clock, ChevronLeft, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Subject, StudyPlan } from '../../types';
import type { User } from '@supabase/supabase-js';
import AddSubjectModal from './AddSubjectModal';

interface SubjectsPageProps {
  user: User;
  planId: string;
  onBack: () => void;
  onViewTasks: (subjectId: string) => void;
}

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

const COLOR_LIGHT: Record<string, string> = {
  blue: 'bg-blue-50 border-blue-100',
  emerald: 'bg-emerald-50 border-emerald-100',
  amber: 'bg-amber-50 border-amber-100',
  red: 'bg-red-50 border-red-100',
  pink: 'bg-pink-50 border-pink-100',
  cyan: 'bg-cyan-50 border-cyan-100',
  orange: 'bg-orange-50 border-orange-100',
  teal: 'bg-teal-50 border-teal-100',
};

const PRIORITY_STYLES: Record<string, string> = {
  high: 'text-red-600 bg-red-50',
  medium: 'text-amber-600 bg-amber-50',
  low: 'text-emerald-600 bg-emerald-50',
};

export default function SubjectsPage({ user, planId, onBack, onViewTasks }: SubjectsPageProps) {
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [subjects, setSubjects] = useState<(Subject & { task_count: number; completed_tasks: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    fetchData();
  }, [planId]);

  const fetchData = async () => {
    const [planRes, subjectsRes] = await Promise.all([
      supabase.from('study_plans').select('*').eq('id', planId).maybeSingle(),
      supabase.from('subjects').select('*').eq('plan_id', planId).order('deadline'),
    ]);

    setPlan(planRes.data);

    const subjectList = subjectsRes.data || [];
    const enriched = await Promise.all(
      subjectList.map(async subject => {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id, is_completed')
          .eq('subject_id', subject.id);

        const taskCount = tasks?.length || 0;
        const completedTasks = tasks?.filter(t => t.is_completed).length || 0;

        await supabase
          .from('subjects')
          .update({ completed_hours: Math.round((completedTasks / Math.max(1, taskCount)) * subject.total_hours * 10) / 10 })
          .eq('id', subject.id);

        return {
          ...subject,
          task_count: taskCount,
          completed_tasks: completedTasks,
        };
      })
    );

    setSubjects(enriched);
    setLoading(false);
  };

  const handleDelete = async (subjectId: string) => {
    if (!confirm('Delete this subject and all its tasks? This cannot be undone.')) return;
    await supabase.from('subjects').delete().eq('id', subjectId);
    setSubjects(prev => prev.filter(s => s.id !== subjectId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalTasks = subjects.reduce((sum, s) => sum + s.task_count, 0);
  const completedTasks = subjects.reduce((sum, s) => sum + s.completed_tasks, 0);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-gray-100 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-slate-900 truncate">{plan?.title}</h2>
          <p className="text-sm text-slate-500">
            {subjects.length} {subjects.length === 1 ? 'subject' : 'subjects'} &bull; {completedTasks}/{totalTasks} tasks done
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shrink-0"
        >
          <Plus size={15} />
          <Sparkles size={13} />
          Add Subject
        </button>
      </div>

      {subjects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles size={26} className="text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No subjects yet</h3>
          <p className="text-slate-500 text-sm mb-5 max-w-sm mx-auto">
            Add a subject with your goal and deadline. AI will instantly generate a personalized study schedule.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
          >
            <Sparkles size={15} />
            Add Subject & Generate Plan
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {subjects.map(subject => {
            const progress = subject.task_count > 0
              ? Math.round((subject.completed_tasks / subject.task_count) * 100)
              : 0;
            const deadline = new Date(subject.deadline);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            const deadlineStr = deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const colorDot = COLOR_DOT[subject.color] || COLOR_DOT.blue;
            const colorLight = COLOR_LIGHT[subject.color] || COLOR_LIGHT.blue;
            const isPastDue = daysLeft < 0;

            return (
              <div
                key={subject.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className={`h-1.5 ${colorDot}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${colorDot}`} />
                      <h3 className="font-bold text-slate-900 truncate">{subject.name}</h3>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[subject.priority]}`}>
                        {subject.priority}
                      </span>
                      <button
                        onClick={() => handleDelete(subject.id)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">{subject.goal}</p>

                  <div className={`rounded-xl p-3 border ${colorLight} mb-4`}>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-lg font-bold text-slate-900">{subject.task_count}</p>
                        <p className="text-xs text-slate-500">Tasks</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-slate-900">{subject.hours_per_day}h</p>
                        <p className="text-xs text-slate-500">Per Day</p>
                      </div>
                      <div>
                        <p className={`text-lg font-bold ${isPastDue ? 'text-red-600' : daysLeft <= 3 ? 'text-amber-600' : 'text-slate-900'}`}>
                          {isPastDue ? 'Overdue' : `${daysLeft}d`}
                        </p>
                        <p className="text-xs text-slate-500">Remaining</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                      <span>{subject.completed_tasks} of {subject.task_count} tasks</span>
                      <span className="font-semibold">{progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${colorDot}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {deadlineStr}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {subject.total_hours}h total
                      </span>
                    </div>
                    <button
                      onClick={() => onViewTasks(subject.id)}
                      className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline"
                    >
                      <Target size={12} />
                      View Tasks
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <AddSubjectModal
          user={user}
          planId={planId}
          onClose={() => setShowAdd(false)}
          onCreated={() => { setShowAdd(false); fetchData(); }}
        />
      )}
    </div>
  );
}
