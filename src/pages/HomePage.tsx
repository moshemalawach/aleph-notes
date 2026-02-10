import AppShell from '../components/layout/AppShell';
import Sidebar from '../components/sidebar/Sidebar';
import NoteEditor from '../components/editor/NoteEditor';
import { useNotesStore } from '../stores/notes';

export default function HomePage() {
  const { currentNoteId } = useNotesStore();

  return (
    <AppShell>
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {currentNoteId ? (
          <NoteEditor />
        ) : (
          <div className="flex flex-col items-center justify-center h-full select-none">
            {/* The Aleph — a point containing all points */}
            <span
              className="text-[12rem] leading-none font-display text-accent"
              style={{
                animation: 'aleph-breathe 6s ease-in-out infinite',
                fontWeight: 500,
              }}
            >
              &#x2135;
            </span>
            <p className="mt-6 text-ink-muted text-sm tracking-wide font-body">
              Select a note or create a new one
            </p>
          </div>
        )}
      </main>
    </AppShell>
  );
}
