"use client";
import { useOps } from "@/lib/ops/store";
import { css } from "@/lib/ops/css";
import s from "./Login.module.css";

export default function Login() {
  const v = useOps();
  return (
    <div className={s.wrap}>
      {/* left brand panel */}
      <div className={s.brand}>
        <div className={s.brandTop}>
          <div className={s.logo}>M</div>
          <div className={s.brandName}>
            <strong>Marvel Fit Studios</strong>
            <span>6th of October · Operations</span>
          </div>
        </div>
        <div className={s.brandMid}>
          <div className={s.kicker}>Internal operations system</div>
          <h1 className={s.h1}>Run the studio, not the spreadsheet.</h1>
          <p className={s.lede}>
            One calm, fast place for attendance, schedules, renewals and cash — for admins and coaches.
            Sign in to pick up your day.
          </p>
        </div>
        <div className={s.brandFoot}>
          <span>Attendance</span><span>Schedule</span><span>Subscriptions</span><span>Reports</span>
        </div>
      </div>

      {/* right form panel */}
      <div className={s.formPanel}>
        <div className={s.formInner}>
          <h2 className={s.h2}>Sign in</h2>
          <p className={s.sub}>Welcome back. Choose your role and continue.</p>

          <div className={s.roles}>
            {v.loginRoles.map((r: any) => (
              <button key={r.label} className={s.roleBtn} style={css(r.style)} onClick={r.pick}>
                <span className={s.roleLabel}>{r.label}</span>
                <span className={s.roleHint}>{r.hint}</span>
              </button>
            ))}
          </div>

          <label className={s.label}>Email</label>
          <input type="text" className={s.input} value={v.loginEmail} onChange={v.setLoginEmail} placeholder="you@marvelfit.eg" />

          <label className={s.label}>Password</label>
          <input type="password" className={s.input} value={v.loginPassword} onChange={v.setLoginPassword} placeholder="••••••••" />

          {v.loginError ? (
            <div className={s.error}><span>⚠</span>{v.loginError}</div>
          ) : null}

          <div className={s.rowBetween}>
            <label className={s.remember}><input type="checkbox" defaultChecked />Remember me</label>
            <span className={s.forgot}>Forgot password?</span>
          </div>

          <button className={s.signIn} onClick={v.signIn}>Sign in as {v.loginRoleLabel}</button>

          <p className={s.demo}>
            Demo · admin@marvelfit.eg / marvel2026<br />
            coach — ahmed.waheed@marvelfit.eg / coach2026
          </p>
          <p className={s.legal}>Staff access only · Marvel Fit Studios © 2026</p>
        </div>
      </div>
    </div>
  );
}
