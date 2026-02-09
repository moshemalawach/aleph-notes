import { useState } from 'react';
import type { NoteMetadata } from '../../types';
import { useNotesStore } from '../../stores/notes';
import { getChildren } from '../../services/notes';

interface NoteTreeItemProps {
  note: NoteMetadata;
  depth: number;
}

export default function NoteTreeItem({ note, depth }: NoteTreeItemProps) {
  const { notes, currentNoteId, setCurrentNoteId } = useNotesStore();
  const [expanded, setExpanded] = useState(true);
  const children = getChildren(notes, note.id);
  const hasChildren = children.length > 0;
  const isActive = currentNoteId === note.id;

  return (
    <div>
      <button
        onClick={() => setCurrentNoteId(note.id)}
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
      {hasChildren && expanded && (
        <div>
          {children.map((child) => (
            <NoteTreeItem key={child.id} note={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
