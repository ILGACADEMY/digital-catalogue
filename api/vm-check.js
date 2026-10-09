// ILG Academy · Brand 360 VM photo check — Vercel serverless function.
// Path on the website: /api/vm-check
// Needs these Vercel environment variables:
//   ANTHROPIC_API_KEY  your Claude API key (secret, never in the page)
//   VM_ACCESS_CODE     a code you choose; the page must send it before any check runs
//   VM_MODEL           optional, default claude-sonnet-5-5
// Photos are passed straight to Claude and are not stored or logged here.
'use strict';
const crypto = require('crypto');

const MODEL = process.env.VM_MODEL || 'claude-sonnet-5-5';
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGES = 6;                 // per check
const MAX_BODY = 4300000;             // Vercel refuses request bodies above about 4.5 MB
const MAX_PROMPT = 30000;             // characters
const TIMEOUT_MS = 55000;

function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}

// compares two codes in constant time (no timing hints about the right code)
function sameCode(a, b) {
  const h = s => crypto.createHash('sha256').update(String(s)).digest();
  return crypto.timingSafeEqual(h(a), h(b));
}

async function readBody(req) {
  if (req.body !== undefined && req.body !== null) {          // Vercel has already parsed it
    return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  }
  let size = 0; const parts = [];
  for await (const c of req) { size += c.length; if (size > MAX_BODY) throw Object.assign(new Error('big'), { code: 'PHOTO TOO LARGE' }); parts.push(c); }
  return JSON.parse(Buffer.concat(parts).toString('utf8') || '{}');
}

// pulls the JSON object out of Claude's answer (tolerates ```json fences)
function parseJson(text) {
  const t = String(text || '').replace(/```(?:json)?/gi, '');
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  try { const v = JSON.parse(t.slice(a, b + 1)); return v && typeof v === 'object' ? v : null; } catch (e) { return null; }
}

module.exports = async function handler(req, res) {
  const key = process.env.ANTHROPIC_API_KEY, code = process.env.VM_ACCESS_CODE;
  if (!key || !code) return send(res, 503, { error: 'SERVER NOT SET UP' });

  const given = String(req.headers['x-vm-code'] || '');
  if (!given) return send(res, 401, { error: 'ACCESS CODE NEEDED' });
  if (!sameCode(given, code)) { await new Promise(r => setTimeout(r, 400)); return send(res, 401, { error: 'WRONG ACCESS CODE' }); }

  if (req.method === 'GET') return send(res, 200, { images: { maxCount: MAX_IMAGES, mediaTypes: TYPES } });
  if (req.method !== 'POST') return send(res, 405, { error: 'NOT ALLOWED' });

  const len = +req.headers['content-length'] || 0;
  if (len > MAX_BODY) return send(res, 413, { error: 'PHOTO TOO LARGE' });
  let body;
  try { body = await readBody(req); } catch (e) { return send(res, e.code === 'PHOTO TOO LARGE' ? 413 : 400, { error: e.code || 'BAD REQUEST' }); }

  const prompt = body && body.prompt, images = (body && body.images) || [];
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > MAX_PROMPT) return send(res, 400, { error: 'BAD REQUEST' });
  if (!Array.isArray(images) || images.length > MAX_IMAGES) return send(res, 400, { error: 'TOO MANY PHOTOS' });
  for (const im of images) {
    if (!im || !TYPES.includes(im.media_type) || typeof im.data !== 'string' || !/^[A-Za-z0-9+/=]+$/.test(im.data)) return send(res, 400, { error: 'PHOTO NOT ACCEPTED' });
  }

  const content = images.map(im => ({ type: 'image', source: { type: 'base64', media_type: im.media_type, data: im.data } }));
  content.push({ type: 'text', text: prompt });
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  let r, j;
  try {
    r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', signal: ctl.signal,
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: MODEL, max_tokens: 4096,
        system: 'You check photos of retail watch displays for a training tool. Follow the instructions in the message exactly. When asked for JSON, reply with the JSON object only.',
        messages: [{ role: 'user', content }]
      })
    });
    j = await r.json().catch(() => null);
  } catch (e) {
    return send(res, 504, { error: e.name === 'AbortError' ? 'CHECK TOOK TOO LONG — TRY AGAIN' : 'CLAUDE NOT REACHABLE' });
  } finally { clearTimeout(timer); }

  if (!r.ok) {
    console.error('vm-check: Claude API status', r.status, j && j.error && j.error.type);   // no photo or prompt is logged
    const map = { 401: 'SERVER KEY NOT ACCEPTED', 403: 'SERVER KEY NOT ACCEPTED', 429: 'CHECKER BUSY — TRY AGAIN', 529: 'CHECKER BUSY — TRY AGAIN', 413: 'PHOTO TOO LARGE', 400: 'PHOTO NOT ACCEPTED' };
    return send(res, 502, { error: map[r.status] || 'CHECKER ERROR ' + r.status });
  }
  const text = ((j && j.content) || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
  if (body.json) {
    const v = parseJson(text);
    if (!v) return send(res, 502, { error: 'ANSWER NOT READABLE — TRY AGAIN' });
    return send(res, 200, { json: v });
  }
  return send(res, 200, { text });
};
