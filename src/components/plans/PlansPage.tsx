import { useEffect, useState } from 'react';
import { Plus, BookOpen, Trash2, ChevronRight, Calendar, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { StudyPlan } from '../../types';
import type { User } from '@supabase/supabase-js';
import CreatePlanModal from './CreatePlanModal';

interface PlansPageProps {
  user: User;
  onViewSubjects: (planId: string) => void;
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-blue-100 text-blue-700',
  paused: 'bg-amber-100 text-amber-700',
};

export default function PlansPage({ user, onViewSubjects }: PlansPageProps) {
  const [plans, setPlans] = useState<(StudyPlan & { subject_count: number; task_count: number; completed_tasks: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    const { data: plansData } = await supabase
      .from('study_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!plansData) { setLoading(false); return; }

    const enriched = await Promise.all(
      plansData.map(async plan => {
        const { data: subjects } = await supabase
          .from('subjects')
          .select('id')
          .eq('plan_id', plan.id);

        const subjectIds = subjects?.map(s => s.id) || [];
        let taskCount = 0;
        let completedTasks = 0;

        if (subjectIds.length > 0) {
          const { data: tasks } = await supabase
            .from('tasks')
            .select('id, is_completed')
            .in('subject_id', subjectIds);

          taskCount = tasks?.length || 0;
          completedTasks = tasks?.filter(t => t.is_completed).length || 0;
        }

        return {
          ...plan,
          subject_count: subjects?.length || 0,
          task_count: taskCount,
          completed_tasks: completedTasks,
        };
      })
    );

    setPlans(enriched);
    setLoading(false);
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('Delete this study plan and all its data? This cannot be undone.')) return;
    await supabase.from('study_plans').delete().eq('id', planId);
    setPlans(prev => prev.filter(p => p.id !== planId));
  };

  const handleStatusChange = async (planId: string, status: string) => {
    await supabase.from('study_plans').update({ status, updated_at: new Date().toISOString() }).eq('id', planId);
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, status: status as StudyPlan['status'] } : p));
  };

  const handleCreated = (planId: string) => {
    setShowCreate(false);
    onViewSubjects(planId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-slate-500 text-sm">
            {plans.length} {plans.length === 1 ? 'plan' : 'plans'} total
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          New Plan
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen size={26} className="text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No study plans yet</h3>
          <p className="text-slate-500 text-sm mb-5">Create your first AI-powered study plan to get started</p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Create Study Plan
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {plans.map(plan => {
            const progress = plan.task_count > 0
              ? Math.round((plan.completed_tasks / plan.task_count) * 100)
              : 0;
            const createdDate = new Date(plan.created_at).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            });

            return (
              <div
                key={plan.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <h3 className="text-base font-bold text-slate-900 truncate">{plan.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_STYLES[plan.status]}`}>
                          {plan.status}
                        </span>
                      </div>
                      {plan.description && (
                        <p className="text-sm text-slate-500 mb-3 line-clamp-2">{plan.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <BookOpen size={12} />
                          {plan.subject_count} {plan.subject_count === 1 ? 'subject' : 'subjects'}
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          {plan.completed_tasks}/{plan.task_count} tasks
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {createdDate}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <select
                        value={plan.status}
                        onChange={e => handleStatusChange(plan.id, e.target.value)}
                        onClick={e => e.stopPropagation()}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      >
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="completed">Completed</option>
                      </select>
                      <button
                        onClick={() => handleDelete(plan.id)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                      <button
                        onClick={() => onViewSubjects(plan.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <ChevronRight size={17} />
                      </button>
                    </div>
                  </div>

                  {plan.task_count > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-slate-400">Progress</span>
                        <span className="text-xs font-semibold text-slate-600">{progress}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {plan.subject_count === 0
                      ? 'Add subjects to generate your AI study schedule'
                      : `${plan.task_count} study tasks generated by AI`}
                  </span>
                  <button
                    onClick={() => onViewSubjects(plan.id)}
                    className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Manage subjects
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreatePlanModal user={user} onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}
