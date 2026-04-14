'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, Loader2 } from 'lucide-react';
import { EditorialButton } from '../../components/editorial/button';

interface ExportButtonProps {
  isPro: boolean;
}

export function ExportButton({ isPro }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const searchParams = useSearchParams();

  const handleExport = async (format: 'csv' | 'json') => {
    setIsExporting(true);

    try {
      const params = new URLSearchParams();
      params.set('format', format);

      const forwardKeys = [
        'startDate',
        'endDate',
        'elementId',
        'status',
        'tag',
        'mode',
        'projectId',
      ];
      for (const key of forwardKeys) {
        const value = searchParams.get(key);
        if (value) params.set(key, value);
      }

      const response = await fetch(`/api/export/responses?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Export failed');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gotcha-responses-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isPro) {
    return (
      <Link
        href="/dashboard/settings"
        className="inline-flex h-10 items-center gap-2 rounded-md border border-editorial-neutral-2 bg-editorial-paper px-4 text-[14px] text-editorial-ink transition-colors hover:bg-editorial-ink/[0.03]"
      >
        <Download className="h-4 w-4" />
        Export
        <span className="ml-1 font-mono text-[9px] uppercase tracking-[0.18em] text-editorial-accent">
          Pro
        </span>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <EditorialButton variant="ghost" disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Exporting…
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Export
            </>
          )}
        </EditorialButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="editorial border-editorial-neutral-2 bg-editorial-paper"
      >
        <DropdownMenuItem onClick={() => handleExport('csv')} className="text-[13px]">
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')} className="text-[13px]">
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
