import { domToJpeg } from 'modern-screenshot';

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

/**
 * Capture a screenshot of the current page using modern-screenshot.
 * Returns a base64 data URL or null if capture fails.
 */
export async function captureScreenshot(): Promise<string | null> {
  try {
    let dataUrl = await domToJpeg(document.body, {
      scale: 1,
      quality: 0.7,
      width: window.innerWidth,
      height: window.innerHeight,
    });

    // If too large, retry at lower quality and scale
    if (dataUrl.length > MAX_SIZE_BYTES) {
      dataUrl = await domToJpeg(document.body, {
        scale: 0.5,
        quality: 0.5,
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    return dataUrl;
  } catch {
    return null;
  }
}
