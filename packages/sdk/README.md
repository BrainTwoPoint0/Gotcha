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
- **Customizable** - Themes, sizes, positions
- **Accessible** - Full keyboard navigation and screen reader support
- **Animated** - Smooth enter/exit animations with CSS transitions
- **Lightweight** - ~15KB minified

## Props

### GotchaProvider

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiKey` | `string` | Required | Your Gotcha API key |
| `baseUrl` | `string` | Production URL | Override API endpoint |
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

```tsx
<GotchaProvider
  apiKey="your-api-key"
  defaultUser={{ plan: 'pro', role: 'admin' }}
>
  <App />
</GotchaProvider>
```

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

## TypeScript

The package includes full TypeScript definitions:

```tsx
import type { GotchaProps, GotchaProviderProps } from 'gotcha-feedback';
```

## Requirements

- React 18+

## License

MIT
