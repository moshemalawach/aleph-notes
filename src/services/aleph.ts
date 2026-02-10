import { AuthenticatedAlephHttpClient, AlephHttpClient } from '@aleph-sdk/client';
import { importAccountFromPrivateKey } from '@aleph-sdk/ethereum';
import type { ETHAccount } from '@aleph-sdk/ethereum';
import { ALEPH_CHANNEL, AGGREGATE_KEY } from '../lib/constants.ts';

let authenticatedClient: AuthenticatedAlephHttpClient | null = null;
let publicClient: AlephHttpClient | null = null;
let ephemeralAccount: ETHAccount | null = null;
let mainAddress: string | null = null;

function getPublicClient(): AlephHttpClient {
  if (!publicClient) {
    publicClient = new AlephHttpClient();
  }
  return publicClient;
}

function getAuthClient(): AuthenticatedAlephHttpClient {
  if (!authenticatedClient) {
    throw new Error('Not authenticated. Call initializeWithEphemeralKey first.');
  }
  return authenticatedClient;
}

export const AlephService = {
  async initializeWithEphemeralKey(ephemeralPrivateKey: string, walletAddress: string): Promise<string> {
    ephemeralAccount = importAccountFromPrivateKey(ephemeralPrivateKey);
    mainAddress = walletAddress;
    authenticatedClient = new AuthenticatedAlephHttpClient(ephemeralAccount);
    return ephemeralAccount.address;
  },

  async setupPermissions(mainWalletAccount: ETHAccount, ephemeralAddress: string): Promise<void> {
    // Check if the ephemeral key is already authorized
    try {
      const existing = await getPublicClient().fetchAggregate(
        mainWalletAccount.address,
        'security',
      ) as { authorizations?: Array<{ address: string }> } | null;
      const already = existing?.authorizations?.some(
        (a) => a.address.toLowerCase() === ephemeralAddress.toLowerCase(),
      );
      if (already) return;
    } catch {
      // No security aggregate yet — proceed to create one
    }

    const client = new AuthenticatedAlephHttpClient(mainWalletAccount);
    await client.createAggregate({
      key: 'security',
      content: {
        authorizations: [
          {
            address: ephemeralAddress,
            types: ['AGGREGATE', 'POST', 'STORE'],
            channels: [ALEPH_CHANNEL],
          },
        ],
      },
      channel: 'security',
    });
  },

  async fetchAggregate(): Promise<unknown | null> {
    if (!mainAddress) throw new Error('Not initialized');
    try {
      const data = await getPublicClient().fetchAggregate(mainAddress, AGGREGATE_KEY);
      return data;
    } catch {
      return null;
    }
  },

  async saveAggregate(content: unknown): Promise<void> {
    if (!mainAddress) throw new Error('Not initialized');
    await getAuthClient().createAggregate({
      key: AGGREGATE_KEY,
      content: content as Record<string, unknown>,
      address: mainAddress,
      channel: ALEPH_CHANNEL,
    });
  },

  async createPost(content: unknown): Promise<string> {
    if (!mainAddress) throw new Error('Not initialized');
    const result = await getAuthClient().createPost({
      postType: 'aleph-note',
      content: content as Record<string, unknown>,
      address: mainAddress,
      channel: ALEPH_CHANNEL,
    });
    return result.item_hash;
  },

  async amendPost(originalRef: string, content: unknown): Promise<string> {
    if (!mainAddress) throw new Error('Not initialized');
    const result = await getAuthClient().createPost({
      postType: 'amend',
      content: content as Record<string, unknown>,
      ref: originalRef,
      address: mainAddress,
      channel: ALEPH_CHANNEL,
    });
    return result.item_hash;
  },

  async getPost(hash: string): Promise<unknown> {
    const client = getPublicClient();
    // Use the posts API which resolves amendments automatically
    const result = await client.getPosts({
      hashes: [hash],
      types: ['aleph-note'],
    });
    if (result.posts.length === 0) {
      throw new Error(`Post not found: ${hash}`);
    }
    return result.posts[0].content;
  },

  async getPostHistory(originalRef: string): Promise<Array<{ hash: string; content: unknown; time: number }>> {
    const client = getPublicClient();
    const result = await client.getMessages({
      refs: [originalRef],
      channels: [ALEPH_CHANNEL],
    });
    return result.messages.map((msg: any) => {
      const c = msg.content;
      return {
        hash: msg.item_hash as string,
        content: (c?.content ?? c) as unknown,
        time: msg.time as number,
      };
    });
  },

  async uploadToStore(data: Uint8Array): Promise<string> {
    if (!mainAddress) throw new Error('Not initialized');
    const blob = new Blob([data as BlobPart]);
    const result = await getAuthClient().createStore({
      fileObject: blob,
      channel: ALEPH_CHANNEL,
    });
    return result.item_hash;
  },

  getMainAddress(): string | null {
    return mainAddress;
  },

  getEphemeralAddress(): string | null {
    return ephemeralAccount?.address ?? null;
  },

  reset(): void {
    authenticatedClient = null;
    ephemeralAccount = null;
    mainAddress = null;
  },
};
