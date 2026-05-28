import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  Database,
  Key,
  SlidersHorizontal,
  Cpu,
  Zap,
  Flame,
  Star,
  Hexagon,
  CheckCircle2,
  XCircle,
  Loader2,
  Activity,
  Plus,
  Pencil,
  Trash2,
  Shield,
  Lock,
  Moon,
  Download,
  AlertTriangle,
  Check,
  CircleDot,
  ExternalLink,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type Provider = 'ollama' | 'openai' | 'anthropic' | 'kimi' | 'gemini';
type DensityOption = 'compact' | 'default' | 'comfortable';
type RetentionOption = '7' | '30' | '90';

interface FeedItem {
  id: string;
  name: string;
  url: string;
  category: string;
  status: 'active' | 'inactive';
}

interface ApiKeyItem {
  id: string;
  service: string;
  keyMask: string;
  status: 'configured' | 'not-set';
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

function useProviders() {
  const { t } = useTranslation();
  return [
    { value: 'ollama' as Provider, label: t('settings.aiProviders.ollama'), icon: Cpu, desc: 'Recommended for privacy' },
    { value: 'openai' as Provider, label: t('settings.aiProviders.openai'), icon: Zap, desc: 'GPT-4o, GPT-4o-mini' },
    { value: 'anthropic' as Provider, label: t('settings.aiProviders.anthropic'), icon: Flame, desc: 'Claude 3.5 Sonnet, Claude 3 Opus' },
    { value: 'kimi' as Provider, label: t('settings.aiProviders.kimi'), icon: Star, desc: 'Moonshot Kimi API' },
    { value: 'gemini' as Provider, label: t('settings.aiProviders.gemini'), icon: Hexagon, desc: 'Google Gemini API' },
  ];
}

const OLLAMA_MODELS = ['llama3.2', 'mistral', 'codellama', 'phi3', 'gemma2', 'qwen2.5'];
const OPENAI_MODELS = ['gpt-4o', 'gpt-4o-mini'];
const ANTHROPIC_MODELS = ['claude-3-5-sonnet', 'claude-3-opus', 'claude-3-haiku'];
const KIMI_MODELS = ['kimi-k1', 'kimi-k2', 'kimi-k1.5'];
const GEMINI_MODELS = ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash'];

const DEFAULT_FEEDS: FeedItem[] = [
  { id: '1', name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'Technology', status: 'active' },
  { id: '2', name: 'Reuters Tech', url: 'https://reuters.com/tech/rss', category: 'Technology', status: 'active' },
  { id: '3', name: 'Ars Technica', url: 'https://arstechnica.com/feed/', category: 'Technology', status: 'active' },
  { id: '4', name: 'The Verge', url: 'https://theverge.com/rss/', category: 'Technology', status: 'active' },
  { id: '5', name: 'Wired', url: 'https://wired.com/feed/', category: 'Technology', status: 'active' },
];

const DEFAULT_API_KEYS: ApiKeyItem[] = [
  { id: 'k1', service: 'NewsAPI', keyMask: '...last4', status: 'not-set' },
  { id: 'k2', service: 'OpenAI', keyMask: '...last4', status: 'not-set' },
  { id: 'k3', service: 'Anthropic', keyMask: '...last4', status: 'not-set' },
  { id: 'k4', service: 'Kimi', keyMask: '...last4', status: 'not-set' },
  { id: 'k5', service: 'Gemini', keyMask: '...last4', status: 'not-set' },
];

const STORAGE_KEYS = {
  provider: 'rid_v2_provider',
  ollamaUrl: 'rid_v2_ollama_url',
  ollamaModel: 'rid_v2_ollama_model',
  openaiKey: 'rid_v2_openai_key',
  openaiModel: 'rid_v2_openai_model',
  anthropicKey: 'rid_v2_anthropic_key',
  anthropicModel: 'rid_v2_anthropic_model',
  kimiKey: 'rid_v2_kimi_key',
  kimiModel: 'rid_v2_kimi_model',
  geminiKey: 'rid_v2_gemini_key',
  geminiModel: 'rid_v2_gemini_model',
  temperature: 'rid_v2_temperature',
  maxTokens: 'rid_v2_max_tokens',
  feeds: 'rid_v2_feeds',
  apiKeys: 'rid_v2_api_keys',
  density: 'rid_v2_density',
  notifyAnalysis: 'rid_v2_notify_analysis',
  notifyPlan: 'rid_v2_notify_plan',
  notifyError: 'rid_v2_notify_error',
  dataRetention: 'rid_v2_data_retention',
  newsApiEnabled: 'rid_v2_newsapi_enabled',
  newsApiKey: 'rid_v2_newsapi_key',
  webScrapingEnabled: 'rid_v2_webscraping_enabled',
  scrapeDomains: 'rid_v2_scrape_domains',
  scrapeRateLimit: 'rid_v2_scrape_rate_limit',
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function loadItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveItem(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

const easeDecelerate = [0.16, 1, 0.3, 1] as [number, number, number, number];

const cardVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: easeDecelerate } },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05 } },
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function Settings() {
  const { t } = useTranslation();
  const PROVIDERS = useProviders();

  /* ---- AI Provider ---- */
  const [provider, setProvider] = useState<Provider>(loadItem(STORAGE_KEYS.provider, 'ollama'));
  const [ollamaUrl, setOllamaUrl] = useState(loadItem(STORAGE_KEYS.ollamaUrl, 'http://localhost:11434'));
  const [ollamaModel, setOllamaModel] = useState(loadItem(STORAGE_KEYS.ollamaModel, OLLAMA_MODELS[0]));
  const [openaiKey, setOpenaiKey] = useState(loadItem(STORAGE_KEYS.openaiKey, ''));
  const [openaiModel, setOpenaiModel] = useState(loadItem(STORAGE_KEYS.openaiModel, OPENAI_MODELS[0]));
  const [anthropicKey, setAnthropicKey] = useState(loadItem(STORAGE_KEYS.anthropicKey, ''));
  const [anthropicModel, setAnthropicModel] = useState(loadItem(STORAGE_KEYS.anthropicModel, ANTHROPIC_MODELS[0]));
  const [kimiKey, setKimiKey] = useState(loadItem(STORAGE_KEYS.kimiKey, ''));
  const [kimiModel, setKimiModel] = useState(loadItem(STORAGE_KEYS.kimiModel, KIMI_MODELS[0]));
  const [geminiKey, setGeminiKey] = useState(loadItem(STORAGE_KEYS.geminiKey, ''));
  const [geminiModel, setGeminiModel] = useState(loadItem(STORAGE_KEYS.geminiModel, GEMINI_MODELS[0]));
  const [temperature, setTemperature] = useState(loadItem(STORAGE_KEYS.temperature, 0.7));
  const [maxTokens, setMaxTokens] = useState(loadItem(STORAGE_KEYS.maxTokens, 4096));
  const [connStatus, setConnStatus] = useState<'connected' | 'failed' | 'testing'>('connected');

  /* ---- Data Sources ---- */
  const [feeds, setFeeds] = useState<FeedItem[]>(loadItem(STORAGE_KEYS.feeds, DEFAULT_FEEDS));
  const [newsApiEnabled, setNewsApiEnabled] = useState(loadItem(STORAGE_KEYS.newsApiEnabled, false));
  const [newsApiKey, setNewsApiKey] = useState(loadItem(STORAGE_KEYS.newsApiKey, ''));
  const [webScrapingEnabled, setWebScrapingEnabled] = useState(loadItem(STORAGE_KEYS.webScrapingEnabled, false));
  const [scrapeDomains, setScrapeDomains] = useState(loadItem(STORAGE_KEYS.scrapeDomains, 'example.com'));
  const [scrapeRateLimit, setScrapeRateLimit] = useState(loadItem(STORAGE_KEYS.scrapeRateLimit, '10'));

  /* ---- API Keys ---- */
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>(loadItem(STORAGE_KEYS.apiKeys, DEFAULT_API_KEYS));

  /* ---- General ---- */
  const [density, setDensity] = useState<DensityOption>(loadItem(STORAGE_KEYS.density, 'default'));
  const [notifyAnalysis, setNotifyAnalysis] = useState(loadItem(STORAGE_KEYS.notifyAnalysis, true));
  const [notifyPlan, setNotifyPlan] = useState(loadItem(STORAGE_KEYS.notifyPlan, true));
  const [notifyError, setNotifyError] = useState(loadItem(STORAGE_KEYS.notifyError, true));
  const [dataRetention, setDataRetention] = useState<RetentionOption>(loadItem(STORAGE_KEYS.dataRetention, '30'));

  /* ---- Modals ---- */
  const [addFeedOpen, setAddFeedOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [editKeyOpen, setEditKeyOpen] = useState(false);
  const [editKeyService, setEditKeyService] = useState('');
  const [editKeyValue, setEditKeyValue] = useState('');
  const [deleteKeyOpen, setDeleteKeyOpen] = useState(false);
  const [deleteKeyService, setDeleteKeyService] = useState('');

  /* ---- Add Feed Form ---- */
  const [newFeedName, setNewFeedName] = useState('');
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [newFeedCategory, setNewFeedCategory] = useState('Technology');

  /* ---- Dirty tracking ---- */
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const initialValuesRef = useRef<string>('');

  // Capture initial values on mount for reliable dirty detection
  useEffect(() => {
    initialValuesRef.current = JSON.stringify({
      provider, ollamaUrl, ollamaModel, openaiKey, openaiModel,
      anthropicKey, anthropicModel, kimiKey, kimiModel, geminiKey, geminiModel,
      temperature, maxTokens, feeds, newsApiEnabled, newsApiKey,
      webScrapingEnabled, scrapeDomains, scrapeRateLimit, apiKeys,
      density, notifyAnalysis, notifyPlan, notifyError, dataRetention,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const current = JSON.stringify({
      provider, ollamaUrl, ollamaModel, openaiKey, openaiModel,
      anthropicKey, anthropicModel, kimiKey, kimiModel, geminiKey, geminiModel,
      temperature, maxTokens, feeds, newsApiEnabled, newsApiKey,
      webScrapingEnabled, scrapeDomains, scrapeRateLimit, apiKeys,
      density, notifyAnalysis, notifyPlan, notifyError, dataRetention,
    });
    setHasChanges(current !== initialValuesRef.current);
  }, [
    provider, ollamaUrl, ollamaModel, openaiKey, openaiModel,
    anthropicKey, anthropicModel, kimiKey, kimiModel, geminiKey, geminiModel,
    temperature, maxTokens, feeds, newsApiEnabled, newsApiKey,
    webScrapingEnabled, scrapeDomains, scrapeRateLimit, apiKeys,
    density, notifyAnalysis, notifyPlan, notifyError, dataRetention,
  ]);

  /* ---- Actions ---- */
  const handleTestConnection = useCallback(async () => {
    setConnStatus('testing');
    try {
      const resp = await fetch(`${ollamaUrl}/api/tags`, { method: 'GET' });
      if (resp.ok) {
        setConnStatus('connected');
        toast.success('Connection successful');
      } else {
        setConnStatus('failed');
        toast.error(`Connection failed: ${resp.status} ${resp.statusText}`);
      }
    } catch (err) {
      setConnStatus('failed');
      toast.error(err instanceof Error ? err.message : 'Connection failed');
    }
  }, [ollamaUrl]);

  const handleVerifyKey = useCallback(async (service: string, key: string) => {
    // Lightweight validation: check key is non-empty and has reasonable length
    if (!key || key.length < 8) {
      toast.error(`${service} API key looks invalid (too short)`);
      return;
    }
    toast.success(`${service} API key format looks valid`);
  }, []);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSave = useCallback(() => {
    setSaving(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      const results = [
        saveItem(STORAGE_KEYS.provider, provider),
        saveItem(STORAGE_KEYS.ollamaUrl, ollamaUrl),
        saveItem(STORAGE_KEYS.ollamaModel, ollamaModel),
        saveItem(STORAGE_KEYS.openaiKey, openaiKey),
        saveItem(STORAGE_KEYS.openaiModel, openaiModel),
        saveItem(STORAGE_KEYS.anthropicKey, anthropicKey),
        saveItem(STORAGE_KEYS.anthropicModel, anthropicModel),
        saveItem(STORAGE_KEYS.kimiKey, kimiKey),
        saveItem(STORAGE_KEYS.kimiModel, kimiModel),
        saveItem(STORAGE_KEYS.geminiKey, geminiKey),
        saveItem(STORAGE_KEYS.geminiModel, geminiModel),
        saveItem(STORAGE_KEYS.temperature, temperature),
        saveItem(STORAGE_KEYS.maxTokens, maxTokens),
        saveItem(STORAGE_KEYS.feeds, feeds),
        saveItem(STORAGE_KEYS.newsApiEnabled, newsApiEnabled),
        saveItem(STORAGE_KEYS.newsApiKey, newsApiKey),
        saveItem(STORAGE_KEYS.webScrapingEnabled, webScrapingEnabled),
        saveItem(STORAGE_KEYS.scrapeDomains, scrapeDomains),
        saveItem(STORAGE_KEYS.scrapeRateLimit, scrapeRateLimit),
        saveItem(STORAGE_KEYS.apiKeys, apiKeys),
        saveItem(STORAGE_KEYS.density, density),
        saveItem(STORAGE_KEYS.notifyAnalysis, notifyAnalysis),
        saveItem(STORAGE_KEYS.notifyPlan, notifyPlan),
        saveItem(STORAGE_KEYS.notifyError, notifyError),
        saveItem(STORAGE_KEYS.dataRetention, dataRetention),
      ];
      setSaving(false);
      setHasChanges(false);
      if (results.every(Boolean)) {
        toast.success('Settings saved successfully');
      } else {
        toast.error('Some settings could not be saved. Storage may be full.');
      }
      saveTimeoutRef.current = null;
    }, 600);
  }, [provider, ollamaUrl, ollamaModel, openaiKey, openaiModel, anthropicKey, anthropicModel, kimiKey, kimiModel, geminiKey, geminiModel, temperature, maxTokens, feeds, newsApiEnabled, newsApiKey, webScrapingEnabled, scrapeDomains, scrapeRateLimit, apiKeys, density, notifyAnalysis, notifyPlan, notifyError, dataRetention]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const handleReset = useCallback(() => {
    setProvider('ollama');
    setOllamaUrl('http://localhost:11434');
    setOllamaModel(OLLAMA_MODELS[0]);
    setOpenaiKey('');
    setOpenaiModel(OPENAI_MODELS[0]);
    setAnthropicKey('');
    setAnthropicModel(ANTHROPIC_MODELS[0]);
    setKimiKey('');
    setKimiModel(KIMI_MODELS[0]);
    setGeminiKey('');
    setGeminiModel(GEMINI_MODELS[0]);
    setTemperature(0.7);
    setMaxTokens(4096);
    setFeeds(DEFAULT_FEEDS);
    setNewsApiEnabled(false);
    setNewsApiKey('');
    setWebScrapingEnabled(false);
    setScrapeDomains('example.com');
    setScrapeRateLimit('10');
    setApiKeys(DEFAULT_API_KEYS);
    setDensity('default');
    setNotifyAnalysis(true);
    setNotifyPlan(true);
    setNotifyError(true);
    setDataRetention('30');
    setHasChanges(true);
    // Clear all localStorage keys
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    toast.info('Settings reset to defaults');
  }, []);

  const toggleFeedStatus = useCallback((id: string) => {
    setFeeds((prev) => prev.map((f) => (f.id === id ? { ...f, status: f.status === 'active' ? 'inactive' : 'active' as const } : f)));
  }, []);

  const handleAddFeed = useCallback(() => {
    if (!newFeedName.trim() || !newFeedUrl.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    // Validate URL format
    try {
      new URL(newFeedUrl.trim());
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }
    const newFeed: FeedItem = {
      id: `feed-${Date.now()}`,
      name: newFeedName,
      url: newFeedUrl.trim(),
      category: newFeedCategory,
      status: 'active',
    };
    setFeeds((prev) => [...prev, newFeed]);
    setNewFeedName('');
    setNewFeedUrl('');
    setNewFeedCategory('Technology');
    setAddFeedOpen(false);
    toast.success(`Added feed: ${newFeedName}`);
  }, [newFeedName, newFeedUrl, newFeedCategory]);

  const handleDeleteFeed = useCallback((id: string) => {
    setFeeds((prev) => prev.filter((f) => f.id !== id));
    toast.success('Feed removed');
  }, []);

  const handleAddApiKey = useCallback((service: string, keyValue: string) => {
    const trimmed = keyValue.trim();
    if (!trimmed) {
      toast.error('Please enter an API key');
      return;
    }
    if (trimmed.length < 4) {
      toast.error('API key must be at least 4 characters');
      return;
    }
    const mask = `...${trimmed.slice(-4)}`;
    setApiKeys((prev) => prev.map((k) => k.service === service ? { ...k, keyMask: mask, status: 'configured' as const } : k));
    toast.success(`API key for ${service} added`);
  }, []);

  const handleDeleteApiKey = useCallback((service: string) => {
    setApiKeys((prev) => prev.map((k) => k.service === service ? { ...k, keyMask: '...last4', status: 'not-set' as const } : k));
    setDeleteKeyOpen(false);
    toast.success(`API key for ${service} deleted`);
  }, []);

  const openEditKey = useCallback((service: string) => {
    setEditKeyService(service);
    setEditKeyValue('');
    setEditKeyOpen(true);
  }, []);

  const openDeleteKey = useCallback((service: string) => {
    setDeleteKeyService(service);
    setDeleteKeyOpen(true);
  }, []);

  const handleExportData = useCallback(() => {
    // Explicit allowlist — never export raw API keys
    const data = {
      provider,
      ollamaUrl,
      ollamaModel,
      openaiModel,
      anthropicModel,
      kimiModel,
      geminiModel,
      maxTokens,
      temperature,
      feeds,
      apiKeys: apiKeys.map((k) => ({ service: k.service, status: k.status })), // mask only
      density,
      dataRetention,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rid-v2-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  }, [provider, ollamaUrl, ollamaModel, openaiModel, anthropicModel, kimiModel, geminiModel, maxTokens, temperature, feeds, apiKeys, density, dataRetention]);

  const handleClearData = useCallback(() => {
    setFeeds(DEFAULT_FEEDS);
    setApiKeys(DEFAULT_API_KEYS);
    // Clear all localStorage keys
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    setClearConfirmOpen(false);
    toast.success('All data cleared');
  }, []);

  /* ---- Computed ---- */
  const isProviderConfigured = (p: Provider) => {
    switch (p) {
      case 'ollama': return true;
      case 'openai': return !!openaiKey;
      case 'anthropic': return !!anthropicKey;
      case 'kimi': return !!kimiKey;
      case 'gemini': return !!geminiKey;
    }
  };

  const tempDescription = (() => {
    if (temperature <= 0.2) return t('settings.aiProviders.precise');
    if (temperature <= 0.5) return t('settings.aiProviders.balanced');
    if (temperature <= 0.8) return t('settings.aiProviders.creative');
    return t('settings.aiProviders.maxCreativity');
  })();

  /* ---- Styles (Design Tokens) ---- */
  const bgPrimary = '#0A0A0F';
  const bgSurface = '#13131A';
  const bgElevated = '#1A1A24';
  const borderSubtle = '#1E1E2A';
  const textPrimary = '#F0F0F5';
  const textSecondary = '#8A8B9E';
  const textTertiary = '#5A5B6E';
  const textMuted = '#4A4B5A';
  const accentCyan = '#38BDF8';
  const accentBlue = '#5B5CFF';
  const statusSuccess = '#22C55E';
  const statusError = '#EF4444';

  return (
    <div className="min-h-[100dvh]" style={{ backgroundColor: bgPrimary }}>
      {/* Page Header */}
      <motion.div
        className="px-4 pt-6 pb-4 sm:px-6 lg:px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, ease: easeDecelerate }}
      >
        <h1
          className="text-[clamp(1.25rem,2.5vw,1.875rem)] font-bold leading-[1.2]"
          style={{ color: textPrimary, fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          {t('settings.title')}
        </h1>
        <p className="mt-2 text-[0.9375rem] leading-[1.6]" style={{ color: textSecondary }}>
          {t('settings.subtitle')}
        </p>
        <div className="mt-4 h-px" style={{ backgroundColor: borderSubtle }} />
      </motion.div>

      {/* Content */}
      <motion.div
        className="space-y-6 px-4 pb-32 sm:px-6 lg:px-8"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* ========== Section 1: AI Model Configuration ========== */}
        <motion.div
          variants={cardVariants}
          className="rounded-lg border p-5 sm:p-6"
          style={{ backgroundColor: bgSurface, borderColor: borderSubtle }}
        >
          {/* Card Header */}
          <div className="mb-5 flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-md"
              style={{ backgroundColor: 'rgba(56,189,248,0.1)' }}
            >
              <Sparkles size={18} style={{ color: accentCyan }} />
            </div>
            <h2
              className="text-[1rem] font-semibold leading-[1.3]"
              style={{ color: textPrimary, fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              {t('settings.sections.aiModel')}
            </h2>
          </div>

          {/* Provider Selection */}
          <div className="mb-5">
            <Label
              className="mb-3 block text-[0.6875rem] font-medium uppercase tracking-wide"
              style={{ color: textTertiary, fontFamily: '"JetBrains Mono", monospace' }}
            >
              {t('settings.aiProviders.provider')}
            </Label>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {PROVIDERS.map((opt) => {
                const Icon = opt.icon;
                const configured = isProviderConfigured(opt.value);
                const selected = provider === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setProvider(opt.value)}
                    className={cn(
                      'flex min-w-[140px] shrink-0 flex-col items-center gap-2 rounded-lg border p-4 text-center transition-all'
                    )}
                    style={{
                      backgroundColor: selected ? bgElevated : bgSurface,
                      borderColor: selected ? accentCyan : borderSubtle,
                      boxShadow: selected ? '0 0 0 1px rgba(56,189,248,0.15)' : 'none',
                    }}
                  >
                    <Icon
                      size={20}
                      strokeWidth={1.5}
                      style={{ color: selected ? accentCyan : textSecondary }}
                    />
                    <div>
                      <p
                        className="text-[0.875rem] font-semibold leading-[1.3]"
                        style={{ color: selected ? textPrimary : textSecondary }}
                      >
                        {opt.label}
                      </p>
                    </div>
                    <span
                      className="mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.625rem] font-medium uppercase tracking-wider"
                      style={{
                        backgroundColor: configured ? 'rgba(34,197,94,0.12)' : 'rgba(90,91,110,0.12)',
                        color: configured ? statusSuccess : textMuted,
                        border: `1px solid ${configured ? 'rgba(34,197,94,0.25)' : borderSubtle}`,
                      }}
                    >
                      {configured ? t('settings.aiProviders.connected') : t('settings.aiProviders.notConfigured')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Provider Config Forms */}
          <AnimatePresence mode="wait">
            {provider === 'ollama' && (
              <ProviderConfig key="ollama">
                <div className="space-y-4">
                  <div>
                    <Label style={{ color: textSecondary }}>{t('settings.aiProviders.baseUrl')}</Label>
                    <Input
                      value={ollamaUrl}
                      onChange={(e) => setOllamaUrl(e.target.value)}
                      placeholder="http://localhost:11434"
                      className="mt-2 h-10 w-full border-0 text-[0.9375rem]"
                      style={{ backgroundColor: bgElevated, color: textPrimary }}
                    />
                  </div>
                  <div>
                    <Label style={{ color: textSecondary }}>{t('settings.aiProviders.model')}</Label>
                    <Select value={ollamaModel} onValueChange={setOllamaModel}>
                      <SelectTrigger
                        className="mt-2 h-10 w-full border-0"
                        style={{ backgroundColor: bgElevated, color: textPrimary }}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent style={{ backgroundColor: bgElevated, borderColor: borderSubtle }}>
                        {OLLAMA_MODELS.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestConnection}
                    disabled={connStatus === 'testing'}
                    className="gap-1.5"
                    style={{ borderColor: borderSubtle, color: textSecondary }}
                  >
                    {connStatus === 'testing' ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Activity size={14} />
                    )}
                    {t('settings.aiProviders.testConnection')}
                  </Button>
                  {connStatus === 'connected' && (
                    <div className="flex items-center gap-2 text-sm" style={{ color: statusSuccess }}>
                      <CheckCircle2 size={16} /> {t('settings.aiProviders.connected')}
                    </div>
                  )}
                  {connStatus === 'failed' && (
                    <div className="flex items-center gap-2 text-sm" style={{ color: statusError }}>
                      <XCircle size={16} /> {t('settings.aiProviders.failed')}
                    </div>
                  )}
                </div>
              </ProviderConfig>
            )}

            {provider === 'openai' && (
              <ProviderConfig key="openai">
                <CloudConfig
                  service={t('settings.aiProviders.openai')}
                  apiKey={openaiKey}
                  setApiKey={setOpenaiKey}
                  model={openaiModel}
                  setModel={setOpenaiModel}
                  models={OPENAI_MODELS}
                  onVerify={() => handleVerifyKey('OpenAI', openaiKey)}
                />
              </ProviderConfig>
            )}

            {provider === 'anthropic' && (
              <ProviderConfig key="anthropic">
                <CloudConfig
                  service={t('settings.aiProviders.anthropic')}
                  apiKey={anthropicKey}
                  setApiKey={setAnthropicKey}
                  model={anthropicModel}
                  setModel={setAnthropicModel}
                  models={ANTHROPIC_MODELS}
                  onVerify={() => handleVerifyKey('Anthropic', anthropicKey)}
                />
              </ProviderConfig>
            )}

            {provider === 'kimi' && (
              <ProviderConfig key="kimi">
                <CloudConfig
                  service={t('settings.aiProviders.kimi')}
                  apiKey={kimiKey}
                  setApiKey={setKimiKey}
                  model={kimiModel}
                  setModel={setKimiModel}
                  models={KIMI_MODELS}
                  onVerify={() => handleVerifyKey('Kimi', kimiKey)}
                  infoText={t('settings.aiProviders.getKeyAt')}
                  infoLink="https://platform.moonshot.cn"
                  infoLinkText="platform.moonshot.cn"
                />
              </ProviderConfig>
            )}

            {provider === 'gemini' && (
              <ProviderConfig key="gemini">
                <CloudConfig
                  service={t('settings.aiProviders.gemini')}
                  apiKey={geminiKey}
                  setApiKey={setGeminiKey}
                  model={geminiModel}
                  setModel={setGeminiModel}
                  models={GEMINI_MODELS}
                  onVerify={() => handleVerifyKey('Gemini', geminiKey)}
                  infoText={t('settings.aiProviders.getKeyAt')}
                  infoLink="https://aistudio.google.com/app/apikey"
                  infoLinkText="aistudio.google.com/app/apikey"
                />
              </ProviderConfig>
            )}
          </AnimatePresence>

          {/* Temperature Slider */}
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <Label
                className="text-[0.6875rem] font-medium uppercase tracking-wide"
                style={{ color: textTertiary, fontFamily: '"JetBrains Mono", monospace' }}
              >
                {t('settings.aiProviders.temperature')}
              </Label>
              <span
                className="rounded px-2 py-0.5 font-mono text-[0.8125rem] font-semibold"
                style={{ backgroundColor: 'rgba(56,189,248,0.1)', color: accentCyan }}
              >
                {temperature.toFixed(1)}
              </span>
            </div>
            <Slider
              value={[temperature]}
              onValueChange={(v) => setTemperature(v[0])}
              min={0}
              max={1}
              step={0.1}
              className="mt-3"
            />
            <p className="mt-2 text-[0.8125rem] leading-[1.4]" style={{ color: textSecondary }}>
              {tempDescription}
            </p>
          </div>

          {/* Max Tokens Slider */}
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <Label
                className="text-[0.6875rem] font-medium uppercase tracking-wide"
                style={{ color: textTertiary, fontFamily: '"JetBrains Mono", monospace' }}
              >
                {t('settings.aiProviders.maxTokens')}
              </Label>
              <span className="font-mono text-[0.8125rem]" style={{ color: textPrimary }}>
                {maxTokens}
              </span>
            </div>
            <Slider
              value={[maxTokens]}
              onValueChange={(v) => setMaxTokens(v[0])}
              min={256}
              max={8192}
              step={128}
              className="mt-3"
            />
            <div className="mt-1 flex justify-between text-[0.6875rem]" style={{ color: textTertiary }}>
              <span>256</span>
              <span>8192</span>
            </div>
          </div>
        </motion.div>

        {/* ========== Section 2: Data Sources ========== */}
        <motion.div
          variants={cardVariants}
          className="rounded-lg border p-5 sm:p-6"
          style={{ backgroundColor: bgSurface, borderColor: borderSubtle }}
        >
          <div className="mb-5 flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-md"
              style={{ backgroundColor: 'rgba(56,189,248,0.1)' }}
            >
              <Database size={18} style={{ color: accentCyan }} />
            </div>
            <h2
              className="text-[1rem] font-semibold leading-[1.3]"
              style={{ color: textPrimary, fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              {t('settings.sections.dataSources')}
            </h2>
          </div>

          {/* RSS Feeds Accordion */}
          <Accordion type="multiple" defaultValue={['rss']}>
            <AccordionItem value="rss" style={{ borderColor: borderSubtle }}>
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="text-[0.875rem] font-semibold" style={{ color: textPrimary }}>
                    {t('settings.dataSources.rssFeeds')}
                  </span>
                  <span
                    className="rounded px-2 py-0.5 text-[0.625rem] font-medium uppercase tracking-wider"
                    style={{ backgroundColor: 'rgba(91,92,255,0.12)', color: accentBlue }}
                  >
                    {feeds.length}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pb-2">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow style={{ borderColor: borderSubtle }}>
                          <TableHead style={{ color: textTertiary }}>{t('settings.dataSources.feedName')}</TableHead>
                          <TableHead style={{ color: textTertiary }}>URL</TableHead>
                          <TableHead style={{ color: textTertiary }}>{t('settings.dataSources.feedCategory')}</TableHead>
                          <TableHead style={{ color: textTertiary }}>{t('common.status')}</TableHead>
                          <TableHead className="text-right" style={{ color: textTertiary }}>{t('common.actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {feeds.map((feed) => (
                          <TableRow key={feed.id} style={{ borderColor: borderSubtle }}>
                            <TableCell className="text-[0.875rem] font-medium" style={{ color: textPrimary }}>
                              {feed.name}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate font-mono text-[0.75rem]" style={{ color: textTertiary }}>
                              {feed.url}
                            </TableCell>
                            <TableCell className="text-[0.8125rem]" style={{ color: textSecondary }}>
                              {feed.category}
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={feed.status === 'active'}
                                onCheckedChange={() => toggleFeedStatus(feed.id)}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleDeleteFeed(feed.id)}
                                className="h-8 w-8"
                                style={{ color: statusError }}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Add Feed Dialog */}
                  <Dialog open={addFeedOpen} onOpenChange={setAddFeedOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 gap-1.5"
                        style={{ borderColor: borderSubtle, color: textSecondary }}
                      >
                        <Plus size={14} />
                        {t('settings.dataSources.addFeed')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent
                      className="max-w-[480px] border-0 sm:max-w-[520px]"
                      style={{ backgroundColor: bgElevated, border: `1px solid ${borderSubtle}` }}
                    >
                      <DialogHeader>
                        <DialogTitle style={{ color: textPrimary }}>{t('settings.dataSources.addFeed')}</DialogTitle>
                        <DialogDescription style={{ color: textSecondary }}>
                          Add a new RSS feed to your data sources.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-3">
                        <div>
                          <Label style={{ color: textSecondary }}>{t('settings.dataSources.feedName')} *</Label>
                          <Input
                            value={newFeedName}
                            onChange={(e) => setNewFeedName(e.target.value)}
                            placeholder="Feed name"
                            className="mt-2 h-10 border-0"
                            style={{ backgroundColor: bgSurface, color: textPrimary }}
                          />
                        </div>
                        <div>
                          <Label style={{ color: textSecondary }}>URL *</Label>
                          <Input
                            value={newFeedUrl}
                            onChange={(e) => setNewFeedUrl(e.target.value)}
                            placeholder="https://example.com/feed.xml"
                            className="mt-2 h-10 border-0"
                            style={{ backgroundColor: bgSurface, color: textPrimary }}
                          />
                        </div>
                        <div>
                          <Label style={{ color: textSecondary }}>{t('settings.dataSources.feedCategory')}</Label>
                          <Select value={newFeedCategory} onValueChange={setNewFeedCategory}>
                            <SelectTrigger className="mt-2 h-10 border-0" style={{ backgroundColor: bgSurface, color: textPrimary }}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent style={{ backgroundColor: bgElevated, borderColor: borderSubtle }}>
                              {['Technology', 'News', 'Finance', 'Science', 'General'].map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setAddFeedOpen(false)} style={{ borderColor: borderSubtle, color: textSecondary }}>
                          {t('common.cancel')}
                        </Button>
                        <Button
                          onClick={handleAddFeed}
                          className="gap-1.5"
                          style={{ backgroundColor: accentBlue, color: '#fff' }}
                        >
                          <Plus size={16} />
                          {t('settings.dataSources.addFeed')}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* NewsAPI */}
          <div
            className="mt-4 flex items-center justify-between rounded-lg border p-4"
            style={{ borderColor: borderSubtle }}
          >
            <div>
              <p className="text-[0.875rem] font-semibold" style={{ color: textPrimary }}>NewsAPI</p>
              <p className="text-[0.8125rem]" style={{ color: textSecondary }}>{t('settings.dataSources.globalNews')}</p>
            </div>
            <Switch checked={newsApiEnabled} onCheckedChange={setNewsApiEnabled} />
          </div>
          <AnimatePresence>
            {newsApiEnabled && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-3 rounded-lg border p-4" style={{ borderColor: borderSubtle }}>
                  <div>
                    <Label className="text-[0.6875rem] font-medium uppercase tracking-wide" style={{ color: textTertiary }}>
                      {t('settings.aiProviders.apiKey')}
                    </Label>
                    <Input
                      type="password"
                      value={newsApiKey}
                      onChange={(e) => setNewsApiKey(e.target.value)}
                      placeholder="Enter your NewsAPI key"
                      className="mt-2 h-10 w-full border-0"
                      style={{ backgroundColor: bgElevated, color: textPrimary }}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVerifyKey('NewsAPI', newsApiKey)}
                    className="gap-1.5"
                    style={{ borderColor: borderSubtle, color: textSecondary }}
                  >
                    <Activity size={14} />
                    {t('settings.aiProviders.verifyKey')}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Web Scraping */}
          <div
            className="mt-4 flex items-center justify-between rounded-lg border p-4"
            style={{ borderColor: borderSubtle }}
          >
            <div>
              <p className="text-[0.875rem] font-semibold" style={{ color: textPrimary }}>{t('settings.dataSources.webScraping')}</p>
              <p className="text-[0.8125rem]" style={{ color: textSecondary }}>{t('settings.dataSources.scrapeDescription')}</p>
            </div>
            <Switch checked={webScrapingEnabled} onCheckedChange={setWebScrapingEnabled} />
          </div>
          <AnimatePresence>
            {webScrapingEnabled && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-3 rounded-lg border p-4" style={{ borderColor: borderSubtle }}>
                  <div>
                    <Label className="text-[0.6875rem] font-medium uppercase tracking-wide" style={{ color: textTertiary }}>
                      {t('settings.dataSources.allowedDomains')}
                    </Label>
                    <Textarea
                      value={scrapeDomains}
                      onChange={(e) => setScrapeDomains(e.target.value)}
                      className="mt-2 min-h-[80px] border-0 text-[0.875rem]"
                      style={{ backgroundColor: bgElevated, color: textPrimary }}
                    />
                  </div>
                  <div>
                    <Label className="text-[0.6875rem] font-medium uppercase tracking-wide" style={{ color: textTertiary }}>
                      {t('settings.dataSources.rateLimit')}
                    </Label>
                    <Input
                      type="number"
                      value={scrapeRateLimit}
                      onChange={(e) => setScrapeRateLimit(e.target.value)}
                      className="mt-2 h-10 w-24 border-0 text-center"
                      style={{ backgroundColor: bgElevated, color: textPrimary }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ========== Section 3: API Keys ========== */}
        <motion.div
          variants={cardVariants}
          className="rounded-lg border p-5 sm:p-6"
          style={{ backgroundColor: bgSurface, borderColor: borderSubtle }}
        >
          <div className="mb-5 flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-md"
              style={{ backgroundColor: 'rgba(56,189,248,0.1)' }}
            >
              <Key size={18} style={{ color: accentCyan }} />
            </div>
            <h2
              className="text-[1rem] font-semibold leading-[1.3]"
              style={{ color: textPrimary, fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              {t('settings.sections.apiKeys')}
            </h2>
          </div>

          {/* Security Notice */}
          <div
            className="mb-5 flex items-start gap-3 rounded-lg border p-4"
            style={{ backgroundColor: 'rgba(56,189,248,0.04)', borderColor: 'rgba(56,189,248,0.15)' }}
          >
            <Shield size={18} className="mt-0.5 shrink-0" style={{ color: accentCyan }} />
            <p className="text-[0.8125rem] leading-[1.5]" style={{ color: textSecondary }}>
              {t('settings.apiKeys.securityNotice')}
            </p>
          </div>

          {/* API Keys Table */}
          <div className="overflow-x-auto rounded-lg border" style={{ borderColor: borderSubtle }}>
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: borderSubtle }}>
                  <TableHead style={{ color: textTertiary }}>{t('settings.apiKeys.service')}</TableHead>
                  <TableHead style={{ color: textTertiary }}>{t('common.status')}</TableHead>
                  <TableHead style={{ color: textTertiary }}>{t('settings.aiProviders.apiKey')}</TableHead>
                  <TableHead className="text-right" style={{ color: textTertiary }}>{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id} style={{ borderColor: borderSubtle }}>
                    <TableCell className="text-[0.875rem] font-medium" style={{ color: textPrimary }}>
                      {key.service}
                    </TableCell>
                    <TableCell>
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.625rem] font-medium uppercase tracking-wider"
                        style={{
                          backgroundColor: key.status === 'configured' ? 'rgba(34,197,94,0.12)' : 'rgba(90,91,110,0.12)',
                          color: key.status === 'configured' ? statusSuccess : textMuted,
                          border: `1px solid ${key.status === 'configured' ? 'rgba(34,197,94,0.25)' : borderSubtle}`,
                        }}
                      >
                        {key.status === 'configured' ? t('settings.apiKeys.configured') : t('settings.apiKeys.notSet')}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-[0.8125rem]" style={{ color: textTertiary }}>
                      {key.status === 'configured' ? key.keyMask : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditKey(key.service)}
                          className="h-8 w-8"
                          style={{ color: accentCyan }}
                        >
                          <Pencil size={14} />
                        </Button>
                        {key.status === 'configured' && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openDeleteKey(key.service)}
                            className="h-8 w-8"
                            style={{ color: statusError }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </motion.div>

        {/* ========== Section 4: General Preferences ========== */}
        <motion.div
          variants={cardVariants}
          className="rounded-lg border p-5 sm:p-6"
          style={{ backgroundColor: bgSurface, borderColor: borderSubtle }}
        >
          <div className="mb-5 flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-md"
              style={{ backgroundColor: 'rgba(56,189,248,0.1)' }}
            >
              <SlidersHorizontal size={18} style={{ color: accentCyan }} />
            </div>
            <h2
              className="text-[1rem] font-semibold leading-[1.3]"
              style={{ color: textPrimary, fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              {t('settings.sections.general')}
            </h2>
          </div>

          <div className="space-y-5">
            {/* Appearance - Theme (Dark only, locked) */}
            <div>
              <Label
                className="mb-3 block text-[0.6875rem] font-medium uppercase tracking-wide"
                style={{ color: textTertiary, fontFamily: '"JetBrains Mono", monospace' }}
              >
                {t('settings.general.theme')}
              </Label>
              <div
                className="flex items-center gap-3 rounded-lg border p-4"
                style={{ borderColor: borderSubtle, backgroundColor: bgElevated }}
              >
                <Moon size={18} style={{ color: textSecondary }} />
                <div className="flex-1">
                  <p className="text-[0.875rem] font-medium" style={{ color: textPrimary }}>{t('settings.general.dark')}</p>
                  <p className="text-[0.8125rem]" style={{ color: textTertiary }}>{t('settings.general.darkDesc')}</p>
                </div>
                <Lock size={14} style={{ color: textMuted }} />
              </div>
            </div>

            {/* Density */}
            <div>
              <Label
                className="mb-3 block text-[0.6875rem] font-medium uppercase tracking-wide"
                style={{ color: textTertiary, fontFamily: '"JetBrains Mono", monospace' }}
              >
                {t('settings.general.density')}
              </Label>
              <div
                className="inline-flex rounded-lg border p-[3px]"
                style={{ backgroundColor: bgElevated, borderColor: borderSubtle }}
              >
                {(['compact', 'default', 'comfortable'] as DensityOption[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDensity(d)}
                    className="rounded-md px-4 py-2 text-[0.8125rem] font-medium capitalize transition-all"
                    style={{
                      backgroundColor: density === d ? accentBlue : 'transparent',
                      color: density === d ? '#fff' : textSecondary,
                    }}
                  >
                    {t(`settings.general.${d}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <div>
              <Label
                className="mb-3 block text-[0.6875rem] font-medium uppercase tracking-wide"
                style={{ color: textTertiary, fontFamily: '"JetBrains Mono", monospace' }}
              >
                {t('settings.general.notifications')}
              </Label>
              <div className="space-y-3">
                {[
                  { label: t('settings.general.analysisComplete'), desc: t('settings.general.analysisCompleteDesc'), checked: notifyAnalysis, setter: setNotifyAnalysis },
                  { label: t('settings.general.planGenerated'), desc: t('settings.general.planGeneratedDesc'), checked: notifyPlan, setter: setNotifyPlan },
                  { label: t('settings.general.error'), desc: t('settings.general.errorDesc'), checked: notifyError, setter: setNotifyError },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-lg border p-4"
                    style={{ borderColor: borderSubtle }}
                  >
                    <div>
                      <p className="text-[0.875rem] font-medium" style={{ color: textPrimary }}>{item.label}</p>
                      <p className="text-[0.8125rem]" style={{ color: textTertiary }}>{item.desc}</p>
                    </div>
                    <Switch checked={item.checked} onCheckedChange={item.setter} />
                  </div>
                ))}
              </div>
            </div>

            {/* Data Retention */}
            <div>
              <Label
                className="mb-3 block text-[0.6875rem] font-medium uppercase tracking-wide"
                style={{ color: textTertiary, fontFamily: '"JetBrains Mono", monospace' }}
              >
                {t('settings.general.dataRetention')}
              </Label>
              <Select value={dataRetention} onValueChange={(v) => setDataRetention(v as RetentionOption)}>
                <SelectTrigger className="h-10 w-full border-0" style={{ backgroundColor: bgElevated, color: textPrimary }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: bgElevated, borderColor: borderSubtle }}>
                  <SelectItem value="7">7 {t('settings.general.days')}</SelectItem>
                  <SelectItem value="30">30 {t('settings.general.days')}</SelectItem>
                  <SelectItem value="90">90 {t('settings.general.days')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Storage Usage */}
            <div className="rounded-lg border p-4" style={{ borderColor: borderSubtle }}>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[0.875rem] font-medium" style={{ color: textPrimary }}>{t('settings.general.storageUsage')}</p>
                <span className="font-mono text-[0.8125rem]" style={{ color: textSecondary }}>2.4 MB {t('settings.general.of')} 100 MB {t('settings.general.used')}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(90,91,110,0.2)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: accentBlue }}
                  initial={{ width: 0 }}
                  animate={{ width: '2.4%' }}
                  transition={{ duration: 0.8, ease: easeDecelerate }}
                />
              </div>
            </div>

            {/* Export & Clear */}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={handleExportData}
                className="gap-1.5"
                style={{ borderColor: borderSubtle, color: textSecondary, backgroundColor: 'transparent' }}
              >
                <Download size={14} />
                {t('settings.general.exportData')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setClearConfirmOpen(true)}
                className="gap-1.5"
                style={{ borderColor: 'rgba(239,68,68,0.3)', color: statusError, backgroundColor: 'transparent' }}
              >
                <Trash2 size={14} />
                {t('settings.general.clearData')}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* ========== About Section ========== */}
        <motion.div
          variants={cardVariants}
          className="pb-8 text-center"
        >
          <p className="text-[0.8125rem]" style={{ color: textTertiary }}>
            {t('settings.about.version')}
          </p>
          <p className="mt-1 text-[0.75rem]" style={{ color: textMuted }}>
            {t('settings.about.designedFor')}
          </p>
          <p className="mt-1 text-[0.75rem]" style={{ color: textMuted }}>
            {t('settings.about.builtWith')}
          </p>
        </motion.div>
      </motion.div>

      {/* ========== Sticky Save Bar ========== */}
      <motion.div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between border-t px-4 py-3 sm:px-6 lg:left-[240px] lg:px-8',
        )}
        style={{
          backgroundColor: bgElevated,
          borderColor: hasChanges ? accentCyan : borderSubtle,
        }}
        initial={false}
        animate={{ y: 0 }}
        transition={{ duration: 0.25, ease: easeDecelerate }}
      >
        <div className="flex items-center gap-2">
          {hasChanges ? (
            <>
              <CircleDot size={14} style={{ color: accentCyan }} />
              <span className="text-[0.8125rem] font-medium" style={{ color: accentCyan }}>{t('settings.unsavedChanges')}</span>
            </>
          ) : (
            <>
              <Check size={14} style={{ color: statusSuccess }} />
              <span className="text-[0.8125rem] font-medium" style={{ color: statusSuccess }}>{t('settings.allChangesSaved')}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={handleReset}
            className="text-[0.8125rem]"
            style={{ color: textSecondary }}
          >
            {t('settings.reset')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className={cn('min-w-[120px] gap-1.5 rounded-full text-[0.8125rem]', saving && 'opacity-80')}
            style={{ backgroundColor: accentBlue, color: '#fff' }}
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {t('settings.saving')}
              </>
            ) : (
              <>
                <Check size={14} />
                {t('settings.saveChanges')}
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {/* ========== Dialogs ========== */}

      {/* Edit API Key Dialog */}
      <Dialog open={editKeyOpen} onOpenChange={setEditKeyOpen}>
        <DialogContent
          className="max-w-[480px] border-0"
          style={{ backgroundColor: bgElevated, border: `1px solid ${borderSubtle}` }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: textPrimary }}>{t('settings.apiKeys.editTitle')} — {editKeyService}</DialogTitle>
            <DialogDescription style={{ color: textSecondary }}>
              {t('settings.apiKeys.enterKey')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <Input
              type="password"
              value={editKeyValue}
              onChange={(e) => setEditKeyValue(e.target.value)}
              placeholder="Enter API key..."
              className="h-10 border-0"
              style={{ backgroundColor: bgSurface, color: textPrimary }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditKeyOpen(false)} style={{ borderColor: borderSubtle, color: textSecondary }}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => { handleAddApiKey(editKeyService, editKeyValue); setEditKeyOpen(false); setEditKeyValue(''); }}
              style={{ backgroundColor: accentBlue, color: '#fff' }}
            >
              {t('settings.apiKeys.saveKey')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete API Key Dialog */}
      <Dialog open={deleteKeyOpen} onOpenChange={setDeleteKeyOpen}>
        <DialogContent
          className="max-w-[480px] border-0"
          style={{ backgroundColor: bgElevated, border: `1px solid ${borderSubtle}` }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ color: statusError }}>
              <AlertTriangle size={20} />
              {t('settings.apiKeys.deleteTitle')}
            </DialogTitle>
            <DialogDescription style={{ color: textSecondary }}>
              {t('settings.apiKeys.deleteConfirm', { service: deleteKeyService })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteKeyOpen(false)} style={{ borderColor: borderSubtle, color: textSecondary }}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => handleDeleteApiKey(deleteKeyService)}
              className="gap-1.5"
              style={{ backgroundColor: statusError, color: '#fff' }}
            >
              <Trash2 size={14} />
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Data Confirmation Dialog */}
      <Dialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <DialogContent
          className="max-w-[480px] border-0"
          style={{ backgroundColor: bgElevated, border: `1px solid ${borderSubtle}` }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ color: statusError }}>
              <AlertTriangle size={20} />
              {t('settings.general.clearTitle')}
            </DialogTitle>
            <DialogDescription style={{ color: textSecondary }}>
              {t('settings.general.clearConfirm')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearConfirmOpen(false)} style={{ borderColor: borderSubtle, color: textSecondary }}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleClearData}
              className="gap-1.5"
              style={{ backgroundColor: statusError, color: '#fff' }}
            >
              <Trash2 size={14} />
              {t('settings.general.clearData')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ProviderConfig({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-lg border p-4"
      style={{ backgroundColor: '#1A1A24', borderColor: '#1E1E2A' }}
    >
      {children}
    </motion.div>
  );
}

function CloudConfig({
  service,
  apiKey,
  setApiKey,
  model,
  setModel,
  models,
  onVerify,
  infoText,
  infoLink,
  infoLinkText,
}: {
  service: string;
  apiKey: string;
  setApiKey: (v: string) => void;
  model: string;
  setModel: (v: string) => void;
  models: string[];
  onVerify: () => void;
  infoText?: string;
  infoLink?: string;
  infoLinkText?: string;
}) {
  const { t } = useTranslation();
  const bgElevated = '#1A1A24';
  const bgSurface = '#13131A';
  const borderSubtle = '#1E1E2A';
  const textPrimary = '#F0F0F5';
  const textSecondary = '#8A8B9E';
  const textTertiary = '#5A5B6E';
  const accentCyan = '#38BDF8';

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-[0.6875rem] font-medium uppercase tracking-wide" style={{ color: textTertiary, fontFamily: '"JetBrains Mono", monospace' }}>
          {t('settings.aiProviders.apiKey')}
        </Label>
        <Input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={`${service.toLowerCase()}-...`}
          className="mt-2 h-10 w-full border-0 text-[0.9375rem]"
          style={{ backgroundColor: bgSurface, color: textPrimary }}
        />
        <p className="mt-2 text-[0.8125rem]" style={{ color: textSecondary }}>
          {t('settings.aiProviders.keyStoredLocally')}
        </p>
        {infoText && infoLink && (
          <p className="mt-1 text-[0.8125rem]" style={{ color: textSecondary }}>
            {infoText}{' '}
            <a
              href={infoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:underline"
              style={{ color: accentCyan }}
            >
              {infoLinkText}
              <ExternalLink size={12} />
            </a>
          </p>
        )}
      </div>

      <div>
        <Label className="text-[0.6875rem] font-medium uppercase tracking-wide" style={{ color: textTertiary, fontFamily: '"JetBrains Mono", monospace' }}>
          {t('settings.aiProviders.model')}
        </Label>
        <Select value={model} onValueChange={setModel}>
          <SelectTrigger className="mt-2 h-10 w-full border-0" style={{ backgroundColor: bgSurface, color: textPrimary }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent style={{ backgroundColor: bgElevated, borderColor: borderSubtle }}>
            {models.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-[0.6875rem] font-medium uppercase tracking-wide" style={{ color: textTertiary, fontFamily: '"JetBrains Mono", monospace' }}>
          {t('settings.aiProviders.temperature')}
        </Label>
        <p className="mt-1 text-xs" style={{ color: textSecondary }}>
          Temperature is controlled in the AI Provider section above.
        </p>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onVerify}
        className="gap-1.5"
        style={{ borderColor: borderSubtle, color: textSecondary }}
      >
        <Activity size={14} />
        {t('settings.aiProviders.verifyKey')}
      </Button>
    </div>
  );
}
