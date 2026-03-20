import type { APIRoute, APIContext } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function resolveConfig(locals?: APIContext['locals']) {
  const runtimeEnv = ((locals as any)?.runtime?.env ?? {}) as Record<string, string | undefined>;

  const apiKey = runtimeEnv.RESEND_API_KEY ?? import.meta.env.RESEND_API_KEY;
  const audienceId = runtimeEnv.RESEND_AUDIENCE_ID ?? import.meta.env.RESEND_AUDIENCE_ID;

  if (!apiKey || !audienceId) {
    throw new Error('Missing Resend configuration (RESEND_API_KEY or RESEND_AUDIENCE_ID).');
  }

  return { apiKey, audienceId };
}

import welcomeHtml from '../../emails/welcome.html?raw';

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

    const { apiKey, audienceId } = resolveConfig(locals);
    const resend = new Resend(apiKey);

    const normalized = email.trim().toLowerCase();

    const { data, error } = await resend.contacts.create({
      audienceId,
      email: normalized,
    });

    if (error) {
      console.error('[newsletter] Resend error:', error.message);
      return new Response(JSON.stringify({ success: false, message: 'Unable to save subscription.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    // Send welcome email (fire-and-forget, don't block signup on delivery)
    resend.emails.send({
      from: 'MCPVault <info@mcpvault.org>',
      to: [normalized],
      subject: "You're on the list",
      html: welcomeHtml.replace('{{unsubscribeUrl}}', `https://mcpvault.org/api/unsubscribe?email=${encodeURIComponent(normalized)}`),
    }).catch((err) => {
      console.error('[newsletter] welcome email failed:', err);
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('[newsletter] subscription failed', err);

    return new Response(JSON.stringify({ success: false, message: 'Unable to save subscription.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
};
