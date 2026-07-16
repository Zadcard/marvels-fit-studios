import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";

const services = [
  ["01", "Group training", "High-energy blocks with a coach tracking the room, the movement, and the standard."],
  ["02", "Private coaching", "One-to-one attention for sharper technique, specific goals, or a controlled return."],
  ["03", "Progress cockpit", "Your sessions, measurements, readiness, and coaching files in one member view."],
  ["04", "Training files", "Plans and guidance delivered in a format you can use beyond the studio floor."],
];

const reviews = [
  ["Ahmed K.", "The coaches keep you focused. The whole experience feels organized enough to stay consistent."],
  ["Sara M.", "Private coaching gave me clarity. My sessions feel intentional now."],
  ["Mohamed H.", "Group training has real structure. The coaching is what makes it feel high quality."],
];

export function LandingHeader() {
  return <header className="site-header"><nav className="site-nav" aria-label="Primary navigation">
    <a className="brand" href="#main" aria-label="Marvel's Fit Studios home"><Image src="/img/Logo-3.png" alt="Marvel's Fit Studios" width={96} height={48} priority /><span>Marvel&apos;s Fit Studios</span></a>
    <button className="nav-toggle" id="navToggle" type="button" aria-expanded="false" aria-controls="navLinks" aria-label="Toggle navigation"><span/><span/><span/></button>
    <div className="nav-links-wrap" id="navLinks"><a href="#about">Studio</a><a href="#services">Training</a><a href="#reviews">Proof</a><a href="#faq">Answers</a><Link href="/login" className="nav-login-mobile">Member login</Link></div>
    <div className="nav-actions"><Link href="/login" className="btn btn-quiet nav-login-desktop">Member login</Link><button className="btn btn-primary" type="button" data-open-join data-analytics-source="nav-desktop-cta">Join the studio <ArrowUpRight size={16}/></button></div>
  </nav></header>;
}

function CarouselControls() {
  return <div className="carousel-controls"><button className="carousel-btn" type="button" data-carousel-prev aria-label="Previous"><ArrowLeft/></button><span className="carousel-status" data-carousel-status aria-live="polite"/><button className="carousel-btn" type="button" data-carousel-next aria-label="Next"><ArrowRight/></button></div>;
}

export function LandingServicesSection() {
  return <section className="section-shell services-section" id="services" aria-labelledby="services-title"><div className="section-index"><span>02</span><p>The training system</p></div><div className="section-split"><div><div className="eyebrow">What membership unlocks</div><h2 id="services-title">Built around the work, not the noise.</h2></div><CarouselControls/></div><div className="carousel-shell" data-carousel><div className="carousel-track service-track" tabIndex={0} aria-label="Membership features">{services.map(([number,title,description])=><article className="service-card" key={number}><span>{number}</span><div><h3>{title}</h3><p>{description}</p></div><ArrowUpRight/></article>)}</div></div></section>;
}

export function LandingReviewsSection() {
  return <section className="reviews-section" id="reviews" aria-labelledby="reviews-title"><div className="section-shell"><div className="section-index section-index-light"><span>03</span><p>Member proof</p></div><div className="section-split"><div><div className="eyebrow">What changes first</div><h2 id="reviews-title">People feel the structure.</h2></div><CarouselControls/></div><div className="carousel-shell" data-carousel><div className="carousel-track review-track" tabIndex={0} aria-label="Member reviews">{reviews.map(([name,quote],index)=><article className="review-card" key={name}><span>0{index+1} / 03</span><blockquote>“{quote}”</blockquote><div><strong>{name}</strong><small>Marvel&apos;s member</small></div></article>)}</div></div></div></section>;
}

export function LandingFooter() {
  return <footer className="site-footer"><div className="footer-cta"><div className="eyebrow">Next intake</div><h2>Ready to train with direction?</h2><p>Request a place. The studio team will contact you to understand the goal and complete your access.</p><div><button className="btn btn-primary" type="button" data-open-join data-analytics-source="footer-primary-cta">Request membership <ArrowUpRight size={17}/></button><Link className="btn btn-footer" href="/login">Member login</Link></div></div><div className="footer-base"><div className="footer-brand"><Image src="/img/Logo-3.png" alt="Marvel's Fit Studios" width={94} height={47}/><span>Performance training<br/>Giza, Egypt</span></div><nav><a href="#about">Studio</a><a href="#services">Training</a><a href="#reviews">Proof</a><a href="#faq">Answers</a></nav><div className="footer-contact"><a href="tel:+201033724777">+20 103 372 4777</a><a href="https://wa.me/201033724777" target="_blank" rel="noreferrer">WhatsApp</a></div></div></footer>;
}
