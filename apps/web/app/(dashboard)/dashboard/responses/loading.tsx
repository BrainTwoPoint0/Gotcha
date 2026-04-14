export default function ResponsesLoading() {
  return (
    <div className="editorial">
      <div className="mb-8 flex flex-col gap-3">
        <div className="h-9 w-48 rounded-sm bg-editorial-neutral-2/60" />
        <div className="h-4 w-72 rounded-sm bg-editorial-neutral-2/40" />
      </div>

      <div className="mb-8 flex flex-wrap gap-3 border-t border-editorial-neutral-2 pt-6">
        {[140, 140, 200, 140, 120, 120].map((w, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="h-3 w-12 rounded-sm bg-editorial-neutral-2/60" />
            <div className="h-10 rounded-md bg-editorial-neutral-2/40" style={{ width: w }} />
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-md border border-editorial-neutral-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={`flex items-center gap-6 px-4 py-4 ${i !== 7 ? 'border-b border-editorial-neutral-2' : ''}`}
          >
            <div className="h-4 flex-1 rounded-sm bg-editorial-neutral-2/40" />
            <div className="hidden h-4 w-28 rounded-sm bg-editorial-neutral-2/40 sm:block" />
            <div className="hidden h-6 w-20 rounded-md bg-editorial-neutral-2/40 sm:block" />
            <div className="h-6 w-24 rounded-md bg-editorial-neutral-2/40" />
            <div className="hidden h-4 w-28 rounded-sm bg-editorial-neutral-2/40 md:block" />
            <div className="hidden h-4 w-20 rounded-sm bg-editorial-neutral-2/40 sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
