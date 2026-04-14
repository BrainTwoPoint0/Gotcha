'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { EditorialButton } from './editorial/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  basePath?: string;
  itemLabel?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  total,
  basePath = '/dashboard/responses',
  itemLabel = 'responses',
}: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`${basePath}?${params.toString()}`);
  };

  if (totalPages <= 1) return null;

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-editorial-neutral-2 px-4 py-4 sm:flex-row">
      <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.14em] text-editorial-neutral-3">
        <span>
          <span className="text-editorial-ink">{pad(currentPage)}</span>{' '}
          <span className="text-editorial-neutral-3/60">/</span> {pad(totalPages)}
        </span>
        <span aria-hidden="true" className="text-editorial-neutral-2">
          ·
        </span>
        <span>
          {total.toLocaleString()} {itemLabel}
        </span>
      </div>
      <div className="flex gap-2">
        <EditorialButton
          variant="ghost"
          size="sm"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ← Previous
        </EditorialButton>
        <EditorialButton
          variant="ghost"
          size="sm"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next →
        </EditorialButton>
      </div>
    </div>
  );
}
