import type { ReactNode } from 'react';

interface ToolPageShellProps {
  title: string;
  description: string;
  icon: string;
  children: ReactNode;
}

export function ToolPageShell({ title, description, icon, children }: ToolPageShellProps) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
          style={{ background: 'var(--accent-muted, rgba(99,102,241,0.15))', border: '1px solid rgba(99,102,241,0.25)' }}
        >
          {icon}
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
