'use client';

import { useState } from 'react';
import Link from 'next/link';

interface MoreMenuItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export function MobileMoreMenu({ items }: { items: MoreMenuItem[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* More button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex flex-col items-center justify-center gap-1 text-gray-600 hover:text-gray-900"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
        <span className="text-[11px] leading-tight">More</span>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sheet */}
      <div
        className={`fixed left-0 right-0 bottom-16 z-50 transition-all duration-200 ease-out ${
          isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="mx-3 mb-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {items.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-5 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                i < items.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <span className="text-gray-400">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
