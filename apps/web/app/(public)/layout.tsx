/**
 * Public route group — pages reachable without authentication.
 *
 * Currently houses /roadmap/[slug]. Intentionally chrome-free:
 * - No nav (the customer's project is the brand, not Gotcha)
 * - No marketing footer
 * - No third-party scripts (matches the privacy posture sold on the landing
 *   page — "no cookies, no third-party fonts, no PostHog")
 * - Inherits editorial fonts via the root layout's CSS variables
 *
 * Wraps children in the `.editorial` opt-in class so the same tokens used
 * across the dashboard and marketing pages apply here.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="editorial min-h-screen bg-editorial-paper text-editorial-ink">{children}</div>
  );
}
