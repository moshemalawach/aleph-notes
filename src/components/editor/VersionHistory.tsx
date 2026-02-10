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
    <div className="fixed inset-0 bg-overlay backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-elevated border border-edge rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col animate-fade-in-scale" style={{ boxShadow: 'var(--c-shadow-lg)' }}>
        <div className="p-5 border-b border-edge flex items-center justify-between">
          <h2 className="text-base font-display font-semibold text-ink">Version History</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-hover transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="flex items-center gap-2 py-6 justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <p className="text-ink-muted text-[13px] font-body">Loading history...</p>
            </div>
          )}
          {!loading && versions.length === 0 && (
            <p className="text-ink-muted text-[13px] text-center py-6 font-body">No version history available</p>
          )}
          {versions.map((v) => (
            <div
              key={v.hash}
              className="mb-2 p-3 rounded-lg border border-edge hover:border-edge-strong transition-colors duration-150"
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-ink-secondary font-body">
                  {formatDistanceToNow(new Date(v.time * 1000), { addSuffix: true })}
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPreviewContent(v.content)}
                    className="text-xs text-accent hover:text-accent-hover transition-colors font-body"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => handleRestore(v)}
                    className="text-xs text-accent hover:text-accent-hover transition-colors font-body"
                  >
                    Restore
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {previewContent !== null && (
          <div className="border-t border-edge p-4 max-h-48 overflow-y-auto">
            <div
              className="share-prose text-[13px] text-ink-secondary font-body leading-relaxed"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewContent) }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
