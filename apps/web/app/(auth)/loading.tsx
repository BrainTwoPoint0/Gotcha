import { EditorialSkeleton } from '../(dashboard)/components/editorial/skeleton';

export default function AuthLoading() {
  return (
    <div className="editorial w-full max-w-sm">
      <EditorialSkeleton className="mb-10 h-3 w-28" />
      <div className="space-y-3">
        <EditorialSkeleton className="h-10 w-32" />
        <EditorialSkeleton className="h-4 w-48" />
      </div>
      <div className="mt-10 space-y-5">
        <EditorialSkeleton className="h-11 w-full rounded-md" />
        <div className="flex items-center gap-4">
          <span className="h-px flex-1 bg-editorial-neutral-2" aria-hidden="true" />
          <EditorialSkeleton className="h-3 w-6" />
          <span className="h-px flex-1 bg-editorial-neutral-2" aria-hidden="true" />
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <EditorialSkeleton className="h-3 w-12" />
            <EditorialSkeleton className="h-11 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <EditorialSkeleton className="h-3 w-16" />
            <EditorialSkeleton className="h-11 w-full rounded-md" />
          </div>
          <EditorialSkeleton className="h-11 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}
