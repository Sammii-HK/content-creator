'use client';

import React, { useState, createContext, useContext, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import {
  Home,
  Upload,
  Scissors,
  Palette,
  BarChart3,
  Brain,
  Sparkles,
  Settings,
  User,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  FileText,
  Video,
  TestTube,
} from 'lucide-react';

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

interface SidebarProviderProps {
  children: React.ReactNode;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed');
      return saved === 'true';
    }
    return false;
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', String(collapsed));
    }
  }, [collapsed]);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, mobileOpen, setMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: Home },
  { title: 'Upload', href: '/dashboard/upload', icon: Upload },
  { title: 'B-roll', href: '/dashboard/broll', icon: Video },
  { title: 'Generated', href: '/dashboard/content', icon: Scissors },
  { title: 'Templates', href: '/dashboard/templates/new', icon: FileText },
  { title: 'Test Templates', href: '/dashboard/templates/test', icon: TestTube },
  { title: 'AI Images', href: '/dashboard/create-images', icon: Palette },
  { title: 'AI Studio', href: '/dashboard/ai-studio', icon: Sparkles },
  { title: 'Personas', href: '/dashboard/personas', icon: Brain },
  { title: 'Analytics', href: '/dashboard/ai-usage', icon: BarChart3 },
];

const bottomNavItems: NavItem[] = [
  { title: 'Settings', href: '/dashboard/settings', icon: Settings },
  { title: 'Profile', href: '/dashboard/profile', icon: User },
];

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const NavLink: React.FC<{ item: NavItem }> = ({ item }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

    return (
      <Link href={item.href} onClick={() => setMobileOpen(false)}>
        <div
          className={cn(
            'group relative flex items-center gap-4 rounded-xl px-4 py-3.5 text-base font-semibold transition-all duration-200',
            isActive
              ? 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90'
              : 'text-foreground hover:bg-background hover:text-foreground',
            collapsed && 'justify-center px-3'
          )}
          title={collapsed ? item.title : undefined}
        >
          <item.icon className={cn('h-6 w-6 flex-shrink-0', collapsed && 'h-7 w-7')} />
          {!collapsed && (
            <>
              <span className="truncate">{item.title}</span>
              {item.badge && (
                <span className="ml-auto rounded-full bg-primary-foreground/20 px-3 py-1 text-sm font-medium text-primary-foreground">
                  {item.badge}
                </span>
              )}
            </>
          )}
          {/* Tooltip for collapsed state */}
          {collapsed && (
            <div className="pointer-events-none absolute left-full ml-3 z-50 hidden rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background opacity-0 shadow-xl transition-opacity group-hover:opacity-100 lg:block whitespace-nowrap">
              {item.title}
            </div>
          )}
        </div>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-border bg-background-secondary transition-all duration-300 ease-in-out lg:relative lg:z-40 shadow-xl backdrop-blur-xl',
          collapsed ? 'w-20' : 'w-72',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          className
        )}
        style={{
          backgroundColor: 'var(--background-secondary)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Header */}
        <div className="flex h-20 items-center justify-between border-b border-border bg-background-secondary px-6">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-foreground">Content Studio</span>
            </Link>
          )}

          {/* Desktop collapse button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex h-10 w-10"
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>

          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden h-10 w-10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex flex-1 flex-col gap-3 p-6 overflow-y-auto bg-background-secondary">
          <nav className="flex flex-1 flex-col gap-2">
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>

          {/* Bottom navigation */}
          <div className="border-t border-border pt-4 mt-auto">
            {/* User info */}
            {user && !collapsed && (
              <div className="mb-4 rounded-lg bg-background p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {user.name || user.email.split('@')[0]}
                    </p>
                    <p className="truncate text-xs text-foreground-muted">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            <nav className="flex flex-col gap-2">
              {bottomNavItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}

              {/* Logout button */}
              <button
                onClick={async () => {
                  await logout();
                  router.push('/login');
                }}
                className={cn(
                  'group relative flex items-center gap-4 rounded-xl px-4 py-3.5 text-base font-semibold transition-all duration-200 text-foreground hover:bg-destructive/10 hover:text-destructive',
                  collapsed && 'justify-center px-3'
                )}
                title={collapsed ? 'Logout' : undefined}
              >
                <LogOut className={cn('h-6 w-6 flex-shrink-0', collapsed && 'h-7 w-7')} />
                {!collapsed && <span className="truncate">Logout</span>}
              </button>
            </nav>
          </div>
        </div>
      </aside>
    </>
  );
};

interface MobileMenuButtonProps {
  className?: string;
}

export const MobileMenuButton: React.FC<MobileMenuButtonProps> = ({ className }) => {
  const { setMobileOpen } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setMobileOpen(true)}
      className={cn('lg:hidden', className)}
    >
      <Menu className="h-5 w-5" />
      <span className="sr-only">Open sidebar</span>
    </Button>
  );
};

interface MainContentProps {
  children: React.ReactNode;
  className?: string;
}

export const MainContent: React.FC<MainContentProps> = ({ children, className }) => {
  return (
    <main
      className={cn(
        'min-h-screen w-full flex-1 transition-all duration-300 ease-in-out',
        className
      )}
    >
      {children}
    </main>
  );
};
