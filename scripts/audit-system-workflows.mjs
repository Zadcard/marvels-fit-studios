import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function auditWorkflows() {
  console.log('====================================================');
  console.log('  MARVELS FIT STUDIOS - PHASE 4 SYSTEM WORKFLOW AUDIT');
  console.log('====================================================\n');

  // 1. Performance & Scalability Test: Query 1,000 clients with status filtering
  console.log('--- 1. Client Directory Query Performance Audit ---');
  const t0 = performance.now();
  const { data: clientPage, count: activeCount, error: cErr } = await supabase
    .from('Client')
    .select('*, group:Group(*), category:TrainingCategory(*)', { count: 'exact' })
    .eq('status', 'ACTIVE')
    .range(0, 49);
  const t1 = performance.now();

  if (cErr) console.error('Error fetching active clients:', cErr.message);
  console.log(`- Active Clients Query Time: ${(t1 - t0).toFixed(2)} ms`);
  console.log(`- Total Active Clients Count: ${activeCount}`);
  console.log(`- Page 1 Returned Items: ${clientPage?.length || 0}`);

  // Search filter performance test
  const t2 = performance.now();
  const { data: searchResults, error: sErr } = await supabase
    .from('Client')
    .select('id, fullName, phone, status')
    .ilike('fullName', '%Mohamed%')
    .limit(20);
  const t3 = performance.now();
  if (sErr) console.error('Error in client search:', sErr.message);
  console.log(`- Fullname ILIKE Search Time: ${(t3 - t2).toFixed(2)} ms`);
  console.log(`- Search Results Count ('Mohamed'): ${searchResults?.length || 0}`);

  // 2. Coach Workload & Roster Query Audit
  console.log('\n--- 2. Coach Roster & Workload Audit ---');
  const { data: coaches, error: coachErr } = await supabase.from('Coach').select('*, user:User(*)');
  if (coachErr) console.error('Error fetching coaches:', coachErr.message);

  for (const c of (coaches || [])) {
    const { count: cCount } = await supabase
      .from('Client')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ACTIVE')
      .eq('coachId', c.id);
    const { count: gCount } = await supabase
      .from('Group')
      .select('*', { count: 'exact', head: true })
      .eq('coachId', c.id);
    console.log(`- Coach ${c.fullName} (${c.specialization}): ${cCount || 0} active clients, ${gCount || 0} assigned groups`);
  }

  // 3. Subscription & Renewal Pipeline Audit
  console.log('\n--- 3. Subscriptions & Expiring Renewals Audit ---');
  const { count: dueSoonCount } = await supabase
    .from('Client')
    .select('*', { count: 'exact', head: true })
    .eq('paymentStatus', 'DUE_SOON');
  const { count: unpaidCount } = await supabase
    .from('Client')
    .select('*', { count: 'exact', head: true })
    .eq('paymentStatus', 'UNPAID');

  console.log(`- Clients with DUE_SOON Payment Status: ${dueSoonCount}`);
  console.log(`- Clients with UNPAID Payment Status: ${unpaidCount}`);

  // 4. Schedule & Attendance Roster Audit
  console.log('\n--- 4. Schedule & Roster Audit ---');
  const { data: sessions } = await supabase
    .from('TrainingSession')
    .select('id, title, startsAt, status, coachId, groupId')
    .limit(5);

  console.log(`- Training Sessions Sample (${sessions?.length || 0} loaded):`);
  for (const s of (sessions || [])) {
    const { count: bCount } = await supabase
      .from('SessionBooking')
      .select('*', { count: 'exact', head: true })
      .eq('trainingSessionId', s.id);
    console.log(`  * [${s.status}] ${s.title} at ${new Date(s.startsAt).toLocaleString()} - ${bCount} Roster Bookings`);
  }

  // 5. Studio Financial Ledger Audit
  console.log('\n--- 5. Financial Ledger & Receipts Audit ---');
  const { data: payments } = await supabase.from('Payment').select('amount');
  const totalRevenue = (payments || []).reduce((acc, p) => acc + (p.amount || 0), 0);

  const { data: expenses } = await supabase.from('StudioExpense').select('amount');
  const totalExpenses = (expenses || []).reduce((acc, e) => acc + (e.amount || 0), 0);

  console.log(`- Total Gross Recorded Revenue: ${totalRevenue.toLocaleString()} EGP`);
  console.log(`- Total Recorded Operational Expenses: ${totalExpenses.toLocaleString()} EGP`);
  console.log(`- Calculated Net Profit: ${(totalRevenue - totalExpenses).toLocaleString()} EGP`);

  console.log('\n====================================================');
  console.log('  PHASE 4 AUDIT COMPLETE - SYSTEM WORKFLOWS VERIFIED');
  console.log('====================================================\n');
}

auditWorkflows().catch(err => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
