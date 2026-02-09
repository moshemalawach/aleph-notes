import type { EncryptedPayload } from '../types';

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const cleaned = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array<ArrayBuffer>): string {
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Fixed salt for deterministic key derivation from wallet signature.
// This is safe because the signature itself is high-entropy.
const FIXED_SALT = new TextEncoder().encode('aleph-notes-v1');

export const CryptoService = {
  async deriveKey(signature: string): Promise<CryptoKey> {
    const signatureBytes = hexToBytes(signature);
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      signatureBytes,
      'HKDF',
      false,
      ['deriveKey'],
    );
    return crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        salt: FIXED_SALT,
        info: new TextEncoder().encode('aleph-notes-encryption'),
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    );
  },

  async encrypt(data: unknown, key: CryptoKey): Promise<EncryptedPayload> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode(JSON.stringify(data));
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      plaintext,
    );
    return {
      ciphertext: arrayBufferToBase64(ciphertext),
      iv: arrayBufferToBase64(iv.buffer),
    };
  },

  async decrypt(payload: EncryptedPayload, key: CryptoKey): Promise<unknown> {
    const ciphertext = base64ToArrayBuffer(payload.ciphertext);
    const iv = base64ToArrayBuffer(payload.iv);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      key,
      ciphertext,
    );
    return JSON.parse(new TextDecoder().decode(decrypted));
  },

  deriveEphemeralPrivateKey(signature: string): string {
    const sigBytes = hexToBytes(signature);
    const privateKeyBytes = sigBytes.slice(0, 32);
    return bytesToHex(privateKeyBytes);
  },
};
