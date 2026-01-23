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
- **Vote Mode** - Thumbs up/down
- **User Segmentation** - Analyze feedback by custom user attributes
- **Edit Support** - Users can update their previous submissions
- **Customizable** - Themes, sizes, positions
- **Accessible** - Full keyboard navigation and screen reader support
- **Animated** - Smooth enter/exit animations with CSS transitions
- **Lightweight** - ~15KB minified

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
| `mode` | `'feedback' \| 'vote'` | `'feedback'` | Feedback mode |
| `position` | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left' \| 'inline'` | `'top-right'` | Button position |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'light'` | Color theme |
| `showOnHover` | `boolean` | `true` | Only show on hover |
| `promptText` | `string` | Mode-specific | Custom prompt text |
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

### useGotcha

Access the Gotcha context for programmatic control:

```tsx
import { useGotcha } from 'gotcha-feedback';

function MyComponent() {
  const { submitFeedback, disabled } = useGotcha();

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

## TypeScript

The package includes full TypeScript definitions:

```tsx
import type { GotchaProps, GotchaProviderProps } from 'gotcha-feedback';
```

## Requirements

- React 18+

## License

MIT
