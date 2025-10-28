// Simple generator to produce AEM-like dialog XMLs for each default-exported React component
// It scans components/*.tsx, finds the default export's props interface/type, and maps fields to widgets.

const fs = require('fs');
const path = require('path');

const WORKDIR = process.cwd();
const COMPONENTS_DIR = path.join(WORKDIR, 'components');
const OUT_DIR = path.join(WORKDIR, 'generated', 'dialogs');
const HTML_OUT_DIR = path.join(WORKDIR, 'generated', 'html');

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function readFileSafe(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
}

function humanLabel(name) {
  const s = name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function isPrimitiveType(t) {
  const tt = t.trim();
  return tt === 'string' || tt === 'number' || tt === 'boolean';
}

function mapTypeToWidget(typeStr) {
  const t = typeStr.trim();
  // primitive direct
  if (t === 'string' || t === 'number') {
    return { resource: 'granite/ui/components/coral/foundation/form/textfield', extra: {} };
  }
  if (t === 'boolean') {
    return { resource: 'granite/ui/components/coral/foundation/form/checkbox', extra: { text: 'Enabled' } };
  }
  // unions like boolean | string
  if (/\bboolean\b\s*\|/.test(t) || /\|\s*\bboolean\b/.test(t)) {
    // ambiguous; prefer textfield to capture raw
    return { resource: 'granite/ui/components/coral/foundation/form/textfield', extra: {} };
  }
  // arrays
  if (/\[\]$/.test(t) || /^Array<.+>$/i.test(t)) {
    return { resource: 'granite/ui/components/coral/foundation/form/textarea', extra: { rows: '6', fieldDescription: 'JSON array' } };
  }
  // React/JSX or functions
  if (/React\.|JSX\.|=>/.test(t)) {
    return null; // skip
  }
  // object-ish: use textarea JSON
  if (/{|}/.test(t) || /Record<|Map<|Set<|unknown|any/.test(t) || /\w+<.*>/.test(t)) {
    return { resource: 'granite/ui/components/coral/foundation/form/textarea', extra: { rows: '6', fieldDescription: 'JSON value' } };
  }
  // named custom types -> textarea JSON
  return { resource: 'granite/ui/components/coral/foundation/form/textarea', extra: { rows: '4', fieldDescription: 'Enter JSON' } };
}

function extractPropsNameFromDefaultExport(src) {
  // export default function Name({ ... }: PropsName)
  let m = src.match(/export\s+default\s+function\s+[A-Za-z0-9_]+\s*\([^)]*:\s*([A-Za-z0-9_]+)/m);
  if (m) return m[1];
  // export default function Name(props: PropsName)
  m = src.match(/export\s+default\s+function\s+[A-Za-z0-9_]+\s*\(\s*[A-Za-z0-9_]+\s*:\s*([A-Za-z0-9_]+)/m);
  if (m) return m[1];
  // export default (props: PropsName) =>
  m = src.match(/export\s+default\s*\([^)]*:\s*([A-Za-z0-9_]+)/m);
  if (m) return m[1];
  return null;
}

function extractInterfaceBlock(src, declKind, name) {
  const startIdx = src.indexOf(`${declKind} ${name}`);
  if (startIdx === -1) return null;
  const braceIdx = src.indexOf('{', startIdx);
  if (braceIdx === -1) return null;
  // scan to matching closing brace
  let depth = 0;
  for (let i = braceIdx; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return src.slice(braceIdx + 1, i);
      }
    }
  }
  return null;
}

function parsePropsFromBlock(block) {
  // remove line comments
  const cleaned = block.replace(/\/\/.*$/gm, '').replace(/\n\s*\n/g, '\n');
  const lines = cleaned.split(/\n/);
  const props = [];
  let acc = '';
  // Accumulate until semicolon to handle simple multi-line types
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    acc += (acc ? ' ' : '') + line;
    if (acc.endsWith(';') || acc.endsWith('},') || acc.endsWith('}')) {
      const m = acc.match(/^([a-zA-Z0-9_]+)\s*(\??)\s*:\s*([^;]+);?/);
      if (m) {
        const name = m[1];
        const optional = m[2] === '?';
        const type = m[3].trim().replace(/,$/, '');
        props.push({ name, optional, type });
      }
      acc = '';
    }
  }
  return props;
}

function buildFieldXml({ name, optional, type }) {
  const widget = mapTypeToWidget(type);
  if (!widget) return null;
  const fieldName = name;
  const label = humanLabel(name);
  const reqAttr = optional ? '' : '\n                        required="{Boolean}true"';
  const extraAttrs = Object.entries(widget.extra || {})
    .map(([k, v]) => `\n                        ${k}="${String(v)}"`)
    .join('');

  // Checkbox uses 'text' for label; but we keep fieldLabel for consistency
  return `                    <${fieldName}
                        jcr:primaryType="nt:unstructured"
                        sling:resourceType="${widget.resource}"
                        fieldLabel="${label}"
                        name="./${fieldName}"${reqAttr}${extraAttrs}/>`;
}

function buildDialogXml(componentTitle, fieldsXml) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<jcr:root xmlns:sling="http://sling.apache.org/jcr/sling/1.0" xmlns:granite="http://www.adobe.com/jcr/granite/1.0" xmlns:cq="http://www.day.com/jcr/cq/1.0" xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0"
    jcr:primaryType="nt:unstructured"
    jcr:title="${componentTitle}"
    sling:resourceType="cq/gui/components/authoring/dialog">
    <content
        jcr:primaryType="nt:unstructured"
        sling:resourceType="granite/ui/components/coral/foundation/container"
        granite:class="dialog-pad-top">
        <items jcr:primaryType="nt:unstructured">
            <columns
                jcr:primaryType="nt:unstructured"
                sling:resourceType="granite/ui/components/coral/foundation/container">
                <items jcr:primaryType="nt:unstructured">
${fieldsXml.join('\n')}
                </items>
            </columns>
        </items>
    </content>
</jcr:root>`;
}

function htl(expr) {
  return '${' + expr + '}';
}

// ---- Enhanced HTML generation helpers ----
function pascalToKebab(name) {
  // Split transitions aB, a1, 1A and keep digits groups
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Za-z])([0-9]+)/g, '$1-$2')
    .replace(/([0-9]+)([A-Za-z])/g, '$1-$2')
    .toLowerCase();
}

function inferCmpClass(componentName) {
  // Prefer strip trailing 'Page' and prefix with cmp-
  const base = componentName.replace(/Page$/i, '');
  return 'cmp-' + pascalToKebab(base);
}

function getInterfacePropsFromSource(src, typeName) {
  let block = extractInterfaceBlock(src, 'interface', typeName);
  if (!block) block = extractInterfaceBlock(src, 'type', typeName);
  if (!block) return null;
  return parsePropsFromBlock(block);
}

function parseArrayElementType(typeStr) {
  const t = typeStr.trim();
  const arrMatch = t.match(/^(.*)\[\]$/);
  if (arrMatch) return arrMatch[1].trim();
  const genMatch = t.match(/^Array<\s*([^>]+)\s*>$/i);
  if (genMatch) return genMatch[1].trim();
  return null;
}

function extractStringLiteralUnionValuesFromAlias(src, aliasName) {
  const m = src.match(new RegExp('(?:type)\\s+' + aliasName + '\\s*=\\s*([^;]+);'));
  if (!m) return null;
  return (m[1] || '')
    .split('|')
    .map(s => s.trim())
    .map(s => s.replace(/^['\"]|['\"]$/g, ''))
    .filter(Boolean);
}

function extractInlineStringLiteralUnion(typeStr) {
  // e.g. 'a' | 'b' | "c"
  const parts = typeStr.split('|')
    .map(s => s.trim())
    .filter(s => /^['\"][\s\S]+['\"]$/.test(s))
    .map(s => s.replace(/^['\"]|['\"]$/g, ''));
  return parts.length ? parts : null;
}

function isLikelyDiscriminatorName(name) {
  return name.toLowerCase() === 'type' || name.toLowerCase().endsWith('type') || name.toLowerCase().includes('tiletype');
}

function buildFieldsForProps(propsList, ctxPrefix) {
  // ctxPrefix is 'properties' for root, 'item' for list items
  const lines = [];
  for (const p of propsList) {
    const arrElem = parseArrayElementType(p.type);
    if (arrElem) {
      // Nested array — try to resolve element interface and list it
      lines.push(`  <div class="list list--${p.name}" data-sly-list="${htl(ctxPrefix + '.' + p.name)}">`);
      const childPrefix = 'item';
      // Try to resolve interface props; fallback to primitive items
      const isPrimitive = isPrimitiveType(arrElem) || /^{|}/.test(arrElem) || /any|unknown/.test(arrElem);
      if (!isPrimitive) {
        lines.push(`    <div class="item">`);
        lines.push(`      <!-- ${arrElem} fields -->`);
        lines.push(...buildFieldsForProps(getInterfacePropsFromSource(globalThis.__GEN_SRC__ || '', arrElem) || [], childPrefix).map(l => '      ' + l));
        lines.push(`    </div>`);
      } else {
        lines.push(`    <div class="item">${htl(childPrefix)}</div>`);
      }
      lines.push(`  </div>`);
      continue;
    }
    // Primitive or object fallback
    lines.push(`  <div class="field field--${p.name}">${htl(ctxPrefix + '.' + p.name)}</div>`);
  }
  return lines;
}

function buildVariantBlocksForInterface(src, ifaceProps, ctxPrefix) {
  // Find a discriminator prop with string-literal union
  const disc = ifaceProps.find(p => isLikelyDiscriminatorName(p.name));
  if (!disc) return null;
  // Resolve union values
  let values = extractInlineStringLiteralUnion(disc.type);
  if (!values && /^[A-Za-z0-9_]+$/.test(disc.type)) {
    values = extractStringLiteralUnionValuesFromAlias(src, disc.type);
  }
  if (!values || !values.length) return null;
  const lines = [];
  for (const v of values) {
    const vClass = pascalToKebab(v).replace(/^-+/, '');
    lines.push(`  <div class="variant variant--${vClass}" data-sly-test="${htl(ctxPrefix + '.' + disc.name + " == '" + v + "'")}">`);
    for (const p of ifaceProps) {
      if (p.name === disc.name) continue;
      const arrElem = parseArrayElementType(p.type);
      if (arrElem) {
        // One level nested list inside variant
        lines.push(`    <div class="list list--${p.name}" data-sly-list="${htl(ctxPrefix + '.' + p.name)}">`);
        lines.push(`      <div class="item">`);
        lines.push(`        ${htl('item')}`);
        lines.push(`      </div>`);
        lines.push(`    </div>`);
      } else {
        lines.push(`    <div class="field field--${p.name}">${htl(ctxPrefix + '.' + p.name)}</div>`);
      }
    }
    lines.push('  </div>');
  }
  return lines;
}

function buildRichHtml(componentName, props, src) {
  // expose src for nested helper lookups
  globalThis.__GEN_SRC__ = src;
  const lines = [];
  const cmpClass = inferCmpClass(componentName);
  // hasContent: chain required primitive props or fallback to any prop
  const required = (props || []).filter(p => !p.optional && isPrimitiveType(p.type));
  const hasContentExpr = required.length
    ? required.map(p => `properties.${p.name}`).join(' && ')
    : (props && props.length ? `properties.${props[0].name}` : 'properties');

  lines.push('<sly data-sly-use.template="core/wcm/components/commons/v1/templates.html"></sly>');
  lines.push('<sly data-sly-test.hasContent="' + htl(hasContentExpr) + '"></sly>');
  lines.push('<sly data-sly-call="' + htl('template.placeholder @ isEmpty=!hasContent') + '"></sly>');

  // Root wrapper visible only when hasContent
  const commonDataAttrs = [];
  const propNames = new Set((props || []).map(p => p.name));
  if (propNames.has('componentType')) commonDataAttrs.push('data-component_type="' + htl('properties.componentType') + '"');
  if (propNames.has('componentId')) commonDataAttrs.push('data-component_id="' + htl('properties.componentId') + '"');
  if (propNames.has('componentTitle')) commonDataAttrs.push('data-component_title="' + htl('properties.componentTitle') + '"');

  const rootTag = /page$/i.test(componentName) ? 'section' : 'div';
  lines.push(`<${rootTag} class="${cmpClass}" data-cmp-is="${cmpClass}" ${commonDataAttrs.join(' ')} data-sly-test="${htl('hasContent')}">`);

  // Emit top-level props: arrays become lists; primitives become fields
  for (const p of props) {
    const arrElem = parseArrayElementType(p.type);
    if (arrElem) {
      const childIfaceProps = getInterfacePropsFromSource(src, arrElem) || [];
      lines.push(`  <div class="list list--${p.name}" data-sly-list="${htl('properties.' + p.name)}">`);
      // Variant blocks if discriminator exists
      const variants = buildVariantBlocksForInterface(src, childIfaceProps, 'item');
      if (variants && variants.length) {
        lines.push(...variants.map(l => '    ' + l));
      } else if (childIfaceProps.length) {
        lines.push('    <div class="item">');
        lines.push(...buildFieldsForProps(childIfaceProps, 'item').map(l => '      ' + l));
        lines.push('    </div>');
      } else {
        // Primitive list
        lines.push('    <div class="item">' + htl('item') + '</div>');
      }
      lines.push('  </div>');
      continue;
    }
    // non-array prop — simple field
    lines.push('  <div class="field field--' + p.name + '">' + htl('properties.' + p.name) + '</div>');
  }

  lines.push(`</${rootTag}>`);
  return lines.join('\n') + '\n';
}

// Legacy fallback kept as minimal option
function buildDefaultHtml(componentName, props) {
  const lines = [];
  lines.push('<sly data-sly-use.template="core/wcm/components/commons/v1/templates.html"></sly>');
  lines.push('<div class="cq-placeholder" data-emptytext="' + htl("component.title @ context='attribute'") + '" data-sly-test="' + htl('wcmmode.edit') + '"></div>');
  lines.push('<div class="' + componentName + '">');
  lines.push('  <!-- Auto-generated markup. Replace with a tailored template if needed. -->');
  if (props && props.length) {
    for (const p of props) {
      lines.push('  <div class="field field--' + p.name + '">' + htl('properties.' + p.name) + '</div>');
    }
  } else {
    lines.push('  <div>' + htl('properties') + '</div>');
  }
  lines.push('</div>');
  lines.push('<sly data-sly-call="' + htl('template.placeholder @ isEmpty=false') + '"></sly>');
  return lines.join('\n') + '\n';
}

function parseParamDestructuringMap(src) {
  // Supports: export default function Name({ a, b: bb, c = 1, d: dd = '' }: Props)
  // and: export default ({ ... }: Props) =>
  const m = src.match(/export\s+default\s+(?:function\s+[A-Za-z0-9_]+\s*|)\(\s*\{([\s\S]*?)\}\s*:/m);
  if (!m) return { localToProp: {}, propNames: [] };
  const body = m[1];
  const parts = body.split(',').map(s => s.trim()).filter(Boolean);
  const localToProp = {};
  const propNames = [];
  for (let p of parts) {
    // remove trailing comments and types/defaults beyond first '=' for simplicity
    p = p.replace(/\/\*.*?\*\//g, '').replace(/:\s*[^=]+/g, m => m); // keep for alias detection
    // patterns
    // name?: type = default  OR name: local = default
    const alias = p.match(/^([A-Za-z0-9_]+)\s*:\s*([A-Za-z0-9_]+)/);
    if (alias) {
      const prop = alias[1];
      const local = alias[2];
      localToProp[local] = prop;
      propNames.push(prop);
      continue;
    }
    const name = (p.match(/^([A-Za-z0-9_]+)/) || [])[1];
    if (name) {
      localToProp[name] = name;
      propNames.push(name);
    }
  }
  return { localToProp, propNames: Array.from(new Set(propNames)) };
}

function extractReturnJsx(src) {
  // Find default-exported function body
  const f = src.match(/export\s+default\s+function\s+[A-Za-z0-9_]+\s*\(/);
  let bodyStart = -1;
  let bodyEnd = -1;
  if (f) {
    const sigOpenIdx = f.index + f[0].length - 1; // index of '('
    // advance to end of parameter list by matching parentheses
    let depthPar = 0;
    let afterParams = -1;
    for (let i = sigOpenIdx; i < src.length; i++) {
      const ch = src[i];
      if (ch === '(') depthPar++;
      else if (ch === ')') {
        depthPar--;
        if (depthPar === 0) { afterParams = i + 1; break; }
      }
    }
    if (afterParams !== -1) {
      // find opening '{' of function body after params
      const i = src.indexOf('{', afterParams);
      if (i !== -1) {
        bodyStart = i;
        let depth = 0;
        for (let j = i; j < src.length; j++) {
          const ch = src[j];
          if (ch === '{') depth++;
          else if (ch === '}') {
            depth--;
            if (depth === 0) { bodyEnd = j; break; }
          }
        }
      }
    }
  }
  if (bodyStart === -1 || bodyEnd === -1) return '';
  const body = src.slice(bodyStart + 1, bodyEnd);
  const rIdx = body.indexOf('return');
  if (rIdx === -1) return '';
  const openIdx = body.indexOf('(', rIdx);
  if (openIdx === -1) return '';
  let depth = 0;
  let end = -1;
  for (let i = openIdx; i < body.length; i++) {
    const ch = body[i];
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  if (end === -1) return '';
  return body.slice(openIdx + 1, end);
}

function findObjectLiteral(src, varName) {
  const decl = src.indexOf(`const ${varName} =`);
  if (decl === -1) return '';
  const brace = src.indexOf('{', decl);
  if (brace === -1) return '';
  let depth = 0;
  for (let i = brace; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return src.slice(brace + 1, i);
      }
    }
  }
  return '';
}

function splitTopLevelComma(str) {
  const parts = [];
  let acc = '';
  let depth = 0;
  let inS = false, inD = false;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === "'" && !inD) inS = !inS;
    else if (ch === '"' && !inS) inD = !inD;
    else if (!inS && !inD) {
      if (ch === '{' || ch === '[' || ch === '(') depth++;
      else if (ch === '}' || ch === ']' || ch === ')') depth--;
      else if (ch === ',' && depth === 0) {
        parts.push(acc.trim());
        acc = '';
        continue;
      }
    }
    acc += ch;
  }
  if (acc.trim()) parts.push(acc.trim());
  return parts;
}

function parseObjectProps(str) {
  const map = {};
  for (const entry of splitTopLevelComma(str)) {
    if (!entry) continue;
    const idx = entry.indexOf(':');
    if (idx === -1) continue;
    let key = entry.slice(0, idx).trim();
    let val = entry.slice(idx + 1).trim();
    key = key.replace(/^['\"]|['\"]$/g, '');
    map[key] = val;
  }
  return map;
}

function buildAttrsFromCommonProps(src, localToProp) {
  const raw = findObjectLiteral(src, 'commonProps');
  if (!raw) return '';
  const obj = parseObjectProps(raw);
  const attrs = [];
  const toAttr = (k) => (k === 'className' ? 'class' : k);
  for (const [k, v] of Object.entries(obj)) {
    const attr = toAttr(k);
    // string literal
    if ((/^['\"]/).test(v) && (/['\"]$/).test(v)) {
      attrs.push(`${attr}=${v}`);
      continue;
    }
    // simple expression or identifier, with optional fallback using ||
    const first = v.split('||')[0].trim();
    const id = first.match(/^[A-Za-z0-9_\.]+$/) ? first : null;
    if (id) {
      const root = localToProp[id] ? `properties.${localToProp[id]}` : id;
      attrs.push(`${attr}="${htl(root)}"`);
      continue;
    }
    // fallback: raw expression
    attrs.push(`${attr}="${htl(v)}"`);
  }
  return attrs.length ? ' ' + attrs.join(' ') : '';
}

function mapIdentifiersInExpr(expr, localToProp, knownSet) {
  // Map bare identifiers to properties.* if known; keep dotted paths and string literals intact
  let res = '';
  let inS = false, inD = false;
  let prev = '';
  let token = '';
  function flush() {
    if (!token) return;
    // Do not remap dotted paths (item.field, props.x, Number.parseInt)
    if (token.indexOf('.') !== -1) {
      res += token;
    } else {
      if (localToProp && localToProp[token]) res += 'properties.' + localToProp[token];
      else if (knownSet && knownSet.has(token)) res += 'properties.' + token;
      else res += token;
    }
    token = '';
  }
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (!inS && ch === '"' && !inD) { flush(); inD = true; res += ch; prev = ch; continue; }
    if (!inD && ch === "'" && !inS) { flush(); inS = true; res += ch; prev = ch; continue; }
    if (inD) { res += ch; if (ch === '"' && prev !== '\\') inD = false; prev = ch; continue; }
    if (inS) { res += ch; if (ch === "'" && prev !== '\\') inS = false; prev = ch; continue; }
    const isWord = /[A-Za-z0-9_\.]/.test(ch);
    if (isWord) { token += ch; prev = ch; continue; }
    flush();
    res += ch;
    prev = ch;
  }
  flush();
  return res.trim().replace(/===/g, '==').replace(/!==/g, '!=');
}

function wrapWithScaffold(innerHtml) {
  const lines = [];
  lines.push('<sly data-sly-use.template="core/wcm/components/commons/v1/templates.html"></sly>');
  lines.push('<div class="cq-placeholder" data-emptytext="' + htl("component.title @ context='attribute'") + '" data-sly-test="' + htl('wcmmode.edit') + '"></div>');
  lines.push(innerHtml.trim());
  lines.push('<sly data-sly-call="' + htl('template.placeholder @ isEmpty=false') + '"></sly>');
  return lines.join('\n') + '\n';
}

function convertJsxToHtml(jsx, maps, src, knownProps = []) {
  if (!jsx) return '';
  const { localToProp, propNames } = maps;
  const knownSet = new Set([...(propNames || []), ...knownProps]);
  let out = jsx;
  // drop spreads like {...commonProps}
  const commonAttrs = buildAttrsFromCommonProps(src, localToProp);
  out = out.replace(/\{\.\.\.commonProps\}/g, commonAttrs);
  out = out.replace(/\{\.\.\.[^}]+\}/g, '');
  // remove React comments
  out = out.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  // Simplify template-literal attributes by dropping dynamic ${...}
  const stripTemplateDynamic = (s) => s.replace(/\$\{[\s\S]*?\}/g, '').replace(/\s+/g, ' ').trim();
  out = out.replace(/(\s[\w:-]+)=\{`([\s\S]*?)`\}/g, (_m, attr, tpl) => {
    const lit = stripTemplateDynamic(tpl);
    return `${attr}="${lit}"`;
  });
  // Replace OuterTag with best guess
  if (/\<\s*OuterTag\b/.test(out)) {
    const hasLink = propNames.includes('linkUrl');
    out = out.replace(/\<\s*OuterTag\b/g, (hasLink ? '<a' : '<div'));
    out = out.replace(/\<\/\s*OuterTag\s*\>/g, hasLink ? '</a>' : '</div>');
    if (hasLink) {
      // add href if missing
      out = out.replace(/<a(\s[^>]*?)?>/, (m, g1 = '') => {
        if (/\shref=/.test(m)) return m;
        return `<a${g1 || ''} href="${htl('properties.linkUrl')}">`;
      });
    }
  }
  // className -> class, htmlFor -> for, tabIndex -> tabindex
  out = out.replace(/\bclassName=/g, 'class=');
  out = out.replace(/\bhtmlFor=/g, 'for=');
  out = out.replace(/\btabIndex=/g, 'tabindex=');
  // Full-block ternary: {cond ? (<Tag...>...</Tag>) : null|false}
  out = out.replace(/\{\s*([\s\S]+?)\s*\?\s*\(?\s*([\s\S]*?)\s*\)?\s*:\s*(?:null|false)\s*\}/g, (_m, condRaw, inner) => {
    const test = mapIdentifiersInExpr(condRaw, localToProp, knownSet);
    return inner.replace(/<([A-Za-z0-9:_-]+)([^>]*)>/, `<$1$2 data-sly-test="${htl(test)}">`);
  });
  // Full-block logical AND: {cond && (<Tag...>...</Tag>)}
  out = out.replace(/\{\s*([\s\S]+?)\s*&&\s*\(?\s*([\s\S]*?)\s*\)?\s*\}/g, (_m, condRaw, inner) => {
    const test = mapIdentifiersInExpr(condRaw, localToProp, knownSet);
    return inner.replace(/<([A-Za-z0-9:_-]+)([^>]*)>/, `<$1$2 data-sly-test="${htl(test)}">`);
  });
  // Map list: {array?.map((item, index) => ( ... ))}
  out = out.replace(/\{\s*([A-Za-z0-9_]+)\s*\??\.\s*map\s*\(\s*\(\s*([A-Za-z0-9_]+)(?:\s*,\s*[A-Za-z0-9_]+)?\s*\)\s*=>\s*\(\s*([\s\S]*?)\s*\)\s*\)\s*\}/g,
    (_m, arr, item, inner) => {
      // Map local alias (e.g., items) to prop name (e.g., locationItems)
      const prop = localToProp[arr] || arr;
      // Normalize inner to use item.* instead of arbitrary var name
      let normalized = inner.replace(new RegExp(`\\b${item}\\.`, 'g'), 'item.');
      // Also replace text-node bare {item} to ${item}
      normalized = normalized.replace(new RegExp(`\\{\\s*${item}\\s*\\}`, 'g'), htl('item'));
      return `<div data-sly-list="${htl('properties.' + prop)}">\n${normalized}\n</div>`;
    });
  // Attribute expressions: attr={value}
  out = out.replace(/(\s[\w:-]+)=\{([^}]+)\}/g, (_m, attr, expr) => {
    const e = expr.trim();
    if (/^['\"][\s\S]*['\"]$/.test(e)) {
      return `${attr}=${e}`; // quoted literal
    }
    if (/^[A-Za-z0-9_\.]+$/.test(e)) {
      // Support mapping simple prop names even if not destructured
      let root = e;
      if (localToProp[e]) root = `properties.${localToProp[e]}`;
      else if (knownSet.has(e)) root = `properties.${e}`;
      return `${attr}="${htl(root)}"`;
    }
    // fallback: keep as HTL expression string
    return `${attr}="${htl(e)}"`;
  });
  // Text node expressions not already HTL: {expr} but not ${expr}
  out = out.replace(/(?<!\$)\{\s*([A-Za-z0-9_\.]+)\s*\}/g, (_m, id) => {
    // If it's a destructured alias, map to properties
    if (localToProp[id]) return htl('properties.' + localToProp[id]);
    // Simple prop name present in interface
    if (knownSet.has(id)) return htl('properties.' + id);
    // Keep references like item.field or props.field as-is
    return htl(id);
  });
  // Special-case: derived 'name' from array of first/last
  const nameDecl = src.match(/const\s+name\s*=\s*\[\s*([^\]]+)\s*\]\.filter\(Boolean\)\.join\(\s*['\"][^'\"]*['\"]\s*\)/);
  if (nameDecl) {
    const parts = nameDecl[1].split(',').map(s => s.trim()).filter(Boolean);
    const mapped = parts.map(p => `properties.${localToProp[p] || p}`);
    const joinExpr = '${[' + mapped.join(',') + "] @ join=' ', context='html'}";
    out = out.replace(/\$\{\s*name\s*\}/g, joinExpr);
  }
  return wrapWithScaffold(out.trim());
}

function generate() {
  ensureDir(OUT_DIR);
  ensureDir(HTML_OUT_DIR);
  const entries = fs.readdirSync(COMPONENTS_DIR);
  const files = entries.filter(f => f.endsWith('.tsx'));
  const results = [];
  let htmlCount = 0;
  for (const file of files) {
    const full = path.join(COMPONENTS_DIR, file);
    const src = readFileSafe(full);
    if (!src) continue;
    // Determine props first for better JSX mapping
    const propsName = extractPropsNameFromDefaultExport(src);
    let props = [];
    if (propsName) {
      let block = extractInterfaceBlock(src, 'interface', propsName) || extractInterfaceBlock(src, 'type', propsName);
      if (block) props = parsePropsFromBlock(block)
        .filter(p => {
          if (/^on[A-Z]/.test(p.name)) return false;
          if (/React\.|JSX\.|=>/.test(p.type)) return false;
          if (p.name === 'children') return false;
          return true;
        });
    }
    // Build HTML from component JSX (with knowledge of prop names)
    const maps = parseParamDestructuringMap(src);
    const jsx = extractReturnJsx(src);
    const htmlFromJsx = convertJsxToHtml(jsx, maps, src, props.map(p => p.name));
    if (!propsName) {
      // no default export with typed props; skip
      // Still emit HTML if any content was derived
      if (htmlFromJsx) {
        const componentName = path.basename(file, path.extname(file));
        const htmlOutPath = path.join(HTML_OUT_DIR, `${componentName}.html`);
        ensureDir(HTML_OUT_DIR);
        fs.writeFileSync(htmlOutPath, htmlFromJsx, 'utf8');
        htmlCount++;
        // no dialog XML without props
        continue;
      } else {
        continue;
      }
    }
    if (!props || props.length === 0) continue;
    const fields = [];
    for (const p of props) {
      const fieldXml = buildFieldXml(p);
      if (fieldXml) fields.push(fieldXml);
    }
    if (fields.length === 0) continue;
    const componentName = path.basename(file, path.extname(file));
    const xml = buildDialogXml(componentName, fields);
    const outPath = path.join(OUT_DIR, `${componentName}.xml`);
    fs.writeFileSync(outPath, xml, 'utf8');
    const htmlOutPath = path.join(HTML_OUT_DIR, `${componentName}.html`);
    const finalHtml = htmlFromJsx || buildRichHtml(componentName, props, src);
    fs.writeFileSync(htmlOutPath, finalHtml, 'utf8');
    htmlCount++;
    results.push({ componentName, outPath, htmlOutPath });
  }
  return { results, htmlCount };
}

if (require.main === module) {
  const { results, htmlCount } = generate();
  console.log(`Generated ${results.length} dialog XML/HTML record(s).`);
  const xmlOnly = results.filter(r => !!r.outPath);
  console.log(`Dialog XML files: ${xmlOnly.length}`);
  for (const r of xmlOnly) {
    console.log(` - ${r.componentName}: ${path.relative(process.cwd(), r.outPath)}`);
  }
  console.log(`HTML files: ${htmlCount}`);
  for (const r of results) {
    if (r.htmlOutPath) {
      console.log(` - ${r.componentName}: ${path.relative(process.cwd(), r.htmlOutPath)}`);
    }
  }
}

module.exports = { generate };

