import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { NoteMetadata } from '../../types';
import { useNotesStore } from '../../stores/notes';
import { useUIStore } from '../../stores/ui';
import { getChildren, getAllDescendantIds } from '../../services/notes';
import { SyncService } from '../../services/sync';
import { useIsMobile } from '../../hooks/useMediaQuery';
import ConfirmDialog from '../ui/ConfirmDialog';

interface NoteTreeItemProps {
  note: NoteMetadata;
  depth: number;
}

export default function NoteTreeItem({ note, depth }: NoteTreeItemProps) {
  const { notes, currentNoteId, setCurrentNoteId, removeNote, updateNote } = useNotesStore();
  const { setSidebarOpen } = useUIStore();
  const isMobile = useIsMobile();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: note.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const [expanded, setExpanded] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const children = getChildren(notes, note.id);
  const hasChildren = children.length > 0;
  const isActive = currentNoteId === note.id;

  const handleDelete = () => {
    const descendants = getAllDescendantIds(notes, note.id);
    [note.id, ...descendants].forEach((id) => removeNote(id));
    if (note.parentId && notes[note.parentId]) {
      updateNote(note.parentId, {
        childIds: notes[note.parentId].childIds.filter((id) => id !== note.id),
      });
    }
    if (currentNoteId === note.id || descendants.includes(currentNoteId ?? '')) {
      setCurrentNoteId(null);
    }
    SyncService.scheduleSave();
    setShowDeleteConfirm(false);
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="group relative">
      <button
        onClick={() => {
          setCurrentNoteId(note.id);
          if (isMobile) setSidebarOpen(false);
        }}
        className={`w-full flex items-center gap-1.5 px-2.5 py-[7px] text-[13px] rounded-lg transition-all duration-150 font-body ${
          isActive
            ? 'bg-accent-soft text-accent border-l-2 border-accent'
            : 'hover:bg-hover text-ink-secondary hover:text-ink'
        }`}
        style={{ paddingLeft: `${depth * 16 + 10}px` }}
      >
        {hasChildren && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="w-4 h-4 flex items-center justify-center text-ink-ghost hover:text-ink-secondary shrink-0 cursor-pointer transition-colors"
          >
            <svg
              className={`w-3 h-3 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M6 6l8 4-8 4V6z" />
            </svg>
          </span>
        )}
        {!hasChildren && <span className="w-4 shrink-0" />}
        <span className="shrink-0 text-sm">{note.properties.icon || '\u{1F4DD}'}</span>
        <span className="truncate">{note.title}</span>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowDeleteConfirm(true);
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded text-ink-ghost hover:text-danger hover:bg-hover transition-all duration-150"
        title="Delete note"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      {hasChildren && expanded && (
        <div>
          {children.map((child) => (
            <NoteTreeItem key={child.id} note={child} depth={depth + 1} />
          ))}
        </div>
      )}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete note"
        message={`Are you sure you want to delete "${note.title}"${hasChildren ? ' and all its children' : ''}? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
