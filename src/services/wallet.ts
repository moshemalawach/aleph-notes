import { providers } from 'ethers';
import { SIGN_MESSAGE } from '../lib/constants';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const WalletService = {
  async connect(): Promise<{ address: string; signer: providers.JsonRpcSigner }> {
    if (!window.ethereum) {
      throw new Error('No Ethereum wallet found. Please install MetaMask.');
    }
    // Request accounts first, then create provider — avoids stale provider issues on reconnect
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    return { address, signer };
  },

  async requestSignature(signer: providers.JsonRpcSigner): Promise<string> {
    return signer.signMessage(SIGN_MESSAGE);
  },
};
