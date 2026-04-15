import { EditorialSkeleton } from '../../components/editorial/skeleton';

export default function ProjectsLoading() {
  return (
    <div className="editorial">
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <EditorialSkeleton className="h-3 w-16" />
          <EditorialSkeleton className="h-10 w-40" />
          <EditorialSkeleton className="h-4 w-96 max-w-full" />
        </div>
        <EditorialSkeleton className="h-10 w-36 rounded-md" />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-6 rounded-md border border-editorial-neutral-2 bg-editorial-paper p-6"
          >
            <div className="space-y-2">
              <EditorialSkeleton className="h-5 w-32" />
              <EditorialSkeleton className="h-3 w-full" />
              <EditorialSkeleton className="h-3 w-3/4" />
            </div>
            <div className="flex items-center gap-5">
              <div>
                <EditorialSkeleton className="h-6 w-10" />
                <EditorialSkeleton className="mt-1 h-2 w-14" />
              </div>
              <div>
                <EditorialSkeleton className="h-6 w-8" />
                <EditorialSkeleton className="mt-1 h-2 w-10" />
              </div>
            </div>
            <EditorialSkeleton className="mt-auto h-2 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}
