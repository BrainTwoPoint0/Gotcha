import { SkeletonStats, SkeletonChart } from '@/app/components/AppSkeleton';

export default function SegmentsLoading() {
  return (
    <div>
      <div className="mb-6">
        <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-56 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Filter skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      <div className="mb-8">
        <SkeletonStats />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart />
        <SkeletonChart />
      </div>
    </div>
  );
}
