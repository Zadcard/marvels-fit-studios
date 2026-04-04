/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";

import { LandingInteractions } from "@/components/landing/landing-interactions";
import { JoinNowForm } from "@/components/landing/join-now-form";
import {
  LandingBenefitsSection,
  LandingCoachesSection,
  LandingFooter,
  LandingHeader,
  LandingPlansSection,
  LandingReviewsSection,
  LandingServicesSection,
} from "@/components/landing/landing-sections";

import "./landing.css";

export const metadata: Metadata = {
  title: {
    absolute: "Marvel's Studios | Premium Performance Training in Giza",
  },
  description:
    "Marvel's Studios is a premium performance training studio in Giza, Egypt with group training, private coaching, expert trainers, and a structured membership experience.",
  openGraph: {
    title: "Marvel's Studios | Premium Performance Training in Giza",
    description:
      "Join a structured, premium training experience with expert coaches, private support, and measurable progress.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Marvel's Studios | Premium Performance Training in Giza",
    description:
      "Group training, private coaching, and a premium membership experience designed for real progress.",
  },
};

export default function LandingPage() {
  return (
    <>
      <div className="site-shell">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>

        <LandingHeader />

        <main id="main">
          <section className="hero section-shell" aria-labelledby="hero-title">
            <div className="hero-copy panel panel-soft">
              <div className="eyebrow">Premium performance training</div>
              <div className="hero-badges" aria-label="Studio highlights">
                <span>Giza, Egypt</span>
                <span>6 expert coaches</span>
                <span>Group and private</span>
              </div>
              <h1 id="hero-title">
                Train with more structure, better coaching, and clearer progress.
              </h1>
              <p className="hero-text">
                Marvel&apos;s Studios gives serious beginners and committed athletes a
                premium training experience that feels personal, organized, and
                built for measurable results.
              </p>
              <div className="hero-actions">
                <button
                  className="btn btn-primary btn-large"
                  id="btnJoinHero"
                  type="button"
                  data-scroll-to="#contact"
                >
                  Start Membership
                </button>
                <button
                  className="btn btn-secondary btn-large"
                  id="btnLearnMore"
                  type="button"
                >
                  Explore the Studio
                </button>
              </div>
            </div>
          </section>

          <section
            className="section-shell section-grid"
            id="about"
            aria-labelledby="about-title"
          >
            <div className="section-heading">
              <div className="eyebrow">About the studio</div>
              <h2 id="about-title">
                A modern membership experience built around coaching quality.
              </h2>
              <p>
                Marvel&apos;s Studios was created to give every member a better
                training environment: premium in feel, disciplined in structure,
                and clear in how progress is supported.
              </p>
            </div>

            <div className="about-layout">
              <article className="panel">
                <p>
                  We combine hands-on coaching, a more organized member journey,
                  and a strong standard for every session. That means less
                  confusion, less inconsistency, and more clarity around what your
                  training is actually doing.
                </p>
                <p>
                  Whether you choose group sessions or private coaching, the goal
                  is the same: make your routine easier to trust, easier to
                  follow, and easier to improve.
                </p>
              </article>

              <aside className="panel logo-panel" aria-label="Marvel's Studios mark">
                <img
                  src="/img/Logo-3.png"
                  alt="Marvel's Studios brand mark"
                  width="2000"
                  height="985"
                  sizes="(max-width: 640px) 180px, (max-width: 1024px) 220px, 260px"
                  loading="lazy"
                  decoding="async"
                />
              </aside>
            </div>
          </section>

          <LandingServicesSection />

          <LandingBenefitsSection />

          <section className="impact-band">
            <div className="impact-shell">
              <div className="impact-copy">
                <div className="eyebrow eyebrow-dark">Membership value</div>
                <h2>
                  More structure for your training. More confidence in your
                  progress.
                </h2>
                <p>
                  The studio experience is designed to feel premium from the first
                  click to the first session: clearer onboarding, stronger session
                  rhythm, and better support along the way.
                </p>
              </div>
              <div className="impact-grid" role="list" aria-label="Membership value cards">
                <article className="impact-card" role="listitem">
                  <h3>Clear onboarding</h3>
                  <p>
                    A smoother path to start your actual training, with stronger
                    guidance and cleaner next steps.
                  </p>
                </article>
                <article className="impact-card" role="listitem">
                  <h3>Smarter training</h3>
                  <p>
                    Programs designed to reduce fatigue, improve consistency, and
                    keep every session easier to sustain.
                  </p>
                </article>
                <article className="impact-card" role="listitem">
                  <h3>Smoother progress</h3>
                  <p>
                    Clearer coaching interactions keep the experience calmer and
                    more focused on your results.
                  </p>
                </article>
              </div>
            </div>
          </section>

          <LandingPlansSection />

          <LandingCoachesSection />

          <LandingReviewsSection />

          <section className="section-shell section-grid" id="faq" aria-labelledby="faq-title">
            <div className="section-heading split-heading">
              <div>
                <div className="eyebrow">Questions and contact</div>
                <h2 id="faq-title">Everything important, made clearer.</h2>
              </div>
            </div>

            <div className="support-layout">
              <div className="faq-list">
                <div className="faq-col">
                  <article className="faq-item panel">
                    <button
                      className="faq-question"
                      type="button"
                      aria-expanded="false"
                      aria-controls="faq-1"
                    >
                      How does the monthly membership work?
                      <span className="faq-icon" aria-hidden="true">
                        +
                      </span>
                    </button>
                    <div className="faq-answer" id="faq-1">
                      One membership covers 12 sessions each month. The structure
                      is designed to feel simple and predictable, with your
                      training activity easier to follow.
                    </div>
                  </article>
                  <article className="faq-item panel">
                    <button
                      className="faq-question"
                      type="button"
                      aria-expanded="false"
                      aria-controls="faq-2"
                    >
                      What happens if I miss a session?
                      <span className="faq-icon" aria-hidden="true">
                        +
                      </span>
                    </button>
                    <div className="faq-answer" id="faq-2">
                      If you miss a session for a valid reason, the team can
                      review it and help restore the right balance to your
                      membership where appropriate.
                    </div>
                  </article>
                </div>

                <div className="faq-col">
                  <article className="faq-item panel">
                    <button
                      className="faq-question"
                      type="button"
                      aria-expanded="false"
                      aria-controls="faq-3"
                    >
                      Is the studio right for beginners?
                      <span className="faq-icon" aria-hidden="true">
                        +
                      </span>
                    </button>
                    <div className="faq-answer" id="faq-3">
                      Yes. The environment is structured for both ambitious
                      beginners and experienced members, with coaching that meets
                      you at the right level.
                    </div>
                  </article>
                  <article className="faq-item panel">
                    <button
                      className="faq-question"
                      type="button"
                      aria-expanded="false"
                      aria-controls="faq-4"
                    >
                      How do I join?
                      <span className="faq-icon" aria-hidden="true">
                        +
                      </span>
                    </button>
                    <div className="faq-answer" id="faq-4">
                      <p>
                        Choose Join Now, complete the short registration form, and
                        the studio team will contact you within 24 hours to
                        confirm the next step.
                      </p>
                      <button
                        className="btn btn-primary btn-faq-cta"
                        type="button"
                        data-scroll-to="#contact"
                      >
                        Join Now
                      </button>
                    </div>
                  </article>
                </div>
              </div>

              <aside
                className="contact-panel panel panel-strong"
                id="contact"
                aria-labelledby="contact-title"
              >
                <div className="contact-split">
                  <div className="contact-info">
                    <div className="eyebrow">Contact the studio</div>
                    <h2 id="contact-title">
                      Ready to register or ask a question first?
                    </h2>
                    <p>
                      Use the registration flow if you are ready to join, or use
                      the contact form here if you want help choosing the right
                      training path.
                    </p>

                    <div className="contact-list" role="list" aria-label="Contact details">
                      <div className="contact-row" role="listitem">
                        <span className="contact-badge">Map</span>
                        <a
                          href="https://maps.app.goo.gl/iNgTgoWc1qBnxoVN8"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Giza, Egypt - View on Google Maps
                        </a>
                      </div>
                      <div className="contact-row" role="listitem">
                        <span className="contact-badge">Call</span>
                        <a href="tel:+201033724777">+20 103 372 4777</a>
                      </div>
                    </div>
                  </div>

                  <JoinNowForm />
                </div>
              </aside>
            </div>
          </section>
        </main>

        <LandingFooter />
      </div>
      <LandingInteractions />
    </>
  );
}
