import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  CalendarDays,
  Bot,
  Settings,
  Plus,
  Menu,
  X,
  Users,
  LogIn,
  LogOut,
  UserCircle,
  SlidersHorizontal,
  ChevronDown,
  FolderKanban,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

const mainNavItems: NavItem[] = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/topics', icon: FolderKanban, label: 'Topics' },
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
  if (hash.startsWith('#/login')) return '/login';
  return '/';
}

/* ================================================================ */
/*  Desktop Top Bar  (>= 1024px)                                    */
/* ================================================================ */
function DesktopTopBar({ onNavigate }: { onNavigate: () => void }) {
  const { user, isAuthenticated, isAdmin, isEditor, logout } = useAuth();
  const [active, setActive] = useState(getActiveItem());
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setActive(getActiveItem());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const handleNav = (to: string) => {
    setActive(to);
    onNavigate();
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 hidden h-14 items-center justify-between border-b border-border-subtle bg-bg-sidebar/90 backdrop-blur-[12px] lg:flex px-6">
      {/* Left: Logo */}
      <a href="#/" className="flex items-center gap-0 font-mono text-lg font-bold tracking-tight text-text-primary select-none">
        RID
        <span className="text-accent-cyan">.</span>
      </a>

      {/* Center: Nav links */}
      <nav className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1">
        {mainNavItems.map((item) => {
          const isActive = active === item.to;
          return (
            <a
              key={item.to}
              href={`#${item.to}`}
              onClick={() => { handleNav(item.to); }}
              className={`relative px-4 py-2 text-[0.875rem] font-medium transition-colors duration-200 ${
                isActive
                  ? 'text-accent-cyan'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {item.label}
              {isActive && (
                <motion.div
                  layoutId="top-nav-indicator"
                  className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-accent-cyan"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </a>
          );
        })}
        {/* Team link — admin only */}
        {isAdmin && (
          <a
            href="#/team"
            onClick={() => { handleNav('/team'); }}
            className={`relative px-4 py-2 text-[0.875rem] font-medium transition-colors duration-200 ${
              active === '/team'
                ? 'text-accent-cyan'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Team
            {active === '/team' && (
              <motion.div
                layoutId="top-nav-indicator"
                className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-accent-cyan"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </a>
        )}
      </nav>

      {/* Right: Settings + New Plan + User */}
      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <>
            <a
              href="#/settings"
              onClick={() => { handleNav('/settings'); }}
              className={`flex h-8 w-8 items-center justify-center rounded-radius-md transition-colors ${
                active === '/settings'
                  ? 'text-accent-cyan bg-accent-cyan/10'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
              }`}
              aria-label="Settings"
            >
              <Settings size={18} strokeWidth={1.5} />
            </a>

            {/* New Plan button — editors only */}
            {isEditor && (
              <a
                href="#/plans"
                onClick={() => { handleNav('/plans'); }}
                className="flex items-center gap-2 rounded-full bg-accent-blue px-5 py-2 text-[0.875rem] font-semibold text-white transition-all duration-200 hover:bg-accent-blue-hover hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus size={16} strokeWidth={2} />
                New Plan
              </a>
            )}

            {/* User dropdown */}
            <div className="relative ml-1">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-radius-md px-2 py-1.5 text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-blue/15 font-mono text-xs font-medium text-accent-blue">
                  {user?.name
                    ? user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                    : '?'}
                </div>
                <span className="max-w-[100px] truncate text-sm font-medium text-text-primary">
                  {user?.name || 'User'}
                </span>
                <ChevronDown size={14} className={`transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full z-50 mt-1 w-48 rounded-radius-lg border border-border-subtle bg-bg-elevated py-1 shadow-lg"
                    >
                      <div className="border-b border-border-subtle px-3 py-2">
                        <p className="truncate text-sm font-medium text-text-primary">{user?.name}</p>
                        <p className="truncate font-mono text-xs text-text-tertiary">{user?.email}</p>
                        <span className="mt-1 inline-block rounded-full bg-accent-blue/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent-blue">
                          {user?.role}
                        </span>
                      </div>
                      <a
                        href="#/settings"
                        onClick={() => { setProfileOpen(false); handleNav('/settings'); }}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary"
                      >
                        <UserCircle size={14} />
                        Profile
                      </a>
                      <a
                        href="#/settings"
                        onClick={() => { setProfileOpen(false); handleNav('/settings'); }}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary"
                      >
                        <SlidersHorizontal size={14} />
                        Settings
                      </a>
                      <div className="border-t border-border-subtle">
                        <button
                          onClick={() => { setProfileOpen(false); logout(); }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-status-error transition-colors hover:bg-status-error/10"
                        >
                          <LogOut size={14} />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <a
            href="#/login"
            className="flex items-center gap-2 rounded-full bg-accent-blue px-5 py-2 text-[0.875rem] font-semibold text-white transition-all duration-200 hover:bg-accent-blue-hover"
          >
            <LogIn size={16} strokeWidth={2} />
            Log In
          </a>
        )}
      </div>
    </header>
  );
}

/* ================================================================ */
/*  Mobile Top Bar  (< 1024px)                                      */
/* ================================================================ */
function MobileTopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { isAuthenticated, user } = useAuth();

  return (
    <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border-subtle bg-bg-sidebar/90 backdrop-blur-[12px] px-4 lg:hidden">
      {/* Left: Hamburger */}
      <button
        onClick={onOpenMenu}
        className="flex h-10 w-10 items-center justify-center rounded-radius-md text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
        aria-label="Open menu"
      >
        <Menu size={22} strokeWidth={1.5} />
      </button>

      {/* Center: Logo */}
      <a href="#/" className="absolute left-1/2 flex -translate-x-1/2 items-center gap-0 font-mono text-lg font-bold tracking-tight text-text-primary select-none">
        RID
        <span className="text-accent-cyan">.</span>
      </a>

      {/* Right: Settings or User */}
      {isAuthenticated ? (
        <a
          href="#/settings"
          className="flex h-10 w-10 items-center justify-center rounded-radius-md text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
          aria-label="Settings"
        >
          <Settings size={20} strokeWidth={1.5} />
        </a>
      ) : (
        <a
          href="#/login"
          className="flex h-8 items-center justify-center rounded-full bg-accent-blue px-3 text-xs font-semibold text-white"
        >
          Log In
        </a>
      )}
    </header>
  );
}

/* ================================================================ */
/*  Mobile Drawer  (sheet from left)                                */
/* ================================================================ */
function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, isAuthenticated, isAdmin, isEditor, logout } = useAuth();
  const [active, setActive] = useState(getActiveItem());

  useEffect(() => {
    const handler = () => setActive(getActiveItem());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const handleClick = (to: string) => {
    setActive(to);
    onClose();
  };

  const allItems: NavItem[] = [
    ...mainNavItems,
    ...(isAdmin ? [{ to: '/team', icon: Users, label: 'Team' }] : []),
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[70] bg-black/70 lg:hidden"
          onClick={onClose}
        >
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 top-0 flex h-full w-[280px] flex-col border-r border-border-subtle bg-bg-sidebar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
              <a href="#/" onClick={() => handleClick('/')} className="flex items-center gap-0 font-mono text-lg font-bold tracking-tight text-text-primary select-none">
                RID
                <span className="text-accent-cyan">.</span>
              </a>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-radius-md text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* User info — if authenticated */}
            {isAuthenticated && user && (
              <div className="border-b border-border-subtle px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-blue/15 font-mono text-sm font-medium text-accent-blue">
                    {user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">{user.name}</p>
                    <p className="truncate font-mono text-xs text-text-tertiary">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Nav items */}
            <nav className="flex-1 px-3 py-4">
              {allItems.map((item) => {
                const isActive = active === item.to;
                const Icon = item.icon;
                return (
                  <a
                    key={item.to}
                    href={`#${item.to}`}
                    onClick={() => handleClick(item.to)}
                    className={`mb-1 flex items-center gap-3 rounded-radius-md px-3 py-3 text-[0.9375rem] font-medium transition-all duration-200 ${
                      isActive
                        ? 'border-l-2 border-l-accent-cyan bg-accent-cyan/[0.06] text-accent-cyan'
                        : 'border-l-2 border-l-transparent text-text-secondary hover:bg-white/[0.03] hover:text-text-primary'
                    }`}
                  >
                    <Icon size={20} strokeWidth={1.5} />
                    {item.label}
                  </a>
                );
              })}
            </nav>

            {/* Bottom actions */}
            <div className="border-t border-border-subtle p-4 space-y-2">
              {isEditor && (
                <a
                  href="#/plans"
                  onClick={() => handleClick('/plans')}
                  className="flex items-center justify-center gap-2 rounded-full bg-accent-blue py-2.5 text-[0.875rem] font-semibold text-white transition-all hover:bg-accent-blue-hover"
                >
                  <Plus size={16} strokeWidth={2} />
                  New Plan
                </a>
              )}
              {isAuthenticated ? (
                <button
                  onClick={() => { onClose(); logout(); }}
                  className="flex w-full items-center justify-center gap-2 rounded-radius-md border border-border-subtle py-2.5 text-[0.875rem] font-medium text-status-error transition-colors hover:bg-status-error/10"
                >
                  <LogOut size={16} strokeWidth={1.5} />
                  Logout
                </button>
              ) : (
                <a
                  href="#/login"
                  onClick={() => handleClick('/login')}
                  className="flex items-center justify-center gap-2 rounded-full bg-accent-blue py-2.5 text-[0.875rem] font-semibold text-white transition-all hover:bg-accent-blue-hover"
                >
                  <LogIn size={16} strokeWidth={2} />
                  Log In
                </a>
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ================================================================ */
/*  Main Navbar Export                                              */
/* ================================================================ */
export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <DesktopTopBar onNavigate={() => {}} />
      <MobileTopBar onOpenMenu={() => setMobileOpen(true)} />
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
