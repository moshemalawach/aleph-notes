import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

function useRevealOnScroll() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    el.querySelectorAll('.reveal').forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, []);
  return ref;
}

function FeatureIcon({ src, fallback }: { src: string; fallback: React.ReactNode }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  return <img src={src} alt="" className="w-8 h-8" onError={() => setFailed(true)} />;
}

const LockIcon = (
  <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const GlobeIcon = (
  <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.354-5.646M12 21a9.004 9.004 0 01-8.354-5.646M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
  </svg>
);

const PenIcon = (
  <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);

export default function LandingPage() {
  const sectionsRef = useRevealOnScroll();

  return (
    <div ref={sectionsRef} className="noise-bg min-h-screen bg-canvas text-ink overflow-x-hidden">
      {/* Ambient gradient */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: 'var(--c-gradient-subtle)' }}
      />

      {/* ─── NAV ─── */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-10 py-5">
        <div className="flex items-center gap-2.5">
          <span className="text-accent text-2xl font-display" style={{ fontWeight: 600 }}>&#x2135;</span>
          <span className="font-display text-base font-semibold tracking-tight">Aleph Notes</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/moshemalawach/aleph-notes"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] text-ink-muted hover:text-ink transition-colors font-body hidden sm:block"
          >
            GitHub
          </a>
          <Link
            to="/app"
            className="px-4 py-2 text-[13px] font-medium font-body rounded-lg bg-accent text-white hover:bg-accent-hover transition-all duration-200"
          >
            Launch App
          </Link>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 text-center">
        {/* Hero visual */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <img
            src="/hero-visual.png"
            alt=""
            className="w-[600px] md:w-[700px] opacity-40 select-none"
            style={{ animation: 'aleph-breathe 8s ease-in-out infinite' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>

        {/* Fallback glow orb */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, var(--c-accent-soft) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <span
              className="text-[8rem] md:text-[10rem] leading-none font-display text-accent block"
              style={{
                animation: 'aleph-breathe 6s ease-in-out infinite',
                fontWeight: 500,
                opacity: 0.15,
              }}
            >
              &#x2135;
            </span>
          </div>

          <h1
            className="animate-fade-in font-display text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mt-[-2rem]"
            style={{ animationDelay: '0.2s' }}
          >
            Your thoughts,{' '}
            <span className="landing-gradient-text">encrypted</span>{' '}
            and infinite.
          </h1>

          <p
            className="animate-fade-in mt-6 text-lg md:text-xl text-ink-secondary font-body max-w-xl mx-auto leading-relaxed"
            style={{ animationDelay: '0.4s' }}
          >
            End-to-end encrypted notes on decentralized storage.
            Your wallet is the only key.
          </p>

          <div
            className="animate-fade-in flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
            style={{ animationDelay: '0.6s' }}
          >
            <Link
              to="/app"
              className="group px-8 py-3.5 text-sm font-medium font-body rounded-xl bg-accent text-white hover:bg-accent-hover transition-all duration-300 flex items-center gap-2"
            >
              Launch App
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
              </svg>
            </Link>
            <a
              href="#features"
              className="px-8 py-3.5 text-sm font-medium font-body rounded-xl border border-edge hover:border-edge-strong hover:bg-hover transition-all duration-300"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-fade-in" style={{ animationDelay: '1s' }}>
          <div className="w-5 h-8 rounded-full border-2 border-ink-ghost flex justify-center pt-1.5">
            <div className="w-1 h-2 rounded-full bg-ink-ghost" style={{ animation: 'slide-up 1.5s ease-in-out infinite' }} />
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="relative py-24 md:py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 reveal landing-reveal">
            <h2 className="font-display text-3xl md:text-4xl font-bold">
              Notes that <span className="text-accent">belong to you</span>
            </h2>
            <p className="mt-4 text-ink-secondary font-body max-w-lg mx-auto">
              No servers to trust. No accounts to create. Just your wallet, your keys, your data.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="reveal landing-reveal group rounded-2xl border border-edge bg-surface/50 backdrop-blur-sm p-8 hover:border-accent-edge transition-all duration-300" style={{ transitionDelay: '0ms' }}>
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                <FeatureIcon src="/icon-encrypt.png" fallback={LockIcon} />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">End-to-End Encrypted</h3>
              <p className="text-[14px] text-ink-secondary font-body leading-relaxed">
                AES-256-GCM encryption happens entirely in your browser.
                Your wallet signature derives the key — no one else can read your notes.
              </p>
            </div>

            <div className="reveal landing-reveal group rounded-2xl border border-edge bg-surface/50 backdrop-blur-sm p-8 hover:border-accent-edge transition-all duration-300" style={{ transitionDelay: '100ms' }}>
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                <FeatureIcon src="/icon-decentral.png" fallback={GlobeIcon} />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">Decentralized Storage</h3>
              <p className="text-[14px] text-ink-secondary font-body leading-relaxed">
                Built on Aleph Cloud&apos;s peer-to-peer network. No central server,
                no single point of failure. Your data persists across the network.
              </p>
            </div>

            <div className="reveal landing-reveal group rounded-2xl border border-edge bg-surface/50 backdrop-blur-sm p-8 hover:border-accent-edge transition-all duration-300" style={{ transitionDelay: '200ms' }}>
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                <FeatureIcon src="/icon-editor.png" fallback={PenIcon} />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">Rich Markdown Editing</h3>
              <p className="text-[14px] text-ink-secondary font-body leading-relaxed">
                Full-featured editor with markdown shortcuts, image support,
                hierarchical notes, drag-and-drop, and version history.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="relative py-24 md:py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 reveal landing-reveal">
            <h2 className="font-display text-3xl md:text-4xl font-bold">
              Three steps to <span className="text-accent">sovereignty</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            <div className="reveal landing-reveal text-center" style={{ transitionDelay: '0ms' }}>
              <div className="w-16 h-16 rounded-full border-2 border-accent/30 bg-accent/5 flex items-center justify-center mx-auto mb-5">
                <span className="text-accent font-display text-2xl font-semibold">1</span>
              </div>
              <h3 className="font-display text-base font-semibold mb-2">Connect Wallet</h3>
              <p className="text-[14px] text-ink-muted font-body leading-relaxed">
                Link your Ethereum wallet. MetaMask, WalletConnect — any EVM wallet works.
              </p>
            </div>

            <div className="reveal landing-reveal text-center" style={{ transitionDelay: '150ms' }}>
              <div className="w-16 h-16 rounded-full border-2 border-accent/30 bg-accent/5 flex items-center justify-center mx-auto mb-5">
                <span className="text-accent font-display text-2xl font-semibold">2</span>
              </div>
              <h3 className="font-display text-base font-semibold mb-2">Sign &amp; Derive</h3>
              <p className="text-[14px] text-ink-muted font-body leading-relaxed">
                One signature generates your encryption key. It never leaves your browser. No passwords.
              </p>
            </div>

            <div className="reveal landing-reveal text-center" style={{ transitionDelay: '300ms' }}>
              <div className="w-16 h-16 rounded-full border-2 border-accent/30 bg-accent/5 flex items-center justify-center mx-auto mb-5">
                <span className="text-accent font-display text-2xl font-semibold">3</span>
              </div>
              <h3 className="font-display text-base font-semibold mb-2">Write Freely</h3>
              <p className="text-[14px] text-ink-muted font-body leading-relaxed">
                Create, organize, and share notes. Everything is encrypted and stored on the decentralized network.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECURITY CALLOUT ─── */}
      <section className="relative py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="reveal landing-reveal relative rounded-2xl border border-accent-edge bg-accent/5 p-10 md:p-14 text-center overflow-hidden">
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, var(--c-accent-soft) 0%, transparent 70%)',
                filter: 'blur(40px)',
              }}
            />
            <div className="relative">
              <span className="text-5xl font-display text-accent block mb-4" style={{ fontWeight: 500 }}>&#x2135;</span>
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
                Zero-knowledge by design
              </h2>
              <p className="text-ink-secondary font-body leading-relaxed max-w-lg mx-auto">
                We can&apos;t read your notes. Nobody can — unless you share the key.
                Your encryption key is derived from your wallet signature and exists
                only in your browser&apos;s memory during your session. When you close
                the tab, the key is gone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="relative py-24 md:py-32 px-6">
        <div className="max-w-2xl mx-auto text-center reveal landing-reveal">
          <h2 className="font-display text-3xl md:text-5xl font-bold leading-tight">
            Ready to own your{' '}
            <span className="landing-gradient-text">notes</span>?
          </h2>
          <p className="mt-5 text-ink-secondary font-body text-lg">
            No sign-up. No email. No passwords. Just connect and write.
          </p>
          <Link
            to="/app"
            className="group inline-flex items-center gap-2 mt-10 px-10 py-4 text-base font-medium font-body rounded-xl bg-accent text-white hover:bg-accent-hover transition-all duration-300"
          >
            Launch Aleph Notes
            <svg className="w-5 h-5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="relative border-t border-edge py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-accent font-display text-sm">&#x2135;</span>
            <span className="text-ink-muted text-[13px] font-body">
              Built on{' '}
              <a
                href="https://aleph.im"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink-secondary hover:text-accent transition-colors"
              >
                Aleph Cloud
              </a>
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/moshemalawach/aleph-notes"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-muted text-[13px] font-body hover:text-ink transition-colors"
            >
              Source Code
            </a>
            <a
              href="https://docs.aleph.im"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-muted text-[13px] font-body hover:text-ink transition-colors"
            >
              Aleph Docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
