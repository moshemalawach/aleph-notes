import { CryptoService } from './crypto';
import { AlephService } from './aleph';

export const ShareService = {
  async createShareLink(noteContent: string, noteTitle: string): Promise<string> {
    const shareKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    );

    const rawKey = await crypto.subtle.exportKey('raw', shareKey);
    const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(rawKey)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const encrypted = await CryptoService.encrypt(
      { title: noteTitle, markdown: noteContent },
      shareKey,
    );

    const hash = await AlephService.createPost({
      type: 'shared-note',
      ...encrypted,
    });

    return `${window.location.origin}/share/${hash}#${keyBase64}`;
  },
};
