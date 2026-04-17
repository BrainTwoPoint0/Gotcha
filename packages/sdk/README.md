# gotcha-feedback

A developer-first contextual feedback SDK for React. Add a feedback button to any component with a single line of code.

## Installation

```bash
npm install gotcha-feedback
# or
yarn add gotcha-feedback
# or
pnpm add gotcha-feedback
```

## Quick Start

```tsx
import { GotchaProvider, Gotcha } from 'gotcha-feedback';

function App() {
  return (
    <GotchaProvider apiKey="your-api-key">
      <YourApp />
    </GotchaProvider>
  );
}

function FeatureCard() {
  return (
    <div style={{ position: 'relative' }}>
      <h2>New Feature</h2>
      <p>Check out this awesome new feature!</p>
      <Gotcha elementId="feature-card" />
    </div>
  );
}
```

## Features

- **Feedback Mode** - Star rating + text input
- **Vote Mode** - Thumbs up/down with customizable labels
- **Poll Mode** - Custom options (single or multi-select)
- **NPS Mode** - 0-10 Net Promoter Score with optional follow-up
- **Score Component** - Embeddable `<GotchaScore />` to display aggregate ratings inline
- **Bug Flagging** - Let users flag feedback as issues/bugs with a single toggle
- **User Segmentation** - Analyze feedback by custom user attributes
- **Edit Support** - Users can update their previous submissions
- **Programmatic Trigger** - Open/close the widget from code with `useGotchaTrigger`
- **Follow-up Questions** - Ask a follow-up after low ratings or negative votes
- **Trigger Conditions** - Show widget after time delay, scroll depth, or visit count
- **Screenshot Capture** - Users can attach screenshots when reporting bugs
- **Offline Support** - Submissions queue in localStorage when offline, flush on reconnect
- **Context Enrichment** - Viewport, timezone, language, and recent JS errors auto-attached
- **Visibility Control** - Hide widget for N days after submission, reset onePerUser after N days
- **Customizable** - Themes, sizes, positions
- **Accessible** - Full keyboard navigation and screen reader support
- **Animated** - Smooth enter/exit animations with CSS transitions

## Content Security Policy

The SDK injects its stylesheet as an inline `<style>` tag and embeds its
display font as a `data:` URL inside that stylesheet. If your site runs
a strict CSP, you will need the following directives:

- `style-src 'unsafe-inline'` (or a matching nonce) — the SDK injects
  its own stylesheet at runtime.
- `font-src data:` (or `font-src 'self' data:`) — the branded serif font
  is embedded as a base64 data URL so the SDK makes **zero** third-party
  font requests.

The SDK makes no other external requests for fonts, analytics, or
tracking. See `LICENSE.FRAUNCES.txt` for the bundled Fraunces subset
license (OFL 1.1).

## Props

### GotchaProvider

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiKey` | `string` | Required | Your Gotcha API key |
| `baseUrl` | `string` | `https://gotcha.cx/api/v1` | Override API endpoint |
| `debug` | `boolean` | `false` | Enable debug logging |
| `disabled` | `boolean` | `false` | Disable all Gotcha buttons |
| `defaultUser` | `object` | `{}` | Default user metadata |

### Gotcha

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `elementId` | `string` | Required | Unique identifier for this element |
| `mode` | `'feedback' \| 'vote' \| 'poll' \| 'nps'` | `'feedback'` | Feedback mode |
| `position` | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left' \| 'inline'` | `'top-right'` | Button position |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'light'` | Color theme |
| `showOnHover` | `boolean` | `true` | Only show on hover |
| `showText` | `boolean` | `true` | Show the text input in feedback mode |
| `showRating` | `boolean` | `true` | Show the star rating in feedback mode |
| `promptText` | `string` | Mode-specific | Custom prompt text |
| `voteLabels` | `{ up: string, down: string }` | `{ up: 'Like', down: 'Dislike' }` | Custom vote button labels |
| `options` | `string[]` | - | Poll options (2-6 items, required for poll mode) |
| `allowMultiple` | `boolean` | `false` | Allow selecting multiple poll options |
| `npsQuestion` | `string` | `'How likely are you to recommend us?'` | Custom NPS question |
| `npsFollowUp` | `boolean` | `true` | Show follow-up textarea after NPS score |
| `npsFollowUpPlaceholder` | `string` | - | Placeholder for NPS follow-up textarea |
| `npsLowLabel` | `string` | `'Not likely'` | Label for low end of NPS scale |
| `npsHighLabel` | `string` | `'Very likely'` | Label for high end of NPS scale |
| `enableBugFlag` | `boolean` | `false` | Show "Report an issue" toggle in feedback form |
| `bugFlagLabel` | `string` | `'Report an issue'` | Custom label for the bug flag toggle |
| `enableScreenshot` | `boolean` | `false` | Enable screenshot capture when bug flag is toggled (requires `enableBugFlag`) |
| `onePerUser` | `boolean` | `false` | Show edit mode instead of new form when user has existing response |
| `cooldownDays` | `number` | - | Allow new submission after N days (requires `onePerUser`) |
| `hideAfterSubmitDays` | `number` | - | Hide widget for N days after submission (localStorage) |
| `showAfterSeconds` | `number` | - | Delay showing widget by N seconds |
| `showAfterScrollPercent` | `number` | - | Show widget after scrolling past N% (0-100) |
| `showAfterVisits` | `number` | - | Show widget after N page visits (localStorage) |
| `followUp` | `object` | - | Show follow-up question after low rating or negative vote |
| `followUp.ratingThreshold` | `number` | - | Ratings at or below this trigger the follow-up |
| `followUp.onNegativeVote` | `boolean` | - | Trigger follow-up on thumbs down |
| `followUp.promptText` | `string` | Required | The follow-up question text |
| `followUp.placeholder` | `string` | `'Tell us more...'` | Placeholder for follow-up textarea |
| `user` | `object` | - | User metadata for segmentation |
| `onSubmit` | `function` | - | Callback after submission |
| `onOpen` | `function` | - | Callback when modal opens |
| `onClose` | `function` | - | Callback when modal closes |

## Examples

### Inline Position

```tsx
<h2>
  Feature Title
  <Gotcha elementId="title" position="inline" size="sm" showOnHover={false} />
</h2>
```

### Vote Mode

```tsx
<Gotcha
  elementId="pricing-feedback"
  mode="vote"
  promptText="Is this pricing fair?"
/>
```

### Vote Mode with Custom Labels

```tsx
<Gotcha
  elementId="ship-feature"
  mode="vote"
  voteLabels={{ up: "Yes", down: "No" }}
  promptText="Should we ship this feature?"
/>
```

### Poll Mode

```tsx
<Gotcha
  elementId="priority-poll"
  mode="poll"
  options={["Yes", "No", "Maybe"]}
  promptText="Should we ship this feature?"
/>
```

### Poll Mode (Multi-Select)

```tsx
<Gotcha
  elementId="feature-priority"
  mode="poll"
  options={["Analytics", "Segments", "Exports", "API"]}
  allowMultiple
  promptText="Which features matter most?"
/>
```

### NPS Mode

```tsx
<Gotcha
  elementId="nps-survey"
  mode="nps"
  npsQuestion="How likely are you to recommend us?"
  npsLowLabel="Not likely"
  npsHighLabel="Very likely"
/>
```

### Bug Flagging

Add a "Report an issue" toggle to any feedback form. When toggled on, the submission is automatically flagged as a bug and creates a ticket in your dashboard.

```tsx
<Gotcha
  elementId="checkout"
  mode="feedback"
  enableBugFlag
/>
```

```tsx
// Custom label for non-technical users
<Gotcha
  elementId="portal"
  mode="feedback"
  enableBugFlag
  bugFlagLabel="Something isn't working"
/>
```

### Screenshot Capture

When bug flagging is enabled, you can also let users capture and attach a screenshot. Tries `html2canvas` first (install as optional peer dep), falls back to the native Screen Capture API.

```tsx
<Gotcha
  elementId="checkout"
  mode="feedback"
  enableBugFlag
  enableScreenshot
/>
```

### Follow-up Questions

Ask a follow-up question when users give a low rating or negative vote. The follow-up updates the original response.

```tsx
<Gotcha
  elementId="feature"
  mode="feedback"
  followUp={{
    ratingThreshold: 2,          // Ratings 1-2 trigger follow-up
    promptText: "What could we improve?",
    placeholder: "Tell us more...",
  }}
/>
```

```tsx
// Follow-up on negative vote
<Gotcha
  elementId="article"
  mode="vote"
  followUp={{
    onNegativeVote: true,
    promptText: "What went wrong?",
  }}
/>
```

### Trigger Conditions

Control when the widget appears based on user engagement. All specified conditions must be met (AND logic).

```tsx
// Show after 5 seconds on page
<Gotcha elementId="onboarding" showAfterSeconds={5} />

// Show after scrolling 50%
<Gotcha elementId="article-end" showAfterScrollPercent={50} />

// Show after 3 visits
<Gotcha elementId="feature" showAfterVisits={3} />

// Combine: show after 10 seconds AND 3 visits
<Gotcha elementId="power-user" showAfterSeconds={10} showAfterVisits={3} />
```

### Visibility Control

Hide the widget for a period after submission, or allow re-submission after a cooldown.

```tsx
// Hide widget for 7 days after submission
<Gotcha elementId="nps" hideAfterSubmitDays={7} />

// One response per user, but allow new submission after 30 days
<Gotcha
  elementId="quarterly-survey"
  onePerUser
  cooldownDays={30}
  user={{ id: currentUser.id }}
/>
```

### Feedback Field Options

By default, feedback mode shows both a star rating and a text input. Use `showText` and `showRating` to control which fields appear.

```tsx
// Text only (no star rating)
<Gotcha
  elementId="text-only"
  showRating={false}
/>
```

```tsx
// Rating only (no text input)
<Gotcha
  elementId="rating-only"
  showText={false}
/>
```

```tsx
// Both fields (default behavior)
<Gotcha
  elementId="full-feedback"
  showText={true}
  showRating={true}
/>
```

### Dark Theme

```tsx
<Gotcha
  elementId="dark-card"
  theme="dark"
/>
```

### With User Data

Pass user metadata for segmentation and analytics. When a `user.id` is provided, users can also edit their previous submissions.

```tsx
// Set default user data at the provider level
<GotchaProvider
  apiKey="your-api-key"
  defaultUser={{ plan: 'pro', role: 'admin' }}
>
  <App />
</GotchaProvider>
```

```tsx
// Pass dynamic user data from your app
<Gotcha
  elementId="feature-card"
  user={{
    id: currentUser.id,           // Required for edit functionality
    email: currentUser.email,
    plan: currentUser.subscription,
    age: currentUser.age,
    country: currentUser.country,
    company: currentUser.company
  }}
/>
```

```tsx
// Or capture device/browser info
<Gotcha
  elementId="checkout"
  user={{
    id: user.id,
    deviceType: isMobile ? 'mobile' : 'desktop',
    browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other',
    locale: navigator.language
  }}
/>
```

Pass any attributes relevant to your use case. Supported value types: `string`, `number`, `boolean`, or `null`.

### Custom Callbacks

```tsx
<Gotcha
  elementId="feature"
  onSubmit={(response) => {
    console.log('Feedback submitted:', response);
    analytics.track('feedback_submitted', { elementId: 'feature' });
  }}
  onError={(error) => {
    console.error('Feedback error:', error);
  }}
/>
```

## Hooks

### useGotchaTrigger

Open or close a specific widget programmatically. The corresponding `<Gotcha>` component must be mounted.

```tsx
import { useGotchaTrigger } from 'gotcha-feedback';

function ErrorBoundary({ children }) {
  const { open } = useGotchaTrigger('error-feedback');

  const handleError = () => {
    open(); // Opens the feedback modal for "error-feedback"
  };

  return <ErrorHandler onError={handleError}>{children}</ErrorHandler>;
}

// The widget must be rendered somewhere in the tree
<Gotcha elementId="error-feedback" mode="feedback" promptText="What happened?" />
```

Returns `{ open, close, isOpen }`.

### useGotcha

Access the Gotcha context for programmatic control:

```tsx
import { useGotcha } from 'gotcha-feedback';

function MyComponent() {
  const { submitFeedback, openModal, closeModal } = useGotcha();

  const handleCustomSubmit = async () => {
    await submitFeedback({
      elementId: 'custom',
      mode: 'feedback',
      rating: 5,
      content: 'Great feature!',
    });
  };

  return <button onClick={handleCustomSubmit}>Submit Feedback</button>;
}
```

Returns `{ client, disabled, defaultUser, debug, submitFeedback, openModal, closeModal, activeModalId }`.

## User Metadata & Segmentation

When you pass custom attributes in the `user` prop, Gotcha automatically tracks them and enables segmentation in your dashboard.

### How It Works

1. **Pass user attributes** when rendering the Gotcha component
2. **View segmented analytics** in your dashboard under Analytics > Segments
3. **Filter and compare** feedback by user attributes (plan, age, location, etc.)

### Example Use Cases

```tsx
// Segment by subscription plan
<Gotcha elementId="pricing" user={{ id: user.id, plan: user.plan }} />
// → Compare how free vs. pro users feel about pricing

// Segment by device type
<Gotcha elementId="checkout" user={{ id: user.id, device: isMobile ? 'mobile' : 'desktop' }} />
// → See if mobile users have different pain points

// Segment by country
<Gotcha elementId="shipping" user={{ id: user.id, country: user.country }} />
// → Understand regional differences in feedback

// Segment by user tenure
<Gotcha elementId="dashboard" user={{ id: user.id, accountAge: user.daysActive > 30 ? 'established' : 'new' }} />
// → Compare new user vs. power user sentiment
```

In your dashboard under Analytics > Segments, you can group responses by any of these attributes.

## Edit Previous Submissions

When you provide a `user.id`, users can update their previous feedback instead of creating duplicates.

### How It Works

1. User submits feedback for an element
2. User returns later and opens the same feedback modal
3. Their previous response is automatically loaded
4. They can modify and re-submit to update their feedback

```tsx
<Gotcha
  elementId="feature-card"
  user={{ id: 'user_123' }}  // Required for edit functionality
/>
```

The modal will show "Update" instead of "Submit" when editing, and previous values will be pre-filled.

## GotchaScore Component

Display aggregate feedback scores inline — star ratings, vote percentages, or raw numbers.

```tsx
import { GotchaScore } from 'gotcha-feedback';

// Star rating display
<GotchaScore elementId="feature-card" variant="stars" />

// Compact pill (star + number)
<GotchaScore elementId="feature-card" variant="compact" />

// Vote percentage bar
<GotchaScore elementId="pricing" variant="votes" />

// Plain number
<GotchaScore elementId="feature-card" variant="number" />
```

### GotchaScore Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `elementId` | `string` | Required | Element to show score for |
| `variant` | `'stars' \| 'number' \| 'compact' \| 'votes'` | `'stars'` | Display variant |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | Color theme |
| `refreshInterval` | `number` | - | Auto-refresh interval in ms |

## Offline Support

Submissions are automatically queued in localStorage when the user is offline. When connectivity returns, queued items are flushed automatically. A subtle indicator appears on the widget button when items are queued. No configuration needed — this works out of the box.

## Context Enrichment

Every submission automatically includes enriched context beyond the page URL and user agent:

- **Viewport size** (width x height)
- **Language** and **timezone**
- **Screen resolution**
- **Recent JS errors** (last 10 uncaught errors and unhandled rejections)

This context appears in your dashboard and is included in bug ticket descriptions. No configuration needed.

## TypeScript

The package includes full TypeScript definitions:

```tsx
import type {
  GotchaProps,
  GotchaProviderProps,
  ScoreData,
  SubmissionContext,
  GotchaResponse,
  GotchaError,
} from 'gotcha-feedback';
```

## Requirements

- React 18+

## License

MIT
