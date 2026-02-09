import { create } from 'zustand';
import type { NoteMetadata, NotesAggregate, UserSettings } from '../types';
import { DEFAULT_SIDEBAR_WIDTH } from '../lib/constants';

interface NotesState {
  notes: Record<string, NoteMetadata>;
  settings: UserSettings;
  currentNoteId: string | null;
  currentNoteContent: string | null;
  isLoading: boolean;
  isSaving: boolean;

  setNotes: (notes: Record<string, NoteMetadata>) => void;
  setSettings: (settings: UserSettings) => void;
  setCurrentNoteId: (id: string | null) => void;
  setCurrentNoteContent: (content: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsSaving: (saving: boolean) => void;

  updateNote: (id: string, updates: Partial<NoteMetadata>) => void;
  addNote: (note: NoteMetadata) => void;
  removeNote: (id: string) => void;

  loadFromAggregate: (aggregate: NotesAggregate) => void;
  toAggregate: () => NotesAggregate;

  reset: () => void;
}

const defaultSettings: UserSettings = {
  theme: 'dark',
  lastOpenNote: null,
  sidebarWidth: DEFAULT_SIDEBAR_WIDTH,
};

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: {},
  settings: defaultSettings,
  currentNoteId: null,
  currentNoteContent: null,
  isLoading: false,
  isSaving: false,

  setNotes: (notes) => set({ notes }),
  setSettings: (settings) => set({ settings }),
  setCurrentNoteId: (id) => set({ currentNoteId: id }),
  setCurrentNoteContent: (content) => set({ currentNoteContent: content }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsSaving: (saving) => set({ isSaving: saving }),

  updateNote: (id, updates) =>
    set((state) => ({
      notes: {
        ...state.notes,
        [id]: { ...state.notes[id], ...updates },
      },
    })),

  addNote: (note) =>
    set((state) => ({
      notes: { ...state.notes, [note.id]: note },
    })),

  removeNote: (id) =>
    set((state) => {
      const { [id]: _, ...rest } = state.notes;
      return { notes: rest };
    }),

  loadFromAggregate: (aggregate) =>
    set({
      notes: aggregate.notes,
      settings: { ...defaultSettings, ...aggregate.settings },
    }),

  toAggregate: () => ({
    notes: get().notes,
    settings: get().settings,
  }),

  reset: () =>
    set({
      notes: {},
      settings: defaultSettings,
      currentNoteId: null,
      currentNoteContent: null,
      isLoading: false,
      isSaving: false,
    }),
}));
