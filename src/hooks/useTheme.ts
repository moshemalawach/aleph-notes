import { useEffect } from 'react';
import { useNotesStore } from '../stores/notes';

export function useTheme() {
  const theme = useNotesStore((s) => s.settings.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
}
