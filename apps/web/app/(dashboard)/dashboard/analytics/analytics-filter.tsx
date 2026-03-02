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
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';

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
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3">
        <div className="w-full sm:w-auto space-y-1">
          <Label>Project</Label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-auto space-y-1">
          <Label>Element</Label>
          <Select value={elementId} onValueChange={setElementId}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="All Elements" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Elements</SelectItem>
              {elements.map((el) => (
                <SelectItem key={el.elementIdRaw} value={el.elementIdRaw}>
                  {el.elementIdRaw} ({el.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-auto space-y-1">
          <Label>Start Date</Label>
          <DatePicker value={startDate} onChange={setStartDate} placeholder="Start date" />
        </div>

        <div className="w-full sm:w-auto space-y-1">
          <Label>End Date</Label>
          <DatePicker value={endDate} onChange={setEndDate} placeholder="End date" />
        </div>

        <div className="flex gap-2 sm:gap-4">
          <Button onClick={applyFilters} className="flex-1 sm:flex-none">
            Apply
          </Button>

          {hasFilters && (
            <Button variant="ghost" onClick={clearFilters}>
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
