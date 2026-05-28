import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  X,
  FileText,
  Clock,
  FolderOpen,
  ChevronDown,
} from 'lucide-react';

/* ───────────────────── v2 design tokens (exact from design.md) ───────────────────── */
const BG_PRIMARY = '#0A0A0F';
const BG_SURFACE = '#13131A';
const BG_ELEVATED = '#1A1A24';
const BORDER_SUBTLE = '#1E1E2A';
const BORDER_HOVER = '#2A2A3A';
const BORDER_ACTIVE = '#38BDF8';
const TEXT_PRIMARY = '#F0F0F5';
const TEXT_SECONDARY = '#8A8B9E';
const TEXT_TERTIARY = '#5A5B6E';
const TEXT_MUTED = '#4A4B5A';
const ACCENT_CYAN = '#38BDF8';
const ACCENT_BLUE = '#5B5CFF';
const ACCENT_BLUE_HOVER = '#4F4FE5';
const ACCENT_CYAN_GLOW = 'rgba(56,189,248,0.15)';
const STATUS_SUCCESS = '#22C55E';
const STATUS_WARNING = '#F59E0B';

const EASE_DECEL = [0.16, 1, 0.3, 1] as [number, number, number, number];

/* ───────────────────── Types ───────────────────── */

type PlanStatus = 'active' | 'planned' | 'completed';

interface WeeklyPlan {
  id: string;
  name: string;
  description: string;
  status: PlanStatus;
  articleCount: number;
  lastUpdated: string;
  keywords: string[];
}

/* ───────────────────── Mock Data ───────────────────── */

const INITIAL_PLANS: WeeklyPlan[] = [
  {
    id: '1',
    name: 'Week 22: AI Agent Market Entry',
    description: 'Track emerging AI agent startups, enterprise adoption patterns, and competitive landscape shifts across key market segments.',
    status: 'active',
    articleCount: 47,
    lastUpdated: '2 hr ago',
    keywords: ['AI Agents', 'Enterprise', 'Startups'],
  },
  {
    id: '2',
    name: 'Week 21: Semiconductor Supply Analysis',
    description: 'Deep-dive into TSMC capacity expansion, Intel foundry strategy, and geopolitical risk factors affecting global chip supply.',
    status: 'completed',
    articleCount: 82,
    lastUpdated: '1 day ago',
    keywords: ['TSMC', 'Intel', 'Geopolitics'],
  },
  {
    id: '3',
    name: 'Week 23: Crypto Regulation Tracking',
    description: 'Monitor MiCA implementation, SEC enforcement actions, and institutional DeFi compliance developments worldwide.',
    status: 'planned',
    articleCount: 0,
    lastUpdated: '3 hr ago',
    keywords: ['MiCA', 'SEC', 'DeFi'],
  },
  {
    id: '4',
    name: 'Week 22: EV Battery Tech Review',
    description: 'Solid-state battery breakthroughs, charging infrastructure expansion, and OEM partnership announcements.',
    status: 'active',
    articleCount: 35,
    lastUpdated: '5 hr ago',
    keywords: ['Solid-State', 'Charging', 'OEM'],
  },
  {
    id: '5',
    name: 'Week 21: Healthcare AI Compliance',
    description: 'FDA guidance updates, HIPAA implications for AI diagnostics, and clinical trial regulatory frameworks.',
    status: 'completed',
    articleCount: 56,
    lastUpdated: '2 days ago',
    keywords: ['FDA', 'HIPAA', 'Clinical'],
  },
  {
    id: '6',
    name: 'Week 23: Quantum Computing Watch',
    description: 'IBM and Google quantum roadmaps, error correction milestones, and commercial use case exploration.',
    status: 'planned',
    articleCount: 0,
    lastUpdated: '6 hr ago',
    keywords: ['IBM', 'Google', 'Qubits'],
  },
  {
    id: '7',
    name: 'Week 22: Fintech Disruption Map',
    description: 'Neobank growth metrics, embedded finance adoption, and open banking API ecosystem developments.',
    status: 'active',
    articleCount: 28,
    lastUpdated: '1 hr ago',
    keywords: ['Neobank', 'Embedded', 'API'],
  },
  {
    id: '8',
    name: 'Week 21: Cybersecurity Threat Intel',
    description: 'Zero-day vulnerability tracking, nation-state APT campaigns, and enterprise security posture analysis.',
    status: 'completed',
    articleCount: 64,
    lastUpdated: '12 hr ago',
    keywords: ['Zero-Day', 'APT', 'Enterprise'],
  },
];

function useSortOptions() {
  const { t } = useTranslation();
  return [
    { value: 'updated', label: t('weeklyPlans.sortUpdated') },
    { value: 'name', label: t('weeklyPlans.sortName') },
    { value: 'articles', label: t('weeklyPlans.sortArticles') },
  ] as const;
}

function useStatusFilters() {
  const { t } = useTranslation();
  return [
    { value: 'all', label: t('common.all') },
    { value: 'active', label: t('common.active') },
    { value: 'completed', label: t('common.completed') },
    { value: 'planned', label: t('common.planned') },
  ] as const;
}

/* ───────────────────── Status Badge Styles ───────────────────── */

function useStatusStyles() {
  const { t } = useTranslation();
  return {
    active: {
      bg: 'rgba(34,197,94,0.12)',
      color: STATUS_SUCCESS,
      border: '1px solid rgba(34,197,94,0.25)',
      label: t('common.active'),
    },
    planned: {
      bg: 'rgba(245,158,11,0.12)',
      color: STATUS_WARNING,
      border: '1px solid rgba(245,158,11,0.25)',
      label: t('common.planned'),
    },
    completed: {
      bg: 'rgba(56,189,248,0.12)',
      color: ACCENT_CYAN,
      border: '1px solid rgba(56,189,248,0.25)',
      label: t('common.completed'),
    },
  };
}

/* ───────────────────── Animation Variants ───────────────────── */

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: EASE_DECEL },
  },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: EASE_DECEL },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15 },
  },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

/* ───────────────────── Keyword Badge ───────────────────── */
function KeywordBadge({ keyword }: { keyword: string }) {
  return (
    <span
      className="inline-block rounded-[6px] px-2 py-[2px] font-mono text-[0.6875rem] font-medium"
      style={{
        backgroundColor: 'rgba(56,189,248,0.08)',
        color: ACCENT_CYAN,
        border: '1px solid rgba(56,189,248,0.15)',
      }}
    >
      {keyword}
    </span>
  );
}

/* ───────────────────── Plan Card ───────────────────── */
function PlanCard({ plan }: { plan: WeeklyPlan }) {
  const navigate = useNavigate();
  const statusStyles = useStatusStyles();
  const status = statusStyles[plan.status];

  return (
    <motion.div
      variants={cardVariants}
      onClick={() => navigate(`/plans/${plan.id}`)}
      className="group flex cursor-pointer flex-col gap-3 rounded-[8px] border p-5 transition-all duration-200"
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
      {/* Name + Status */}
      <div className="flex items-start justify-between gap-2">
        <h3
          className="text-[1rem] font-semibold leading-[1.3] line-clamp-2 flex-1"
          style={{ fontFamily: 'Inter, system-ui, sans-serif', color: TEXT_PRIMARY }}
        >
          {plan.name}
        </h3>
        <span
          className="shrink-0 rounded-full px-3 py-1 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.06em]"
          style={{
            backgroundColor: status.bg,
            color: status.color,
            border: status.border,
          }}
        >
          {status.label}
        </span>
      </div>

      {/* Description */}
      <p
        className="line-clamp-2 text-[0.875rem] leading-[1.5]"
        style={{ color: TEXT_SECONDARY, fontFamily: 'Inter, system-ui, sans-serif' }}
      >
        {plan.description}
      </p>

      {/* Meta row */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <FileText size={13} style={{ color: TEXT_TERTIARY }} />
          <span className="font-mono text-[0.8125rem]" style={{ color: TEXT_SECONDARY }}>
            {plan.articleCount}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={13} style={{ color: TEXT_TERTIARY }} />
          <span className="font-mono text-[0.8125rem]" style={{ color: TEXT_TERTIARY }}>
            {plan.lastUpdated}
          </span>
        </div>
      </div>

      {/* Keywords */}
      <div className="flex flex-wrap gap-1.5">
        {plan.keywords.map((k) => (
          <KeywordBadge key={k} keyword={k} />
        ))}
      </div>
    </motion.div>
  );
}

/* ───────────────────── Empty State ───────────────────── */
function EmptyState({ onCreate }: { onCreate: () => void }) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_DECEL }}
      className="flex flex-col items-center justify-center rounded-[8px] border py-16 px-5"
      style={{ backgroundColor: BG_SURFACE, borderColor: BORDER_SUBTLE }}
    >
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: 'rgba(56,189,248,0.08)' }}
      >
        <FolderOpen size={28} style={{ color: ACCENT_CYAN }} />
      </div>
      <h3
        className="mb-1 text-[1.125rem] font-semibold"
        style={{ fontFamily: 'Inter, system-ui, sans-serif', color: TEXT_PRIMARY }}
      >
        {t('weeklyPlans.empty.title')}
      </h3>
      <p
        className="mb-5 text-[0.875rem]"
        style={{ color: TEXT_SECONDARY, fontFamily: 'Inter, system-ui, sans-serif' }}
      >
        {t('weeklyPlans.empty.description')}
      </p>
      <button
        onClick={onCreate}
        className="flex items-center gap-2 rounded-full px-6 py-3 text-[0.875rem] font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        style={{ backgroundColor: ACCENT_BLUE }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = ACCENT_BLUE_HOVER)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = ACCENT_BLUE)}
      >
        <Plus size={16} />
        {t('weeklyPlans.empty.cta')}
      </button>
    </motion.div>
  );
}

/* ───────────────────── Create Plan Modal ───────────────────── */
function CreatePlanModal({ onClose, onCreate }: { onClose: () => void; onCreate: (plan: WeeklyPlan) => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [weekNumber, setWeekNumber] = useState(22);
  const [sources, setSources] = useState({ rss: true, newsapi: false, scraping: false });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const newPlan: WeeklyPlan = {
      id: Date.now().toString(),
      name: `Week ${weekNumber}: ${name}`,
      description: description.trim() || 'No description provided.',
      status: 'planned',
      articleCount: 0,
      lastUpdated: 'just now',
      keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
    };
    onCreate(newPlan);
    onClose();
  };

  return (
    <motion.div
      variants={backdropVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
    >
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="show"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[520px] rounded-[12px] border p-6"
        style={{ backgroundColor: BG_ELEVATED, borderColor: BORDER_SUBTLE }}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2
            className="text-[1.25rem] font-bold leading-[1.2]"
            style={{ fontFamily: 'Inter, system-ui, sans-serif', color: TEXT_PRIMARY }}
          >
            {t('weeklyPlans.createModal.title')}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[6px] transition-colors"
            style={{ color: TEXT_TERTIARY }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BG_SURFACE)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Plan Name */}
          <div className="flex flex-col gap-1.5">
            <label
              className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.08em]"
              style={{ color: TEXT_TERTIARY }}
            >
              {t('weeklyPlans.createModal.planName')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., AI Agent Market Entry"
              className="h-10 rounded-[8px] border bg-transparent px-4 text-[0.9375rem] outline-none transition-all duration-200 placeholder:font-mono"
              style={{
                backgroundColor: BG_SURFACE,
                borderColor: BORDER_SUBTLE,
                color: TEXT_PRIMARY,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = BORDER_ACTIVE;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${ACCENT_CYAN_GLOW}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = BORDER_SUBTLE;
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label
              className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.08em]"
              style={{ color: TEXT_TERTIARY }}
            >
              {t('weeklyPlans.createModal.description')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of research focus..."
              rows={3}
              className="rounded-[8px] border bg-transparent px-4 py-2.5 text-[0.9375rem] outline-none transition-all duration-200 placeholder:font-mono resize-none"
              style={{
                backgroundColor: BG_SURFACE,
                borderColor: BORDER_SUBTLE,
                color: TEXT_PRIMARY,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = BORDER_ACTIVE;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${ACCENT_CYAN_GLOW}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = BORDER_SUBTLE;
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Keywords + Week Number row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label
                className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.08em]"
                style={{ color: TEXT_TERTIARY }}
              >
                {t('weeklyPlans.createModal.keywords')}
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="comma, separated, tags"
                className="h-10 rounded-[8px] border bg-transparent px-4 text-[0.9375rem] outline-none transition-all duration-200 placeholder:font-mono"
                style={{
                  backgroundColor: BG_SURFACE,
                  borderColor: BORDER_SUBTLE,
                  color: TEXT_PRIMARY,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = BORDER_ACTIVE;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${ACCENT_CYAN_GLOW}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = BORDER_SUBTLE;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.08em]"
                style={{ color: TEXT_TERTIARY }}
              >
                {t('weeklyPlans.createModal.weekNumber')}
              </label>
              <input
                type="number"
                min={1}
                max={52}
                value={weekNumber}
                onChange={(e) => setWeekNumber(Number(e.target.value))}
                className="h-10 rounded-[8px] border bg-transparent px-4 text-[0.9375rem] outline-none transition-all duration-200 font-mono"
                style={{
                  backgroundColor: BG_SURFACE,
                  borderColor: BORDER_SUBTLE,
                  color: TEXT_PRIMARY,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = BORDER_ACTIVE;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${ACCENT_CYAN_GLOW}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = BORDER_SUBTLE;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Data Sources */}
          <div className="flex flex-col gap-2">
            <label
              className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.08em]"
              style={{ color: TEXT_TERTIARY }}
            >
              {t('weeklyPlans.createModal.dataSources')}
            </label>
            <div className="flex flex-wrap gap-3">
              {([
                { key: 'rss', label: t('weeklyPlans.createModal.sourceRSS') },
                { key: 'newsapi', label: t('weeklyPlans.createModal.sourceNewsAPI') },
                { key: 'scraping', label: t('weeklyPlans.createModal.sourceWebScraping') },
              ] as const).map(({ key, label }) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-2 rounded-[6px] border px-3 py-2 transition-colors"
                  style={{
                    backgroundColor: sources[key as keyof typeof sources] ? 'rgba(56,189,248,0.08)' : BG_SURFACE,
                    borderColor: sources[key as keyof typeof sources] ? 'rgba(56,189,248,0.3)' : BORDER_SUBTLE,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={sources[key as keyof typeof sources]}
                    onChange={(e) =>
                      setSources((prev) => ({ ...prev, [key]: e.target.checked }))
                    }
                    className="h-4 w-4 accent-[#38BDF8]"
                  />
                  <span
                    className="text-[0.875rem] font-medium"
                    style={{
                      color: sources[key as keyof typeof sources] ? ACCENT_CYAN : TEXT_SECONDARY,
                      fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                  >
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border px-5 py-2.5 text-[0.875rem] font-medium transition-all duration-200"
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
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="rounded-full px-6 py-2.5 text-[0.875rem] font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: ACCENT_BLUE }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = ACCENT_BLUE_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = ACCENT_BLUE)}
            >
              {t('common.create')}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ───────────────────── Main WeeklyPlans Component ───────────────────── */
export default function WeeklyPlans() {
  const { t } = useTranslation();

  const [plans, setPlans] = useState<WeeklyPlan[]>(INITIAL_PLANS);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'name' | 'articles'>('updated');
  const [statusFilter, setStatusFilter] = useState<'all' | PlanStatus>('all');
  const [modalOpen, setModalOpen] = useState(false);

  const SORT_OPTIONS = useSortOptions();
  const statusFilterItems = useStatusFilters();

  const filteredPlans = useMemo(() => {
    let result = [...plans];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.keywords.some((k) => k.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }

    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'articles':
        result.sort((a, b) => b.articleCount - a.articleCount);
        break;
      case 'updated':
      default:
        // Keep mock order as "recently updated"
        break;
    }

    return result;
  }, [plans, searchQuery, sortBy, statusFilter]);

  const handleCreate = (newPlan: WeeklyPlan) => {
    setPlans((prev) => [newPlan, ...prev]);
  };

  return (
    <div className="min-h-full" style={{ backgroundColor: BG_PRIMARY }}>
      {/* ─── Page Header ─── */}
      <section className="px-5 pt-8 pb-5 sm:px-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_DECEL }}
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <h1
              className="font-bold leading-[1.2] tracking-[-0.01em]"
              style={{
                fontSize: 'clamp(1.25rem, 2.5vw, 1.875rem)',
                fontFamily: 'Inter, system-ui, sans-serif',
                color: TEXT_PRIMARY,
              }}
            >
              {t('weeklyPlans.title')}
            </h1>
            <p
              className="mt-1.5 text-[0.9375rem] leading-[1.5]"
              style={{ color: TEXT_SECONDARY, fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              {t('weeklyPlans.subtitle')}
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-[0.875rem] font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: ACCENT_BLUE }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = ACCENT_BLUE_HOVER)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = ACCENT_BLUE)}
          >
            <Plus size={16} />
            {t('weeklyPlans.createPlan')}
          </button>
        </motion.div>
      </section>

      {/* ─── Filter / Sort Bar ─── */}
      <section className="px-5 pb-5 sm:px-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1, ease: EASE_DECEL }}
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: TEXT_MUTED }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('weeklyPlans.searchPlaceholder')}
              className="h-10 w-full rounded-[8px] border bg-transparent pl-10 pr-4 text-[0.9375rem] outline-none transition-all duration-200 placeholder:font-mono"
              style={{
                backgroundColor: BG_SURFACE,
                borderColor: BORDER_SUBTLE,
                color: TEXT_PRIMARY,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = BORDER_ACTIVE;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${ACCENT_CYAN_GLOW}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = BORDER_SUBTLE;
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="h-10 cursor-pointer appearance-none rounded-[8px] border bg-transparent px-4 pr-10 text-[0.875rem] font-medium outline-none transition-all duration-200"
              style={{
                backgroundColor: BG_SURFACE,
                borderColor: BORDER_SUBTLE,
                color: TEXT_PRIMARY,
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = BORDER_ACTIVE;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = BORDER_SUBTLE;
              }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} style={{ backgroundColor: BG_ELEVATED }}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: TEXT_TERTIARY }}
            />
          </div>
        </motion.div>

        {/* Status Filter Pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mt-3 flex flex-wrap gap-2"
        >
          {statusFilterItems.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value as typeof statusFilter)}
              className="rounded-full px-4 py-1.5 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.06em] transition-all duration-200"
              style={{
                backgroundColor: statusFilter === filter.value ? ACCENT_BLUE : BG_SURFACE,
                color: statusFilter === filter.value ? '#fff' : TEXT_TERTIARY,
                border: `1px solid ${statusFilter === filter.value ? ACCENT_BLUE : BORDER_SUBTLE}`,
              }}
              onMouseEnter={(e) => {
                if (statusFilter !== filter.value) {
                  e.currentTarget.style.borderColor = BORDER_HOVER;
                  e.currentTarget.style.color = TEXT_SECONDARY;
                }
              }}
              onMouseLeave={(e) => {
                if (statusFilter !== filter.value) {
                  e.currentTarget.style.borderColor = BORDER_SUBTLE;
                  e.currentTarget.style.color = TEXT_TERTIARY;
                }
              }}
            >
              {filter.label}
            </button>
          ))}
        </motion.div>
      </section>

      {/* ─── Plans Grid ─── */}
      <section className="px-5 pb-10 sm:px-8 lg:px-10">
        {filteredPlans.length === 0 ? (
          <EmptyState onCreate={() => setModalOpen(true)} />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredPlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </motion.div>
        )}
      </section>

      {/* ─── Create Plan Modal ─── */}
      <AnimatePresence>
        {modalOpen && (
          <CreatePlanModal onClose={() => setModalOpen(false)} onCreate={handleCreate} />
        )}
      </AnimatePresence>
    </div>
  );
}
