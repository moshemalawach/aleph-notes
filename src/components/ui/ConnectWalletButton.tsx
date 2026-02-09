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
