const fs = require('fs');
const path = require('path');

function replaceColorsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  const replacements = [
    // emerald
    [/emerald-400\/10/g, 'theme-accent1/10'],
    [/emerald-400\/20/g, 'theme-accent1/20'],
    [/emerald-400\/50/g, 'theme-accent1/50'],
    [/emerald-400/g, 'theme-accent1'],
    [/emerald-300/g, 'theme-accent1'],
    [/emerald-500/g, 'theme-accent1'],
    [/emerald-600\/20/g, 'theme-accent1/20'],
    [/emerald-600/g, 'theme-accent1'],
    
    // fuchsia
    [/fuchsia-400/g, 'theme-accent2'],
    [/fuchsia-500\/10/g, 'theme-accent2/10'],
    [/fuchsia-500/g, 'theme-accent2'],
    [/fuchsia-600/g, 'theme-accent2'],
    
    // rose
    [/rose-400\/20/g, 'red-500/20'],
    [/rose-400/g, 'red-400'],
    [/rose-500\/10/g, 'red-500/10'],
    [/rose-500/g, 'red-500'],
    
    // slate
    [/slate-950\/60/g, 'theme-bg/60'],
    [/slate-950\/50/g, 'theme-bg/50'],
    [/slate-950/g, 'theme-bg'],
    [/slate-900\/50/g, 'theme-surface/50'],
    [/slate-900/g, 'theme-surface'],
    [/slate-800/g, 'theme-border'],
    [/slate-700/g, 'theme-text/80'],
    [/slate-600/g, 'theme-text/70'],
    [/slate-500/g, 'theme-text/50'],
    [/slate-400/g, 'theme-text/40'],
    [/slate-300/g, 'theme-text/80'],
    [/slate-200/g, 'theme-text'],
    [/slate-100/g, 'theme-text'],
    [/slate-50/g, 'theme-bg'],
  ];

  for (const [regex, replacement] of replacements) {
    content = content.replace(regex, replacement);
  }
  fs.writeFileSync(filePath, content);
}

const componentsDir = path.join('src', 'components');
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  replaceColorsInFile(path.join(componentsDir, file));
}
console.log('Done');
