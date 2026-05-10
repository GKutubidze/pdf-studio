import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="mt-auto border-t py-8" style={{ borderColor: 'var(--bg-border)', background: 'var(--bg-surface)' }}>
      <div className="mx-auto max-w-7xl px-4 text-center">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {t('footer.tagline')}{' '}
          <span style={{ color: 'var(--accent)' }}>{t('footer.highlight')}</span>
          {' '}{t('footer.extras')}
        </p>
        <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          {t('footer.poweredBy')}
        </p>
      </div>
    </footer>
  );
}
