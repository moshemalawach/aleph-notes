import { useNotesStore } from '../../stores/notes';
import { useUIStore } from '../../stores/ui';
import ConnectWalletButton from '../ui/ConnectWalletButton';

export default function Header() {
  const { settings, setSettings, isSaving } = useNotesStore();
  const { toggleSidebar } = useUIStore();

  const toggleTheme = () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    setSettings({ ...settings, theme: newTheme });
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <header className="relative z-10 h-14 border-b border-edge flex items-center justify-between px-5 bg-surface/80 backdrop-blur-md shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-hover transition-all duration-200"
          aria-label="Toggle sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          </svg>
        </button>
        <div className="flex items-center gap-2.5">
          <span className="text-accent text-xl leading-none select-none font-display" style={{ fontWeight: 600 }}>
            &#x2135;
          </span>
          <span className="font-display text-[15px] font-semibold tracking-tight text-ink">
            Aleph Notes
          </span>
        </div>
        {isSaving && (
          <div className="flex items-center gap-1.5 ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-xs text-ink-muted">Saving</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-hover transition-all duration-200"
          aria-label="Toggle theme"
        >
          {settings.theme === 'dark' ? (
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
          ) : (
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>
          )}
        </button>
        <ConnectWalletButton />
      </div>
    </header>
  );
}
