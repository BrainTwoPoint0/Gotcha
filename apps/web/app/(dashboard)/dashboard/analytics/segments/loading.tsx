import { EditorialSkeleton } from '../../../components/editorial/skeleton';

export default function SegmentsLoading() {
  return (
    <div className="editorial">
      <div className="mb-10 space-y-3">
        <EditorialSkeleton className="h-3 w-48" />
        <EditorialSkeleton className="h-10 w-48" />
        <EditorialSkeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="mb-6 flex flex-wrap gap-3 rounded-md border border-editorial-neutral-2 bg-editorial-paper p-4">
        <EditorialSkeleton className="h-9 w-32" />
        <EditorialSkeleton className="h-9 w-40" />
        <EditorialSkeleton className="h-9 w-28" />
      </div>
      <EditorialSkeleton className="h-96 w-full rounded-md" />
    </div>
  );
}
