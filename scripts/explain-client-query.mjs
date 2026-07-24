import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function explainQuery() {
  console.log('--- Benchmarking Client Directory Query Performance ---');
  
  // Cold run
  const t0 = performance.now();
  const res1 = await supabase
    .from('Client')
    .select('*, group:Group(*)', { count: 'exact' })
    .eq('status', 'ACTIVE')
    .range(0, 49);
  const t1 = performance.now();
  
  // Warm runs
  const warmTimes = [];
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    await supabase
      .from('Client')
      .select('*, group:Group(*)', { count: 'exact' })
      .eq('status', 'ACTIVE')
      .range(0, 49);
    warmTimes.push(performance.now() - start);
  }

  const median = warmTimes.sort((a, b) => a - b)[Math.floor(warmTimes.length / 2)];

  console.log(`- Cold Execution Time: ${(t1 - t0).toFixed(2)} ms`);
  console.log(`- Warm Execution Times (5 runs): ${warmTimes.map(t => t.toFixed(2) + 'ms').join(', ')}`);
  console.log(`- Median Warm Latency: ${median.toFixed(2)} ms`);
  console.log(`- Total Records Returned: ${res1.data?.length} (out of ${res1.count} active clients)`);
}

explainQuery().catch(console.error);
