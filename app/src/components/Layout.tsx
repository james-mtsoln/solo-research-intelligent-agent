import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  CalendarDays,
  Bot,
  Settings,
  Users,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from './Navbar';
import Footer from './Footer';

/* ================================================================ */
/*  Page transition variants                                        */
/* ================================================================ */
const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: {
    duration: 0.15,
    ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
  },
};

/* ================================================================ */
/*  Sidebar nav items                                               */
/* ================================================================ */
interface SidebarItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

const sidebarItems: SidebarItem[] = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/plans', icon: CalendarDays, label: 'Weekly Plans' },
  { to: '/agents', icon: Bot, label: 'Agents' },
];

function getActiveItem() {
  const hash = window.location.hash;
  if (hash.startsWith('#/plans/')) return '/plans';
  if (hash.startsWith('#/plans')) return '/plans';
  if (hash.startsWith('#/agents')) return '/agents';
  if (hash.startsWith('#/settings')) return '/settings';
  if (hash.startsWith('#/team')) return '/team';
  return '/';
}

/* ================================================================ */
/*  Desktop Sidebar (>= 1024px)                                     */
/* ================================================================ */
function DesktopSidebar({ collapsed }: { collapsed: boolean }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();
  const [active, setActive] = useState(getActiveItem());

  // Keep active state in sync with URL
  useEffect(() => {
    setActive(getActiveItem());
  }, [location.pathname, location.hash]);

  // Listen for hash changes
  const handleClick = (to: string) => {
    setActive(to);
  };

  const allItems: SidebarItem[] = [
    ...sidebarItems,
    ...(isAdmin ? [{ to: '/team', icon: Users, label: 'Team' }] : []),
  ];

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 200 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="fixed left-0 top-14 z-40 hidden h-[calc(100vh-56px)] flex-col border-r border-border-subtle bg-bg-sidebar lg:flex"
    >
      {/* Nav items */}
      <nav className="flex-1 px-2 py-4">
        {allItems.map((item) => {
          const isActive = active === item.to;
          const Icon = item.icon;
          return (
            <a
              key={item.to}
              href={`#${item.to}`}
              onClick={() => handleClick(item.to)}
              className={`mb-1 flex items-center rounded-radius-md transition-all duration-200 ${
                collapsed ? 'h-10 w-10 justify-center' : 'h-10 gap-3 px-3'
              } ${
                isActive
                  ? 'border-l-2 border-l-accent-cyan bg-accent-cyan/[0.06] text-accent-cyan'
                  : 'border-l-2 border-l-transparent text-text-secondary hover:bg-white/[0.03] hover:text-text-primary'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={20} strokeWidth={1.5} />
              {!collapsed && (
                <span className="text-[0.875rem] font-medium whitespace-nowrap">{item.label}</span>
              )}
            </a>
          );
        })}

        {/* Settings at bottom of nav */}
        <div className="mt-4 border-t border-border-subtle pt-4">
          <a
            href="#/settings"
            onClick={() => handleClick('/settings')}
            className={`flex items-center rounded-radius-md transition-all duration-200 ${
              collapsed ? 'h-10 w-10 justify-center' : 'h-10 gap-3 px-3'
            } ${
              active === '/settings'
                ? 'border-l-2 border-l-accent-cyan bg-accent-cyan/[0.06] text-accent-cyan'
                : 'border-l-2 border-l-transparent text-text-secondary hover:bg-white/[0.03] hover:text-text-primary'
            }`}
            title={collapsed ? 'Settings' : undefined}
          >
            <Settings size={20} strokeWidth={1.5} />
            {!collapsed && (
              <span className="text-[0.875rem] font-medium whitespace-nowrap">Settings</span>
            )}
          </a>
        </div>
      </nav>
    </motion.aside>
  );
}

/* ================================================================ */
/*  Auth Loading Screen                                             */
/* ================================================================ */
function AuthLoadingScreen() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-bg-primary">
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={28} className="animate-spin text-accent-cyan" />
        <p className="text-sm text-text-secondary">Loading...</p>
      </div>
    </div>
  );
}

/* ================================================================ */
/*  Main Layout Export                                              */
/* ================================================================ */
interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isAuthenticated, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  // Auth loading state
  if (loading) {
    return <AuthLoadingScreen />;
  }

  // Public pages (login, accept-invite) — render without sidebar
  const isPublicPage =
    location.pathname === '/login' || location.pathname === '/accept-invite';

  if (!isAuthenticated && isPublicPage) {
    return (
      <div className="min-h-[100dvh] bg-bg-primary">
        <>{children}</>
      </div>
    );
  }

  // Authenticated layout with sidebar
  return (
    <div className="min-h-[100dvh] bg-bg-primary">
      {/* Top Navbar (mobile + desktop) */}
      <Navbar />

      {/* Desktop Sidebar */}
      <DesktopSidebar collapsed={sidebarCollapsed} />

      {/* Sidebar collapse toggle button */}
      <button
        onClick={() => setSidebarCollapsed((c) => !c)}
        className="fixed left-[200px] top-[72px] z-50 hidden h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-border-subtle bg-bg-elevated text-text-secondary transition-colors hover:text-text-primary lg:flex"
        style={{ left: sidebarCollapsed ? 64 : 200 }}
        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Main content area */}
      <main
        className="min-h-[100dvh] pt-14 transition-all duration-300 lg:ml-[200px]"
        style={{ marginLeft: sidebarCollapsed ? 64 : undefined }}
      >
        <div className="flex min-h-[calc(100dvh-56px)] flex-col">
          {/* Page content with transitions */}
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname + location.search}
              {...pageTransition}
              className="flex-1 p-4 lg:p-6"
            >
              {children}
            </motion.div>
          </AnimatePresence>

          <Footer />
        </div>
      </main>
    </div>
  );
}
