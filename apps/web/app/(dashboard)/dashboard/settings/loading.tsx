import { EditorialSkeleton } from '../../components/editorial/skeleton';

export default function SettingsLoading() {
  return (
    <div className="editorial">
      <div className="mb-10 space-y-3">
        <EditorialSkeleton className="h-3 w-36" />
        <EditorialSkeleton className="h-10 w-32" />
        <EditorialSkeleton className="h-4 w-64" />
      </div>
      <div className="space-y-6">
        {['Profile', 'Workspace', 'Team', 'Subscription'].map((label) => (
          <div
            key={label}
            className="overflow-hidden rounded-md border border-editorial-neutral-2 bg-editorial-paper"
          >
            <div className="border-b border-editorial-neutral-2 px-6 py-5">
              <EditorialSkeleton className="h-5 w-32" />
            </div>
            <div className="space-y-4 px-6 py-6">
              <div className="space-y-2">
                <EditorialSkeleton className="h-3 w-16" />
                <EditorialSkeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <EditorialSkeleton className="h-3 w-20" />
                <EditorialSkeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
