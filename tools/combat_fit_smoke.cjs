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
const viewports = [
  { label:'1280x600', width:1280, height:600 },
  { label:'1280x720', width:1280, height:720 },
  { label:'1366x768', width:1366, height:768 },
  { label:'1024x768', width:1024, height:768 },
  { label:'1600x900', width:1600, height:900 },
  { label:'1920x1080', width:1920, height:1080 },
];

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

async function playScoringTurn(page) {
  await page.setViewportSize({ width:1366, height:768 });
  const placement = await page.evaluate(() => {
    const lumen = Number(document.querySelector('#ritual-lumen')?.textContent || 0);
    const hand = [...document.querySelectorAll('#ritual-hand [data-ritual-hand]')];
    const cardIndex = hand.findIndex(card => {
      const cost = card.querySelector('.ritual-cost')?.textContent || '';
      const amount = Number(cost.match(/\d+/)?.[0] || 0);
      const power = Number(card.querySelector('.ritual-card-stats b')?.textContent || 0);
      return cost.includes('✦') && amount <= lumen && power > 0;
    });
    const playerSlots = [...document.querySelectorAll('#ritual-player-board [data-ritual-player-slot]')];
    const enemySlots = [...document.querySelectorAll('#ritual-enemy-board .ritual-slot')];
    const laneIndex = playerSlots.findIndex((slot, index) => slot.classList.contains('empty') && enemySlots[index]?.classList.contains('empty'));
    return { cardIndex, laneIndex };
  });
  if (placement.cardIndex < 0 || placement.laneIndex < 0) throw new Error(`Tour de jauge impossible: ${JSON.stringify(placement)}`);
  await clickDom(page, `[data-ritual-hand="${placement.cardIndex}"]`);
  await clickDom(page, `[data-ritual-player-slot="${placement.laneIndex}"]`);
  await clickDom(page, '#ritual-bell');
  await page.waitForFunction(() => Number(document.querySelector('#ritual-turn')?.textContent || 0) > 1, null, { timeout:7000 });
  await page.waitForTimeout(650);
}

async function measureCombat(page, viewport) {
  await page.setViewportSize({ width:viewport.width, height:viewport.height });
  await page.waitForTimeout(100);
  return page.evaluate(label => {
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
        aspectRatio:rect.height ? rect.width / rect.height : 0,
      };
    };
    const overflowOf = element => element
      ? element.scrollHeight > element.clientHeight + 2 || element.scrollWidth > element.clientWidth + 2
      : false;
    const elementMetric = selector => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const style = getComputedStyle(element);
      return {
        rect:rectOf(element),
        display:style.display,
        visible:visible(element),
        overflow:overflowOf(element),
      };
    };
    const table = document.querySelector('#screen-ritual-battle .ritual-table');
    const cards = [...document.querySelectorAll('#screen-ritual-battle .ritual-hand .ritual-card')].filter(visible).map(card => {
      const rect = card.getBoundingClientRect();
      const title = card.querySelector('.ritual-card-frame>strong');
      const copy = card.querySelector('.ritual-card-frame>p');
      const stats = card.querySelector('.ritual-card-stats');
      return {
        id:card.dataset.cardId || card.textContent.trim().slice(0, 42),
        width:Math.round(rect.width),
        height:Math.round(rect.height),
        aspectRatio:rect.height ? rect.width / rect.height : 0,
        titleSize:Number.parseFloat(getComputedStyle(title).fontSize),
        copySize:Number.parseFloat(getComputedStyle(copy).fontSize),
        copyHeight:Math.round(copy.getBoundingClientRect().height),
        overlap:copy.getBoundingClientRect().bottom > stats.getBoundingClientRect().top + 1,
      };
    });
    const lifeBars = [...document.querySelectorAll('#screen-ritual-battle .combat-life-bar')].filter(visible).map(bar => {
      const points = bar.querySelector('header b');
      const labelElement = bar.querySelector('header span');
      const track = bar.querySelector('.health-track');
      const fill = bar.querySelector('.health-fill');
      const trackRect = track?.getBoundingClientRect();
      const fillRect = fill?.getBoundingClientRect();
      return {
        label:labelElement?.textContent?.trim() || '',
        points:points?.textContent?.trim() || '',
        rect:rectOf(bar),
        labelSize:labelElement ? Number.parseFloat(getComputedStyle(labelElement).fontSize) : 0,
        pointsSize:points ? Number.parseFloat(getComputedStyle(points).fontSize) : 0,
        labelOverflow:overflowOf(labelElement),
        track:rectOf(track),
        fill:rectOf(fill),
        fillRatio:trackRect?.width ? fillRect.width / trackRect.width : 0,
      };
    });
    const forecastCards = [...document.querySelectorAll('#screen-ritual-battle .forecast-row .ritual-card')].filter(visible).map(card => ({
      rect:rectOf(card),
      titleSize:Number.parseFloat(getComputedStyle(card.querySelector('.ritual-card-frame>strong')).fontSize),
      overflow:overflowOf(card),
    }));
    const feedItems = [...document.querySelectorAll('#screen-ritual-battle .combat-feed-item')].filter(visible).map(item => ({
      rect:rectOf(item),
      overflow:overflowOf(item),
    }));
    const overflow = [...document.querySelectorAll('#screen-ritual-battle *')]
      .filter(visible)
      .filter(element => {
        const rect = element.getBoundingClientRect();
        return rect.left < -2 || rect.top < -2 || rect.right > innerWidth + 2 || rect.bottom > innerHeight + 2;
      })
      .map(element => `${element.tagName}.${String(element.className || '').slice(0, 48)}`)
      .slice(0, 12);
    const hintElement = document.querySelector('#screen-ritual-battle #ritual-hint');
    const hintStyle = hintElement ? getComputedStyle(hintElement) : null;
    return {
      label,
      viewport:{ width:innerWidth, height:innerHeight },
      table:{ ...elementMetric('#screen-ritual-battle .ritual-table'), clientWidth:table?.clientWidth || 0, clientHeight:table?.clientHeight || 0 },
      topbar:elementMetric('#topbar'),
      header:elementMetric('#screen-ritual-battle .ritual-battle-header'),
      forecast:elementMetric('#screen-ritual-battle .forecast-row'),
      lane:elementMetric('#screen-ritual-battle .lane-readout-shell'),
      enemy:elementMetric('#screen-ritual-battle .enemy-board'),
      player:elementMetric('#screen-ritual-battle .player-board'),
      guide:elementMetric('#screen-ritual-battle .ritual-quick-guide'),
      feed:elementMetric('#screen-ritual-battle .combat-action-feed'),
      controls:elementMetric('#screen-ritual-battle .ritual-battle-controls'),
      hint:hintElement ? {
        rect:rectOf(hintElement),
        fontSize:Number.parseFloat(hintStyle.fontSize),
        visible:visible(hintElement),
        overflow:overflowOf(hintElement),
      } : null,
      cards,
      lifeBars,
      forecastCards,
      feedItems,
      piles:rectOf(document.querySelector('#screen-ritual-battle .ritual-piles')),
      resources:rectOf(document.querySelector('#screen-ritual-battle .ritual-resource-orbs')),
      overflow,
    };
  }, viewport.label);
}

async function measureRewardCardProbe(page) {
  await page.setViewportSize({ width:1280, height:600 });
  return page.evaluate(() => {
    const layer = document.querySelector('#modal-layer');
    const previousClass = layer.className;
    const previousStyle = layer.getAttribute('style');
    layer.classList.add('open');
    layer.style.visibility = 'hidden';
    const modal = document.createElement('section');
    modal.className = 'reward-modal';
    modal.style.cssText = 'position:fixed;left:-4000px;top:0;visibility:hidden';
    modal.innerHTML = '<div class="ritual-reward-grid"><button class="reward-card-option"><article class="ritual-card"></article><div class="reward-card-insight"></div></button></div>';
    layer.appendChild(modal);
    const card = modal.querySelector('.ritual-card');
    const rect = card.getBoundingClientRect();
    const result = { width:rect.width, height:rect.height, aspectRatio:rect.height ? rect.width / rect.height : 0 };
    modal.remove();
    layer.className = previousClass;
    if (previousStyle === null) layer.removeAttribute('style');
    else layer.setAttribute('style', previousStyle);
    return result;
  });
}

function validateCombat(metrics) {
  const failures = [];
  const prefix = `[${metrics.label}]`;
  const fail = message => failures.push(`${prefix} ${message}`);
  const rectsIntersect = (a, b) => a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  if (!metrics.table?.rect) fail('table absente');
  else {
    if (metrics.table.rect.bottom > metrics.viewport.height + 2) fail(`table dépasse le viewport (${metrics.table.rect.bottom}/${metrics.viewport.height})`);
    if (metrics.table.overflow) fail('table interne tronquée');
  }
  if (!metrics.topbar?.rect || !metrics.header?.rect) fail('bandeau global ou bandeau de combat absent');
  else if (metrics.header.rect.top < metrics.topbar.rect.bottom + 2) fail(`bandeau de combat masqué par la barre haute (${metrics.header.rect.top}/${metrics.topbar.rect.bottom})`);
  if (metrics.lifeBars.length !== 2) fail(`jauges /10 absentes ou masquées (${metrics.lifeBars.length}/2)`);
  for (const bar of metrics.lifeBars) {
    if (!/\/10$/.test(bar.points)) fail(`${bar.label || 'jauge'}: compteur /10 illisible (${bar.points})`);
    if (bar.rect.top < (metrics.topbar?.rect?.bottom || 0) + 2) fail(`${bar.label}: jauge sous la barre haute`);
    if (bar.pointsSize < 18 || bar.labelSize < 9) fail(`${bar.label}: typographie trop petite ${bar.pointsSize}/${bar.labelSize}`);
    if (bar.labelOverflow) fail(`${bar.label}: libellé tronqué`);
    if (!bar.track || bar.track.width < 120 || bar.track.height < 10) fail(`${bar.label}: barre de progression trop compacte`);
    const expectedRatio = Number.parseInt(bar.points, 10) / 10;
    if (!bar.fill || Math.abs(bar.fillRatio - expectedRatio) > .025) fail(`${bar.label}: remplissage désynchronisé (${bar.fillRatio.toFixed(3)} au lieu de ${expectedRatio.toFixed(3)})`);
  }
  const minCardWidth = metrics.viewport.height >= 850 ? 104 : 97;
  const minCardHeight = metrics.viewport.height >= 850 ? 140 : 123;
  for (const card of metrics.cards) {
    if (card.width < minCardWidth || card.height < minCardHeight) fail(`${card.id}: carte trop compacte ${card.width}x${card.height}`);
    if (card.aspectRatio < .70 || card.aspectRatio > .82) fail(`${card.id}: proportions écrasées (${card.aspectRatio.toFixed(3)})`);
    if (card.titleSize < 11.6 || card.copySize < 9.2 || card.copyHeight < 19) fail(`${card.id}: texte trop petit ${card.titleSize}/${card.copySize}/${card.copyHeight}`);
    if (card.overlap) fail(`${card.id}: texte chevauche les stats`);
  }
  for (const card of metrics.forecastCards) {
    if (card.rect.height > 42 || card.rect.height < 26) fail(`aperçu annoncé mal dimensionné (${card.rect.width}x${card.rect.height})`);
    if (card.titleSize < 9.5 || card.overflow) fail('aperçu annoncé tronqué ou illisible');
  }
  if (!metrics.guide?.visible || metrics.guide.overflow) fail('repères rapides absents ou tronqués');
  if (!metrics.hint?.visible) fail('aide basse absente');
  else {
    if (metrics.hint.fontSize < 10 || metrics.hint.rect.height < 19) fail(`aide basse trop petite ${metrics.hint.fontSize}/${metrics.hint.rect.height}`);
    if (metrics.hint.overflow) fail('aide basse tronquée');
  }
  for (const item of metrics.feedItems) if (item.overflow) fail('entrée du journal de combat tronquée');
  if (rectsIntersect(metrics.piles, metrics.resources)) fail('Lueurs/Cendres chevauchent les boutons de gauche');
  if (rectsIntersect(metrics.controls?.rect, metrics.hint?.rect)) fail('aide basse superposée à la main');
  const ordered = [metrics.header, metrics.forecast, metrics.lane, metrics.enemy, metrics.player, metrics.guide, metrics.feed, metrics.controls, metrics.hint]
    .filter(item => item?.visible && item.rect);
  for (let index = 1; index < ordered.length; index++) {
    if (ordered[index].rect.top < ordered[index - 1].rect.bottom - 2) fail('deux zones verticales du combat se chevauchent');
  }
  for (const item of metrics.overflow) fail(`débordement viewport: ${item}`);
  if (metrics.viewport.width >= 1280 && metrics.table.rect.width > 1200) fail(`densité de combat trop zoomée (${metrics.table.rect.width}px)`);
  return failures;
}

async function main() {
  const browser = await chromium.launch({
    headless:true,
    executablePath:chromeCandidates[0],
    args:['--hide-scrollbars'],
  });
  try {
    const context = await browser.newContext({ viewport:{ width:1280, height:720 } });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    await page.goto(baseUrl, { waitUntil:'load', timeout:15000 });
    await page.evaluate(() => {
      for (const key of Object.keys(localStorage)) if (key.startsWith('moonrail.')) localStorage.removeItem(key);
      localStorage.setItem('moonrail.ritual.profile.v1', JSON.stringify({ attempts:1, firstBattleTutorialCompleted:true }));
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
    await playScoringTurn(page);
    const reports = [];
    const failures = [];
    for (const viewport of viewports) {
      const metrics = await measureCombat(page, viewport);
      reports.push(metrics);
      failures.push(...validateCombat(metrics));
    }
    const rewardProbe = await measureRewardCardProbe(page);
    if (rewardProbe.height > 200 || rewardProbe.aspectRatio < .70 || rewardProbe.aspectRatio > .74) {
      failures.push(`[récompense 1280x600] carte allongée ${Math.round(rewardProbe.width)}x${Math.round(rewardProbe.height)} (${rewardProbe.aspectRatio.toFixed(3)})`);
    }
    console.log(JSON.stringify(reports.map(report => ({
      viewport:report.label,
      table:report.table.rect,
      bars:report.lifeBars.map(bar => ({ text:bar.points, rect:bar.rect, track:bar.track, fill:bar.fill, fillRatio:Number(bar.fillRatio.toFixed(3)) })),
      cards:report.cards.map(card => `${card.width}x${card.height}`),
      guide:report.guide.rect,
      feed:report.feed.rect,
      controls:report.controls.rect,
      hint:report.hint.rect,
    })).concat([{ rewardCardProbe:{ width:Math.round(rewardProbe.width), height:Math.round(rewardProbe.height), aspectRatio:Number(rewardProbe.aspectRatio.toFixed(3)) } }]), null, 2));
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
