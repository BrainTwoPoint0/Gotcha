import Link from 'next/link';

interface ProjectCardProps {
  slug: string;
  name: string;
  description: string | null;
  responseCount: number;
  apiKeyCount: number;
  createdAt: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function ProjectCard({
  slug,
  name,
  description,
  responseCount,
  apiKeyCount,
  createdAt,
}: ProjectCardProps) {
  return (
    <Link
      href={`/dashboard/projects/${slug}`}
      className="group flex h-full flex-col rounded-md border border-editorial-neutral-2 bg-editorial-paper p-6 transition-all duration-240 ease-page-turn hover:border-editorial-ink/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-[1.25rem] font-normal leading-[1.15] tracking-[-0.01em] text-editorial-ink">
            {name}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-[1.55] text-editorial-neutral-3">
            {description || 'No description'}
          </p>
        </div>
        <span
          aria-hidden="true"
          className="mt-1 text-editorial-neutral-3 transition-all duration-240 ease-page-turn group-hover:translate-x-0.5 group-hover:text-editorial-ink"
        >
          →
        </span>
      </div>

      <div className="mt-auto flex items-center gap-5 pt-6">
        <Stat label="Responses" value={responseCount.toLocaleString()} />
        <Stat label="Keys" value={apiKeyCount.toString()} />
      </div>

      <div className="mt-5 border-t border-editorial-neutral-2 pt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-editorial-neutral-3">
        Created {formatDate(createdAt)}
      </div>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display text-[1.5rem] font-normal leading-none tracking-[-0.01em] text-editorial-ink tabular-nums">
        {value}
      </p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-editorial-neutral-3">
        {label}
      </p>
    </div>
  );
}
