import fs from 'fs';
import path from 'path';

const componentsDir = path.join(process.cwd(), 'components');

function refactorFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace Neobrutalist Tailwind classes with Minimalist Dark ones
  content = content.replace(/bg-white/g, 'bg-[#111111]');
  content = content.replace(/text-black/g, 'text-white');
  content = content.replace(/border-black/g, 'border-white/10');
  content = content.replace(/shadow-\[[^\]]+\]/g, 'shadow-xl');
  content = content.replace(/border-4/g, 'border');
  content = content.replace(/border-2/g, 'border');
  content = content.replace(/rounded-none/g, 'rounded-2xl');
  
  // Accents
  content = content.replace(/bg-accent-yellow/g, 'bg-white/10');
  content = content.replace(/bg-accent-pink/g, 'bg-white/5');
  content = content.replace(/bg-accent-green/g, 'bg-white/5');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Refactored ${path.basename(filePath)}`);
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') && !fullPath.includes('TopBar.tsx')) {
      refactorFile(fullPath);
    }
  }
}

walkDir(componentsDir);
