import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { generateStudyTasks, calculateTotalHours } from '../../lib/studyPlanGenerator';
import type { User } from '@supabase/supabase-js';
import type { SubjectColor, Priority } from '../../types';

interface AddSubjectModalProps {
  user: User;
  planId: string;
  onClose: () => void;
  onCreated: () => void;
}

const COLORS: { value: SubjectColor; label: string; class: string }[] = [
  { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { value: 'emerald', label: 'Emerald', class: 'bg-emerald-500' },
  { value: 'amber', label: 'Amber', class: 'bg-amber-500' },
  { value: 'red', label: 'Red', class: 'bg-red-500' },
  { value: 'pink', label: 'Pink', class: 'bg-pink-500' },
  { value: 'cyan', label: 'Cyan', class: 'bg-cyan-500' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
  { value: 'teal', label: 'Teal', class: 'bg-teal-500' },
];

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Low Priority' },
  { value: 'medium', label: 'Medium Priority' },
  { value: 'high', label: 'High Priority' },
];

export default function AddSubjectModal({ user, planId, onClose, onCreated }: AddSubjectModalProps) {
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];
  const defaultDeadline = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [deadline, setDeadline] = useState(defaultDeadline);
  const [priority, setPriority] = useState<Priority>('medium');
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [color, setColor] = useState<SubjectColor>('blue');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const daysUntilDeadline = Math.max(
    1,
    Math.ceil((new Date(deadline).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  );
  const estimatedTotalHours = daysUntilDeadline * hoursPerDay;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const subjectData = {
      plan_id: planId,
      user_id: user.id,
      name: name.trim(),
      goal: goal.trim(),
      deadline,
      priority,
      hours_per_day: hoursPerDay,
      color,
      total_hours: 0,
      completed_hours: 0,
    };

    const { data: newSubject, error: subjectError } = await supabase
      .from('subjects')
      .insert(subjectData)
      .select()
      .single();

    if (subjectError || !newSubject) {
      setError(subjectError?.message || 'Failed to create subject');
      setLoading(false);
      return;
    }

    const taskInputs = generateStudyTasks(newSubject);
    const totalHours = calculateTotalHours(newSubject);

    const tasksToInsert = taskInputs.map(t => ({
      ...t,
      subject_id: newSubject.id,
      user_id: user.id,
    }));

    if (tasksToInsert.length > 0) {
      const { error: tasksError } = await supabase.from('tasks').insert(tasksToInsert);
      if (tasksError) {
        setError(tasksError.message);
        setLoading(false);
        return;
      }
    }

    await supabase
      .from('subjects')
      .update({ total_hours: totalHours })
      .eq('id', newSubject.id);

    onCreated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles size={18} className="text-blue-500" />
              Add Subject & Generate AI Plan
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">AI will create a personalized study schedule</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="e.g. Calculus, Machine Learning, History"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Learning Goal</label>
            <textarea
              value={goal}
              onChange={e => setGoal(e.target.value)}
              required
              rows={2}
              placeholder="What do you want to achieve? e.g. Master integration techniques and pass the final exam"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Deadline</label>
              <input
                type="date"
                value={deadline}
                min={minDate}
                onChange={e => setDeadline(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Hours / Day: <span className="text-blue-600 font-bold">{hoursPerDay}h</span>
              </label>
              <input
                type="range"
                min={0.5}
                max={8}
                step={0.5}
                value={hoursPerDay}
                onChange={e => setHoursPerDay(Number(e.target.value))}
                className="w-full mt-2 accent-blue-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                <span>0.5h</span>
                <span>8h</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
            <div className="flex gap-2">
              {PRIORITIES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPriority(value)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                    priority === value
                      ? value === 'high'
                        ? 'bg-red-50 border-red-300 text-red-700'
                        : value === 'medium'
                        ? 'bg-amber-50 border-amber-300 text-amber-700'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      : 'border-gray-200 text-slate-500 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(({ value, class: cls }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setColor(value)}
                  className={`w-7 h-7 rounded-full ${cls} transition-all ${
                    color === value ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-110'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <Sparkles size={15} className="text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-blue-800 mb-0.5">AI Plan Preview</p>
                <p className="text-xs text-blue-600">
                  {daysUntilDeadline} study days &bull; ~{estimatedTotalHours.toFixed(1)} total hours &bull; {daysUntilDeadline} daily tasks
                </p>
                <p className="text-xs text-blue-500 mt-1">
                  Phases: Foundation (15%) → Core Study (50%) → Practice (23%) → Review &amp; Assessment (12%)
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-lg border border-gray-200 text-slate-700 font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || !goal.trim()}
              className="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Generate AI Plan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
