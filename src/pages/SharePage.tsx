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
      <div className="noise-bg min-h-screen bg-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <span
            className="text-5xl font-display text-accent"
            style={{ animation: 'aleph-breathe 3s ease-in-out infinite' }}
          >
            &#x2135;
          </span>
          <p className="text-ink-muted text-sm font-body">Decrypting shared note...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="noise-bg min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <span className="text-6xl font-display text-ink-ghost block mb-4">&#x2135;</span>
          <p className="text-danger text-sm font-body">{error}</p>
        </div>
      </div>
    );
  }

  const sanitizedContent = sanitizeHtml(content);

  return (
    <div className="noise-bg min-h-screen bg-canvas text-ink">
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: 'var(--c-gradient-subtle)' }}
      />
      <div className="relative max-w-2xl mx-auto px-8 py-16 animate-fade-in">
        <div className="flex items-center gap-2 mb-10">
          <span className="text-accent font-display text-lg">&#x2135;</span>
          <span className="text-ink-muted text-xs tracking-widest uppercase font-body">
            Shared via Aleph Notes
          </span>
        </div>
        <h1 className="font-display text-4xl font-semibold mb-8 leading-tight">{title}</h1>
        <div
          className="share-prose prose max-w-none text-ink-secondary leading-relaxed font-body"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
        <div className="mt-16 pt-6 border-t border-edge">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent-hover transition-colors font-body"
          >
            <span className="font-display">&#x2135;</span>
            <span>Open in Aleph Notes</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
