import { BrowserProvider } from 'ethers';
import type { JsonRpcSigner } from 'ethers';
import { SIGN_MESSAGE } from '../lib/constants';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const WalletService = {
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

  async requestSignature(signer: JsonRpcSigner): Promise<string> {
    return signer.signMessage(SIGN_MESSAGE);
  },
};
