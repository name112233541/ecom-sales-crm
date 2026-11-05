import { readFileSync, writeFileSync } from 'node:fs';

function replaceOnce(source, search, replacement, label) {
  if (!source.includes(search)) throw new Error(`Missing patch anchor: ${label}`);
  return source.replace(search, replacement);
}

let app = readFileSync('app.js', 'utf8');
app = replaceOnce(
  app,
  "const STORAGE_KEY = 'ecom_crm_mvp_v1';",
  "const STORAGE_KEY = 'ecom_crm_mvp_v2';",
  'storage key'
);
writeFileSync('app.js', app);

let readme = readFileSync('README.md', 'utf8');
readme = readme.replace(/ecom_crm_mvp_v1/g, 'ecom_crm_mvp_v2');
writeFileSync('README.md', readme);

console.log('post real-v1 patch applied');
