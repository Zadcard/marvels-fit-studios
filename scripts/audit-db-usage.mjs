import fs from 'fs';
import path from 'path';

const migrationFiles = fs.readdirSync('supabase/migrations').filter(f => f.endsWith('.sql'));
const candidates = ['Account', 'AuthThrottle', 'RateLimitBucket', 'SecurityEvent', 'SessionCompensation', 'VerificationToken'];

console.log('=== CANDIDATE UNUSED TABLES IN MIGRATIONS ===');

candidates.forEach(t => {
  console.log(`\n--- TABLE: ${t} ---`);
  let totalOccurrences = 0;
  migrationFiles.forEach(mf => {
    const content = fs.readFileSync(path.join('supabase/migrations', mf), 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes(`"${t}"`) || line.includes(`public.${t}`)) {
        totalOccurrences++;
        console.log(`  ${mf}:${idx + 1}: ${line.trim()}`);
      }
    });
  });
  if (totalOccurrences === 0) {
    console.log(`  (No exact table references found)`);
  }
});
