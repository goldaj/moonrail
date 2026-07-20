const fs = require('fs');
const path = require('path');

function loadPlaywright() {
  const bundledModules = path.join(process.env.USERPROFILE || '', '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules');
  const pnpmRoot = path.join(bundledModules, '.pnpm');
  const pnpmPlaywright = fs.existsSync(pnpmRoot)
    ? fs.readdirSync(pnpmRoot).find(name => /^playwright@[^/]+$/.test(name))
    : null;
  const candidates = [
    process.env.MOONRAIL_PLAYWRIGHT,
    'playwright',
    pnpmPlaywright ? path.join(pnpmRoot, pnpmPlaywright, 'node_modules', 'playwright') : null,
    path.join(bundledModules, 'playwright'),
  ].filter(Boolean);
  for (const candidate of candidates) {
    try { return require(candidate); } catch (_) { /* try next runtime */ }
  }
  throw new Error('Playwright introuvable. Définissez MOONRAIL_PLAYWRIGHT vers son dossier npm.');
}

const { chromium } = loadPlaywright();
const baseUrl = process.env.MOONRAIL_URL || 'http://127.0.0.1:8779/app/';
const chromeCandidates = [
  process.env.MOONRAIL_CHROME,
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(candidate => candidate && fs.existsSync(candidate));

async function clickDom(page, selector) {
  await page.evaluate(selector => {
    const visible = element => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 1 && rect.height > 1;
    };
    const element = [...document.querySelectorAll(selector)].find(visible);
    if (!element) throw new Error(`Selector not found: ${selector}`);
    element.click();
  }, selector);
}

async function dismissOnboarding(page) {
  for (let index = 0; index < 24; index++) {
    const selector = '[data-action="ritual-close-tutorial"],[data-action="ritual-card-type-tutorial-close"]';
    const button = page.locator(selector).first();
    if (!(await button.count()) || !(await button.isVisible())) break;
    await clickDom(page, selector);
    await page.waitForTimeout(140);
  }
}

async function main() {
  const browser = await chromium.launch({
    headless:true,
    executablePath:chromeCandidates[0],
    args:['--hide-scrollbars'],
  });
  try {
    const context = await browser.newContext({ viewport:{ width:1366, height:768 } });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    await page.goto(baseUrl, { waitUntil:'load', timeout:15000 });
    await page.evaluate(() => {
      for (const key of Object.keys(localStorage)) if (key.startsWith('moonrail.')) localStorage.removeItem(key);
    });
    await page.reload({ waitUntil:'load' });
    await page.locator('[data-action="ritual-new"]').waitFor({ state:'visible', timeout:10000 });
    await clickDom(page, '[data-action="ritual-new"]');
    await clickDom(page, '[data-action="ritual-choose-guardian"]');
    await clickDom(page, '[data-ritual-guardian="controleur"]');
    await clickDom(page, '[data-action="ritual-confirm-guardian"]');
    await page.locator('#screen-ritual-battle.active').waitFor({ state:'visible', timeout:15000 });
    await dismissOnboarding(page);
    await page.waitForTimeout(500);
    const metrics = await page.evaluate(() => {
      const visible = element => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 1 && rect.height > 1;
      };
      const tableRect = document.querySelector('#screen-ritual-battle .ritual-table')?.getBoundingClientRect();
      const cards = [...document.querySelectorAll('#screen-ritual-battle .ritual-hand .ritual-card')].filter(visible).map(card => {
        const rect = card.getBoundingClientRect();
        const title = card.querySelector('.ritual-card-frame>strong');
        const copy = card.querySelector('.ritual-card-frame>p');
        const stats = card.querySelector('.ritual-card-stats');
        return {
          id:card.dataset.cardId || card.textContent.trim().slice(0, 42),
          width:Math.round(rect.width),
          height:Math.round(rect.height),
          titleSize:Number.parseFloat(getComputedStyle(title).fontSize),
          copySize:Number.parseFloat(getComputedStyle(copy).fontSize),
          copyHeight:Math.round(copy.getBoundingClientRect().height),
          overlap:copy.getBoundingClientRect().bottom > stats.getBoundingClientRect().top + 1,
        };
      });
      const overflow = [...document.querySelectorAll('#screen-ritual-battle *')]
        .filter(visible)
        .filter(element => {
          const rect = element.getBoundingClientRect();
          return rect.left < -2 || rect.top < -2 || rect.right > innerWidth + 2 || rect.bottom > innerHeight + 2;
        })
        .map(element => `${element.tagName}.${String(element.className || '').slice(0, 48)}`)
        .slice(0, 12);
      return {
        table:tableRect ? {
          top:Math.round(tableRect.top),
          bottom:Math.round(tableRect.bottom),
          height:Math.round(tableRect.height),
          viewport:innerHeight,
        } : null,
        cards,
        overflow,
      };
    });
    console.log(JSON.stringify(metrics, null, 2));
    const failures = [];
    if (!metrics.table) failures.push('table absente');
    else if (metrics.table.bottom > metrics.table.viewport + 2) failures.push(`table dépasse le viewport (${metrics.table.bottom}/${metrics.table.viewport})`);
    for (const card of metrics.cards) {
      if (card.width < 122 || card.height < 170) failures.push(`${card.id}: carte trop compacte ${card.width}x${card.height}`);
      if (card.titleSize < 11.6 || card.copySize < 9.2 || card.copyHeight < 25) failures.push(`${card.id}: texte trop petit ${card.titleSize}/${card.copySize}/${card.copyHeight}`);
      if (card.overlap) failures.push(`${card.id}: texte chevauche les stats`);
    }
    for (const item of metrics.overflow) failures.push(`débordement viewport: ${item}`);
    if (failures.length) {
      console.log(`Combat fit smoke: ${failures.length} alerte(s)`);
      for (const failure of failures) console.log(`- ${failure}`);
      process.exitCode = 1;
    } else {
      console.log('Combat fit smoke: OK');
    }
    await context.close();
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
