/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";

import { LandingInteractions } from "@/components/landing/landing-interactions";
import {
  LandingBenefitsSection,
  LandingCoachesSection,
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

                  <form id="contactForm" className="contact-form" noValidate>
                    <div className="field-grid">
                      <label>
                        <span>Full name</span>
                        <input
                          className="field"
                          id="cf-name"
                          name="name"
                          type="text"
                          placeholder="Enter your full name"
                          autoComplete="name"
                          required
                        />
                      </label>
                      <label>
                        <span>Phone number</span>
                        <input
                          className="field"
                          id="cf-phone"
                          name="phone"
                          type="tel"
                          placeholder="+20 1XX XXX XXXX"
                          autoComplete="tel"
                          inputMode="tel"
                          enterKeyHint="next"
                          required
                        />
                      </label>
                    </div>
                    <label>
                      <span>Your question</span>
                      <textarea
                        className="field field-area"
                        id="cf-msg"
                        name="message"
                        placeholder="Tell us what you want help with"
                        enterKeyHint="send"
                      ></textarea>
                    </label>
                    <label className="consent-row" htmlFor="cf-privacy">
                      <input id="cf-privacy" name="privacy" type="checkbox" required />
                      <span>
                        I agree that Marvel&apos;s Studios may contact me regarding my
                        question.
                      </span>
                    </label>
                    <button className="btn btn-primary btn-submit" id="cf-submit" type="submit">
                      Submit
                    </button>
                    <p className="form-success" id="cf-success" role="alert" aria-live="polite">
                      Your request has been sent. The studio team will contact you
                      soon.
                    </p>

                    <div className="form-footer-social" aria-label="Studio social media">
                      <a
                        href="https://wa.me/201033724777"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="whatsapp-btn"
                        aria-label="Message Marvel's Studios on WhatsApp"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        <span>WhatsApp</span>
                      </a>

                      <a
                        href="https://www.instagram.com/marvelsfitstudios?igsh=aTZkZTRvNHE0azJj"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-btn social-btn-instagram"
                        aria-label="Follow Marvel's Studios on Instagram"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2m0 1.8A3.95 3.95 0 0 0 3.8 7.75v8.5A3.95 3.95 0 0 0 7.75 20.2h8.5a3.95 3.95 0 0 0 3.95-3.95v-8.5a3.95 3.95 0 0 0-3.95-3.95h-8.5M17.7 5.35a.95.95 0 1 1 0 1.9.95.95 0 0 1 0-1.9M12 6.85A5.15 5.15 0 1 1 6.85 12 5.16 5.16 0 0 1 12 6.85m0 1.8A3.35 3.35 0 1 0 15.35 12 3.35 3.35 0 0 0 12 8.65" />
                        </svg>
                        <span>Instagram</span>
                      </a>
                      <a
                        href="https://www.tiktok.com/@marvelsfitstudios"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-btn social-btn-tiktok"
                        aria-label="Follow Marvel's Studios on TikTok"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M14.5 3c.42 1.64 1.38 2.95 2.88 3.93 1.08.7 2.23 1.07 3.45 1.11v3.12a9.42 9.42 0 0 1-3.7-.74v5.86c0 1.56-.55 2.89-1.66 4-1.1 1.09-2.43 1.64-3.98 1.64s-2.88-.55-3.99-1.64A5.43 5.43 0 0 1 5.85 16.3c0-1.56.55-2.9 1.65-4 .99-.98 2.17-1.53 3.55-1.63v3.22a2.33 2.33 0 0 0-1.2.67c-.47.46-.7 1.03-.7 1.72 0 .69.23 1.26.7 1.73.47.47 1.05.7 1.74.7.68 0 1.26-.23 1.72-.7.47-.47.7-1.04.7-1.73V3h3.19Z" />
                        </svg>
                        <span>TikTok</span>
                      </a>
                      <a
                        href="https://www.facebook.com/share/1CP9fjSoF8/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-btn social-btn-facebook"
                        aria-label="Follow Marvel's Studios on Facebook"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M13.25 22v-8.03h2.7l.4-3.13h-3.1V8.84c0-.9.25-1.52 1.55-1.52h1.66V4.51c-.29-.04-1.27-.11-2.41-.11-2.39 0-4.03 1.46-4.03 4.14v2.3H7.3v3.13h2.72V22h3.23Z" />
                        </svg>
                        <span>Facebook</span>
                      </a>
                    </div>
                  </form>
                </div>
              </aside>
            </div>
          </section>
        </main>

        <footer className="site-footer">
          <div className="footer-grid">
            <div className="footer-col footer-col-brand">
              <img
                src="/img/Logo-1.png"
                alt="Marvel's Studios logo"
                className="footer-logo"
                width="160"
                loading="lazy"
              />
              <p>
                We believe that training is a journey we share with our members to
                achieve ideal performance and get the best from physical systems,
                to regain health and enjoy life.
              </p>
            </div>

            <div className="footer-col">
              <strong className="footer-heading">Contact Us</strong>
              <div className="footer-nav">
                <a href="tel:+201033724777" style={{ marginLeft: "-1px" }}>
                  +20 103 372 4777
                </a>
                <a href="mailto:info@marvelsfit.com" style={{ marginLeft: "3px" }}>
                  {" "}
                  Email us{" "}
                </a>
              </div>
              <button className="btn btn-primary footer-cta" type="button" data-scroll-to="#contact">
                BOOK A VISIT
              </button>
            </div>

            <div className="footer-col">
              <strong className="footer-heading">Quick Links</strong>
              <nav className="footer-nav">
                <a href="#about">About the Studio</a>
                <a href="#services">Membership Services</a>
                <a href="#coaches">Meet the Coaches</a>
                <Link href="/login">Member Portal</Link>
              </nav>
            </div>

            <div className="footer-col">
              <strong className="footer-heading">Find Us</strong>
              <div className="footer-location-list">
                <div className="footer-loc-item">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  <span>Giza, Egypt</span>
                </div>
                <div className="footer-loc-item">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                  </svg>
                  <span>Daily from 9 am to 10 pm</span>
                </div>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="footer-copyright">
              Marvel&apos;s Studios &copy; 2020 - All Rights Reserved
            </div>
            <div className="footer-social-circ">
              <a
                href="https://facebook.com/share/1CP9fjSoF8/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.25 22v-8.03h2.7l.4-3.13h-3.1V8.84c0-.9.25-1.52 1.55-1.52h1.66V4.51c-.29-.04-1.27-.11-2.41-.11-2.39 0-4.03 1.46-4.03 4.14v2.3H7.3v3.13h2.72V22h3.23Z" />
                </svg>
              </a>
              <a
                href="https://instagram.com/marvelsfitstudios"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2m0 1.8A3.95 3.95 0 0 0 3.8 7.75v8.5A3.95 3.95 0 0 0 7.75 20.2h8.5a3.95 3.95 0 0 0 3.95-3.95v-8.5a3.95 3.95 0 0 0-3.95-3.95h-8.5M17.7 5.35a.95.95 0 1 1 0 1.9.95.95 0 0 1 0-1.9M12 6.85A5.15 5.15 0 1 1 6.85 12 5.16 5.16 0 0 1 12 6.85m0 1.8A3.35 3.35 0 1 0 15.35 12 3.35 3.35 0 0 0 12 8.65" />
                </svg>
              </a>
              <a
                href="https://tiktok.com/@marvelsfitstudios"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14.5 3c.42 1.64 1.38 2.95 2.88 3.93 1.08.7 2.23 1.07 3.45 1.11v3.12a9.42 9.42 0 0 1-3.7-.74v5.86c0 1.56-.55 2.89-1.66 4-1.1 1.09-2.43 1.64-3.98 1.64s-2.88-.55-3.99-1.64A5.43 5.43 0 0 1 5.85 16.3c0-1.56.55-2.9 1.65-4 .99-.98 2.17-1.53 3.55-1.63v3.22a2.33 2.33 0 0 0-1.2.67c-.47.46-.7 1.03-.7 1.72 0 .69.23 1.26.7 1.73.47.47 1.05.7 1.74.7.68 0 1.26-.23 1.72-.7.47-.47.7-1.04.7-1.73V3h3.19Z" />
                </svg>
              </a>
              <a
                href="https://wa.me/201033724777"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            </div>
          </div>
        </footer>
      </div>
      <LandingInteractions />
    </>
  );
}
