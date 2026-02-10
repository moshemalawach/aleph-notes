import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
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
  const { notes, addNote, setCurrentNoteId, updateNote } = useNotesStore();
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const items = searchQuery ? filteredRoots : rootNotes;
    const oldIndex = items.findIndex((n) => n.id === active.id);
    const newIndex = items.findIndex((n) => n.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex);
    reordered.forEach((note, i) => {
      updateNote(note.id, { order: i });
    });
    SyncService.scheduleSave();
  };

  const emptyMessage = !isInitialized
    ? 'Connect wallet to view notes'
    : filteredRoots.length === 0 && searchQuery
      ? 'No matching notes'
      : filteredRoots.length === 0
        ? 'No notes yet'
        : null;

  const sidebarInner = (
    <>
      <SearchBar />
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {emptyMessage && (
          <p className="text-[13px] text-ink-muted px-3 py-6 text-center font-body">{emptyMessage}</p>
        )}
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredRoots.map(n => n.id)} strategy={verticalListSortingStrategy}>
            {filteredRoots.map((note, i) => (
              <div
                key={note.id}
                className="animate-fade-in"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <NoteTreeItem note={note} depth={0} />
              </div>
            ))}
          </SortableContext>
        </DndContext>
      </div>
      {isInitialized && (
        <div className="border-t border-edge p-3 space-y-1">
          <button
            onClick={handleNewNote}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg bg-accent/10 text-accent hover:bg-accent/15 transition-all duration-200 font-body"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
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
        <div
          className="fixed inset-0 bg-overlay z-40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
        <aside className="fixed left-0 top-14 bottom-0 w-72 bg-sidebar z-50 flex flex-col border-r border-edge animate-slide-in-left">
          {sidebarInner}
        </aside>
      </>
    );
  }

  return (
    <aside className="w-72 border-r border-edge bg-sidebar flex flex-col shrink-0 overflow-hidden">
      {sidebarInner}
    </aside>
  );
}
