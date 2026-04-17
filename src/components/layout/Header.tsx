import { User } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  user: { email?: string; user_metadata?: { full_name?: string } } | null;
  action?: React.ReactNode;
}

export default function Header({ title, subtitle, user, action }: HeaderProps) {
  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        {action}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            {initials ? (
              <span className="text-white text-xs font-bold">{initials}</span>
            ) : (
              <User size={14} className="text-white" />
            )}
          </div>
          <span className="text-sm font-medium text-slate-700 hidden sm:block">{name}</span>
        </div>
      </div>
    </header>
  );
}
