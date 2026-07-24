const fs = require('fs');
const path = require('path');

function loadPlaywright() {
  const bundledModules = path.join(
    process.env.USERPROFILE || '',
    '.cache',
    'codex-runtimes',
    'codex-primary-runtime',
    'dependencies',
    'node',
    'node_modules',
  );
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
    try { return require(candidate); } catch (_) { /* try the next bundled runtime */ }
  }
  throw new Error('Playwright introuvable. Définissez MOONRAIL_PLAYWRIGHT vers son dossier npm.');
}

const { chromium } = loadPlaywright();
const baseUrl = process.env.MOONRAIL_URL || 'http://127.0.0.1:8765/app/';
const outputDir = path.resolve(__dirname, '..', 'qa-ui');
const chromeCandidates = [
  process.env.MOONRAIL_CHROME,
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(candidate => candidate && fs.existsSync(candidate));

const viewports = [
  { label:'1280x600', width:1280, height:600 },
  { label:'1024x768', width:1024, height:768 },
  { label:'1366x768', width:1366, height:768 },
  { label:'1920x1080', width:1920, height:1080 },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function clickDom(page, selector) {
  await page.evaluate(selector => {
    const visible = element => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none'
        && style.visibility !== 'hidden'
        && Number(style.opacity) > 0
        && rect.width > 1
        && rect.height > 1;
    };
    const element = [...document.querySelectorAll(selector)].find(visible);
    if (!element) throw new Error(`Selector not found: ${selector}`);
    element.click();
  }, selector);
}

async function dismissOnboarding(page) {
  const selectors = [
    '[data-action="ritual-card-type-tutorial-close"]',
    '[data-action="ritual-close-tutorial"]',
    '[data-action="ritual-modal-close"]',
  ];
  for (let pass = 0; pass < 12; pass++) {
    let dismissed = false;
    for (const selector of selectors) {
      const button = page.locator(`#modal-layer.open ${selector}`).first();
      if (await button.count() && await button.isVisible()) {
        await clickDom(page, `#modal-layer.open ${selector}`);
        await page.waitForTimeout(90);
        dismissed = true;
        break;
      }
    }
    if (!dismissed) return;
  }
}

async function startDeterministicCombat(page) {
  await page.goto(baseUrl, { waitUntil:'load', timeout:15000 });
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('moonrail.')) localStorage.removeItem(key);
    }
    localStorage.setItem('moonrail.ritual.profile.v1', JSON.stringify({
      attempts:1,
      firstBattleTutorialCompleted:true,
      cardTutorialScopeVersion:'deck-v2',
      seenCardTypeTutorials:[
        'zero_cost', 'zero_attack', 'zero_health', 'zero_trinity', 'bones',
        'signature', 'last_word', 'uncommon', 'rare', 'secret', 'unique',
        'sigil:airborne', 'sigil:reach', 'sigil:thorns', 'sigil:brittle',
        'sigil:fecund', 'sigil:deathless', 'sigil:many_lived',
        'sigil:bifurcated', 'sigil:bone_digger', 'sigil:sprinter',
        'sigil:guardian', 'sigil:pyre', 'sigil:hoard', 'sigil:omen_break',
        'sigil:destiny', 'sigil:echo',
      ],
      pendingCardTypeTutorials:[],
    }));
  });
  await page.reload({ waitUntil:'load', timeout:15000 });
  await page.locator('[data-action="ritual-new"]').waitFor({ state:'visible' });
  await clickDom(page, '[data-action="ritual-new"]');
  await clickDom(page, '[data-action="ritual-choose-guardian"]');
  await clickDom(page, '[data-ritual-guardian="controleur"]');
  await clickDom(page, '[data-action="ritual-confirm-guardian"]');
  await page.locator('#screen-ritual-battle.active').waitFor({ state:'visible', timeout:15000 });
  await dismissOnboarding(page);
  await page.locator('#ritual-hand [data-ritual-hand]').first().waitFor({ state:'visible' });
  await page.waitForTimeout(120);
  assert(!(await page.locator('#screen-ritual-battle.first-battle-guided').count()), 'Le smoke doit utiliser un combat non tutoriel.');
}

async function affordableHandCard(page) {
  const result = await page.evaluate(() => {
    const lumen = Number(document.querySelector('#ritual-lumen')?.textContent || 0);
    const ashes = Number(document.querySelector('#ritual-ashes')?.textContent || 0);
    const candidates = [...document.querySelectorAll('#ritual-hand [data-ritual-hand]')].map(card => {
      const costNode = card.querySelector('.ritual-cost');
      const amount = Number(costNode?.textContent?.match(/\d+/)?.[0] || 0);
      const ashCost = costNode?.classList.contains('ashes') || false;
      const health = Number(card.querySelector('.ritual-card-stats .health')?.textContent || 0);
      const attack = Number(card.querySelector('.ritual-card-stats .attack')?.textContent || 0);
      return {
        index:Number(card.dataset.ritualHand),
        id:card.dataset.cardId,
        amount,
        health,
        attack,
        affordable:ashCost ? ashes >= amount : lumen >= amount,
      };
    }).filter(card => card.affordable);
    candidates.sort((a, b) => a.amount - b.amount || b.health - a.health || b.attack - a.attack);
    return candidates[0] || null;
  });
  assert(result, 'Aucune carte abordable dans la main déterministe.');
  return result;
}

async function assertSelectionAffordances(page, card) {
  await clickDom(page, `[data-ritual-hand="${card.index}"]`);
  await page.locator(`[data-ritual-hand="${card.index}"][aria-pressed="true"]`).waitFor({ state:'visible' });
  const state = await page.evaluate(() => ({
    placementSlots:document.querySelectorAll(
      '#ritual-player-board .ritual-slot.placement-ready,'
      + '#ritual-player-board .ritual-slot.placement-blocked,'
      + '#ritual-player-board .ritual-slot.placement-overwrite',
    ).length,
    previews:[...document.querySelectorAll('#ritual-player-board .placement-preview')]
      .map(element => element.textContent.trim())
      .filter(Boolean),
    readButton:[...document.querySelectorAll('[data-action="ritual-inspect-selected"]')]
      .some(element => /Lire en grand/i.test(element.textContent)),
  }));
  assert(state.placementSlots === 3, `Sélection : ${state.placementSlots}/3 affordances de pose.`);
  assert(state.previews.length === 3, `Sélection : ${state.previews.length}/3 libellés de pose.`);
  assert(state.readButton, 'Sélection : bouton « Lire en grand » absent du coach.');
  await page.screenshot({ path:path.join(outputDir, 'combat_feedback_01_selection.png'), animations:'disabled' });
}

async function openZoomWithKeyboard(page, expectedHealth) {
  const before = await page.evaluate(() => ({
    turn:document.querySelector('#ritual-turn')?.textContent,
    hand:document.querySelectorAll('#ritual-hand [data-ritual-hand]').length,
    board:document.querySelectorAll('#ritual-player-board .ritual-slot.occupied').length,
  }));
  await page.keyboard.press('i');
  const dialog = page.locator('.card-zoom-panel[role="dialog"][aria-modal="true"]');
  await dialog.waitFor({ state:'visible' });
  const healthText = await dialog.locator('.card-zoom-meta').textContent();
  assert(
    healthText.includes(`${expectedHealth}/${expectedHealth}`),
    `Zoom : Vie actuelle incorrecte (${healthText.trim()}).`,
  );
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state:'detached' });
  const after = await page.evaluate(() => ({
    turn:document.querySelector('#ritual-turn')?.textContent,
    hand:document.querySelectorAll('#ritual-hand [data-ritual-hand]').length,
    board:document.querySelectorAll('#ritual-player-board .ritual-slot.occupied').length,
    selected:!!document.querySelector('#ritual-hand [data-ritual-hand][aria-pressed="true"]'),
    placement:document.querySelectorAll('#ritual-player-board .placement-preview').length,
  }));
  assert(
    after.turn === before.turn && after.hand === before.hand && after.board === before.board,
    'Échap depuis le zoom a déclenché une action derrière le dialogue.',
  );
  assert(after.selected && after.placement === 3, 'Échap depuis le zoom a perdu la sélection tactique.');
}

async function measureZoomAndCoach(page, viewport) {
  await page.setViewportSize({ width:viewport.width, height:viewport.height });
  await page.waitForTimeout(60);
  const coach = await page.evaluate(label => {
    const element = document.querySelector('#ritual-hint .battle-coach');
    if (!element) return { label, missing:true };
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      label,
      rect:{ left:rect.left, top:rect.top, right:rect.right, bottom:rect.bottom, width:rect.width, height:rect.height },
      overflowX:style.overflowX,
      overflowY:style.overflowY,
      scrollWidth:element.scrollWidth,
      clientWidth:element.clientWidth,
      scrollHeight:element.scrollHeight,
      clientHeight:element.clientHeight,
      hasReadButton:!!element.querySelector('[data-action="ritual-inspect-selected"]'),
    };
  }, viewport.label);
  assert(!coach.missing, `[${viewport.label}] Coach de combat absent.`);
  assert(
    coach.rect.left >= -1 && coach.rect.top >= -1
      && coach.rect.right <= viewport.width + 1 && coach.rect.bottom <= viewport.height + 1,
    `[${viewport.label}] Coach hors viewport : ${JSON.stringify(coach.rect)}.`,
  );
  assert(coach.hasReadButton, `[${viewport.label}] Bouton de lecture absent du coach.`);
  assert(
    coach.scrollWidth <= coach.clientWidth + 2 && coach.scrollHeight <= coach.clientHeight + 2,
    `[${viewport.label}] Coach tronqué (${coach.scrollWidth}x${coach.scrollHeight}/${coach.clientWidth}x${coach.clientHeight}).`,
  );

  await page.keyboard.press('i');
  await page.locator('.card-zoom-panel[role="dialog"]').waitFor({ state:'visible' });
  const zoom = await page.evaluate(label => {
    const panel = document.querySelector('.card-zoom-panel[role="dialog"]');
    const aside = panel?.querySelector(':scope > aside');
    const close = panel?.querySelector('.card-zoom-close');
    const actions = panel?.querySelector('.modal-actions');
    const rectOf = element => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { left:rect.left, top:rect.top, right:rect.right, bottom:rect.bottom, width:rect.width, height:rect.height };
    };
    const overflowAllowsScroll = element => {
      if (!element) return false;
      const style = getComputedStyle(element);
      return ['auto', 'scroll'].includes(style.overflowY);
    };
    return {
      label,
      panel:rectOf(panel),
      close:rectOf(close),
      actions:rectOf(actions),
      panelClipped:!!panel && panel.scrollHeight > panel.clientHeight + 2 && !overflowAllowsScroll(panel),
      asideClipped:!!aside && aside.scrollHeight > aside.clientHeight + 2 && !overflowAllowsScroll(aside),
    };
  }, viewport.label);
  assert(zoom.panel, `[${viewport.label}] Panneau de zoom absent.`);
  assert(
    zoom.panel.left >= -1 && zoom.panel.top >= -1
      && zoom.panel.right <= viewport.width + 1 && zoom.panel.bottom <= viewport.height + 1,
    `[${viewport.label}] Zoom hors viewport : ${JSON.stringify(zoom.panel)}.`,
  );
  assert(zoom.close && zoom.close.top >= zoom.panel.top && zoom.close.bottom <= zoom.panel.bottom, `[${viewport.label}] Fermeture du zoom inaccessible.`);
  assert(!zoom.panelClipped && !zoom.asideClipped, `[${viewport.label}] Contenu du zoom tronqué sans défilement.`);
  assert(
    zoom.actions
      && (zoom.actions.bottom <= zoom.panel.bottom + 2 || !zoom.asideClipped),
    `[${viewport.label}] Actions du zoom inaccessibles.`,
  );
  await page.keyboard.press('Escape');
  await page.locator('.card-zoom-panel[role="dialog"]').waitFor({ state:'detached' });
  return { coach, zoom };
}

async function assertDragAffordances(page, handIndex) {
  const state = await page.evaluate(index => {
    const card = document.querySelector(`[data-ritual-hand="${index}"]`);
    if (!card) return { missing:true };
    const transfer = new DataTransfer();
    card.dispatchEvent(new DragEvent('dragstart', { bubbles:true, cancelable:true, dataTransfer:transfer }));
    return {
      missing:false,
      dragging:document.querySelector('#screen-ritual-battle')?.classList.contains('combat-dragging'),
      targets:document.querySelectorAll(
        '#ritual-player-board .drag-placement-ready,'
        + '#ritual-player-board .drag-placement-blocked,'
        + '#ritual-player-board .drag-placement-overwrite',
      ).length,
      labels:[...document.querySelectorAll('#ritual-player-board .drag-placement-label')]
        .map(element => element.textContent.trim())
        .filter(Boolean),
    };
  }, handIndex);
  assert(!state.missing, 'Drag : carte source absente.');
  assert(state.dragging, 'Drag : état global combat-dragging absent.');
  assert(state.targets === 3, `Drag : ${state.targets}/3 cases révélées.`);
  assert(state.labels.length === 3, `Drag : ${state.labels.length}/3 libellés visibles.`);
  await page.evaluate(index => {
    const card = document.querySelector(`[data-ritual-hand="${index}"]`);
    card?.dispatchEvent(new DragEvent('dragend', { bubbles:true, cancelable:true, dataTransfer:new DataTransfer() }));
  }, handIndex);
  const cleared = await page.evaluate(() => ({
    dragging:document.querySelector('#screen-ritual-battle')?.classList.contains('combat-dragging'),
    targets:document.querySelectorAll('[class*="drag-placement-"]').length,
  }));
  assert(!cleared.dragging && cleared.targets === 0, 'Drag : affordances non nettoyées après dragend.');
  await page.keyboard.press('Escape');
}

async function placePlayerOppositeEnemy(page) {
  const lane = await page.evaluate(() => {
    const enemy = document.querySelector('#ritual-enemy-board .ritual-card[data-combat-side="enemy"]');
    return enemy ? Number(enemy.dataset.combatLane) : -1;
  });
  assert(lane >= 0, 'Aucune unité ennemie à opposer.');
  const card = await affordableHandCard(page);
  await clickDom(page, `[data-ritual-hand="${card.index}"]`);
  await clickDom(page, `[data-ritual-player-slot="${lane}"]`);
  await page.locator(`#ritual-player-board [data-combat-side="player"][data-combat-lane="${lane}"]`).waitFor({ state:'visible' });
  return lane;
}

async function inspectUnit(page, side, lane, expectedGauge = null) {
  const selector = `[data-combat-side="${side}"][data-combat-lane="${lane}"]`;
  await clickDom(page, selector);
  try {
    await page.locator('#ritual-hint [data-coach-state="inspecting"]').waitFor({ state:'visible' });
  } catch (error) {
    const diagnostic = await page.evaluate(({ selector, side, lane }) => ({
      selector,
      matches:[...document.querySelectorAll(selector)].map(element => ({
        tag:element.tagName,
        className:element.className,
        text:element.textContent.trim().slice(0, 80),
      })),
      coach:document.querySelector('#ritual-hint')?.textContent.trim(),
      selected:document.querySelector('#ritual-hand [aria-pressed="true"]')?.dataset.ritualHand ?? null,
      phase:document.querySelector('#screen-ritual-battle')?.dataset.combatPhase ?? null,
      side,
      lane,
    }), { selector, side, lane });
    throw new Error(`${side} W${lane + 1} : inspection absente. ${JSON.stringify(diagnostic)}. ${error.message}`);
  }
  const state = await page.evaluate(({ side, lane, expectedGauge }) => {
    const source = document.querySelector(`.ritual-slot.combat-source [data-combat-side="${side}"][data-combat-lane="${lane}"]`);
    const targets = [...document.querySelectorAll('.ritual-slot.combat-target')];
    const labels = [...document.querySelectorAll('.combat-relation-label')]
      .map(element => element.textContent.trim())
      .filter(Boolean);
    const gauge = expectedGauge
      ? document.querySelector(`.combat-life-bar.${expectedGauge}.combat-gauge-target`)
      : null;
    return { source:!!source, targets:targets.length, labels, gauge:!!gauge };
  }, { side, lane, expectedGauge });
  assert(state.source, `${side} W${lane + 1} : source d’inspection non signalée.`);
  assert(state.targets > 0, `${side} W${lane + 1} : aucune cible visuelle.`);
  assert(state.labels.length > 0, `${side} W${lane + 1} : aucune relation textuelle.`);
  if (expectedGauge) assert(state.gauge, `${side} W${lane + 1} : jauge ${expectedGauge} non ciblée.`);
  if (side === 'player') {
    await page.screenshot({ path:path.join(outputDir, 'combat_feedback_02_inspection.png'), animations:'disabled' });
  }
  await page.keyboard.press('Escape');
  await page.locator('#ritual-hint [data-coach-state="inspecting"]').waitFor({ state:'detached' });
}

async function assertReducedMotion(page, forecastLane) {
  await page.emulateMedia({ reducedMotion:'reduce' });
  const card = await affordableHandCard(page);
  await clickDom(page, `[data-ritual-hand="${card.index}"]`);
  const placement = await page.evaluate(() => ({
    classes:document.querySelectorAll(
      '#ritual-player-board .placement-ready,'
      + '#ritual-player-board .placement-blocked,'
      + '#ritual-player-board .placement-overwrite',
    ).length,
    labels:[...document.querySelectorAll('#ritual-player-board .placement-preview')]
      .map(element => element.textContent.trim())
      .filter(Boolean),
  }));
  assert(placement.classes === 3 && placement.labels.length === 3, 'Reduced motion : affordances de pose perdues.');
  await page.keyboard.press('Escape');
  await clickDom(page, `[data-combat-side="forecast"][data-combat-lane="${forecastLane}"]`);
  const inspection = await page.evaluate(() => ({
    source:!!document.querySelector('.ritual-slot.combat-source'),
    targets:document.querySelectorAll('.ritual-slot.combat-target').length,
    labels:[...document.querySelectorAll('.combat-relation-label')]
      .map(element => element.textContent.trim())
      .filter(Boolean),
    coach:document.querySelector('#ritual-hint [data-coach-state="inspecting"]')?.textContent.trim() || '',
  }));
  assert(inspection.source && inspection.targets > 0, 'Reduced motion : classes source/cible perdues.');
  assert(inspection.labels.length > 0 && inspection.coach.length > 20, 'Reduced motion : libellés tactiques perdus.');
  await page.keyboard.press('Escape');
  await page.emulateMedia({ reducedMotion:'no-preference' });
}

async function assertResolutionSequence(page) {
  const initialTurn = Number(await page.locator('#ritual-turn').textContent());
  await page.evaluate(() => {
    const screen = document.querySelector('#screen-ritual-battle');
    window.__combatFeedbackPhases = [];
    window.__combatFeedbackObserver?.disconnect();
    const record = () => {
      const phase = screen?.dataset.combatPhase;
      if (phase && window.__combatFeedbackPhases.at(-1) !== phase) window.__combatFeedbackPhases.push(phase);
    };
    window.__combatFeedbackObserver = new MutationObserver(record);
    window.__combatFeedbackObserver.observe(screen, { attributes:true, attributeFilter:['data-combat-phase'] });
    record();
  });
  await clickDom(page, '#ritual-bell');
  await page.waitForFunction(() => {
    const screen = document.querySelector('#screen-ritual-battle');
    return screen?.dataset.combatPhase === 'telegraph'
      && !!screen.querySelector('.combat-source')
      && !!screen.querySelector('.combat-target');
  });
  await page.screenshot({ path:path.join(outputDir, 'combat_feedback_03_telegraph.png') });
  await clickDom(page, '#ritual-bell');
  await page.locator('#ritual-bell.accelerating').waitFor({ state:'visible' });
  await page.waitForFunction(() => {
    const screen = document.querySelector('#screen-ritual-battle');
    return screen?.dataset.combatPhase === 'impact'
      && !!screen.querySelector('.combat-delta');
  });
  await page.screenshot({ path:path.join(outputDir, 'combat_feedback_04_impact.png') });
  await clickDom(page, '#ritual-bell');
  await page.waitForFunction(
    turn => Number(document.querySelector('#ritual-turn')?.textContent || 0) === turn + 1,
    initialTurn,
    { timeout:12000 },
  );
  await page.waitForFunction(() => !document.querySelector('#screen-ritual-battle')?.classList.contains('combat-resolving'));
  await page.waitForTimeout(260);
  const result = await page.evaluate(() => ({
    turn:Number(document.querySelector('#ritual-turn')?.textContent || 0),
    phases:[...(window.__combatFeedbackPhases || [])],
  }));
  const telegraph = result.phases.indexOf('telegraph');
  const impact = result.phases.indexOf('impact');
  assert(telegraph >= 0 && impact > telegraph, `Résolution : ordre telegraph→impact absent (${result.phases.join('→')}).`);
  assert(result.turn === initialTurn + 1, `Accélération : double tour détecté (${initialTurn}→${result.turn}).`);
}

async function main() {
  fs.mkdirSync(outputDir, { recursive:true });
  const launchOptions = {
    headless:true,
    args:['--hide-scrollbars', '--disable-background-networking'],
  };
  if (chromeCandidates[0]) launchOptions.executablePath = chromeCandidates[0];
  const browser = await chromium.launch(launchOptions);
  let context = null;
  try {
    context = await browser.newContext({ viewport:{ width:1366, height:768 }, reducedMotion:'no-preference' });
    await context.addInitScript(() => {
      let deterministicNow = 1784887200000;
      Object.defineProperty(Date, 'now', {
        configurable:true,
        value:() => deterministicNow++,
      });
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    await startDeterministicCombat(page);

    const handCard = await affordableHandCard(page);
    await assertSelectionAffordances(page, handCard);
    await openZoomWithKeyboard(page, handCard.health);

    const fitReports = [];
    for (const viewport of viewports) {
      fitReports.push(await measureZoomAndCoach(page, viewport));
    }
    await page.setViewportSize({ width:1366, height:768 });
    await page.keyboard.press('Escape');

    await assertDragAffordances(page, handCard.index);
    const occupiedLane = await placePlayerOppositeEnemy(page);
    await inspectUnit(page, 'player', occupiedLane);
    await inspectUnit(page, 'enemy', occupiedLane);

    const forecastLane = await page.evaluate(() => {
      const card = document.querySelector('#ritual-enemy-forecast .ritual-card[data-combat-side="forecast"]');
      return card ? Number(card.dataset.combatLane) : -1;
    });
    assert(forecastLane >= 0, 'Aucune manœuvre annoncée à inspecter.');
    await inspectUnit(page, 'forecast', forecastLane, 'enemy');
    await assertReducedMotion(page, forecastLane);
    await assertResolutionSequence(page);

    console.log(JSON.stringify({
      baseUrl,
      seed:1784887200000,
      fit:viewports.map(viewport => viewport.label),
      checks:[
        'sélection et trois affordances',
        'zoom clavier et Échap sans action parasite',
        'inspection joueur/ennemi/annonce',
        'telegraph→impact et accélération idempotente',
        'drag et affordances',
        'responsive zoom/coach',
        'reduced-motion lisible',
      ],
    }, null, 2));
    console.log('COMBAT FEEDBACK SMOKE: OK');
  } finally {
    await context?.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

main().catch(error => {
  console.error(`COMBAT FEEDBACK SMOKE: FAIL\n${error.stack || error.message}`);
  process.exitCode = 1;
});
