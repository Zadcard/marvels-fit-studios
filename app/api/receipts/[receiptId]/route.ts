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
    .select("id, receiptNumber, type, status, amount, currency, description, occurredAt, payment:Payment(method), client:Client(id,fullName,userId), subscription:ClientSubscription(plan:SubscriptionPlan(name))")
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
    const amount = new Intl.NumberFormat("en-US", { style: "currency", currency: data.currency }).format(Number(data.amount));
    const occurredAt = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeStyle: "short", timeZone: "Africa/Cairo" }).format(new Date(data.occurredAt));
    const paymentMethod = paymentMethodLabel(data.payment?.method);
    html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(data.receiptNumber)}</title><style>body{font:16px system-ui;max-width:720px;margin:48px auto;padding:24px;color:#171717}header{border-bottom:2px solid #e45f65;margin-bottom:32px}dl{display:grid;grid-template-columns:180px 1fr;gap:14px}dt{color:#666}dd{margin:0;font-weight:600}@media print{button{display:none}}</style></head><body><header><h1>Marvel Fitness Studio</h1><p>Payment receipt</p></header><dl><dt>Receipt</dt><dd>${escapeHtml(data.receiptNumber)}</dd><dt>Client</dt><dd>${escapeHtml(data.client.fullName)}</dd><dt>Plan</dt><dd>${escapeHtml(data.subscription?.plan.name ?? "Membership")}</dd><dt>Type</dt><dd>${escapeHtml(data.type)}</dd><dt>Status</dt><dd>${escapeHtml(data.status)}</dd><dt>Paid with</dt><dd>${escapeHtml(paymentMethod)}</dd><dt>Amount</dt><dd>${escapeHtml(amount)}</dd><dt>Date</dt><dd>${escapeHtml(occurredAt)}</dd><dt>Description</dt><dd>${escapeHtml(data.description)}</dd></dl><p><button onclick="window.print()">Print receipt</button></p></body></html>`;
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
