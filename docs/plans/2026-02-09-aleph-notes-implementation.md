# Aleph Notes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an end-to-end encrypted, Notion-like markdown note app on Aleph Cloud's decentralized storage.

**Architecture:** React SPA with Vite + TypeScript. Zustand for state management. Tiptap for rich text editing. Web Crypto API (AES-GCM-256) for E2E encryption. Aleph Cloud SDK for decentralized storage (AGGREGATE for metadata, POST for note content, STORE for images). Wallet-derived ephemeral keys for auth and encryption.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, Tiptap, Zustand, ethers.js v6, @aleph-sdk/client, @aleph-sdk/ethereum, Web Crypto API, DOMPurify

---

## Phase 1: Project Scaffolding & Core Infrastructure

### Task 1: Initialize Vite + React + TypeScript project

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`
- Create: `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`
- Create: `postcss.config.js`, `tailwind.config.js`, `src/index.css`
- Create: `.gitignore`

**Step 1: Scaffold project with Vite**

```bash
npm create vite@latest . -- --template react-ts
```

Accept overwriting existing files if prompted (only docs/ exists).

**Step 2: Install core dependencies**

```bash
npm install
npm install zustand react-router-dom date-fns dompurify
npm install -D tailwindcss @tailwindcss/vite @types/dompurify
```

**Step 3: Configure Tailwind**

Replace `src/index.css` with:

```css
@import "tailwindcss";
```

Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
```

**Step 4: Verify dev server starts**

```bash
npm run dev
```

Expected: Dev server starts on localhost:5173, page renders with Vite + React template.

**Step 5: Clean up template boilerplate**

Remove `src/App.css`, `src/assets/`. Replace `src/App.tsx` with:

```tsx
export default function App() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <h1 className="text-2xl font-bold p-8">Aleph Notes</h1>
    </div>
  )
}
```

**Step 6: Verify Tailwind is working**

```bash
npm run dev
```

Expected: "Aleph Notes" renders with bold text and proper background.

**Step 7: Commit**

```bash
git add -A && git commit -m "feat: scaffold Vite + React + TypeScript + Tailwind project"
```

---

### Task 2: Set up project structure and routing

**Files:**
- Create: `src/pages/HomePage.tsx`
- Create: `src/pages/SharePage.tsx`
- Create: `src/components/layout/AppShell.tsx`
- Create: `src/lib/constants.ts`
- Create: `src/lib/sanitize.ts`
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

**Step 1: Create directory structure**

```bash
mkdir -p src/{components/{layout,sidebar,editor,ui},pages,lib,services,stores,types,hooks}
```

**Step 2: Create types file**

Create `src/types/index.ts`:

```typescript
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
```

**Step 3: Create constants**

Create `src/lib/constants.ts`:

```typescript
export const ALEPH_CHANNEL = 'aleph-notes';
export const AGGREGATE_KEY = 'aleph-notes-data';
export const SIGN_MESSAGE = 'Aleph Notes Encryption Key';
export const DEFAULT_SIDEBAR_WIDTH = 280;
```

**Step 4: Create sanitize utility**

Create `src/lib/sanitize.ts`:

```typescript
import DOMPurify from 'dompurify';

/**
 * Sanitize HTML to prevent XSS. Use this whenever rendering user-generated
 * or decrypted HTML content.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty);
}
```

**Step 5: Create AppShell layout**

Create `src/components/layout/AppShell.tsx`:

```tsx
import { ReactNode } from 'react';

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {children}
    </div>
  );
}
```

**Step 6: Create placeholder pages**

Create `src/pages/HomePage.tsx`:

```tsx
import AppShell from '../components/layout/AppShell';

export default function HomePage() {
  return (
    <AppShell>
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Connect wallet to get started</p>
      </div>
    </AppShell>
  );
}
```

Create `src/pages/SharePage.tsx`:

```tsx
export default function SharePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
      <p className="text-gray-500">Shared note viewer</p>
    </div>
  );
}
```

**Step 7: Set up React Router**

Update `src/App.tsx`:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SharePage from './pages/SharePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/share/:hash" element={<SharePage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

**Step 8: Verify routing works**

```bash
npm run dev
```

Navigate to `/` and `/share/test`. Both should render their placeholder content.

**Step 9: Commit**

```bash
git add -A && git commit -m "feat: add project structure, types, routing, and layout shell"
```

---

### Task 3: Implement CryptoService (encryption layer)

**Files:**
- Create: `src/services/crypto.ts`
- Create: `src/services/__tests__/crypto.test.ts`

**Step 1: Install test dependencies**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Add to `vite.config.ts` (update the existing config):

```typescript
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
```

Add to `tsconfig.app.json` compilerOptions: `"types": ["vitest/globals"]`

**Step 2: Write the failing tests**

Create `src/services/__tests__/crypto.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { CryptoService } from '../crypto';

describe('CryptoService', () => {
  const fakeSignature = '0x' + 'ab'.repeat(65);

  it('derives a CryptoKey from a signature', async () => {
    const key = await CryptoService.deriveKey(fakeSignature);
    expect(key).toBeInstanceOf(CryptoKey);
    expect(key.algorithm).toMatchObject({ name: 'AES-GCM', length: 256 });
    expect(key.usages).toContain('encrypt');
    expect(key.usages).toContain('decrypt');
  });

  it('derives the same key from the same signature', async () => {
    const key1 = await CryptoService.deriveKey(fakeSignature);
    const key2 = await CryptoService.deriveKey(fakeSignature);
    const exported1 = await crypto.subtle.exportKey('raw', key1);
    const exported2 = await crypto.subtle.exportKey('raw', key2);
    expect(new Uint8Array(exported1)).toEqual(new Uint8Array(exported2));
  });

  it('encrypts and decrypts JSON data round-trip', async () => {
    const key = await CryptoService.deriveKey(fakeSignature);
    const data = { hello: 'world', count: 42 };
    const encrypted = await CryptoService.encrypt(data, key);
    expect(encrypted).toHaveProperty('ciphertext');
    expect(encrypted).toHaveProperty('iv');
    expect(typeof encrypted.ciphertext).toBe('string');
    expect(typeof encrypted.iv).toBe('string');
    const decrypted = await CryptoService.decrypt(encrypted, key);
    expect(decrypted).toEqual(data);
  });

  it('produces different ciphertexts for the same plaintext (unique IVs)', async () => {
    const key = await CryptoService.deriveKey(fakeSignature);
    const data = { same: 'data' };
    const enc1 = await CryptoService.encrypt(data, key);
    const enc2 = await CryptoService.encrypt(data, key);
    expect(enc1.ciphertext).not.toBe(enc2.ciphertext);
    expect(enc1.iv).not.toBe(enc2.iv);
  });

  it('fails to decrypt with wrong key', async () => {
    const key1 = await CryptoService.deriveKey(fakeSignature);
    const key2 = await CryptoService.deriveKey('0x' + 'cd'.repeat(65));
    const encrypted = await CryptoService.encrypt({ secret: true }, key1);
    await expect(CryptoService.decrypt(encrypted, key2)).rejects.toThrow();
  });

  it('derives an ephemeral private key from a signature', () => {
    const privateKey = CryptoService.deriveEphemeralPrivateKey(fakeSignature);
    expect(privateKey).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it('derives the same ephemeral private key from the same signature', () => {
    const pk1 = CryptoService.deriveEphemeralPrivateKey(fakeSignature);
    const pk2 = CryptoService.deriveEphemeralPrivateKey(fakeSignature);
    expect(pk1).toBe(pk2);
  });
});
```

**Step 3: Run tests to verify they fail**

```bash
npx vitest run src/services/__tests__/crypto.test.ts
```

Expected: FAIL — `CryptoService` not found.

**Step 4: Implement CryptoService**

Create `src/services/crypto.ts`:

```typescript
import { type EncryptedPayload } from '../types';

function hexToBytes(hex: string): Uint8Array {
  const cleaned = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Fixed salt for deterministic key derivation from wallet signature.
// This is safe because the signature itself is high-entropy.
const FIXED_SALT = new TextEncoder().encode('aleph-notes-v1');

export const CryptoService = {
  /**
   * Derive an AES-GCM-256 key from an Ethereum wallet signature using HKDF.
   * Deterministic: same signature always produces same key.
   */
  async deriveKey(signature: string): Promise<CryptoKey> {
    const signatureBytes = hexToBytes(signature);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      signatureBytes,
      'HKDF',
      false,
      ['deriveKey'],
    );

    return crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        salt: FIXED_SALT,
        info: new TextEncoder().encode('aleph-notes-encryption'),
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    );
  },

  /**
   * Encrypt any JSON-serializable data with AES-GCM-256.
   * Returns base64-encoded ciphertext and IV.
   */
  async encrypt(data: unknown, key: CryptoKey): Promise<EncryptedPayload> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode(JSON.stringify(data));

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      plaintext,
    );

    return {
      ciphertext: arrayBufferToBase64(ciphertext),
      iv: arrayBufferToBase64(iv),
    };
  },

  /**
   * Decrypt an EncryptedPayload back to its original JSON value.
   */
  async decrypt(payload: EncryptedPayload, key: CryptoKey): Promise<unknown> {
    const ciphertext = base64ToArrayBuffer(payload.ciphertext);
    const iv = base64ToArrayBuffer(payload.iv);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      key,
      ciphertext,
    );

    return JSON.parse(new TextDecoder().decode(decrypted));
  },

  /**
   * Derive a deterministic Ethereum private key from a wallet signature.
   * Used to create an ephemeral account for signing Aleph messages.
   */
  deriveEphemeralPrivateKey(signature: string): string {
    // Use the first 32 bytes of the signature (the `r` value) as a private key.
    // The r value of an ECDSA signature is 32 bytes of high-entropy data.
    const sigBytes = hexToBytes(signature);
    const privateKeyBytes = sigBytes.slice(0, 32);
    return bytesToHex(privateKeyBytes);
  },
};
```

**Step 5: Run tests to verify they pass**

```bash
npx vitest run src/services/__tests__/crypto.test.ts
```

Expected: All 7 tests pass.

**Step 6: Commit**

```bash
git add -A && git commit -m "feat: implement CryptoService with AES-GCM-256 encryption and key derivation"
```

---

### Task 4: Implement AlephService (storage layer)

**Files:**
- Create: `src/services/aleph.ts`

**Step 1: Install Aleph SDK and ethers**

```bash
npm install @aleph-sdk/client @aleph-sdk/ethereum @aleph-sdk/account ethers
```

Note: If `@aleph-sdk/client` has peer dependency issues, try `npm install --legacy-peer-deps`. The Aleph SDK may not be updated for the very latest Node — this is expected.

**Step 2: Implement AlephService**

Create `src/services/aleph.ts`:

```typescript
import { AuthenticatedAlephHttpClient, AlephHttpClient } from '@aleph-sdk/client';
import { importAccountFromPrivateKey, ETHAccount } from '@aleph-sdk/ethereum';
import { ALEPH_CHANNEL, AGGREGATE_KEY } from '../lib/constants';

let authenticatedClient: AuthenticatedAlephHttpClient | null = null;
let publicClient: AlephHttpClient | null = null;
let ephemeralAccount: ETHAccount | null = null;
let mainAddress: string | null = null;

function getPublicClient(): AlephHttpClient {
  if (!publicClient) {
    publicClient = new AlephHttpClient();
  }
  return publicClient;
}

function getAuthClient(): AuthenticatedAlephHttpClient {
  if (!authenticatedClient) {
    throw new Error('Not authenticated. Call initializeWithEphemeralKey first.');
  }
  return authenticatedClient;
}

export const AlephService = {
  /**
   * Initialize the service with an ephemeral private key.
   * The ephemeral account signs all Aleph messages on behalf of the main wallet.
   */
  async initializeWithEphemeralKey(ephemeralPrivateKey: string, walletAddress: string): Promise<string> {
    ephemeralAccount = importAccountFromPrivateKey(ephemeralPrivateKey);
    mainAddress = walletAddress;
    authenticatedClient = new AuthenticatedAlephHttpClient(ephemeralAccount);
    return ephemeralAccount.address;
  },

  /**
   * Publish a security aggregate from the main wallet authorizing the ephemeral address.
   * This must be called once from the main wallet's account (not ephemeral).
   */
  async setupPermissions(mainWalletAccount: ETHAccount, ephemeralAddress: string): Promise<void> {
    const client = new AuthenticatedAlephHttpClient(mainWalletAccount);
    await client.createAggregate({
      key: 'security',
      content: {
        authorizations: [
          {
            address: ephemeralAddress,
            types: ['AGGREGATE', 'POST', 'STORE'],
            channels: [ALEPH_CHANNEL],
          },
        ],
      },
      channel: 'security',
    });
  },

  /**
   * Fetch the encrypted aggregate for this user's notes.
   */
  async fetchAggregate(): Promise<unknown | null> {
    if (!mainAddress) throw new Error('Not initialized');
    try {
      const data = await getPublicClient().fetchAggregate(mainAddress, AGGREGATE_KEY);
      return data;
    } catch {
      return null;
    }
  },

  /**
   * Save the encrypted aggregate.
   */
  async saveAggregate(content: unknown): Promise<void> {
    if (!mainAddress) throw new Error('Not initialized');
    await getAuthClient().createAggregate({
      key: AGGREGATE_KEY,
      content: content as Record<string, unknown>,
      address: mainAddress,
      channel: ALEPH_CHANNEL,
    });
  },

  /**
   * Create a new POST message (new note content).
   */
  async createPost(content: unknown): Promise<string> {
    if (!mainAddress) throw new Error('Not initialized');
    const result = await getAuthClient().createPost({
      postType: 'aleph-note',
      content: content as Record<string, unknown>,
      address: mainAddress,
      channel: ALEPH_CHANNEL,
    });
    return result.item_hash;
  },

  /**
   * Amend an existing POST message (edit note content).
   */
  async amendPost(originalRef: string, content: unknown): Promise<string> {
    if (!mainAddress) throw new Error('Not initialized');
    const result = await getAuthClient().createPost({
      postType: 'amend',
      content: content as Record<string, unknown>,
      ref: originalRef,
      address: mainAddress,
      channel: ALEPH_CHANNEL,
    });
    return result.item_hash;
  },

  /**
   * Fetch a single POST message by its hash.
   */
  async getPost(hash: string): Promise<unknown> {
    const client = getPublicClient();
    const result = await client.getMessages({
      hashes: [hash],
    });
    if (result.messages.length === 0) {
      throw new Error(`Post not found: ${hash}`);
    }
    return result.messages[0].content;
  },

  /**
   * Get all amendments to a post (version history).
   */
  async getPostHistory(originalRef: string): Promise<Array<{ hash: string; content: unknown; time: number }>> {
    const client = getPublicClient();
    const result = await client.getMessages({
      refs: [originalRef],
      channels: [ALEPH_CHANNEL],
    });
    return result.messages.map((msg: any) => ({
      hash: msg.item_hash,
      content: msg.content,
      time: msg.time,
    }));
  },

  /**
   * Upload an encrypted blob to Aleph Store.
   */
  async uploadToStore(data: Uint8Array): Promise<string> {
    if (!mainAddress) throw new Error('Not initialized');
    const result = await getAuthClient().createStore({
      fileContent: data,
      address: mainAddress,
      channel: ALEPH_CHANNEL,
    });
    return result.item_hash;
  },

  /**
   * Get the main wallet address.
   */
  getMainAddress(): string | null {
    return mainAddress;
  },

  /**
   * Get the ephemeral account address.
   */
  getEphemeralAddress(): string | null {
    return ephemeralAccount?.address ?? null;
  },

  /**
   * Reset the service (logout).
   */
  reset(): void {
    authenticatedClient = null;
    ephemeralAccount = null;
    mainAddress = null;
  },
};
```

**Step 3: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: No type errors (there may be warnings about the `any` casts — acceptable for SDK interop).

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: implement AlephService for decentralized storage operations"
```

---

### Task 5: Implement Zustand stores

**Files:**
- Create: `src/stores/auth.ts`
- Create: `src/stores/notes.ts`
- Create: `src/stores/ui.ts`

**Step 1: Create auth store**

Create `src/stores/auth.ts`:

```typescript
import { create } from 'zustand';

interface AuthState {
  walletAddress: string | null;
  encryptionKey: CryptoKey | null;
  ephemeralAddress: string | null;
  isConnecting: boolean;
  isInitialized: boolean;

  setWalletAddress: (address: string) => void;
  setEncryptionKey: (key: CryptoKey) => void;
  setEphemeralAddress: (address: string) => void;
  setIsConnecting: (connecting: boolean) => void;
  setIsInitialized: (initialized: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  walletAddress: null,
  encryptionKey: null,
  ephemeralAddress: null,
  isConnecting: false,
  isInitialized: false,

  setWalletAddress: (address) => set({ walletAddress: address }),
  setEncryptionKey: (key) => set({ encryptionKey: key }),
  setEphemeralAddress: (address) => set({ ephemeralAddress: address }),
  setIsConnecting: (connecting) => set({ isConnecting: connecting }),
  setIsInitialized: (initialized) => set({ isInitialized: initialized }),
  reset: () =>
    set({
      walletAddress: null,
      encryptionKey: null,
      ephemeralAddress: null,
      isConnecting: false,
      isInitialized: false,
    }),
}));
```

**Step 2: Create notes store**

Create `src/stores/notes.ts`:

```typescript
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
```

**Step 3: Create UI store**

Create `src/stores/ui.ts`:

```typescript
import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  searchQuery: string;
  filterTags: string[];
  filterStatus: string | null;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setFilterTags: (tags: string[]) => void;
  setFilterStatus: (status: string | null) => void;
  reset: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  searchQuery: '',
  filterTags: [],
  filterStatus: null,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterTags: (tags) => set({ filterTags: tags }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  reset: () =>
    set({
      sidebarOpen: true,
      searchQuery: '',
      filterTags: [],
      filterStatus: null,
    }),
}));
```

**Step 4: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: No type errors.

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add Zustand stores for auth, notes, and UI state"
```

---

## Phase 2: Wallet Connection & Authentication

### Task 6: Implement wallet connection flow

**Files:**
- Create: `src/services/wallet.ts`
- Create: `src/components/ui/ConnectWalletButton.tsx`
- Create: `src/services/__tests__/wallet.test.ts`

**Step 1: Write failing test for wallet service**

Create `src/services/__tests__/wallet.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { WalletService } from '../wallet';

describe('WalletService', () => {
  it('requestSignature returns a hex string', async () => {
    const mockSigner = {
      signMessage: vi.fn().mockResolvedValue('0x' + 'ab'.repeat(65)),
    };
    const sig = await WalletService.requestSignature(mockSigner as any);
    expect(sig).toMatch(/^0x[0-9a-f]+$/);
    expect(mockSigner.signMessage).toHaveBeenCalledWith('Aleph Notes Encryption Key');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/services/__tests__/wallet.test.ts
```

Expected: FAIL — `WalletService` not found.

**Step 3: Implement WalletService**

Create `src/services/wallet.ts`:

```typescript
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { SIGN_MESSAGE } from '../lib/constants';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const WalletService = {
  /**
   * Connect to MetaMask (or any injected Ethereum wallet).
   * Returns the connected address.
   */
  async connect(): Promise<{ address: string; signer: JsonRpcSigner }> {
    if (!window.ethereum) {
      throw new Error('No Ethereum wallet found. Please install MetaMask.');
    }

    const provider = new BrowserProvider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    return { address, signer };
  },

  /**
   * Request a deterministic signature from the wallet.
   * This signature is used to derive both the encryption key and the ephemeral account.
   */
  async requestSignature(signer: JsonRpcSigner): Promise<string> {
    return signer.signMessage(SIGN_MESSAGE);
  },
};
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/services/__tests__/wallet.test.ts
```

Expected: PASS.

**Step 5: Create ConnectWalletButton component**

Create `src/components/ui/ConnectWalletButton.tsx`:

```tsx
import { useAuthStore } from '../../stores/auth';
import { useNotesStore } from '../../stores/notes';
import { WalletService } from '../../services/wallet';
import { CryptoService } from '../../services/crypto';
import { AlephService } from '../../services/aleph';
import type { NotesAggregate, EncryptedPayload } from '../../types';

export default function ConnectWalletButton() {
  const {
    walletAddress,
    isConnecting,
    setWalletAddress,
    setEncryptionKey,
    setEphemeralAddress,
    setIsConnecting,
    setIsInitialized,
    reset: resetAuth,
  } = useAuthStore();

  const { loadFromAggregate, reset: resetNotes } = useNotesStore();

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // 1. Connect wallet
      const { address, signer } = await WalletService.connect();
      setWalletAddress(address);

      // 2. Request signature for key derivation
      const signature = await WalletService.requestSignature(signer);

      // 3. Derive encryption key
      const key = await CryptoService.deriveKey(signature);
      setEncryptionKey(key);

      // 4. Derive and initialize ephemeral account
      const ephemeralPrivateKey = CryptoService.deriveEphemeralPrivateKey(signature);
      const ephemeralAddr = await AlephService.initializeWithEphemeralKey(ephemeralPrivateKey, address);
      setEphemeralAddress(ephemeralAddr);

      // 5. Try to fetch existing aggregate
      const raw = await AlephService.fetchAggregate();
      if (raw) {
        const decrypted = await CryptoService.decrypt(raw as EncryptedPayload, key) as NotesAggregate;
        loadFromAggregate(decrypted);
      }

      setIsInitialized(true);
    } catch (err) {
      console.error('Failed to connect:', err);
      resetAuth();
      resetNotes();
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    AlephService.reset();
    resetAuth();
    resetNotes();
  };

  if (walletAddress) {
    return (
      <button
        onClick={handleDisconnect}
        className="px-3 py-1.5 text-sm rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      >
        {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
      </button>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
```

**Step 6: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: No type errors.

**Step 7: Commit**

```bash
git add -A && git commit -m "feat: implement wallet connection, signature request, and auth flow"
```

---

## Phase 3: Core Note Operations

### Task 7: Implement note CRUD service

**Files:**
- Create: `src/services/notes.ts`
- Create: `src/services/__tests__/notes.test.ts`

**Step 1: Write failing tests**

Create `src/services/__tests__/notes.test.ts`:

```typescript
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
```

**Step 2: Run tests to verify they fail**

```bash
npx vitest run src/services/__tests__/notes.test.ts
```

Expected: FAIL.

**Step 3: Implement note helpers**

Create `src/services/notes.ts`:

```typescript
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
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run src/services/__tests__/notes.test.ts
```

Expected: All tests pass.

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: implement note CRUD helpers and tree utilities"
```

---

### Task 8: Implement note persistence (save/load with encryption)

**Files:**
- Create: `src/services/sync.ts`

**Step 1: Implement SyncService**

Create `src/services/sync.ts`:

```typescript
import { CryptoService } from './crypto';
import { AlephService } from './aleph';
import { useAuthStore } from '../stores/auth';
import { useNotesStore } from '../stores/notes';
import type { NotesAggregate, EncryptedPayload } from '../types';

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export const SyncService = {
  /**
   * Save the current notes aggregate to Aleph (encrypted).
   * Debounced — call freely on every change.
   */
  scheduleSave(delayMs = 1000): void {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      SyncService.saveNow();
    }, delayMs);
  },

  /**
   * Immediately save the aggregate.
   */
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

  /**
   * Load the aggregate from Aleph and decrypt it.
   */
  async loadAggregate(): Promise<NotesAggregate | null> {
    const key = useAuthStore.getState().encryptionKey;
    if (!key) return null;

    const raw = await AlephService.fetchAggregate();
    if (!raw) return null;

    return (await CryptoService.decrypt(raw as EncryptedPayload, key)) as NotesAggregate;
  },

  /**
   * Save note content as a POST message (encrypted).
   * Creates a new post or amends an existing one.
   */
  async saveNoteContent(noteId: string, content: string): Promise<string | null> {
    const key = useAuthStore.getState().encryptionKey;
    if (!key) return null;

    const note = useNotesStore.getState().notes[noteId];
    if (!note) return null;

    const encrypted = await CryptoService.encrypt({ markdown: content }, key);

    let hash: string;
    if (note.currentPostRef) {
      hash = await AlephService.amendPost(note.currentPostRef, encrypted);
    } else {
      hash = await AlephService.createPost(encrypted);
    }

    // Update the note's post ref and save aggregate
    useNotesStore.getState().updateNote(noteId, {
      currentPostRef: hash,
      properties: {
        ...note.properties,
        modified: Date.now(),
      },
    });
    SyncService.scheduleSave();

    return hash;
  },

  /**
   * Load note content from Aleph (decrypt).
   */
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
```

**Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: No type errors.

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: implement SyncService for encrypted note persistence with debouncing"
```

---

## Phase 4: UI Components

### Task 9: Build the header bar

**Files:**
- Create: `src/components/layout/Header.tsx`
- Modify: `src/components/layout/AppShell.tsx`

**Step 1: Create Header component**

Create `src/components/layout/Header.tsx`:

```tsx
import { useNotesStore } from '../../stores/notes';
import { useUIStore } from '../../stores/ui';
import ConnectWalletButton from '../ui/ConnectWalletButton';

export default function Header() {
  const { settings, setSettings, isSaving } = useNotesStore();
  const { toggleSidebar } = useUIStore();

  const toggleTheme = () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    setSettings({ ...settings, theme: newTheme });
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <header className="h-12 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="font-semibold text-sm tracking-tight">Aleph Notes</span>
        {isSaving && (
          <span className="text-xs text-gray-400">Saving...</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle theme"
        >
          {settings.theme === 'dark' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
        <ConnectWalletButton />
      </div>
    </header>
  );
}
```

**Step 2: Update AppShell to use Header**

Update `src/components/layout/AppShell.tsx`:

```tsx
import { ReactNode } from 'react';
import Header from './Header';

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
```

**Step 3: Verify it renders**

```bash
npm run dev
```

Expected: Header bar with hamburger menu, "Aleph Notes" title, theme toggle, and "Connect Wallet" button.

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: build header bar with theme toggle and wallet connect"
```

---

### Task 10: Build the sidebar with note tree

**Files:**
- Create: `src/components/sidebar/Sidebar.tsx`
- Create: `src/components/sidebar/NoteTreeItem.tsx`
- Create: `src/components/sidebar/SearchBar.tsx`
- Modify: `src/pages/HomePage.tsx`

**Step 1: Create SearchBar**

Create `src/components/sidebar/SearchBar.tsx`:

```tsx
import { useUIStore } from '../../stores/ui';

export default function SearchBar() {
  const { searchQuery, setSearchQuery } = useUIStore();

  return (
    <div className="px-3 py-2">
      <div className="relative">
        <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 text-sm rounded-md bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-blue-500 focus:outline-none transition-colors"
        />
      </div>
    </div>
  );
}
```

**Step 2: Create NoteTreeItem**

Create `src/components/sidebar/NoteTreeItem.tsx`:

```tsx
import { useState } from 'react';
import type { NoteMetadata } from '../../types';
import { useNotesStore } from '../../stores/notes';
import { getChildren } from '../../services/notes';

interface NoteTreeItemProps {
  note: NoteMetadata;
  depth: number;
}

export default function NoteTreeItem({ note, depth }: NoteTreeItemProps) {
  const { notes, currentNoteId, setCurrentNoteId } = useNotesStore();
  const [expanded, setExpanded] = useState(true);
  const children = getChildren(notes, note.id);
  const hasChildren = children.length > 0;
  const isActive = currentNoteId === note.id;

  return (
    <div>
      <button
        onClick={() => setCurrentNoteId(note.id)}
        className={`w-full flex items-center gap-1 px-2 py-1 text-sm rounded-md transition-colors ${
          isActive
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {hasChildren && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0 cursor-pointer"
          >
            <svg
              className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M6 6l8 4-8 4V6z" />
            </svg>
          </span>
        )}
        {!hasChildren && <span className="w-4 shrink-0" />}
        <span className="shrink-0">{note.properties.icon || '\u{1F4DD}'}</span>
        <span className="truncate">{note.title}</span>
      </button>
      {hasChildren && expanded && (
        <div>
          {children.map((child) => (
            <NoteTreeItem key={child.id} note={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 3: Create Sidebar**

Create `src/components/sidebar/Sidebar.tsx`:

```tsx
import { useNotesStore } from '../../stores/notes';
import { useUIStore } from '../../stores/ui';
import { useAuthStore } from '../../stores/auth';
import { getRootNotes, createNewNote } from '../../services/notes';
import { SyncService } from '../../services/sync';
import SearchBar from './SearchBar';
import NoteTreeItem from './NoteTreeItem';

export default function Sidebar() {
  const { notes, addNote, setCurrentNoteId } = useNotesStore();
  const { sidebarOpen, searchQuery } = useUIStore();
  const { isInitialized } = useAuthStore();

  if (!sidebarOpen) return null;

  const rootNotes = getRootNotes(notes);

  const filteredRoots = searchQuery
    ? Object.values(notes).filter((n) =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : rootNotes;

  const handleNewNote = () => {
    const note = createNewNote();
    addNote(note);
    setCurrentNoteId(note.id);
    SyncService.scheduleSave();
  };

  return (
    <aside className="w-64 border-r border-gray-200 dark:border-gray-700 flex flex-col shrink-0 overflow-hidden">
      <SearchBar />

      <div className="flex-1 overflow-y-auto px-2 py-1">
        {!isInitialized && (
          <p className="text-sm text-gray-400 px-2 py-4">
            Connect wallet to view notes
          </p>
        )}
        {isInitialized && filteredRoots.length === 0 && !searchQuery && (
          <p className="text-sm text-gray-400 px-2 py-4">
            No notes yet. Create one!
          </p>
        )}
        {isInitialized && filteredRoots.length === 0 && searchQuery && (
          <p className="text-sm text-gray-400 px-2 py-4">
            No matching notes
          </p>
        )}
        {filteredRoots.map((note) => (
          <NoteTreeItem key={note.id} note={note} depth={0} />
        ))}
      </div>

      {isInitialized && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-3">
          <button
            onClick={handleNewNote}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Note
          </button>
        </div>
      )}
    </aside>
  );
}
```

**Step 4: Update HomePage to include sidebar**

Update `src/pages/HomePage.tsx`:

```tsx
import AppShell from '../components/layout/AppShell';
import Sidebar from '../components/sidebar/Sidebar';
import { useNotesStore } from '../stores/notes';

export default function HomePage() {
  const { currentNoteId } = useNotesStore();

  return (
    <AppShell>
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {!currentNoteId && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">Select a note or create a new one</p>
          </div>
        )}
      </main>
    </AppShell>
  );
}
```

**Step 5: Verify UI renders**

```bash
npm run dev
```

Expected: Sidebar with search bar and "New Note" button. Clicking "New Note" (after connecting wallet) creates a note in the tree.

**Step 6: Commit**

```bash
git add -A && git commit -m "feat: build sidebar with note tree, search, and new note button"
```

---

### Task 11: Integrate Tiptap editor

**Files:**
- Create: `src/components/editor/NoteEditor.tsx`
- Create: `src/components/editor/NoteTitle.tsx`
- Modify: `src/pages/HomePage.tsx`

**Step 1: Install Tiptap**

```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-image @tiptap/extension-link
```

Note: The `@tiptap/markdown` extension may require a Tiptap Pro subscription. If unavailable, use HTML content storage (Tiptap's default) and convert to markdown only for export using `turndown`. Try installing:

```bash
npm install @tiptap/markdown
```

If that fails, install fallback:

```bash
npm install turndown marked @types/turndown
```

**Step 2: Install Tailwind typography plugin**

```bash
npm install -D @tailwindcss/typography
```

Add to `src/index.css`:

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
```

**Step 3: Create NoteTitle component**

Create `src/components/editor/NoteTitle.tsx`:

```tsx
import { useEffect, useRef } from 'react';
import { useNotesStore } from '../../stores/notes';
import { SyncService } from '../../services/sync';

export default function NoteTitle() {
  const { currentNoteId, notes, updateNote } = useNotesStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const note = currentNoteId ? notes[currentNoteId] : null;

  useEffect(() => {
    if (inputRef.current && note) {
      inputRef.current.value = note.title;
    }
  }, [currentNoteId, note?.title]);

  if (!note) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNote(note.id, { title: e.target.value });
    SyncService.scheduleSave();
  };

  return (
    <input
      ref={inputRef}
      defaultValue={note.title}
      onChange={handleChange}
      placeholder="Untitled"
      className="w-full text-3xl font-bold bg-transparent border-none outline-none placeholder-gray-300 dark:placeholder-gray-600"
    />
  );
}
```

**Step 4: Create NoteEditor component**

Create `src/components/editor/NoteEditor.tsx`:

```tsx
import { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { useNotesStore } from '../../stores/notes';
import { SyncService } from '../../services/sync';
import NoteTitle from './NoteTitle';

export default function NoteEditor() {
  const { currentNoteId, setCurrentNoteContent } = useNotesStore();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoadingRef = useRef(false);
  const currentNoteIdRef = useRef(currentNoteId);

  useEffect(() => {
    currentNoteIdRef.current = currentNoteId;
  }, [currentNoteId]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
      Image,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[200px]',
      },
    },
    onUpdate: ({ editor }) => {
      if (isLoadingRef.current) return;
      const html = editor.getHTML();
      setCurrentNoteContent(html);

      // Debounce save
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      const noteId = currentNoteIdRef.current;
      if (noteId) {
        saveTimerRef.current = setTimeout(() => {
          SyncService.saveNoteContent(noteId, html);
        }, 1500);
      }
    },
  });

  // Load content when note changes
  useEffect(() => {
    if (!currentNoteId || !editor) return;

    isLoadingRef.current = true;
    setCurrentNoteContent(null);

    SyncService.loadNoteContent(currentNoteId).then((content) => {
      if (content !== null) {
        editor.commands.setContent(content || '<p></p>');
        setCurrentNoteContent(content);
      } else {
        editor.commands.setContent('<p></p>');
        setCurrentNoteContent('');
      }
      isLoadingRef.current = false;
    });

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [currentNoteId, editor]);

  if (!currentNoteId) return null;

  return (
    <div className="max-w-3xl mx-auto px-8 py-8">
      <NoteTitle />
      <div className="mt-6">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
```

**Step 5: Update HomePage to include editor**

Update `src/pages/HomePage.tsx`:

```tsx
import AppShell from '../components/layout/AppShell';
import Sidebar from '../components/sidebar/Sidebar';
import NoteEditor from '../components/editor/NoteEditor';
import { useNotesStore } from '../stores/notes';

export default function HomePage() {
  const { currentNoteId } = useNotesStore();

  return (
    <AppShell>
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {currentNoteId ? (
          <NoteEditor />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">Select a note or create a new one</p>
          </div>
        )}
      </main>
    </AppShell>
  );
}
```

**Step 6: Verify editor renders and works**

```bash
npm run dev
```

Expected: Clicking a note shows the Tiptap editor. Typing produces rich text. Markdown shortcuts work (e.g., `##` + space for heading, `**text**` for bold).

**Step 7: Commit**

```bash
git add -A && git commit -m "feat: integrate Tiptap rich text editor with auto-save"
```

---

## Phase 5: Delete, Properties, and Dark Mode

### Task 12: Note deletion with confirmation

**Files:**
- Create: `src/components/ui/ConfirmDialog.tsx`
- Modify: `src/components/sidebar/NoteTreeItem.tsx`

**Step 1: Create ConfirmDialog**

Create `src/components/ui/ConfirmDialog.tsx`:

```tsx
import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onConfirm, onCancel }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onCancel}
      className="rounded-lg p-0 backdrop:bg-black/50 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
    >
      <div className="p-6 max-w-sm">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
```

**Step 2: Add delete button and confirm dialog to NoteTreeItem**

Update `src/components/sidebar/NoteTreeItem.tsx` to add a hover-visible "..." button that shows a delete option. Add `showDeleteConfirm` state and render `<ConfirmDialog>`. On confirm:

```typescript
import { getAllDescendantIds } from '../../services/notes';
import { SyncService } from '../../services/sync';

const handleDelete = () => {
  const descendants = getAllDescendantIds(notes, note.id);
  // Remove note and all descendants
  [note.id, ...descendants].forEach((id) => removeNote(id));
  // Remove from parent's childIds
  if (note.parentId && notes[note.parentId]) {
    updateNote(note.parentId, {
      childIds: notes[note.parentId].childIds.filter((id) => id !== note.id),
    });
  }
  // Clear current note if it was deleted
  if (currentNoteId === note.id || descendants.includes(currentNoteId ?? '')) {
    setCurrentNoteId(null);
  }
  SyncService.scheduleSave();
  setShowDeleteConfirm(false);
};
```

Note: This requires also importing `removeNote` and `updateNote` from `useNotesStore`.

**Step 3: Verify delete works**

Create a note, hover over it to see "...", click Delete, confirm. Note disappears.

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add note deletion with confirmation dialog"
```

---

### Task 13: Initialize dark mode from settings

**Files:**
- Create: `src/hooks/useTheme.ts`
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

**Step 1: Create theme hook**

Create `src/hooks/useTheme.ts`:

```typescript
import { useEffect } from 'react';
import { useNotesStore } from '../stores/notes';

export function useTheme() {
  const theme = useNotesStore((s) => s.settings.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
}
```

**Step 2: Apply hook in App**

Add `useTheme()` call at the top of the `App` component in `src/App.tsx`:

```tsx
import { useTheme } from './hooks/useTheme';

export default function App() {
  useTheme();
  // ... rest of component
}
```

**Step 3: Set default to dark mode on load**

In `src/main.tsx`, add before `createRoot`:

```typescript
document.documentElement.classList.add('dark');
```

**Step 4: Verify dark mode toggles**

```bash
npm run dev
```

Expected: App starts in dark mode. Clicking the moon/sun icon toggles the theme.

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: initialize dark mode from settings and persist theme"
```

---

## Phase 6: Search, Export, and Share

### Task 14: Implement search filtering

The search bar and basic filtering were already built in Task 10. This task validates it works end-to-end.

**Files:**
- Potentially modify: `src/components/sidebar/Sidebar.tsx`

**Step 1: Verify search filters all notes (not just roots)**

The existing code in `Sidebar.tsx` already searches across all notes when a query is present:

```typescript
const filteredRoots = searchQuery
  ? Object.values(notes).filter((n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  : rootNotes;
```

This flattens the tree into a simple list when searching, which is correct for MVP.

**Step 2: Test it manually**

Create several notes with different titles and nesting. Type in the search bar. Verify only matching notes appear.

**Step 3: Commit (only if changes were made)**

```bash
git add -A && git commit -m "feat: verify search filtering across all nested notes"
```

---

### Task 15: Implement markdown export

**Files:**
- Create: `src/services/export.ts`
- Create: `src/components/ui/ExportButton.tsx`
- Modify: `src/components/sidebar/Sidebar.tsx`

**Step 1: Install JSZip**

```bash
npm install jszip
```

**Step 2: Implement export service**

Create `src/services/export.ts`:

```typescript
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

  // Recurse into children
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
```

**Step 3: Create ExportButton**

Create `src/components/ui/ExportButton.tsx`:

```tsx
import { useState } from 'react';
import { exportAllNotes } from '../../services/export';

export default function ExportButton() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportAllNotes();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      {exporting ? 'Exporting...' : 'Export All'}
    </button>
  );
}
```

**Step 4: Add ExportButton to Sidebar**

In `Sidebar.tsx`, import and render `<ExportButton />` in the bottom section, after the "New Note" button.

**Step 5: Verify export works**

Create some notes, click "Export All", verify a ZIP downloads with `.md` files.

**Step 6: Commit**

```bash
git add -A && git commit -m "feat: implement ZIP export of all notes as markdown with frontmatter"
```

---

### Task 16: Implement public share links

**Files:**
- Create: `src/services/share.ts`
- Create: `src/components/ui/ShareButton.tsx`
- Modify: `src/pages/SharePage.tsx`
- Modify: `src/components/editor/NoteEditor.tsx`

**Step 1: Implement share service**

Create `src/services/share.ts`:

```typescript
import { CryptoService } from './crypto';
import { AlephService } from './aleph';

export const ShareService = {
  /**
   * Create a share link for a note.
   * Encrypts note content with a new random key and publishes as a separate POST.
   * Returns URL with encryption key in the fragment (never sent to server).
   */
  async createShareLink(noteContent: string, noteTitle: string): Promise<string> {
    // Generate a random share key
    const shareKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    );

    // Export key to raw bytes, then base64url
    const rawKey = await crypto.subtle.exportKey('raw', shareKey);
    const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(rawKey)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Encrypt content with share key
    const encrypted = await CryptoService.encrypt(
      { title: noteTitle, markdown: noteContent },
      shareKey,
    );

    // Publish as public POST
    const hash = await AlephService.createPost({
      type: 'shared-note',
      ...encrypted,
    });

    return `${window.location.origin}/share/${hash}#${keyBase64}`;
  },
};
```

**Step 2: Create ShareButton**

Create `src/components/ui/ShareButton.tsx`:

```tsx
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
```

**Step 3: Implement SharePage viewer**

Update `src/pages/SharePage.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlephHttpClient } from '@aleph-sdk/client';
import { CryptoService } from '../services/crypto';
import { sanitizeHtml } from '../lib/sanitize';
import type { EncryptedPayload } from '../types';

export default function SharePage() {
  const { hash } = useParams<{ hash: string }>();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Extract key from URL fragment
        const keyBase64url = window.location.hash.slice(1);
        if (!keyBase64url || !hash) {
          setError('Invalid share link');
          return;
        }

        // Decode base64url key
        const keyBase64 = keyBase64url.replace(/-/g, '+').replace(/_/g, '/');
        const keyBytes = Uint8Array.from(atob(keyBase64), (c) => c.charCodeAt(0));
        const shareKey = await crypto.subtle.importKey(
          'raw',
          keyBytes,
          { name: 'AES-GCM', length: 256 },
          false,
          ['decrypt'],
        );

        // Fetch the shared post
        const client = new AlephHttpClient();
        const result = await client.getMessages({ hashes: [hash] });
        if (result.messages.length === 0) {
          setError('Shared note not found');
          return;
        }

        const postContent = result.messages[0].content as any;
        const encrypted: EncryptedPayload = {
          ciphertext: postContent.ciphertext,
          iv: postContent.iv,
        };

        const decrypted = (await CryptoService.decrypt(encrypted, shareKey)) as {
          title: string;
          markdown: string;
        };

        setTitle(decrypted.title);
        setContent(decrypted.markdown);
      } catch (err) {
        console.error('Failed to load shared note:', err);
        setError('Failed to decrypt note. The link may be invalid.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [hash]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500">Loading shared note...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-3xl mx-auto px-8 py-12">
        <div className="mb-6">
          <span className="text-sm text-gray-400">Shared via Aleph Notes</span>
        </div>
        <h1 className="text-3xl font-bold mb-6">{title}</h1>
        <div
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
        />
        <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
          <a
            href="/"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Open in Aleph Notes
          </a>
        </div>
      </div>
    </div>
  );
}
```

**Important:** Note the use of `sanitizeHtml()` from `src/lib/sanitize.ts` when rendering HTML via `dangerouslySetInnerHTML`. This uses DOMPurify to prevent XSS attacks from malicious content.

**Step 4: Add ShareButton to NoteEditor**

In `NoteEditor.tsx`, import and render `<ShareButton />` in a toolbar area above or below the editor.

**Step 5: Verify share flow works**

Create a note with content, click Share, copy the link, open in an incognito window. The note should render read-only.

**Step 6: Commit**

```bash
git add -A && git commit -m "feat: implement public share links with per-note encryption keys"
```

---

## Phase 7: Version History & Polish

### Task 17: Implement version history

**Files:**
- Create: `src/components/editor/VersionHistory.tsx`
- Modify: `src/components/editor/NoteEditor.tsx`

**Step 1: Create VersionHistory component**

Create `src/components/editor/VersionHistory.tsx`:

```tsx
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
```

**Important:** Note the use of `sanitizeHtml()` when rendering HTML via `dangerouslySetInnerHTML` to prevent XSS.

**Step 2: Add History button to NoteEditor**

In `NoteEditor.tsx`, add state `const [showHistory, setShowHistory] = useState(false)` and render:

```tsx
<button
  onClick={() => setShowHistory(true)}
  className="px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
>
  History
</button>
{showHistory && <VersionHistory onClose={() => setShowHistory(false)} />}
```

**Step 3: Verify history modal opens and shows versions**

Edit a note several times (saving each time), then click History. Versions should appear with timestamps.

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: implement version history viewer with restore functionality"
```

---

### Task 18: Mobile responsive layout

**Files:**
- Create: `src/hooks/useMediaQuery.ts`
- Modify: `src/components/sidebar/Sidebar.tsx`
- Modify: `src/components/sidebar/NoteTreeItem.tsx`

**Step 1: Create media query hook**

Create `src/hooks/useMediaQuery.ts`:

```typescript
import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export function useIsMobile(): boolean {
  return !useMediaQuery('(min-width: 768px)');
}
```

**Step 2: Make sidebar overlay on mobile**

In `Sidebar.tsx`, use `useIsMobile()`. When `true`, render the sidebar as a fixed overlay with a backdrop that closes on click:

```tsx
const isMobile = useIsMobile();

// Wrap sidebar content in overlay when mobile
if (isMobile) {
  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => setSidebarOpen(false)}
      />
      <aside className="fixed left-0 top-12 bottom-0 w-64 bg-white dark:bg-gray-900 z-50 flex flex-col border-r border-gray-200 dark:border-gray-700">
        {/* same sidebar content */}
      </aside>
    </>
  );
}
```

**Step 3: Auto-close sidebar on note selection (mobile)**

In `NoteTreeItem.tsx`, import `useIsMobile` and `useUIStore`. When a note is clicked on mobile:

```typescript
const isMobile = useIsMobile();
const { setSidebarOpen } = useUIStore();

const handleClick = () => {
  setCurrentNoteId(note.id);
  if (isMobile) setSidebarOpen(false);
};
```

**Step 4: Verify responsive behavior**

Resize browser to <768px. Sidebar should become an overlay. Selecting a note closes it.

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: make sidebar responsive with mobile overlay behavior"
```

---

### Task 19: Drag-and-drop note reordering

**Files:**
- Modify: `src/components/sidebar/Sidebar.tsx`
- Modify: `src/components/sidebar/NoteTreeItem.tsx`

**Step 1: Install dnd-kit**

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Step 2: Add sortable behavior to sidebar root notes**

Wrap the note list in `Sidebar.tsx` with `<DndContext>` and `<SortableContext>`. Make each root-level `NoteTreeItem` sortable using `useSortable`. On drag end, reorder the `order` field of affected notes:

```typescript
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  const oldIndex = filteredRoots.findIndex((n) => n.id === active.id);
  const newIndex = filteredRoots.findIndex((n) => n.id === over.id);
  if (oldIndex === -1 || newIndex === -1) return;

  const reordered = arrayMove(filteredRoots, oldIndex, newIndex);
  reordered.forEach((note, i) => {
    updateNote(note.id, { order: i });
  });
  SyncService.scheduleSave();
};
```

In `NoteTreeItem.tsx`, use `useSortable` from `@dnd-kit/sortable`:

```typescript
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: note.id });
const style = {
  transform: CSS.Transform.toString(transform),
  transition,
};
```

Apply `ref={setNodeRef}`, `style`, `{...attributes}`, `{...listeners}` to the note item wrapper.

**Step 3: Verify drag-and-drop works**

Create 3 notes, drag one above/below another. Order persists after refresh.

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add drag-and-drop note reordering in sidebar"
```

---

### Task 20: Final integration testing and build verification

**Files:**
- No new files

**Step 1: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass.

**Step 2: Run type check**

```bash
npx tsc --noEmit
```

Expected: No type errors.

**Step 3: Run production build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

**Step 4: Preview production build**

```bash
npm run preview
```

Expected: App works in production build.

**Step 5: Run through the full user flow manually**

1. Connect wallet (MetaMask)
2. Create a new note
3. Edit note title and content
4. Create a child note (drag under parent)
5. Toggle dark mode
6. Search for a note
7. Share a note, open link in incognito
8. Export all notes
9. Disconnect wallet
10. Reconnect — notes should be restored

**Step 6: Commit any final fixes**

```bash
git add -A && git commit -m "chore: final integration fixes and build verification"
```

---

## Summary of Tasks

| # | Task | Phase | Key Deliverable |
|---|------|-------|-----------------|
| 1 | Initialize project | Scaffolding | Vite + React + TS + Tailwind |
| 2 | Project structure & routing | Scaffolding | Pages, types, router |
| 3 | CryptoService | Infrastructure | AES-GCM encryption + key derivation |
| 4 | AlephService | Infrastructure | Aleph SDK integration |
| 5 | Zustand stores | Infrastructure | Auth, notes, UI state |
| 6 | Wallet connection | Auth | MetaMask connect + auth flow |
| 7 | Note CRUD helpers | Core | Create, tree utils, ordering |
| 8 | Note persistence | Core | Encrypted save/load via Aleph |
| 9 | Header bar | UI | Theme toggle, wallet button |
| 10 | Sidebar | UI | Note tree, search, new note |
| 11 | Tiptap editor | UI | Rich text editing + auto-save |
| 12 | Note deletion | UI | Confirm dialog + cascade delete |
| 13 | Dark mode init | UI | Persist and restore theme |
| 14 | Search filtering | Features | Filter across all notes |
| 15 | Export | Features | ZIP download with markdown |
| 16 | Share links | Features | Public encrypted share URLs |
| 17 | Version history | Features | History modal with restore |
| 18 | Mobile responsive | Polish | Overlay sidebar on mobile |
| 19 | Drag-and-drop | Polish | Reorder notes in sidebar |
| 20 | Final verification | QA | Build, test, manual walkthrough |

---

## Dependencies / Gotchas to Watch For

1. **Aleph SDK browser polyfills** — The SDK may need `Buffer` and `stream` polyfills for Vite. If you see errors, install `vite-plugin-node-polyfills`:
   ```bash
   npm install -D vite-plugin-node-polyfills
   ```
   And add to `vite.config.ts`:
   ```typescript
   import { nodePolyfills } from 'vite-plugin-node-polyfills';
   // Add nodePolyfills() to plugins array
   ```

2. **Tiptap Markdown extension** — The `@tiptap/markdown` package may require a Tiptap Pro subscription. If unavailable, use HTML content storage (Tiptap's default) and convert to markdown only for export using `turndown`.

3. **MetaMask deterministic signatures** — `personal_sign` in MetaMask produces deterministic signatures for the same message + account. This is what makes our key derivation work. However, some wallets may not guarantee this. Document this requirement.

4. **Aleph security aggregate** — Setting up the ephemeral key authorization requires the main wallet to sign a transaction. This means the first connection flow needs two signatures: one for key derivation, one for the security aggregate setup. Handle this gracefully in the UI.

5. **CORS / CSP** — Aleph API calls may hit CORS issues in development. The SDK should handle this, but if not, configure Vite proxy.

6. **XSS Prevention** — All `dangerouslySetInnerHTML` usage MUST go through `sanitizeHtml()` (DOMPurify) to prevent XSS from decrypted content. This is implemented in `src/lib/sanitize.ts`.
