import { providers } from 'ethers';
import { SIGN_MESSAGE } from '../lib/constants';

export const WalletService = {
  getProvider(walletProvider: any): providers.Web3Provider {
    return new providers.Web3Provider(walletProvider);
  },

  getSigner(walletProvider: any): providers.JsonRpcSigner {
    return WalletService.getProvider(walletProvider).getSigner();
  },

  async requestSignature(signer: providers.JsonRpcSigner): Promise<string> {
    return signer.signMessage(SIGN_MESSAGE);
  },
};
