import type { APIRoute } from 'astro';

export const prerender = false;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_KV_NAMESPACE_ID, CLOUDFLARE_API_TOKEN } = import.meta.env;

async function storeEmail(email: string) {
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_KV_NAMESPACE_ID || !CLOUDFLARE_API_TOKEN) {
    throw new Error('Missing Cloudflare email storage configuration.');
  }

  const normalized = email.trim().toLowerCase();
  const key = `subscriber:${encodeURIComponent(normalized)}`;
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${CLOUDFLARE_KV_NAMESPACE_ID}/values/${key}`;

  const res = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: normalized, subscribedAt: new Date().toISOString() }),
  });

  if (!res.ok) {
    const payload = await res.text();
    throw new Error(`Cloudflare KV error: ${payload}`);
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type') ?? '';
    let email: string | null = null;

    if (contentType.includes('application/json')) {
      const body = await request.json();
      email = typeof body?.email === 'string' ? body.email : null;
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const body = await request.text();
      const params = new URLSearchParams(body);
      email = params.get('email');
    }

    if (!email || !emailRegex.test(email.trim())) {
      return new Response(JSON.stringify({ success: false, message: 'Enter a valid email address.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    await storeEmail(email);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[newsletter] subscription failed', error);

    return new Response(JSON.stringify({ success: false, message: 'Unable to save subscription.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
};
