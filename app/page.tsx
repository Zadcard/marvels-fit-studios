import Link from "next/link";

export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "24px",
        background: "#000",
        color: "#fff",
        fontFamily: "var(--font-body), Manrope, sans-serif",
        textAlign: "center",
        padding: "24px",
      }}
    >
      <img
        src="/img/Logo-2.png"
        alt="Marvel's Studios"
        style={{
          width: "80px",
          height: "80px",
          objectFit: "contain",
          filter: "brightness(2)",
        }}
      />
      <h1
        style={{
          fontFamily: "var(--font-display), Space Grotesk, sans-serif",
          fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
          letterSpacing: "-0.03em",
          lineHeight: 1.1,
        }}
      >
        Marvel&apos;s Studios
      </h1>
      <p style={{ color: "#a0a0a0", maxWidth: "40ch" }}>
        The public landing page is still served separately. This local bridge is
        here to preview the finished portal frontend routes during the current phase.
      </p>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          href="/login"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "48px",
            padding: "0 24px",
            borderRadius: "999px",
            background: "linear-gradient(135deg, #e62429 0%, #ff4f54 100%)",
            color: "#fff",
            fontSize: "0.82rem",
            fontWeight: 800,
            letterSpacing: "0.075em",
            textTransform: "uppercase",
            textDecoration: "none",
            boxShadow: "0 16px 30px rgba(230, 36, 41, 0.22)",
          }}
        >
          Login
        </Link>
        <Link
          href="/client"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "48px",
            padding: "0 24px",
            borderRadius: "999px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.04)",
            color: "#fff",
            fontSize: "0.82rem",
            fontWeight: 800,
            letterSpacing: "0.075em",
            textTransform: "uppercase",
            textDecoration: "none",
          }}
        >
          Client
        </Link>
        <Link
          href="/coach"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "48px",
            padding: "0 24px",
            borderRadius: "999px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.04)",
            color: "#fff",
            fontSize: "0.82rem",
            fontWeight: 800,
            letterSpacing: "0.075em",
            textTransform: "uppercase",
            textDecoration: "none",
          }}
        >
          Coach
        </Link>
        <Link
          href="/admin"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "48px",
            padding: "0 24px",
            borderRadius: "999px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.04)",
            color: "#fff",
            fontSize: "0.82rem",
            fontWeight: 800,
            letterSpacing: "0.075em",
            textTransform: "uppercase",
            textDecoration: "none",
          }}
        >
          Admin
        </Link>
      </div>
    </div>
  );
}
