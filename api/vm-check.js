// ILG Academy · Brand 360 VM photo check — Vercel serverless function.
// Path on the website: /api/vm-check
// Needs these Vercel environment variables:
//   ANTHROPIC_API_KEY  your Claude API key (secret, never in the page)
//   VM_ACCESS_CODE     a code you choose; the page must send it before any check runs
//   VM_MODEL           optional, default claude-sonnet-5-5
// OR, to use the owner's own Mac (M5) running Ollama behind its AI gateway instead of Claude (no cost):
//   VM_AI=local, LOCAL_GATEWAY_URL, LOCAL_GATEWAY_KEY (secret), LOCAL_GATEWAY_MODEL (default qwen3.5:9b)
//   VM_TIMEOUT_MS      optional, default 55000 (Vercel stops the function at 60 s; a local run may allow more)
// Photos are passed straight to Claude and are not stored or logged here.
'use strict';
const crypto = require('crypto');

const MODEL = process.env.VM_MODEL || 'claude-sonnet-5-5';
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGES = 6;                 // per check
const MAX_BODY = 4300000;             // Vercel refuses request bodies above about 4.5 MB
const MAX_PROMPT = 30000;             // characters
const TIMEOUT_MS = Math.max(5000, +process.env.VM_TIMEOUT_MS || 55000);
const LOCAL_SIDE = 1024;              // the gateway accepts photos up to 1024 px on the long side
const isLocal = () => String(process.env.VM_AI || '').toLowerCase() === 'local';
function gatewayUrl() { const b = String(process.env.LOCAL_GATEWAY_URL || '').replace(/\/+$/, ''); return /\/api\/chat$/.test(b) ? b : b + '/api/chat'; }
const SYSTEM = 'You check photos of retail watch displays for a training tool. Follow the instructions in the message exactly. When asked for JSON, reply with the JSON object only.';

// the owner's Mac (Ollama behind the gateway): returns {text, cutOff} or {error}
async function askLocal(prompt, images, wantJson) {
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  let r, j;
  try {
    r = await fetch(gatewayUrl(), {
      method: 'POST', signal: ctl.signal,
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + process.env.LOCAL_GATEWAY_KEY },
      body: JSON.stringify({
        model: process.env.LOCAL_GATEWAY_MODEL || 'qwen3.5:9b', stream: false, think: false,
        ...(wantJson ? { format: 'json' } : {}),
        messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt, images: images.map(im => im.data) }],
        options: { temperature: 0.2, num_ctx: 16384, num_predict: 4096 }
      })
    });
    j = await r.json().catch(() => null);
  } catch (e) {
    return { error: e.name === 'AbortError' ? 'CHECK TOOK TOO LONG — TRY AGAIN' : 'LOCAL AI NOT REACHABLE — IS THE MAC AWAKE?' };
  } finally { clearTimeout(timer); }
  if (!r.ok) {
    console.error('vm-check: local AI status', r.status);   // no photo or prompt is logged
    const map = { 401: 'SERVER KEY NOT ACCEPTED', 403: 'SERVER KEY NOT ACCEPTED', 429: 'CHECKER BUSY — TRY AGAIN', 413: 'PHOTO TOO LARGE', 400: 'PHOTO NOT ACCEPTED',
                  502: 'LOCAL AI NOT REACHABLE — IS THE MAC AWAKE?', 503: 'LOCAL AI NOT REACHABLE — IS THE MAC AWAKE?', 504: 'CHECK TOOK TOO LONG — TRY AGAIN' };
    return { error: map[r.status] || 'CHECKER ERROR ' + r.status };
  }
  const text = String((j && j.message && j.message.content) || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  const cutOff = !!(j && j.done_reason === 'length');
  console.log('vm-check: local answer', j && j.done_reason, j && j.eval_count, 'tokens');   // length only, never the content
  return { text, cutOff };
}

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

// pulls the JSON object out of Claude's answer: tolerates ```json fences and words before or after it
function parseJson(text) {
  const t = String(text || '').replace(/```(?:json)?/gi, '');
  for (let a = t.indexOf('{'); a >= 0; a = t.indexOf('{', a + 1)) {
    let depth = 0, inStr = false, esc = false, end = -1;
    for (let i = a; i < t.length && end < 0; i++) {
      const c = t[i];
      if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
      if (c === '"') inStr = true; else if (c === '{') depth++; else if (c === '}' && --depth === 0) end = i;
    }
    if (end < 0) return null;   // never closed: the answer was cut off, so no inner piece is taken as the answer
    try { const v = JSON.parse(t.slice(a, end + 1)); if (v && typeof v === 'object') return v; } catch (e) {}
  }
  return null;
}

// an answer cut off at the length limit: keep every list item that was finished, drop the unfinished one
function salvageJson(text) {
  let t = String(text || '').replace(/```(?:json)?/gi, '');
  const a = t.indexOf('{'); if (a < 0) return null; t = t.slice(a);
  for (let cut = t.lastIndexOf('}'); cut > 0; cut = t.lastIndexOf('}', cut - 1)) {
    const head = t.slice(0, cut + 1);
    const stack = []; let inStr = false, esc = false;
    for (const c of head) {
      if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
      if (c === '"') inStr = true; else if (c === '{' || c === '[') stack.push(c); else if (c === '}' || c === ']') stack.pop();
    }
    if (inStr) continue;
    const close = stack.reverse().map(c => (c === '{' ? '}' : ']')).join('');
    try { const v = JSON.parse(head + close); if (v && typeof v === 'object') return v; } catch (e) {}
  }
  return null;
}

module.exports = async function handler(req, res) {
  const local = isLocal(), code = process.env.VM_ACCESS_CODE;
  const key = local ? process.env.LOCAL_GATEWAY_KEY : process.env.ANTHROPIC_API_KEY;
  if (!key || !code || (local && !process.env.LOCAL_GATEWAY_URL)) return send(res, 503, { error: 'SERVER NOT SET UP' });

  const given = String(req.headers['x-vm-code'] || '');
  if (!given) return send(res, 401, { error: 'ACCESS CODE NEEDED' });
  if (!sameCode(given, code)) { await new Promise(r => setTimeout(r, 400)); return send(res, 401, { error: 'WRONG ACCESS CODE' }); }

  if (req.method === 'GET') return send(res, 200, local
    ? { images: { maxCount: 1, maxSide: LOCAL_SIDE, mediaTypes: TYPES }, ai: 'local' }
    : { images: { maxCount: MAX_IMAGES, mediaTypes: TYPES } });
  if (req.method !== 'POST') return send(res, 405, { error: 'NOT ALLOWED' });

  const len = +req.headers['content-length'] || 0;
  if (len > MAX_BODY) return send(res, 413, { error: 'PHOTO TOO LARGE' });
  let body;
  try { body = await readBody(req); } catch (e) { return send(res, e.code === 'PHOTO TOO LARGE' ? 413 : 400, { error: e.code || 'BAD REQUEST' }); }

  const prompt = body && body.prompt, images = (body && body.images) || [];
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > MAX_PROMPT) return send(res, 400, { error: 'BAD REQUEST' });
  if (!Array.isArray(images) || images.length > (local ? 1 : MAX_IMAGES)) return send(res, 400, { error: 'TOO MANY PHOTOS' });
  for (const im of images) {
    if (!im || !TYPES.includes(im.media_type) || typeof im.data !== 'string' || !/^[A-Za-z0-9+/=]+$/.test(im.data)) return send(res, 400, { error: 'PHOTO NOT ACCEPTED' });
  }

  if (local) {
    const a = await askLocal(prompt, images, !!body.json);
    if (a.error) return send(res, a.error.startsWith('CHECK TOOK') ? 504 : 502, { error: a.error });
    return answer(res, a.text, a.cutOff, body.json);
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
        model: MODEL, max_tokens: 8000,
        system: SYSTEM,
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
  const cutOff = j && j.stop_reason === 'max_tokens';
  console.log('vm-check: answer', j && j.stop_reason, j && j.usage && j.usage.output_tokens, 'tokens');   // length only, never the content
  return answer(res, text, cutOff, body.json);
};

function answer(res, text, cutOff, json) {
  if (json) {
    const v = parseJson(text) || (cutOff ? salvageJson(text) : null);
    if (!v) return send(res, 502, { error: cutOff ? 'ANSWER TOO LONG — TRY FEWER PAGES' : 'ANSWER NOT READABLE — TRY AGAIN' });
    return send(res, 200, { json: v, cutOff: cutOff || undefined });
  }
  return send(res, 200, { text });
}
