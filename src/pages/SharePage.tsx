import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlephHttpClient } from '@aleph-sdk/client';
import { CryptoService } from '../services/crypto';
import { sanitizeHtml } from '../lib/sanitize';
import type { EncryptedPayload } from '../types';

export default function SharePage() {
  const { hash } = useParams<{ hash: string }>();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const keyBase64url = window.location.hash.slice(1);
        if (!keyBase64url || !hash) {
          setError('Invalid share link');
          return;
        }

        const keyBase64 = keyBase64url.replace(/-/g, '+').replace(/_/g, '/');
        const keyBytes = Uint8Array.from(atob(keyBase64), (c) => c.charCodeAt(0));
        const shareKey = await crypto.subtle.importKey(
          'raw',
          keyBytes,
          { name: 'AES-GCM', length: 256 },
          false,
          ['decrypt'],
        );

        const client = new AlephHttpClient();
        const result = await client.getMessages({ hashes: [hash] });
        if (result.messages.length === 0) {
          setError('Shared note not found');
          return;
        }

        const postContent = result.messages[0].content as any;
        const encrypted: EncryptedPayload = {
          ciphertext: postContent.ciphertext,
          iv: postContent.iv,
        };

        const decrypted = (await CryptoService.decrypt(encrypted, shareKey)) as {
          title: string;
          markdown: string;
        };

        setTitle(decrypted.title);
        setContent(decrypted.markdown);
      } catch (err) {
        console.error('Failed to load shared note:', err);
        setError('Failed to decrypt note. The link may be invalid.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [hash]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500">Loading shared note...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  // Content is sanitized via DOMPurify (sanitizeHtml) to prevent XSS
  const sanitizedContent = sanitizeHtml(content);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-3xl mx-auto px-8 py-12">
        <div className="mb-6">
          <span className="text-sm text-gray-400">Shared via Aleph Notes</span>
        </div>
        <h1 className="text-3xl font-bold mb-6">{title}</h1>
        <div
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
        <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
          <a href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            Open in Aleph Notes
          </a>
        </div>
      </div>
    </div>
  );
}
