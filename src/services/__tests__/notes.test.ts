import { describe, it, expect } from 'vitest';
import { createNewNote, getRootNotes } from '../notes';

describe('createNewNote', () => {
  it('creates a note with default values', () => {
    const note = createNewNote();
    expect(note.id).toMatch(/^[0-9a-f-]+$/);
    expect(note.title).toBe('Untitled');
    expect(note.parentId).toBeNull();
    expect(note.childIds).toEqual([]);
    expect(note.currentPostRef).toBeNull();
    expect(note.properties.status).toBe('active');
    expect(note.properties.tags).toEqual([]);
    expect(note.order).toBeGreaterThanOrEqual(0);
  });

  it('creates a note with a parent', () => {
    const note = createNewNote({ parentId: 'parent-1' });
    expect(note.parentId).toBe('parent-1');
  });
});

describe('getRootNotes', () => {
  it('returns root notes sorted by order', () => {
    const notes = {
      a: { id: 'a', title: 'A', parentId: null, childIds: ['c'], currentPostRef: null, order: 1, properties: { tags: [], status: 'active' as const, created: 0, modified: 0 } },
      b: { id: 'b', title: 'B', parentId: null, childIds: [], currentPostRef: null, order: 0, properties: { tags: [], status: 'active' as const, created: 0, modified: 0 } },
      c: { id: 'c', title: 'C', parentId: 'a', childIds: [], currentPostRef: null, order: 0, properties: { tags: [], status: 'active' as const, created: 0, modified: 0 } },
    };
    const roots = getRootNotes(notes);
    expect(roots.map(n => n.id)).toEqual(['b', 'a']);
  });
});
