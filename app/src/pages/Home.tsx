import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Plus,
  Play,
  Download,
  FileText,
  BrainCircuit,
  FolderPlus,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

/* ───────────────────── v2 design tokens (exact from design.md) ───────────────────── */
const BG_PRIMARY = '#0A0A0F';
const BG_SURFACE = '#13131A';
const BG_ELEVATED = '#1A1A24';
const BORDER_SUBTLE = '#1E1E2A';
const BORDER_HOVER = '#2A2A3A';
const TEXT_PRIMARY = '#F0F0F5';
const TEXT_SECONDARY = '#8A8B9E';
const TEXT_TERTIARY = '#5A5B6E';
const ACCENT_CYAN = '#38BDF8';
const ACCENT_BLUE = '#5B5CFF';
const ACCENT_BLUE_HOVER = '#4F4FE5';
const STATUS_SUCCESS = '#22C55E';
const STATUS_WARNING = '#F59E0B';
const STATUS_ERROR = '#EF4444';

const EASE_DECEL = [0.16, 1, 0.3, 1] as [number, number, number, number];

/* ───────────────────── mock data ───────────────────── */

function useStats() {
  const { t } = useTranslation();
  return [
    { label: t('home.stats.activePlans'), value: 8, trend: '+2', trendUp: true },
    { label: t('home.stats.articlesThisWeek'), value: 342, trend: '+12%', trendUp: true },
    { label: t('home.stats.aiAnalyses'), value: 24, trend: '+5', trendUp: true },
    { label: t('home.stats.pendingReviews'), value: 3, trend: null, trendUp: null },
  ];
}

const weeklyPlans = [
  { id: '1', name: 'Week 22: AI Agent Market Entry', status: 'active' as const, articleCount: 47, lastUpdated: '2 hr ago' },
  { id: '2', name: 'Week 21: Semiconductor Supply Analysis', status: 'completed' as const, articleCount: 82, lastUpdated: '1 day ago' },
  { id: '3', name: 'Week 23: Crypto Regulation Tracking', status: 'planned' as const, articleCount: 0, lastUpdated: '3 hr ago' },
  { id: '4', name: 'Week 22: EV Battery Tech Review', status: 'active' as const, articleCount: 35, lastUpdated: '5 hr ago' },
  { id: '5', name: 'Week 22: Fintech Disruption Map', status: 'active' as const, articleCount: 28, lastUpdated: '1 hr ago' },
  { id: '6', name: 'Week 21: Cybersecurity Threat Intel', status: 'completed' as const, articleCount: 64, lastUpdated: '2 days ago' },
];

const sparkData = [
  { v: 30 }, { v: 45 }, { v: 35 }, { v: 60 }, { v: 55 }, { v: 80 }, { v: 70 },
];

const activities = [
  { id: '1', type: 'articles' as const, description: 'News fetched for AI Agent Market Entry', timestamp: '12 min ago' },
  { id: '2', type: 'analysis' as const, description: 'Analysis generated for EV Battery Tech Review', timestamp: '32 min ago' },
  { id: '3', type: 'plan' as const, description: 'Plan created: Week 23: Crypto Regulation Tracking', timestamp: '1 hr ago' },
  { id: '4', type: 'milestone' as const, description: 'Milestone completed: Semiconductor Supply Analysis', timestamp: '3 hr ago' },
  { id: '5', type: 'articles' as const, description: 'News fetched for Fintech Disruption Map', timestamp: '5 hr ago' },
  { id: '6', type: 'analysis' as const, description: 'Analysis generated for Cybersecurity Threat Intel', timestamp: '1 day ago' },
];

/* ───────────────────── activity config ───────────────────── */

const activityConfig: Record<string, { icon: typeof FileText; color: string; bg: string }> = {
  articles: { icon: FileText, color: ACCENT_CYAN, bg: 'rgba(56,189,248,0.1)' },
  analysis: { icon: BrainCircuit, color: STATUS_SUCCESS, bg: 'rgba(34,197,94,0.1)' },
  plan: { icon: FolderPlus, color: ACCENT_BLUE, bg: 'rgba(91,92,255,0.1)' },
  milestone: { icon: CheckCircle2, color: STATUS_WARNING, bg: 'rgba(245,158,11,0.1)' },
};

/* ───────────────────── status badge styles ───────────────────── */

function useStatusBadgeStyles() {
  const { t } = useTranslation();
  return {
    active: { bg: 'rgba(34,197,94,0.12)', color: STATUS_SUCCESS, border: '1px solid rgba(34,197,94,0.25)', label: t('common.active') },
    planned: { bg: 'rgba(245,158,11,0.12)', color: STATUS_WARNING, border: '1px solid rgba(245,158,11,0.25)', label: t('common.planned') },
    completed: { bg: 'rgba(56,189,248,0.12)', color: ACCENT_CYAN, border: '1px solid rgba(56,189,248,0.25)', label: t('common.completed') },
  };
}

/* ───────────────────── count-up hook ───────────────────── */
function useCountUp(end: number, duration = 1200, startOnMount = true) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!startOnMount) return;
    let rafId: number;
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [end, duration, startOnMount]);
  return count;
}

/* ───────────────────── StatBlock ───────────────────── */
function StatBlock({ stat, index }: { stat: ReturnType<typeof useStats>[number]; index: number }) {
  const count = useCountUp(stat.value, 1200);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08, ease: EASE_DECEL }}
      className="flex flex-col rounded-[8px] border p-5"
      style={{ backgroundColor: BG_SURFACE, borderColor: BORDER_SUBTLE }}
    >
      <span
        className="font-mono leading-none"
        style={{
          fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
          fontWeight: 700,
          color: TEXT_PRIMARY,
        }}
      >
        {count.toLocaleString()}
      </span>
      <span
        className="mt-2 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.08em]"
        style={{ color: TEXT_TERTIARY }}
      >
        {stat.label}
      </span>
      {stat.trend && (
        <div className="mt-2 flex items-center gap-1">
          <TrendingUp size={12} style={{ color: stat.trendUp ? STATUS_SUCCESS : STATUS_ERROR }} />
          <span
            className="font-mono text-[0.75rem] font-medium"
            style={{ color: stat.trendUp ? STATUS_SUCCESS : STATUS_ERROR }}
          >
            {stat.trend}
          </span>
        </div>
      )}
    </motion.div>
  );
}

/* ───────────────────── PlanCard (quick view) ───────────────────── */
function QuickPlanCard({ plan, index }: { plan: (typeof weeklyPlans)[number]; index: number }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const statusBadgeStyles = useStatusBadgeStyles();
  const status = statusBadgeStyles[plan.status];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 + index * 0.05, ease: EASE_DECEL }}
      onClick={() => navigate(`/plans/${plan.id}`)}
      className="group flex cursor-pointer flex-col gap-3 rounded-[8px] border p-4 transition-all duration-200 min-w-[260px] sm:min-w-0"
      style={{
        backgroundColor: BG_SURFACE,
        borderColor: BORDER_SUBTLE,
      }}
      whileHover={{
        y: -1,
        borderColor: BORDER_HOVER,
        transition: { duration: 0.2 },
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <h4
          className="text-[1rem] font-semibold leading-[1.3] line-clamp-2 flex-1"
          style={{ color: TEXT_PRIMARY, fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          {plan.name}
        </h4>
        <span
          className="shrink-0 rounded-full px-3 py-1 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.06em]"
          style={{ backgroundColor: status.bg, color: status.color, border: status.border }}
        >
          {status.label}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-mono text-[0.8125rem]" style={{ color: TEXT_SECONDARY }}>
          {plan.articleCount} {t('planDetail.meta.articles').toLowerCase()}
        </span>
        <span className="font-mono text-[0.8125rem]" style={{ color: TEXT_TERTIARY }}>
          {plan.lastUpdated}
        </span>
      </div>
      {/* Mini sparkline */}
      <div className="h-[32px] w-full opacity-60 group-hover:opacity-100 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData}>
            <Area
              type="monotone"
              dataKey="v"
              stroke={plan.status === 'active' ? STATUS_SUCCESS : plan.status === 'planned' ? STATUS_WARNING : ACCENT_CYAN}
              fill={plan.status === 'active' ? 'rgba(34,197,94,0.1)' : plan.status === 'planned' ? 'rgba(245,158,11,0.1)' : 'rgba(56,189,248,0.1)'}
              strokeWidth={1.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

/* ───────────────────── ActivityItem ───────────────────── */
function ActivityItem({ activity, index }: { activity: (typeof activities)[number]; index: number }) {
  const config = activityConfig[activity.type] || activityConfig.articles;
  const Icon = config.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.5 + index * 0.04, ease: EASE_DECEL }}
      className="flex items-center gap-3 rounded-[8px] border p-4"
      style={{
        backgroundColor: BG_SURFACE,
        borderColor: BORDER_SUBTLE,
        borderBottomWidth: index < activities.length - 1 ? '1px' : '1px',
      }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px]"
        style={{ backgroundColor: config.bg }}
      >
        <Icon size={16} style={{ color: config.color }} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span
          className="truncate text-[0.9375rem] leading-[1.4]"
          style={{ color: TEXT_PRIMARY, fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          {activity.description}
        </span>
      </div>
      <span
        className="shrink-0 font-mono text-[0.75rem]"
        style={{ color: TEXT_TERTIARY }}
      >
        {activity.timestamp}
      </span>
    </motion.div>
  );
}

/* ───────────────────── Main Home Component ───────────────────── */
export default function Home() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const stats = useStats();

  const today = new Date().toLocaleDateString(i18n.language === 'en' ? 'en-US' : i18n.language, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-full" style={{ backgroundColor: BG_PRIMARY }}>
      {/* ─── Hero Section ─── */}
      <section className="px-5 pt-8 pb-6 sm:px-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_DECEL }}
        >
          <h1
            className="font-extrabold leading-[1.1] tracking-[-0.02em]"
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 3rem)',
              fontFamily: 'Inter, system-ui, sans-serif',
              color: TEXT_PRIMARY,
            }}
          >
            {t('home.title')}
          </h1>
          <p
            className="mt-2 text-[0.9375rem] leading-[1.6]"
            style={{ color: TEXT_SECONDARY, fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            {t('home.subtitle')}
          </p>
          <p
            className="mt-1 font-mono text-[0.8125rem]"
            style={{ color: TEXT_TERTIARY }}
          >
            {today}
          </p>
        </motion.div>
      </section>

      {/* ─── Stats Row ─── */}
      <section className="px-5 pb-8 sm:px-8 lg:px-10">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {stats.map((stat, i) => (
            <StatBlock key={stat.label} stat={stat} index={i} />
          ))}
        </div>
      </section>

      {/* ─── Weekly Plans Quick View ─── */}
      <section className="px-5 pb-8 sm:px-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mb-4 flex items-center justify-between"
        >
          <h2
            className="text-[clamp(1.25rem,2.5vw,1.875rem)] font-bold leading-[1.2]"
            style={{ fontFamily: 'Inter, system-ui, sans-serif', color: TEXT_PRIMARY }}
          >
            {t('home.quickViewTitle')}
          </h2>
          <button
            onClick={() => navigate('/plans')}
            className="flex items-center gap-1 text-[0.875rem] font-medium transition-colors hover:opacity-80"
            style={{ color: ACCENT_CYAN }}
          >
            {t('home.viewAll')}
            <ArrowRight size={14} />
          </button>
        </motion.div>

        {/* Horizontal scroll on mobile, grid on desktop */}
        <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3 lg:gap-4">
          {weeklyPlans.map((plan, i) => (
            <QuickPlanCard key={plan.id} plan={plan} index={i} />
          ))}
        </div>
      </section>

      {/* ─── Recent Activity Feed ─── */}
      <section className="px-5 pb-8 sm:px-8 lg:px-10">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="mb-4 text-[clamp(1.25rem,2.5vw,1.875rem)] font-bold leading-[1.2]"
          style={{ fontFamily: 'Inter, system-ui, sans-serif', color: TEXT_PRIMARY }}
        >
          {t('home.recentActivity')}
        </motion.h2>
        <div className="flex flex-col gap-2">
          {activities.map((activity, i) => (
            <ActivityItem key={activity.id} activity={activity} index={i} />
          ))}
        </div>
      </section>

      {/* ─── Quick Actions Bar ─── */}
      <section className="px-5 pb-10 sm:px-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.7 }}
          className={cn(
            'flex gap-3',
            'sm:relative sm:flex-row',
            'fixed bottom-0 left-0 right-0 z-40 flex-row px-5 py-3 sm:static sm:px-0 sm:py-0'
          )}
          style={{
            backgroundColor: 'transparent',
          }}
        >
          {/* Mobile backdrop blur bar */}
          <div
            className="absolute inset-0 -z-10 sm:hidden"
            style={{
              backgroundColor: 'rgba(10,10,15,0.85)',
              backdropFilter: 'blur(12px)',
              borderTop: `1px solid ${BORDER_SUBTLE}`,
            }}
          />

          <button
            onClick={() => navigate('/plans')}
            className="flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 text-[0.875rem] font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] sm:flex-none"
            style={{ backgroundColor: ACCENT_BLUE }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = ACCENT_BLUE_HOVER)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = ACCENT_BLUE)}
          >
            <Plus size={16} />
            {t('home.quickActions.createPlan')}
          </button>

          <button
            className="flex flex-1 items-center justify-center gap-2 rounded-full border px-5 py-3 text-[0.875rem] font-medium transition-all duration-200 sm:flex-none"
            style={{
              backgroundColor: 'transparent',
              borderColor: BORDER_SUBTLE,
              color: TEXT_SECONDARY,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = BG_ELEVATED;
              e.currentTarget.style.borderColor = BORDER_HOVER;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = BORDER_SUBTLE;
            }}
          >
            <Play size={16} />
            {t('home.quickActions.runAnalysis')}
          </button>

          <button
            className="flex flex-1 items-center justify-center gap-2 rounded-full border px-5 py-3 text-[0.875rem] font-medium transition-all duration-200 sm:flex-none"
            style={{
              backgroundColor: 'transparent',
              borderColor: BORDER_SUBTLE,
              color: TEXT_SECONDARY,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = BG_ELEVATED;
              e.currentTarget.style.borderColor = BORDER_HOVER;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = BORDER_SUBTLE;
            }}
          >
            <Download size={16} />
            {t('home.quickActions.exportReport')}
          </button>
        </motion.div>

        {/* Spacer for mobile sticky bar */}
        <div className="h-[60px] sm:hidden" />
      </section>
    </div>
  );
}
