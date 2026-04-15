import { EditorialSkeleton } from '../../../components/editorial/skeleton';

export default function BugDetailLoading() {
  return (
    <div className="editorial">
      <EditorialSkeleton className="mb-6 h-3 w-24" />
      <div className="mb-10 space-y-3">
        <EditorialSkeleton className="h-3 w-40" />
        <EditorialSkeleton className="h-10 w-80 max-w-full" />
        <div className="flex gap-4 pt-1">
          <EditorialSkeleton className="h-3 w-20" />
          <EditorialSkeleton className="h-3 w-16" />
          <EditorialSkeleton className="h-3 w-28" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-md border border-editorial-neutral-2 bg-editorial-paper"
            >
              <div className="border-b border-editorial-neutral-2 px-6 py-5">
                <EditorialSkeleton className="h-3 w-24" />
              </div>
              <div className="space-y-2 px-6 py-5">
                <EditorialSkeleton className="h-3 w-full" />
                <EditorialSkeleton className="h-3 w-full" />
                <EditorialSkeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="rounded-md border border-editorial-neutral-2 bg-editorial-paper"
            >
              <div className="border-b border-editorial-neutral-2 px-6 py-5">
                <EditorialSkeleton className="h-3 w-20" />
              </div>
              <div className="space-y-3 px-6 py-5">
                <EditorialSkeleton className="h-3 w-3/4" />
                <EditorialSkeleton className="h-3 w-2/3" />
                <EditorialSkeleton className="h-3 w-4/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
