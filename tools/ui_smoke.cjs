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
const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, 'qa-ui');
const baseUrl = process.env.MOONRAIL_URL || 'http://127.0.0.1:8779/app/';
const captureScreens = process.env.MOONRAIL_SMOKE_SCREENSHOTS !== '0';
const chromeCandidates = [
  process.env.MOONRAIL_CHROME,
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(candidate => candidate && fs.existsSync(candidate));

async function inspectScreen(page, label, viewport, errors) {
  await page.waitForTimeout(label.includes('run_progress_recap') ? 940 : 420);
  const slug = `${label}_${viewport.width}x${viewport.height}`;
  if (captureScreens) {
    await page.screenshot({ path:path.join(outputDir, `ui_pass_7_1_${slug}.png`), fullPage:false, animations:'disabled', timeout:12000 });
  }
  const metrics = await page.evaluate(() => {
    const visible = element => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 1 && rect.height > 1;
    };
    const textElements = [...document.querySelectorAll('button,small,p,strong,span,h1,h2,h3,label')]
      .filter(element => visible(element) && element.textContent.trim());
    const tinyText = textElements
      .map(element => ({
        text:element.textContent.trim().replace(/\s+/g, ' ').slice(0, 90),
        size:Number.parseFloat(getComputedStyle(element).fontSize),
        selector:element.id ? `#${element.id}` : element.className ? `.${String(element.className).trim().replace(/\s+/g, '.')}` : element.tagName.toLowerCase(),
      }))
      .filter(item => item.size < 8.8)
      .slice(0, 30);
    const interactiveOverflow = [...document.querySelectorAll('button,[role="button"],h1,h2,h3')]
      .filter(visible)
      .filter(element => element.scrollWidth > element.clientWidth + 2 || element.scrollHeight > element.clientHeight + 2)
      .map(element => ({ text:element.textContent.trim().replace(/\s+/g, ' ').slice(0, 90), width:[element.clientWidth, element.scrollWidth], height:[element.clientHeight, element.scrollHeight] }))
      .slice(0, 30);
    const portraits = [...document.querySelectorAll('[data-guardian-portrait]')].filter(visible).map(element => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        id:element.dataset.guardianPortrait,
        width:Math.round(rect.width),
        height:Math.round(rect.height),
        backgroundImage:style.backgroundImage,
        backgroundSize:style.backgroundSize,
        backgroundPosition:style.backgroundPosition,
      };
    });
    const viewportOverflow = [...document.querySelectorAll('body *')]
      .filter(visible)
      .filter(element => {
        const rect = element.getBoundingClientRect();
        return rect.right > innerWidth + 3 || rect.bottom > innerHeight + 3 || rect.left < -3 || rect.top < -3;
      })
      .map(element => ({ tag:element.tagName, className:String(element.className || '').slice(0, 80) }))
      .slice(0, 30);
    const layoutWaste = [];
    const battleTable = document.querySelector('#screen-ritual-battle .ritual-table');
    const battleControls = document.querySelector('#screen-ritual-battle .ritual-battle-controls');
    if (battleTable && battleControls && visible(battleTable) && visible(battleControls)) {
      const tableRect = battleTable.getBoundingClientRect();
      const controlsRect = battleControls.getBoundingClientRect();
      const bottomGap = Math.round(tableRect.bottom - controlsRect.bottom);
      if (bottomGap > Math.max(100, tableRect.height * .16)) {
        layoutWaste.push({ area:'combat', bottomGap, tableHeight:Math.round(tableRect.height) });
      }
    }
    const cardOverlap = [...document.querySelectorAll('.ritual-card')]
      .filter(visible)
      .map(card => ({ card, copy:card.querySelector('.ritual-card-frame>p'), stats:card.querySelector('.ritual-card-stats') }))
      .filter(item => item.copy && item.stats && visible(item.copy) && visible(item.stats))
      .filter(item => item.copy.getBoundingClientRect().bottom > item.stats.getBoundingClientRect().top + 1)
      .map(item => {
        const copyBottom = Math.round(item.copy.getBoundingClientRect().bottom);
        const statsTop = Math.round(item.stats.getBoundingClientRect().top);
        return {
          name:item.card.dataset.cardId || item.card.textContent.trim().replace(/\s+/g, ' ').slice(0, 60),
          overlap:copyBottom - statsTop,
          context:item.card.closest('.ritual-hand') ? 'hand' : item.card.closest('.ritual-slot') ? 'slot' : item.card.closest('.guardian-start-deck') ? 'starter' : item.card.closest('.run-card-state') ? 'run-deck' : item.card.closest('.run-recap-new-card') ? 'recap' : 'card',
          cardHeight:Math.round(item.card.getBoundingClientRect().height),
        };
      })
      .slice(0, 30);
    const criticalOverlap = [];
    const toast = document.querySelector('#toast.show');
    if (toast && visible(toast)) {
      const toastRect = toast.getBoundingClientRect();
      const intersects = rect => toastRect.left < rect.right && toastRect.right > rect.left && toastRect.top < rect.bottom && toastRect.bottom > rect.top;
      for (const selector of ['#ritual-balance', '.ritual-hand .ritual-card', '.ritual-resource-orbs', '.ritual-bell']) {
        for (const target of document.querySelectorAll(selector)) {
          if (visible(target) && intersects(target.getBoundingClientRect())) criticalOverlap.push({ source:'toast', target:selector });
        }
      }
    }
    const combatCardReadability = [];
    for (const card of [...document.querySelectorAll('#screen-ritual-battle .ritual-hand .ritual-card')].filter(visible)) {
      const rect = card.getBoundingClientRect();
      const title = card.querySelector('.ritual-card-frame>strong');
      const copy = card.querySelector('.ritual-card-frame>p');
      if (!title || !copy || !visible(title) || !visible(copy)) continue;
      const titleSize = Number.parseFloat(getComputedStyle(title).fontSize);
      const copySize = Number.parseFloat(getComputedStyle(copy).fontSize);
      const copyHeight = copy.getBoundingClientRect().height;
      if (rect.width < 122 || rect.height < 170 || titleSize < 11.6 || copySize < 9.2 || copyHeight < 25) {
        combatCardReadability.push({
          card:card.dataset.cardId || card.textContent.trim().replace(/\s+/g, ' ').slice(0, 60),
          width:Math.round(rect.width),
          height:Math.round(rect.height),
          titleSize,
          copySize,
          copyHeight:Math.round(copyHeight),
        });
      }
    }
    return { tinyText, interactiveOverflow, portraits, viewportOverflow, layoutWaste, cardOverlap, criticalOverlap, combatCardReadability };
  });
  return { label, viewport, errors:[...errors], ...metrics };
}

async function dismissOptional(page, selector) {
  const locator = page.locator(selector);
  if (await locator.count() && await locator.first().isVisible()) await clickDom(page, selector);
}

async function dismissOnboarding(page) {
  const selectors = [
    '[data-action="ritual-card-type-tutorial-close"]',
    '[data-action="ritual-close-tutorial"]',
  ];
  let idlePasses = 0;
  for (let index = 0; index < 24 && idlePasses < 4; index++) {
    let dismissed = false;
    for (const selector of selectors) {
      const locator = page.locator(selector).first();
      if (await locator.count() && await locator.isVisible()) {
        await clickDom(page, selector);
        await page.waitForTimeout(180);
        dismissed = true;
        idlePasses = 0;
        break;
      }
    }
    if (!dismissed) {
      idlePasses++;
      await page.waitForTimeout(180);
    }
  }
}

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

async function auditViewport(browser, viewport) {
  console.log(`[${viewport.width}x${viewport.height}] démarrage`);
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', error => errors.push(`page: ${error.message}`));
  page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  await page.goto(baseUrl, { waitUntil:'load', timeout:15000 });
  await page.locator('[data-action="ritual-new"]').waitFor({ state:'visible', timeout:10000 });
  const results = [await inspectScreen(page, 'dashboard', viewport, errors)];

  await clickDom(page, '[data-action="codex"]');
  results.push(await inspectScreen(page, 'codex_daily_life', viewport, errors));
  await clickDom(page, '[data-action="ritual-modal-close"]');
  await clickDom(page, '[data-action="ritual-observatory"]');
  results.push(await inspectScreen(page, 'observatory_masked', viewport, errors));
  await clickDom(page, '[data-action="ritual-modal-close"]');
  await clickDom(page, '[data-action="test-gacha"]');
  results.push(await inspectScreen(page, 'gacha_lab', viewport, errors));
  const forcedSpell = page.locator('[data-ritual-lab-unlock^="spell:"]').first();
  if (await forcedSpell.count()) {
    await clickDom(page, '[data-ritual-lab-unlock^="spell:"]');
    results.push(await inspectScreen(page, 'gacha_spell_suspense', viewport, errors));
    await page.locator('.gacha-reveal-modal').waitFor({ state:'visible', timeout:5000 });
    results.push(await inspectScreen(page, 'gacha_spell_reveal', viewport, errors));
    await clickDom(page, '.gacha-reveal-modal [data-action="test-gacha"]');
    await page.locator('.gacha-lab-dashboard').waitFor({ state:'visible' });
    const forcedLastWord = page.locator('[data-ritual-lab-unlock^="awakening:"]').first();
    if (await forcedLastWord.count()) {
      await clickDom(page, '[data-ritual-lab-unlock^="awakening:"]');
      results.push(await inspectScreen(page, 'gacha_last_word_suspense', viewport, errors));
      await page.locator('.gacha-reveal-modal').waitFor({ state:'visible', timeout:5000 });
      results.push(await inspectScreen(page, 'gacha_last_word_reveal', viewport, errors));
      await clickDom(page, '.gacha-reveal-modal [data-action="test-gacha"]');
      await page.locator('.gacha-lab-dashboard').waitFor({ state:'visible' });
    }
  }
  const recapPreview = page.locator('[data-action="ritual-lab-run-recap"]');
  if (await recapPreview.count()) {
    await clickDom(page, '[data-action="ritual-lab-run-recap"]');
    await page.locator('.run-progress-recap-modal').waitFor({ state:'visible' });
    results.push(await inspectScreen(page, 'run_progress_recap', viewport, errors));
    await clickDom(page, '.run-progress-recap-modal [data-action="test-gacha"]');
    await page.locator('.gacha-lab-dashboard').waitFor({ state:'visible' });
    console.log(`[${viewport.width}x${viewport.height}] prévisualisation récap validée`);
  }
  await clickDom(page, '[data-action="ritual-modal-close"]');
  await dismissOnboarding(page);

  await clickDom(page, '[data-action="ritual-new"]');
  results.push(await inspectScreen(page, 'prologue', viewport, errors));
  await clickDom(page, '[data-action="ritual-choose-guardian"]');
  results.push(await inspectScreen(page, 'guardians', viewport, errors));
  await clickDom(page, '[data-ritual-guardian="controleur"]');
  results.push(await inspectScreen(page, 'deck_preview', viewport, errors));
  await clickDom(page, '[data-action="ritual-confirm-guardian"]');
  await dismissOnboarding(page);
  results.push(await inspectScreen(page, 'route_map', viewport, errors));

  const futureRoute = page.locator('.route-map-node.future').last();
  if (await futureRoute.count()) {
    if (!(await futureRoute.isDisabled())) errors.push('route: un arrêt futur reste cliquable');
    results.push(await inspectScreen(page, 'route_future_locked', viewport, errors));
  }
  const currentRoute = page.locator('.route-map-node.current').first();
  if (await currentRoute.count()) {
    await clickDom(page, '.route-map-node.current');
    results.push(await inspectScreen(page, 'route_detail', viewport, errors));
  }
  const commitRoute = page.locator('[data-ritual-path="battle"]').first();
  if (await commitRoute.count() && await commitRoute.isVisible()) {
    await clickDom(page, '[data-ritual-path="battle"]');
    await dismissOnboarding(page);
    results.push(await inspectScreen(page, 'battle_opening', viewport, errors));
    await page.evaluate(() => {
      const toast = document.querySelector('#toast');
      toast.textContent = 'Il manque 1 Cendre.';
      toast.classList.add('battle-toast', 'show');
    });
    results.push(await inspectScreen(page, 'battle_toast_feedback', viewport, errors));
    await page.evaluate(() => document.querySelector('#toast')?.classList.remove('battle-toast', 'show'));
    const handCard = page.locator('[data-ritual-hand]').first();
    const emptyLane = page.locator('[data-ritual-player-slot]').first();
    if (await handCard.count() && await emptyLane.count()) {
      await clickDom(page, '[data-ritual-hand]');
      await clickDom(page, '[data-ritual-player-slot]');
      await page.waitForTimeout(250);
      results.push(await inspectScreen(page, 'battle_card_played', viewport, errors));
    }
    await clickDom(page, '[data-action="deck"]');
    results.push(await inspectScreen(page, 'run_deck_wounds', viewport, errors));
    const deckZoomCard = page.locator('.run-card-state .ritual-card').first();
    if (await deckZoomCard.count()) {
      await clickDom(page, '.run-card-state .ritual-card');
      await page.locator('.card-zoom-layer').waitFor({ state:'visible' });
      results.push(await inspectScreen(page, 'run_deck_card_zoom', viewport, errors));
      await clickDom(page, '.card-zoom-close');
      await page.locator('.run-deck-state-modal').waitFor({ state:'visible' });
    }
    await clickDom(page, '.run-deck-state-modal [data-action="ritual-modal-close"]');
    const abandon = page.locator('.battle-abandon-link');
    if (await abandon.count() && await abandon.isVisible()) {
      console.log(`[${viewport.width}x${viewport.height}] abandon combat`);
      await clickDom(page, '.battle-abandon-link');
      await clickDom(page, '[data-action="ritual-confirm-abandon"]');
      await page.locator('.death-modal').waitFor({ state:'visible' });
      console.log(`[${viewport.width}x${viewport.height}] rapport de défaite`);
      await clickDom(page, '[data-action="ritual-open-run-gacha"]');
      await page.locator('.gacha-reveal-modal').waitFor({ state:'visible', timeout:7000 });
      console.log(`[${viewport.width}x${viewport.height}] reveal de fin`);
      await clickDom(page, '[data-action="ritual-finish-after-gacha"]');
      await page.locator('.run-progress-recap-modal').waitFor({ state:'visible' });
      console.log(`[${viewport.width}x${viewport.height}] récap réel`);
      results.push(await inspectScreen(page, 'run_progress_recap_actual', viewport, errors));
      await clickDom(page, '[data-action="ritual-complete-run-recap"]');
    }
  }
  console.log(`[${viewport.width}x${viewport.height}] terminé`);
  await context.close();
  return results;
}

(async () => {
  fs.mkdirSync(outputDir, { recursive:true });
  const browser = await chromium.launch({
    headless:true,
    executablePath:chromeCandidates[0],
    args:['--hide-scrollbars'],
  });
  const viewports = process.env.MOONRAIL_SMOKE_FAST
    ? [{ width:1366, height:768 }]
    : [{ width:1366, height:768 }, { width:1920, height:1080 }];
  const reports = [];
  for (const viewport of viewports) reports.push(...await auditViewport(browser, viewport));
  await browser.close();
  const reportPath = path.join(outputDir, 'ui_pass_7_1_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(reports, null, 2));
  const failures = reports.flatMap(report => [
    ...report.layoutWaste.map(item => `${report.label}: ${item.bottomGap}px unused below ${item.area} controls`),
    ...report.cardOverlap.map(item => `${report.label}: ${item.context} card ${item.cardHeight}px text overlaps stats by ${item.overlap}px for ${item.name}`),
    ...report.criticalOverlap.map(item => `${report.label}: ${item.source} overlaps ${item.target}`),
    ...report.combatCardReadability.map(item => `${report.label}: carte de main trop compacte ${item.card} (${item.width}x${item.height}, texte ${item.copySize}px/${item.copyHeight}px)`),
    ...report.errors.map(error => `${report.label}: ${error}`),
    ...report.tinyText.map(item => `${report.label}: texte ${item.size}px « ${item.text} »`),
    ...report.interactiveOverflow.map(item => `${report.label}: libellé interactif tronqué « ${item.text} »`),
  ]);
  console.log(`UI smoke: ${reports.length} écrans inspectés · ${failures.length} alerte(s)`);
  for (const failure of failures.slice(0, 40)) console.log(`- ${failure}`);
  if (reports.some(report => report.errors.length || report.tinyText.length || report.interactiveOverflow.length || report.layoutWaste.length || report.cardOverlap.length || report.criticalOverlap.length || report.combatCardReadability.length)) process.exitCode = 1;
})().catch(error => {
  console.error(error);
  process.exit(1);
});
