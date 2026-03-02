'use client';

import Link from 'next/link';
import { SpotlightCard } from '@/app/components/ui/aceternity/spotlight';

interface ProjectCardProps {
  slug: string;
  name: string;
  description: string | null;
  responseCount: number;
  apiKeyCount: number;
  createdAt: string;
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
    <Link href={`/dashboard/projects/${slug}`}>
      <SpotlightCard
        className="p-6 h-full transition-shadow hover:shadow-md"
        spotlightColor="rgba(148, 163, 184, 0.08)"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{name}</h3>
            <p className="text-sm text-gray-500 mt-1">{description || 'No description'}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            {responseCount} responses
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
            {apiKeyCount} keys
          </span>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">Created {createdAt}</p>
        </div>
      </SpotlightCard>
    </Link>
  );
}
