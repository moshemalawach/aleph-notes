import { useState } from 'react';
import { ShareService } from '../../services/share';
import { useNotesStore } from '../../stores/notes';

export default function ShareButton() {
  const { currentNoteId, notes, currentNoteContent } = useNotesStore();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  if (!currentNoteId) return null;
  const note = notes[currentNoteId];
  if (!note) return null;

  const handleShare = async () => {
    setSharing(true);
    try {
      const url = await ShareService.createShareLink(
        currentNoteContent || '',
        note.title,
      );
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
    } catch (err) {
      console.error('Share failed:', err);
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleShare}
        disabled={sharing}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] rounded-lg text-ink-muted hover:text-ink hover:bg-hover transition-all duration-200 disabled:opacity-50 font-body"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
        </svg>
        {sharing ? 'Sharing...' : 'Share'}
      </button>
      {shareUrl && (
        <span className="text-xs text-accent animate-fade-in font-body">
          Link copied
        </span>
      )}
    </div>
  );
}
