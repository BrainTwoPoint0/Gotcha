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

  if (workspaces.length <= 1) {
    const ws = workspaces[0];
    if (!ws) return null;
    return <span className="max-w-[180px] truncate text-[14px] text-editorial-ink">{ws.name}</span>;
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
        disabled={switching}
        className="flex max-w-[220px] items-center gap-1.5 truncate text-[14px] text-editorial-ink transition-colors hover:text-editorial-accent"
      >
        <span className="truncate">{active?.name}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`shrink-0 text-editorial-neutral-3 transition-transform duration-240 ease-page-turn ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
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
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />

          <div className="editorial absolute left-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-md border border-editorial-neutral-2 bg-editorial-paper shadow-[0_8px_24px_rgba(26,23,20,0.08)]">
            <div className="px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
              Workspaces
            </div>
            <div className="border-t border-editorial-neutral-2/70">
              {workspaces.map((ws) => {
                const isActive = ws.id === activeId;
                return (
                  <button
                    key={ws.id}
                    onClick={() => handleSwitch(ws.id)}
                    disabled={switching}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-editorial-ink/[0.03] ${isActive ? 'bg-editorial-ink/[0.02]' : ''} ${switching ? 'opacity-60' : ''}`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-editorial-neutral-2 bg-editorial-paper font-mono text-[12px] text-editorial-neutral-3">
                      {ws.name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] text-editorial-ink">{ws.name}</p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-editorial-neutral-3">
                        {ws.role.charAt(0) + ws.role.slice(1).toLowerCase()}
                      </p>
                    </div>
                    {isActive && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        className="shrink-0 text-editorial-accent"
                        aria-hidden="true"
                      >
                        <path
                          d="M3.5 7L6 9.5L10.5 4.5"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
