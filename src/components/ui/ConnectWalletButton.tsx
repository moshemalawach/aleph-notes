import { useEffect, useRef } from 'react';
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { useAuthStore } from '../../stores/auth';
import { useNotesStore } from '../../stores/notes';
import { WalletService } from '../../services/wallet';
import { CryptoService } from '../../services/crypto';
import { AlephService } from '../../services/aleph';
import { getAccountFromProvider } from '@aleph-sdk/ethereum';
import type { NotesAggregate, EncryptedPayload } from '../../types';

export default function ConnectWalletButton() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('eip155');

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

  const initStartedRef = useRef(false);

  // When wallet connects via AppKit, run the key derivation + Aleph init flow
  useEffect(() => {
    if (!isConnected || !address || !walletProvider || initStartedRef.current) return;
    // Don't re-init if already connected to this address
    if (walletAddress === address) return;

    initStartedRef.current = true;
    setIsConnecting(true);

    (async () => {
      try {
        setWalletAddress(address);

        const signer = WalletService.getSigner(walletProvider);
        const signature = await WalletService.requestSignature(signer);

        const key = await CryptoService.deriveKey(signature);
        setEncryptionKey(key);

        const ephemeralPrivateKey = CryptoService.deriveEphemeralPrivateKey(signature);
        const ephemeralAddr = await AlephService.initializeWithEphemeralKey(ephemeralPrivateKey, address);
        setEphemeralAddress(ephemeralAddr);

        // Authorize ephemeral key to write on behalf of main wallet
        const mainAccount = await getAccountFromProvider(walletProvider);
        await AlephService.setupPermissions(mainAccount, ephemeralAddr);

        const raw = await AlephService.fetchAggregate();
        if (raw) {
          const decrypted = await CryptoService.decrypt(raw as EncryptedPayload, key) as NotesAggregate;
          loadFromAggregate(decrypted);
        }

        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize:', err);
        resetAuth();
        resetNotes();
      } finally {
        setIsConnecting(false);
        initStartedRef.current = false;
      }
    })();
  }, [isConnected, address, walletProvider]);

  // Handle disconnect from AppKit
  useEffect(() => {
    if (!isConnected && walletAddress) {
      AlephService.reset();
      resetAuth();
      resetNotes();
      initStartedRef.current = false;
    }
  }, [isConnected]);

  const handleClick = () => {
    open();
  };

  if (walletAddress) {
    return (
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-3 py-1.5 text-[13px] font-body rounded-lg border border-edge hover:border-edge-strong bg-surface hover:bg-hover transition-all duration-200"
      >
        <span className="w-2 h-2 rounded-full bg-accent" />
        <span className="text-ink-secondary">
          {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isConnecting}
      className="relative px-4 py-2 text-[13px] font-medium font-body rounded-lg bg-accent text-white hover:bg-accent-hover disabled:opacity-50 transition-all duration-200 overflow-hidden"
    >
      {isConnecting ? (
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
          Connecting...
        </span>
      ) : (
        'Connect Wallet'
      )}
    </button>
  );
}
