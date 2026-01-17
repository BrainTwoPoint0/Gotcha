import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiKey, apiError } from '@/lib/api-auth';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

// DELETE /api/v1/users/:userId - Delete all user data (GDPR right to erasure)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await params;

    // Validate API key
    const authResult = await validateApiKey(request);
    if (!authResult.success) {
      return apiError(authResult.error.code, authResult.error.message, authResult.error.status);
    }

    const { apiKey } = authResult;

    // Find all responses for this user in the organization's projects
    const projectIds = await prisma.project.findMany({
      where: { organizationId: apiKey.organizationId },
      select: { id: true },
    });

    const projectIdList = projectIds.map((p) => p.id);

    // Count responses to delete
    const responseCount = await prisma.response.count({
      where: {
        projectId: { in: projectIdList },
        endUserId: userId,
      },
    });

    if (responseCount === 0) {
      return apiError('USER_NOT_FOUND', 'No responses found for this user ID', 404);
    }

    // Delete all responses for this user
    await prisma.response.deleteMany({
      where: {
        projectId: { in: projectIdList },
        endUserId: userId,
      },
    });

    return Response.json({
      status: 'deleted',
      userId,
      responsesDeleted: responseCount,
      deletedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('DELETE /api/v1/users/:userId error:', error);
    return apiError('INTERNAL_ERROR', 'An unexpected error occurred', 500);
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
