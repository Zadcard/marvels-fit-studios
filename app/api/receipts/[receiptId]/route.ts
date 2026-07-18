import { requireUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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
  const user = await requireUser();
  const { receiptId } = await context.params;
  const { data, error } = await getSupabaseServerClient()
    .from("BillingLedgerEntry")
    .select("id, receiptNumber, type, status, amount, currency, description, occurredAt, payment:Payment(method), client:Client(fullName,userId), subscription:ClientSubscription(plan:SubscriptionPlan(name))")
    .eq("id", receiptId)
    .maybeSingle();
  if (error) throw error;
  if (!data || (user.role !== "ADMIN" && data.client.userId !== user.id)) {
    return new Response("Receipt not found.", { status: 404 });
  }

  const amount = new Intl.NumberFormat("en-US", { style: "currency", currency: data.currency }).format(Number(data.amount));
  const occurredAt = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeStyle: "short", timeZone: "Africa/Cairo" }).format(new Date(data.occurredAt));
  const paymentMethod = paymentMethodLabel(data.payment?.method);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(data.receiptNumber)}</title><style>body{font:16px system-ui;max-width:720px;margin:48px auto;padding:24px;color:#171717}header{border-bottom:2px solid #e45f65;margin-bottom:32px}dl{display:grid;grid-template-columns:180px 1fr;gap:14px}dt{color:#666}dd{margin:0;font-weight:600}@media print{button{display:none}}</style></head><body><header><h1>Marvel Fitness Studio</h1><p>Payment receipt</p></header><dl><dt>Receipt</dt><dd>${escapeHtml(data.receiptNumber)}</dd><dt>Client</dt><dd>${escapeHtml(data.client.fullName)}</dd><dt>Plan</dt><dd>${escapeHtml(data.subscription?.plan.name ?? "Membership")}</dd><dt>Type</dt><dd>${escapeHtml(data.type)}</dd><dt>Status</dt><dd>${escapeHtml(data.status)}</dd><dt>Paid with</dt><dd>${escapeHtml(paymentMethod)}</dd><dt>Amount</dt><dd>${escapeHtml(amount)}</dd><dt>Date</dt><dd>${escapeHtml(occurredAt)}</dd><dt>Description</dt><dd>${escapeHtml(data.description)}</dd></dl><p><button onclick="window.print()">Print receipt</button></p></body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "private, no-store" } });
}
