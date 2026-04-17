import { EditorialSkeleton } from '../../components/editorial/skeleton';

export default function InsightsLoading() {
  return (
    <div className="editorial">
      <div className="mb-10 space-y-3">
        <EditorialSkeleton className="h-3 w-28" />
        <EditorialSkeleton className="h-10 w-32" />
        <EditorialSkeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <EditorialSkeleton key={i} className="h-64 w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}
