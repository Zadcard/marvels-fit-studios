import type { Metadata } from "next";
import { ArrowDownRight, ArrowUpRight, Dumbbell, Gauge, Users } from "lucide-react";
import { LandingInteractions } from "@/components/landing/landing-interactions";
import { LandingJoinModal } from "@/components/landing/landing-join-modal";
import { LandingFooter, LandingHeader, LandingReviewsSection, LandingServicesSection } from "@/components/landing/landing-sections";
import { LandingStructuredData } from "@/components/landing/landing-structured-data";
import "./landing.css";

export const metadata: Metadata = {
  title: { absolute: "Marvel's Fit Studios | Performance Training in Giza" },
  description: "Structured group training and private coaching in Giza, Egypt — built around clear progress and expert attention.",
  alternates: { canonical: "/" },
};

const faqs = [
  ["How does membership work?", "One membership covers 12 focused sessions each month, with your schedule, coaching notes, and progress kept in one clear system."],
  ["What if I miss a session?", "The studio team reviews valid cases and helps restore the correct session balance where appropriate."],
  ["Is it built for beginners?", "Yes. Coaching meets you at your current level, then gives you a clear progression instead of throwing you into a generic workout."],
  ["How do I join?", "Send your name and phone number. The studio reviews the request and contacts you to complete the next step."],
];

export default function LandingPage() {
  return <>
    <LandingStructuredData />
    <div className="site-shell">
      <a className="skip-link" href="#main">Skip to main content</a>
      <LandingHeader />
      <main id="main">
        <section className="hero section-shell" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow">Performance training / Giza</div>
            <h1 id="hero-title">Train like the plan matters.</h1>
            <p>Expert coaching, visible progress, and a studio system that tells you exactly what comes next.</p>
            <div className="hero-actions">
              <button className="btn btn-primary btn-large" type="button" data-open-join data-analytics-source="hero-primary-cta">Request membership <ArrowUpRight size={17} /></button>
              <button className="btn btn-quiet" id="btnLearnMore" type="button">See the system <ArrowDownRight size={17} /></button>
            </div>
          </div>
          <aside className="hero-command" aria-label="Studio training model">
            <div className="hero-command-head"><span>Studio operating model</span><strong>01</strong></div>
            <div className="hero-command-main"><Dumbbell size={26} /><h2>12 sessions.<br />One clear direction.</h2><p>Group energy with coaching decisions that still belong to you.</p></div>
            <div className="hero-command-foot"><span>Monthly structure</span><span>Progress visible</span></div>
          </aside>
          <div className="hero-metrics">
            <div><Users /><strong>Small groups</strong><span>Attention stays personal</span></div>
            <div><Gauge /><strong>Measured progress</strong><span>No guesswork between sessions</span></div>
            <div><Dumbbell /><strong>Private support</strong><span>When the goal needs more focus</span></div>
          </div>
        </section>

        <section className="section-shell about-section" id="about" aria-labelledby="about-title">
          <div className="section-index"><span>01</span><p>The studio</p></div>
          <div className="about-manifesto">
            <div className="eyebrow">Not a room full of equipment</div>
            <h2 id="about-title">A coaching system built to keep people moving.</h2>
          </div>
          <div className="about-grid">
            <article className="about-card about-card-dark"><span>Coach attention</span><strong>Human decisions over random workouts.</strong><p>Your plan changes because your performance changes.</p></article>
            <article className="about-card"><span>Member clarity</span><strong>Every rep has context.</strong><p>See sessions, files, coaching notes, and progress in one place.</p></article>
            <article className="about-card about-card-red"><span>Consistency</span><strong>Structure you can actually repeat.</strong><p>Twelve focused sessions create a rhythm that survives busy weeks.</p></article>
          </div>
        </section>

        <LandingServicesSection />
        <LandingReviewsSection />

        <section className="section-shell faq-section" id="faq" aria-labelledby="faq-title">
          <div className="section-index"><span>04</span><p>The essentials</p></div>
          <div className="faq-heading"><div className="eyebrow">Before you step in</div><h2 id="faq-title">Clear answers. No sales fog.</h2></div>
          <div className="faq-list">{faqs.map(([question, answer], index) => <article className="faq-item" key={question}><button className="faq-question" type="button" aria-expanded="false" aria-controls={`faq-${index + 1}`}><span>{String(index + 1).padStart(2,"0")}</span>{question}<b aria-hidden="true">+</b></button><div className="faq-answer" id={`faq-${index + 1}`}>{answer}</div></article>)}</div>
        </section>
      </main>
      <LandingFooter />
    </div>
    <LandingJoinModal />
    <LandingInteractions />
  </>;
}
