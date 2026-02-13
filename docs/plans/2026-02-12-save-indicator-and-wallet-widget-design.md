# Save Indicator & Multi-Wallet Connection

## Feature 1: Save Status Indicator

Replace the binary `isSaving` flag with a three-state save status to give users clear feedback.

### States

- `idle` — nothing shown
- `saving` — pulsing dot + "Saving..."
- `saved` — solid green dot + "Saved", fades out after 2 seconds

### Flow

1. Debounce timer fires, save begins → `saving`
2. `SyncService.saveNoteContent` resolves → `saved`
3. 2-second timeout → `idle`

### Files

- `src/stores/notes.ts` — change `isSaving: boolean` to `saveStatus: 'idle' | 'saving' | 'saved'`
- `src/components/editor/NoteEditor.tsx` — set status before/after save call
- `src/components/layout/Header.tsx` — render three states with fade-out transition

## Feature 2: Web3Modal Wallet Connection

Replace direct `window.ethereum` / MetaMask-only connection with Web3Modal (AppKit) to support WalletConnect, Coinbase Wallet, and all injected wallets. Fixes Safari/iPad where MetaMask is unavailable.

### Setup

- Install `@web3modal/ethers5` and `@walletconnect/ethereum-provider`
- WalletConnect project ID stored in `VITE_WALLETCONNECT_PROJECT_ID` env var
- Configure for Ethereum mainnet (signing only, no transactions)

### Integration

- `src/lib/web3modal.ts` — new file, Web3Modal config and initialization
- `src/services/wallet.ts` — use Web3Modal to open wallet picker and get provider/signer instead of `window.ethereum`
- `src/components/ui/ConnectWalletButton.tsx` — pass Web3Modal provider to Aleph SDK's `getAccountFromProvider`
- `src/main.tsx` or `src/App.tsx` — initialize Web3Modal at startup
- Remove "Please install MetaMask" error path
