export interface NoteMetadata {
  id: string;
  title: string;
  parentId: string | null;
  childIds: string[];
  currentPostRef: string | null;
  properties: NoteProperties;
  order: number;
}

export interface NoteProperties {
  tags: string[];
  status: 'active' | 'archived' | 'draft';
  created: number;
  modified: number;
  icon?: string;
  color?: string;
}

export interface NotesAggregate {
  notes: Record<string, NoteMetadata>;
  settings: UserSettings;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  lastOpenNote: string | null;
  sidebarWidth: number;
}

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
}
