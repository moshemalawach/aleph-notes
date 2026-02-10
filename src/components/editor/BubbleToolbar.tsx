import { useState, useCallback } from 'react';
import type { Editor } from '@tiptap/react';

export default function BubbleToolbar({ editor }: { editor: Editor }) {
  const [linkInput, setLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const openLinkInput = useCallback(() => {
    const existing = editor.getAttributes('link').href ?? '';
    setLinkUrl(existing);
    setLinkInput(true);
  }, [editor]);

  const applyLink = useCallback(() => {
    if (linkUrl.trim()) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl.trim() }).run();
    } else {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    }
    setLinkInput(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  const cancelLink = useCallback(() => {
    setLinkInput(false);
    setLinkUrl('');
    editor.commands.focus();
  }, [editor]);

  const btn = (active: boolean) =>
    `px-2 py-1.5 rounded-md text-sm transition-colors ${
      active
        ? 'bg-accent-soft text-accent'
        : 'text-ink-muted hover:text-ink hover:bg-hover'
    }`;

  return (
    <div className="flex items-center gap-0.5 px-1.5 py-1 bg-elevated border border-edge rounded-lg shadow-lg">
      {linkInput ? (
        <div className="flex items-center gap-1 px-1">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); applyLink(); }
              if (e.key === 'Escape') cancelLink();
            }}
            placeholder="https://..."
            className="w-48 px-2 py-1 text-sm bg-surface border border-edge rounded-md text-ink focus:outline-none focus:border-accent"
            autoFocus
          />
          {/* Confirm */}
          <button onClick={applyLink} className="p-1 rounded-md text-accent hover:bg-accent-soft">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </button>
          {/* Cancel */}
          <button onClick={cancelLink} className="p-1 rounded-md text-ink-muted hover:text-ink hover:bg-hover">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <>
          {/* Bold */}
          <button onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive('bold'))}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" /><path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
            </svg>
          </button>
          {/* Italic */}
          <button onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive('italic'))}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="4" x2="10" y2="20" /><line x1="14" y1="20" x2="5" y2="20" />
            </svg>
          </button>
          {/* Strikethrough */}
          <button onClick={() => editor.chain().focus().toggleStrike().run()} className={btn(editor.isActive('strike'))}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M16 4H9a3 3 0 00-3 3v1a3 3 0 003 3h6a3 3 0 013 3v1a3 3 0 01-3 3H8" />
              <line x1="4" y1="12" x2="20" y2="12" />
            </svg>
          </button>
          {/* Code */}
          <button onClick={() => editor.chain().focus().toggleCode().run()} className={btn(editor.isActive('code'))}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
            </svg>
          </button>

          <div className="w-px h-5 bg-edge mx-0.5" />

          {/* Link */}
          <button onClick={openLinkInput} className={btn(editor.isActive('link'))}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
          </button>
          {/* Highlight */}
          <button onClick={() => editor.chain().focus().toggleHighlight().run()} className={btn(editor.isActive('highlight'))}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
