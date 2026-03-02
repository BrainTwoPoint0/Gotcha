import { SkeletonStats, SkeletonCard, SkeletonTable } from '@/app/components/AppSkeleton';

export default function DashboardHomeLoading() {
  return (
    <div>
      <div className="mb-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Stats */}
      <div className="mb-8">
        <SkeletonStats />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="h-6 w-36 bg-gray-200 rounded animate-pulse mb-4" />
        <SkeletonTable rows={5} />
      </div>
    </div>
  );
}
