import fs from 'fs';
import path from 'path';
import { chromium } from '@playwright/test';

async function buildPdfAndHtml() {
  const screenshotsDir = path.join(process.cwd(), 'presentation-output', 'screenshots');

  // Convert screenshot files to base64 data URIs so HTML is self-contained
  function getBase64Img(file) {
    const filePath = path.join(screenshotsDir, file);
    if (!fs.existsSync(filePath)) return '';
    const buf = fs.readFileSync(filePath);
    return `data:image/png;base64,${buf.toString('base64')}`;
  }

  const slidesData = [
    {
      type: 'title',
      category: 'SYSTEM VALUATION & OVERVIEW DOCUMENT',
      title: 'MARVEL FIT STUDIOS',
      subtitle: 'Operational & Financial Management Operating System',
      desc: 'Custom web-based operational platform engineered for fitness studios. Prepared for system pricing & commercial valuation assessment.',
      pills: ['Next.js 16.2 App Router', 'Supabase PostgreSQL', 'Role-Based Access', 'Financial Ledger', 'Clinical Injury Context']
    },
    {
      type: 'content',
      category: 'EXECUTIVE SUMMARY',
      title: '1. Unified Operating System Replacing Disconnected Tools',
      points: [
        { head: 'Fragmented Tools vs. One Workspace', body: 'Replaces scattered spreadsheets, WhatsApp groups, manual receipts, and notebook tracking with a single central platform.' },
        { head: 'Complete Operational Visibility', body: 'Provides live studio pulse, roster check-ins, automated renewal alerts, and audited daily cash movement.' },
        { head: 'Role-Tailored Security & Workspaces', body: 'Separate high-security Admin Command Center and Coach Workspaces ensuring data privacy and operational focus.' },
        { head: 'Turn-Key Production Readiness', body: 'Engineered with zero technical debt, complete test coverage, automated migrations, and enterprise-grade resilience.' }
      ],
      img: getBase64Img('dashboard.png')
    },
    {
      type: 'content',
      category: 'OPERATIONAL WORKSPACES',
      title: '2. Role-Based Workspaces: Admin & Coach Control Centers',
      points: [
        { head: 'Admin Command Center', body: 'Real-time studio stats, live floor pulse, pending trial actions, upcoming renewals, and cash ledger controls.' },
        { head: 'Coach Floor Workspace', body: 'Focused mobile & desktop view for coaches with assigned clients, roster check-in, and injury flags.' },
        { head: 'Strict Permission Boundaries', body: 'Coaches access only floor attendance and client medical context — administrative revenue data remains locked.' },
        { head: 'Instant Action Triggers', body: 'One-click attendance check-in, quick lead follow-ups, and direct WhatsApp client messaging.' }
      ],
      img: getBase64Img('coach-dashboard.png')
    },
    {
      type: 'content',
      category: 'LEAD MANAGEMENT',
      title: '3. Prospect Acquisition & Lead Conversion Pipeline',
      points: [
        { head: 'Structured Acquisition Funnel', body: 'Tracks leads through New → Trial Booked → Trial Done → Won / Lost conversion stages.' },
        { head: 'Trial Session Integration', body: 'Links prospective members directly to group trial sessions with automated outcome tracking.' },
        { head: 'Loss Reason Analytics', body: 'Captures detailed reasons for lost leads (location, timing, pricing) for business intelligence.' },
        { head: 'One-Click Lead Conversion', body: 'Converts successful trials into active client profiles and subscriptions seamlessly.' }
      ],
      img: getBase64Img('leads.png')
    },
    {
      type: 'content',
      category: 'CLIENT DOSSIERS',
      title: '4. Member Intelligence & Clinical Injury Prevention',
      points: [
        { head: '360-Degree Client Dossiers', body: 'Centralized member profiles containing membership history, assigned coach, category, and receipts.' },
        { head: 'Clinical Injury Flags', body: 'Real-time warning badges for ACL, meniscus, lumbar strains, and movement restrictions across all views.' },
        { head: 'Floor-Level Safety Rules', body: 'Ensures coaches and admins see injury notes directly on class rosters to prevent aggravated injury.' },
        { head: 'Direct Communication', body: 'Integrated WhatsApp link for instant client messaging directly from their dossier.' }
      ],
      img: getBase64Img('client-profile.png')
    },
    {
      type: 'content',
      category: 'SCHEDULING & ATTENDANCE',
      title: '5. Dynamic Weekly Scheduling & Roster Attendance',
      points: [
        { head: 'Multiple Schedule Views', body: 'Chronological Agenda, Week Cards, and Hourly Grid views tailored for high-volume studio scheduling.' },
        { head: 'Real-Time Live Status', body: 'Automated status badges indicating 🔴 Live Now, Upcoming, or Ended sessions based on Cairo time.' },
        { head: 'Granular Attendance States', body: 'Track Attended, Late, Missed, and Excused attendance with mandatory excuse notes.' },
        { head: 'Recurring Session Automation', body: 'Manage weekly group templates and generate recurring occurrences with exception handling.' }
      ],
      img: getBase64Img('schedule.png')
    },
    {
      type: 'content',
      category: 'SUBSCRIPTION MANAGEMENT',
      title: '6. Subscription Lifecycle & Automated Payment Ledger',
      points: [
        { head: 'Flexible Membership Plans', body: 'Supports Group, Private, and Hybrid subscription plans with session count limits.' },
        { head: 'Session Balance Tracking', body: 'Automatically decrements remaining sessions upon attendance check-in with low-balance alerts.' },
        { head: 'Subscription Controls', body: 'Full lifecycle actions: Pause, Resume, Cancel, and Renew subscriptions with date precision.' },
        { head: 'Auditable Digital Receipts', body: 'Generates branded digital receipts with unique receipt numbers and instant PDF export.' }
      ],
      img: getBase64Img('subscriptions.png')
    },
    {
      type: 'content',
      category: 'FINANCIAL ANALYTICS',
      title: '7. Financial Operations & Cash Movement Audit',
      points: [
        { head: 'Real-Time Cash Flow Ledger', body: 'Tracks cash-in receipts and categorised cash-out expenditures with net movement calculations.' },
        { head: 'Payment Method Breakdown', body: 'Monitors revenue distribution across InstaPay, Visa, Cash, and Bank Transfers.' },
        { head: 'Date Range Filtering', body: 'Filter financial reports by custom date ranges, weekly, monthly, or quarterly periods.' },
        { head: 'CSV Data Export', body: 'One-click export of complete financial ledgers for external accounting and tax compliance.' }
      ],
      img: getBase64Img('reports.png')
    },
    {
      type: 'grid',
      category: 'TECHNICAL ARCHITECTURE & SECURITY',
      title: '8. Full-Stack Next.js 16 App Router & Enterprise Security Stack',
      cards: [
        { head: 'Frontend & UI Framework', body: 'Next.js 16.2 App Router, React 18, TypeScript 5, Radix UI primitives, Lucide Icons, and 100% custom CSS token design system.' },
        { head: 'Database & Security Boundary', body: 'Supabase PostgreSQL database with Row Level Security (RLS), transactional RPC functions, and server-only service role boundary.' },
        { head: 'Auth & Access Control', body: 'Auth.js v5 JWT credentials authentication, bcrypt password hashing, forced password change flow, and strict role permissions.' },
        { head: 'Testing & Production Verification', body: 'Vitest unit & contract suites, Playwright E2E browser tests, ESLint, TypeScript checks, and automated Vercel deployment pipeline.' }
      ]
    },
    {
      type: 'grid',
      category: 'COMMERCIAL ASSET EVALUATION',
      title: '9. System Commercial Assets & Valuation Highlights',
      cards: [
        { head: 'Turn-Key Operational Product', body: 'Fully functional, production-ready fitness studio operating system ready for immediate commercial deployment.' },
        { head: 'Proprietary IP & Custom Code', body: '100% bespoke codebase (no generic templates), custom design system, and studio domain logic.' },
        { head: 'Scalable SaaS Architecture', body: 'Structured data model easily adaptable for multi-branch studio chains or SaaS multi-tenant licensing.' },
        { head: 'High Market Demand Domain', body: 'Solves high-friction daily operational challenges for fitness studios, gyms, and sports academies.' }
      ]
    }
  ];

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Marvel Fit Studios - System Overview Presentation</title>
  <style>
    @page {
      size: 16in 9in;
      margin: 0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #111111;
      color: #FFFFFF;
      -webkit-font-smoothing: antialiased;
    }
    .slide {
      width: 16in;
      height: 9in;
      page-break-after: always;
      position: relative;
      background: #111111;
      padding: 0.7in 0.9in;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .category {
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 2px;
      color: #E63946;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .title {
      font-size: 32px;
      font-weight: 800;
      color: #FFFFFF;
      margin-bottom: 24px;
      line-height: 1.2;
    }
    .title-slide-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      height: 100%;
    }
    .hero-brand {
      font-size: 48px;
      font-weight: 900;
      color: #E63946;
      letter-spacing: 4px;
      margin-bottom: 12px;
    }
    .hero-title {
      font-size: 36px;
      font-weight: 800;
      color: #FFFFFF;
      margin-bottom: 16px;
    }
    .hero-subtitle {
      font-size: 20px;
      color: #A0A0A0;
      max-width: 800px;
      line-height: 1.5;
      margin-bottom: 40px;
    }
    .pills-row {
      display: flex;
      gap: 16px;
      margin-bottom: 40px;
    }
    .pill {
      background: #1C1C1C;
      border: 1px solid #2D2D2D;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 700;
      color: #FFFFFF;
    }
    .footer-note {
      font-size: 14px;
      font-style: italic;
      color: #666666;
    }
    .content-body {
      display: grid;
      grid-template-columns: 5.2in 1fr;
      gap: 0.4in;
      flex: 1;
      align-items: center;
    }
    .points-card {
      background: #1C1C1C;
      border: 1px solid #2D2D2D;
      border-radius: 12px;
      padding: 32px;
      display: flex;
      flex-direction: column;
      gap: 24px;
      height: 100%;
      justify-content: center;
    }
    .point-item {}
    .point-head {
      font-size: 16px;
      font-weight: 800;
      color: #22C55E;
      margin-bottom: 6px;
    }
    .point-body {
      font-size: 13px;
      color: #A0A0A0;
      line-height: 1.5;
    }
    .screenshot-box {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #161616;
      border: 1px solid #2D2D2D;
      border-radius: 12px;
      overflow: hidden;
      padding: 8px;
    }
    .screenshot-box img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .grid-body {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-top: 10px;
    }
    .grid-card {
      background: #1C1C1C;
      border: 1px solid #2D2D2D;
      border-radius: 12px;
      padding: 32px;
    }
    .grid-card-head {
      font-size: 18px;
      font-weight: 800;
      color: #22C55E;
      margin-bottom: 12px;
    }
    .grid-card-head.val {
      color: #E63946;
    }
    .grid-card-body {
      font-size: 14px;
      color: #A0A0A0;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  ${slidesData.map(slide => {
    if (slide.type === 'title') {
      return `<div class="slide">
        <div class="title-slide-container">
          <div class="hero-brand">${slide.title}</div>
          <div class="hero-title">${slide.subtitle}</div>
          <div class="hero-subtitle">${slide.desc}</div>
          <div class="pills-row">
            ${slide.pills.map(p => `<div class="pill">${p}</div>`).join('')}
          </div>
          <div class="footer-note">Confidential — Prepared for System Pricing & Commercial Valuation Assessment</div>
        </div>
      </div>`;
    } else if (slide.type === 'content') {
      return `<div class="slide">
        <div class="category">${slide.category}</div>
        <div class="title">${slide.title}</div>
        <div class="content-body">
          <div class="points-card">
            ${slide.points.map(p => `<div class="point-item">
              <div class="point-head">${p.head}</div>
              <div class="point-body">${p.body}</div>
            </div>`).join('')}
          </div>
          <div class="screenshot-box">
            <img src="${slide.img}" alt="Screenshot" />
          </div>
        </div>
      </div>`;
    } else if (slide.type === 'grid') {
      const isVal = slide.category.includes('VALUATION') || slide.category.includes('COMMERCIAL');
      return `<div class="slide">
        <div class="category">${slide.category}</div>
        <div class="title">${slide.title}</div>
        <div class="grid-body">
          ${slide.cards.map(c => `<div class="grid-card">
            <div class="grid-card-head ${isVal ? 'val' : ''}">${c.head}</div>
            <div class="grid-card-body">${c.body}</div>
          </div>`).join('')}
        </div>
      </div>`;
    }
  }).join('\n')}
</body>
</html>`;

  const htmlPath = path.join(process.cwd(), 'presentation-output', 'index.html');
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log('HTML presentation saved to:', htmlPath);

  // Render to PDF using Playwright
  console.log('Rendering HTML slide deck to PDF using Playwright...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });
  
  const pdfPath = path.join(process.cwd(), 'presentation-output', 'Marvel-Fit-Studios-System-Overview.pdf');
  await page.pdf({
    path: pdfPath,
    width: '16in',
    height: '9in',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  await browser.close();
  console.log('PDF presentation successfully generated:', pdfPath);
}

buildPdfAndHtml().catch(err => {
  console.error('Error generating HTML/PDF presentation:', err);
  process.exit(1);
});
