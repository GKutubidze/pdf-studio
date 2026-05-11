import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutGrid, Sun, Moon, Menu, X, ChevronDown, Check } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTheme } from '../hooks/useTheme';

// ── Shared helpers ────────────────────────────────────────────────────────────

function GithubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.167 6.839 9.49.5.09.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.34-3.369-1.34-.454-1.157-1.11-1.465-1.11-1.465-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );
}

function IconBtn({ onClick, label, children }: { onClick?: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-150"
      style={{ color: 'var(--text-secondary)' }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
        (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
        (e.currentTarget as HTMLElement).style.background = 'transparent';
      }}
    >
      {children}
    </button>
  );
}

function IconLink({ to, href, label, children }: { to?: string; href?: string; label: string; children: React.ReactNode }) {
  const cls = 'flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-150';
  const style = { color: 'var(--text-secondary)' };
  const enter = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.color = 'var(--text-primary)';
    e.currentTarget.style.background = 'var(--bg-elevated)';
  };
  const leave = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.color = 'var(--text-secondary)';
    e.currentTarget.style.background = 'transparent';
  };
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" title={label} aria-label={label}
        className={cls} style={style} onMouseEnter={enter} onMouseLeave={leave}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to!} title={label} aria-label={label}
      className={cls} style={style} onMouseEnter={enter} onMouseLeave={leave}>
      {children}
    </Link>
  );
}

// ── Language data ─────────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: 'en', label: 'English',  flag: '🇬🇧' },
  { code: 'ka', label: 'ქართული', flag: '🇬🇪' },
  { code: 'ru', label: 'Русский',  flag: '🇷🇺' },
];

function applyGeorgianFont(lng: string) {
  document.body.classList.toggle('font-georgian', lng === 'ka');
}

// ── Mobile drawer ─────────────────────────────────────────────────────────────

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  theme: string;
  toggleTheme: () => void;
}

function MobileMenu({ open, onClose, theme, toggleTheme }: MobileMenuProps) {
  const { t, i18n } = useTranslation();
  const [langOpen, setLangOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    applyGeorgianFont(code);
    setLangOpen(false);
  };

  // Focus the close button when drawer opens
  useEffect(() => {
    if (open) {
      setTimeout(() => closeRef.current?.focus(), 50);
    } else {
      setLangOpen(false);
    }
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const rowBase = 'flex w-full items-center gap-3 px-6 py-4 text-base font-medium transition-colors duration-150 min-h-[56px]';
  const rowStyle = { color: 'var(--text-secondary)' };

  const isDark = theme === 'dark';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[59] md:hidden transition-opacity duration-200"
        style={{
          background: 'rgba(0,0,0,0.5)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className="fixed inset-x-0 top-0 z-[60] md:hidden transition-transform duration-200 ease-out"
        style={{
          transform: open ? 'translateY(0)' : 'translateY(-100%)',
          background: 'var(--bg-base)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          maxHeight: '100dvh',
          overflowY: 'auto',
          borderBottom: '1px solid var(--bg-border)',
        }}
      >
        {/* Drawer header row: logo + close */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: 'var(--bg-border)' }}
        >
          <Link to="/" onClick={onClose} className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ background: 'var(--accent)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              PDF<span style={{ color: 'var(--accent)' }}>Studio</span>
            </span>
          </Link>

          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close menu"
            className="flex items-center justify-center rounded-xl transition-colors duration-150"
            style={{ color: 'var(--text-secondary)', minWidth: 44, minHeight: 44 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <X size={22} />
          </button>
        </div>

        {/* ── Menu items ── */}
        <nav>
          {/* All Tools */}
          <Link
            to="/"
            onClick={onClose}
            className={rowBase}
            style={rowStyle}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <span className="flex w-5 shrink-0 items-center justify-center">
              <LayoutGrid size={20} />
            </span>
            <span className="flex-1">{t('nav.allTools')}</span>
          </Link>

          {/* GitHub */}
          <a
            href="https://github.com/GKutubidze/pdf-studio"
            target="_blank"
            rel="noopener noreferrer"
            className={rowBase}
            style={rowStyle}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <span className="flex w-5 shrink-0 items-center justify-center">
              <GithubIcon />
            </span>
            <span className="flex-1">{t('nav.github')}</span>
          </a>

          {/* Divider */}
          <div className="mx-6 border-t" style={{ borderColor: 'var(--bg-border)', opacity: 0.4 }} />

          {/* Language selector — inline expand */}
          <button
            onClick={() => setLangOpen((o) => !o)}
            className={rowBase + ' w-full text-left'}
            style={rowStyle}
            aria-expanded={langOpen}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
          >
            <span className="flex w-5 shrink-0 items-center justify-center text-base leading-none">
              {currentLang.flag}
            </span>
            <span className="flex-1">{currentLang.label}</span>
            <ChevronDown
              size={18}
              className="shrink-0 transition-transform duration-200"
              style={{ transform: langOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: 'var(--text-muted)' }}
            />
          </button>

          {/* Inline language options */}
          <div
            style={{
              maxHeight: langOpen ? '180px' : '0',
              overflow: 'hidden',
              transition: 'max-height 200ms ease-out',
            }}
          >
            {LANGUAGES.map((lang) => {
              const isActive = lang.code === i18n.language;
              return (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className="flex w-full items-center gap-3 py-3 pl-14 pr-6 text-base font-medium transition-colors duration-150"
                  style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)', background: 'transparent' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <span className="text-base leading-none">{lang.flag}</span>
                  <span className="flex-1">{lang.label}</span>
                  {isActive && <Check size={16} style={{ color: 'var(--accent)' }} />}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="mx-6 border-t" style={{ borderColor: 'var(--bg-border)', opacity: 0.4 }} />

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={rowBase + ' w-full'}
            style={rowStyle}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
          >
            <span className="flex w-5 shrink-0 items-center justify-center">
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </span>
            <span className="flex-1">{isDark ? 'Light mode' : 'Dark mode'}</span>
            {/* Toggle switch */}
            <div
              className="shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200"
              style={{ background: isDark ? 'var(--accent)' : 'var(--bg-border)' }}
              aria-hidden="true"
            >
              <span
                className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
                style={{ transform: isDark ? 'translateX(22px)' : 'translateX(4px)' }}
              />
            </div>
          </button>

          {/* Safe area spacer for iPhone home indicator */}
          <div style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', minHeight: 16 }} />
        </nav>
      </div>
    </>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

export function Header() {
  const { t } = useTranslation();
  const { theme, toggle } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const close = useCallback(() => setDrawerOpen(false), []);

  // Close drawer on resize to desktop
  useEffect(() => {
    function handle() { if (window.innerWidth >= 768) setDrawerOpen(false); }
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  const ThemeIcon = theme === 'dark' ? Sun : Moon;
  const themeLabel = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <>
      <header
        className="sticky top-0 z-50 border-b"
        style={{ borderColor: 'var(--bg-border)', background: 'var(--header-bg)', backdropFilter: 'blur(12px)' }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">

          {/* ── Left: Logo ── */}
          <Link to="/" className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ background: 'var(--accent)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              PDF<span style={{ color: 'var(--accent)' }}>Studio</span>
            </span>
          </Link>

          {/* ── Center: All Tools icon (desktop only) ── */}
          <div className="hidden md:flex">
            <IconLink to="/" label={t('nav.allTools')}>
              <LayoutGrid size={20} />
            </IconLink>
          </div>

          {/* ── Right: desktop actions + mobile hamburger ── */}
          <nav className="flex items-center gap-2">
            {/* Desktop actions */}
            <div className="hidden items-center gap-2 md:flex">
              <IconLink href="https://github.com/GKutubidze/pdf-studio" label={t('nav.github')}>
                <GithubIcon />
              </IconLink>
              <LanguageSwitcher />
              <IconBtn onClick={toggle} label={themeLabel}>
                <ThemeIcon size={20} />
              </IconBtn>
            </div>

            {/* Mobile hamburger */}
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-150 md:hidden"
              style={{ color: 'var(--text-secondary)' }}
              onClick={() => setDrawerOpen((o) => !o)}
              aria-label="Toggle menu"
              aria-expanded={drawerOpen}
              aria-controls="mobile-menu"
            >
              <Menu size={20} />
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile drawer rendered outside header so it can cover full screen */}
      <MobileMenu
        open={drawerOpen}
        onClose={close}
        theme={theme}
        toggleTheme={toggle}
      />
    </>
  );
}
