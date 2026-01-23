import Link from 'next/link';

const AI_PROMPT = encodeURIComponent(
  'Tell me about Gotcha (gotcha.cx), a developer-first contextual feedback SDK for React. The npm package is "gotcha-feedback" (https://www.npmjs.com/package/gotcha-feedback). Explain what it does, how to install it (npm install gotcha-feedback), its key features like contextual feedback buttons, star ratings, and vote modes, and why developers should use it instead of generic survey tools.'
);

const AI_LINKS = [
  {
    name: 'ChatGPT',
    url: `https://chat.openai.com/?q=${AI_PROMPT}`,
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
      </svg>
    ),
  },
  {
    name: 'Claude',
    url: `https://claude.ai/new?q=${AI_PROMPT}`,
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M4.603 15.477l3.637-2.04.061-.177-.061-.099-.177-.001-.608-.037-2.078-.056-1.802-.075-1.746-.094-.439-.094-.412-.543.042-.271.369-.248.529.046 1.169.08 1.755.121 1.273.075 1.886.196h.299l.042-.121-.102-.075-.08-.075-1.816-1.231-1.966-1.301-1.03-.749-.557-.379-.281-.356-.121-.776.506-.557.679.046.173.046.688.529 1.469 1.137 1.918 1.413.281.233.112-.08.014-.056-.126-.211-1.043-1.886-1.113-1.918-.496-.795-.131-.477c-.046-.196-.08-.361-.08-.562l.575-.781.318-.102.768.102.323.281.477 1.091.773 1.717 1.198 2.335.351.693.187.641.07.196.121-.001v-.112l.099-1.315.182-1.615.177-2.078.061-.585.29-.701.575-.379.449.215.369.529-.051.342-.22 1.428-.431 2.237-.281 1.498h.164l.187-.187.757-1.006 1.273-1.592.562-.631.655-.698.42-.332.795-.001.585.87-.262.899-.819 1.038-.679.88-.974 1.311-.608 1.048.056.084.145-.014 2.199-.468 1.188-.215 1.418-.243.641.299.07.305-.252.623-1.516.374-1.778.356-2.648.627-.032.024.037.046 1.193.112.51.027h1.249l2.326.173.608.402.364.492-.061.374-.936.477-1.263-.299-2.948-.701-1.011-.252-.14-.001v.084l.843.824 1.544 1.394 1.933 1.797.099.444-.248.351-.262-.037-1.699-1.278-.655-.575-1.484-1.249-.099-.001v.131l.342.501 1.806 2.715.094.833-.131.271-.468.164-.514-.094-1.057-1.484-1.091-1.671-.88-1.498-.107.061-.519 5.593-.243.286-.562.215-.468-.356-.248-.575.248-1.137.299-1.484.243-1.18.22-1.465.131-.487-.009-.032-.107.014-1.104 1.516-1.68 2.27-1.329 1.423-.318.126-.552-.286.051-.51.308-.454 1.84-2.34 1.109-1.45.716-.838-.005-.121h-.042l-4.886 3.172-.87.112-.374-.351.046-.575.177-.187 1.469-1.011-.005.005.001.005z" />
      </svg>
    ),
  },
  {
    name: 'Gemini',
    url: `https://gemini.google.com/app?q=${AI_PROMPT}`,
    icon: (
      <svg viewBox="0 0 65 65" className="w-6 h-6" fill="currentColor">
        <path d="M32.447 0c.68 0 1.273.465 1.439 1.125a38.904 38.904 0 001.999 5.905c2.152 5 5.105 9.376 8.854 13.125 3.751 3.75 8.126 6.703 13.125 8.855a38.98 38.98 0 005.906 1.999c.66.166 1.124.758 1.124 1.438 0 .68-.464 1.273-1.125 1.439a38.902 38.902 0 00-5.905 1.999c-5 2.152-9.375 5.105-13.125 8.854-3.749 3.751-6.702 8.126-8.854 13.125a38.973 38.973 0 00-2 5.906 1.485 1.485 0 01-1.438 1.124c-.68 0-1.272-.464-1.438-1.125a38.913 38.913 0 00-2-5.905c-2.151-5-5.103-9.375-8.854-13.125-3.75-3.749-8.125-6.702-13.125-8.854a38.973 38.973 0 00-5.905-2A1.485 1.485 0 010 32.448c0-.68.465-1.272 1.125-1.438a38.903 38.903 0 005.905-2c5-2.151 9.376-5.104 13.125-8.854 3.75-3.749 6.703-8.125 8.855-13.125a38.972 38.972 0 001.999-5.905A1.485 1.485 0 0132.447 0z" />
      </svg>
    ),
  },
  {
    name: 'Perplexity',
    url: `https://www.perplexity.ai/search?q=${AI_PROMPT}`,
    icon: (
      <svg viewBox="0 0 24 24" className="w-9 h-9" fill="currentColor">
        <path d="M16.36 6.01l-3.24 2.74h3.24V6.01zM12.42 8.3l4.75-4.01v4.46h1.52v6.74h-1.82v4.23l-4.44-4.08v3.95h-.8v-3.95l-4.54 4.06v-4.21H5.33V8.75h1.82V4.25l4.48 4v-3.91h.8l-.01 3.96zM11.04 9.55c-1.64 0-3.29 0-4.93 0v5.14h.96v-1.28l3.97-3.86zm1.95 0l3.87 3.87v1.27h1.02V9.55c-1.63 0-3.26 0-4.89 0zM10.93 8.75L7.89 6.04v2.71h3.04zm.64 5.83v-4.48l-3.74 3.65v4.17l3.74-3.34zm.81-4.47v4.46l3.63 3.33c0-1.39 0-2.77 0-4.16l-3.63-3.63z" />
      </svg>
    ),
  },
  {
    name: 'Grok',
    url: `https://x.com/i/grok?text=${AI_PROMPT}`,
    icon: (
      <svg viewBox="0 0 24 24" className="w-9 h-9" fill="currentColor">
        <path d="M10.03 14.38l8.42-8.47v.01l2.43-2.44c-.04.06-.09.12-.13.18-1.85 2.55-2.75 3.8-2.03 6.91l-.004-.005c.5 2.12-.035 4.48-1.76 6.2-2.17 2.18-5.65 2.66-8.52.7l2-.93c1.83.72 3.83.4 5.27-1.04 1.44-1.44 1.76-3.54 1.04-5.28-.14-.33-.55-.41-.84-.2l-5.88 4.35zM8.82 15.44l-.002.002L3.2 20.5c.36-.49.8-.96 1.24-1.42 1.24-1.31 2.48-2.6 1.72-4.44-1.01-2.45-.42-5.33 1.45-7.2 1.94-1.94 4.8-2.43 7.19-1.45.53.2.99.48 1.35.74l-1.99.92c-1.86-.78-3.98-.25-5.28 1.05-1.76 1.76-2.11 4.8-.05 6.77z" />
      </svg>
    ),
  },
];

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-[2fr_1fr_1fr] gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Gotcha</h3>
            <p className="text-sm">
              A developer-first contextual feedback SDK for React. Add a feedback button to any
              component with a single line of code.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/demo" className="hover:text-white">
                  Demo
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white">
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="https://www.npmjs.com/package/gotcha-feedback"
                  className="hover:text-white"
                >
                  npm
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:info@braintwopoint0.com" className="hover:text-white">
                  info@braintwopoint0.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* AI Summary Section */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="text-center">
            <h4 className="text-white font-semibold mb-4">Ask AI about Gotcha</h4>
            <div className="flex justify-center items-center gap-6">
              {AI_LINKS.map((ai) => (
                <a
                  key={ai.name}
                  href={ai.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-white transition-colors"
                  title={`Ask ${ai.name} about Gotcha`}
                >
                  {ai.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm">
          <p>&copy; 2025 Gotcha. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
