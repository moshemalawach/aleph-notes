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
