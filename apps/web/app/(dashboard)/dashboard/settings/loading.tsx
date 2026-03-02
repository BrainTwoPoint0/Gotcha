import { Skeleton, SkeletonText } from '@/app/components/AppSkeleton';

export default function SettingsLoading() {
  return (
    <div>
      <div className="mb-6">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <Skeleton className="h-6 w-24 mb-4" />
          <div className="space-y-4">
            <div>
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-10 w-full max-w-md" />
            </div>
            <div>
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-10 w-full max-w-md" />
            </div>
          </div>
        </div>

        {/* Organization Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-4">
            <div>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-10 w-full max-w-md" />
            </div>
          </div>
        </div>

        {/* Subscription Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <Skeleton className="h-6 w-28 mb-4" />
          <div className="flex gap-4 mb-6">
            <Skeleton className="h-24 w-48" />
            <Skeleton className="h-24 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  );
}
