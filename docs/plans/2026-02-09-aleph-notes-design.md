# Aleph Notes - Design Document

**Date:** 2026-02-09
**Status:** Approved

## Overview

**Aleph Notes** is an end-to-end encrypted, Notion-like markdown note application built on Aleph Cloud's decentralized storage infrastructure. The app enables users to create, organize, and manage hierarchical notes with rich properties, all while maintaining complete privacy through client-side encryption.

### Key Features
- End-to-end encryption with wallet-based key derivation
- Hierarchical note organization (Notion-style)
- Rich markdown editing with image support
- Public share links with embedded encryption keys
- Version history via amendment chains
- Mobile-responsive design
- Dark mode support

---

## Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────┐
│                    Frontend App                      │
│        (React + TypeScript + Tiptap + Tailwind)     │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│               Encryption Layer                       │
│         (Web Crypto API, Ephemeral Keys)            │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                  Aleph Cloud                         │
│   ┌─────────────────┬─────────────────────────┐    │
│   │   AGGREGATE     │    POST Messages        │    │
│   │   (Metadata)    │    (Note Content)       │    │
│   └─────────────────┴─────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### Storage Architecture

**AGGREGATE (Mutable Key-Value Store)**
- Note metadata index
- Hierarchical tree structure
- Note properties (tags, dates, status, icons)
- References to current POST versions
- User settings (theme, last opened note)
- Entire aggregate encrypted as single blob

**POST Messages (Amendable Content)**
- Encrypted note content (markdown)
- Encrypted image references
- Amendment chain via `ref` field
- Version history available through messages API

---

## Authentication & Encryption Flow

### First-Time User Setup

1. **Wallet Connection**
   - User clicks "Connect Wallet"
   - MetaMask (or other Ethereum wallet) prompts for connection
   - App receives user's Ethereum address

2. **Ephemeral Key Generation**
   - App presents standard message: `"Aleph Notes Session: ${timestamp}"`
   - User signs message with wallet (single signature)
   - Signature deterministically generates ephemeral private key (using HMAC-SHA256/KDF)
   - Derive ephemeral Ethereum address from this key

3. **Permission Setup (Automatic)**
   - Main wallet publishes AGGREGATE to `security` channel
   - Authorizes ephemeral address to post on behalf of main address
   - Configuration allows all message types (POST, AGGREGATE, STORE)
   - One-time setup that persists across sessions

4. **Ready to Use**
   - Ephemeral key stored in memory only (never persisted to disk)
   - Used for two purposes:
     - Encrypting/decrypting all note data
     - Signing Aleph messages on behalf of main wallet
   - Session ends → key discarded from memory

### Returning User Flow

1. User connects wallet and signs the same standard message
2. Regenerates same ephemeral key (deterministic derivation)
3. Already authorized via existing security aggregate
4. Fetch and decrypt metadata aggregate
5. Immediately ready to use

### Security Model

- **Encryption at rest**: All data encrypted before uploading to Aleph
- **Key derivation**: Only user's wallet signature can regenerate decryption key
- **Ephemeral keys**: Session-only keys never persisted
- **Permission scoping**: Ephemeral address only authorized for user's own data
- **Client-side only**: Decryption happens entirely in browser

---

## Data Model

### Aggregate Structure (Encrypted Metadata)

```typescript
interface NotesAggregate {
  notes: {
    [noteId: string]: {
      id: string;
      title: string;              // Encrypted
      parentId: string | null;    // null = root level
      childIds: string[];         // Child note IDs
      currentPostRef: string;     // Hash of latest POST
      properties: {
        tags: string[];
        status: string;           // "active" | "archived" | "draft"
        created: number;          // Unix timestamp
        modified: number;
        icon?: string;            // Emoji icon
        color?: string;           // UI color
      };
      order: number;              // For sibling ordering
    }
  };
  settings: {
    theme: "light" | "dark";
    lastOpenNote: string | null;
    sidebarWidth: number;
  };
}
```

The entire aggregate object is encrypted as a single JSON blob before storing on Aleph.

### POST Message Structure (Encrypted Content)

```typescript
interface NotePost {
  type: "amend";              // Or omitted for initial post
  ref?: string;               // Hash of original/previous post
  content: {
    encrypted_content: string;      // Encrypted markdown text
    encrypted_images: Array<{
      id: string;
      storeRef: string;             // Reference to image in Aleph Store
      alt?: string;
    }>;
  };
}
```

### Amendment Chain for Version History

```
Initial post:
  POST(markdown: "# Hello") → hash1

Edit 1:
  POST(amend, ref: hash1, markdown: "# Hello World") → hash2

Edit 2:
  POST(amend, ref: hash1, markdown: "# Hello World!") → hash3

// Latest version (hash3) shown by default
// Full history available via: messages API filter by ref=hash1
```

---

## Core Features

### 1. Note Management

**Create/Edit/Delete**
- Click "New Note" creates note with default title
- Inline title editing
- Auto-save on edit (debounced 1 second)
- Delete shows confirmation modal

**Hierarchical Organization**
- Drag-and-drop notes to nest under others
- Indent/outdent keyboard shortcuts
- Sidebar shows tree structure
- Expand/collapse parent notes

**Properties Panel**
- Tags (multi-select, create new)
- Status dropdown (active/draft/archived)
- Created/modified timestamps (auto)
- Icon picker (emoji)
- Color picker (for UI accents)

### 2. Rich Text Editing

**Tiptap Editor Features**
- Markdown shortcuts (**, *, -, [], etc.)
- Slash commands (type `/` for menu)
- Block types: headings, lists, quotes, code
- Inline formatting: bold, italic, code, links
- Keyboard shortcuts (Cmd+B, Cmd+I, etc.)

**Image Handling**
- Drag-and-drop images into editor
- Paste images from clipboard
- Image upload flow:
  1. Client encrypts image with ephemeral key
  2. Upload encrypted blob to Aleph Store
  3. Store reference in note POST
  4. Lazy load/decrypt when viewing note

### 3. Search & Filtering

**Global Search**
- Search box in sidebar
- Searches decrypted metadata (titles, tags)
- Live filtering as you type
- Highlight matches in results
- Click result to open note

**Filtering**
- Filter by tag (multi-select)
- Filter by status
- Filter by date range
- Combine filters (AND logic)

### 4. Sharing

**Public Share Links**
- "Share" button in note menu
- Generates unique share link: `https://app.com/share/[post_hash]#[encryption_key]`
- Key in URL fragment (never sent to server)
- Share page:
  - Decrypts and displays note (read-only)
  - Shows creation date
  - "Open in Aleph Notes" button
  - No editing capabilities

**Security**
- New encryption key per shared note (not user's main key)
- Original note remains separately encrypted
- Revoke by removing shared post (future feature)

### 5. Version History

**Page History UI**
- "History" button in note menu
- Shows list of versions with timestamps
- Click version to preview (read-only modal)
- "Restore this version" creates new amendment with old content
- Fetches amendments via Aleph messages API: `filter by ref=[original_hash]`

### 6. Dark Mode

- Toggle in header
- Persisted in user settings (encrypted aggregate)
- Tailwind dark: classes for all components
- Smooth transition animation

### 7. Export

**Export Functionality**
- "Export All" in settings menu
- Downloads ZIP file containing:
  - Each note as `.md` file
  - Hierarchy preserved via folders
  - Frontmatter with metadata (tags, dates)
  - Images folder with decrypted images
- Single note export also available

---

## Technical Implementation

### Tech Stack

**Build & Dev Tools**
- **Vite** - Fast dev server, optimized production builds
- **TypeScript** - Type safety throughout

**Frontend Framework**
- **React 18** - UI components
- **React Router** - Client-side routing

**Styling**
- **Tailwind CSS** - Utility-first styling
- **Tailwind dark mode** - Built-in theme switching

**Editor**
- **Tiptap** - ProseMirror-based editor
- **Tiptap Extensions**: StarterKit, Markdown, Image, Placeholder
- Custom extensions for nested pages

**Blockchain & Storage**
- **@aleph-sdk/client** - TypeScript SDK for Aleph
- **@aleph-sdk/ethereum** - Ethereum account integration
- **ethers.js** - Wallet connection, message signing

**Encryption**
- **Web Crypto API** - Native browser encryption (AES-GCM)
- **crypto-js** or **subtle-crypto** wrapper (if needed)

**State Management**
- **Zustand** or **Jotai** - Lightweight, TypeScript-friendly
- Stores:
  - User session (wallet address, ephemeral key)
  - Decrypted notes metadata
  - Current note
  - UI state (sidebar open, theme, etc.)

**Utilities**
- **date-fns** - Date formatting
- **jszip** - ZIP file generation for export
- **dompurify** - Sanitize HTML (security)

### Key Implementation Patterns

**1. Repository Pattern (Data Layer Abstraction)**

```typescript
interface NotesRepository {
  // Metadata
  fetchMetadata(): Promise<NotesAggregate>;
  saveMetadata(aggregate: NotesAggregate): Promise<void>;

  // Notes
  getNote(id: string): Promise<Note>;
  saveNote(note: Note): Promise<string>; // Returns post hash
  deleteNote(id: string): Promise<void>;

  // History
  getNoteHistory(originalHash: string): Promise<NoteVersion[]>;

  // Images
  uploadImage(blob: Blob): Promise<string>; // Returns store hash
  getImage(hash: string): Promise<Blob>;
}

class AlephRepository implements NotesRepository {
  // Implementation using Aleph SDK
}

// Future: class LocalRepository implements NotesRepository { ... }
```

**2. Encryption Service**

```typescript
class CryptoService {
  // Key derivation
  async deriveEphemeralKey(signature: string): Promise<CryptoKey>;

  // Encryption
  async encrypt(data: any, key: CryptoKey): Promise<ArrayBuffer>;
  async decrypt(data: ArrayBuffer, key: CryptoKey): Promise<any>;

  // Utilities
  async generateShareKey(): Promise<string>;
  exportKey(key: CryptoKey): Promise<string>;
  importKey(keyString: string): Promise<CryptoKey>;
}
```

**3. Aleph Integration Service**

```typescript
class AlephService {
  private account: ETHAccount;
  private ephemeralAccount: ETHAccount;

  // Setup
  async connectWallet(): Promise<string>; // Returns address
  async deriveEphemeralAccount(signature: string): Promise<void>;
  async setupPermissions(): Promise<void>; // Security aggregate

  // Aggregates
  async fetchAggregate(key: string): Promise<any>;
  async updateAggregate(key: string, value: any): Promise<void>;

  // Posts
  async createPost(content: any): Promise<string>; // Returns hash
  async amendPost(originalRef: string, content: any): Promise<string>;
  async getPost(hash: string): Promise<any>;

  // Messages API (for history)
  async getMessagesByRef(ref: string): Promise<Message[]>;

  // Store (for images)
  async uploadToStore(data: Blob): Promise<string>;
  async fetchFromStore(hash: string): Promise<Blob>;
}
```

**4. Sync Strategy**

```typescript
class SyncManager {
  private queue: PendingOperation[] = [];

  // Optimistic updates
  async saveNote(note: Note): Promise<void> {
    // Update UI immediately
    updateLocalState(note);

    // Queue network operation
    this.queue.push({ type: 'save', note });

    // Process queue
    await this.processQueue();
  }

  private async processQueue(): Promise<void> {
    // Try to sync queued operations
    // Retry failed operations
    // Handle conflicts (last-write-wins for MVP)
  }
}
```

---

## User Interface

### Main Layout

```
┌────────────────────────────────────────────────────────┐
│  [≡] Aleph Notes       [@0x1234...]  [🌙]  [⚙️]       │
├──────────────┬─────────────────────────────────────────┤
│              │                                          │
│  Sidebar     │         Editor Area                      │
│  (Resizable) │                                          │
│              │  # Note Title                            │
│  [Search]    │  ┌─────────────────────────────────┐    │
│  🔍 _____    │  │ Tags: work, urgent              │    │
│              │  │ Status: In Progress             │    │
│  📝 Notes    │  │ Modified: 2 hours ago           │    │
│  ├─ 💼 Work  │  └─────────────────────────────────┘    │
│  │  └─ Q1   │                                          │
│  ├─ 💡 Ideas │  Your markdown content here...          │
│  └─ 📚 Read  │  - Bullet points                        │
│              │  - **Bold** and *italic*                │
│  + New Note  │  - ![image](...)                        │
│              │                                          │
│  [Export]    │  [Share] [History] [⋮]                  │
│              │                                          │
└──────────────┴─────────────────────────────────────────┘
```

### Responsive Breakpoints

- **Desktop** (1024px+): Full sidebar + editor
- **Tablet** (768px-1024px): Collapsible sidebar
- **Mobile** (<768px):
  - Bottom nav bar
  - Swipe between sidebar and editor
  - Floating "+" button for new note

---

## Future Roadmap

### Phase 2: Offline Support (Post-MVP)

**PWA Features**
- Service worker for offline asset caching
- IndexedDB for encrypted local storage
- Background sync when connection returns
- Install prompt for app-like experience
- Offline indicator in UI

**Sync Strategy**
- Queue operations while offline
- Sync on reconnection
- Conflict resolution UI
- Last-write-wins for simple cases
- Manual merge for complex conflicts

### Phase 3: Advanced Features

**Import System**
- Markdown file/folder import
- Notion export compatibility (.md + CSV)
- Obsidian vault import
- Preserve hierarchy, tags, and metadata
- Batch upload with progress indicator

**Multi-Chain Support**
- Solana wallet adapter (@solana/wallet-adapter)
- Polkadot wallet integration
- Abstract wallet interface
- Chain selection in settings
- Separate ephemeral keys per chain

**Enhanced Collaboration**
- Share with specific wallet addresses
- Encrypt note with recipient's public key
- Permission levels (view/edit)
- Activity feed for shared notes

**Additional Features**
- Templates (meeting notes, journals, etc.)
- Backlinks (Obsidian-style)
- Graph view of note connections
- Database views (table, board, gallery)
- Webhooks/API for automation

### Performance Optimizations

**For growing note collections:**
- Paginated metadata loading (load visible notes first)
- Virtual scrolling for large note lists
- Lazy load note content (only when opened)
- IndexedDB caching (even for online version)
- Incremental aggregate updates (only changed notes)
- Web Workers for encryption/decryption

---

## Migration & Extensibility

The architecture is designed for future enhancements without major rewrites:

1. **Repository Pattern** - Easy to add `LocalRepository` for offline storage
2. **Wallet Abstraction** - Simple to add new chain adapters
3. **Encrypted Aggregate** - Can evolve schema (add new fields)
4. **Amendment System** - Naturally supports richer versioning features
5. **Component Architecture** - Modular React components for feature additions

---

## Success Metrics

**MVP Success Criteria:**
- [ ] User can create, edit, delete notes
- [ ] Notes are end-to-end encrypted
- [ ] Hierarchical organization works (drag-drop)
- [ ] Search and filtering functional
- [ ] Share links work correctly
- [ ] Mobile responsive
- [ ] Version history accessible
- [ ] Export to markdown
- [ ] Dark mode works

**Performance Targets:**
- Initial load: < 3 seconds
- Note open: < 500ms (cached) / < 2s (network)
- Search results: < 100ms
- Save operation: < 1s perceived (optimistic UI)

---

## Security Considerations

1. **Key Management**: Ephemeral keys never persisted; regenerated per session
2. **XSS Protection**: Sanitize all user input before rendering
3. **Encryption**: AES-GCM 256-bit for all data at rest
4. **URL Security**: Share keys in fragment (not sent to server)
5. **Wallet Security**: Never request private keys; signatures only
6. **Permission Scoping**: Ephemeral address limited to user's own data
7. **Dependencies**: Regular security audits of npm packages

---

## Open Questions / Decisions Needed

1. Should we add rate limiting for API calls?
2. Maximum note size limit? (Consider encryption/decryption time)
3. Image size limits and compression strategy?
4. Should we support real-time collaboration in future? (Complex with E2E)
5. Pricing model? (Free tier limits, paid tiers)

---

## Getting Started (Development)

```bash
# Initial setup
npm create vite@latest aleph-notes -- --template react-ts
cd aleph-notes
npm install

# Install dependencies
npm install @aleph-sdk/client @aleph-sdk/ethereum ethers
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-markdown
npm install zustand react-router-dom date-fns jszip dompurify
npm install -D tailwindcss postcss autoprefixer
npm install -D @types/dompurify

# Initialize Tailwind
npx tailwindcss init -p

# Start dev server
npm run dev
```

---

**End of Design Document**
