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
  const [error, setError] = useState<string | null>(null);
  const [nav, setNav] = useState<NavState>({ page: 'dashboard' });

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        setUser(session?.user ?? null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to initialize authentication';
        console.error('Auth error:', errorMsg);
        setError(errorMsg);
      } finally {
        setAuthLoading(false);
      }
    };

    initAuth();

    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });
      return () => subscription?.unsubscribe();
    } catch (err) {
      console.error('Auth subscription error:', err);
    }
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="mx-auto max-w-md p-6 bg-white rounded-lg shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">!</div>
            <h2 className="font-semibold text-slate-900">Configuration Error</h2>
          </div>
          <p className="text-slate-600 text-sm mb-4">{error}</p>
          <p className="text-slate-500 text-xs">Please ensure your Supabase credentials are configured in environment variables.</p>
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
