export type ClientSubscriptionRecord = {
  planName: string;
  status: "Active";
  paymentStatus: "Paid";
  renewalDate: string;
  amountLabel: string;
  billingCycle: string;
  benefits: string[];
  note: string;
};

export const clientSubscriptionRecord: ClientSubscriptionRecord = {
  planName: "Hybrid Elite",
  status: "Active",
  paymentStatus: "Paid",
  renewalDate: "Apr 28, 2026",
  amountLabel: "EGP 3,400",
  billingCycle: "Monthly",
  benefits: [
    "Unlimited group sessions in your assigned training level",
    "One private progress review each week",
    "Coach follow-up notes across the current training cycle",
  ],
  note: "Current membership summary and billing state.",
};
