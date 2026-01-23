import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { isOverProjectLimit, getProjectLimitDisplay } from '@/lib/plan-limits';
import Link from 'next/link';
import { NewProjectForm } from './new-project-form';

export const dynamic = 'force-dynamic';

export default async function NewProjectPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const dbUser = user
    ? await prisma.user.findUnique({
        where: { email: user.email! },
        include: {
          memberships: {
            include: {
              organization: {
                include: {
                  subscription: true,
                  _count: {
                    select: { projects: true },
                  },
                },
              },
            },
          },
        },
      })
    : null;

  const organization = dbUser?.memberships[0]?.organization;
  const subscription = organization?.subscription;
  const plan = subscription?.plan || 'FREE';
  const projectCount = organization?._count?.projects || 0;
  const isAtLimit = isOverProjectLimit(plan, projectCount);

  if (isAtLimit) {
    return (
      <div className="max-w-2xl">
        <div className="mb-8">
          <Link
            href="/dashboard/projects"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Projects
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Project Limit Reached</h1>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-slate-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            You&apos;ve reached your project limit
          </h2>
          <p className="text-gray-600 mb-6">
            The Free plan includes {getProjectLimitDisplay('FREE')} project. Upgrade to Pro for
            unlimited projects.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/dashboard/projects"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Back to Projects
            </Link>
            <Link
              href="/dashboard/settings"
              className="px-6 py-2 bg-slate-700 text-white text-sm font-medium rounded-md hover:bg-slate-800"
            >
              Upgrade to Pro
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <NewProjectForm />;
}
