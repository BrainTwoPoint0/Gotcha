export default function AuthLoading() {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <div className="h-7 w-40 bg-gray-100 rounded animate-pulse" />
        <div className="mt-2 h-4 w-56 bg-gray-100 rounded animate-pulse" />
      </div>
      <div className="space-y-6">
        <div className="h-11 w-full bg-gray-100 rounded-md animate-pulse" />
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-100" />
          <div className="h-3 w-6 bg-gray-100 rounded animate-pulse" />
          <div className="flex-1 h-px bg-gray-100" />
        </div>
        <div className="space-y-4">
          <div>
            <div className="h-4 w-10 bg-gray-100 rounded animate-pulse mb-1.5" />
            <div className="h-11 w-full bg-gray-100 rounded-md animate-pulse" />
          </div>
          <div>
            <div className="h-4 w-16 bg-gray-100 rounded animate-pulse mb-1.5" />
            <div className="h-11 w-full bg-gray-100 rounded-md animate-pulse" />
          </div>
          <div className="h-11 w-full bg-gray-200 rounded-md animate-pulse" />
        </div>
      </div>
    </div>
  );
}
