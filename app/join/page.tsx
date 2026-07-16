import { JoinForm } from "@/app/join/join-form";
import { RedlineAuthShell } from "@/components/auth/redline-auth-shell";
import "@/app/login/login.css";

export const metadata = {
  title: "Join Marvel Fitness Studios",
};

export default function JoinPage() {
  return (
    <RedlineAuthShell
      eyebrow="Membership intake"
      title="Ask for a place on the floor."
      note="Send the essentials. The studio team reviews every request before access is issued."
    >
      <JoinForm />
    </RedlineAuthShell>
  );
}
