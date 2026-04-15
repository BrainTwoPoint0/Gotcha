import { EditorialSkeleton } from '../../../components/editorial/skeleton';

export default function ProjectDetailLoading() {
  return (
    <div className="editorial">
      <EditorialSkeleton className="mb-6 h-3 w-28" />

      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <EditorialSkeleton className="h-3 w-40" />
          <EditorialSkeleton className="h-10 w-56" />
          <EditorialSkeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <EditorialSkeleton className="h-10 w-28 rounded-md" />
          <EditorialSkeleton className="h-10 w-28 rounded-md" />
        </div>
      </div>

      <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-md border border-editorial-neutral-2 bg-editorial-paper p-6"
          >
            <EditorialSkeleton className="h-3 w-16" />
            <EditorialSkeleton className="mt-4 h-8 w-20" />
            <EditorialSkeleton className="mt-3 h-3 w-14" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-md border border-editorial-neutral-2 bg-editorial-paper"
          >
            <div className="border-b border-editorial-neutral-2 px-6 py-5">
              <EditorialSkeleton className="h-5 w-32" />
            </div>
            <div className="space-y-3 px-6 py-5">
              <EditorialSkeleton className="h-16 w-full" />
              <EditorialSkeleton className="h-3 w-full" />
              <EditorialSkeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
