import { describe, it, expect } from 'vitest';
import { CryptoService } from '../crypto';

describe('CryptoService', () => {
  const fakeSignature = '0x' + 'ab'.repeat(65);

  it('derives a CryptoKey from a signature', async () => {
    const key = await CryptoService.deriveKey(fakeSignature);
    expect(key).toBeInstanceOf(CryptoKey);
    expect(key.algorithm).toMatchObject({ name: 'AES-GCM', length: 256 });
    expect(key.usages).toContain('encrypt');
    expect(key.usages).toContain('decrypt');
  });

  it('derives the same key from the same signature', async () => {
    const key1 = await CryptoService.deriveKey(fakeSignature);
    const key2 = await CryptoService.deriveKey(fakeSignature);
    const exported1 = await crypto.subtle.exportKey('raw', key1);
    const exported2 = await crypto.subtle.exportKey('raw', key2);
    expect(new Uint8Array(exported1)).toEqual(new Uint8Array(exported2));
  });

  it('encrypts and decrypts JSON data round-trip', async () => {
    const key = await CryptoService.deriveKey(fakeSignature);
    const data = { hello: 'world', count: 42 };
    const encrypted = await CryptoService.encrypt(data, key);
    expect(encrypted).toHaveProperty('ciphertext');
    expect(encrypted).toHaveProperty('iv');
    expect(typeof encrypted.ciphertext).toBe('string');
    expect(typeof encrypted.iv).toBe('string');
    const decrypted = await CryptoService.decrypt(encrypted, key);
    expect(decrypted).toEqual(data);
  });

  it('produces different ciphertexts for the same plaintext (unique IVs)', async () => {
    const key = await CryptoService.deriveKey(fakeSignature);
    const data = { same: 'data' };
    const enc1 = await CryptoService.encrypt(data, key);
    const enc2 = await CryptoService.encrypt(data, key);
    expect(enc1.ciphertext).not.toBe(enc2.ciphertext);
    expect(enc1.iv).not.toBe(enc2.iv);
  });

  it('fails to decrypt with wrong key', async () => {
    const key1 = await CryptoService.deriveKey(fakeSignature);
    const key2 = await CryptoService.deriveKey('0x' + 'cd'.repeat(65));
    const encrypted = await CryptoService.encrypt({ secret: true }, key1);
    await expect(CryptoService.decrypt(encrypted, key2)).rejects.toThrow();
  });

  it('derives an ephemeral private key from a signature', () => {
    const privateKey = CryptoService.deriveEphemeralPrivateKey(fakeSignature);
    expect(privateKey).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it('derives the same ephemeral private key from the same signature', () => {
    const pk1 = CryptoService.deriveEphemeralPrivateKey(fakeSignature);
    const pk2 = CryptoService.deriveEphemeralPrivateKey(fakeSignature);
    expect(pk1).toBe(pk2);
  });
});
