import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Compass,
  ScrollText,
  Rss,
  TrendingUp,
  Target,
  BarChart3,
  Users,
  Search,
  Plus,
  X,
  Download,
  Loader2,
  Check,
  Settings2,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/* ------------------------------------------------------------------ */
/*  Design Tokens (mtsoln.com-inspired ultra-dark)                    */
/* ------------------------------------------------------------------ */

const C = {
  bgPrimary: '#0A0A0F',
  bgSurface: '#13131A',
  bgElevated: '#1A1A24',
  bgSidebar: '#0D0D14',
  borderSubtle: '#1E1E2A',
  borderHover: '#2A2A3A',
  borderActive: '#38BDF8',
  textPrimary: '#F0F0F5',
  textSecondary: '#8A8B9E',
  textTertiary: '#5A5B6E',
  textMuted: '#4A4B5A',
  accentCyan: '#38BDF8',
  accentBlue: '#5B5CFF',
  accentBlueHover: '#4F4FE5',
  accentCyanGlow: 'rgba(56,189,248,0.15)',
  statusSuccess: '#22C55E',
  statusWarning: '#F59E0B',
  statusError: '#EF4444',
  statusInfo: '#3B82F6',
} as const;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Agent {
  id: string;
  name: string;
  icon: LucideIcon;
  status: 'active' | 'inactive';
  description: string;
  version: string;
}

interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  installs: string;
  tags: string[];
  icon: LucideIcon;
}

interface LogEntry {
  id: string;
  time: string;
  agent: string;
  action: string;
  status: 'Done' | 'Running' | 'Error' | 'Queued';
  duration: string;
}

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const AGENTS: Agent[] = [
  {
    id: 'news-gatherer',
    name: 'News Gatherer',
    icon: Rss,
    status: 'active',
    description: 'Aggregates news from RSS, APIs, and web sources',
    version: 'v2.1.0',
  },
  {
    id: 'trend-analyzer',
    name: 'Trend Analyzer',
    icon: TrendingUp,
    status: 'active',
    description: 'Identifies market trends and patterns',
    version: 'v1.4.2',
  },
  {
    id: 'business-planner',
    name: 'Business Planner',
    icon: Target,
    status: 'active',
    description: 'Generates weekly business plans and strategies',
    version: 'v1.2.0',
  },
  {
    id: 'sentiment-tracker',
    name: 'Sentiment Tracker',
    icon: BarChart3,
    status: 'active',
    description: 'Tracks sentiment across news sources',
    version: 'v1.0.3',
  },
  {
    id: 'competitor-monitor',
    name: 'Competitor Monitor',
    icon: Users,
    status: 'inactive',
    description: 'Monitors competitor activities and announcements',
    version: 'v1.1.0',
  },
];

const PLUGINS: Plugin[] = [
  { id: 'p1', name: 'Sentiment Pro', description: 'Advanced sentiment with emotion detection', version: 'v2.1', installs: '1.2k', tags: ['AI', 'NLP'], icon: BarChart3 },
  { id: 'p2', name: 'RSS Advanced', description: 'Multi-language RSS with keyword filtering', version: 'v1.5', installs: '890', tags: ['RSS', 'Feed'], icon: Rss },
  { id: 'p3', name: 'Web Scraper Pro', description: 'Advanced scraping with JS rendering', version: 'v3.0', installs: '650', tags: ['Scraper', 'Web'], icon: TrendingUp },
  { id: 'p4', name: 'Report Builder', description: 'Auto PDF/Excel report generation', version: 'v1.2', installs: '430', tags: ['Export', 'Reports'], icon: Target },
  { id: 'p5', name: 'Alert Dispatcher', description: 'Email/Slack webhook notifications', version: 'v2.0', installs: '780', tags: ['Alerts', 'Webhooks'], icon: Bot },
  { id: 'p6', name: 'Data Exporter', description: 'Export to CSV, JSON, Notion', version: 'v1.8', installs: '520', tags: ['Export', 'Data'], icon: ScrollText },
  { id: 'p7', name: 'Anomaly Detector', description: 'Statistical anomaly detection', version: 'v1.0', installs: '210', tags: ['AI', 'Stats'], icon: TrendingUp },
  { id: 'p8', name: 'Source Validator', description: 'News source credibility scoring', version: 'v1.3', installs: '340', tags: ['Trust', 'Scoring'], icon: Check },
];

const LOGS: LogEntry[] = [
  { id: '1', time: '14:32:05', agent: 'News Gatherer', action: 'Fetched 47 articles from 8 sources', status: 'Done', duration: '23s' },
  { id: '2', time: '14:28:12', agent: 'Trend Analyzer', action: 'Analyzed 1,247 data points for trend signals', status: 'Done', duration: '1m 12s' },
  { id: '3', time: '14:25:44', agent: 'Sentiment Tracker', action: 'Updated sentiment scores for EV Industry', status: 'Running', duration: '8s' },
  { id: '4', time: '14:22:18', agent: 'Business Planner', action: 'Generated weekly plan v2.1.0', status: 'Done', duration: '45s' },
  { id: '5', time: '14:18:33', agent: 'News Gatherer', action: 'RSS feed timeout — retrying', status: 'Error', duration: '30s' },
  { id: '6', time: '14:15:09', agent: 'Competitor Monitor', action: 'Scheduled daily competitor scan', status: 'Queued', duration: '—' },
  { id: '7', time: '14:10:27', agent: 'Trend Analyzer', action: 'Completed deep analysis: Crypto Markets', status: 'Done', duration: '2m 34s' },
  { id: '8', time: '14:05:51', agent: 'Sentiment Tracker', action: 'Batch processed 312 articles', status: 'Done', duration: '18s' },
  { id: '9', time: '13:58:14', agent: 'News Gatherer', action: 'Discovered 3 new RSS feeds', status: 'Done', duration: '12s' },
  { id: '10', time: '13:52:06', agent: 'Business Planner', action: 'Regenerating plan from revised data', status: 'Queued', duration: '—' },
];

/* ------------------------------------------------------------------ */
/*  Animation Helpers                                                  */
/* ------------------------------------------------------------------ */

const easeDecelerate = [0.16, 1, 0.3, 1] as [number, number, number, number];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: easeDecelerate },
  },
};

const fadeVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: easeDecelerate } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

/* ------------------------------------------------------------------ */
/*  Utility Components                                                 */
/* ------------------------------------------------------------------ */

function StatusDot({ active }: { active: boolean }) {
  const { t } = useTranslation();
  if (!active) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: C.textMuted }} />
        <span className="text-xs" style={{ color: C.textMuted, fontFamily: 'Inter, sans-serif' }}>{t('agents.status.inactive')}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative flex h-[6px] w-[6px]">
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
          style={{ backgroundColor: C.statusSuccess, animationDuration: '2s' }}
        />
        <span className="relative inline-flex h-[6px] w-[6px] rounded-full" style={{ backgroundColor: C.statusSuccess }} />
      </span>
      <span className="text-xs" style={{ color: C.statusSuccess, fontFamily: 'Inter, sans-serif' }}>{t('agents.status.active')}</span>
    </span>
  );
}

function LogStatusBadge({ status }: { status: LogEntry['status'] }) {
  const config = {
    Done: { dot: C.statusSuccess, text: C.statusSuccess, label: 'Done', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.25)' },
    Running: { dot: C.statusInfo, text: C.statusInfo, label: 'Running', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)' },
    Error: { dot: C.statusError, text: C.statusError, label: 'Error', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)' },
    Queued: { dot: C.statusWarning, text: C.statusWarning, label: 'Queued', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
  };
  const c = config[status];
  return (
    <span
      className="inline-flex items-center gap-[6px] rounded-full px-3 py-[3px]"
      style={{ backgroundColor: c.bg, border: `1px solid ${c.border}` }}
    >
      <span className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: c.dot }} />
      <span
        className="text-[0.6875rem] font-medium uppercase tracking-[0.08em]"
        style={{ color: c.text, fontFamily: '"JetBrains Mono", monospace' }}
      >
        {c.label}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Config Panel                                                       */
/* ------------------------------------------------------------------ */

/* ── News Gatherer Config (extracted to fix conditional hooks) ── */
function NewsGathererConfig({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [rssUrls, setRssUrls] = useState(['https://feeds.reuters.com/reuters/business', 'https://feeds.ft.com/technology']);
  const [newUrl, setNewUrl] = useState('');
  const [frequency, setFrequency] = useState('30min');
  const [maxArticles, setMaxArticles] = useState(50);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const labelClass = 'block text-[0.6875rem] font-medium uppercase tracking-[0.08em] mb-2';
  const labelStyle = { color: C.textTertiary, fontFamily: '"JetBrains Mono", monospace' };
  const inputClass = 'w-full rounded-md border px-4 text-sm outline-none transition-colors';
  const inputStyle = { height: '40px', backgroundColor: C.bgSurface, borderColor: C.borderSubtle, color: C.textPrimary };
  const focusStyle = { borderColor: C.borderActive, boxShadow: `0 0 0 3px ${C.accentCyanGlow}` };

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: easeDecelerate }} className="overflow-hidden">
      <div className="mt-4 space-y-5 rounded-lg border p-5" style={{ backgroundColor: C.bgElevated, borderColor: C.borderSubtle }}>
        <div>
          <label className={labelClass} style={labelStyle}>{t('agents.configPanel.rssFeedUrls')}</label>
          <div className="space-y-2">
            {rssUrls.map((url, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input className={inputClass} style={{ ...inputStyle, ...(focusedField === `rss-${idx}` ? focusStyle : {}) }} defaultValue={url} onFocus={() => setFocusedField(`rss-${idx}`)} onBlur={() => setFocusedField(null)} />
                <button onClick={() => setRssUrls((prev) => prev.filter((_, i) => i !== idx))} className="rounded-md p-1 transition-colors hover:opacity-100" style={{ color: C.textMuted }} aria-label={t('agents.configPanel.removeUrl')}><X size={14} /></button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <input className={inputClass} style={{ ...inputStyle, flex: 1 }} placeholder="https://..." value={newUrl} onChange={(e) => setNewUrl(e.target.value)} onFocus={() => setFocusedField('new-rss')} onBlur={() => setFocusedField(null)} />
              <Button size="sm" onClick={() => { if (newUrl.trim()) { setRssUrls((prev) => [...prev, newUrl.trim()]); setNewUrl(''); } }} className="text-xs font-medium" style={{ backgroundColor: C.accentBlue, color: '#fff' }}><Plus size={14} />{t('agents.configPanel.add')}</Button>
            </div>
          </div>
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>{t('agents.configPanel.newsapiKey')}</label>
          <input className={inputClass} style={{ ...inputStyle, ...(focusedField === 'apikey' ? focusStyle : {}) }} type="password" defaultValue="sk-newsapi-xxxxxxxx" onFocus={() => setFocusedField('apikey')} onBlur={() => setFocusedField(null)} />
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>{t('agents.configPanel.fetchFrequency')}</label>
          <select className={inputClass} style={{ ...inputStyle, appearance: 'auto' }} value={frequency} onChange={(e) => setFrequency(e.target.value)}>
            <option value="15min">{t('agents.configPanel.every15min')}</option>
            <option value="30min">{t('agents.configPanel.every30min')}</option>
            <option value="1hr">{t('agents.configPanel.every1hr')}</option>
            <option value="6hr">{t('agents.configPanel.every6hr')}</option>
            <option value="24hr">{t('agents.configPanel.every24hr')}</option>
          </select>
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>{t('agents.configPanel.maxArticles')}: {maxArticles}</label>
          <input type="range" min={5} max={200} value={maxArticles} onChange={(e) => setMaxArticles(Number(e.target.value))} className="w-full accent-cyan" style={{ accentColor: C.accentCyan }} />
          <div className="mt-1 flex justify-between text-xs" style={{ color: C.textTertiary, fontFamily: '"JetBrains Mono", monospace' }}><span>5</span><span>200</span></div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs" style={{ color: C.textSecondary, borderColor: C.borderSubtle }}>{t('agents.configPanel.cancel')}</Button>
          <Button size="sm" onClick={onClose} className="text-xs font-medium" style={{ backgroundColor: C.accentBlue, color: '#fff' }}>{t('agents.configPanel.save')}</Button>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Trend Analyzer Config (extracted to fix conditional hooks) ── */
function TrendAnalyzerConfig({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [depth, setDepth] = useState('standard');
  const [categories, setCategories] = useState<string[]>(['Technology', 'Finance', 'Healthcare']);
  const [threshold, setThreshold] = useState(0.7);
  const allCategories = ['Technology', 'Finance', 'Healthcare', 'Energy', 'Consumer', 'Industrial'];

  const labelClass = 'block text-[0.6875rem] font-medium uppercase tracking-[0.08em] mb-2';
  const labelStyle = { color: C.textTertiary, fontFamily: '"JetBrains Mono", monospace' };
  const inputClass = 'w-full rounded-md border px-4 text-sm outline-none transition-colors';
  const inputStyle = { height: '40px', backgroundColor: C.bgSurface, borderColor: C.borderSubtle, color: C.textPrimary };

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: easeDecelerate }} className="overflow-hidden">
      <div className="mt-4 space-y-5 rounded-lg border p-5" style={{ backgroundColor: C.bgElevated, borderColor: C.borderSubtle }}>
        <div>
          <label className={labelClass} style={labelStyle}>{t('agents.configPanel.analysisDepth')}</label>
          <select className={inputClass} style={{ ...inputStyle, appearance: 'auto' }} value={depth} onChange={(e) => setDepth(e.target.value)}>
            <option value="basic">{t('agents.configPanel.depthBasic')}</option>
            <option value="standard">{t('agents.configPanel.depthStandard')}</option>
            <option value="deep">{t('agents.configPanel.depthDeep')}</option>
          </select>
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>{t('agents.configPanel.categories')}</label>
          <div className="flex flex-wrap gap-2">
            {allCategories.map((cat) => (
              <button key={cat} onClick={() => setCategories((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat])} className="rounded-full px-3 py-1 text-xs font-medium transition-colors" style={{ backgroundColor: categories.includes(cat) ? 'rgba(56,189,248,0.15)' : C.bgSurface, color: categories.includes(cat) ? C.accentCyan : C.textSecondary, border: `1px solid ${categories.includes(cat) ? 'rgba(56,189,248,0.25)' : C.borderSubtle}`, fontFamily: 'Inter, sans-serif' }}>{cat}</button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>{t('agents.configPanel.confidenceThreshold')}: {threshold.toFixed(2)}</label>
          <input type="range" min={0.1} max={1} step={0.05} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-full" style={{ accentColor: C.accentCyan }} />
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs" style={{ color: C.textSecondary }}>{t('agents.configPanel.cancel')}</Button>
          <Button size="sm" onClick={onClose} className="text-xs font-medium" style={{ backgroundColor: C.accentBlue, color: '#fff' }}>{t('agents.configPanel.save')}</Button>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Default Config Panel ── */
function DefaultConfigPanel({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: easeDecelerate }} className="overflow-hidden">
      <div className="mt-4 space-y-4 rounded-lg border p-5" style={{ backgroundColor: C.bgElevated, borderColor: C.borderSubtle }}>
        <p className="text-sm" style={{ color: C.textSecondary }}>{t('agents.configPanel.notConfigured')}</p>
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs" style={{ color: C.textSecondary }}>{t('agents.configPanel.cancel')}</Button>
          <Button size="sm" onClick={onClose} className="text-xs font-medium" style={{ backgroundColor: C.accentBlue, color: '#fff' }}>{t('agents.configPanel.save')}</Button>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Config Panel Router ── */
function ConfigPanel({ agentId, onClose }: { agentId: string; onClose: () => void }) {
  if (agentId === 'news-gatherer') return <NewsGathererConfig onClose={onClose} />;
  if (agentId === 'trend-analyzer') return <TrendAnalyzerConfig onClose={onClose} />;
  return <DefaultConfigPanel onClose={onClose} />;
}

/* ------------------------------------------------------------------ */
/*  Agent Card                                                         */
/* ------------------------------------------------------------------ */

function AgentCard({
  agent,
  enabled,
  onToggle,
  isConfigOpen,
  onToggleConfig,
}: {
  agent: Agent;
  enabled: boolean;
  onToggle: () => void;
  isConfigOpen: boolean;
  onToggleConfig: () => void;
}) {
  const { t } = useTranslation();
  const Icon = agent.icon;

  return (
    <motion.div
      variants={cardVariants}
      layout
      className="group rounded-lg border p-5 transition-all duration-200"
      style={{
        backgroundColor: C.bgSurface,
        borderColor: isConfigOpen ? C.borderActive : C.borderSubtle,
        boxShadow: isConfigOpen ? `0 0 0 1px ${C.accentCyanGlow}` : 'none',
      }}
      onMouseEnter={(e) => {
        if (!isConfigOpen) {
          (e.currentTarget as HTMLElement).style.borderColor = C.borderHover;
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isConfigOpen) {
          (e.currentTarget as HTMLElement).style.borderColor = C.borderSubtle;
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        }
      }}
    >
      {/* Icon + Name + Status */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(56,189,248,0.12)' }}
          >
            <Icon size={20} style={{ color: C.accentCyan }} />
          </div>
          <div>
            <h3
              className="text-base font-semibold leading-tight"
              style={{ color: C.textPrimary, fontFamily: 'Inter, sans-serif' }}
            >
              {agent.name}
            </h3>
            <div className="mt-1">
              <StatusDot active={enabled} />
            </div>
          </div>
        </div>
        <span
          className="shrink-0 rounded-sm px-2 py-[2px] text-[0.6875rem] font-medium uppercase tracking-[0.05em]"
          style={{ color: C.textTertiary, fontFamily: '"JetBrains Mono", monospace', backgroundColor: 'rgba(255,255,255,0.04)' }}
        >
          {agent.version}
        </span>
      </div>

      {/* Description */}
      <p
        className="mt-3 text-sm leading-relaxed"
        style={{ color: C.textSecondary, fontFamily: 'Inter, sans-serif' }}
      >
        {agent.description}
      </p>

      {/* Bottom Row */}
      <div className="mt-4 flex items-center justify-between border-t pt-4" style={{ borderColor: C.borderSubtle }}>
        <button
          onClick={onToggleConfig}
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: C.accentCyan, fontFamily: 'Inter, sans-serif' }}
        >
          <Settings2 size={14} />
          {t('common.configure')}
        </button>
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          className="data-[state=checked]:bg-[#22C55E]"
        />
      </div>

      {/* Expandable Config */}
      <AnimatePresence>
        {isConfigOpen && <ConfigPanel agentId={agent.id} onClose={onToggleConfig} />}
      </AnimatePresence>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Plugin Card                                                        */
/* ------------------------------------------------------------------ */

function PluginCard({
  plugin,
  installed,
  installing,
  onInstall,
}: {
  plugin: Plugin;
  installed: boolean;
  installing: boolean;
  onInstall: () => void;
}) {
  const { t } = useTranslation();
  const Icon = plugin.icon;

  return (
    <motion.div
      variants={cardVariants}
      className="group rounded-lg border p-5 transition-all duration-200"
      style={{ backgroundColor: C.bgSurface, borderColor: C.borderSubtle }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = C.borderHover;
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = C.borderSubtle;
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(56,189,248,0.12)' }}
        >
          <Icon size={20} style={{ color: C.accentCyan }} />
        </div>
        {installed ? (
          <span
            className="inline-flex items-center gap-1 rounded-full px-3 py-[3px] text-[0.6875rem] font-medium uppercase tracking-[0.05em]"
            style={{
              backgroundColor: 'rgba(34,197,94,0.12)',
              color: C.statusSuccess,
              fontFamily: '"JetBrains Mono", monospace',
              border: '1px solid rgba(34,197,94,0.25)',
            }}
          >
            <Check size={12} />
            {t('agents.plugin.installed')}
          </span>
        ) : (
          <Button
            size="sm"
            disabled={installing}
            onClick={onInstall}
            className="text-xs font-medium"
            style={{
              backgroundColor: installing ? C.textMuted : C.accentBlue,
              color: '#fff',
              borderRadius: '9999px',
              padding: '6px 16px',
            }}
          >
            {installing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {t('agents.plugin.installing')}
              </>
            ) : (
              <>
                <Download size={14} />
                {t('agents.plugin.install')}
              </>
            )}
          </Button>
        )}
      </div>

      {/* Name */}
      <h3
        className="mt-3 text-base font-semibold leading-tight"
        style={{ color: C.textPrimary, fontFamily: 'Inter, sans-serif' }}
      >
        {plugin.name}
      </h3>

      {/* Description */}
      <p
        className="mt-2 text-sm leading-relaxed"
        style={{ color: C.textSecondary, fontFamily: 'Inter, sans-serif' }}
      >
        {plugin.description}
      </p>

      {/* Version + Installs */}
      <div className="mt-3 flex items-center gap-4">
        <span
          className="text-xs"
          style={{ color: C.textTertiary, fontFamily: '"JetBrains Mono", monospace' }}
        >
          {plugin.version}
        </span>
        <span
          className="text-xs"
          style={{ color: C.textTertiary, fontFamily: '"JetBrains Mono", monospace' }}
        >
          {plugin.installs} {t('agents.plugin.installs')}
        </span>
      </div>

      {/* Tags */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {plugin.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full px-2.5 py-[3px] text-[0.6875rem] font-medium uppercase tracking-[0.05em]"
            style={{
              backgroundColor: 'rgba(56,189,248,0.1)',
              color: C.accentCyan,
              fontFamily: '"JetBrains Mono", monospace',
              border: '1px solid rgba(56,189,248,0.2)',
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function Agents() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('installed');
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>({
    'news-gatherer': true,
    'trend-analyzer': true,
    'business-planner': true,
    'sentiment-tracker': true,
    'competitor-monitor': false,
  });
  const [configOpenId, setConfigOpenId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [installedPluginIds, setInstalledPluginIds] = useState<Set<string>>(new Set());
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [logsPage, setLogsPage] = useState(0);
  const logsPerPage = 10;

  const activeCount = AGENTS.filter((a) => enabledMap[a.id]).length;
  const inactiveCount = AGENTS.length - activeCount;

  const toggleAgent = useCallback((id: string) => {
    setEnabledMap((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const installTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInstall = useCallback((pluginId: string) => {
    setInstallingId(pluginId);
    if (installTimeoutRef.current) {
      clearTimeout(installTimeoutRef.current);
    }
    installTimeoutRef.current = setTimeout(() => {
      setInstalledPluginIds((prev) => new Set([...prev, pluginId]));
      setInstallingId(null);
      installTimeoutRef.current = null;
    }, 1500);
  }, []);

  useEffect(() => {
    return () => {
      if (installTimeoutRef.current) {
        clearTimeout(installTimeoutRef.current);
      }
    };
  }, []);

  const filteredPlugins = PLUGINS.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalLogPages = Math.ceil(LOGS.length / logsPerPage);
  const paginatedLogs = LOGS.slice(logsPage * logsPerPage, (logsPage + 1) * logsPerPage);

  return (
    <div
      className="min-h-full flex-1"
      style={{ backgroundColor: C.bgPrimary }}
    >
      {/* ========== HEADER ========== */}
      <div className="px-5 pb-4 pt-6 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: easeDecelerate }}
          className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
        >
          <div>
            <h1
              className="text-2xl font-bold leading-tight sm:text-3xl"
              style={{
                color: C.textPrimary,
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
              }}
            >
              {t('agents.title')}
            </h1>
            <p
              className="mt-1 text-sm leading-relaxed"
              style={{ color: C.textSecondary, fontFamily: 'Inter, sans-serif' }}
            >
              {t('agents.subtitle')}
            </p>
          </div>
          <Button
            onClick={() => setActiveTab('browse')}
            className="shrink-0 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: C.accentBlue,
              color: '#fff',
              borderRadius: '9999px',
              padding: '8px 20px',
            }}
          >
            <Plus size={16} />
            {t('agents.installAgent')}
          </Button>
        </motion.div>

        {/* Status Summary Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.25 }}
          className="mt-4 flex flex-wrap items-center gap-3"
        >
          {[
            { label: `${activeCount} ${t('agents.status.active')}`, color: C.statusSuccess, bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.25)' },
            { label: `${inactiveCount} ${t('agents.status.inactive')}`, color: C.textMuted, bg: 'rgba(255,255,255,0.04)', border: C.borderSubtle },
            { label: '3 Data Sources', color: C.accentCyan, bg: C.accentCyanGlow, border: 'rgba(56,189,248,0.25)' },
          ].map((badge) => (
            <span
              key={badge.label}
              className="rounded-full px-3 py-[4px] text-[0.6875rem] font-medium uppercase tracking-[0.08em]"
              style={{
                backgroundColor: badge.bg,
                color: badge.color,
                border: `1px solid ${badge.border}`,
                fontFamily: '"JetBrains Mono", monospace',
              }}
            >
              {badge.label}
            </span>
          ))}
        </motion.div>
      </div>

      {/* ========== TABS ========== */}
      <div className="px-5 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList
            className="h-auto w-full justify-start gap-0 rounded-none border-b p-0"
            style={{ backgroundColor: 'transparent', borderColor: C.borderSubtle }}
          >
            {[
              { id: 'installed', labelKey: 'agents.tabs.installed', Icon: Bot },
              { id: 'browse', labelKey: 'agents.tabs.browse', Icon: Compass },
              { id: 'activity', labelKey: 'agents.tabs.activity', Icon: ScrollText },
            ].map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="relative flex items-center gap-2 rounded-none border-b-[2px] px-4 py-3 text-sm font-medium transition-colors data-[state=active]:shadow-none"
                style={{
                  backgroundColor: 'transparent',
                  borderColor: activeTab === tab.id ? C.accentCyan : 'transparent',
                  color: activeTab === tab.id ? C.accentCyan : C.textSecondary,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                <tab.Icon size={16} />
                {t(tab.labelKey)}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ========== TAB 1: INSTALLED ========== */}
          <TabsContent value="installed" className="mt-0 outline-none">
            <AnimatePresence mode="wait">
              <motion.div
                key="installed"
                variants={fadeVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="py-5"
              >
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
                >
                  {AGENTS.map((agent) => (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      enabled={enabledMap[agent.id] ?? false}
                      onToggle={() => toggleAgent(agent.id)}
                      isConfigOpen={configOpenId === agent.id}
                      onToggleConfig={() =>
                        setConfigOpenId((prev) => (prev === agent.id ? null : agent.id))
                      }
                    />
                  ))}
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* ========== TAB 2: BROWSE ========== */}
          <TabsContent value="browse" className="mt-0 outline-none">
            <AnimatePresence mode="wait">
              <motion.div
                key="browse"
                variants={fadeVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="py-5"
              >
                {/* Search */}
                <div className="mb-5">
                  <div className="relative max-w-md">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: C.textTertiary }}
                    />
                    <Input
                      placeholder={t('common.search') + '...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-10 border pl-10 text-sm"
                      style={{
                        backgroundColor: C.bgSurface,
                        borderColor: C.borderSubtle,
                        color: C.textPrimary,
                        borderRadius: '8px',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    />
                  </div>
                </div>

                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
                >
                  {filteredPlugins.map((plugin) => (
                    <PluginCard
                      key={plugin.id}
                      plugin={plugin}
                      installed={installedPluginIds.has(plugin.id)}
                      installing={installingId === plugin.id}
                      onInstall={() => handleInstall(plugin.id)}
                    />
                  ))}
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* ========== TAB 3: ACTIVITY ========== */}
          <TabsContent value="activity" className="mt-0 outline-none">
            <AnimatePresence mode="wait">
              <motion.div
                key="activity"
                variants={fadeVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="py-5"
              >
                <div
                  className="overflow-x-auto rounded-lg border"
                  style={{ backgroundColor: C.bgSurface, borderColor: C.borderSubtle }}
                >
                  <Table>
                    <TableHeader>
                      <TableRow style={{ borderColor: C.borderSubtle }}>
                        <TableHead style={{ color: C.textTertiary, fontFamily: '"JetBrains Mono", monospace' }}>{t('agents.activityLog.agent')}</TableHead>
                        <TableHead style={{ color: C.textTertiary, fontFamily: '"JetBrains Mono", monospace' }}>{t('agents.activityLog.action')}</TableHead>
                        <TableHead style={{ color: C.textTertiary, fontFamily: '"JetBrains Mono", monospace' }}>Status</TableHead>
                        <TableHead style={{ color: C.textTertiary, fontFamily: '"JetBrains Mono", monospace' }}>{t('agents.activityLog.duration')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedLogs.map((log) => (
                        <TableRow key={log.id} style={{ borderColor: C.borderSubtle }}>
                          <TableCell className="text-sm font-medium" style={{ color: C.textPrimary }}>{log.agent}</TableCell>
                          <TableCell className="max-w-[300px] truncate text-sm" style={{ color: C.textSecondary }}>{log.action}</TableCell>
                          <TableCell><LogStatusBadge status={log.status} /></TableCell>
                          <TableCell className="font-mono text-xs" style={{ color: C.textTertiary }}>{log.duration}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalLogPages > 1 && (
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs" style={{ color: C.textTertiary }}>
                      Page {logsPage + 1} of {totalLogPages}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setLogsPage((p) => Math.max(0, p - 1))}
                        disabled={logsPage === 0}
                        className="flex h-8 w-8 items-center justify-center rounded-md border transition-colors disabled:opacity-30"
                        style={{ borderColor: C.borderSubtle, color: C.textSecondary }}
                        aria-label={t('common.previous')}
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button
                        onClick={() => setLogsPage((p) => Math.min(totalLogPages - 1, p + 1))}
                        disabled={logsPage >= totalLogPages - 1}
                        className="flex h-8 w-8 items-center justify-center rounded-md border transition-colors disabled:opacity-30"
                        style={{ borderColor: C.borderSubtle, color: C.textSecondary }}
                        aria-label={t('common.next')}
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
