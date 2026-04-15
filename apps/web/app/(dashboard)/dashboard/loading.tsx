import { EditorialSkeleton } from '../components/editorial/skeleton';

export default function DashboardHomeLoading() {
  return (
    <div className="editorial">
      <div className="mb-10 space-y-3">
        <EditorialSkeleton className="h-3 w-28" />
        <EditorialSkeleton className="h-10 w-40" />
        <EditorialSkeleton className="h-4 w-72" />
      </div>

      <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, col) => (
          <div
            key={col}
            className="rounded-md border border-editorial-neutral-2 bg-editorial-paper"
          >
            <div className="flex items-center justify-between border-b border-editorial-neutral-2 px-6 py-5">
              <EditorialSkeleton className="h-5 w-32" />
              <EditorialSkeleton className="h-3 w-14" />
            </div>
            <div className="divide-y divide-editorial-neutral-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-3.5">
                  <EditorialSkeleton className="h-1.5 w-1.5 rounded-full" />
                  <EditorialSkeleton className="h-4 flex-1" />
                  <EditorialSkeleton className="h-3 w-14" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
