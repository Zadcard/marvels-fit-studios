/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import { BrandLockup } from "@/components/ui/brand-lockup";

type ServiceCard = {
  id: string;
  icon: string;
  title: string;
  description: string;
};

type ReviewCard = {
  id: string;
  quote: string;
  name: string;
  memberSince: string;
};

const serviceCards: ServiceCard[] = [
  {
    id: "group-training",
    icon: "01",
    title: "Group training",
    description:
      "High-energy sessions with coach attention and clear structure.",
  },
  {
    id: "private-coaching",
    icon: "02",
    title: "Private coaching",
    description: "One-to-one coaching with more tailored support and feedback.",
  },
  {
    id: "progress-tracking",
    icon: "03",
    title: "Progress tracking",
    description: "A member dashboard that keeps sessions and progress visible.",
  },
  {
    id: "training-files",
    icon: "04",
    title: "Training files",
    description: "Plans and guidance shared in an easier format to follow.",
  },
];

const reviewCards: ReviewCard[] = [
  {
    id: "ahmed-review",
    quote:
      '"The coaches keep you focused. The whole experience feels more organized and easier to stay consistent with."',
    name: "Ahmed K.",
    memberSince: "Member since 2024",
  },
  {
    id: "sara-review",
    quote:
      '"Private coaching gave me clarity. My sessions feel intentional now."',
    name: "Sara M.",
    memberSince: "Member since 2024",
  },
  {
    id: "mohamed-review",
    quote:
      '"Group training has real structure. The coaching is what makes it feel high quality."',
    name: "Mohamed H.",
    memberSince: "Member since 2025",
  },
];

type LandingCarouselSectionProps = {
  id?: string;
  titleId: string;
  eyebrow: string;
  title: string;
  label: string;
  trackClassName: string;
  trackAriaLabel: string;
  prevAriaLabel: string;
  nextAriaLabel: string;
  children: React.ReactNode;
};

function LandingCarouselSection(props: LandingCarouselSectionProps) {
  const {
    id,
    titleId,
    eyebrow,
    title,
    label,
    trackClassName,
    trackAriaLabel,
    prevAriaLabel,
    nextAriaLabel,
    children,
  } = props;

  return (
    <section
      className="section-shell section-grid"
      id={id}
      aria-labelledby={titleId}
    >
      <div className="section-heading split-heading">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h2 id={titleId} className="landing-title">
            {title}
          </h2>
        </div>
      </div>

      <div className="carousel-shell" data-carousel>
        <div className="carousel-header">
          <div>
            <p className="carousel-label">{label}</p>
          </div>
          <div className="carousel-controls">
            <button
              className="carousel-btn"
              type="button"
              data-carousel-prev
              aria-label={prevAriaLabel}
            >
              &larr;
            </button>
            <span
              className="carousel-status"
              data-carousel-status
              aria-live="polite"
            />
            <button
              className="carousel-btn"
              type="button"
              data-carousel-next
              aria-label={nextAriaLabel}
            >
              &rarr;
            </button>
          </div>
        </div>

        <div className={trackClassName} tabIndex={0} aria-label={trackAriaLabel}>
          {children}
        </div>
      </div>
    </section>
  );
}

export function LandingHeader() {
  return (
    <>
      <header className="site-header">
        <nav className="site-nav" aria-label="Primary navigation">
          <a
            href="#main"
            className="brand"
            aria-label="Marvel's Fit Studios home"
          >
            <BrandLockup
              size="compact"
              priority
              imageAlt="Marvel's Fit Studios logo"
            />
          </a>

          <button
            className="nav-toggle"
            id="navToggle"
            type="button"
            aria-expanded="false"
            aria-controls="navLinks"
            aria-label="Toggle navigation"
          >
            <span />
            <span />
            <span />
          </button>

          <div className="nav-links-wrap" id="navLinks">
            <a href="#about">About</a>
            <a href="#services">Services</a>
            <a href="#reviews">Reviews</a>
            <a href="#faq">FAQ</a>
            <Link href="/login" className="btn btn-nav-login nav-login-mobile">
              Login
            </Link>
            <button
              className="btn btn-primary nav-join-mobile"
              type="button"
              data-open-join
              data-analytics-source="nav-mobile-cta"
            >
              Join Now
            </button>
          </div>

          <div className="nav-actions">
            <Link
              href="/login"
              className="btn btn-nav-login nav-login-desktop"
              id="btnLogin"
            >
              Login
            </Link>
            <button
              className="btn btn-primary"
              id="btnJoinNav"
              type="button"
              data-open-join
              data-analytics-source="nav-desktop-cta"
            >
              Join Now
            </button>
          </div>
        </nav>
      </header>
    </>
  );
}

export function LandingServicesSection() {
  return (
    <LandingCarouselSection
      id="services"
      titleId="services-title"
      eyebrow="What you get"
      title="Services built to feel clear and premium."
      label="Membership features"
      trackClassName="carousel-track service-track"
      trackAriaLabel="Membership feature cards"
      prevAriaLabel="Show previous service cards"
      nextAriaLabel="Show next service cards"
    >
      {serviceCards.map((service) => (
        <article key={service.id} className="service-card panel">
          <span className="service-icon">{service.icon}</span>
          <h3 className="landing-title">{service.title}</h3>
          <p>{service.description}</p>
        </article>
      ))}
    </LandingCarouselSection>
  );
}

export function LandingReviewsSection() {
  return (
    <LandingCarouselSection
      id="reviews"
      titleId="reviews-title"
      eyebrow="Member feedback"
      title="What members notice once the system gets better."
      label="Testimonials"
      trackClassName="carousel-track review-track"
      trackAriaLabel="Review cards"
      prevAriaLabel="Show previous reviews"
      nextAriaLabel="Show next reviews"
    >
      {reviewCards.map((review) => (
        <article key={review.id} className="review-card panel">
          <div className="review-stars" aria-label="5 out of 5 stars">
            &#9733;&#9733;&#9733;&#9733;&#9733;
          </div>
          <p>{review.quote}</p>
          <div className="review-person">
            <strong>{review.name}</strong>
            <span>{review.memberSince}</span>
          </div>
        </article>
      ))}
    </LandingCarouselSection>
  );
}

export function LandingFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-cta-band">
        <img
          src="/img/Logo-1.png"
          alt="Marvel's Fit Studios"
          className="footer-cta-logo"
          width="220"
          loading="lazy"
        />
        <h2 className="footer-cta-title landing-title">
          Ready to Start Training?
        </h2>
        <p className="footer-cta-desc">
          Join Marvel&apos;s Fit Studios for structured coaching, clear progress,
          and a premium training experience in Giza.
        </p>
        <div className="footer-cta-actions">
          <button
            className="btn btn-primary"
            type="button"
            data-open-join
            data-analytics-source="footer-primary-cta"
          >
            Start Membership
          </button>
          <Link href="/login" className="btn btn-secondary">
            Member Login
          </Link>
        </div>
      </div>

      <div className="footer-rule" aria-hidden="true" />

      <div className="footer-grid">
        <div className="footer-col footer-col-brand">
          <div className="footer-brand">
            <BrandLockup
              size="compact"
              eyebrow="Premium performance training"
              imageAlt="Marvel's Fit Studios logo"
            />
          </div>
          <p>Premium performance training in Giza, Egypt.</p>
        </div>

        <div className="footer-col">
          <strong className="footer-heading">Training</strong>
          <nav className="footer-nav">
            <a href="#services">Group Training</a>
            <a href="#services">Private Coaching</a>
            <a href="#services">Progress Tracking</a>
          </nav>
        </div>

        <div className="footer-col">
          <strong className="footer-heading">Studio</strong>
          <nav className="footer-nav">
            <a href="#about">About</a>
            <a href="#reviews">Reviews</a>
            <a href="#faq">FAQ</a>
          </nav>
        </div>

        <div className="footer-col">
          <strong className="footer-heading">Connect</strong>
          <div className="footer-nav">
            <a href="tel:+201033724777">+20 103 372 4777</a>
            <a
              href="https://maps.app.goo.gl/iNgTgoWc1qBnxoVN8"
              target="_blank"
              rel="noopener noreferrer"
            >
              Giza, Egypt
            </a>
            <button
              className="footer-link-button"
              type="button"
              data-open-join
              data-analytics-source="footer-link-cta"
            >
              Start Membership
            </button>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-copyright">
          Marvel&apos;s Fit Studios &copy; 2020. All rights reserved.
        </div>
        <div className="footer-social-circ">
          <a
            href="https://facebook.com/share/1CP9fjSoF8/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="footer-social-link footer-social-link-facebook"
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
            className="footer-social-link footer-social-link-instagram"
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
            className="footer-social-link footer-social-link-tiktok"
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
            className="footer-social-link footer-social-link-whatsapp"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
