import fs from 'fs';
import path from 'path';

const content = fs.readFileSync('lib/supabase/database.types.ts', 'utf8');
const publicSection = content.split('public: {')[1].split('Views: {')[0];
const tableMatches = [...publicSection.matchAll(/^\s{6}([a-zA-Z0-9_]+):\s*\{([\s\S]*?)\n\s{6}\}/gm)];

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!fullPath.includes('node_modules') && !fullPath.includes('.next') && !fullPath.includes('.git') && !fullPath.includes('database.types.ts') && !fullPath.includes('supabase/migrations')) {
        getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      if (/\.(ts|tsx|js|jsx|mjs)$/.test(file)) {
        arrayOfFiles.push(fullPath);
      }
    }
  });
  return arrayOfFiles;
}

const sourceFiles = getAllFiles('.');
const fileContents = sourceFiles.map(f => ({ file: f, text: fs.readFileSync(f, 'utf8') }));

console.log('=== APP TO DATABASE MAPPING SUMMARY ===\n');

tableMatches.forEach(match => {
  const tableName = match[1];
  const body = match[2];
  const rowMatch = body.match(/Row:\s*\{([\s\S]*?)\}/);
  const cols = rowMatch ? [...rowMatch[1].matchAll(/([a-zA-Z0-9_]+):/g)].map(m => m[1]) : [];

  const tableRegex = new RegExp('\\b' + tableName + '\\b');
  const matchedFiles = fileContents.filter(fc => tableRegex.test(fc.text));

  const routes = new Set();
  const repos = new Set();
  const components = new Set();

  matchedFiles.forEach(fc => {
    const p = fc.file;
    if (p.startsWith('app' + path.sep)) routes.add(p);
    else if (p.startsWith('components' + path.sep)) components.add(p);
    else if (p.startsWith('lib' + path.sep)) repos.add(p);
  });

  console.log(`### Table: \`${tableName}\``);
  console.log(`- **Total Columns**: ${cols.length}`);
  console.log(`- **Referencing Code Files**: ${matchedFiles.length}`);
  console.log(`- **App Routes / Actions**: ${Array.from(routes).map(r => path.basename(r)).join(', ') || 'None'}`);
  console.log(`- **Lib / Repositories**: ${Array.from(repos).map(r => path.basename(r)).join(', ') || 'None'}`);
  console.log(`- **Components**: ${Array.from(components).map(c => path.basename(c)).join(', ') || 'None'}`);
  console.log('');
});
