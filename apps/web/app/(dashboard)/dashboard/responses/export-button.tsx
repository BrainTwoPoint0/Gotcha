'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Download, Loader2 } from 'lucide-react';

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

      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const response = await fetch(`/api/export/responses?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Export failed');
        return;
      }

      // Download the file
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
      <Button variant="secondary" asChild>
        <a href="/dashboard/settings" className="gap-2">
          <Download className="w-4 h-4" />
          Export
          <Badge variant="secondary" className="text-xs">
            Pro
          </Badge>
        </a>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('csv')}>Export as CSV</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')}>Export as JSON</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
