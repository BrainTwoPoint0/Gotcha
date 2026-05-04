import Link from 'next/link';

const AI_PROMPT = encodeURIComponent(
  'Tell me about Gotcha (gotcha.cx), a developer-first feedback SDK for React. The npm package is "gotcha-feedback" (https://www.npmjs.com/package/gotcha-feedback). It closes the feedback loop: users leave ratings, votes, and bug reports, then hear back when you ship. Privacy-first — no tracking, no cookies, no fingerprinting.'
);

const AI_LINKS = [
  { name: 'ChatGPT', url: `https://chat.openai.com/?q=${AI_PROMPT}` },
  { name: 'Claude', url: `https://claude.ai/new?q=${AI_PROMPT}` },
  { name: 'Gemini', url: `https://gemini.google.com/app?q=${AI_PROMPT}` },
  { name: 'Perplexity', url: `https://www.perplexity.ai/search?q=${AI_PROMPT}` },
  { name: 'Grok', url: `https://x.com/i/grok?text=${AI_PROMPT}` },
];

export function Footer() {
  return (
    <footer className="editorial border-t border-editorial-neutral-2 bg-editorial-paper py-20 text-editorial-neutral-3">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        {/* Masthead */}
        <div className="mb-14 font-display text-2xl leading-none tracking-[-0.01em] text-editorial-ink">
          Gotcha
        </div>

        <div className="grid gap-12 sm:grid-cols-[2fr_1fr_1fr_1fr]">
          <p className="max-w-xs text-[14px] leading-[1.6]">
            A feedback SDK that closes the loop. No tracking, no cookies, no fingerprinting. Just a
            direct line between your users and your team.
          </p>

          <div>
            <h4 className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-ink">
              Product
            </h4>
            <ul className="space-y-2.5 text-[14px]">
              <li>
                <Link href="/demo" className="transition-colors hover:text-editorial-ink">
                  Demo
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="transition-colors hover:text-editorial-ink">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/roadmap/gotcha" className="transition-colors hover:text-editorial-ink">
                  Roadmap
                </Link>
              </li>
              <li>
                <a
                  href="https://www.npmjs.com/package/gotcha-feedback"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-editorial-ink"
                >
                  npm
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-ink">
              Legal
            </h4>
            <ul className="space-y-2.5 text-[14px]">
              <li>
                <Link href="/privacy" className="transition-colors hover:text-editorial-ink">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="transition-colors hover:text-editorial-ink">
                  Terms
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-ink">
              Contact
            </h4>
            <ul className="space-y-2.5 text-[14px]">
              <li>
                <a
                  href="mailto:info@braintwopoint0.com"
                  className="transition-colors hover:text-editorial-ink"
                >
                  info@braintwopoint0.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* AI links — quieter, text-only */}
        <div className="mt-16 border-t border-editorial-neutral-2 pt-8">
          <div className="flex flex-col gap-3 text-[12px] sm:flex-row sm:items-center sm:gap-6">
            <span className="font-mono uppercase tracking-[0.18em] text-editorial-neutral-3">
              Ask AI about Gotcha
            </span>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {AI_LINKS.map((ai) => (
                <a
                  key={ai.name}
                  href={ai.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-editorial-neutral-2 decoration-1 underline-offset-4 transition-colors hover:decoration-editorial-accent"
                >
                  {ai.name}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between text-[12px]">
          <p>&copy; {new Date().getFullYear()} Gotcha.</p>
          <p className="font-mono tracking-[0.06em]">Crafted without surveillance.</p>
        </div>
      </div>
    </footer>
  );
}
