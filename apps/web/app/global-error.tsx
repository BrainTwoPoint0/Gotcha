'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(
    JSON.stringify({
      type: 'global_error',
      message: error.message,
      digest: error.digest,
      timestamp: new Date().toISOString(),
    })
  );

  // global-error replaces the root layout entirely, so it cannot use the
  // editorial Tailwind tokens (the stylesheet may not have loaded). Keep this
  // self-contained with inline styles that visually echo the editorial
  // palette — warm paper + ink + burnt-sienna accent.
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          backgroundColor: '#FAF8F4',
          color: '#1A1714',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 24px',
          }}
        >
          <div style={{ maxWidth: 480, textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 24,
              }}
            >
              <span
                style={{ display: 'block', height: 1, width: 24, backgroundColor: '#D4532A' }}
              />
              <span
                style={{
                  fontFamily:
                    'ui-monospace, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", monospace',
                  fontSize: 11,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#6B655D',
                }}
              >
                Something went wrong
              </span>
              <span
                style={{ display: 'block', height: 1, width: 24, backgroundColor: '#D4532A' }}
              />
            </div>
            <h1
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 40,
                fontWeight: 400,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              An unexpected error<span style={{ color: '#D4532A' }}>.</span>
            </h1>
            <p
              style={{
                marginTop: 20,
                marginBottom: 32,
                color: '#6B655D',
                fontSize: 15,
                lineHeight: 1.6,
              }}
            >
              Something broke on our end. Try again, or head back to the dashboard.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={reset}
                style={{
                  padding: '12px 22px',
                  backgroundColor: '#1A1714',
                  color: '#FAF8F4',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Try again →
              </button>
              <a
                href="/dashboard"
                style={{
                  padding: '12px 22px',
                  backgroundColor: '#FAF8F4',
                  color: '#1A1714',
                  border: '1px solid #E8E2D9',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Dashboard
              </a>
            </div>
            {error.digest && (
              <p
                style={{
                  marginTop: 32,
                  fontFamily:
                    'ui-monospace, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", monospace',
                  fontSize: 10,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#6B655D',
                }}
              >
                Error id · {error.digest}
              </p>
            )}
          </div>
        </main>
      </body>
    </html>
  );
}
