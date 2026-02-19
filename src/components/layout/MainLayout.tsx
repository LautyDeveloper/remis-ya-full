import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TelefonistaSelector } from '@/components/shared/TelefonistaSelector';
import { ReservasAlert } from '@/components/shared/ReservasAlert';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-6 py-3 flex items-center justify-between gap-4">
          <div className="lg:hidden w-10" /> {/* Spacer for mobile menu button */}
          <TelefonistaSelector />
          <div className="flex items-center gap-4 ml-auto">
            <ReservasAlert />
            {user && (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">{user.name}</span>
                <Button variant="ghost" size="icon" onClick={logout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
