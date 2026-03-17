'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export function WorkspaceSwitcher({
  workspaces,
  activeId,
}: {
  workspaces: Workspace[];
  activeId: string;
}) {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const router = useRouter();

  // Don't render if only one workspace
  if (workspaces.length <= 1) {
    const ws = workspaces[0];
    if (!ws) return null;
    return (
      <span className="text-sm font-medium text-gray-700 truncate max-w-[160px]">{ws.name}</span>
    );
  }

  const active = workspaces.find((w) => w.id === activeId) || workspaces[0];

  async function handleSwitch(orgId: string) {
    if (orgId === activeId || switching) return;
    setSwitching(true);

    try {
      const res = await fetch('/api/organization/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({ organizationId: orgId }),
      });

      if (res.ok) {
        setOpen(false);
        router.refresh();
        // Small delay to let the cookie propagate before full reload
        setTimeout(() => window.location.reload(), 100);
      }
    } catch {
      // silent
    } finally {
      setSwitching(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors truncate max-w-[200px]"
        disabled={switching}
      >
        <span className="truncate">{active?.name}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1 overflow-hidden">
            <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-gray-400">
              Workspaces
            </div>
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => handleSwitch(ws.id)}
                disabled={switching}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                  ws.id === activeId ? 'bg-gray-50' : ''
                } ${switching ? 'opacity-50' : ''}`}
              >
                <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500 shrink-0">
                  {ws.name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{ws.name}</p>
                  <p className="text-[11px] text-gray-400">
                    {ws.role.charAt(0) + ws.role.slice(1).toLowerCase()}
                  </p>
                </div>
                {ws.id === activeId && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    className="shrink-0 text-gray-400"
                  >
                    <path
                      d="M3.5 7L6 9.5L10.5 4.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
