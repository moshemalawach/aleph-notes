import { createAppKit } from '@reown/appkit/react';
import { mainnet } from '@reown/appkit/networks';
import { Ethers5Adapter } from '@reown/appkit-adapter-ethers5';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  console.warn('Missing VITE_WALLETCONNECT_PROJECT_ID env variable');
}

createAppKit({
  adapters: [new Ethers5Adapter()],
  networks: [mainnet],
  projectId,
  metadata: {
    name: 'Aleph Notes',
    description: 'Encrypted, decentralized notes on Aleph network',
    url: 'https://notes.aleph.social',
    icons: ['/icon.svg'],
  },
  features: {
    analytics: false,
  },
});
