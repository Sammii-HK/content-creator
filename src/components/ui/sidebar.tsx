'use client';

import React, { useState, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
  ChevronRight
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
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
  { title: 'Content', href: '/dashboard/content', icon: Scissors },
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

  const NavLink: React.FC<{ item: NavItem }> = ({ item }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    
    return (
      <Link href={item.href} onClick={() => setMobileOpen(false)}>
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-background-secondary group",
            isActive 
              ? "bg-primary text-primary-foreground shadow-soft hover:bg-primary-hover" 
              : "text-foreground-secondary hover:text-foreground",
            collapsed && "justify-center px-2"
          )}
        >
          <item.icon className={cn("h-5 w-5 flex-shrink-0", collapsed && "h-6 w-6")} />
          {!collapsed && (
            <>
              <span className="truncate">{item.title}</span>
              {item.badge && (
                <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {item.badge}
                </span>
              )}
            </>
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
      <div
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full flex-col border-r border-border bg-background-secondary/50 backdrop-blur-xl transition-all duration-300 ease-in-out lg:z-40",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="font-semibold text-foreground">Content Studio</span>
            </Link>
          )}
          
          {/* Desktop collapse button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>

          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex flex-1 flex-col gap-2 p-4">
          <nav className="flex flex-1 flex-col gap-1">
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>

          {/* Bottom navigation */}
          <div className="border-t border-border pt-4">
            <nav className="flex flex-col gap-1">
              {bottomNavItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </nav>
          </div>
        </div>
      </div>
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
      className={cn("lg:hidden", className)}
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
  const { collapsed } = useSidebar();

  return (
    <div
      className={cn(
        "min-h-screen transition-all duration-300 ease-in-out",
        collapsed ? "lg:ml-16" : "lg:ml-64",
        className
      )}
    >
      {children}
    </div>
  );
};
