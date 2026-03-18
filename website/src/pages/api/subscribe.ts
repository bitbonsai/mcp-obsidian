import type { APIRoute, APIContext } from 'astro';

export const prerender = false;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type CloudflareConfig = {
  accountId: string;
  namespaceId: string;
  apiToken: string;
};

function resolveCloudflareConfig(locals?: APIContext['locals']): CloudflareConfig {
  const runtimeEnv = ((locals as any)?.runtime?.env ?? {}) as Record<string, string | undefined>;

  const accountId = runtimeEnv.CLOUDFLARE_ACCOUNT_ID ?? import.meta.env.CLOUDFLARE_ACCOUNT_ID;
  const namespaceId = runtimeEnv.CLOUDFLARE_KV_NAMESPACE_ID ?? import.meta.env.CLOUDFLARE_KV_NAMESPACE_ID;
  const apiToken = runtimeEnv.CLOUDFLARE_API_TOKEN ?? import.meta.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !namespaceId || !apiToken) {
    throw new Error('Missing Cloudflare email storage configuration.');
  }

  return {
    accountId,
    namespaceId,
    apiToken,
  };
}

async function storeEmail(email: string, config: CloudflareConfig) {
  const { accountId, namespaceId, apiToken } = config;

  const normalized = email.trim().toLowerCase();
  const key = `subscriber:${encodeURIComponent(normalized)}`;
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${key}`;

  const res = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: normalized, subscribedAt: new Date().toISOString() }),
  });

  if (!res.ok) {
    const payload = await res.text();
    throw new Error(`Cloudflare KV error: ${payload}`);
  }
}

export const POST: APIRoute = async ({ request, locals }) => {
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

    const config = resolveCloudflareConfig(locals);
    await storeEmail(email, config);

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
