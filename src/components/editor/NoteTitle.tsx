import { useEffect, useRef } from 'react';
import { useNotesStore } from '../../stores/notes';
import { SyncService } from '../../services/sync';

export default function NoteTitle() {
  const { currentNoteId, notes, updateNote } = useNotesStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const note = currentNoteId ? notes[currentNoteId] : null;

  useEffect(() => {
    if (inputRef.current && note) {
      inputRef.current.value = note.title;
    }
  }, [currentNoteId, note?.title]);

  if (!note) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNote(note.id, { title: e.target.value });
    SyncService.scheduleSave();
  };

  return (
    <input
      ref={inputRef}
      defaultValue={note.title}
      onChange={handleChange}
      placeholder="Untitled"
      className="w-full text-[2.25rem] font-display font-semibold bg-transparent border-none outline-none text-ink placeholder:text-ink-ghost leading-tight tracking-tight"
    />
  );
}
