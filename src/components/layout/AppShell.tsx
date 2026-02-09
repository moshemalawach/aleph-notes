import type { ReactNode } from 'react';
import Header from './Header';

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
