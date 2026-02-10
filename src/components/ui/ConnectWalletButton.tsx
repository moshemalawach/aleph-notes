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
      const { address, signer } = await WalletService.connect();
      setWalletAddress(address);

      const signature = await WalletService.requestSignature(signer);

      const key = await CryptoService.deriveKey(signature);
      setEncryptionKey(key);

      const ephemeralPrivateKey = CryptoService.deriveEphemeralPrivateKey(signature);
      const ephemeralAddr = await AlephService.initializeWithEphemeralKey(ephemeralPrivateKey, address);
      setEphemeralAddress(ephemeralAddr);

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
      onClick={handleConnect}
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
