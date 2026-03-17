import { SkeletonTable } from '@/app/components/AppSkeleton';

export default function BugsLoading() {
  return (
    <div>
      <div className="mb-6">
        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Filter skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-28 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      <SkeletonTable rows={6} />
    </div>
  );
}
