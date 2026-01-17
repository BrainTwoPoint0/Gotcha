import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { ResponsesFilter } from './responses-filter';
import { Pagination } from './pagination';

export const dynamic = 'force-dynamic';

const LIMIT = 20;

interface ResponseItem {
  id: string;
  mode: string;
  content: string | null;
  title: string | null;
  rating: number | null;
  vote: string | null;
  elementIdRaw: string;
  createdAt: Date;
  project: { name: string; slug: string };
}

interface PageProps {
  searchParams: Promise<{ startDate?: string; endDate?: string; page?: string }>;
}

export default async function ResponsesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const dbUser = user ? await prisma.user.findUnique({
    where: { email: user.email! },
    include: {
      memberships: {
        include: { organization: true }
      }
    }
  }) : null;

  const organization = dbUser?.memberships[0]?.organization;

  // Parse pagination
  const page = Math.max(1, parseInt(params.page || '1', 10));

  // Parse date filters
  const startDate = params.startDate ? new Date(params.startDate) : undefined;
  const endDate = params.endDate ? new Date(`${params.endDate}T23:59:59.999Z`) : undefined;

  // Build where clause
  const where = {
    project: {
      organizationId: organization?.id
    },
    ...(startDate || endDate ? {
      createdAt: {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      }
    } : {})
  };

  // Get total count for pagination
  const total = organization ? await prisma.response.count({ where }) : 0;
  const totalPages = Math.ceil(total / LIMIT);

  // Get paginated responses
  const responses: ResponseItem[] = organization ? await prisma.response.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * LIMIT,
    take: LIMIT,
    include: {
      project: {
        select: { name: true, slug: true }
      }
    }
  }) : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Responses</h1>
        <p className="text-gray-600">View feedback from all your projects</p>
      </div>

      <ResponsesFilter />

      {responses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No responses found</h3>
          <p className="mt-2 text-gray-500">
            {params.startDate || params.endDate
              ? 'Try adjusting your date filters.'
              : 'Responses from your SDK integrations will appear here.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 whitespace-nowrap">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Response
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Element
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {responses.map((response) => (
                  <tr key={response.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {response.rating && (
                          <span className="text-yellow-500 text-sm">
                            {'★'.repeat(response.rating)}
                          </span>
                        )}
                        {response.vote && (
                          <span className={response.vote === 'UP' ? 'text-green-600' : 'text-red-600'}>
                            {response.vote === 'UP' ? '👍' : '👎'}
                          </span>
                        )}
                        <span className="text-sm text-gray-900 truncate max-w-xs">
                          {response.content || response.title || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {response.project.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getModeStyle(response.mode)}`}>
                        {response.mode.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {response.elementIdRaw}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(response.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalPages={totalPages} total={total} />
        </div>
      )}
    </div>
  );
}

function getModeStyle(mode: string): string {
  const styles: Record<string, string> = {
    FEEDBACK: 'bg-slate-100 text-slate-800',
    VOTE: 'bg-green-100 text-green-800',
    POLL: 'bg-purple-100 text-purple-800',
    FEATURE_REQUEST: 'bg-orange-100 text-orange-800',
    AB: 'bg-pink-100 text-pink-800',
  };
  return styles[mode] || 'bg-gray-100 text-gray-800';
}
