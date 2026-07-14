import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase verification environment is incomplete.");

const supabase = createClient(url, key, { auth: { persistSession: false } });
const run = crypto.randomUUID();
const ids = {
  admin: `verify-admin-${run}`, coachUser: `verify-coach-user-${run}`,
  clientUser: `verify-client-user-${run}`, coach: `verify-coach-${run}`,
  client: `verify-client-${run}`, group: `verify-group-${run}`,
  plan: `verify-plan-${run}`, subscription: `verify-subscription-${run}`,
};

function isoHours(hours) { return new Date(Date.now() + hours * 3_600_000).toISOString(); }
function dateDays(days) { return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10); }
async function expectOk(promise, label) {
  const result = await promise;
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

let templateId;
let sessionId;
let paymentId;
try {
  await expectOk(supabase.from("User").insert([
    { id: ids.admin, email: `${run}@verify-admin.local`, role: "ADMIN", name: "Verification Admin" },
    { id: ids.coachUser, email: `${run}@verify-coach.local`, role: "COACH", name: "Verification Coach" },
    { id: ids.clientUser, email: `${run}@verify-client.local`, role: "CLIENT", name: "Verification Client" },
  ]), "users");
  await expectOk(supabase.from("Coach").insert({ id: ids.coach, userId: ids.coachUser, fullName: "Verification Coach" }), "coach");
  await expectOk(supabase.from("Group").insert({ id: ids.group, name: "Verification Group", coachId: ids.coach }), "group");
  await expectOk(supabase.from("Client").insert({ id: ids.client, userId: ids.clientUser, fullName: "Verification Client", groupId: ids.group }), "client");

  const template = await expectOk(supabase.from("RecurringSessionTemplate").insert({
    title: "Verification recurrence", type: "GROUP", coachId: ids.coach, groupId: ids.group,
    capacity: 8, weekday: new Date(`${dateDays(1)}T12:00:00Z`).getUTCDay(), localStartTime: "18:00",
    durationMinutes: 60, startsOn: dateDays(1), endsOn: dateDays(15), createdById: ids.admin,
  }).select("id").single(), "recurring template");
  templateId = template.id;
  const firstGeneration = await expectOk(supabase.rpc("generate_recurring_sessions", { p_template_id: templateId, p_through_date: dateDays(15) }), "first recurrence generation");
  const secondGeneration = await expectOk(supabase.rpc("generate_recurring_sessions", { p_template_id: templateId, p_through_date: dateDays(15) }), "idempotent recurrence generation");
  if (firstGeneration < 1 || secondGeneration !== 0) throw new Error("Recurring generation was not idempotent.");

  const reminderSession = await expectOk(supabase.from("TrainingSession").insert({
    title: "Verification reminder", type: "GROUP", status: "SCHEDULED",
    startsAt: isoHours(24), endsAt: isoHours(25), capacity: 8, coachId: ids.coach,
    groupId: ids.group, createdById: ids.admin,
  }).select("id").single(), "reminder session");
  sessionId = reminderSession.id;
  await expectOk(supabase.from("SessionBooking").insert({ trainingSessionId: sessionId, clientId: ids.client, status: "BOOKED" }), "booking");
  await expectOk(supabase.from("SubscriptionPlan").insert({ id: ids.plan, name: "Verification Plan", slug: `verify-${run}`, billingCycle: "MONTHLY", price: 1000 }), "plan");
  await expectOk(supabase.from("ClientSubscription").insert({ id: ids.subscription, clientId: ids.client, planId: ids.plan, status: "ACTIVE", startsAt: new Date().toISOString(), renewsAt: isoHours(168) }), "subscription");

  const firstNotifications = await expectOk(supabase.rpc("enqueue_studio_notifications", { p_now: new Date().toISOString() }), "first notification run");
  const secondNotifications = await expectOk(supabase.rpc("enqueue_studio_notifications", { p_now: new Date().toISOString() }), "idempotent notification run");
  if (firstNotifications !== 2 || secondNotifications !== 0) throw new Error(`Expected 2 then 0 notifications; got ${firstNotifications} then ${secondNotifications}.`);

  const payment = await expectOk(supabase.from("Payment").insert({ amount: 1000, currency: "EGP", clientId: ids.client, clientSubscriptionId: ids.subscription, note: "Verification payment" }).select("id").single(), "payment");
  paymentId = payment.id;
  const ledger = await expectOk(supabase.from("BillingLedgerEntry").select("receiptNumber, amount, type").eq("paymentId", paymentId).single(), "payment ledger");
  if (ledger.type !== "PAYMENT" || Number(ledger.amount) !== 1000 || !ledger.receiptNumber.startsWith("MFS-")) throw new Error("Payment ledger receipt is invalid.");

  console.log(JSON.stringify({ recurringOccurrences: firstGeneration, notifications: firstNotifications, receipt: ledger.receiptNumber }));
} finally {
  await supabase.from("Notification").delete().eq("recipientId", ids.clientUser);
  if (paymentId) await supabase.from("BillingLedgerEntry").delete().eq("paymentId", paymentId);
  if (paymentId) await supabase.from("Payment").delete().eq("id", paymentId);
  await supabase.from("ClientSubscription").delete().eq("id", ids.subscription);
  await supabase.from("SubscriptionPlan").delete().eq("id", ids.plan);
  await supabase.from("SessionBooking").delete().eq("trainingSessionId", sessionId ?? "");
  await supabase.from("TrainingSession").delete().eq("createdById", ids.admin);
  if (templateId) await supabase.from("RecurringSessionTemplate").delete().eq("id", templateId);
  await supabase.from("Client").delete().eq("id", ids.client);
  await supabase.from("Group").delete().eq("id", ids.group);
  await supabase.from("Coach").delete().eq("id", ids.coach);
  await supabase.from("User").delete().in("id", [ids.admin, ids.coachUser, ids.clientUser]);
}
