import { EditorialSkeleton } from '../../../components/editorial/skeleton';

export default function NewProjectLoading() {
  return (
    <div className="editorial max-w-2xl">
      <EditorialSkeleton className="mb-6 h-3 w-28" />
      <div className="mb-10 space-y-3">
        <EditorialSkeleton className="h-3 w-24" />
        <EditorialSkeleton className="h-10 w-56" />
        <EditorialSkeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="rounded-md border border-editorial-neutral-2 bg-editorial-paper p-8">
        <div className="space-y-5">
          <div className="space-y-2">
            <EditorialSkeleton className="h-3 w-16" />
            <EditorialSkeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <EditorialSkeleton className="h-3 w-20" />
            <EditorialSkeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <EditorialSkeleton className="h-3 w-24" />
            <EditorialSkeleton className="h-20 w-full" />
          </div>
          <EditorialSkeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>
    </div>
  );
}
