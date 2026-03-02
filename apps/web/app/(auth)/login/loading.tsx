import { Skeleton } from '@/app/components/AppSkeleton';

export default function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo placeholder */}
        <div className="flex flex-col items-center">
          <Skeleton className="h-12 w-12 rounded-full mb-4" />
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Form placeholder */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 space-y-6">
          {/* Email field */}
          <div>
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Password field */}
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Submit button */}
          <Skeleton className="h-10 w-full" />

          {/* Divider */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-px flex-1" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-px flex-1" />
          </div>

          {/* OAuth button */}
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Sign up link */}
        <div className="flex justify-center">
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    </div>
  );
}
