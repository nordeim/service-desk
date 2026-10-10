import { chromium } from "@playwright/test";
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:3000/login");
await page.evaluate(() => {
  document.querySelector('input[type="email"], input[name="email"], #email')?.focus();
});
await page.fill('input[type="email"]', 'demo@servicedesk.app');
await page.fill('input[type="password"]', 'Demo1234!');
await page.click('button[type="submit"]');
await page.waitForURL('**/dashboard');
const result = await page.evaluate(() => {
  const styles = [...document.styleSheets].flatMap(s => { try { return [...s.cssRules]; } catch(e) { return []; } });
  const printRules = styles.filter(r => r.media && r.media.mediaText && r.media.mediaText.includes('print')).length;
  const forcedColors = styles.filter(r => r.media && r.media.mediaText && r.media.mediaText.includes('forced-colors')).length;
  return JSON.stringify({
    printRules,
    forcedColorsRules: forcedColors,
    hasSelectionStyle: [...document.querySelectorAll('style')].some(s => s.textContent.includes('::selection')),
    scrollbarWidth: getComputedStyle(document.documentElement).scrollbarWidth || 'default',
    url: location.pathname
  });
});
console.log(result);
await b.close();
