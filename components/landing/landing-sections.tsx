/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

type ServiceCard = { id: string; icon: string; title: string; description: string };
type BenefitCard = { id: string; value: string; title: string; description: string; accent?: boolean };
type PlanCard = { id: string; tag: string; title: string; features: string[]; ctaLabel: string; buttonClassName: string; accent?: boolean };
type CoachCard = { id: string; mark: string; name: string; role: string; tags: string[] };
type ReviewCard = { id: string; quote: string; name: string; memberSince: string };

const serviceCards: ServiceCard[] = [
  { id: "group-training", icon: "01", title: "Group training", description: "High-energy sessions with coach attention, clear structure, and a stronger sense of accountability." },
  { id: "private-coaching", icon: "02", title: "Private coaching", description: "One-to-one coaching for members who want a more tailored path, more detailed feedback, and tighter support." },
  { id: "progress-tracking", icon: "03", title: "Progress tracking", description: "Your membership is backed by a dashboard that helps keep sessions, notes, and training visibility organized." },
  { id: "training-files", icon: "04", title: "Training files", description: "Coaches can share plans, guidance, and useful training material in a format that feels much easier to follow." },
];

const benefitCards: BenefitCard[] = [
  { id: "sessions-supported", value: "3k+", title: "Sessions supported", description: "Members train inside a system that is built to keep routines visible and easier to sustain." },
  { id: "sessions-per-month", value: "12", title: "Sessions every month", description: "A clearer monthly structure gives the membership real rhythm instead of vague attendance promises." },
  { id: "training-paths", value: "2", title: "Ways to train", description: "Choose between premium group sessions and private coaching without losing the same quality standard.", accent: true },
  { id: "follow-up", value: "24h", title: "Registration follow-up", description: "New registrations are treated as onboarding, with a faster, clearer next step after you apply." },
];

const planCards: PlanCard[] = [
  { id: "group-membership", tag: "Group membership", title: "Train with energy and consistency.", features: ["12 structured sessions per month", "Coach support in every class", "High-accountability training environment"], ctaLabel: "Register for Group Training", buttonClassName: "btn btn-secondary btn-plan" },
  { id: "private-coaching", tag: "Private coaching", title: "Choose a more tailored coaching experience.", features: ["One-to-one sessions built around your goals", "More focused progression and feedback", "Premium support for members who want extra guidance"], ctaLabel: "Register for Private Coaching", buttonClassName: "btn btn-primary btn-plan", accent: true },
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
  { id: "ahmed-review", quote: '"The coaches here do not let you drift. The whole experience feels more serious, more organized, and much easier to stay consistent with."', name: "Ahmed K.", memberSince: "Member since 2024" },
  { id: "sara-review", quote: '"Private coaching gave me much more clarity. My sessions feel intentional now, and I always know what I am working toward."', name: "Sara M.", memberSince: "Member since 2024" },
  { id: "mohamed-review", quote: '"Group training here has real structure. The energy is strong, but the coaching is what makes it feel genuinely high quality."', name: "Mohamed H.", memberSince: "Member since 2025" },
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
    <LandingCarouselSection id="services" titleId="services-title" eyebrow="What you get" title="Services designed to feel premium, clear, and easy to use." label="Membership features" trackClassName="carousel-track service-track" trackAriaLabel="Membership feature cards" prevAriaLabel="Show previous service cards" nextAriaLabel="Show next service cards">
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
    <LandingCarouselSection titleId="why-title" eyebrow="Why members prefer it" title="A calmer, more organized studio experience with higher standards." label="Studio benefits" trackClassName="carousel-track benefit-track" trackAriaLabel="Studio benefits" prevAriaLabel="Show previous benefits" nextAriaLabel="Show next benefits">
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
    <LandingCarouselSection id="reviews" titleId="reviews-title" eyebrow="Member feedback" title="What members notice once they train inside a better system." label="Testimonials" trackClassName="carousel-track review-track" trackAriaLabel="Review cards" prevAriaLabel="Show previous reviews" nextAriaLabel="Show next reviews">
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
          <p>We believe that training is a journey we share with our members to achieve ideal performance and get the best from physical systems, to regain health and enjoy life.</p>
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
            <a href="#about">About the Studio</a>
            <a href="#services">Membership Services</a>
            <a href="#coaches">Meet the Coaches</a>
            <Link href="/login">Member Portal</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
