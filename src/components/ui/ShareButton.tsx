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
        className="px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {sharing ? 'Creating link...' : 'Share'}
      </button>
      {shareUrl && (
        <span className="text-xs text-green-600 dark:text-green-400">
          Link copied!
        </span>
      )}
    </div>
  );
}
