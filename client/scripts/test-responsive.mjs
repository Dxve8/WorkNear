import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const port = 4173;
const baseUrl = `http://127.0.0.1:${port}`;
const viewports = [320, 360, 390, 414, 768, 1024, 1440];
const routes = [
  '/',
  '/login',
  '/register',
  '/jobs',
  '/about',
  '/forgot-password',
  '/seeker/dashboard',
  '/seeker/profile',
  '/seeker/recommended',
  '/seeker/applications',
  '/seeker/saved',
  '/business/dashboard',
  '/business/profile',
  '/business/post-job',
  '/admin',
];
const viteCli = resolve('node_modules/vite/bin/vite.js');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const server = spawn(process.execPath, [viteCli, '--host', '127.0.0.1', '--port', String(port)], {
  stdio: 'ignore',
});

async function waitForServer() {
  const timeoutAt = Date.now() + 30_000;
  while (Date.now() < timeoutAt) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // The development server has not started yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('Vite development server did not start within 30 seconds');
}

try {
  await waitForServer();
  const browser = await chromium.launch({
    headless: true,
    ...(existsSync(chromePath) ? { executablePath: chromePath } : {}),
  });
  const failures = [];

  for (const width of viewports) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    for (const route of routes) {
      await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(200);
      const layout = await page.evaluate(() => {
        const root = document.documentElement;
        const body = document.body;
        const viewportWidth = window.innerWidth;
        const pageWidth = Math.max(root.scrollWidth, body.scrollWidth);

        const overflowing = [];
        if (pageWidth > viewportWidth + 1) {
          const allEls = document.querySelectorAll('*');
          for (const el of allEls) {
            const rect = el.getBoundingClientRect();
            if (rect.right > viewportWidth + 1 || rect.width > viewportWidth + 1) {
              overflowing.push({
                tag: el.tagName,
                className: typeof el.className === 'string' ? el.className : '',
                id: el.id,
                right: rect.right,
                width: rect.width,
              });
            }
          }
        }

        return {
          viewportWidth,
          pageWidth,
          overflowing: overflowing.slice(0, 5),
        };
      });

      if (layout.pageWidth > layout.viewportWidth + 1) {
        const details = layout.overflowing.map(o => `${o.tag}.${o.className || '(no class)'} (w: ${Math.round(o.width)}px, r: ${Math.round(o.right)}px)`).join(', ');
        failures.push(`${route} at ${width}px is ${layout.pageWidth - layout.viewportWidth}px wider than viewport. Elements: [${details}]`);
      }
    }
    await page.close();
  }

  assert.deepEqual(failures, [], `Responsive overflow detected:\n${failures.join('\n')}`);
  console.log(`Responsive checks passed: ${routes.length} routes at ${viewports.length} viewport widths.`);
  await browser.close();
} finally {
  server.kill();
}
