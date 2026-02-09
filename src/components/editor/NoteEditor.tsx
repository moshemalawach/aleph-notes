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
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[200px]',
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
    <div className="max-w-3xl mx-auto px-8 py-8">
      <div className="flex justify-end gap-2 mb-4">
        <button
          onClick={() => setShowHistory(true)}
          className="px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          History
        </button>
        <ShareButton />
      </div>
      {showHistory && <VersionHistory onClose={() => setShowHistory(false)} />}
      <NoteTitle />
      <div className="mt-6">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
