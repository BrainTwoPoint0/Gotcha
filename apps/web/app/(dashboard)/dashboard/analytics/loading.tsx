import { EditorialSkeleton } from '../../components/editorial/skeleton';

export default function AnalyticsLoading() {
  return (
    <div className="editorial">
      <div className="mb-10 space-y-3">
        <EditorialSkeleton className="h-3 w-48" />
        <EditorialSkeleton className="h-10 w-40" />
        <EditorialSkeleton className="h-4 w-80" />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-md border border-editorial-neutral-2 bg-editorial-paper p-4">
        <EditorialSkeleton className="h-9 w-32" />
        <EditorialSkeleton className="h-9 w-44" />
        <EditorialSkeleton className="h-9 w-28" />
        <EditorialSkeleton className="h-9 w-28" />
      </div>

      <div className="mb-6 flex items-center gap-6 border-b border-editorial-neutral-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <EditorialSkeleton key={i} className="h-8 w-20" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-md border border-editorial-neutral-2 bg-editorial-paper p-6"
          >
            <EditorialSkeleton className="h-3 w-16" />
            <EditorialSkeleton className="mt-4 h-8 w-20" />
            <EditorialSkeleton className="mt-3 h-3 w-24" />
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <EditorialSkeleton className="h-80 w-full rounded-md" />
        <EditorialSkeleton className="h-80 w-full rounded-md" />
      </div>
    </div>
  );
}
