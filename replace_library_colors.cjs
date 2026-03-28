const fs = require('fs');
const path = require('path');

const filePath = path.join('src', 'components', 'Library.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const replacements = [
  [/bg-white dark:bg-earth-900\/50/g, 'bg-theme-surface'],
  [/bg-white dark:bg-earth-900/g, 'bg-theme-surface'],
  [/bg-earth-900 dark:bg-earth-100/g, 'bg-theme-text'],
  [/bg-earth-900 hover:bg-earth-800 dark:bg-earth-100 dark:hover:bg-white/g, 'bg-theme-text hover:opacity-90'],
  [/bg-earth-100 dark:bg-earth-800/g, 'bg-theme-bg'],
  [/bg-earth-50 dark:bg-earth-900/g, 'bg-theme-bg'],
  [/bg-earth-50 dark:bg-earth-950\/30/g, 'bg-theme-bg'],
  [/bg-earth-100\/50 dark:bg-earth-900\/50/g, 'bg-theme-bg'],
  [/bg-earth-100\/50 dark:bg-earth-900\/30/g, 'bg-theme-bg'],
  [/bg-earth-50 dark:bg-earth-800\/50/g, 'bg-theme-bg'],
  [/bg-earth-50 dark:bg-earth-950/g, 'bg-theme-bg'],
  [/bg-earth-950\/50/g, 'bg-theme-bg/50'],
  [/bg-earth-950\/60/g, 'bg-theme-bg/60'],
  [/bg-earth-950\/30/g, 'bg-theme-bg/30'],
  [/bg-earth-950/g, 'bg-theme-bg'],
  [/bg-earth-900\/60/g, 'bg-theme-bg/60'],
  [/bg-earth-900\/20/g, 'bg-theme-bg/20'],
  
  [/text-earth-900 dark:text-earth-100/g, 'text-theme-text'],
  [/text-earth-900 dark:text-earth-50/g, 'text-theme-text'],
  [/text-earth-800 dark:text-earth-200/g, 'text-theme-text'],
  [/text-earth-800 dark:text-earth-100/g, 'text-theme-text'],
  [/text-earth-700 dark:text-earth-300/g, 'text-theme-text/80'],
  [/text-earth-600 dark:text-earth-400/g, 'text-theme-text/70'],
  [/text-earth-600 dark:text-earth-300/g, 'text-theme-text/70'],
  [/text-earth-500 dark:text-earth-400/g, 'text-theme-text/50'],
  [/text-earth-400 dark:text-earth-500/g, 'text-theme-text/40'],
  [/text-earth-400 dark:text-earth-600/g, 'text-theme-text/40'],
  [/text-earth-900/g, 'text-theme-text'],
  [/text-earth-800/g, 'text-theme-text'],
  [/text-earth-700/g, 'text-theme-text/80'],
  [/text-earth-600/g, 'text-theme-text/70'],
  [/text-earth-500/g, 'text-theme-text/50'],
  [/text-earth-400/g, 'text-theme-text/40'],
  [/text-earth-300/g, 'text-theme-text/30'],
  [/text-earth-200/g, 'text-theme-text/20'],
  [/text-earth-100/g, 'text-theme-text/10'],
  
  [/border-earth-200 dark:border-earth-800/g, 'border-theme-border'],
  [/border-earth-200 dark:border-earth-700/g, 'border-theme-border'],
  [/border-earth-100 dark:border-earth-800/g, 'border-theme-border'],
  [/border-earth-300 dark:border-white\/5/g, 'border-theme-border'],
  [/border-earth-200/g, 'border-theme-border'],
  [/border-earth-300/g, 'border-theme-border'],
  [/border-earth-800/g, 'border-theme-border'],
  
  [/hover:bg-earth-200 dark:hover:bg-earth-700/g, 'hover:bg-theme-surface'],
  [/hover:border-earth-300 dark:hover:border-earth-700/g, 'hover:border-theme-accent1'],
  [/hover:text-earth-800 dark:hover:text-earth-200/g, 'hover:text-theme-text'],
  [/hover:text-earth-900 dark:hover:text-earth-100/g, 'hover:text-theme-text'],
  
  [/bg-earth-200 dark:bg-earth-800\/50/g, 'bg-theme-surface'],
  [/bg-earth-200 dark:bg-earth-800/g, 'bg-theme-surface'],
  
  [/bg-white\/60 dark:bg-earth-900\/60/g, 'bg-theme-surface/60'],
  [/bg-white dark:bg-earth-950/g, 'bg-theme-surface'],
  [/bg-earth-800\/80/g, 'bg-theme-bg/80'],
];

for (const [regex, replacement] of replacements) {
  content = content.replace(regex, replacement);
}
fs.writeFileSync(filePath, content);
console.log('Done');
