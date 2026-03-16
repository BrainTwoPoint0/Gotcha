export default async () => {
  const url = process.env.SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://gotcha.cx';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${url}/api/health`, { signal: controller.signal });
    if (!res.ok) {
      console.error(`Keep-warm health check returned ${res.status}`);
    }
  } catch (err) {
    console.error(
      'Keep-warm health check failed:',
      err instanceof Error ? err.message : 'Unknown error'
    );
  } finally {
    clearTimeout(timeout);
  }

  return new Response('OK');
};

export const config = {
  schedule: '*/5 * * * *',
};
