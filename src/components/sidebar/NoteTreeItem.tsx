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
        className={`w-full flex items-center gap-1 px-2 py-1 text-sm rounded-md transition-colors ${
          isActive
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {hasChildren && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0 cursor-pointer"
          >
            <svg
              className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M6 6l8 4-8 4V6z" />
            </svg>
          </span>
        )}
        {!hasChildren && <span className="w-4 shrink-0" />}
        <span className="shrink-0">{note.properties.icon || '\u{1F4DD}'}</span>
        <span className="truncate">{note.title}</span>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowDeleteConfirm(true);
        }}
        className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 px-1 py-0.5 text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-opacity"
        title="Delete note"
      >
        ...
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
