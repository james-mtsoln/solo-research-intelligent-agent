import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  Newspaper,
  Brain,
  Target,
  Play,
  Pencil,
  MoreVertical,
  Search,
  ExternalLink,
  TrendingUp,
  Users,
  ShieldAlert,
  Zap,
  CheckSquare,
  Square,
  ChevronRight,
  Clock,
  FileText,
  Globe,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';

/* ------------------------------------------------------------------ */
/*  Design Tokens (mtsoln.com dark theme)                              */
/* ------------------------------------------------------------------ */

const COLORS = {
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
};

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PlanStatus = 'Active' | 'Completed' | 'Planned';

interface Plan {
  id: string;
  name: string;
  status: PlanStatus;
  weekNumber: number;
  articleCount: number;
  sourceCount: number;
  lastUpdated: Date;
  analysesCount: number;
}

interface NewsArticle {
  id: string;
  source: string;
  headline: string;
  summary: string;
  tags: string[];
  timestamp: Date;
  unread: boolean;
  url: string;
}

interface InsightCard {
  id: string;
  type: 'market' | 'competitor' | 'risk' | 'opportunity';
  titleKey: string;
  icon: typeof TrendingUp;
  items: string[];
}

interface CompetitorEntry {
  company: string;
  activity: string;
  impact: 'High' | 'Medium' | 'Low';
}

interface RiskItem {
  risk: string;
  severity: 'High' | 'Medium' | 'Low';
  mitigation: string;
}

interface Milestone {
  week: number;
  title: string;
  description: string;
  status: 'completed' | 'active' | 'pending';
  deliverables: { text: string; done: boolean }[];
}

interface StrategicPillar {
  title: string;
  description: string;
}

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const PLAN: Plan = {
  id: '1',
  name: 'Autonomous Vehicle Market Entry',
  status: 'Active',
  weekNumber: 22,
  articleCount: 147,
  sourceCount: 14,
  lastUpdated: new Date(Date.now() - 35 * 60 * 1000),
  analysesCount: 8,
};

const NEWS_ARTICLES: NewsArticle[] = [
  { id: '1', source: 'TechCrunch', headline: 'Waymo expands robotaxi service to Los Angeles and San Francisco Bay Area', summary: 'Alphabet\'s autonomous driving unit announced a major expansion, adding 15 new cities to its service map and doubling its active fleet to 100,000 vehicles...', tags: ['Waymo', 'Robotaxi', 'Expansion'], timestamp: new Date(Date.now() - 12 * 60 * 1000), unread: true, url: 'https://techcrunch.com' },
  { id: '2', source: 'Reuters', headline: 'Tesla FSD v12.5 rolls out to 2 million vehicles with end-to-end neural networks', summary: 'The latest Full Self-Driving update replaces over 300,000 lines of C++ code with a single neural network, improving city driving performance by 40%...', tags: ['Tesla', 'FSD', 'Neural Networks'], timestamp: new Date(Date.now() - 28 * 60 * 1000), unread: true, url: 'https://reuters.com' },
  { id: '3', source: 'The Verge', headline: 'Cruise resumes operations in Phoenix after nine-month safety overhaul', summary: 'GM\'s autonomous vehicle subsidiary is back on public roads with a smaller fleet, new safety drivers, and updated collision-avoidance systems...', tags: ['Cruise', 'GM', 'Safety'], timestamp: new Date(Date.now() - 45 * 60 * 1000), unread: true, url: 'https://theverge.com' },
  { id: '4', source: 'Ars Technica', headline: 'NVIDIA DRIVE Thor platform achieves ISO 26262 ASIL-D safety certification', summary: 'The 2,000 TOPS compute platform becomes the first SoC to receive the highest automotive safety rating, clearing the way for production vehicles in 2025...', tags: ['NVIDIA', 'DRIVE Thor', 'Safety'], timestamp: new Date(Date.now() - 62 * 60 * 1000), unread: false, url: 'https://arstechnica.com' },
  { id: '5', source: 'TechCrunch', headline: 'Aurora Innovation partners with Continental for mass production of AV hardware', summary: 'The strategic collaboration aims to produce the Aurora Driver hardware kit at scale, targeting 100,000 units annually by 2027...', tags: ['Aurora', 'Continental', 'Manufacturing'], timestamp: new Date(Date.now() - 95 * 60 * 1000), unread: false, url: 'https://techcrunch.com' },
  { id: '6', source: 'Reuters', headline: 'China grants first L4 autonomous driving permits to Baidu and Pony.ai', summary: 'Regulatory approval for fully driverless commercial operations marks a milestone for the Chinese AV industry, allowing unmanned robotaxis in Beijing...', tags: ['Baidu', 'Pony.ai', 'Regulation'], timestamp: new Date(Date.now() - 130 * 60 * 1000), unread: false, url: 'https://reuters.com' },
  { id: '7', source: 'The Verge', headline: 'Apple Car project shifts focus to autonomous AI platform for existing vehicles', summary: 'Project Titan has reportedly pivoted from building a car to developing a consumer-facing AI driving assistant for third-party vehicles...', tags: ['Apple', 'Project Titan', 'AI'], timestamp: new Date(Date.now() - 180 * 60 * 1000), unread: false, url: 'https://theverge.com' },
  { id: '8', source: 'Ars Technica', headline: 'NHTSA opens investigation into 600,000 Tesla vehicles over FSD crash reports', summary: 'The federal safety regulator is examining 22 crashes allegedly involving Full Self-Driving, including one fatal incident in low-visibility conditions...', tags: ['NHTSA', 'Tesla', 'Investigation'], timestamp: new Date(Date.now() - 240 * 60 * 1000), unread: false, url: 'https://arstechnica.com' },
  { id: '9', source: 'TechCrunch', headline: 'Mobileye announces new EyeQ Ultra chip with 176 TOPS for autonomous driving', summary: 'Intel\'s autonomous driving unit unveiled its most powerful processor yet, designed for L4 autonomy with a 35W power envelope...', tags: ['Mobileye', 'EyeQ', 'Chips'], timestamp: new Date(Date.now() - 300 * 60 * 1000), unread: false, url: 'https://techcrunch.com' },
  { id: '10', source: 'Reuters', headline: 'Uber and Waymo deepen partnership with multi-year autonomous delivery deal', summary: 'The expanded collaboration will deploy Waymo\'s Driver technology across Uber\'s delivery network, starting in Austin and Atlanta...', tags: ['Uber', 'Waymo', 'Delivery'], timestamp: new Date(Date.now() - 360 * 60 * 1000), unread: false, url: 'https://reuters.com' },
  { id: '11', source: 'The Verge', headline: 'Mercedes-Benz receives California approval for Level 3 autonomous driving', summary: 'The Drive Pilot system can now legally take control on designated highways, allowing drivers to take their eyes off the road...', tags: ['Mercedes', 'Drive Pilot', 'L3'], timestamp: new Date(Date.now() - 420 * 60 * 1000), unread: false, url: 'https://theverge.com' },
  { id: '12', source: 'Ars Technica', headline: 'MIT study finds autonomous vehicles could reduce urban traffic by 30%', summary: 'Researchers simulated traffic patterns in Boston and found that a 50% AV adoption rate would significantly reduce congestion and emissions...', tags: ['MIT', 'Traffic', 'Study'], timestamp: new Date(Date.now() - 480 * 60 * 1000), unread: false, url: 'https://arstechnica.com' },
];

function useInsightCards(): InsightCard[] {
  return [
    {
      id: '1', type: 'market', titleKey: 'planDetail.aiAnalysis.marketTrends', icon: TrendingUp,
      items: [
        'Robotaxi deployments accelerating: 40+ cities globally now have commercial AV services, up from 15 in 2023',
        'OEM partnerships dominating: Traditional automakers partnering with tech firms rather than building in-house',
        'Regulatory divergence: US taking state-by-state approach while EU and China move toward federal frameworks',
      ],
    },
    {
      id: '2', type: 'competitor', titleKey: 'planDetail.aiAnalysis.competitorActivity', icon: Users,
      items: [
        'Waymo leads in miles-driven with 20M+ autonomous miles in 2024, 3x nearest competitor',
        'Tesla leveraging consumer fleet data advantage with 1B+ miles of FSD beta data collected',
        'Chinese AV companies (Baidu, Pony.ai, WeRide) gaining regulatory advantages in home market',
      ],
    },
    {
      id: '3', type: 'risk', titleKey: 'planDetail.aiAnalysis.riskAssessment', icon: ShieldAlert,
      items: [
        'High-severity safety incidents could trigger broad regulatory shutdowns across markets',
        'Cybersecurity vulnerabilities in connected AV fleets represent systemic risk',
        'Public trust remains fragile: 68% of consumers still express concern about AV safety',
      ],
    },
    {
      id: '4', type: 'opportunity', titleKey: 'planDetail.aiAnalysis.strategicOpportunities', icon: Zap,
      items: [
        'Last-mile delivery AV market projected to reach $84B by 2030, less regulated than passenger transport',
        'B2B industrial autonomy (mining, agriculture, logistics) offers near-term revenue with simpler operational domains',
        'AV data monetization: High-definition mapping and traffic data valuable to cities and insurers',
      ],
    },
  ];
}

const COMPETITORS: CompetitorEntry[] = [
  { company: 'Waymo (Alphabet)', activity: 'Expanded to 15 new cities, 100K vehicle fleet', impact: 'High' },
  { company: 'Tesla', activity: 'FSD v12.5 rollout to 2M vehicles, end-to-end NN', impact: 'High' },
  { company: 'Cruise (GM)', activity: 'Resumed Phoenix operations after safety overhaul', impact: 'Medium' },
  { company: 'Baidu', activity: 'Received Beijing L4 permits for driverless operation', impact: 'High' },
  { company: 'Aurora', activity: 'Continental partnership for 100K units/year by 2027', impact: 'Medium' },
];

const SENTIMENT_DATA = [
  { nameKey: 'positive', value: 62, color: COLORS.statusSuccess },
  { nameKey: 'neutral', value: 25, color: COLORS.statusWarning },
  { nameKey: 'negative', value: 13, color: COLORS.statusError },
];

const MILESTONES: Milestone[] = [
  {
    week: 22, title: 'Market Landscape Analysis',
    description: 'Complete competitive analysis and regulatory mapping for target markets',
    status: 'completed',
    deliverables: [
      { text: 'Competitive matrix for top 10 AV players', done: true },
      { text: 'Regulatory pathway analysis (US, EU, China)', done: true },
      { text: 'Patent landscape review', done: true },
    ],
  },
  {
    week: 23, title: 'Technology Assessment',
    description: 'Evaluate sensor stack, compute platforms, and software stack options',
    status: 'active',
    deliverables: [
      { text: 'LiDAR vs camera-only trade-off analysis', done: true },
      { text: 'Compute platform comparison (NVIDIA vs Mobileye vs custom)', done: false },
      { text: 'Simulation environment selection', done: false },
    ],
  },
  {
    week: 24, title: 'Partnership Strategy',
    description: 'Identify and initiate discussions with potential technology partners',
    status: 'pending',
    deliverables: [
      { text: 'Partner shortlist with capability scoring', done: false },
      { text: 'Initial outreach to top 5 candidates', done: false },
      { text: 'NDA and term sheet templates', done: false },
    ],
  },
  {
    week: 25, title: 'Pilot Program Design',
    description: 'Design controlled pilot program for technology validation',
    status: 'pending',
    deliverables: [
      { text: 'Pilot scope and success criteria definition', done: false },
      { text: 'Geofenced test route identification', done: false },
      { text: 'Safety driver training program', done: false },
    ],
  },
  {
    week: 26, title: 'Regulatory Engagement',
    description: 'Begin formal regulatory engagement in target jurisdictions',
    status: 'pending',
    deliverables: [
      { text: 'DMV autonomous testing permit applications', done: false },
      { text: 'Safety self-assessment documentation', done: false },
      { text: 'Third-party safety audit engagement', done: false },
    ],
  },
  {
    week: 27, title: 'Investment Proposal',
    description: 'Prepare Series A investment proposal based on findings',
    status: 'pending',
    deliverables: [
      { text: 'Market size and TAM analysis', done: false },
      { text: '5-year financial projections', done: false },
      { text: 'Investor pitch deck', done: false },
    ],
  },
];

const RISKS: RiskItem[] = [
  { risk: 'Regulatory Delay', severity: 'High', mitigation: 'Engage early with regulators; pursue sandbox exemptions' },
  { risk: 'Technology Partnership Failure', severity: 'Medium', mitigation: 'Maintain relationships with 2-3 backup vendors' },
  { risk: 'Competitive Price War', severity: 'Medium', mitigation: 'Focus on niche B2B applications with higher margins' },
  { risk: 'Public Safety Incident', severity: 'High', mitigation: 'Conservative ODD definition; extensive simulation testing' },
  { risk: 'Cybersecurity Breach', severity: 'Medium', mitigation: 'ISO/SAE 21434 compliance from day one' },
];

const STRATEGIC_PILLARS: StrategicPillar[] = [
  { title: 'Market Entry', description: 'Enter high-value autonomous driving segments with differentiated positioning' },
  { title: 'Product Development', description: 'Build modular AV stack adaptable to multiple vehicle platforms' },
  { title: 'Partnership', description: 'Strategic alliances with OEMs and Tier-1 suppliers for scale' },
];

const EXECUTIVE_SUMMARY = [
  'The autonomous vehicle market is entering a commercial inflection point, with robotaxi deployments in 40+ cities and major OEM partnerships reshaping the competitive landscape.',
  'Waymo and Tesla maintain clear leadership positions, but regulatory divergence between markets creates opportunities for well-positioned entrants.',
  'B2B and industrial autonomy segments offer lower regulatory barriers and faster paths to revenue compared to passenger robotaxi services.',
  'Safety and cybersecurity remain critical risk factors; conservative operational design domains and robust testing regimes are essential for market entry.',
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCount(n: number): string {
  return n.toLocaleString();
}

function useStatusConfig() {
  return {
    Active: {
      bg: 'rgba(34,197,94,0.12)',
      text: COLORS.statusSuccess,
      border: 'rgba(34,197,94,0.25)',
    },
    Completed: {
      bg: 'rgba(59,130,246,0.12)',
      text: COLORS.statusInfo,
      border: 'rgba(59,130,246,0.25)',
    },
    Planned: {
      bg: 'rgba(245,158,11,0.12)',
      text: COLORS.statusWarning,
      border: 'rgba(245,158,11,0.25)',
    },
  };
}

const SEVERITY_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  High: {
    bg: 'rgba(239,68,68,0.12)',
    text: COLORS.statusError,
    border: 'rgba(239,68,68,0.25)',
  },
  Medium: {
    bg: 'rgba(245,158,11,0.12)',
    text: COLORS.statusWarning,
    border: 'rgba(245,158,11,0.25)',
  },
  Low: {
    bg: 'rgba(59,130,246,0.12)',
    text: COLORS.statusInfo,
    border: 'rgba(59,130,246,0.25)',
  },
};

const IMPACT_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  High: {
    bg: 'rgba(239,68,68,0.12)',
    text: COLORS.statusError,
    border: 'rgba(239,68,68,0.25)',
  },
  Medium: {
    bg: 'rgba(245,158,11,0.12)',
    text: COLORS.statusWarning,
    border: 'rgba(245,158,11,0.25)',
  },
  Low: {
    bg: 'rgba(59,130,246,0.12)',
    text: COLORS.statusInfo,
    border: 'rgba(59,130,246,0.25)',
  },
};

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const cardStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1, y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

const slideFromLeft = {
  hidden: { opacity: 0, x: -30 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const slideFromRight = {
  hidden: { opacity: 0, x: 30 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

/* ==================================================================== */
/*  MAIN COMPONENT                                                     */
/* ==================================================================== */

export default function PlanDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const plan = PLAN; // In real app, fetch by id
  const STATUS_CONFIG = useStatusConfig();
  const statusCfg = STATUS_CONFIG[plan.status];

  const [activeTab, setActiveTab] = useState('news');

  return (
    <div
      className="min-h-full"
      style={{ backgroundColor: COLORS.bgPrimary, fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* ====== HEADER ====== */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="px-4 pb-4 pt-6 sm:px-6 lg:px-10"
      >
        {/* Back button */}
        <button
          onClick={() => navigate('/plans')}
          className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
          style={{ color: COLORS.accentCyan }}
        >
          <ArrowLeft size={14} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {t('planDetail.backToPlans')}
          </span>
        </button>

        {/* Title row */}
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1
              className="font-extrabold leading-[1.1] tracking-[-0.02em]"
              style={{
                fontSize: 'clamp(1.75rem, 4vw, 3rem)',
                fontWeight: 800,
                color: COLORS.textPrimary,
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              {plan.name}
            </h1>
            {/* Status badge */}
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number], delay: 0.2 }}
              className="rounded-full px-3 py-1 text-[0.6875rem] font-medium uppercase leading-none tracking-[0.08em]"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                backgroundColor: statusCfg.bg,
                color: statusCfg.text,
                border: `1px solid ${statusCfg.border}`,
              }}
            >
              {plan.status}
            </motion.span>
            {/* Week badge */}
            <span
              className="rounded-full px-3 py-1 text-[0.6875rem] font-medium uppercase leading-none tracking-[0.08em]"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                backgroundColor: COLORS.bgElevated,
                color: COLORS.textTertiary,
                border: `1px solid ${COLORS.borderSubtle}`,
              }}
            >
              {t('common.week')} {plan.weekNumber}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              className="gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: COLORS.accentBlue }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS.accentBlueHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.accentBlue)}
            >
              <Play size={14} />
              {t('planDetail.runAnalysis')}
            </Button>
            <Button
              variant="outline"
              aria-label={t('planDetail.editPlan')}
              className="rounded-full border p-2 transition-colors"
              style={{ borderColor: COLORS.borderSubtle, backgroundColor: 'transparent', color: COLORS.textSecondary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.bgElevated;
                e.currentTarget.style.borderColor = COLORS.borderHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = COLORS.borderSubtle;
              }}
            >
              <Pencil size={16} />
            </Button>
            <Button
              variant="outline"
              aria-label={t('planDetail.moreOptions')}
              className="rounded-full border p-2 transition-colors"
              style={{ borderColor: COLORS.borderSubtle, backgroundColor: 'transparent', color: COLORS.textSecondary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.bgElevated;
                e.currentTarget.style.borderColor = COLORS.borderHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = COLORS.borderSubtle;
              }}
            >
              <MoreVertical size={16} />
            </Button>
          </div>
        </div>

        {/* Meta row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-b pb-4"
          style={{ borderColor: COLORS.borderSubtle }}
        >
          {[
            { id: 'articles', icon: FileText, value: formatCount(plan.articleCount), label: t('planDetail.meta.articles') },
            { id: 'sources', icon: Globe, value: String(plan.sourceCount), label: t('planDetail.meta.sources') },
            { id: 'updated', icon: Clock, value: `${formatDistanceToNow(plan.lastUpdated, { addSuffix: false })} ${t('common.ago')}`, label: '' },
            { id: 'analyses', icon: Brain, value: String(plan.analysesCount), label: t('planDetail.meta.analyses') },
          ].map((meta, i) => (
            <motion.div
              key={meta.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.25 + i * 0.05 }}
              className="flex items-center gap-1.5"
            >
              <meta.icon size={14} style={{ color: COLORS.textTertiary }} />
              <span
                className="text-[0.8125rem] font-medium leading-[1.4]"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: COLORS.textPrimary }}
              >
                {meta.value}
              </span>
              {meta.label && (
                <span
                  className="text-[0.8125rem] leading-[1.4]"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: COLORS.textTertiary }}
                >
                  {meta.label}
                </span>
              )}
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* ====== TABS ====== */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div
          className="sticky top-0 z-10 border-b px-4 sm:px-6 lg:px-10"
          style={{ backgroundColor: COLORS.bgSurface, borderColor: COLORS.borderSubtle }}
        >
          <TabsList className="h-auto gap-1 bg-transparent p-0">
            {[
              { value: 'news', labelKey: 'planDetail.tabs.newsFeed', icon: Newspaper },
              { value: 'analysis', labelKey: 'planDetail.tabs.aiAnalysis', icon: Brain },
              { value: 'plan', labelKey: 'planDetail.tabs.businessPlan', icon: Target },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="relative gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium transition-all data-[state=active]:border-b-2 data-[state=active]:font-semibold"
                style={{
                  color: COLORS.textSecondary,
                  borderColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.value) {
                    e.currentTarget.style.color = COLORS.textPrimary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.value) {
                    e.currentTarget.style.color = COLORS.textSecondary;
                  }
                }}
              >
                <tab.icon size={16} />
                <span>{t(tab.labelKey)}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Override active tab styling via CSS-in-JS on the trigger elements */}
        <style>{`
          [data-state="active"] {
            color: ${COLORS.accentCyan} !important;
            border-bottom-color: ${COLORS.accentCyan} !important;
          }
        `}</style>

        {/* ====== TAB 1: NEWS FEED ====== */}
        <AnimatePresence mode="wait">
          <TabsContent value="news" className="mt-0">
            <motion.div
              key="news-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <NewsFeedTab articles={NEWS_ARTICLES} />
            </motion.div>
          </TabsContent>
        </AnimatePresence>

        {/* ====== TAB 2: AI ANALYSIS ====== */}
        <AnimatePresence mode="wait">
          <TabsContent value="analysis" className="mt-0">
            <motion.div
              key="analysis-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <AIAnalysisTab />
            </motion.div>
          </TabsContent>
        </AnimatePresence>

        {/* ====== TAB 3: BUSINESS PLAN ====== */}
        <AnimatePresence mode="wait">
          <TabsContent value="plan" className="mt-0">
            <motion.div
              key="plan-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <BusinessPlanTab />
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}

/* ==================================================================== */
/*  NEWS FEED TAB                                                      */
/* ==================================================================== */

function NewsFeedTab({ articles }: { articles: NewsArticle[] }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [dateRange, setDateRange] = useState('week');
  const [visibleCount, setVisibleCount] = useState(8);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(8);
  }, [search, sourceFilter, dateRange]);

  const filtered = useMemo(() => {
    let result = [...articles];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) => a.headline.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q)
      );
    }
    if (sourceFilter !== 'all') {
      result = result.filter((a) => a.source === sourceFilter);
    }
    if (dateRange !== 'all') {
      const days = dateRange === 'today' ? 1 : dateRange === '3days' ? 3 : 7;
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      result = result.filter((a) => a.timestamp >= cutoff);
    }
    return result;
  }, [articles, search, sourceFilter, dateRange]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <div className="px-4 py-5 sm:px-6 lg:px-10">
      {/* Filter bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-5 flex flex-wrap gap-3"
      >
        {/* Search */}
        <div className="relative flex-1 basis-full sm:basis-auto">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textTertiary }} />
          <Input
            placeholder={t('planDetail.newsFeed.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border pl-9 text-sm sm:w-[280px]"
            style={{
              backgroundColor: COLORS.bgSurface,
              borderColor: COLORS.borderSubtle,
              color: COLORS.textPrimary,
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          />
        </div>

        {/* Source dropdown */}
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger
            className="h-10 w-[160px] rounded-lg border text-sm"
            style={{
              backgroundColor: COLORS.bgSurface,
              borderColor: COLORS.borderSubtle,
              color: COLORS.textPrimary,
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          >
            <SelectValue placeholder={t('common.all')} />
          </SelectTrigger>
          <SelectContent style={{ backgroundColor: COLORS.bgElevated, borderColor: COLORS.borderSubtle }}>
            {[t('common.all'), 'TechCrunch', 'Reuters', 'Ars Technica', 'The Verge'].map((s) => (
              <SelectItem
                key={s.toLowerCase().replace(/\s/g, '')}
                value={s.toLowerCase().replace(/\s/g, '')}
                className="text-sm"
                style={{ color: COLORS.textPrimary }}
              >
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date range buttons */}
        <div className="flex gap-1 rounded-lg border p-[2px]" style={{ borderColor: COLORS.borderSubtle, backgroundColor: COLORS.bgSurface }}>
          {[
            { value: 'today', label: t('common.today') },
            { value: '3days', label: `3 ${t('common.week')}` },
            { value: 'week', label: t('common.week') },
            { value: 'all', label: t('common.all') },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDateRange(opt.value)}
              className="rounded-md px-3 py-1.5 text-[0.75rem] font-medium transition-colors"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                backgroundColor: dateRange === opt.value ? COLORS.accentBlue : 'transparent',
                color: dateRange === opt.value ? '#fff' : COLORS.textSecondary,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Article cards */}
      <motion.div
        variants={cardStagger}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-3"
      >
        {visible.map((article) => (
          <motion.article
            key={article.id}
            variants={fadeUp}
            className="group relative rounded-lg border p-4 transition-all"
            style={{
              backgroundColor: COLORS.bgSurface,
              borderColor: article.unread ? COLORS.accentCyan : COLORS.borderSubtle,
              borderLeftWidth: article.unread ? '2px' : '1px',
              boxShadow: article.unread ? `0 0 0 1px ${COLORS.accentCyanGlow}` : 'none',
            }}
            onMouseEnter={(e) => {
              if (!article.unread) {
                e.currentTarget.style.borderColor = COLORS.borderHover;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!article.unread) {
                e.currentTarget.style.borderColor = COLORS.borderSubtle;
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {/* Top row: source + time */}
            <div className="flex items-center gap-2 text-[0.75rem]" style={{ color: COLORS.textTertiary, fontFamily: "'JetBrains Mono', monospace" }}>
              <span className="font-medium uppercase tracking-wide">{article.source}</span>
              <span style={{ color: COLORS.textMuted }}>&middot;</span>
              <span>{formatDistanceToNow(article.timestamp, { addSuffix: true })}</span>
            </div>

            {/* Headline */}
            <h3
              className="mt-2 line-clamp-2 cursor-pointer font-medium leading-[1.4] transition-colors group-hover:underline"
              style={{ fontSize: '0.9375rem', color: COLORS.textPrimary, fontWeight: 500 }}
              onClick={() => window.open(article.url, '_blank', 'noopener,noreferrer')}
            >
              {article.headline}
              <ExternalLink size={12} className="ml-1.5 inline-block opacity-0 transition-opacity group-hover:opacity-100" style={{ color: COLORS.accentCyan }} />
            </h3>

            {/* AI Summary */}
            <p
              className="mt-1.5 line-clamp-2 text-[0.875rem] italic leading-[1.5]"
              style={{ color: COLORS.textSecondary }}
            >
              <span style={{ color: COLORS.accentCyan }}>AI:</span> {article.summary}
            </p>

            {/* Tags */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full px-2.5 py-[3px] text-[0.6875rem] font-medium uppercase tracking-wide"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    backgroundColor: 'rgba(56,189,248,0.1)',
                    color: COLORS.accentCyan,
                    border: '1px solid rgba(56,189,248,0.2)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.article>
        ))}
      </motion.div>

      {/* Load More */}
      {visibleCount < filtered.length && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center py-6"
        >
          <Button
            variant="outline"
            onClick={() => setVisibleCount((c) => c + 4)}
            className="gap-2 rounded-full border px-6 py-2 text-sm font-medium transition-colors"
            style={{
              borderColor: COLORS.borderSubtle,
              backgroundColor: 'transparent',
              color: COLORS.textSecondary,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.bgElevated;
              e.currentTarget.style.borderColor = COLORS.borderHover;
              e.currentTarget.style.color = COLORS.textPrimary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = COLORS.borderSubtle;
              e.currentTarget.style.color = COLORS.textSecondary;
            }}
          >
            {t('planDetail.newsFeed.loadMore')}
          </Button>
        </motion.div>
      )}
    </div>
  );
}

/* ==================================================================== */
/*  AI ANALYSIS TAB                                                    */
/* ==================================================================== */

function AIAnalysisTab() {
  const { t } = useTranslation();
  const INSIGHT_CARDS = useInsightCards();

  return (
    <div className="px-4 py-5 sm:px-6 lg:px-10">
      <motion.div
        variants={cardStagger}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-5"
      >
        {/* Executive Summary */}
        <motion.div
          variants={fadeUp}
          className="rounded-lg border p-5"
          style={{
            backgroundColor: COLORS.bgSurface,
            borderColor: COLORS.accentCyan,
            boxShadow: `0 0 20px ${COLORS.accentCyanGlow}`,
          }}
        >
          <div className="mb-3 flex items-center gap-2">
            <Brain size={18} style={{ color: COLORS.accentCyan }} />
            <h2
              className="text-lg font-bold leading-[1.2]"
              style={{ color: COLORS.textPrimary, fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              {t('planDetail.aiAnalysis.executiveSummary')}
            </h2>
          </div>
          <ul className="space-y-2">
            {EXECUTIVE_SUMMARY.map((point, i) => (
              <li key={i} className="flex gap-2 text-[0.9375rem] leading-[1.6]" style={{ color: COLORS.textSecondary }}>
                <ChevronRight size={16} className="mt-1 shrink-0" style={{ color: COLORS.accentCyan }} />
                {point}
              </li>
            ))}
          </ul>
          <p
            className="mt-3 text-[0.75rem]"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: COLORS.textTertiary }}
          >
            {t('planDetail.aiAnalysis.generated')}: {new Date().toISOString().slice(0, 10)} {new Date().toLocaleTimeString()}
          </p>
        </motion.div>

        {/* 4 Insight Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {INSIGHT_CARDS.map((card) => (
            <motion.div
              key={card.id}
              variants={fadeUp}
              className="rounded-lg border p-5 transition-all"
              style={{ backgroundColor: COLORS.bgSurface, borderColor: COLORS.borderSubtle }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLORS.borderHover; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = COLORS.borderSubtle; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div className="mb-3 flex items-center gap-2">
                <card.icon size={18} style={{ color: card.type === 'market' || card.type === 'competitor' ? COLORS.accentCyan : card.type === 'risk' ? COLORS.statusWarning : COLORS.statusSuccess }} />
                <h3 className="text-base font-semibold" style={{ color: COLORS.textPrimary }}>{t(card.titleKey)}</h3>
              </div>
              {card.type === 'competitor' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[0.8125rem]">
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${COLORS.borderSubtle}` }}>
                        <th className="pb-2 pr-3 font-medium" style={{ color: COLORS.textTertiary, fontFamily: "'JetBrains Mono', monospace" }}>{t('planDetail.aiAnalysis.company')}</th>
                        <th className="pb-2 pr-3 font-medium" style={{ color: COLORS.textTertiary, fontFamily: "'JetBrains Mono', monospace" }}>{t('planDetail.aiAnalysis.activity')}</th>
                        <th className="pb-2 font-medium" style={{ color: COLORS.textTertiary, fontFamily: "'JetBrains Mono', monospace" }}>{t('planDetail.aiAnalysis.impact')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {COMPETITORS.map((c, i) => {
                        const cfg = IMPACT_CONFIG[c.impact];
                        return (
                          <tr key={i} style={{ borderBottom: i < COMPETITORS.length - 1 ? `1px solid ${COLORS.borderSubtle}` : 'none' }}>
                            <td className="py-2 pr-3 font-medium" style={{ color: COLORS.textPrimary }}>{c.company}</td>
                            <td className="py-2 pr-3" style={{ color: COLORS.textSecondary }}>{c.activity}</td>
                            <td className="py-2">
                              <span
                                className="rounded-full px-2 py-[2px] text-[0.6875rem] font-medium uppercase tracking-wide"
                                style={{
                                  fontFamily: "'JetBrains Mono', monospace",
                                  backgroundColor: cfg.bg,
                                  color: cfg.text,
                                  border: `1px solid ${cfg.border}`,
                                }}
                              >
                                {c.impact}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <ul className="space-y-2">
                  {card.items.map((item, i) => (
                    <li key={i} className="flex gap-2 text-[0.875rem] leading-[1.5]" style={{ color: COLORS.textSecondary }}>
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: card.type === 'market' ? COLORS.accentCyan : card.type === 'risk' ? COLORS.statusWarning : COLORS.statusSuccess }} />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          ))}
        </div>

        {/* Sentiment Overview */}
        <motion.div
          variants={fadeUp}
          className="rounded-lg border p-5"
          style={{ backgroundColor: COLORS.bgSurface, borderColor: COLORS.borderSubtle }}
        >
          <h3 className="mb-4 text-base font-semibold" style={{ color: COLORS.textPrimary }}>{t('planDetail.aiAnalysis.executiveSummary')}</h3>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <div className="relative h-[180px] w-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={SENTIMENT_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {SENTIMENT_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold" style={{ color: COLORS.statusSuccess, fontFamily: "'JetBrains Mono', monospace" }}>
                  62%
                </span>
                <span className="text-[0.6875rem] uppercase tracking-wide" style={{ color: COLORS.textTertiary, fontFamily: "'JetBrains Mono', monospace" }}>
                  {t('common.active')}
                </span>
              </div>
            </div>
            {/* Legend */}
            <div className="flex flex-col gap-2">
              {SENTIMENT_DATA.map((entry) => (
                <div key={entry.nameKey} className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm font-medium" style={{ color: COLORS.textSecondary }}>{entry.nameKey}</span>
                  <span
                    className="text-sm font-bold"
                    style={{ color: COLORS.textPrimary, fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {entry.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Regenerate button */}
        <motion.div variants={fadeUp} className="flex justify-center">
          <Button
            className="gap-2 rounded-full px-6 py-2 text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: COLORS.accentBlue }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS.accentBlueHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.accentBlue)}
          >
            <RefreshCw size={14} />
            {t('planDetail.aiAnalysis.regenerate')}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ==================================================================== */
/*  BUSINESS PLAN TAB                                                  */
/* ==================================================================== */

function BusinessPlanTab() {
  const { t } = useTranslation();

  return (
    <div className="px-4 py-5 sm:px-6 lg:px-10">
      <motion.div
        variants={cardStagger}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-5"
      >
        {/* Plan Overview Card */}
        <motion.div
          variants={fadeUp}
          className="rounded-lg border p-5"
          style={{ backgroundColor: COLORS.bgSurface, borderColor: COLORS.borderSubtle }}
        >
          <h2
            className="mb-2 text-xl font-bold leading-[1.2]"
            style={{ color: COLORS.textPrimary, fontFamily: "'Inter', system-ui, sans-serif" }}
          >
            {t('planDetail.businessPlan.sixWeekPlan')}
          </h2>
          <p className="mb-4 text-[0.9375rem] leading-[1.6]" style={{ color: COLORS.textSecondary }}>
            {t('planDetail.businessPlan.planDescription')}
          </p>

          {/* Strategic Pillars */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {STRATEGIC_PILLARS.map((pillar, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="rounded-lg border p-4 transition-all"
                style={{ backgroundColor: COLORS.bgElevated, borderColor: COLORS.borderSubtle }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLORS.borderHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = COLORS.borderSubtle; }}
              >
                <h4 className="mb-1 text-sm font-semibold" style={{ color: COLORS.accentCyan }}>{pillar.title}</h4>
                <p className="text-[0.8125rem] leading-[1.5]" style={{ color: COLORS.textSecondary }}>{pillar.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Timeline / Milestones */}
        <motion.div
          variants={fadeUp}
          className="rounded-lg border p-5"
          style={{ backgroundColor: COLORS.bgSurface, borderColor: COLORS.borderSubtle }}
        >
          <h3 className="mb-5 text-base font-semibold" style={{ color: COLORS.textPrimary }}>{t('planDetail.businessPlan.milestones')}</h3>

          <div className="relative">
            {/* Vertical line */}
            <div
              className="absolute left-4 top-0 hidden h-full w-[1px] sm:left-1/2 sm:block sm:-translate-x-1/2"
              style={{ backgroundColor: COLORS.borderSubtle }}
            />
            {/* Mobile vertical line */}
            <div
              className="absolute left-4 top-0 h-full w-[1px] sm:hidden"
              style={{ backgroundColor: COLORS.borderSubtle }}
            />

            <div className="flex flex-col gap-6">
              {MILESTONES.map((milestone, i) => {
                const isEven = i % 2 === 0;
                const isCompleted = milestone.status === 'completed';
                const isActive = milestone.status === 'active';

                return (
                  <motion.div
                    key={milestone.week}
                    variants={i % 2 === 0 ? slideFromLeft : slideFromRight}
                    initial="hidden"
                    animate="show"
                    className={`relative flex items-start gap-4 sm:gap-0 ${
                      isEven ? 'sm:flex-row' : 'sm:flex-row-reverse'
                    }`}
                  >
                    {/* Timeline dot */}
                    <div className="absolute left-4 top-5 z-10 h-3 w-3 -translate-x-1/2 rounded-full border-2 sm:left-1/2"
                      style={{
                        backgroundColor: isCompleted ? COLORS.statusSuccess : isActive ? COLORS.accentCyan : COLORS.bgPrimary,
                        borderColor: isCompleted ? COLORS.statusSuccess : isActive ? COLORS.accentCyan : COLORS.borderHover,
                      }}
                    />

                    {/* Content card */}
                    <div className={`ml-10 w-full sm:ml-0 ${isEven ? 'sm:pr-[52%] sm:pl-0' : 'sm:pl-[52%] sm:pr-0'}`}>
                      <div
                        className="rounded-lg border p-4 transition-all"
                        style={{
                          backgroundColor: isActive ? 'rgba(56,189,248,0.05)' : COLORS.bgElevated,
                          borderColor: isActive ? COLORS.accentCyan : COLORS.borderSubtle,
                        }}
                      >
                        {/* Week badge */}
                        <span
                          className="mb-2 inline-block rounded-full px-2.5 py-[3px] text-[0.6875rem] font-medium uppercase tracking-wide"
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            backgroundColor: isActive ? 'rgba(56,189,248,0.12)' : COLORS.bgSurface,
                            color: isActive ? COLORS.accentCyan : COLORS.textTertiary,
                            border: `1px solid ${isActive ? 'rgba(56,189,248,0.25)' : COLORS.borderSubtle}`,
                          }}
                        >
                          W{milestone.week}
                        </span>

                        {/* Title */}
                        <h4 className="mb-1 text-sm font-semibold" style={{ color: COLORS.textPrimary, fontWeight: 600 }}>
                          {milestone.title}
                        </h4>

                        {/* Description */}
                        <p className="mb-3 text-[0.8125rem] leading-[1.5]" style={{ color: COLORS.textSecondary }}>
                          {milestone.description}
                        </p>

                        {/* Deliverables */}
                        <div className="space-y-1.5">
                          {milestone.deliverables.map((d, di) => (
                            <div key={di} className="flex items-start gap-2">
                              {d.done ? (
                                <CheckSquare size={14} className="mt-0.5 shrink-0" style={{ color: COLORS.statusSuccess }} />
                              ) : (
                                <Square size={14} className="mt-0.5 shrink-0" style={{ color: COLORS.textMuted }} />
                              )}
                              <span
                                className="text-[0.8125rem] leading-[1.4]"
                                style={{ color: d.done ? COLORS.textPrimary : COLORS.textSecondary }}
                              >
                                {d.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Risk & Mitigation Panel */}
        <motion.div
          variants={fadeUp}
          className="rounded-lg border p-5"
          style={{ backgroundColor: COLORS.bgSurface, borderColor: COLORS.borderSubtle }}
        >
          <div className="mb-4 flex items-center gap-2">
            <ShieldAlert size={18} style={{ color: COLORS.statusWarning }} />
            <h3 className="text-base font-semibold" style={{ color: COLORS.textPrimary }}>{t('planDetail.businessPlan.riskPanel')}</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[0.8125rem]">
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.borderSubtle}` }}>
                  <th className="pb-3 pr-4 font-medium" style={{ color: COLORS.textTertiary, fontFamily: "'JetBrains Mono', monospace" }}>{t('planDetail.aiAnalysis.risk')}</th>
                  <th className="pb-3 pr-4 font-medium" style={{ color: COLORS.textTertiary, fontFamily: "'JetBrains Mono', monospace" }}>{t('planDetail.aiAnalysis.severity')}</th>
                  <th className="pb-3 font-medium" style={{ color: COLORS.textTertiary, fontFamily: "'JetBrains Mono', monospace" }}>{t('planDetail.aiAnalysis.mitigation')}</th>
                </tr>
              </thead>
              <tbody>
                {RISKS.map((r, i) => {
                  const sev = SEVERITY_CONFIG[r.severity];
                  return (
                    <tr key={i} style={{ borderBottom: i < RISKS.length - 1 ? `1px solid ${COLORS.borderSubtle}` : 'none' }}>
                      <td className="py-3 pr-4 font-medium" style={{ color: COLORS.textPrimary }}>{r.risk}</td>
                      <td className="py-3 pr-4">
                        <span
                          className="rounded-full px-2.5 py-[3px] text-[0.6875rem] font-medium uppercase tracking-wide"
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            backgroundColor: sev.bg,
                            color: sev.text,
                            border: `1px solid ${sev.border}`,
                          }}
                        >
                          {r.severity}
                        </span>
                      </td>
                      <td className="py-3" style={{ color: COLORS.textSecondary }}>{r.mitigation}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Generate Plan button */}
        <motion.div variants={fadeUp} className="flex justify-center">
          <Button
            className="gap-2 rounded-full px-6 py-2 text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: COLORS.accentBlue }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS.accentBlueHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.accentBlue)}
          >
            <RefreshCw size={14} />
            {t('planDetail.businessPlan.regenerate')}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
