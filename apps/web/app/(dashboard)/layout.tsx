import { redirect } from 'next/navigation';
import { Footer } from '../components/Footer';
import { WorkspaceSwitcher } from './workspace-switcher';
import { GlobalBugReporter } from './global-bug-reporter';
import { EditorialTopNav, type EditorialNavLink } from './components/editorial/top-nav';
import { EditorialMobileDrawer } from './components/editorial/mobile-drawer';
import { getAuthUser, getActiveOrganization } from '@/lib/auth';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();

  if (!user) {
    redirect('/login');
  }

  if (!user.email) {
    redirect('/login');
  }

  const activeOrg = await getActiveOrganization(user.email);
  const workspaces = activeOrg?.workspaces ?? [];
  const isPro = activeOrg?.isPro ?? false;

  // Working surfaces lead (Overview → Projects → Responses → Analytics →
  // Segments → Bugs), Settings trails at the end where account-level
  // admin tends to live in editorial product navigation.
  const links: EditorialNavLink[] = [
    { href: '/dashboard', label: 'Overview' },
    { href: '/dashboard/projects', label: 'Projects' },
    { href: '/dashboard/responses', label: 'Responses' },
    { href: '/dashboard/analytics', label: 'Analytics', proLocked: !isPro },
    { href: '/dashboard/analytics/segments', label: 'Segments', proLocked: !isPro },
    { href: '/dashboard/bugs', label: 'Bugs', proLocked: !isPro },
    { href: '/dashboard/settings', label: 'Settings' },
  ];

  const workspaceNode =
    activeOrg && workspaces.length > 0 ? (
      <WorkspaceSwitcher workspaces={workspaces} activeId={activeOrg.organization.id} />
    ) : null;

  const desktopRight = (
    <>
      {/* Email hides between lg (1024) and xl (1280). Below lg the whole
          right slot goes to the drawer; between lg and xl the 7 nav links
          need all available space, so we keep only Sign out. Above xl the
          email returns as the account identifier. */}
      <span className="hidden truncate font-mono text-[11px] uppercase tracking-[0.14em] text-editorial-neutral-3 xl:inline">
        {user.email}
      </span>
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="rounded-md px-3 py-1.5 text-[13px] text-editorial-neutral-3 transition-colors hover:bg-editorial-ink/[0.04] hover:text-editorial-ink"
        >
          Sign out
        </button>
      </form>
    </>
  );

  const mobileDrawerBottom = (
    <div className="space-y-3">
      {workspaceNode && <div className="text-[13px] text-editorial-neutral-3">{workspaceNode}</div>}
      <p className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-editorial-neutral-3">
        {user.email}
      </p>
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="w-full rounded-md border border-editorial-neutral-2 bg-editorial-paper px-3 py-2 text-[13px] text-editorial-ink transition-colors hover:bg-editorial-ink/[0.03]"
        >
          Sign out
        </button>
      </form>
    </div>
  );

  return (
    <div className="editorial min-h-screen bg-editorial-paper text-editorial-ink">
      <EditorialTopNav
        links={links}
        leftSlot={workspaceNode}
        rightSlot={desktopRight}
        mobileMenuSlot={<EditorialMobileDrawer links={links} bottomSlot={mobileDrawerBottom} />}
      />

      <main className="flex min-h-[calc(100vh-4rem)] flex-col">
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          {children}
        </div>
        <Footer />
      </main>

      <GlobalBugReporter userEmail={user.email ?? undefined} plan={isPro ? 'PRO' : 'FREE'} />
    </div>
  );
}
