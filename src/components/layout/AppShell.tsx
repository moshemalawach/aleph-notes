import type { ReactNode } from 'react';
import Header from './Header';

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="noise-bg flex flex-col h-screen bg-canvas text-ink">
      {/* Subtle ambient gradient */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: 'var(--c-gradient-subtle)' }}
      />
      <Header />
      <div className="relative flex flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
