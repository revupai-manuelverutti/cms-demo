#!/usr/bin/env node
// Extract component prop names and basic types from TSX files into generated/component-props.json
// Lightweight text parser (no TS compiler dependency) tailored to our codebase

import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.join(process.cwd(), 'components');
const OUT_DIR = path.join(process.cwd(), 'generated');
const OUT_FILE = path.join(OUT_DIR, 'component-props.json');

function categoryFromType(typeStr) {
  const t = typeStr.replace(/\s+/g, ' ').trim().toLowerCase();
  if (t.includes('boolean') && t.includes('string')) return 'boolean|string';
  if (t.includes('boolean')) return 'boolean';
  if (t.includes('number')) return 'number';
  if (t.endsWith('[]') || t.includes('[]')) return 'array';
  if (t.startsWith('{') || t.includes('interface')) return 'object';
  return 'string';
}

function extractInterfaces(content) {
  const interfaces = [];
  const re = /interface\s+([A-Za-z0-9_]+Props)\s*\{/g;
  let m;
  while ((m = re.exec(content))) {
    const name = m[1];
    // Find matching closing brace for the interface body
    let i = m.index + m[0].length;
    let depth = 1;
    while (i < content.length && depth > 0) {
      const ch = content[i++];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
    }
    const body = content.slice(m.index + m[0].length, i - 1);
    const props = [];
    body.split(/;\s*\n?|\n/).forEach(line => {
      const clean = line.trim().replace(/\r/g, '');
      if (!clean) return;
      // Skip comments
      if (clean.startsWith('//')) return;
      const match = clean.match(/^([A-Za-z0-9_]+)\s*(\?)?\s*:\s*([^;]+)$/);
      if (!match) return;
      const propName = match[1];
      const optional = Boolean(match[2]);
      const typeStr = match[3].trim();
      const type = categoryFromType(typeStr);
      props.push({ name: propName, type, optional, rawType: typeStr });
    });
    interfaces.push({ name, props });
  }
  return interfaces;
}

function findDefaultFunctionPropsName(content) {
  const m = content.match(/export\s+default\s+function\s+[A-Za-z0-9_]+\s*\([^)]*:\s*([A-Za-z0-9_]+Props)\s*\)/);
  return m ? m[1] : null;
}

function main() {
  if (!fs.existsSync(COMPONENTS_DIR)) {
    console.error('components directory not found');
    process.exit(1);
  }
  const files = fs.readdirSync(COMPONENTS_DIR).filter(f => f.endsWith('.tsx'));
  const mapping = {};
  for (const f of files) {
    const full = path.join(COMPONENTS_DIR, f);
    const base = path.basename(f, '.tsx');
    const content = fs.readFileSync(full, 'utf8');
    const interfaces = extractInterfaces(content);
    if (interfaces.length === 0) continue;
    const targetName = findDefaultFunctionPropsName(content);
    const chosen = interfaces.find(i => i.name === targetName) || interfaces[0];
    mapping[base] = chosen;
  }
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(mapping, null, 2));
  console.log('Wrote', OUT_FILE);
}

main();
