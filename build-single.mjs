import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const css = readFileSync('styles.css', 'utf8');
const js = readFileSync('app.js', 'utf8');

let output = html.replace(
  '<link rel="stylesheet" href="styles.css">',
  `<style>\n${css}\n</style>`
);

output = output.replace(
  '<script src="app.js"></script>',
  `<script>\n${js}\n</script>`
);

if (output === html) throw new Error('Could not inline CSS/JS');
if (output.includes('href="styles.css"') || output.includes('src="app.js"')) {
  throw new Error('Standalone build still has external references');
}

writeFileSync('single.html', output);
console.log(`single.html generated: ${output.length} chars`);
