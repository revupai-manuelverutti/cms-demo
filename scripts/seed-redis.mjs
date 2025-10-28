#!/usr/bin/env node
// Seeds Vercel KV with page JSON from public/content
// Usage examples:
//   node scripts/seed-redis.mjs --slug aem
//   node scripts/seed-redis.mjs --all
//   node scripts/seed-redis.mjs --file public/content/aem.json

import fs from 'fs';
import path from 'path';
import url from 'url';
import { kv } from '@vercel/kv';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, 'public', 'content');
const KV_INDEX_KEY = 'content:index';

function loadEnvFiles() {
  const candidates = [
    path.join(ROOT, '.env.local'),
    path.join(ROOT, '.env'),
  ];
  for (const file of candidates) {
    if (fs.existsSync(file)) {
      try {
        const data = fs.readFileSync(file, 'utf8');
        for (const rawLine of data.split(/\r?\n/)) {
          const line = rawLine.trim();
          if (!line || line.startsWith('#')) continue;
          const eq = line.indexOf('=');
          if (eq === -1) continue;
          const key = line.slice(0, eq).trim();
          let val = line.slice(eq + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!(key in process.env)) process.env[key] = val;
        }
      } catch (e) {
        console.warn(`[seed-redis] Could not parse ${file}:`, e.message);
      }
    }
  }
}

function toSlug(contentPath) {
  const cleaned = String(contentPath || '').trim();
  if (cleaned === '/' || cleaned === '') return 'home';
  return cleaned.replace(/^\//, '');
}

function assertWritableKVEnv() {
  // For write operations we need REST URL and a write token
  // Typical for Vercel KV: KV_REST_API_URL + KV_REST_API_TOKEN
  // Also works with Upstash envs if present
  const hasVercelRest = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;
  const hasUpstashRest = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;
  const hasKvUrl = process.env.KV_URL && process.env.KV_REST_API_TOKEN; // fallback
  if (!(hasVercelRest || hasUpstashRest || hasKvUrl)) {
    throw new Error('Missing KV credentials. Set KV_REST_API_URL and KV_REST_API_TOKEN (or Upstash equivalents).');
  }
}

function resolveFilesFromArgs(args) {
  const files = new Set();
  const getBySlug = (slug) => path.join(CONTENT_DIR, `${slug}.json`);

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--all') {
      if (!fs.existsSync(CONTENT_DIR)) return [];
      for (const f of fs.readdirSync(CONTENT_DIR)) {
        if (f.endsWith('.json')) files.add(path.join(CONTENT_DIR, f));
      }
    } else if (a === '--slug') {
      const slug = args[i + 1];
      i++;
      if (!slug) throw new Error('--slug requires a value');
      files.add(getBySlug(slug));
    } else if (a === '--file') {
      const fp = args[i + 1];
      i++;
      if (!fp) throw new Error('--file requires a value');
      files.add(path.isAbsolute(fp) ? fp : path.join(ROOT, fp));
    } else if (!a.startsWith('--')) {
      // positional is interpreted as slug
      files.add(getBySlug(a));
    }
  }
  return Array.from(files);
}

async function seedFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`[seed-redis] Skipping, file not found: ${path.relative(ROOT, filePath)}`);
    return { filePath, ok: false, reason: 'not_found' };
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  let content;
  try {
    content = JSON.parse(raw);
  } catch (e) {
    console.warn(`[seed-redis] Skipping, invalid JSON: ${path.relative(ROOT, filePath)}`);
    return { filePath, ok: false, reason: 'invalid_json' };
  }

  const now = new Date().toISOString();
  if (!content.createdAt) content.createdAt = now;
  content.updatedAt = now;
  const slug = toSlug(content.path || path.basename(filePath, '.json'));

  await kv.set(`content:${slug}`, content);
  await kv.sadd(KV_INDEX_KEY, slug);
  return { filePath, ok: true, slug };
}

async function main() {
  try {
    loadEnvFiles();
    assertWritableKVEnv();

    const args = process.argv.slice(2);
    const files = resolveFilesFromArgs(args);
    if (!files.length) {
      console.log('Usage: node scripts/seed-redis.mjs --slug aem | --all | --file public/content/aem.json');
      process.exit(1);
    }

    console.log(`[seed-redis] Seeding ${files.length} file(s) into KV...`);
    let okCount = 0;
    for (const f of files) {
      try {
        const res = await seedFile(f);
        if (res.ok) {
          okCount++;
          console.log(`  ✔ Seeded ${path.relative(ROOT, f)} as content:${res.slug}`);
        } else {
          console.log(`  ✖ Skipped ${path.relative(ROOT, f)} (${res.reason})`);
        }
      } catch (e) {
        console.log(`  ✖ Error seeding ${path.relative(ROOT, f)} -> ${e.message}`);
      }
    }
    console.log(`[seed-redis] Done. Success: ${okCount}/${files.length}`);
  } catch (e) {
    console.error('[seed-redis] Fatal:', e.message);
    process.exit(1);
  }
}

main();

