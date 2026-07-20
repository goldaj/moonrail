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
      const rectOf = element => {
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return {
          left:Math.round(rect.left),
          right:Math.round(rect.right),
          top:Math.round(rect.top),
          bottom:Math.round(rect.bottom),
          width:Math.round(rect.width),
          height:Math.round(rect.height),
        };
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
      const lifeBars = [...document.querySelectorAll('#screen-ritual-battle .combat-life-bar')].filter(visible).map(bar => {
        const points = bar.querySelector('header b');
        const label = bar.querySelector('header span');
        const track = bar.querySelector('.health-track');
        return {
          label:label?.textContent?.trim() || '',
          points:points?.textContent?.trim() || '',
          rect:rectOf(bar),
          labelSize:label ? Number.parseFloat(getComputedStyle(label).fontSize) : 0,
          pointsSize:points ? Number.parseFloat(getComputedStyle(points).fontSize) : 0,
          track:rectOf(track),
        };
      });
      const piles = rectOf(document.querySelector('#screen-ritual-battle .ritual-piles'));
      const resources = rectOf(document.querySelector('#screen-ritual-battle .ritual-resource-orbs'));
      const hintElement = document.querySelector('#screen-ritual-battle #ritual-hint');
      const hintStyle = hintElement ? getComputedStyle(hintElement) : null;
      const hint = hintElement ? {
        rect:rectOf(hintElement),
        fontSize:Number.parseFloat(hintStyle.fontSize),
        visible:visible(hintElement),
        text:hintElement.textContent.trim(),
        overflow:hintElement.scrollHeight > hintElement.clientHeight + 2 || hintElement.scrollWidth > hintElement.clientWidth + 2,
      } : null;
      return {
        table:tableRect ? {
          top:Math.round(tableRect.top),
          bottom:Math.round(tableRect.bottom),
          height:Math.round(tableRect.height),
          viewport:innerHeight,
        } : null,
        cards,
        lifeBars,
        piles,
        resources,
        hint,
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
    if (metrics.lifeBars.length !== 2) failures.push(`jauges /10 absentes ou masquées (${metrics.lifeBars.length}/2)`);
    for (const bar of metrics.lifeBars) {
      if (!/\/10$/.test(bar.points)) failures.push(`${bar.label || 'jauge'}: compteur /10 illisible (${bar.points})`);
      if (bar.pointsSize < 18 || bar.labelSize < 9) failures.push(`${bar.label || 'jauge'}: typographie jauge trop petite ${bar.pointsSize}/${bar.labelSize}`);
      if (!bar.track || bar.track.width < 120 || bar.track.height < 14) failures.push(`${bar.label || 'jauge'}: barre de progression trop compacte`);
    }
    const rectsIntersect = (a, b) => a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    if (rectsIntersect(metrics.piles, metrics.resources)) failures.push('lueurs/cendres chevauchent les boutons de gauche');
    if (!metrics.hint || !metrics.hint.visible) failures.push('aide basse absente');
    else {
      if (metrics.hint.fontSize < 10 || metrics.hint.rect.height < 22) failures.push(`aide basse trop petite ${metrics.hint.fontSize}/${metrics.hint.rect.height}`);
      if (metrics.hint.overflow) failures.push('aide basse tronquée');
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
