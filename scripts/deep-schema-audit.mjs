import fs from 'fs';
import path from 'path';

// Audit script analyzing database.types.ts against app source files

async function run() {
  console.log('=== DEEP SCHEMA AUDIT & COLUMN USAGE INVENTORY ===');

  const content = fs.readFileSync('lib/supabase/database.types.ts', 'utf8');
  const publicSection = content.split('public: {')[1].split('Views: {')[0];
  const tableMatches = [...publicSection.matchAll(/^\s{6}([a-zA-Z0-9_]+):\s*\{([\s\S]*?)\n\s{6}\}/gm)];

  const tableColumnMap = {};

  tableMatches.forEach(match => {
    const tableName = match[1];
    const body = match[2];
    const rowMatch = body.match(/Row:\s*\{([\s\S]*?)\}/);
    if (rowMatch) {
      const cols = [...rowMatch[1].matchAll(/([a-zA-Z0-9_]+):/g)].map(m => m[1]);
      tableColumnMap[tableName] = cols;
    }
  });

  // Get all app files
  function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
      const fullPath = path.join(dirPath, file);
      if (fs.statSync(fullPath).isDirectory()) {
        if (!fullPath.includes('node_modules') && !fullPath.includes('.next') && !fullPath.includes('.git')) {
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

  const appFiles = getAllFiles('.').filter(f => !f.includes('database.types.ts'));
  const appTexts = appFiles.map(f => ({ file: f, text: fs.readFileSync(f, 'utf8') }));

  console.log(`Auditing ${Object.keys(tableColumnMap).length} tables across ${appFiles.length} source files...\n`);

  for (const [table, cols] of Object.entries(tableColumnMap)) {
    console.log(`Table: ${table} (${cols.length} columns)`);
    const tableRegex = new RegExp('\\b' + table + '\\b');
    const filesUsingTable = appTexts.filter(t => tableRegex.test(t.text));
    
    if (filesUsingTable.length === 0) {
      console.log(`  [POTENTIALLY UNUSED TABLE] ${table} has 0 references in TS/JS files`);
    } else {
      // Check column references
      const colUsage = {};
      cols.forEach(col => {
        const colRegex = new RegExp('\\b' + col + '\\b');
        const count = filesUsingTable.filter(t => colRegex.test(t.text)).length;
        colUsage[col] = count;
      });
      const unusedCols = Object.entries(colUsage).filter(([, count]) => count === 0).map(([columnName]) => columnName);
      if (unusedCols.length > 0) {
        console.log(`  Unreferenced columns in code: ${unusedCols.join(', ')}`);
      }
    }
  }
}

run().catch(console.error);
