const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = "http://127.0.0.1:3000";
const outDir = path.join(process.cwd(), "tmp");

async function createPage(browser, options) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const consoleMessages = [];
  const pageErrors = [];

  await context.addInitScript(() => {
    const originalAdd = EventTarget.prototype.addEventListener;
    window.__listenerLog = [];
    EventTarget.prototype.addEventListener = function patched(type, listener, options) {
      try {
        const target =
          this === document
            ? "document"
            : this === window
              ? "window"
              : this instanceof Element
                ? `${this.tagName.toLowerCase()}${this.id ? `#${this.id}` : ""}${this.classList.length ? `.${Array.from(this.classList).join(".")}` : ""}`
                : Object.prototype.toString.call(this);
        window.__listenerLog.push({ target, type });
      } catch {}
      return originalAdd.call(this, type, listener, options);
    };
  });

  page.on("console", (msg) => {
    if (["error", "warning"].includes(msg.type())) {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    }
  });
  page.on("pageerror", (error) => pageErrors.push(String(error)));

  return { context, page, consoleMessages, pageErrors };
}

async function verifyLanding(browser) {
  const session = await createPage(browser, {
    viewport: { width: 1440, height: 1600 },
  });
  const { context, page, consoleMessages, pageErrors } = session;

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.waitForFunction(() => (window.__listenerLog || []).length > 0, {
    timeout: 10000,
  });
  await page.screenshot({
    path: path.join(outDir, "landing-fixed-desktop.png"),
    fullPage: true,
  });

  await page.locator(".faq-question").first().click();
  await page.waitForTimeout(80);
  const faqFirstOpen = await page.evaluate(() => ({
    expanded:
      document.querySelector(".faq-question")?.getAttribute("aria-expanded") || null,
    open: document.getElementById("faq-1")?.classList.contains("open") || false,
  }));

  await page.locator(".faq-question").first().click();
  await page.waitForTimeout(80);
  const faqClose = await page.evaluate(() => ({
    expanded:
      document.querySelector(".faq-question")?.getAttribute("aria-expanded") || null,
    open: document.getElementById("faq-1")?.classList.contains("open") || false,
  }));

  const smoothScroll = await page.evaluate(async () => {
    const target = document.getElementById("contact");
    const headerHeight =
      document.querySelector(".site-header")?.getBoundingClientRect().height || 80;
    const expected =
      target.getBoundingClientRect().top + window.scrollY - headerHeight - 10;
    return { expected };
  });
  await page.locator("#btnJoinHero").click();
  await page.waitForTimeout(900);
  smoothScroll.actual = await page.evaluate(() => window.scrollY);
  smoothScroll.delta = Math.abs(smoothScroll.actual - smoothScroll.expected);

  await page.locator("#cf-name").fill("Audit User");
  await page.locator("#cf-phone").fill("+20 100 000 0000");
  await page.locator("#cf-msg").fill("Verification");
  await page.locator("#cf-privacy").check();
  await page.locator("#cf-submit").click();
  await page.waitForTimeout(500);

  const formState = await page.evaluate(() => ({
    successVisible:
      document.getElementById("cf-success")?.classList.contains("show") || false,
    submitDisabled: document.getElementById("cf-submit")?.disabled || false,
    fieldsDisabled: Array.from(
      document.querySelectorAll("#contactForm input, #contactForm textarea, #contactForm button")
    ).every((field) => field.disabled),
  }));

  const desktop = await page.evaluate(() => {
    const getListenerCount = (matcher) =>
      (window.__listenerLog || []).filter(matcher).length;

    return {
      title: document.title,
      scriptTagCount: document.querySelectorAll('script[src*="modern-script.js"]').length,
      listenerSummary: {
        documentClick: getListenerCount((l) => l.target === "document" && l.type === "click"),
        documentKeydown: getListenerCount((l) => l.target === "document" && l.type === "keydown"),
        windowResize: getListenerCount((l) => l.target === "window" && l.type === "resize"),
        faqClicks: getListenerCount((l) => l.target.includes(".faq-question") && l.type === "click"),
      },
      bodyFont: getComputedStyle(document.body).fontFamily,
      headingFont: getComputedStyle(document.querySelector("h1")).fontFamily,
      desktopCarousel: {
        controlsDisplay: getComputedStyle(document.querySelector(".carousel-controls")).display,
        gridAutoFlow: getComputedStyle(document.querySelector(".service-track")).gridAutoFlow,
        overflowX: getComputedStyle(document.querySelector(".service-track")).overflowX,
      },
    };
  });
  desktop.faqFirstOpen = faqFirstOpen;
  desktop.faqClose = faqClose;
  desktop.smoothScroll = smoothScroll;
  desktop.formState = formState;

  const loginFlowContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const loginFlowPage = await loginFlowContext.newPage();
  await loginFlowPage.goto(baseUrl, { waitUntil: "networkidle" });
  await loginFlowPage.locator('a[href="/login"]').first().click();
  await loginFlowPage.waitForURL("**/login", { timeout: 10000 });
  const loginFlow = { finalUrl: loginFlowPage.url() };
  await loginFlowContext.close();

  await context.close();
  return { desktop, loginFlow, consoleMessages, pageErrors };
}

async function verifyMobile(browser) {
  const session = await createPage(browser, {
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const { context, page, consoleMessages, pageErrors } = session;

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.waitForFunction(() => (window.__listenerLog || []).length > 0, {
    timeout: 10000,
  });
  await page.screenshot({
    path: path.join(outDir, "landing-fixed-mobile.png"),
    fullPage: true,
  });

  await page.locator("#navToggle").click();
  await page.waitForTimeout(80);
  const navOpen = await page.evaluate(() => ({
    openClass: document.getElementById("navLinks")?.classList.contains("open") || false,
    bodyLocked: document.body.classList.contains("nav-open"),
    expanded: document.getElementById("navToggle")?.getAttribute("aria-expanded") || null,
  }));

  const mobileCarouselBefore = await page.evaluate(() => ({
    scrollLeft: document.querySelector(".service-track")?.scrollLeft || 0,
  }));
  await page.locator(".service-track").press("ArrowRight");
  await page.waitForTimeout(700);
  const mobileCarouselAfter = await page.evaluate(() => ({
    scrollLeft: document.querySelector(".service-track")?.scrollLeft || 0,
  }));

  await page.evaluate(() => {
    document
      .querySelector('#navLinks a[href="#contact"]')
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
  await page.waitForTimeout(900);
  const navAfterAnchor = await page.evaluate(() => ({
    openClass: document.getElementById("navLinks")?.classList.contains("open") || false,
    bodyLocked: document.body.classList.contains("nav-open"),
    expanded: document.getElementById("navToggle")?.getAttribute("aria-expanded") || null,
    scrollY: window.scrollY,
  }));

  const mobile = await page.evaluate(() => {
    return {
      mobileStyles: {
        controlsDisplay: getComputedStyle(document.querySelector(".carousel-controls")).display,
        gridAutoFlow: getComputedStyle(document.querySelector(".service-track")).gridAutoFlow,
        overflowX: getComputedStyle(document.querySelector(".service-track")).overflowX,
      },
    };
  });
  mobile.navOpen = navOpen;
  mobile.navAfterAnchor = navAfterAnchor;
  mobile.mobileCarousel = {
    before: mobileCarouselBefore,
    after: mobileCarouselAfter,
  };

  await context.close();
  return { mobile, consoleMessages, pageErrors };
}

async function loginAs(browser, email, expectedPath) {
  const session = await createPage(browser, {
    viewport: { width: 1440, height: 900 },
  });
  const { context, page, consoleMessages, pageErrors } = session;

  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.waitForTimeout(250);
  await page.locator(".login-password-toggle").click();
  const typeAfterToggle = await page.locator("#login-password").getAttribute("type");

  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill("password123");
  await page.locator('button[type="submit"]').click();

  let success = false;
  let loginError = null;
  let finalUrl = page.url();
  try {
    await page.waitForURL((url) => url.pathname === expectedPath, { timeout: 15000 });
    success = true;
    finalUrl = page.url();
  } catch {
    const errorLocator = page.locator(".login-error");
    if (await errorLocator.count()) {
      loginError = await errorLocator.textContent();
    }
    finalUrl = page.url();
  }

  let reloginRedirectUrl = null;
  if (success) {
    await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
    reloginRedirectUrl = page.url();
  }

  const result = {
    email,
    expectedPath,
    success,
    finalUrl,
    reloginRedirectUrl,
    loginError,
    typeAfterToggle,
    consoleMessages,
    pageErrors,
  };

  await context.close();
  return result;
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  const landing = await verifyLanding(browser);
  const mobile = await verifyMobile(browser);

  const loginPageContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const loginPage = await loginPageContext.newPage();
  await loginPage.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await loginPage.screenshot({
    path: path.join(outDir, "login-fixed.png"),
    fullPage: true,
  });
  const loginPageLoad = {
    url: loginPage.url(),
    title: await loginPage.title(),
    heading: await loginPage.locator("h1").textContent(),
  };
  await loginPageContext.close();

  const roleLogins = {
    admin: await loginAs(browser, "admin@test.com", "/admin"),
    coach: await loginAs(browser, "coach@test.com", "/coach"),
    client: await loginAs(browser, "client@test.com", "/client"),
  };

  const results = {
    landing,
    mobile,
    loginPageLoad,
    roleLogins,
  };

  fs.writeFileSync(
    path.join(outDir, "postfix-verify-results.json"),
    JSON.stringify(results, null, 2)
  );
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
