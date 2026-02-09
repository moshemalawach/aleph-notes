import { useEffect, useState } from 'react';
import { useNotesStore } from '../../stores/notes';
import { AlephService } from '../../services/aleph';
import { CryptoService } from '../../services/crypto';
import { useAuthStore } from '../../stores/auth';
import { SyncService } from '../../services/sync';
import { sanitizeHtml } from '../../lib/sanitize';
import type { EncryptedPayload } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface Version {
  hash: string;
  time: number;
  content: string | null;
}

export default function VersionHistory({ onClose }: { onClose: () => void }) {
  const { currentNoteId, notes } = useNotesStore();
  const { encryptionKey } = useAuthStore();
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      if (!currentNoteId || !encryptionKey) return;
      const note = notes[currentNoteId];
      if (!note?.currentPostRef) return;

      try {
        const history = await AlephService.getPostHistory(note.currentPostRef);
        const decrypted: Version[] = await Promise.all(
          history.map(async (v) => {
            try {
              const d = (await CryptoService.decrypt(v.content as unknown as EncryptedPayload, encryptionKey)) as { markdown: string };
              return { hash: v.hash, time: v.time, content: d.markdown };
            } catch {
              return { hash: v.hash, time: v.time, content: null };
            }
          }),
        );
        setVersions(decrypted.sort((a, b) => b.time - a.time));
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [currentNoteId, encryptionKey, notes]);

  const handleRestore = async (version: Version) => {
    if (!currentNoteId || !version.content) return;
    await SyncService.saveNoteContent(currentNoteId, version.content);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Version History</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading && <p className="text-gray-400 text-sm">Loading history...</p>}
          {!loading && versions.length === 0 && (
            <p className="text-gray-400 text-sm">No version history available</p>
          )}
          {versions.map((v) => (
            <div key={v.hash} className="mb-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(v.time * 1000), { addSuffix: true })}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreviewContent(v.content)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => handleRestore(v)}
                    className="text-xs text-green-600 dark:text-green-400 hover:underline"
                  >
                    Restore
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {previewContent !== null && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 max-h-48 overflow-y-auto">
            <div
              className="prose dark:prose-invert max-w-none text-sm"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewContent) }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
