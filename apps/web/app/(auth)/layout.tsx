import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-gray-950 flex-col justify-between p-12 overflow-hidden">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Floating code snippets as decoration */}
        <div className="absolute top-[15%] right-12 opacity-[0.07] text-white font-mono text-sm leading-relaxed select-none">
          {'<Gotcha elementId="hero" />\n<Gotcha mode="vote" />\n<Gotcha mode="nps" />'}
        </div>
        <div className="absolute bottom-[20%] left-12 opacity-[0.07] text-white font-mono text-sm leading-relaxed select-none">
          {'onSubmit={(data) => {\n  console.log(data)\n}}'}
        </div>

        <div className="relative z-10">
          <Link href="/" className="text-white text-2xl font-bold tracking-tight">
            Gotcha
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <blockquote className="text-white/90 text-2xl font-light leading-relaxed max-w-md">
            &ldquo;Know what your users actually think — not what you assume.&rdquo;
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="h-px w-8 bg-white/20" />
            <p className="text-white/40 text-sm">Contextual feedback in 3 lines of code</p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-white/30 text-xs">
          <Link href="/terms" className="hover:text-white/50 transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-white/50 transition-colors">
            Privacy
          </Link>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col bg-white">
        <div className="lg:hidden p-6">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Gotcha
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center px-6 py-12">{children}</div>
      </div>
    </div>
  );
}
