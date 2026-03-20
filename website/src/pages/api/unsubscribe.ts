import type { APIRoute, APIContext } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

function resolveConfig(locals?: APIContext['locals']) {
  const runtimeEnv = ((locals as any)?.runtime?.env ?? {}) as Record<string, string | undefined>;

  const apiKey = runtimeEnv.RESEND_API_KEY ?? import.meta.env.RESEND_API_KEY;
  const audienceId = runtimeEnv.RESEND_AUDIENCE_ID ?? import.meta.env.RESEND_AUDIENCE_ID;

  if (!apiKey || !audienceId) {
    throw new Error('Missing Resend configuration (RESEND_API_KEY or RESEND_AUDIENCE_ID).');
  }

  return { apiKey, audienceId };
}

export const GET: APIRoute = async ({ url, locals }) => {
  const email = url.searchParams.get('email');

  if (!email) {
    return new Response('<p>Missing email parameter.</p>', {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  try {
    const { apiKey, audienceId } = resolveConfig(locals);
    const resend = new Resend(apiKey);

    const { error } = await resend.contacts.remove({
      audienceId,
      email: email.trim().toLowerCase(),
    });

    if (error) {
      console.error('[newsletter] unsubscribe error:', error.message);
    }

    return new Response(unsubscribePageHtml(), {
      status: 200,
      headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('[newsletter] unsubscribe failed', err);

    return new Response('<p>Something went wrong. Please try again later.</p>', {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
};

function unsubscribePageHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Unsubscribed - MCP-Vault</title></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:80px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr><td style="background-color:#141414;border:1px solid #252525;border-radius:12px;padding:36px;text-align:center;">
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#ffffff;">You've been unsubscribed</h1>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#a0a0a0;">
            You won't receive any more emails from MCP-Vault. If this was a mistake, you can re-subscribe on the homepage.
          </p>
          <a href="https://mcpvault.org" style="display:inline-block;padding:10px 24px;font-size:14px;font-weight:600;color:#ffffff;background-color:#7c3aed;border-radius:8px;text-decoration:none;">Back to mcpvault.org</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
