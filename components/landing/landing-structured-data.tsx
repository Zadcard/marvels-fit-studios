import { absoluteUrl, siteConfig, siteUrl } from "@/lib/site";

/**
 * schema.org structured data for the public landing page. Improves local
 * discoverability (Google rich results / knowledge panel) for the studio.
 * Kept factual — no fabricated address, phone, or ratings.
 */
const faqs: Array<{ question: string; answer: string }> = [
  {
    question: "How does the monthly membership work?",
    answer:
      "One membership covers 12 sessions each month. The structure is designed to feel simple and predictable, with your training activity easier to follow.",
  },
  {
    question: "What happens if I miss a session?",
    answer:
      "If you miss a session for a valid reason, the team can review it and help restore the right balance to your membership where appropriate.",
  },
  {
    question: "Is the studio right for beginners?",
    answer:
      "Yes. The environment is structured for both ambitious beginners and experienced members, with coaching that meets you at the right level.",
  },
  {
    question: "How do I join?",
    answer:
      "Open the join form and share your details. The studio team will contact you within 24 hours.",
  },
];

export function LandingStructuredData() {
  const graph = [
    {
      "@type": "HealthClub",
      "@id": `${siteUrl}/#studio`,
      name: siteConfig.name,
      description: siteConfig.description,
      url: siteUrl,
      image: absoluteUrl(siteConfig.logoPath),
      logo: absoluteUrl(siteConfig.logoPath),
      address: {
        "@type": "PostalAddress",
        addressLocality: siteConfig.locality,
        addressRegion: siteConfig.region,
        addressCountry: siteConfig.country,
      },
      areaServed: {
        "@type": "City",
        name: siteConfig.locality,
      },
      sport: "Fitness",
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: siteConfig.name,
      url: siteUrl,
      publisher: { "@id": `${siteUrl}/#studio` },
    },
    {
      "@type": "FAQPage",
      "@id": `${siteUrl}/#faq`,
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": graph,
  };

  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe to inline; no user-controlled data here.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
