'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
  variant = 'auto',
}: {
  workspaces: Workspace[];
  activeId: string;
  /**
   * `auto` — desktop top-nav usage: anchored dropdown on wide screens,
   *   portal-rendered bottom sheet on narrow screens.
   * `inline` — use when embedded in another panel (e.g. the mobile
   *   drawer). The list expands beneath the trigger as an accordion;
   *   no portal, no extra backdrop. Prevents portal-vs-portal stacking
   *   when the parent is already a bottom sheet.
   */
  variant?: 'auto' | 'inline';
}) {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  // Below the sm: breakpoint the anchored dropdown clips off-screen on
  // top-nav usage. Switch to a portal-rendered bottom sheet for that
  // narrow case. Inline variant ignores this and always expands in place.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 639px)');
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const useBottomSheet = variant === 'auto' && isMobile;

  // Lock body scroll while the bottom sheet is open — on mobile a
  // tall list behind a tap-scroll area feels bad.
  useEffect(() => {
    if (!open || !useBottomSheet) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, useBottomSheet]);

  // Escape closes.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

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
        // Hard reload rather than router.refresh so every cookie-scoped lookup
        // (active org, plan gates, etc.) picks up the new workspace ID in a
        // single pass. router.refresh alone leaves RSC-cached branches stale.
        window.location.reload();
      }
    } catch {
      // silent
    } finally {
      setSwitching(false);
    }
  }

  const list = (
    <div className="border-t border-editorial-neutral-2/70">
      {workspaces.map((ws) => {
        const isActive = ws.id === activeId;
        return (
          <button
            key={ws.id}
            onClick={() => handleSwitch(ws.id)}
            disabled={switching}
            className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-editorial-ink/[0.03] ${
              isActive ? 'bg-editorial-ink/[0.02]' : ''
            } ${switching ? 'opacity-60' : ''}`}
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
  );

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={switching}
        aria-haspopup="listbox"
        aria-expanded={open}
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

      {/* Inline variant: list expands in place beneath the trigger.
          Used when embedded in a parent panel (e.g. mobile drawer) so
          we don't stack a portal inside another portal. */}
      {open && variant === 'inline' && (
        <div className="editorial mt-3 overflow-hidden rounded-md border border-editorial-neutral-2 bg-editorial-paper">
          <div className="px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
            Workspaces
          </div>
          {list}
        </div>
      )}

      {/* Desktop (auto variant): anchored dropdown hanging from the
          trigger. Only rendered when variant is auto AND we're above
          the mobile breakpoint. */}
      {open && variant === 'auto' && !isMobile && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="editorial absolute left-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-md border border-editorial-neutral-2 bg-editorial-paper shadow-[0_8px_24px_rgba(26,23,20,0.08)]">
            <div className="px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
              Workspaces
            </div>
            {list}
          </div>
        </>
      )}

      {/* Narrow-viewport auto variant: portal-rendered bottom sheet so
          the list always has room and never clips under the phone's
          bottom safe area. */}
      {open &&
        useBottomSheet &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[1000] flex flex-col justify-end"
            role="dialog"
            aria-modal="true"
            aria-label="Switch workspace"
          >
            <div
              className="absolute inset-0 bg-editorial-ink/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <div className="editorial relative z-10 overflow-hidden rounded-t-xl border-x border-t border-editorial-neutral-2 bg-editorial-paper pb-[env(safe-area-inset-bottom)]">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
                  Workspaces
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="-m-2 inline-flex h-10 w-10 items-center justify-center text-editorial-neutral-3 transition-colors hover:text-editorial-ink"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M4 4L12 12M12 4L4 12"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
              <div className="max-h-[70vh] overflow-y-auto">{list}</div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
