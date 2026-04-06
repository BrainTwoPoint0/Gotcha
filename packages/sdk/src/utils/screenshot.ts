const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

/**
 * Capture a screenshot of the current page.
 * Tries html2canvas first (if installed), falls back to native Screen Capture API.
 * Returns a base64 data URL or null if both methods fail.
 */
export async function captureScreenshot(): Promise<string | null> {
  // Try html2canvas first (silent, no user prompt)
  try {
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(document.body, {
      logging: false,
      useCORS: true,
      scale: 1,
      width: window.innerWidth,
      height: window.innerHeight,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
    });
    return compressCanvas(canvas);
  } catch {
    // html2canvas not installed or failed — try native API
  }

  // Fallback: native Screen Capture API
  try {
    if (!navigator.mediaDevices?.getDisplayMedia || typeof ImageCapture === 'undefined') return null;

    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { displaySurface: 'browser' } as MediaTrackConstraints,
    });

    const track = stream.getVideoTracks()[0];
    const imageCapture = new ImageCapture(track);
    const bitmap = await imageCapture.grabFrame();
    track.stop();

    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0);

    return compressCanvas(canvas);
  } catch {
    return null;
  }
}

function compressCanvas(canvas: HTMLCanvasElement): string {
  // Start with JPEG 0.7 quality
  let dataUrl = canvas.toDataURL('image/jpeg', 0.7);

  // If still too large, reduce quality further
  if (dataUrl.length > MAX_SIZE_BYTES) {
    dataUrl = canvas.toDataURL('image/jpeg', 0.4);
  }

  // If still too large, scale down
  if (dataUrl.length > MAX_SIZE_BYTES) {
    const scale = 0.5;
    const smaller = document.createElement('canvas');
    smaller.width = canvas.width * scale;
    smaller.height = canvas.height * scale;
    const ctx = smaller.getContext('2d');
    if (ctx) {
      ctx.drawImage(canvas, 0, 0, smaller.width, smaller.height);
      dataUrl = smaller.toDataURL('image/jpeg', 0.5);
    }
  }

  return dataUrl;
}
