import type { ReactNode } from 'react';

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {children}
    </div>
  );
}
