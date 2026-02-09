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
    const provider = new providers.Web3Provider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    return { address, signer };
  },

  async requestSignature(signer: providers.JsonRpcSigner): Promise<string> {
    return signer.signMessage(SIGN_MESSAGE);
  },
};
