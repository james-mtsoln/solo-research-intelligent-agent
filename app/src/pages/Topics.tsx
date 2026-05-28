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
const STATUS_ERROR = '#EF4444';

const EASE_DECEL = [0.16, 1, 0.3, 1] as [number, number, number, number];

/* ───────────────────── Types ───────────────────── */

type Sentiment = 'positive' | 'neutral' | 'negative';
type Category = 'Technology' | 'Finance' | 'Healthcare' | 'Energy' | 'Other';

interface Topic {
  id: string;
  name: string;
  description: string;
  category: Category;
  sentiment: Sentiment;
  articleCount: number;
  lastUpdated: string;
  keywords: string[];
}

/* ───────────────────── Mock Data ───────────────────── */

const INITIAL_TOPICS: Topic[] = [
  {
    id: '1',
    name: 'AI in Healthcare',
    description: 'Tracking AI diagnostic tools, FDA approvals, and clinical trials',
    category: 'Technology',
    sentiment: 'positive',
    articleCount: 156,
    lastUpdated: '2 hr ago',
    keywords: ['AI Diagnostics', 'FDA', 'Clinical Trials'],
  },
  {
    id: '2',
    name: 'Crypto Regulation',
    description: 'Global regulatory landscape for digital assets and DeFi protocols',
    category: 'Finance',
    sentiment: 'neutral',
    articleCount: 89,
    lastUpdated: '4 hr ago',
    keywords: ['DeFi', 'SEC', 'MiCA'],
  },
  {
    id: '3',
    name: 'EV Battery Technology',
    description: 'Solid-state batteries, charging infrastructure, and supply chain',
    category: 'Energy',
    sentiment: 'positive',
    articleCount: 124,
    lastUpdated: '1 hr ago',
    keywords: ['Solid-State', 'Charging', 'Supply Chain'],
  },
  {
    id: '4',
    name: 'Quantum Computing',
    description: 'IBM, Google, and startups advancing quantum supremacy',
    category: 'Technology',
    sentiment: 'positive',
    articleCount: 67,
    lastUpdated: '6 hr ago',
    keywords: ['IBM', 'Google', 'Qubits'],
  },
  {
    id: '5',
    name: 'Semiconductor Supply Chain',
    description: 'Chip shortages, geopolitical tensions, and reshoring efforts',
    category: 'Technology',
    sentiment: 'negative',
    articleCount: 203,
    lastUpdated: '30 min ago',
    keywords: ['TSMC', 'Geopolitics', 'Reshoring'],
  },
  {
    id: '6',
    name: 'Genomics Market',
    description: 'CRISPR therapies, gene editing regulation, and market growth',
    category: 'Healthcare',
    sentiment: 'positive',
    articleCount: 78,
    lastUpdated: '3 hr ago',
    keywords: ['CRISPR', 'Gene Editing', 'Therapeutics'],
  },
  {
    id: '7',
    name: 'Cybersecurity Threats',
    description: 'Ransomware trends, zero-day vulnerabilities, and defense strategies',
    category: 'Technology',
    sentiment: 'neutral',
    articleCount: 145,
    lastUpdated: '5 hr ago',
    keywords: ['Ransomware', 'Zero-Day', 'Defense'],
  },
  {
    id: '8',
    name: 'Space Tourism',
    description: 'Commercial space travel, regulatory frameworks, and market sizing',
    category: 'Other',
    sentiment: 'positive',
    articleCount: 42,
    lastUpdated: '8 hr ago',
    keywords: ['SpaceX', 'Blue Origin', 'Regulation'],
  },
];

/* ───────────────────── Helpers ───────────────────── */

function useSortOptions() {
  const { t } = useTranslation();
  return [
    { value: 'updated', label: t('topics.sortUpdated') },
    { value: 'name', label: t('topics.sortName') },
    { value: 'articles', label: t('topics.sortArticles') },
  ] as const;
}

function useCategoryFilters() {
  const { t } = useTranslation();
  return [
    { value: 'all', label: t('topics.categoryAll') },
    { value: 'Technology', label: t('topics.categoryTechnology') },
    { value: 'Finance', label: t('topics.categoryFinance') },
    { value: 'Healthcare', label: t('topics.categoryHealthcare') },
    { value: 'Energy', label: t('topics.categoryEnergy') },
    { value: 'Other', label: t('topics.categoryOther') },
  ] as const;
}

/* ───────────────────── Sentiment Badge Styles ───────────────────── */

function useSentimentStyles() {
  const { t } = useTranslation();
  return {
    positive: {
      bg: 'rgba(34,197,94,0.12)',
      color: STATUS_SUCCESS,
      border: '1px solid rgba(34,197,94,0.25)',
      label: t('common.active'),
    },
    neutral: {
      bg: 'rgba(245,158,11,0.12)',
      color: STATUS_WARNING,
      border: '1px solid rgba(245,158,11,0.25)',
      label: t('common.planned'),
    },
    negative: {
      bg: 'rgba(239,68,68,0.12)',
      color: STATUS_ERROR,
      border: '1px solid rgba(239,68,68,0.25)',
      label: t('common.inactive'),
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

/* ───────────────────── Category Badge ───────────────────── */
function CategoryBadge({ category }: { category: Category }) {
  return (
    <span
      className="inline-block rounded-[4px] px-2 py-[2px] font-mono text-[0.625rem] font-medium uppercase tracking-[0.08em]"
      style={{
        backgroundColor: 'rgba(56,189,248,0.1)',
        color: ACCENT_CYAN,
      }}
    >
      {category}
    </span>
  );
}

/* ───────────────────── Topic Card ───────────────────── */
function TopicCard({ topic }: { topic: Topic }) {
  const navigate = useNavigate();
  const sentimentStyles = useSentimentStyles();
  const sentiment = sentimentStyles[topic.sentiment];

  return (
    <motion.div
      variants={cardVariants}
      onClick={() => navigate(`/topics/${topic.id}`)}
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
      {/* Name + Sentiment */}
      <div className="flex items-start justify-between gap-2">
        <h3
          className="text-[1rem] font-semibold leading-[1.3] line-clamp-2 flex-1"
          style={{ fontFamily: 'Inter, system-ui, sans-serif', color: TEXT_PRIMARY }}
        >
          {topic.name}
        </h3>
        <span
          className="shrink-0 rounded-full px-3 py-1 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.06em]"
          style={{
            backgroundColor: sentiment.bg,
            color: sentiment.color,
            border: sentiment.border,
          }}
        >
          {topic.sentiment}
        </span>
      </div>

      {/* Category */}
      <CategoryBadge category={topic.category} />

      {/* Description */}
      <p
        className="line-clamp-2 text-[0.875rem] leading-[1.5]"
        style={{ color: TEXT_SECONDARY, fontFamily: 'Inter, system-ui, sans-serif' }}
      >
        {topic.description}
      </p>

      {/* Meta row */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <FileText size={13} style={{ color: TEXT_TERTIARY }} />
          <span className="font-mono text-[0.8125rem]" style={{ color: TEXT_SECONDARY }}>
            {topic.articleCount}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={13} style={{ color: TEXT_TERTIARY }} />
          <span className="font-mono text-[0.8125rem]" style={{ color: TEXT_TERTIARY }}>
            {topic.lastUpdated}
          </span>
        </div>
      </div>

      {/* Keywords */}
      <div className="flex flex-wrap gap-1.5">
        {topic.keywords.map((k) => (
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
        {t('topics.empty.title')}
      </h3>
      <p
        className="mb-5 text-[0.875rem]"
        style={{ color: TEXT_SECONDARY, fontFamily: 'Inter, system-ui, sans-serif' }}
      >
        {t('topics.empty.description')}
      </p>
      <button
        onClick={onCreate}
        className="flex items-center gap-2 rounded-full px-6 py-3 text-[0.875rem] font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        style={{ backgroundColor: ACCENT_BLUE }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = ACCENT_BLUE_HOVER)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = ACCENT_BLUE)}
      >
        <Plus size={16} />
        {t('topics.empty.cta')}
      </button>
    </motion.div>
  );
}

/* ───────────────────── Create Topic Modal ───────────────────── */
function CreateTopicModal({ onClose, onCreate }: { onClose: () => void; onCreate: (topic: Topic) => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Technology');
  const [keywords, setKeywords] = useState('');
  const [sources, setSources] = useState({ rss: true, newsapi: false, scraping: false });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const newTopic: Topic = {
      id: Date.now().toString(),
      name: name.trim(),
      description: description.trim() || 'No description provided.',
      category,
      sentiment: 'neutral',
      articleCount: 0,
      lastUpdated: 'just now',
      keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
    };
    onCreate(newTopic);
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
            {t('topics.createModal.title')}
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
          {/* Topic Name */}
          <div className="flex flex-col gap-1.5">
            <label
              className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.08em]"
              style={{ color: TEXT_TERTIARY }}
            >
              {t('topics.createModal.topicName')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., AI in Healthcare"
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
              {t('topics.createModal.description')}
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

          {/* Category + Keywords row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label
                className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.08em]"
                style={{ color: TEXT_TERTIARY }}
              >
                {t('topics.createModal.category')}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
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
                {(['Technology', 'Finance', 'Healthcare', 'Energy', 'Other'] as Category[]).map((c) => (
                  <option key={c} value={c} style={{ backgroundColor: BG_ELEVATED }}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.08em]"
                style={{ color: TEXT_TERTIARY }}
              >
                {t('topics.createModal.keywords')}
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
          </div>

          {/* Data Sources */}
          <div className="flex flex-col gap-2">
            <label
              className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.08em]"
              style={{ color: TEXT_TERTIARY }}
            >
              {t('topics.createModal.dataSources')}
            </label>
            <div className="flex flex-wrap gap-3">
              {([
                { key: 'rss', label: t('topics.createModal.sourceRSS') },
                { key: 'newsapi', label: t('topics.createModal.sourceNewsAPI') },
                { key: 'scraping', label: t('topics.createModal.sourceWebScraping') },
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

/* ───────────────────── Main Topics Component ───────────────────── */
export default function Topics() {
  const { t } = useTranslation();

  const [topics, setTopics] = useState<Topic[]>(INITIAL_TOPICS);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'name' | 'articles'>('updated');
  const [categoryFilter, setCategoryFilter] = useState<'all' | Category>('all');
  const [modalOpen, setModalOpen] = useState(false);

  const SORT_OPTIONS = useSortOptions();
  const categoryFilters = useCategoryFilters();

  const filteredTopics = useMemo(() => {
    let result = [...topics];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.keywords.some((k) => k.toLowerCase().includes(q))
      );
    }

    if (categoryFilter !== 'all') {
      result = result.filter((p) => p.category === categoryFilter);
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
  }, [topics, searchQuery, sortBy, categoryFilter]);

  const handleCreate = (newTopic: Topic) => {
    setTopics((prev) => [newTopic, ...prev]);
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
              {t('topics.title')}
            </h1>
            <p
              className="mt-1.5 text-[0.9375rem] leading-[1.5]"
              style={{ color: TEXT_SECONDARY, fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              {t('topics.subtitle')}
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
            {t('topics.createTopic')}
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
              placeholder={t('topics.searchPlaceholder')}
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

        {/* Category Filter Pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mt-3 flex flex-wrap gap-2"
        >
          {categoryFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setCategoryFilter(filter.value as typeof categoryFilter)}
              className="rounded-full px-4 py-1.5 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.06em] transition-all duration-200"
              style={{
                backgroundColor: categoryFilter === filter.value ? ACCENT_BLUE : BG_SURFACE,
                color: categoryFilter === filter.value ? '#fff' : TEXT_TERTIARY,
                border: `1px solid ${categoryFilter === filter.value ? ACCENT_BLUE : BORDER_SUBTLE}`,
              }}
              onMouseEnter={(e) => {
                if (categoryFilter !== filter.value) {
                  e.currentTarget.style.borderColor = BORDER_HOVER;
                  e.currentTarget.style.color = TEXT_SECONDARY;
                }
              }}
              onMouseLeave={(e) => {
                if (categoryFilter !== filter.value) {
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

      {/* ─── Topics Grid ─── */}
      <section className="px-5 pb-10 sm:px-8 lg:px-10">
        {filteredTopics.length === 0 ? (
          <EmptyState onCreate={() => setModalOpen(true)} />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredTopics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </motion.div>
        )}
      </section>

      {/* ─── Create Topic Modal ─── */}
      <AnimatePresence>
        {modalOpen && (
          <CreateTopicModal onClose={() => setModalOpen(false)} onCreate={handleCreate} />
        )}
      </AnimatePresence>
    </div>
  );
}
