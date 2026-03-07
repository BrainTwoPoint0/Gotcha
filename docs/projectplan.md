# Feature 9: Workspace Switcher

## Plan

Replace the hardcoded `memberships[0]` assumption with a workspace switcher. Users who belong to multiple workspaces can switch between them via a dropdown in the top nav.

## Todo

### Phase 1: Helper + Cookie
- [x] Create `lib/auth.ts` with `getActiveOrganization(user)` helper
- [x] Reads `gotcha_org` cookie for selected org ID
- [x] Falls back to `memberships[0]` if no cookie or invalid
- [x] Returns `{ organization, membership, isPro }`
- [x] Create `POST /api/organization/switch` to set the cookie

### Phase 2: Replace memberships[0] in API routes (~20 files)
- [x] All API routes updated to use `getActiveOrganization()`

### Phase 3: Replace memberships[0] in dashboard pages (~12 files)
- [x] All dashboard pages updated to use `getActiveOrganization()`

### Phase 4: Workspace Switcher UI
- [x] Create workspace-switcher.tsx client component
- [x] Add to top nav in layout.tsx (Gotcha / WorkspaceName dropdown)
- [x] Only shows dropdown if user has multiple workspaces
- [x] Calls `/api/organization/switch` on selection, then reloads

### Phase 5: Verification
- [x] `npx tsc --noEmit` — no new type errors (all 6 errors are pre-existing test files)
- [x] All 36 `memberships[0]` occurrences replaced with `getActiveOrganization()`
- [ ] Manual: switching workspaces works
- [ ] Manual: all pages respect the selected workspace

## Review

**What was built:**
- `lib/auth.ts` — shared helper that reads `gotcha_org` cookie to determine active workspace, with fallback to first membership
- `POST /api/organization/switch` — sets the org cookie securely (httpOnly, sameSite, 1yr expiry)
- `workspace-switcher.tsx` — dropdown in top nav showing all workspaces with role badges, check icon on active
- Layout updated: shows `Gotcha / WorkspaceName` with dropdown arrow when user has 2+ workspaces
- All 36 occurrences of `memberships[0]` replaced across 32 files

**How it works:**
1. User belongs to multiple workspaces via `OrganizationMember`
2. Active workspace stored in `gotcha_org` cookie
3. Every page/API reads the cookie via `getActiveOrganization()`
4. Dropdown in top nav lets user switch — sets cookie and reloads
5. Single workspace users just see their workspace name (no dropdown)
