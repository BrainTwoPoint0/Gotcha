import { domToJpeg } from 'modern-screenshot';

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

/**
 * Capture a screenshot of the current viewport.
 *
 * The previous implementation passed width/height of the viewport but captured
 * `document.body` from its origin, so any user scrolled below the fold got a
 * picture of the top of the page, not what they were actually looking at.
 * Applying a negative transform equal to the current scroll offset shifts the
 * cloned DOM so that the visible viewport renders at the canvas origin.
 *
 * The transform is applied via `modern-screenshot`'s `style` option, which
 * Object.assigns onto the cloned root. `transform-origin: top left` prevents
 * any implicit centring of the translate.
 *
 * Known limitations:
 *  - `position: fixed` / `position: sticky` elements that live off-screen
 *    in document coordinates (e.g. a pinned header) will shift with the
 *    transform and can render out of frame. The capture is "what the
 *    viewport would look like if it behaved like a normal block flow".
 *  - Custom scroll containers (a div with `overflow: auto`) are not
 *    reflected — only the top-level window scroll is applied.
 *  - Cross-origin iframes cannot be captured by any DOM-to-image
 *    library (browser security).
 *
 * Returns a base64 JPEG data URL or null if capture fails.
 */
export async function captureScreenshot(): Promise<string | null> {
  try {
    // Prefer visualViewport when available — on iOS Safari `window.scrollY`
    // lags the actual scroll position while the URL bar animates, and the
    // visual viewport's `pageTop` / `pageLeft` give the user-perceived
    // scroll offset. Desktop browsers expose visualViewport too, so this
    // is safe as a default.
    const vv = window.visualViewport;
    const viewportWidth = Math.max(1, Math.floor(vv?.width ?? window.innerWidth));
    const viewportHeight = Math.max(1, Math.floor(vv?.height ?? window.innerHeight));
    const scrollX = Math.max(0, Math.round(vv?.pageLeft ?? window.scrollX));
    const scrollY = Math.max(0, Math.round(vv?.pageTop ?? window.scrollY));

    const transformStyle = {
      transform: `translate(-${scrollX}px, -${scrollY}px)`,
      transformOrigin: 'top left',
    } as const;

    let dataUrl = await domToJpeg(document.documentElement, {
      scale: 1,
      quality: 0.7,
      width: viewportWidth,
      height: viewportHeight,
      style: transformStyle,
    });

    // Retry at lower quality / scale when the first pass exceeds the 2MB cap.
    // Keep the same scroll-offset transform so the second pass still captures
    // what the user is actually looking at.
    if (dataUrl.length > MAX_SIZE_BYTES) {
      dataUrl = await domToJpeg(document.documentElement, {
        scale: 0.5,
        quality: 0.5,
        width: viewportWidth,
        height: viewportHeight,
        style: transformStyle,
      });
    }

    return dataUrl;
  } catch {
    return null;
  }
}
