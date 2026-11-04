import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const html = read('index.html');
const js = read('app.js');

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
if (duplicateIds.length) {
  throw new Error(`Duplicate HTML ids: ${duplicateIds.join(', ')}`);
}

const refs = new Set([...js.matchAll(/\$\('([^']+)'\)/g)].map((m) => m[1]));
['customerModal', 'followupModal', 'orderModal'].forEach((id) => refs.add(id));
const missingIds = [...refs].filter((id) => !ids.includes(id));
if (missingIds.length) {
  throw new Error(`JS references missing HTML ids: ${missingIds.join(', ')}`);
}

const actions = new Set([
  ...[...html.matchAll(/data-action="([^"]+)"/g)].map((m) => m[1]),
  ...[...js.matchAll(/data-action="([^"]+)"/g)].map((m) => m[1])
]);
const handled = new Set([...js.matchAll(/case '([^']+)':/g)].map((m) => m[1]));
const unhandled = [...actions].filter((action) => !handled.has(action));
if (unhandled.length) {
  throw new Error(`Unhandled data-action values: ${unhandled.join(', ')}`);
}

const requiredFiles = ['styles.css', 'app.js'];
for (const file of requiredFiles) {
  if (!html.includes(file)) throw new Error(`index.html does not reference ${file}`);
}

console.log(`OK: ${ids.length} html ids, ${refs.size} js refs, ${actions.size} actions`);
