import { JoinForm } from "@/app/join/join-form";
import "@/app/login/login.css";

export const metadata = {
  title: "Join Marvel Fitness Studios",
};

export default function JoinPage() {
  return (
    <main className="login-page">
      <div className="login-container">
        <JoinForm />
      </div>
    </main>
  );
}
