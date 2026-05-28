import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="flex h-11 shrink-0 items-center justify-between border-t border-border-subtle bg-bg-sidebar px-4 lg:px-6">
      {/* Left: RID version */}
      <span className="font-mono text-[0.8125rem] text-text-muted">
        {t('footer.version')}
      </span>

      {/* Right: System Online */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-success opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-status-success" />
        </span>
        <span className="text-[0.8125rem] text-text-secondary">
          {t('footer.systemOnline')}
        </span>
      </div>
    </footer>
  );
}
