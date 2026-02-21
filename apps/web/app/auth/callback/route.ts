import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWelcomeEmail } from '@/lib/emails/send';
import { sanitizeRedirectPath } from '@/lib/auth-redirect';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = sanitizeRedirectPath(searchParams.get('next'));

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get the user to create in Prisma
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        // Check if user exists in Prisma, create if not
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!existingUser) {
          // Create user in Prisma
          const newUser = await prisma.user.create({
            data: {
              email: user.email,
              name: user.user_metadata?.full_name || user.user_metadata?.name || null,
              avatarUrl: user.user_metadata?.avatar_url || null,
            },
          });

          // Create default organization for new user
          const orgSlug = user.email
            .split('@')[0]
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-');
          await prisma.organization.create({
            data: {
              name: `${newUser.name || 'My'}'s Organization`,
              slug: `${orgSlug}-${Date.now()}`,
              members: {
                create: {
                  userId: newUser.id,
                  role: 'OWNER',
                },
              },
              subscription: {
                create: {
                  plan: 'FREE',
                  status: 'ACTIVE',
                },
              },
            },
          });

          // Send welcome email (fire-and-forget)
          sendWelcomeEmail(newUser).catch(console.error);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
