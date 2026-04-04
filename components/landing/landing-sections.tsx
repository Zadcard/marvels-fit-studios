/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

type ServiceCard = { id: string; icon: string; title: string; description: string };
type BenefitCard = { id: string; value: string; title: string; description: string; accent?: boolean };
type PlanCard = { id: string; tag: string; title: string; features: string[]; ctaLabel: string; buttonClassName: string; accent?: boolean };
type CoachCard = { id: string; mark: string; name: string; role: string; tags: string[] };
type ReviewCard = { id: string; quote: string; name: string; memberSince: string };

const serviceCards: ServiceCard[] = [
  { id: "group-training", icon: "01", title: "Group training", description: "High-energy sessions with coach attention and clear structure." },
  { id: "private-coaching", icon: "02", title: "Private coaching", description: "One-to-one coaching with more tailored support and feedback." },
  { id: "progress-tracking", icon: "03", title: "Progress tracking", description: "A member dashboard that keeps sessions and progress visible." },
  { id: "training-files", icon: "04", title: "Training files", description: "Plans and guidance shared in an easier format to follow." },
];

const benefitCards: BenefitCard[] = [
  { id: "sessions-supported", value: "3k+", title: "Sessions supported", description: "A system designed to keep routines visible and consistent." },
  { id: "sessions-per-month", value: "12", title: "Sessions every month", description: "A clear monthly rhythm built into the membership." },
  { id: "training-paths", value: "2", title: "Ways to train", description: "Choose group sessions or private coaching with the same quality standard.", accent: true },
  { id: "follow-up", value: "24h", title: "Registration follow-up", description: "A fast, clear next step after you apply." },
];

const planCards: PlanCard[] = [
  { id: "group-membership", tag: "Group membership", title: "Train with energy and consistency.", features: ["12 sessions each month", "Coach support in every class", "High-accountability environment"], ctaLabel: "Register for Group Training", buttonClassName: "btn btn-secondary btn-plan" },
  { id: "private-coaching", tag: "Private coaching", title: "Choose a more tailored coaching experience.", features: ["One-to-one sessions built around your goals", "More focused feedback", "Premium support with extra guidance"], ctaLabel: "Register for Private Coaching", buttonClassName: "btn btn-primary btn-plan", accent: true },
];

const coachCards: CoachCard[] = [
  { id: "ahmed-waheed", mark: "H", name: "Ahmed Waheed (Heda)", role: "Head Coach", tags: ["Strength", "Conditioning"] },
  { id: "hisham-mostafa", mark: "H", name: "Hisham Mostafa", role: "Performance Coach", tags: ["Muscle Gain", "Powerlifting"] },
  { id: "ahmed-farouk", mark: "F", name: "Ahmed Farouk", role: "Group Coach", tags: ["HIIT", "Fat Loss"] },
  { id: "youssef-abdelatif", mark: "Y", name: "Youssef Abdelatif", role: "Private Coach", tags: ["Mobility", "Endurance"] },
  { id: "abdullah-zaki", mark: "Z", name: "Abdullah Zaki", role: "Group Coach", tags: ["Cardio", "Core"] },
  { id: "reham-badawy", mark: "R", name: "Reham Badawy", role: "Private Coach", tags: ["Nutrition", "Technique"] },
];

const reviewCards: ReviewCard[] = [
  { id: "ahmed-review", quote: '"The coaches keep you focused. The whole experience feels more organized and easier to stay consistent with."', name: "Ahmed K.", memberSince: "Member since 2024" },
  { id: "sara-review", quote: '"Private coaching gave me clarity. My sessions feel intentional now."', name: "Sara M.", memberSince: "Member since 2024" },
  { id: "mohamed-review", quote: '"Group training has real structure. The coaching is what makes it feel high quality."', name: "Mohamed H.", memberSince: "Member since 2025" },
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
    <section className="section-shell section-grid" id={id} aria-labelledby={titleId}>
      <div className="section-heading split-heading">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h2 id={titleId}>{title}</h2>
        </div>
      </div>

      <div className="carousel-shell" data-carousel>
        <div className="carousel-header">
          <div>
            <p className="carousel-label">{label}</p>
          </div>
          <div className="carousel-controls">
            <button className="carousel-btn" type="button" data-carousel-prev aria-label={prevAriaLabel}>
              &larr;
            </button>
            <span className="carousel-status" data-carousel-status aria-live="polite"></span>
            <button className="carousel-btn" type="button" data-carousel-next aria-label={nextAriaLabel}>
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
    <header className="site-header">
      <nav className="site-nav" aria-label="Primary navigation">
        <a href="#main" className="brand" aria-label="Marvel's Studios home">
          <img src="/img/Logo-2.png" alt="Marvel's Studios logo" width="2000" height="748" sizes="(max-width: 640px) 42px, (max-width: 1024px) 52px, 58px" decoding="async" fetchPriority="high" />
          <span>Marvel&apos;s Studios</span>
        </a>

        <button className="nav-toggle" id="navToggle" type="button" aria-expanded="false" aria-controls="navLinks" aria-label="Toggle navigation">
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className="nav-links-wrap" id="navLinks">
          <a href="#about">About</a>
          <a href="#services">Services</a>
          <a href="#coaches">Coaches</a>
          <a href="#reviews">Reviews</a>
          <a href="#faq">FAQ</a>
          <a href="#contact">Contact</a>
          <button className="btn btn-primary nav-join-mobile" type="button" data-scroll-to="#contact">
            Join Now
          </button>
        </div>

        <div className="nav-actions">
          <Link href="/login" className="btn btn-outline" id="btnLogin">
            Login
          </Link>
          <button className="btn btn-primary" id="btnJoinNav" type="button" data-scroll-to="#contact">
            Join Now
          </button>
        </div>
      </nav>
    </header>
  );
}

export function LandingServicesSection() {
  return (
    <LandingCarouselSection id="services" titleId="services-title" eyebrow="What you get" title="Services built to feel clear and premium." label="Membership features" trackClassName="carousel-track service-track" trackAriaLabel="Membership feature cards" prevAriaLabel="Show previous service cards" nextAriaLabel="Show next service cards">
      {serviceCards.map((service) => (
        <article key={service.id} className="service-card panel">
          <span className="service-icon">{service.icon}</span>
          <h3>{service.title}</h3>
          <p>{service.description}</p>
        </article>
      ))}
    </LandingCarouselSection>
  );
}

export function LandingBenefitsSection() {
  return (
    <LandingCarouselSection titleId="why-title" eyebrow="Why members prefer it" title="A calmer studio experience with higher standards." label="Studio benefits" trackClassName="carousel-track benefit-track" trackAriaLabel="Studio benefits" prevAriaLabel="Show previous benefits" nextAriaLabel="Show next benefits">
      {benefitCards.map((benefit) => (
        <article key={benefit.id} className={benefit.accent ? "benefit-card panel panel-accent" : "benefit-card panel"} role="listitem">
          <strong>{benefit.value}</strong>
          <h3>{benefit.title}</h3>
          <p>{benefit.description}</p>
        </article>
      ))}
    </LandingCarouselSection>
  );
}

export function LandingPlansSection() {
  return (
    <LandingCarouselSection titleId="plans-title" eyebrow="Membership paths" title="Choose the format that matches how you want to train." label="Membership options" trackClassName="carousel-track plan-track" trackAriaLabel="Membership plans" prevAriaLabel="Show previous plans" nextAriaLabel="Show next plans">
      {planCards.map((plan) => (
        <article key={plan.id} className={plan.accent ? "plan-card panel panel-accent" : "plan-card panel"}>
          <div className="plan-top">
            <span className="plan-tag">{plan.tag}</span>
            <h3>{plan.title}</h3>
          </div>
          <ul className="plan-list">
            {plan.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
          <button className={plan.buttonClassName} type="button" data-scroll-to="#contact">
            {plan.ctaLabel}
          </button>
        </article>
      ))}
    </LandingCarouselSection>
  );
}

export function LandingCoachesSection() {
  return (
    <LandingCarouselSection id="coaches" titleId="coaches-title" eyebrow="Meet the coaches" title="Experienced trainers behind the studio standard." label="Coaching team" trackClassName="carousel-track coach-track" trackAriaLabel="Coach cards" prevAriaLabel="Show previous coaches" nextAriaLabel="Show next coaches">
      {coachCards.map((coach) => (
        <article key={coach.id} className="coach-card panel">
          <div className="coach-mark">{coach.mark}</div>
          <h3>{coach.name}</h3>
          <p className="coach-role">{coach.role}</p>
          <div className="coach-tags">
            {coach.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </article>
      ))}
    </LandingCarouselSection>
  );
}

export function LandingReviewsSection() {
  return (
    <LandingCarouselSection id="reviews" titleId="reviews-title" eyebrow="Member feedback" title="What members notice once the system gets better." label="Testimonials" trackClassName="carousel-track review-track" trackAriaLabel="Review cards" prevAriaLabel="Show previous reviews" nextAriaLabel="Show next reviews">
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
      <div className="footer-grid">
        <div className="footer-col footer-col-brand">
          <img src="/img/Logo-1.png" alt="Marvel's Studios logo" className="footer-logo" width="160" loading="lazy" />
          <p>We help members train with structure, progress, and a better daily experience.</p>
        </div>

        <div className="footer-col">
          <strong className="footer-heading">Contact Us</strong>
          <div className="footer-nav">
            <a href="tel:+201033724777" style={{ marginLeft: "-1px" }}>+20 103 372 4777</a>
            <a href="mailto:info@marvelsfit.com" style={{ marginLeft: "3px" }}> Email us </a>
          </div>
          <button className="btn btn-primary footer-cta" type="button" data-scroll-to="#contact">
            BOOK A VISIT
          </button>
        </div>

        <div className="footer-col">
          <strong className="footer-heading">Quick Links</strong>
          <nav className="footer-nav">
            <a href="#about">About</a>
            <a href="#services">Services</a>
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
          Marvel&apos;s Studios &copy; 2020. All rights reserved.
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
  );
}
