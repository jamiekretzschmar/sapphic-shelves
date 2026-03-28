const fs = require('fs');
const path = require('path');

function replaceColorsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  const replacements = [
    // mustard
    [/mustard-600 dark:mustard-400/g, 'theme-accent1'],
    [/mustard-600/g, 'theme-accent1'],
    [/mustard-500\/50/g, 'theme-accent1/50'],
    [/mustard-500\/30/g, 'theme-accent1/30'],
    [/mustard-500\/20/g, 'theme-accent1/20'],
    [/mustard-500\/10/g, 'theme-accent1/10'],
    [/mustard-500\/5/g, 'theme-accent1/5'],
    [/mustard-500/g, 'theme-accent1'],
    [/mustard-400/g, 'theme-accent1'],
    [/mustard-300/g, 'theme-accent1'],
    [/mustard-200/g, 'theme-accent1'],
    [/mustard-100/g, 'theme-accent1'],
    [/mustard-50/g, 'theme-accent1'],
    
    // sage
    [/sage-900\/30/g, 'theme-accent2/30'],
    [/sage-900\/20/g, 'theme-accent2/20'],
    [/sage-900/g, 'theme-accent2'],
    [/sage-800/g, 'theme-accent2'],
    [/sage-700 dark:text-sage-300/g, 'theme-accent2'],
    [/sage-700/g, 'theme-accent2'],
    [/sage-600 dark:text-sage-400/g, 'theme-accent2'],
    [/sage-600/g, 'theme-accent2'],
    [/sage-500\/50/g, 'theme-accent2/50'],
    [/sage-500\/40/g, 'theme-accent2/40'],
    [/sage-500\/30/g, 'theme-accent2/30'],
    [/sage-500\/20/g, 'theme-accent2/20'],
    [/sage-500\/10/g, 'theme-accent2/10'],
    [/sage-500/g, 'theme-accent2'],
    [/sage-400/g, 'theme-accent2'],
    [/sage-300/g, 'theme-accent2'],
    [/sage-200/g, 'theme-accent2'],
    [/sage-100/g, 'theme-accent2'],
    [/sage-50/g, 'theme-accent2'],

    // stone
    [/stone-950/g, 'theme-bg'],
    [/stone-900/g, 'theme-bg'],
    [/stone-800/g, 'theme-bg'],
    [/stone-700/g, 'theme-text/80'],
    [/stone-600/g, 'theme-text/70'],
    [/stone-500/g, 'theme-text/50'],
    [/stone-400/g, 'theme-text/40'],
    [/stone-300/g, 'theme-text/30'],
    [/stone-200/g, 'theme-text/20'],
    [/stone-100/g, 'theme-bg'],
    [/stone-50/g, 'theme-bg'],
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
