import fs from 'fs';
import path from 'path';

const migrationFiles = fs.readdirSync('supabase/migrations').filter(f => f.endsWith('.sql'));

console.log('=== CHECKING NEXTAUTH "Session" TABLE IN MIGRATIONS ===');

migrationFiles.forEach(mf => {
  const content = fs.readFileSync(path.join('supabase/migrations', mf), 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('"Session"') || line.includes('public."Session"')) {
      console.log(`  ${mf}:${idx + 1}: ${line.trim()}`);
    }
  });
});
