// add-6-sessions.mjs  – raw fetch, no schema cache
const SUPABASE_URL = "https://ggrddqflqumokoyzpjic.supabase.co";
const SERVICE_ROLE_KEY = "sb_secret_dqW6hSAzp6vEIyPscxuaAA_ZQ7Nv6iE";

function cairoToUTC(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h - 3, m)).toISOString();
}

const sessions = [
  { id: "demo-session-burning-today",        title: "Burning Class",          description: "Conditioning circuit.", type: "GROUP", status: "SCHEDULED", startsAt: cairoToUTC("08:00"), endsAt: cairoToUTC("09:00"), location: "Main floor",   coachId: "demo-coach-nour",    groupId: "demo-group-burning",       createdById: "demo-user-admin", sourceTemplateId: "00000000-0000-4000-8000-000000000102" },
  { id: "demo-session-ladies-today",         title: "Ladies Class",           description: "Strength & mobility.", type: "GROUP", status: "SCHEDULED", startsAt: cairoToUTC("10:00"), endsAt: cairoToUTC("11:00"), location: "Main floor",   coachId: "demo-coach-mariam",  groupId: "demo-group-ladies",        createdById: "demo-user-admin", sourceTemplateId: "00000000-0000-4000-8000-000000000103" },
  { id: "demo-session-calisthenics-morning", title: "Morning Calisthenics",   description: "Bodyweight skill.",    type: "GROUP", status: "SCHEDULED", startsAt: cairoToUTC("10:00"), endsAt: cairoToUTC("11:00"), location: "Rig zone",     coachId: "demo-coach-khaled",  groupId: "demo-group-calisthenics",  createdById: "demo-user-admin", sourceTemplateId: null },
  { id: "demo-session-athlete-today",        title: "Athlete Conditioning",   description: "Speed & direction.",   type: "GROUP", status: "SCHEDULED", startsAt: cairoToUTC("18:30"), endsAt: cairoToUTC("19:30"), location: "Outdoor zone", coachId: "demo-coach-youssef", groupId: "demo-group-athlete",       createdById: "demo-user-admin", sourceTemplateId: "00000000-0000-4000-8000-000000000104" },
  { id: "demo-session-power-today",          title: "Evening Powerlifting",   description: "Heavy compounds.",     type: "GROUP", status: "SCHEDULED", startsAt: cairoToUTC("18:30"), endsAt: cairoToUTC("19:30"), location: "Main floor",   coachId: "demo-coach-ahmed",   groupId: "demo-group-strength",      createdById: "demo-user-admin", sourceTemplateId: null },
  { id: "demo-session-calisthenics-today",   title: "Calisthenics",           description: "Movement skill.",      type: "GROUP", status: "SCHEDULED", startsAt: cairoToUTC("20:00"), endsAt: cairoToUTC("21:00"), location: "Rig zone",     coachId: "demo-coach-khaled",  groupId: "demo-group-calisthenics",  createdById: "demo-user-admin", sourceTemplateId: "00000000-0000-4000-8000-000000000105" },
];

const res = await fetch(`${SUPABASE_URL}/rest/v1/TrainingSession`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
    "Prefer": "resolution=merge-duplicates,return=minimal",
  },
  body: JSON.stringify(sessions),
});

if (!res.ok) {
  const body = await res.text();
  console.error(`❌ ${res.status} ${res.statusText}\n${body}`);
} else {
  console.log("✅ 6 sessions upserted for today:");
  sessions.forEach(s => console.log(`   • ${s.startsAt.slice(11,16)} UTC — ${s.title}`));
}
