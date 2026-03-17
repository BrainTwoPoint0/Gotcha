import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonText } from '@/app/components/AppSkeleton';

export default function BugDetailLoading() {
  return (
    <div>
      {/* Back link */}
      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-4" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <Skeleton className="h-7 w-3/4 mb-3" />
            <div className="flex gap-2 mb-4">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <SkeletonText lines={4} />
          </div>

          {/* Notes skeleton */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <Skeleton className="h-5 w-20 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded" />
              <Skeleton className="h-16 w-full rounded" />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <Skeleton className="h-4 w-16 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded" />
            <Skeleton className="h-10 w-full rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
