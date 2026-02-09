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
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">Select a note or create a new one</p>
          </div>
        )}
      </main>
    </AppShell>
  );
}
