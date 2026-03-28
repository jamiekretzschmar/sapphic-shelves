const fs = require('fs');
const path = require('path');

const directory = './src';
const replacements = [
  { regex: /text-theme-text\/30/g, replacement: 'text-theme-text-secondary' },
  { regex: /text-theme-text\/40/g, replacement: 'text-theme-text-secondary' },
  { regex: /text-theme-text\/50/g, replacement: 'text-theme-text-secondary' },
  { regex: /text-theme-text\/60/g, replacement: 'text-theme-text-secondary' },
  { regex: /text-theme-text\/70/g, replacement: 'text-theme-text-secondary' },
  { regex: /text-theme-text\/80/g, replacement: 'text-theme-text-secondary' },
  { regex: /text-white\/30/g, replacement: 'text-theme-text-secondary' },
  { regex: /text-white\/40/g, replacement: 'text-theme-text-secondary' },
  { regex: /text-white\/50/g, replacement: 'text-theme-text-secondary' },
  { regex: /text-white\/60/g, replacement: 'text-theme-text-secondary' },
  { regex: /text-slate-300/g, replacement: 'text-theme-text-secondary' },
  { regex: /text-slate-400/g, replacement: 'text-theme-text-secondary' },
  { regex: /text-stone-200/g, replacement: 'text-theme-text-secondary' },
  { regex: /text-stone-300/g, replacement: 'text-theme-text-secondary' },
  { regex: /text-stone-400/g, replacement: 'text-theme-text-secondary' },
  { regex: /text-gray-400/g, replacement: 'text-theme-text-secondary' },
  { regex: /text-gray-500/g, replacement: 'text-theme-text-secondary' },
  { regex: /text-zinc-400/g, replacement: 'text-theme-text-secondary' },
  { regex: /text-zinc-500/g, replacement: 'text-theme-text-secondary' },
  { regex: /text-neutral-400/g, replacement: 'text-theme-text-secondary' },
  { regex: /text-neutral-500/g, replacement: 'text-theme-text-secondary' },
];

function walk(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let changed = false;
      replacements.forEach(({ regex, replacement }) => {
        if (regex.test(content)) {
          content = content.replace(regex, replacement);
          changed = true;
        }
      });
      if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
      }
    }
  });
}

walk(directory);
