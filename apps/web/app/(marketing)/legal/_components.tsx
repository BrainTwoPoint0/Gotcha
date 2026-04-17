import { Fragment } from 'react';

/**
 * Shared editorial primitives for the legal pages (/privacy, /terms).
 *
 * Underscore-prefixed directory so Next.js doesn't route it. Same
 * vocabulary used on both pages — extracted here so a third legal
 * page (DPA, cookie policy) inherits the system for free.
 */

export function LegalSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={`section-${number}`} className="scroll-mt-24">
      <div className="mb-5 flex items-center gap-3">
        <span className="h-px w-6 bg-editorial-neutral-3/60" aria-hidden="true" />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
          Section {number}
        </span>
      </div>
      <h2 className="font-display text-[1.625rem] font-normal leading-[1.2] tracking-[-0.01em] text-editorial-ink sm:text-[1.875rem]">
        {title}
      </h2>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

export function LegalSubhead({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-neutral-3">
      {children}
    </h3>
  );
}

export function LegalP({ children }: { children: React.ReactNode }) {
  return <p className="text-[15px] leading-[1.7] text-editorial-ink/90">{children}</p>;
}

export function LegalBullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2 pl-0">
      {items.map((item, i) => (
        <li
          key={i}
          className="flex items-start gap-3 text-[15px] leading-[1.6] text-editorial-ink/90"
        >
          <span className="mt-[11px] h-px w-4 shrink-0 bg-editorial-neutral-3" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function LegalDefList({ items }: { items: { term: string; def: React.ReactNode }[] }) {
  // Fragment-based grid children instead of `display: contents` on a
  // wrapping div. Safari <16 and Chrome <105 strip the dt/dd semantics
  // from the a11y tree when a parent uses `contents` — Fragments keep
  // the spec-correct DOM with no extra wrapper.
  return (
    <dl className="grid gap-3 border-y border-editorial-neutral-2 py-5 sm:grid-cols-[140px_1fr] sm:gap-x-8 sm:gap-y-3">
      {items.map(({ term, def }) => (
        <Fragment key={term}>
          <dt className="font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-neutral-3">
            {term}
          </dt>
          <dd className="text-[14px] leading-[1.6] text-editorial-ink/90">{def}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

export function LegalCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-sm bg-editorial-ink/[0.04] px-1.5 py-0.5 font-mono text-[13px] text-editorial-ink">
      {children}
    </code>
  );
}

export function LegalEmailLink() {
  return (
    <a
      href="mailto:info@braintwopoint0.com"
      className="text-editorial-ink underline decoration-editorial-neutral-2 decoration-1 underline-offset-4 transition-colors hover:decoration-editorial-accent"
    >
      info@braintwopoint0.com
    </a>
  );
}

/**
 * Sticky table-of-contents rail. Renders only on lg: so narrow screens
 * get a normal single-column reading flow. Each entry is a mono-caps
 * section number plus title that jumps to the matching section id.
 */
export function LegalTOC({ sections }: { sections: { number: string; title: string }[] }) {
  return (
    <nav aria-label="Table of contents" className="sticky top-24 hidden self-start lg:block">
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-6 bg-editorial-neutral-3/60" aria-hidden="true" />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
          Contents
        </span>
      </div>
      <ol className="space-y-2">
        {sections.map(({ number, title }) => (
          <li key={number}>
            <a
              href={`#section-${number}`}
              className="group flex items-baseline gap-3 text-[13px] leading-[1.5] text-editorial-neutral-3 transition-colors hover:text-editorial-ink"
            >
              <span className="font-mono text-[10px] tabular-nums text-editorial-neutral-3/70 group-hover:text-editorial-accent">
                {number}
              </span>
              <span>{title}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
