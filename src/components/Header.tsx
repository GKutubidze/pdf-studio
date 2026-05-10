import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutGrid, Sun, Moon, Menu, X } from 'lucide-react';

function GithubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.167 6.839 9.49.5.09.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.34-3.369-1.34-.454-1.157-1.11-1.465-1.11-1.465-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );
}
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTheme } from '../hooks/useTheme';

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
  const cls =
    'flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-150';
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

export function Header() {
  const { t } = useTranslation();
  const { theme, toggle } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close drawer on outside click
  useEffect(() => {
    if (!drawerOpen) return;
    function handle(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setDrawerOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [drawerOpen]);

  // Close drawer on resize to desktop
  useEffect(() => {
    function handle() { if (window.innerWidth >= 768) setDrawerOpen(false); }
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  const ThemeIcon = theme === 'dark' ? Sun : Moon;
  const themeLabel = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{ borderColor: 'var(--bg-border)', background: 'var(--header-bg)', backdropFilter: 'blur(12px)' }}
      ref={drawerRef}
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
          >
            {drawerOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>
      </div>

      {/* ── Mobile drawer ── */}
      {drawerOpen && (
        <div
          className="border-t md:hidden"
          style={{ borderColor: 'var(--bg-border)', background: 'var(--header-bg)', backdropFilter: 'blur(12px)' }}
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {/* All Tools */}
            <Link
              to="/"
              onClick={() => setDrawerOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
            >
              <LayoutGrid size={18} />
              {t('nav.allTools')}
            </Link>

            {/* GitHub */}
            <a
              href="https://github.com/GKutubidze/pdf-studio"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
            >
              <GithubIcon />
              {t('nav.github')}
            </a>

            {/* Divider */}
            <div className="my-1 border-t" style={{ borderColor: 'var(--bg-border)' }} />

            {/* Language switcher + theme toggle row */}
            <div className="flex items-center justify-between px-3 py-1">
              <LanguageSwitcher />
              <button
                onClick={toggle}
                aria-label={themeLabel}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <ThemeIcon size={18} />
                <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
