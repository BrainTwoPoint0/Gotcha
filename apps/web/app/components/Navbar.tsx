import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Gotcha
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/demo" className="text-gray-600 hover:text-gray-900">
              Demo
            </Link>
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
              Pricing
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-600 hover:text-gray-900">
              Login
            </Link>
            <Link
              href="/signup"
              className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
