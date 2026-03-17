import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiKey, apiError, getCorsHeaders } from '@/lib/api-auth';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

// DELETE /api/v1/users/:userId - Delete all user data (GDPR right to erasure)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const reqOrigin = request.headers.get('origin');
  try {
    const { userId } = await params;

    // Validate API key
    const authResult = await validateApiKey(request);
    if (!authResult.success) {
      return apiError(
        authResult.error.code,
        authResult.error.message,
        authResult.error.status,
        reqOrigin
      );
    }

    const { apiKey } = authResult;

    // Scope to the API key's project only (not org-wide)
    const responseCount = await prisma.response.count({
      where: {
        projectId: apiKey.projectId,
        endUserId: userId,
      },
    });

    if (responseCount === 0) {
      return apiError('USER_NOT_FOUND', 'No responses found for this user ID', 404, reqOrigin);
    }

    // Anonymize bug tickets linked to this user before deleting responses
    await prisma.bugTicket.updateMany({
      where: {
        projectId: apiKey.projectId,
        endUserId: userId,
      },
      data: {
        endUserId: null,
        endUserMeta: {},
        reporterEmail: null,
        reporterName: null,
      },
    });

    // Delete all responses for this user in this project
    await prisma.response.deleteMany({
      where: {
        projectId: apiKey.projectId,
        endUserId: userId,
      },
    });

    return Response.json(
      {
        status: 'deleted',
        userId,
        responsesDeleted: responseCount,
        deletedAt: new Date().toISOString(),
      },
      { headers: getCorsHeaders(reqOrigin) }
    );
  } catch (error) {
    console.error('DELETE /api/v1/users/:userId error:', error);
    return apiError('INTERNAL_ERROR', 'An unexpected error occurred', 500, reqOrigin);
  }
}

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request.headers.get('origin')),
  });
}
