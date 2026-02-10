import { CryptoService } from './crypto';
import { AlephService } from './aleph';
import { useAuthStore } from '../stores/auth';
import { useNotesStore } from '../stores/notes';
import type { NotesAggregate, EncryptedPayload } from '../types';

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export const SyncService = {
  scheduleSave(delayMs = 1000): void {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      SyncService.saveNow();
    }, delayMs);
  },

  async saveNow(): Promise<void> {
    const key = useAuthStore.getState().encryptionKey;
    if (!key) return;
    const aggregate = useNotesStore.getState().toAggregate();
    useNotesStore.getState().setIsSaving(true);
    try {
      const encrypted = await CryptoService.encrypt(aggregate, key);
      await AlephService.saveAggregate(encrypted);
    } catch (err) {
      console.error('Failed to save aggregate:', err);
    } finally {
      useNotesStore.getState().setIsSaving(false);
    }
  },

  async loadAggregate(): Promise<NotesAggregate | null> {
    const key = useAuthStore.getState().encryptionKey;
    if (!key) return null;
    const raw = await AlephService.fetchAggregate();
    if (!raw) return null;
    return (await CryptoService.decrypt(raw as EncryptedPayload, key)) as NotesAggregate;
  },

  async saveNoteContent(noteId: string, content: string): Promise<string | null> {
    const key = useAuthStore.getState().encryptionKey;
    if (!key) return null;
    const note = useNotesStore.getState().notes[noteId];
    if (!note) return null;
    const encrypted = await CryptoService.encrypt({ markdown: content }, key);
    let originalRef = note.currentPostRef;
    const isNew = !originalRef;
    if (originalRef) {
      await AlephService.amendPost(originalRef, encrypted);
    } else {
      originalRef = await AlephService.createPost(encrypted);
    }
    useNotesStore.getState().updateNote(noteId, {
      currentPostRef: originalRef,
      properties: { ...note.properties, modified: Date.now() },
    });
    // Only save aggregate when a new post is created (need to persist the ref)
    if (isNew) {
      SyncService.scheduleSave();
    }
    return originalRef;
  },

  async loadNoteContent(noteId: string): Promise<string | null> {
    const key = useAuthStore.getState().encryptionKey;
    if (!key) return null;
    const note = useNotesStore.getState().notes[noteId];
    if (!note?.currentPostRef) return '';
    try {
      const raw = await AlephService.getPost(note.currentPostRef);
      const decrypted = (await CryptoService.decrypt(raw as EncryptedPayload, key)) as { markdown: string };
      return decrypted.markdown;
    } catch (err) {
      console.error('Failed to load note content:', err);
      return null;
    }
  },
};
