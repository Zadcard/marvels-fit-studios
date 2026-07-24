import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

// Shared password hash for staff accounts (Admins & Coaches)
const DEFAULT_PASSWORD = 'Password123!';
const PASSWORD_HASH = bcrypt.hashSync(DEFAULT_PASSWORD, 10);

async function runResetAndSeed() {
  console.log('====================================================');
  console.log('  MARVELS FIT STUDIOS - ADVANCED REALISTIC SEED (1,000 CLIENTS & 1,000+ SESSIONS)');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // PHASE 2: RESET EXISTING APPLICATION DATA
  // ----------------------------------------------------
  console.log('--- Phase 2: Clearing existing application data ---');

  const tablesToClear = [
    'SessionBooking',
    'SessionNote',
    'ScheduleChangeLog',
    'ScheduleChangeRequest',
    'TrainingSession',
    'RecurringSessionSlot',
    'RecurringSessionTemplate',
    'Receipt',
    'BillingLedgerEntry',
    'Payment',
    'ClientSubscription',
    'ClientCoachNote',
    'File',
    'Notification',
    'PasswordResetGrant',
    'StudioExpense',
    'StudioIncome',
    'Group',
    'Lead',
    'Client',
    'Coach',
    'User',
  ];

  for (const table of tablesToClear) {
    const { error } = await supabase.from(table).delete().gt('createdAt', '1970-01-01T00:00:00Z');
    if (error) {
      const { error: err2 } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (err2) console.log(`Clearing ${table}: ${err2.message}`);
      else console.log(`Cleared ${table}`);
    } else {
      console.log(`Cleared ${table}`);
    }
  }

  await supabase.from('CategorySupervisor').delete().neq('categoryId', '00000000-0000-0000-0000-000000000000');
  await supabase.from('CoachTrainingCategory').delete().neq('coachId', '00000000-0000-0000-0000-000000000000');
  await supabase.from('AuthThrottle').delete().neq('keyHash', 'nonexistent');
  await supabase.from('RateLimitBucket').delete().neq('keyHash', 'nonexistent');
  await supabase.from('SecurityEvent').delete().gt('createdAt', '1970-01-01T00:00:00Z');

  console.log('\n--- Phase 2 Data Reset Complete ---\n');

  // ----------------------------------------------------
  // PHASE 3: SEED ADMINS, COACHES, GROUPS & CLIENTS
  // ----------------------------------------------------
  console.log('--- Phase 3: Seeding Admins, Coaches, Groups & 1,000 Clients ---');

  // 1. Fetch Subscription Plans & Training Categories
  const { data: plans } = await supabase.from('SubscriptionPlan').select('*');
  const { data: categories } = await supabase.from('TrainingCategory').select('*');

  const catMap = {};
  (categories || []).forEach(c => {
    catMap[c.slug] = c.id;
  });

  const planGroup = plans?.find(p => p.slug === 'demo-group-monthly') || plans?.[0];
  const planLadies = plans?.find(p => p.slug === 'demo-ladies-monthly') || plans?.[0];
  const planAthlete = plans?.find(p => p.slug === 'demo-athlete-bundle') || plans?.[0];
  const planCalisthenics = plans?.find(p => p.slug === 'demo-calisthenics-monthly') || plans?.[0];

  // 2. Admins (2)
  console.log('Seeding 2 Staff Admins...');
  const admins = [
    { email: 'admin1@marvelsfit.com', name: 'Sarah Al-Sayed (Lead Admin)', role: 'ADMIN' },
    { email: 'admin2@marvelsfit.com', name: 'Karim El-Ghandour (Ops Admin)', role: 'ADMIN' },
  ];

  const adminUserRecords = [];
  for (const a of admins) {
    const { data: u, error } = await supabase
      .from('User')
      .insert({
        email: a.email,
        name: a.name,
        role: a.role,
        password: PASSWORD_HASH,
        mustChangePassword: false,
      })
      .select()
      .single();
    if (error) throw error;
    adminUserRecords.push(u);
  }
  console.log(`Created ${adminUserRecords.length} admin accounts.`);

  // 3. Coaches (6)
  console.log('Seeding 6 Staff Coaches...');
  const coachData = [
    { email: 'coach.ahmed@marvelsfit.com', name: 'Captain Ahmed Hassan', phone: '+201001112233', specialization: 'STRENGTH', catSlug: 'general-fitness', groupName: 'Morning Strength & Functional Core' },
    { email: 'coach.omar@marvelsfit.com', name: 'Coach Omar Abdel-Rahman', phone: '+201002223344', specialization: 'REHAB', catSlug: 'muscle-gain', groupName: 'Rehab & Joint Stability Group' },
    { email: 'coach.youssef@marvelsfit.com', name: 'Coach Youssef El-Shazly', phone: '+201003334455', specialization: 'FOOTBALL', catSlug: 'football', groupName: 'Pro Football Speed & Agility Squad' },
    { email: 'coach.nour@marvelsfit.com', name: 'Coach Nour El-Din', phone: '+201004445566', specialization: 'CONDITIONING', catSlug: 'fat-loss', groupName: 'Fat Loss HIIT & Shred Blitz' },
    { email: 'coach.ziad@marvelsfit.com', name: 'Coach Ziad Mansour', phone: '+201005556677', specialization: 'CALISTHENICS', catSlug: 'calisthenics', groupName: 'Calisthenics Skill & Mobility Lab' },
    { email: 'coach.mariam@marvelsfit.com', name: 'Coach Mariam Salem', phone: '+201006667788', specialization: 'TENNIS', catSlug: 'general-fitness', groupName: 'Ladies Functional Fitness & Agility' },
  ];

  const coachRecords = [];
  const groupRecords = [];

  for (let i = 0; i < coachData.length; i++) {
    const cd = coachData[i];
    const { data: u, error: uErr } = await supabase
      .from('User')
      .insert({
        email: cd.email,
        name: cd.name,
        role: 'COACH',
        password: PASSWORD_HASH,
        mustChangePassword: false,
      })
      .select()
      .single();
    if (uErr) throw uErr;

    const { data: c, error: cErr } = await supabase
      .from('Coach')
      .insert({
        userId: u.id,
        fullName: cd.name,
        phone: cd.phone,
        specialization: cd.specialization,
      })
      .select()
      .single();
    if (cErr) throw cErr;

    const catId = catMap[cd.catSlug] || Object.values(catMap)[0];
    if (catId) {
      await supabase.from('CoachTrainingCategory').insert({
        coachId: c.id,
        categoryId: catId,
      });
    }

    const { data: g, error: gErr } = await supabase
      .from('Group')
      .insert({
        name: cd.groupName,
        coachId: c.id,
        categoryId: catId,
        type: 'GROUP',
        isActive: true,
      })
      .select()
      .single();
    if (gErr) throw gErr;

    coachRecords.push({ ...c, name: cd.name, email: cd.email, categoryId: catId });
    groupRecords.push(g);
  }
  console.log(`Created ${coachRecords.length} coach accounts and ${groupRecords.length} training groups.`);

  // 4. Clients (1,000)
  console.log('Generating 1,000 realistic client profiles (minimal identity User, password = null)...');

  const firstNames = [
    'Mohamed', 'Ahmed', 'Youssef', 'Mahmoud', 'Tarek', 'Khaled', 'Omar', 'Amr', 'Hassan', 'Hussein',
    'Fatma', 'Nour', 'Aya', 'Sara', 'Mariam', 'Habiba', 'Dalia', 'Hana', 'Salma', 'Rania',
    'Karim', 'Mostafa', 'Sherif', 'Adel', 'Walid', 'Hany', 'Eslam', 'Aly', 'Nada', 'Yasmine'
  ];
  const lastNames = [
    'El-Din', 'Fahmy', 'Soliman', 'Nasser', 'Zaki', 'Amer', 'Moustafa', 'Said', 'Gamal', 'Ibrahim',
    'Nabil', 'Osama', 'Radwan', 'Hamdy', 'Shawky', 'Shokry', 'Ezzat', 'Haikal', 'Gaber', 'Sami'
  ];

  const clientStates = [
    { status: 'ACTIVE', paymentStatus: 'PAID', subStatus: 'ACTIVE', weight: 450 },
    { status: 'ACTIVE', paymentStatus: 'DUE_SOON', subStatus: 'ACTIVE', weight: 120 },
    { status: 'INACTIVE', paymentStatus: 'UNPAID', subStatus: 'EXPIRED', weight: 100 },
    { status: 'PAUSED', paymentStatus: 'PAID', subStatus: 'PAUSED', weight: 60 },
    { status: 'ACTIVE', paymentStatus: 'PAID', subStatus: 'ACTIVE', weight: 40 },
    { status: 'PENDING', paymentStatus: 'UNPAID', subStatus: 'QUEUED', weight: 80 },
    { status: 'TRIAL', paymentStatus: 'PAID', subStatus: 'TRIAL', weight: 50 },
    { status: 'DID_NOT_CONTINUE', paymentStatus: 'UNPAID', subStatus: 'CANCELED', weight: 50 },
    { status: 'INACTIVE', paymentStatus: 'PAID', subStatus: 'EXPIRED', weight: 50 },
  ];

  let totalWeight = 0;
  const weightedStates = clientStates.map(cs => {
    totalWeight += cs.weight;
    return { ...cs, cumulative: totalWeight };
  });

  function pickState(idx) {
    const val = (idx * 37) % totalWeight;
    return weightedStates.find(s => val < s.cumulative) || weightedStates[0];
  }

  const now = new Date();

  const BATCH_SIZE = 100;
  const TOTAL_CLIENTS = 1000;

  const allClients = [];

  for (let b = 0; b < TOTAL_CLIENTS; b += BATCH_SIZE) {
    const userBatch = [];
    for (let i = b; i < b + BATCH_SIZE && i < TOTAL_CLIENTS; i++) {
      const fn = firstNames[i % firstNames.length];
      const ln = lastNames[(i * 7) % lastNames.length];
      const name = `${fn} ${ln} #${i + 1}`;
      const email = `client${i + 1}@marvelsfit-demo.com`;

      // Password set to null: clients cannot log in interactively
      userBatch.push({
        email,
        name,
        role: 'CLIENT',
        password: null,
        mustChangePassword: false,
      });
    }

    const { data: createdUsers, error: uErr } = await supabase
      .from('User')
      .insert(userBatch)
      .select();
    if (uErr) throw uErr;

    const clientBatch = [];
    for (let i = 0; i < createdUsers.length; i++) {
      const globalIdx = b + i;
      const u = createdUsers[i];
      const stateObj = pickState(globalIdx);

      let coachIdx = 0;
      if (globalIdx % 10 === 1) coachIdx = 1;
      else if (globalIdx % 20 === 2 || globalIdx % 20 === 12) coachIdx = 2;
      else if (globalIdx % 4 === 3) coachIdx = 3;
      else if (globalIdx % 10 === 4) coachIdx = 4;
      else if (globalIdx % 10 === 5) coachIdx = 5;
      else coachIdx = (globalIdx % 2 === 0) ? 0 : 3;

      const coach = coachRecords[coachIdx];
      const group = groupRecords[coachIdx];

      let injuryStatus = 'NONE';
      let injuryNotes = null;
      if (coachIdx === 1 || globalIdx % 25 === 0) {
        injuryStatus = globalIdx % 2 === 0 ? 'REHAB' : 'CURRENT';
        injuryNotes = 'ACL reconstruction rehab - stage 2 stability protocol';
      }

      let sessionsLeft = 12;
      if (stateObj.status === 'INACTIVE') sessionsLeft = 0;
      else if (stateObj.paymentStatus === 'DUE_SOON') sessionsLeft = 1;
      else if (stateObj.status === 'PENDING' || stateObj.status === 'TRIAL') sessionsLeft = 1;
      else if (globalIdx % 15 === 0) sessionsLeft = 0;

      let trialOutcome = null;
      if (stateObj.status === 'DID_NOT_CONTINUE') trialOutcome = 'DID_NOT_CONTINUE';
      else if (stateObj.status === 'TRIAL') trialOutcome = 'FOLLOW_UP';

      clientBatch.push({
        userId: u.id,
        fullName: u.name,
        phone: `+2010${String(10000000 + globalIdx).slice(1)}`,
        status: stateObj.status,
        paymentStatus: stateObj.paymentStatus,
        groupId: group.id,
        categoryId: coach.categoryId,
        injuryStatus: injuryStatus,
        injuryNotes: injuryNotes,
        sessionsLeft: sessionsLeft,
        membershipType: globalIdx % 2 === 0 ? 'Group Monthly' : 'Private Athlete',
        isPaid: stateObj.paymentStatus === 'PAID',
        trainingCategory: 'GENERAL_FITNESS',
        trialOutcome: trialOutcome,
      });
    }

    const { data: createdClients, error: cErr } = await supabase
      .from('Client')
      .insert(clientBatch)
      .select();
    if (cErr) throw cErr;

    const subBatch = [];
    const payBatch = [];

    for (let i = 0; i < createdClients.length; i++) {
      const client = createdClients[i];
      const globalIdx = b + i;
      const stateObj = pickState(globalIdx);

      let plan = planGroup;
      if (globalIdx % 4 === 1) plan = planLadies;
      else if (globalIdx % 4 === 2) plan = planAthlete;
      else if (globalIdx % 4 === 3) plan = planCalisthenics;

      const startDate = new Date(now.getTime() - (globalIdx % 30 + 1) * 86400000);
      const endDate = new Date(startDate.getTime() + 30 * 86400000);

      const totalSess = plan.sessionsIncluded || 16;
      const usedSess = Math.max(0, totalSess - client.sessionsLeft);

      subBatch.push({
        clientId: client.id,
        planId: plan.id,
        status: stateObj.subStatus,
        startsAt: startDate.toISOString(),
        endsAt: endDate.toISOString(),
        sessionsTotal: totalSess,
        sessionsUsed: usedSess,
        cycleMonths: 1,
        customPrice: plan.price || 1400,
      });
    }

    const { data: createdSubs, error: sErr } = await supabase
      .from('ClientSubscription')
      .insert(subBatch)
      .select();
    if (sErr) throw sErr;

    for (let i = 0; i < createdClients.length; i++) {
      const client = createdClients[i];
      const sub = createdSubs[i];
      if (client.isPaid) {
        payBatch.push({
          clientId: client.id,
          clientSubscriptionId: sub.id,
          amount: sub.customPrice,
          currency: 'EGP',
          date: sub.startsAt.split('T')[0],
          method: 'CASH',
        });
      }
    }

    if (payBatch.length > 0) {
      const { error: pErr } = await supabase.from('Payment').insert(payBatch);
      if (pErr) throw pErr;
    }

    allClients.push(...createdClients);
    console.log(`Seeded batch ${b / BATCH_SIZE + 1} / 10 (${allClients.length} clients completed)`);
  }

  // ----------------------------------------------------
  // PHASE 5: REALISTIC SCHEDULE & ATTENDANCE DATASET
  // ----------------------------------------------------
  console.log('\n--- Phase 5: Generating 1,000+ Training Sessions & Roster Bookings (-45 to +45 Days) ---');

  const templateBatch = coachRecords.map((c, idx) => ({
    coachId: c.id,
    groupId: groupRecords[idx].id,
    dayOfWeek: (idx % 5) + 1,
    startTime: '10:00:00',
    durationMinutes: 60,
    isActive: true,
  }));

  await supabase.from('RecurringSessionTemplate').insert(templateBatch);

  // Generate sessions across 90 days (-45 to +45)
  // 6 coaches * 2 session slots per active day = 12 sessions/day * 90 = 1,080 Training Sessions!
  const sessionBatch = [];
  const startDay = -45;
  const endDay = 45;

  for (let dayOffset = startDay; dayOffset <= endDay; dayOffset++) {
    const sessionDate = new Date(now.getTime() + dayOffset * 86400000);

    for (let cIdx = 0; cIdx < coachRecords.length; cIdx++) {
      const coach = coachRecords[cIdx];
      const group = groupRecords[cIdx];

      // Slot 1: Morning session
      const sDate1 = new Date(sessionDate);
      sDate1.setHours(9 + (cIdx % 2), 0, 0, 0);
      const eDate1 = new Date(sDate1.getTime() + 3600000);

      // Slot 2: Evening session
      const sDate2 = new Date(sessionDate);
      sDate2.setHours(17 + (cIdx % 2), 0, 0, 0);
      const eDate2 = new Date(sDate2.getTime() + 3600000);

      let status1 = dayOffset < 0 ? 'COMPLETED' : (dayOffset === 0 ? 'COMPLETED' : 'SCHEDULED');
      let status2 = dayOffset < 0 ? 'COMPLETED' : 'SCHEDULED';

      if (dayOffset % 15 === 0 && dayOffset !== 0) {
        status2 = 'CANCELED';
      }

      sessionBatch.push({
        coachId: coach.id,
        createdById: adminUserRecords[0].id,
        groupId: group.id,
        startsAt: sDate1.toISOString(),
        endsAt: eDate1.toISOString(),
        status: status1,
        title: `${coachData[cIdx].groupName} Morning Session`,
        type: 'GROUP',
      });

      sessionBatch.push({
        coachId: coach.id,
        createdById: adminUserRecords[0].id,
        groupId: group.id,
        startsAt: sDate2.toISOString(),
        endsAt: eDate2.toISOString(),
        status: status2,
        title: `${coachData[cIdx].groupName} Evening Session`,
        type: 'GROUP',
      });
    }
  }

  // Insert sessions in batches of 200
  const createdSessions = [];
  for (let i = 0; i < sessionBatch.length; i += 200) {
    const chunk = sessionBatch.slice(i, i + 200);
    const { data: inserted, error: sErr } = await supabase
      .from('TrainingSession')
      .insert(chunk)
      .select();
    if (sErr) throw sErr;
    createdSessions.push(...inserted);
  }

  console.log(`Created ${createdSessions.length} training sessions across 90-day window.`);

  // Seed Session Bookings enforcing Critical Client Daily Limit (Max 1 active session per Cairo calendar day)
  console.log('Seeding attendance bookings (enforcing Cairo 1-session-per-day client limit)...');

  // Track booked client IDs per day string YYYY-MM-DD
  const clientDailyBookings = new Map(); // key: "clientId:YYYY-MM-DD" -> true

  const bookingBatch = [];

  for (let sIdx = 0; sIdx < createdSessions.length; sIdx++) {
    const sess = createdSessions[sIdx];
    if (sess.status === 'CANCELED') continue;

    // Determine Cairo calendar date for session
    const sessCairoDateStr = new Date(sess.startsAt).toISOString().split('T')[0];

    // Find clients assigned to this group
    const groupClients = allClients.filter(c => c.groupId === sess.groupId);

    let bookedInSession = 0;
    for (const client of groupClients) {
      if (bookedInSession >= 4) break; // 4 clients per session roster

      const dayKey = `${client.id}:${sessCairoDateStr}`;
      if (clientDailyBookings.has(dayKey)) {
        // Client already has a booking on this Cairo day -> skip to enforce limit
        continue;
      }

      let bStatus = 'BOOKED';
      let attAt = null;
      if (sess.status === 'COMPLETED') {
        if ((sIdx + bookedInSession) % 5 === 0) {
          bStatus = 'MISSED';
        } else if ((sIdx + bookedInSession) % 7 === 0) {
          bStatus = 'LATE';
          attAt = sess.startsAt;
        } else {
          bStatus = 'ATTENDED';
          attAt = sess.startsAt;
        }
      }

      bookingBatch.push({
        trainingSessionId: sess.id,
        clientId: client.id,
        status: bStatus,
        source: 'MANUAL',
        attendedAt: attAt,
      });

      clientDailyBookings.set(dayKey, true);
      bookedInSession++;
    }
  }

  // Insert bookings in chunks of 500
  let totalBookingsInserted = 0;
  for (let i = 0; i < bookingBatch.length; i += 500) {
    const chunk = bookingBatch.slice(i, i + 500);
    const { error: bErr } = await supabase.from('SessionBooking').insert(chunk);
    if (bErr) {
      console.log(`Notice during booking insert batch ${i}: ${bErr.message}`);
    } else {
      totalBookingsInserted += chunk.length;
    }
  }

  console.log(`Created ${totalBookingsInserted} roster attendance bookings.`);

  // 6. Seed Coach Notes & Studio Ledger Records
  console.log('Seeding coach notes, injury records, and studio ledger records...');
  const noteBatch = [];
  allClients.filter(c => c.injuryStatus !== 'NONE').slice(0, 30).forEach(c => {
    noteBatch.push({
      clientId: c.id,
      authorId: adminUserRecords[0].id,
      content: 'Rehab progress check: Patient demonstrating improved knee stability during single-leg landing drills.',
      isPrivate: true,
    });
  });
  if (noteBatch.length > 0) {
    await supabase.from('ClientCoachNote').insert(noteBatch);
  }

  await supabase.from('StudioExpense').insert([
    { amount: 4500, category: 'EQUIPMENT', description: 'New kettlebell sets and resistance bands', paidAt: now.toISOString() },
    { amount: 3200, category: 'MAINTENANCE', description: 'Studio HVAC and turf floor deep cleaning', paidAt: now.toISOString() },
  ]);

  console.log('\n====================================================');
  console.log('  SEED COMPLETE - VALIDATING DATABASE INTEGRITY');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // VALIDATION & INTEGRITY SUMMARY
  // ----------------------------------------------------
  const { count: totalAdmins } = await supabase.from('User').select('*', { count: 'exact', head: true }).eq('role', 'ADMIN');
  const { count: totalCoaches } = await supabase.from('Coach').select('*', { count: 'exact', head: true });
  const { count: totalClients } = await supabase.from('Client').select('*', { count: 'exact', head: true });
  const { count: totalSubscriptions } = await supabase.from('ClientSubscription').select('*', { count: 'exact', head: true });
  const { count: totalPayments } = await supabase.from('Payment').select('*', { count: 'exact', head: true });
  const { count: totalReceipts } = await supabase.from('Receipt').select('*', { count: 'exact', head: true });
  const { count: totalSessions } = await supabase.from('TrainingSession').select('*', { count: 'exact', head: true });
  const { count: totalBookings } = await supabase.from('SessionBooking').select('*', { count: 'exact', head: true });

  const { data: clientsByStatus } = await supabase.from('Client').select('status');
  const statusCounts = {};
  (clientsByStatus || []).forEach(c => {
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
  });

  console.log('--- SEED SUMMARY RESULTS ---');
  console.log(`- Total Admins: ${totalAdmins}`);
  console.log(`- Total Coaches: ${totalCoaches}`);
  console.log(`- Total Clients: ${totalClients}`);
  console.log(`- Total Subscriptions: ${totalSubscriptions}`);
  console.log(`- Total Payments: ${totalPayments}`);
  console.log(`- Total Receipts: ${totalReceipts}`);
  console.log(`- Total Training Sessions: ${totalSessions}`);
  console.log(`- Total Session Bookings: ${totalBookings}`);
  console.log('\n--- Client Status Distribution ---');
  console.table(statusCounts);
}

runResetAndSeed().catch(err => {
  console.error('Error during reset and seed:', err);
  process.exit(1);
});
