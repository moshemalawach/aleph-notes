import type { NoteMetadata } from '../types';

export function createNewNote(overrides: Partial<NoteMetadata> = {}): NoteMetadata {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: 'Untitled',
    parentId: null,
    childIds: [],
    currentPostRef: null,
    properties: {
      tags: [],
      status: 'active',
      created: now,
      modified: now,
    },
    order: now,
    ...overrides,
  };
}

export function getRootNotes(notes: Record<string, NoteMetadata>): NoteMetadata[] {
  return Object.values(notes)
    .filter((n) => n.parentId === null)
    .sort((a, b) => a.order - b.order);
}

export function getChildren(notes: Record<string, NoteMetadata>, parentId: string): NoteMetadata[] {
  return Object.values(notes)
    .filter((n) => n.parentId === parentId)
    .sort((a, b) => a.order - b.order);
}

export function getAllDescendantIds(notes: Record<string, NoteMetadata>, noteId: string): string[] {
  const ids: string[] = [];
  const stack = [noteId];
  while (stack.length > 0) {
    const current = stack.pop()!;
    const note = notes[current];
    if (note) {
      for (const childId of note.childIds) {
        ids.push(childId);
        stack.push(childId);
      }
    }
  }
  return ids;
}
