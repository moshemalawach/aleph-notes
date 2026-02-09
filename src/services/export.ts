import JSZip from 'jszip';
import { useNotesStore } from '../stores/notes';
import { SyncService } from './sync';
import { getChildren } from './notes';
import type { NoteMetadata } from '../types';

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9\-_ ]/g, '').trim() || 'untitled';
}

async function addNoteToZip(
  zip: JSZip,
  note: NoteMetadata,
  notes: Record<string, NoteMetadata>,
  path: string,
): Promise<void> {
  const content = await SyncService.loadNoteContent(note.id);
  const frontmatter = [
    '---',
    `title: "${note.title}"`,
    `created: ${new Date(note.properties.created).toISOString()}`,
    `modified: ${new Date(note.properties.modified).toISOString()}`,
    `status: ${note.properties.status}`,
    note.properties.tags.length > 0 ? `tags: [${note.properties.tags.join(', ')}]` : null,
    '---',
    '',
  ]
    .filter(Boolean)
    .join('\n');

  const markdown = frontmatter + (content || '');
  const filename = `${path}${sanitizeFilename(note.title)}.md`;
  zip.file(filename, markdown);

  const children = getChildren(notes, note.id);
  if (children.length > 0) {
    const folderPath = `${path}${sanitizeFilename(note.title)}/`;
    for (const child of children) {
      await addNoteToZip(zip, child, notes, folderPath);
    }
  }
}

export async function exportAllNotes(): Promise<void> {
  const { notes } = useNotesStore.getState();
  const zip = new JSZip();
  const rootNotes = Object.values(notes).filter((n) => n.parentId === null);

  for (const note of rootNotes) {
    await addNoteToZip(zip, note, notes, '');
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `aleph-notes-export-${new Date().toISOString().slice(0, 10)}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
