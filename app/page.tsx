/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";

import { LandingInteractions } from "@/components/landing/landing-interactions";
import { LandingJoinModal } from "@/components/landing/landing-join-modal";
import {
  LandingFooter,
  LandingHeader,
  LandingReviewsSection,
  LandingServicesSection,
} from "@/components/landing/landing-sections";
import { LandingStructuredData } from "@/components/landing/landing-structured-data";

import "./landing.css";

export const metadata: Metadata = {
  title: {
    absolute: "Marvel's Fit Studios | Premium Performance Training in Giza",
  },
  description:
    "Marvel's Fit Studios is a premium performance training studio in Giza, Egypt with group training, private coaching, expert trainers, and a structured membership experience.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Marvel's Fit Studios | Premium Performance Training in Giza",
    description:
      "Join a structured, premium training experience with expert coaches, private support, and measurable progress.",
    type: "website",
    url: "/",
    siteName: "Marvel's Fit Studios",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Marvel's Fit Studios | Premium Performance Training in Giza",
    description:
      "Group training, private coaching, and a premium membership experience designed for real progress.",
  },
};

export default function LandingPage() {
  return (
    <>
      <LandingStructuredData />
      <div className="site-shell">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>

        <LandingHeader />

        <main id="main">
          <section className="hero section-shell" aria-labelledby="hero-title">
            <div className="hero-layout">
              <div className="hero-copy">
                <div className="eyebrow">Premium performance training</div>
                <div className="hero-badges" aria-label="Studio highlights">
                  <span>Giza, Egypt</span>
                  <span>3k+ sessions</span>
                  <span>Group and private</span>
                </div>
                <h1 id="hero-title" className="landing-title">
                  Train with structure,{" "}
                  <span className="hero-h1-dim">better coaching,</span>
                  {" "}and clear progress.
                </h1>
                <p className="hero-text">
                  Marvel&apos;s Fit Studios gives beginners and committed athletes a
                  premium training experience built around clarity and results.
                </p>
                <div className="hero-actions">
                  <button
                    className="btn btn-primary btn-large"
                    id="btnJoinHero"
                    type="button"
                    data-open-join
                    data-analytics-source="hero-primary-cta"
                  >
                    Start Membership
                  </button>
                </div>
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
              <h2 id="about-title" className="landing-title">
                A membership built around coaching quality.
              </h2>
              <p>
                Marvel&apos;s Fit Studios was built to make training feel more
                organized, more personal, and easier to trust.
              </p>
            </div>

            <div className="about-layout">
              <article className="panel">
                <p>
                  We combine hands-on coaching with a cleaner member journey and
                  a higher standard for every session.
                </p>
              </article>

              <aside
                className="panel logo-panel"
                aria-label="Marvel's Fit Studios mark"
              >
                <img
                  src="/img/Logo-3.png"
                  alt="Marvel's Fit Studios brand mark"
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

          <div className="impact-band">
            <LandingReviewsSection />
          </div>

          <section
            className="section-shell section-grid"
            id="faq"
            aria-labelledby="faq-title"
          >
            <div className="section-heading split-heading">
              <div>
                <div className="eyebrow">Common questions</div>
                <h2 id="faq-title" className="landing-title">
                  Everything important, made clear.
                </h2>
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
                      One membership covers 12 sessions each month. The
                      structure is designed to feel simple and predictable, with
                      your training activity easier to follow.
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
                      beginners and experienced members, with coaching that
                      meets you at the right level.
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
                        Open the join form and share your details. The studio
                        team will contact you within 24 hours.
                      </p>
                      <button
                        className="btn btn-primary btn-faq-cta"
                        type="button"
                        data-open-join
                        data-analytics-source="faq-answer-cta"
                      >
                        Join Now
                      </button>
                    </div>
                  </article>
                </div>
              </div>
            </div>
          </section>
        </main>

        <LandingFooter />
      </div>
      <LandingJoinModal />
      <LandingInteractions />
    </>
  );
}
