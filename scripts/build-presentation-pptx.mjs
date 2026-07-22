import pptxgen from 'pptxgenjs';
import path from 'path';

async function buildPresentation() {
  const pptx = new pptxgen();

  pptx.layout = 'LAYOUT_16x9';
  pptx.title = 'Marvel Fit Studios - Fitness Studio Management System';
  pptx.author = 'Marvel Fit Studios';
  pptx.company = 'Marvel Fit Studios';

  // Styling palette
  const BG_DARK = '111111';
  const CARD_BG = '1C1C1C';
  const ACCENT_RED = 'E63946';
  const TEXT_WHITE = 'FFFFFF';
  const TEXT_MUTED = 'A0A0A0';
  const GREEN_ACCENT = '22C55E';
  const BORDER_COLOR = '2D2D2D';

  const screenshotsDir = path.join(process.cwd(), 'presentation-output', 'screenshots');

  // Slide 1: Title
  const slide1 = pptx.addSlide();
  slide1.background = { color: BG_DARK };
  
  slide1.addText('MARVEL FIT STUDIOS', {
    x: 0.8, y: 1.8, w: 11.5, h: 0.6,
    fontFace: 'Arial', fontSize: 38, bold: true, color: ACCENT_RED, tracking: 2
  });
  slide1.addText('Operational & Financial Management Operating System', {
    x: 0.8, y: 2.5, w: 11.5, h: 0.8,
    fontFace: 'Arial', fontSize: 28, bold: true, color: TEXT_WHITE
  });
  slide1.addText('System Valuation & Architecture Overview Document', {
    x: 0.8, y: 3.4, w: 11.5, h: 0.5,
    fontFace: 'Arial', fontSize: 18, color: TEXT_MUTED
  });

  // Feature pills on slide 1
  const pills = ['Full-Stack Next.js 16', 'Supabase PostgreSQL', 'Role-Based Access', 'Automated Financial Ledger', 'Clinical Injury Tracking'];
  pills.forEach((pill, idx) => {
    slide1.addText(pill, {
      x: 0.8 + (idx * 2.3), y: 4.8, w: 2.1, h: 0.45,
      fontFace: 'Arial', fontSize: 11, bold: true, color: TEXT_WHITE,
      fill: { color: CARD_BG }, line: { color: BORDER_COLOR, width: 1 },
      align: 'center', rectRadius: 0.1
    });
  });

  slide1.addText('Confidential — Prepared for System Pricing & Valuation Assessment', {
    x: 0.8, y: 6.5, w: 11.5, h: 0.4,
    fontFace: 'Arial', fontSize: 12, italic: true, color: TEXT_MUTED
  });

  // Helper for content slides
  function addContentSlide(title, category, bulletPoints, imageFile, leftWidth = 5.2) {
    const slide = pptx.addSlide();
    slide.background = { color: BG_DARK };

    // Category tag
    slide.addText(category.toUpperCase(), {
      x: 0.8, y: 0.5, w: 10, h: 0.3,
      fontFace: 'Arial', fontSize: 12, bold: true, color: ACCENT_RED, tracking: 1.5
    });

    // Title
    slide.addText(title, {
      x: 0.8, y: 0.8, w: 11.5, h: 0.6,
      fontFace: 'Arial', fontSize: 24, bold: true, color: TEXT_WHITE
    });

    // Left content card
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0.8, y: 1.6, w: leftWidth, h: 5.2,
      fill: { color: CARD_BG }, line: { color: BORDER_COLOR, width: 1 }
    });

    let currentY = 1.9;
    bulletPoints.forEach(pt => {
      slide.addText(pt.head, {
        x: 1.1, y: currentY, w: leftWidth - 0.6, h: 0.3,
        fontFace: 'Arial', fontSize: 14, bold: true, color: GREEN_ACCENT
      });
      slide.addText(pt.body, {
        x: 1.1, y: currentY + 0.3, w: leftWidth - 0.6, h: 0.6,
        fontFace: 'Arial', fontSize: 12, color: TEXT_MUTED
      });
      currentY += 1.0;
    });

    // Screenshot on right
    if (imageFile) {
      const imgX = 0.8 + leftWidth + 0.3;
      const imgW = 13.3 - imgX - 0.5;
      slide.addImage({
        path: path.join(screenshotsDir, imageFile),
        x: imgX, y: 1.6, w: imgW, h: 5.2,
        sizing: { type: 'contain' }
      });
    }

    return slide;
  }

  // Slide 2: Core Purpose
  addContentSlide(
    '1. Unified Operating System Replacing Disconnected Tools',
    'EXECUTIVE SUMMARY',
    [
      { head: 'Fragmented Tools vs. One Workspace', body: 'Replaces scattered spreadsheets, WhatsApp groups, manual receipts, and notebook tracking with a single central platform.' },
      { head: 'Complete Operational Visibility', body: 'Provides live studio pulse, roster check-ins, automated renewal alerts, and audited daily cash movement.' },
      { head: 'Role-Tailored Security & Workspaces', body: 'Separate high-security Admin Command Center and Coach Workspaces ensuring data privacy and operational focus.' },
      { head: 'Turn-Key Production Readiness', body: 'Engineered with zero technical debt, complete test coverage, automated migrations, and enterprise-grade resilience.' }
    ],
    'dashboard.png'
  );

  // Slide 3: Admin & Coach Workspaces
  addContentSlide(
    '2. Role-Based Workspaces: Admin & Coach Control Centers',
    'OPERATIONAL WORKSPACES',
    [
      { head: 'Admin Command Center', body: 'Real-time studio stats, live floor pulse, pending trial actions, upcoming renewals, and cash ledger controls.' },
      { head: 'Coach Floor Workspace', body: 'Focused mobile & desktop view for coaches with assigned clients, roster check-in, and injury flags.' },
      { head: 'Strict Permission Boundaries', body: 'Coaches access only floor attendance and client medical context — administrative revenue data remains locked.' },
      { head: 'Instant Action Triggers', body: 'One-click attendance check-in, quick lead follow-ups, and direct WhatsApp client messaging.' }
    ],
    'coach-dashboard.png'
  );

  // Slide 4: Lead Pipeline
  addContentSlide(
    '3. Prospect Acquisition & Lead Conversion Pipeline',
    'LEAD MANAGEMENT',
    [
      { head: 'Structured Acquisition Stages', body: 'Tracks leads through New → Trial Booked → Trial Done → Won / Lost conversion funnel.' },
      { head: 'Trial Session Integration', body: 'Links prospective members directly to group trial sessions with automated outcome tracking.' },
      { head: 'Loss Reason Analytics', body: 'Captures detailed reasons for lost leads (location, timing, pricing) for business intelligence.' },
      { head: 'One-Click Lead Conversion', body: 'Converts successful trials into active client profiles and subscriptions seamlessly.' }
    ],
    'leads.png'
  );

  // Slide 5: Client Intelligence
  addContentSlide(
    '4. Member Intelligence & Clinical Injury Prevention',
    'CLIENT DOSSIERS',
    [
      { head: '360-Degree Client Dossiers', body: 'Centralized member profiles containing membership history, assigned coach, category, and receipts.' },
      { head: 'Clinical Injury Flags', body: 'Real-time warning badges for ACL, meniscus, lumbar strains, and movement restrictions across all views.' },
      { head: 'Floor-Level Safety Rules', body: 'Ensures coaches and admins see injury notes directly on class rosters to prevent aggravated injury.' },
      { head: 'Direct Communication', body: 'Integrated WhatsApp link for instant client messaging directly from their dossier.' }
    ],
    'client-profile.png'
  );

  // Slide 6: Schedule & Roster
  addContentSlide(
    '5. Dynamic Weekly Scheduling & Roster Attendance',
    'SCHEDULING & ATTENDANCE',
    [
      { head: 'Multiple Schedule Views', body: 'Chronological Agenda, Week Cards, and Hourly Grid views tailored for high-volume studio scheduling.' },
      { head: 'Real-Time Live Status', body: 'Automated status badges indicating 🔴 Live Now, Upcoming, or Ended sessions based on Cairo time.' },
      { head: 'Granular Attendance States', body: 'Track Attended, Late, Missed, and Excused attendance with mandatory excuse notes.' },
      { head: 'Recurring Session Automation', body: 'Manage weekly group templates and generate recurring occurrences with exception handling.' }
    ],
    'schedule.png'
  );

  // Slide 7: Subscriptions & Billing
  addContentSlide(
    '6. Subscription Lifecycle & Automated Payment Ledger',
    'SUBSCRIPTION MANAGEMENT',
    [
      { head: 'Flexible Membership Plans', body: 'Supports Group, Private, and Hybrid subscription plans with session count limits.' },
      { head: 'Session Balance Tracking', body: 'Automatically decrements remaining sessions upon attendance check-in with low-balance alerts.' },
      { head: 'Subscription Controls', body: 'Full lifecycle actions: Pause, Resume, Cancel, and Renew subscriptions with date precision.' },
      { head: 'Auditable Digital Receipts', body: 'Generates branded digital receipts with unique receipt numbers and instant PDF export.' }
    ],
    'subscriptions.png'
  );

  // Slide 8: Financial Analytics
  addContentSlide(
    '7. Financial Operations & Cash Movement Audit',
    'FINANCIAL ANALYTICS',
    [
      { head: 'Real-Time Cash Flow Ledger', body: 'Tracks cash-in receipts and categorised cash-out expenditures with net movement calculations.' },
      { head: 'Payment Method Breakdown', body: 'Monitors revenue distribution across InstaPay, Visa, Cash, and Bank Transfers.' },
      { head: 'Date Range Filtering', body: 'Filter financial reports by custom date ranges, weekly, monthly, or quarterly periods.' },
      { head: 'CSV Data Export', body: 'One-click export of complete financial ledgers for external accounting and tax compliance.' }
    ],
    'reports.png'
  );

  // Slide 9: Architecture & Tech Stack
  const slide9 = pptx.addSlide();
  slide9.background = { color: BG_DARK };
  slide9.addText('TECHNICAL ARCHITECTURE & SECURITY', {
    x: 0.8, y: 0.5, w: 10, h: 0.3,
    fontFace: 'Arial', fontSize: 12, bold: true, color: ACCENT_RED, tracking: 1.5
  });
  slide9.addText('8. Full-Stack Next.js 16 App Router & Enterprise Security Stack', {
    x: 0.8, y: 0.8, w: 11.5, h: 0.6,
    fontFace: 'Arial', fontSize: 24, bold: true, color: TEXT_WHITE
  });

  const techCards = [
    { title: 'Frontend & UI Framework', desc: 'Next.js 16.2 App Router, React 18, TypeScript 5, Radix UI primitives, Lucide Icons, and 100% custom CSS token design system.' },
    { title: 'Database & Security Boundary', desc: 'Supabase PostgreSQL database with Row Level Security (RLS), transactional RPC functions, and server-only service role boundary.' },
    { title: 'Auth & Access Control', desc: 'Auth.js v5 JWT credentials authentication, bcrypt password hashing, forced password change flow, and strict role permissions.' },
    { title: 'Testing & Production Verification', desc: 'Vitest unit & contract suites, Playwright E2E browser tests, ESLint, TypeScript checks, and automated Vercel deployment pipeline.' }
  ];

  techCards.forEach((card, idx) => {
    const row = Math.floor(idx / 2);
    const col = idx % 2;
    const x = 0.8 + (col * 5.8);
    const y = 1.6 + (row * 2.6);

    slide9.addShape(pptx.shapes.RECTANGLE, {
      x, y, w: 5.5, h: 2.3,
      fill: { color: CARD_BG }, line: { color: BORDER_COLOR, width: 1 }
    });
    slide9.addText(card.title, {
      x: x + 0.3, y: y + 0.3, w: 4.9, h: 0.4,
      fontFace: 'Arial', fontSize: 16, bold: true, color: GREEN_ACCENT
    });
    slide9.addText(card.desc, {
      x: x + 0.3, y: y + 0.7, w: 4.9, h: 1.3,
      fontFace: 'Arial', fontSize: 12, color: TEXT_MUTED
    });
  });

  // Slide 10: System Valuation Summary
  const slide10 = pptx.addSlide();
  slide10.background = { color: BG_DARK };
  slide10.addText('COMMERCIAL ASSET EVALUATION', {
    x: 0.8, y: 0.5, w: 10, h: 0.3,
    fontFace: 'Arial', fontSize: 12, bold: true, color: ACCENT_RED, tracking: 1.5
  });
  slide10.addText('9. System Commercial Assets & Valuation Highlights', {
    x: 0.8, y: 0.8, w: 11.5, h: 0.6,
    fontFace: 'Arial', fontSize: 24, bold: true, color: TEXT_WHITE
  });

  const valAssets = [
    { title: 'Turn-Key Operational Product', desc: 'Fully functional, production-ready fitness studio operating system ready for immediate commercial deployment.' },
    { title: 'Proprietary IP & Custom Code', desc: '100% bespoke codebase (no generic templates), custom design system, and studio domain logic.' },
    { title: 'Scalable SaaS Architecture', desc: 'Structured data model easily adaptable for multi-branch studio chains or SaaS multi-tenant licensing.' },
    { title: 'High Market Demand Domain', desc: 'Solves high-friction daily operational challenges for fitness studios, gyms, and sports academies.' }
  ];

  valAssets.forEach((asset, idx) => {
    const row = Math.floor(idx / 2);
    const col = idx % 2;
    const x = 0.8 + (col * 5.8);
    const y = 1.6 + (row * 2.6);

    slide10.addShape(pptx.shapes.RECTANGLE, {
      x, y, w: 5.5, h: 2.3,
      fill: { color: CARD_BG }, line: { color: BORDER_COLOR, width: 1 }
    });
    slide10.addText(asset.title, {
      x: x + 0.3, y: y + 0.3, w: 4.9, h: 0.4,
      fontFace: 'Arial', fontSize: 16, bold: true, color: ACCENT_RED
    });
    slide10.addText(asset.desc, {
      x: x + 0.3, y: y + 0.7, w: 4.9, h: 1.3,
      fontFace: 'Arial', fontSize: 12, color: TEXT_MUTED
    });
  });

  const outPath = path.join(process.cwd(), 'presentation-output', 'Fitness-Studio-System-Overview.pptx');
  await pptx.writeFile({ fileName: outPath });
  console.log('PowerPoint presentation successfully saved to:', outPath);
}

buildPresentation().catch(err => {
  console.error('Error generating PPTX:', err);
  process.exit(1);
});
