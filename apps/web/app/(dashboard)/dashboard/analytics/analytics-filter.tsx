'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { EditorialButton } from '../../components/editorial/button';

interface Project {
  id: string;
  name: string;
  slug: string;
}

interface Element {
  elementIdRaw: string;
  count: number;
}

interface AnalyticsFilterProps {
  projects: Project[];
  elements?: Element[];
}

const TRIGGER_CLASS =
  'h-9 rounded-md border-editorial-neutral-2 bg-editorial-paper text-[13px] text-editorial-ink focus:border-editorial-accent focus:ring-2 focus:ring-editorial-accent/25';

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
      {children}
    </span>
  );
}

export function AnalyticsFilter({ projects, elements = [] }: AnalyticsFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
  const [projectId, setProjectId] = useState(searchParams.get('projectId') || '');
  const [elementId, setElementId] = useState(searchParams.get('elementId') || '');

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (projectId && projectId !== '__all__') params.set('projectId', projectId);
    if (elementId && elementId !== '__all__') params.set('elementId', elementId);

    router.push(`/dashboard/analytics?${params.toString()}`);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setProjectId('');
    setElementId('');
    router.push('/dashboard/analytics');
  };

  const hasFilters = startDate || endDate || projectId || elementId;

  return (
    <div className="mb-6 rounded-md border border-editorial-neutral-2 bg-editorial-paper p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex flex-col gap-2">
          <FieldLabel>Project</FieldLabel>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger aria-label="Project" className={`${TRIGGER_CLASS} w-full sm:w-[200px]`}>
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent className="editorial border-editorial-neutral-2 bg-editorial-paper">
              <SelectItem value="__all__">All projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <FieldLabel>Element</FieldLabel>
          <Select value={elementId} onValueChange={setElementId}>
            <SelectTrigger aria-label="Element" className={`${TRIGGER_CLASS} w-full sm:w-[220px]`}>
              <SelectValue placeholder="All elements" />
            </SelectTrigger>
            <SelectContent className="editorial border-editorial-neutral-2 bg-editorial-paper">
              <SelectItem value="__all__">All elements</SelectItem>
              {elements.map((el) => (
                <SelectItem key={el.elementIdRaw} value={el.elementIdRaw}>
                  {el.elementIdRaw} ({el.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <FieldLabel>Start</FieldLabel>
          <DatePicker value={startDate} onChange={setStartDate} placeholder="Start date" />
        </div>

        <div className="flex flex-col gap-2">
          <FieldLabel>End</FieldLabel>
          <DatePicker value={endDate} onChange={setEndDate} placeholder="End date" />
        </div>

        <div className="flex gap-2 sm:ml-auto">
          <EditorialButton onClick={applyFilters} variant="ink" size="sm" className="h-9">
            Apply filters
          </EditorialButton>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="h-9 px-2.5 text-[13px] text-editorial-neutral-3 transition-colors hover:text-editorial-ink"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
