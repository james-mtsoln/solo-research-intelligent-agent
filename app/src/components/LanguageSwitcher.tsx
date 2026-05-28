import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const languages = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'zh-CN', label: '简', name: '简体中文' },
  { code: 'zh-TW', label: '繁', name: '繁體中文' },
  { code: 'ja', label: '日', name: '日本語' },
  { code: 'ko', label: '한', name: '한국어' },
  { code: 'th', label: 'ไทย', name: 'ไทย' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';

  const activeLanguage = languages.find((l) => l.code === currentLang) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex h-8 items-center gap-1.5 rounded-md border border-border-subtle bg-bg-elevated px-2.5 text-[0.75rem] font-medium text-text-secondary transition-colors hover:text-text-primary"
        aria-label="Switch language"
      >
        <Globe size={13} />
        <span>{activeLanguage.label}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[160px] border-border-subtle bg-bg-elevated"
      >
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`flex cursor-pointer items-center justify-between gap-3 text-[0.8125rem] ${
              currentLang === lang.code
                ? 'bg-accent-cyan/10 text-accent-cyan'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="w-5 text-center font-medium">{lang.label}</span>
              <span>{lang.name}</span>
            </span>
            {currentLang === lang.code && <Check size={14} />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
