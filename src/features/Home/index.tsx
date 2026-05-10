import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

type Category = 'all' | 'organize' | 'convert' | 'security' | 'edit';

interface ToolDef {
  id: string;
  path: string;
  icon: string;
  titleKey: string;
  descKey: string;
  category: Exclude<Category, 'all'>;
  gradient: string;
}

const TOOLS: ToolDef[] = [
  // Organize
  { id: 'merge',        path: '/merge',        icon: '🔀', titleKey: 'tools.merge.title',       descKey: 'tools.merge.description',       category: 'organize', gradient: 'from-violet-500/20 to-purple-500/10' },
  { id: 'split',        path: '/split',        icon: '✂️', titleKey: 'tools.split.title',       descKey: 'tools.split.description',       category: 'organize', gradient: 'from-blue-500/20 to-cyan-500/10' },
  { id: 'organize',     path: '/organize',     icon: '📋', titleKey: 'tools.organize.title',    descKey: 'tools.organize.description',    category: 'organize', gradient: 'from-indigo-500/20 to-blue-500/10' },
  { id: 'rotate',       path: '/rotate',       icon: '🔄', titleKey: 'tools.rotate.title',      descKey: 'tools.rotate.description',      category: 'organize', gradient: 'from-sky-500/20 to-indigo-500/10' },
  { id: 'crop',         path: '/crop',         icon: '⬛', titleKey: 'tools.crop.title',        descKey: 'tools.crop.description',        category: 'organize', gradient: 'from-teal-500/20 to-cyan-500/10' },
  // Convert
  { id: 'compress',     path: '/compress',     icon: '🗜️', titleKey: 'tools.compress.title',   descKey: 'tools.compress.description',    category: 'convert',  gradient: 'from-orange-500/20 to-amber-500/10' },
  { id: 'image-to-pdf', path: '/image-to-pdf', icon: '🖼️', titleKey: 'tools.imageToPdf.title', descKey: 'tools.imageToPdf.description',  category: 'convert',  gradient: 'from-pink-500/20 to-rose-500/10' },
  { id: 'pdf-to-image', path: '/pdf-to-image', icon: '📸', titleKey: 'tools.pdfToImage.title', descKey: 'tools.pdfToImage.description',  category: 'convert',  gradient: 'from-fuchsia-500/20 to-pink-500/10' },
  { id: 'ocr',          path: '/ocr',          icon: '🔍', titleKey: 'tools.ocr.title',        descKey: 'tools.ocr.description',         category: 'convert',  gradient: 'from-emerald-500/20 to-green-500/10' },
  // Security
  { id: 'protect',      path: '/protect',      icon: '🔒', titleKey: 'tools.protect.title',    descKey: 'tools.protect.description',     category: 'security', gradient: 'from-red-500/20 to-rose-500/10' },
  { id: 'unlock',       path: '/unlock',       icon: '🔓', titleKey: 'tools.unlock.title',     descKey: 'tools.unlock.description',      category: 'security', gradient: 'from-amber-500/20 to-yellow-500/10' },
  { id: 'repair',       path: '/repair',       icon: '🔧', titleKey: 'tools.repair.title',     descKey: 'tools.repair.description',      category: 'security', gradient: 'from-slate-500/20 to-gray-500/10' },
  // Edit
  { id: 'watermark',    path: '/watermark',    icon: '💧', titleKey: 'tools.watermark.title',  descKey: 'tools.watermark.description',   category: 'edit',     gradient: 'from-cyan-500/20 to-sky-500/10' },
  { id: 'annotate',     path: '/annotate',     icon: '✏️', titleKey: 'tools.annotate.title',   descKey: 'tools.annotate.description',    category: 'edit',     gradient: 'from-lime-500/20 to-green-500/10' },
  { id: 'sign',         path: '/sign',         icon: '✍️', titleKey: 'tools.sign.title',       descKey: 'tools.sign.description',        category: 'edit',     gradient: 'from-violet-500/20 to-indigo-500/10' },
  { id: 'page-numbers', path: '/page-numbers', icon: '🔢', titleKey: 'tools.pageNumbers.title',descKey: 'tools.pageNumbers.description', category: 'edit',     gradient: 'from-rose-500/20 to-pink-500/10' },
];

const CATEGORY_IDS: Category[] = ['all', 'organize', 'convert', 'security', 'edit'];

function ToolCard({ tool }: { tool: ToolDef }) {
  const { t } = useTranslation();
  return (
    <Link
      to={tool.path}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.5)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--bg-border)'; }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

      <div className="relative">
        <div
          className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl text-xl transition-transform duration-200 group-hover:scale-110"
          style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}
        >
          {tool.icon}
        </div>
        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{t(tool.titleKey)}</h3>
        <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{t(tool.descKey)}</p>
      </div>

      <div
        className="relative mt-auto flex items-center gap-1 text-xs font-medium opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{ color: 'var(--accent)' }}
      >
        {t('buttons.openTool')}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>
      </div>
    </Link>
  );
}

function Badge({ icon, text }: { icon: string; text: string }) {
  return (
    <div
      className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', color: 'var(--text-secondary)' }}
    >
      <span>{icon}</span>
      {text}
    </div>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return TOOLS.filter((tool) => {
      const matchCat = activeCategory === 'all' || tool.category === activeCategory;
      const title = t(tool.titleKey).toLowerCase();
      const desc = t(tool.descKey).toLowerCase();
      const matchQ = !q || title.includes(q) || desc.includes(q);
      return matchCat && matchQ;
    });
  }, [activeCategory, query, t]);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-20 text-center">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)' }}
        />

        <div className="relative mx-auto max-w-3xl">
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider"
            style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--accent)', border: '1px solid rgba(99,102,241,0.3)' }}
          >
            🔒 {t('hero.badge')}
          </div>

          <h1 className="mb-4 text-5xl font-bold leading-tight tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {t('hero.title')}{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #6366F1, #8B5CF6, #A78BFA)' }}
            >
              {t('hero.titleAccent')}
            </span>
          </h1>

          <p className="mb-8 text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Badge icon="⚡" text={t('badges.noLimits')} />
            <Badge icon="🔒" text={t('badges.private')} />
            <Badge icon="✨" text={t('badges.noSignup')} />
            <Badge icon="🌐" text={t('badges.offline')} />
          </div>
        </div>
      </section>

      {/* Tools grid */}
      <section className="mx-auto max-w-7xl px-4 pb-20">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Category tabs */}
          <div
            className="flex gap-1 overflow-x-auto rounded-xl p-1"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}
          >
            {CATEGORY_IDS.map((id) => (
              <button
                key={id}
                onClick={() => setActiveCategory(id)}
                className="shrink-0 rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-150"
                style={
                  activeCategory === id
                    ? { background: 'var(--accent)', color: '#fff' }
                    : { color: 'var(--text-secondary)', background: 'transparent' }
                }
              >
                {t(`categories.${id}`)}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2"
              width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search.placeholder')}
              className="rounded-xl border py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-indigo-500"
              style={{
                background: 'var(--bg-surface)',
                borderColor: 'var(--bg-border)',
                color: 'var(--text-primary)',
                width: 220,
              }}
            />
          </div>
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <span className="text-4xl">🔎</span>
            <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>
              {t('search.noResults', { query })}
            </p>
            <button
              onClick={() => { setQuery(''); setActiveCategory('all'); }}
              className="text-sm" style={{ color: 'var(--accent)' }}
            >
              {t('search.clearFilters')}
            </button>
          </div>
        )}

        {filtered.length > 0 && (
          <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            {t('search.showing', { count: filtered.length, total: TOOLS.length })}
          </p>
        )}
      </section>

      {/* Privacy note */}
      <section
        className="mx-4 mb-16 rounded-2xl p-8 text-center"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}
      >
        <div className="mx-auto max-w-2xl">
          <div className="mb-3 text-3xl">{t('privacy.icon')}</div>
          <h2 className="mb-2 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {t('privacy.title')}
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {t('privacy.body')}
          </p>
        </div>
      </section>
    </div>
  );
}
