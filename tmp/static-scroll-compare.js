const path = require("path");
const { pathToFileURL } = require("url");
const { chromium } = require("@playwright/test");

const fileUrl = pathToFileURL(
  path.join(process.cwd(), "public", "index.html")
).href;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });
  await page.goto(fileUrl);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(500);

  const result = await page.evaluate(async () => {
    const target = document.getElementById("contact");
    const headerHeight =
      document.querySelector(".site-header")?.getBoundingClientRect().height || 80;
    const expected =
      target.getBoundingClientRect().top + window.scrollY - headerHeight - 10;

    document.getElementById("btnJoinHero")?.click();
    await new Promise((resolve) => setTimeout(resolve, 900));

    return {
      expected,
      actual: window.scrollY,
      delta: Math.abs(window.scrollY - expected),
      maxScroll:
        document.documentElement.scrollHeight - window.innerHeight,
    };
  });

  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
