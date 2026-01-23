import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiKey, apiError } from '@/lib/api-auth';

// Auto-discover metadata fields from endUserMeta JSON
export async function GET(request: NextRequest) {
  try {
    // Validate API key
    const authResult = await validateApiKey(request);
    if (!authResult.success) {
      return apiError(authResult.error.code, authResult.error.message, authResult.error.status);
    }

    const { apiKey } = authResult;

    // Get recent responses with endUserMeta
    const responses = await prisma.response.findMany({
      where: {
        projectId: apiKey.projectId,
        NOT: {
          endUserMeta: { equals: {} },
        },
      },
      select: {
        endUserMeta: true,
      },
      take: 1000, // Sample last 1000 responses
      orderBy: { createdAt: 'desc' },
    });

    // Discover unique fields and infer types
    const fieldStats: Record<string, { count: number; types: Set<string>; samples: unknown[] }> =
      {};

    responses.forEach((r) => {
      const meta = r.endUserMeta as Record<string, unknown>;
      if (!meta || typeof meta !== 'object') return;

      Object.entries(meta).forEach(([key, value]) => {
        // Skip the 'id' field as it's standard
        if (key === 'id') return;

        if (!fieldStats[key]) {
          fieldStats[key] = { count: 0, types: new Set(), samples: [] };
        }

        fieldStats[key].count++;

        // Infer type
        if (value === null) {
          fieldStats[key].types.add('null');
        } else if (typeof value === 'boolean') {
          fieldStats[key].types.add('boolean');
        } else if (typeof value === 'number') {
          fieldStats[key].types.add('number');
        } else if (typeof value === 'string') {
          fieldStats[key].types.add('string');
        }

        // Keep some sample values
        if (fieldStats[key].samples.length < 5 && value !== null) {
          if (!fieldStats[key].samples.includes(value)) {
            fieldStats[key].samples.push(value);
          }
        }
      });
    });

    // Get configured fields for this project
    const configuredFields = await prisma.metadataField.findMany({
      where: { projectId: apiKey.projectId },
    });

    const configuredMap = new Map(configuredFields.map((f) => [f.fieldKey, f]));

    // Build response
    const fields = Object.entries(fieldStats).map(([key, stats]) => {
      const configured = configuredMap.get(key);

      // Determine dominant type
      let inferredType = 'string';
      if (stats.types.has('number') && !stats.types.has('string')) {
        inferredType = 'number';
      } else if (stats.types.has('boolean') && stats.types.size <= 2) {
        inferredType = 'boolean';
      }

      return {
        key,
        displayName: configured?.displayName || key,
        fieldType: configured?.fieldType || inferredType,
        isActive: configured?.isActive ?? true,
        isConfigured: !!configured,
        occurrences: stats.count,
        sampleValues: stats.samples.slice(0, 5),
      };
    });

    // Sort by occurrences (most common first)
    fields.sort((a, b) => b.occurrences - a.occurrences);

    return Response.json({
      fields,
      totalResponses: responses.length,
    });
  } catch (error) {
    console.error('GET /api/v1/metadata/fields error:', error);
    return apiError('INTERNAL_ERROR', 'An unexpected error occurred', 500);
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
