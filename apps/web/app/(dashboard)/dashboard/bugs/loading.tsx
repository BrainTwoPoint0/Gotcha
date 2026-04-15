import { EditorialSkeleton } from '../../components/editorial/skeleton';

export default function BugsLoading() {
  return (
    <div className="editorial">
      <div className="mb-10 space-y-3">
        <EditorialSkeleton className="h-3 w-32" />
        <EditorialSkeleton className="h-10 w-24" />
        <EditorialSkeleton className="h-4 w-72" />
      </div>

      <div className="mb-6 flex items-center gap-6 border-b border-editorial-neutral-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <EditorialSkeleton key={i} className="h-8 w-20" />
        ))}
      </div>

      <div className="overflow-hidden rounded-md border border-editorial-neutral-2 bg-editorial-paper">
        <div className="border-b border-editorial-neutral-2 px-6 py-3">
          <div className="flex items-center gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <EditorialSkeleton key={i} className={`h-3 ${i === 0 ? 'w-16' : 'w-14'}`} />
            ))}
          </div>
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-6 border-b border-editorial-neutral-2 px-6 py-4 last:border-b-0"
          >
            <EditorialSkeleton className="h-4 flex-1" />
            <EditorialSkeleton className="h-4 w-24" />
            <EditorialSkeleton className="h-5 w-20" />
            <EditorialSkeleton className="h-5 w-16" />
            <EditorialSkeleton className="h-4 w-24" />
            <EditorialSkeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
