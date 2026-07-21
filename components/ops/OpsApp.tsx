"use client";
import { OpsProvider, useOps } from "@/lib/ops/store";
import type { OpsInitial } from "@/lib/ops/live";
import Login from "./Login";
import Shell from "./Shell";

function Gate() {
  const v = useOps();
  return v.isAuthed ? <Shell /> : <Login />;
}

export default function OpsApp({ initial }: { initial?: OpsInitial }) {
  return (
    <OpsProvider initial={initial}>
      <Gate />
    </OpsProvider>
  );
}
