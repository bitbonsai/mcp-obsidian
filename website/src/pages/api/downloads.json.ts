export const prerender = false;

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}

export async function GET() {
  const today = new Date().toISOString().split('T')[0];
  // npm launched in 2010; this range captures all-time downloads
  const range = `2010-01-01:${today}`;

  const [oldRes, newRes] = await Promise.all([
    fetch(`https://api.npmjs.org/downloads/point/${range}/mcpvault`),
    fetch(`https://api.npmjs.org/downloads/point/${range}/%40bitbonsai%2Fmcpvault`),
  ]);

  const [oldData, newData] = await Promise.all([
    oldRes.ok ? oldRes.json() : { downloads: 0 },
    newRes.ok ? newRes.json() : { downloads: 0 },
  ]);

  const total = (oldData.downloads ?? 0) + (newData.downloads ?? 0);

  return new Response(
    JSON.stringify({
      schemaVersion: 1,
      label: 'downloads',
      message: formatCount(total),
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        // shields.io respects s-maxage; 1 hour is a reasonable refresh interval
        'Cache-Control': 'public, s-maxage=3600, max-age=3600',
      },
    },
  );
}
