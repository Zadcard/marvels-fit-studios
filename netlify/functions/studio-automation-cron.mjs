// Netlify Scheduled Function replacing the Vercel cron for the nightly
// studio-automation job. Netlify triggers this on the schedule below and it
// calls the existing Next.js route handler, authenticated with CRON_SECRET.
// Docs: https://docs.netlify.com/functions/scheduled-functions/

async function studioAutomationCron() {
  const baseUrl = process.env.URL;
  const secret = process.env.CRON_SECRET;

  if (!baseUrl || !secret) {
    console.error("studio-automation-cron: missing URL or CRON_SECRET env var");
    return;
  }

  const response = await fetch(`${baseUrl}/api/cron/studio-automation`, {
    headers: { Authorization: `Bearer ${secret}` },
  });

  if (!response.ok) {
    console.error(`studio-automation-cron: request failed with status ${response.status}`);
  }
}

export default studioAutomationCron;

export const config = {
  schedule: "0 3 * * *",
};
