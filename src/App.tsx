import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import AuthPage from './components/auth/AuthPage';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './components/dashboard/Dashboard';
import PlansPage from './components/plans/PlansPage';
import SubjectsPage from './components/subjects/SubjectsPage';
import TasksPage from './components/tasks/TasksPage';
import ProgressPage from './components/progress/ProgressPage';
import type { Page } from './types';

interface NavState {
  page: Page;
  planId?: string;
  subjectId?: string;
}

const PAGE_TITLES: Record<Page, { title: string; subtitle?: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Your study overview at a glance' },
  plans: { title: 'Study Plans', subtitle: 'Manage your AI-powered study plans' },
  subjects: { title: 'Subjects', subtitle: 'Subjects and AI-generated tasks' },
  tasks: { title: 'My Tasks', subtitle: 'Track and complete your study tasks' },
  progress: { title: 'Progress', subtitle: 'Monitor your learning journey' },
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [nav, setNav] = useState<NavState>({ page: 'dashboard' });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const navigate = (page: Page, planId?: string, subjectId?: string) => {
    setNav({ page, planId, subjectId });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const pageInfo = PAGE_TITLES[nav.page];

  const renderPage = () => {
    switch (nav.page) {
      case 'dashboard':
        return (
          <Dashboard
            user={user}
            onNavigate={(page: 'tasks' | 'plans') => navigate(page)}
          />
        );
      case 'plans':
        return (
          <PlansPage
            user={user}
            onViewSubjects={(planId: string) => navigate('subjects', planId)}
          />
        );
      case 'subjects':
        return (
          <SubjectsPage
            user={user}
            planId={nav.planId!}
            onBack={() => navigate('plans')}
            onViewTasks={(subjectId: string) => navigate('tasks', nav.planId, subjectId)}
          />
        );
      case 'tasks':
        return (
          <TasksPage
            user={user}
            subjectId={nav.subjectId}
            onBack={nav.subjectId ? () => navigate('subjects', nav.planId) : undefined}
          />
        );
      case 'progress':
        return <ProgressPage user={user} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        currentPage={nav.page}
        onNavigate={(page: Page) => navigate(page)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
          user={user}
        />

        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
