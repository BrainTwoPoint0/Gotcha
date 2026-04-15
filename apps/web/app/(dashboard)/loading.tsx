import { EditorialSkeleton } from './components/editorial/skeleton';

export default function DashboardRouteLoading() {
  return (
    <div className="editorial">
      <div className="mb-10 space-y-3">
        <EditorialSkeleton className="h-3 w-24" />
        <EditorialSkeleton className="h-10 w-56" />
        <EditorialSkeleton className="h-4 w-80" />
      </div>
      <EditorialSkeleton className="h-72 w-full rounded-md" />
    </div>
  );
}
