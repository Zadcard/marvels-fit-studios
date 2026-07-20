import { getRouteUserOrNull } from "@/lib/auth/route-user";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validators/uuid";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character] ?? character);
}

function paymentMethodLabel(value: string | null | undefined) {
  switch (value) {
    case "INSTA_PAY":
      return "InstaPay";
    case "VISA":
      return "Visa";
    case "CASH":
      return "Cash";
    default:
      return "Not recorded";
  }
}

function billingCycleLabel(value: string | null | undefined, cycleMonths: number | null | undefined) {
  if (value === "WEEKLY") return "Weekly";
  if (cycleMonths && cycleMonths > 1) return "Quarterly";
  return "Monthly";
}

function trainingCategoryLabel(value: string | null | undefined) {
  if (!value) return "Not set";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function GET(
  _request: Request,
  context: RouteContext<"/api/receipts/[receiptId]">,
) {
  const user = await getRouteUserOrNull();
  if (!user) {
    return new Response("Unauthorized.", {
      status: 401,
      headers: { "cache-control": "private, no-store" },
    });
  }
  const { receiptId } = await context.params;
  if (!isUuid(receiptId)) {
    return new Response("Receipt not found.", { status: 404 });
  }
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("BillingLedgerEntry")
    .select("id, receiptNumber, type, status, amount, currency, description, occurredAt, payment:Payment(method), createdBy:User!BillingLedgerEntry_createdById_fkey(name), client:Client(id,fullName,phone,userId,trainingCategory,group:Group(name,coach:Coach(fullName))), subscription:ClientSubscription(startsAt,renewsAt,sessionsTotal,cycleMonths,plan:SubscriptionPlan(name,billingCycle))")
    .eq("id", receiptId)
    .maybeSingle();
  if (error) throw error;
  if (!data?.client || (user.role !== "ADMIN" && data.client.userId !== user.id)) {
    return new Response("Receipt not found.", { status: 404 });
  }

  // Receipts are persisted as strings in the Receipt table so the exact same
  // document can be shared later. Serve the stored copy when it exists.
  const stored = await supabase
    .from("Receipt")
    .select("content")
    .eq("billingLedgerEntryId", data.id)
    .maybeSingle();
  if (stored.error) throw stored.error;

  let html = stored.data?.content;
  if (!html) {
    const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "Africa/Cairo" });
    const amount = new Intl.NumberFormat("en-US", { style: "currency", currency: data.currency }).format(Number(data.amount));
    const occurredAt = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeStyle: "short", timeZone: "Africa/Cairo" }).format(new Date(data.occurredAt));
    const paymentMethod = paymentMethodLabel(data.payment?.method);
    const subscription = data.subscription;
    const billingCycle = billingCycleLabel(subscription?.plan.billingCycle, subscription?.cycleMonths);
    const sessionsPerMonth = subscription?.sessionsTotal != null ? `${subscription.sessionsTotal} / month` : "Not set";
    const subscriptionStart = subscription?.startsAt ? dateFormatter.format(new Date(subscription.startsAt)) : "—";
    const subscriptionEnd = subscription?.renewsAt ? dateFormatter.format(new Date(subscription.renewsAt)) : "—";
    const group = data.client.group?.name ?? "No group";
    const coach = data.client.group?.coach?.fullName ?? "Unassigned";
    const category = trainingCategoryLabel(data.client.trainingCategory);
    const creator = data.createdBy?.name ?? "System";
    const rows: Array<[string, string]> = [
      ["Receipt", data.receiptNumber],
      ["Client", data.client.fullName],
      ["Phone", data.client.phone ?? "Not recorded"],
      ["Plan", subscription?.plan.name ?? "Membership"],
      ["Billing", billingCycle],
      ["Sessions", sessionsPerMonth],
      ["Subscription start", subscriptionStart],
      ["Subscription end", subscriptionEnd],
      ["Group", group],
      ["Category", category],
      ["Coach", coach],
      ["Paid with", paymentMethod],
      ["Amount", amount],
      ["Payment date", occurredAt],
      ["Recorded by", creator],
      ["Description", data.description],
    ];
    const rowsHtml = rows
      .map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`)
      .join("");
    html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(data.receiptNumber)}</title><style>*{box-sizing:border-box}body{font:16px system-ui;max-width:720px;margin:48px auto;padding:24px;color:#171717;background:#fff}header{border-bottom:2px solid #e45f65;margin-bottom:32px}header h1{margin:0 0 4px}header p{margin:0;color:#666}dl{display:grid;grid-template-columns:180px 1fr;gap:12px 14px}dt{color:#666}dd{margin:0;font-weight:600}footer{margin-top:32px}@media print{body{margin:0;padding:16px}button{display:none}}</style></head><body><header><h1>Marvel Fitness Studio</h1><p>Payment receipt</p></header><dl>${rowsHtml}</dl><footer><button onclick="window.print()">Print receipt</button></footer></body></html>`;
    const persisted = await supabase.from("Receipt").upsert(
      {
        billingLedgerEntryId: data.id,
        receiptNumber: data.receiptNumber,
        clientId: data.client.id,
        content: html,
      },
      { onConflict: "billingLedgerEntryId" },
    );
    if (persisted.error) throw persisted.error;
  }

  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "private, no-store" } });
}
