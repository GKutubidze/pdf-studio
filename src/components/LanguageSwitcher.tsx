import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'English',    flag: '🇬🇧' },
  { code: 'ka', label: 'ქართული',   flag: '🇬🇪' },
  { code: 'ru', label: 'Русский',    flag: '🇷🇺' },
];

function applyGeorgianFont(lng: string) {
  if (lng === 'ka') {
    document.body.classList.add('font-georgian');
  } else {
    document.body.classList.remove('font-georgian');
  }
}

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    applyGeorgianFont(code);
    setOpen(false);
  };

  useEffect(() => {
    applyGeorgianFont(i18n.language);
  }, [i18n.language]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors"
        style={{ color: 'var(--text-secondary)', background: open ? 'var(--bg-elevated)' : 'transparent' }}
        onMouseEnter={(e) => { if (!open) (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
        onMouseLeave={(e) => { if (!open) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span>{current.code.toUpperCase()}</span>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5"
          className="transition-transform duration-150"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-xl border shadow-xl"
          style={{ background: 'var(--bg-elevated)', borderColor: 'var(--bg-border)' }}
          role="listbox"
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              role="option"
              aria-selected={lang.code === i18n.language}
              onClick={() => changeLanguage(lang.code)}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
              style={{
                color: lang.code === i18n.language ? 'var(--accent)' : 'var(--text-secondary)',
                background: lang.code === i18n.language ? 'rgba(99,102,241,0.1)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (lang.code !== i18n.language)
                  (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)';
              }}
              onMouseLeave={(e) => {
                if (lang.code !== i18n.language)
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              <span className="text-base leading-none">{lang.flag}</span>
              <span>{lang.label}</span>
              {lang.code === i18n.language && (
                <svg className="ml-auto" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
