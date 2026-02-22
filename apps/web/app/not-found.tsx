import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-6">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">Page not found</p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="bg-slate-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-600"
          >
            Home
          </Link>
          <Link
            href="/dashboard"
            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
