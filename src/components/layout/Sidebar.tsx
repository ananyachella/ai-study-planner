import { Brain, LayoutDashboard, BookOpen, ListChecks, BarChart2, LogOut, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Page } from '../../types';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const NAV_ITEMS: { page: Page; icon: typeof LayoutDashboard; label: string }[] = [
  { page: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { page: 'plans', icon: BookOpen, label: 'Study Plans' },
  { page: 'tasks', icon: ListChecks, label: 'My Tasks' },
  { page: 'progress', icon: BarChart2, label: 'Progress' },
];

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <aside className="w-60 shrink-0 bg-slate-950 flex flex-col h-screen sticky top-0">
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center">
            <Brain size={19} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm tracking-tight">StudyAI</p>
            <p className="text-slate-500 text-xs">Smart Study Planner</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ page, icon: Icon, label }) => {
          const active = currentPage === page || (currentPage === 'subjects' && page === 'plans');
          return (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                active
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={17} />
              <span className="flex-1 text-left">{label}</span>
              {active && <ChevronRight size={14} className="text-blue-400" />}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <LogOut size={17} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
