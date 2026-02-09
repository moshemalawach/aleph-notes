import { useNotesStore } from '../../stores/notes';
import { useUIStore } from '../../stores/ui';
import { useAuthStore } from '../../stores/auth';
import { getRootNotes, createNewNote } from '../../services/notes';
import { SyncService } from '../../services/sync';
import { useIsMobile } from '../../hooks/useMediaQuery';
import SearchBar from './SearchBar';
import NoteTreeItem from './NoteTreeItem';
import ExportButton from '../ui/ExportButton';

export default function Sidebar() {
  const { notes, addNote, setCurrentNoteId } = useNotesStore();
  const { sidebarOpen, searchQuery, setSidebarOpen } = useUIStore();
  const { isInitialized } = useAuthStore();
  const isMobile = useIsMobile();

  if (!sidebarOpen) return null;

  const rootNotes = getRootNotes(notes);

  const filteredRoots = searchQuery
    ? Object.values(notes).filter((n) =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : rootNotes;

  const handleNewNote = () => {
    const note = createNewNote();
    addNote(note);
    setCurrentNoteId(note.id);
    SyncService.scheduleSave();
  };

  const sidebarInner = (
    <>
      <SearchBar />
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {!isInitialized && (
          <p className="text-sm text-gray-400 px-2 py-4">Connect wallet to view notes</p>
        )}
        {isInitialized && filteredRoots.length === 0 && !searchQuery && (
          <p className="text-sm text-gray-400 px-2 py-4">No notes yet. Create one!</p>
        )}
        {isInitialized && filteredRoots.length === 0 && searchQuery && (
          <p className="text-sm text-gray-400 px-2 py-4">No matching notes</p>
        )}
        {filteredRoots.map((note) => (
          <NoteTreeItem key={note.id} note={note} depth={0} />
        ))}
      </div>
      {isInitialized && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-3">
          <button
            onClick={handleNewNote}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Note
          </button>
          <ExportButton />
        </div>
      )}
    </>
  );

  if (isMobile) {
    return (
      <>
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
        <aside className="fixed left-0 top-12 bottom-0 w-64 bg-white dark:bg-gray-900 z-50 flex flex-col border-r border-gray-200 dark:border-gray-700">
          {sidebarInner}
        </aside>
      </>
    );
  }

  return (
    <aside className="w-64 border-r border-gray-200 dark:border-gray-700 flex flex-col shrink-0 overflow-hidden">
      {sidebarInner}
    </aside>
  );
}
