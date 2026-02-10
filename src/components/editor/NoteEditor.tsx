import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { useNotesStore } from '../../stores/notes';
import { SyncService } from '../../services/sync';
import NoteTitle from './NoteTitle';
import ShareButton from '../ui/ShareButton';
import VersionHistory from './VersionHistory';

export default function NoteEditor() {
  const [showHistory, setShowHistory] = useState(false);
  const { currentNoteId, setCurrentNoteContent } = useNotesStore();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoadingRef = useRef(false);
  const currentNoteIdRef = useRef(currentNoteId);

  useEffect(() => {
    currentNoteIdRef.current = currentNoteId;
  }, [currentNoteId]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
      Image,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[300px]',
      },
    },
    onUpdate: ({ editor }) => {
      if (isLoadingRef.current) return;
      const html = editor.getHTML();
      setCurrentNoteContent(html);

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      const noteId = currentNoteIdRef.current;
      if (noteId) {
        saveTimerRef.current = setTimeout(() => {
          SyncService.saveNoteContent(noteId, html);
        }, 1500);
      }
    },
  });

  useEffect(() => {
    if (!currentNoteId || !editor) return;

    isLoadingRef.current = true;
    setCurrentNoteContent(null);

    SyncService.loadNoteContent(currentNoteId).then((content) => {
      if (content !== null) {
        editor.commands.setContent(content || '<p></p>');
        setCurrentNoteContent(content);
      } else {
        editor.commands.setContent('<p></p>');
        setCurrentNoteContent('');
      }
      isLoadingRef.current = false;
    });

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [currentNoteId, editor]);

  if (!currentNoteId) return null;

  return (
    <div className="max-w-2xl mx-auto px-10 py-10 animate-fade-in">
      {/* Toolbar */}
      <div className="flex justify-end gap-1 mb-8">
        <button
          onClick={() => setShowHistory(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] rounded-lg text-ink-muted hover:text-ink hover:bg-hover transition-all duration-200 font-body"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          History
        </button>
        <ShareButton />
      </div>

      {showHistory && <VersionHistory onClose={() => setShowHistory(false)} />}

      <NoteTitle />

      {/* Divider */}
      <div className="h-px bg-edge my-6" />

      <div className="font-body">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
