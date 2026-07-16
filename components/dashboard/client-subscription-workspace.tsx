import {
  ArrowUpRight,
  CalendarDays,
  Check,
  CreditCard,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import type { ClientSubscriptionRecord } from "@/lib/dashboard/client-dashboard-data";
import styles from "./client-subscription-workspace.module.css";

type Props = { data: ClientSubscriptionRecord };

function statusTone(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("active") || normalized === "paid") return "good";
  if (normalized.includes("pending")) return "watch";
  return "neutral";
}

export function ClientSubscriptionWorkspace({ data }: Props) {
  const benefitsCount = data.benefits.length;

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <span className={styles.kicker}>My membership</span>
          <h1>Know what you own.</h1>
          <p>
            Your access, renewal timing and payment record—without billing
            clutter or hidden conditions.
          </p>
        </div>
        <div className={styles.heroMark} aria-hidden="true">
          <CreditCard />
        </div>
      </header>

      <section className={styles.pass}>
        <div className={styles.passTop}>
          <div>
            <span>Marvel&apos;s Fit Studios</span>
            <strong>Member pass</strong>
          </div>
          <span data-tone={statusTone(data.status)}>{data.status}</span>
        </div>
        <div className={styles.passBody}>
          <div>
            <span>Current plan</span>
            <h2>{data.planName}</h2>
            <p>{data.note}</p>
          </div>
          <div className={styles.price}>
            <strong>{data.amountLabel}</strong>
            <span>/ {data.billingCycle}</span>
          </div>
        </div>
        <div className={styles.passFoot}>
          <div>
            <CalendarDays size={17} />
            <span>
              Renewal
              <strong>{data.renewalDate}</strong>
            </span>
          </div>
          <div>
            <ShieldCheck size={17} />
            <span>
              Payment state
              <strong data-tone={statusTone(data.paymentStatus)}>
                {data.paymentStatus}
              </strong>
            </span>
          </div>
          <div>
            <Check size={17} />
            <span>
              Included
              <strong>{benefitsCount} benefits</strong>
            </span>
          </div>
        </div>
      </section>

      <section className={styles.detailGrid}>
        <article className={styles.benefits}>
          <header className={styles.sectionHead}>
            <div>
              <span className={styles.kicker}>Access manifest</span>
              <h2>What this plan unlocks</h2>
            </div>
            <span>{String(benefitsCount).padStart(2, "0")}</span>
          </header>
          <ol>
            {data.benefits.map((benefit, index) => (
              <li key={benefit}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{benefit}</strong>
                <Check size={16} />
              </li>
            ))}
          </ol>
        </article>

        <aside className={styles.renewal}>
          <span className={styles.kicker}>Next billing checkpoint</span>
          <CalendarDays size={26} />
          <h2>{data.renewalDate}</h2>
          <p>
            The studio team manages plan changes and renewals. Your current
            access remains visible here as soon as the record changes.
          </p>
          <dl>
            <div>
              <dt>Cycle</dt>
              <dd>{data.billingCycle}</dd>
            </div>
            <div>
              <dt>Expected amount</dt>
              <dd>{data.amountLabel}</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className={styles.ledger}>
        <header className={styles.sectionHead}>
          <div>
            <span className={styles.kicker}>Payment ledger</span>
            <h2>Receipts, not mysteries</h2>
            <p>Your latest recorded membership payments.</p>
          </div>
          <ReceiptText size={22} />
        </header>

        {data.paymentHistory.length ? (
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Reference</th>
                  <th>Note</th>
                  <th aria-label="Receipt" />
                </tr>
              </thead>
              <tbody>
                {data.paymentHistory.map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.dateLabel}</td>
                    <td>
                      <strong>{payment.amountLabel}</strong>
                    </td>
                    <td>{payment.receiptNumber}</td>
                    <td>{payment.note}</td>
                    <td>
                      {payment.receiptHref ? (
                        <Link href={payment.receiptHref} target="_blank">
                          Receipt <ArrowUpRight size={15} />
                        </Link>
                      ) : (
                        <span>Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.empty}>
            <ReceiptText size={26} />
            <div>
              <strong>No payments recorded yet</strong>
              <p>
                The first recorded payment and its receipt will appear here
                automatically.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
