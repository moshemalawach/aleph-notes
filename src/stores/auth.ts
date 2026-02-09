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
