/**
 * Newsletter broadcast sender.
 *
 * Usage:
 *   npx tsx website/src/emails/send-broadcast.ts <issue-file> <subject> [--send]
 *
 * Examples:
 *   # Preview (dry run, writes HTML to /tmp):
 *   npx tsx website/src/emails/send-broadcast.ts issues/2026-03-20-v0.10.0.md "MCPVault 0.9.1 + 0.10.0"
 *
 *   # Send for real:
 *   npx tsx website/src/emails/send-broadcast.ts issues/2026-03-20-v0.10.0.md "MCPVault 0.9.1 + 0.10.0" --send
 *
 * Env vars (from website/.env):
 *   RESEND_API_KEY
 *   RESEND_AUDIENCE_ID  (used as segment_id for broadcasts)
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname, join, extname } from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from website/
const envPath = resolve(__dirname, '../../.env');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^(\w+)=(.+)$/);
    if (match) process.env[match[1]] = match[2].trim();
  }
} catch {
  // .env not found, rely on existing env vars
}

const args = process.argv.slice(2);
const issueFile = args[0];
const subject = args[1];
const shouldSend = args.includes('--send');

if (!issueFile || !subject) {
  console.error('Usage: npx tsx send-broadcast.ts <issue-file> <subject> [--send]');
  process.exit(1);
}

const apiKey = process.env.RESEND_API_KEY;
const segmentId = process.env.RESEND_AUDIENCE_ID;

if (!apiKey || !segmentId) {
  console.error('Missing RESEND_API_KEY or RESEND_AUDIENCE_ID in env.');
  process.exit(1);
}

// Read and convert content
const raw = readFileSync(join(__dirname, issueFile), 'utf-8');
const isMarkdown = ['.md', '.markdown'].includes(extname(issueFile));
const contentHtml = isMarkdown ? applyEmailStyles(await marked.parse(raw)) : raw;

// Assemble email
const template = readFileSync(join(__dirname, 'newsletter.html'), 'utf-8');
const html = template.replace('{{content}}', contentHtml);

if (!shouldSend) {
  console.log('--- DRY RUN (pass --send to send for real) ---');
  console.log(`Subject: ${subject}`);
  console.log(`Segment: ${segmentId}`);
  console.log(`From: MCPVault <info@mcpvault.org>`);
  console.log('---');

  const previewPath = '/tmp/newsletter-preview.html';
  writeFileSync(previewPath, html);
  console.log(`Preview saved to ${previewPath}`);
  console.log('Open it in a browser to check styling.');
  process.exit(0);
}

// Send broadcast
const resend = new Resend(apiKey);

const { data, error } = await resend.broadcasts.create({
  segmentId,
  from: 'MCPVault <info@mcpvault.org>',
  subject,
  html,
  name: subject,
  send: true,
});

if (error) {
  console.error('Broadcast failed:', error.message);
  process.exit(1);
}

console.log('Broadcast sent:', data?.id);

/**
 * Apply inline styles to markdown-generated HTML so it looks right in email clients.
 * Email clients strip <style> tags, so everything must be inline.
 */
function applyEmailStyles(html: string): string {
  return html
    .replace(/<h1(.*?)>/g, '<h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#ffffff;">')
    .replace(/<h2(.*?)>/g, '<h2 style="margin:24px 0 10px;font-size:17px;font-weight:600;color:#ffffff;">')
    .replace(/<h3(.*?)>/g, '<h3 style="margin:20px 0 8px;font-size:15px;font-weight:600;color:#ffffff;">')
    .replace(/<p(.*?)>/g, '<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#a0a0a0;">')
    .replace(/<a /g, '<a style="color:#c4b5fd;text-decoration:underline;" ')
    .replace(/<code>/g, '<code style="background:#1e1e1e;padding:2px 6px;border-radius:4px;font-size:13px;color:#c4b5fd;">')
    .replace(/<pre(.*?)>/g, '<pre style="background:#1e1e1e;border-radius:8px;padding:14px 18px;margin:0 0 16px;overflow-x:auto;">')
    .replace(/<pre[^>]*>\s*<code[^>]*>/g, '<pre style="background:#1e1e1e;border-radius:8px;padding:14px 18px;margin:0 0 16px;overflow-x:auto;"><code style="background:none;padding:0;font-size:13px;line-height:1.5;color:#a0a0a0;">')
    .replace(/<ul(.*?)>/g, '<ul style="margin:0 0 16px;padding-left:20px;color:#a0a0a0;">')
    .replace(/<li(.*?)>/g, '<li style="margin:4px 0;font-size:14px;line-height:1.6;color:#a0a0a0;">')
    .replace(/<hr(.*?)>/g, '<hr style="border:none;border-top:1px solid #252525;margin:24px 0;">');
}
