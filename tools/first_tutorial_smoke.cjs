const fs = require('fs');
const path = require('path');

function loadPlaywright() {
  const bundled = path.join(process.env.USERPROFILE || '', '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules');
  const pnpmRoot = path.join(bundled, '.pnpm');
  const pnpmPlaywright = fs.existsSync(pnpmRoot)
    ? fs.readdirSync(pnpmRoot).find(name => /^playwright@[^/]+$/.test(name))
    : null;
  for (const candidate of [
    process.env.MOONRAIL_PLAYWRIGHT,
    'playwright',
    pnpmPlaywright ? path.join(pnpmRoot, pnpmPlaywright, 'node_modules', 'playwright') : null,
    path.join(bundled, 'playwright'),
  ].filter(Boolean)) {
    try { return require(candidate); } catch (_) { /* try the next bundled path */ }
  }
  throw new Error('Playwright introuvable.');
}

const { chromium } = loadPlaywright();
const baseUrl = process.env.MOONRAIL_URL || 'http://127.0.0.1:8779/app/';
const outputDir = path.resolve(__dirname, '..', 'qa-ui');
const chromeCandidates = [
  process.env.MOONRAIL_CHROME,
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(candidate => candidate && fs.existsSync(candidate));

async function click(page, selector) {
  const locator = page.locator(selector).first();
  await locator.waitFor({ state:'visible' });
  await locator.click();
}

async function waitCoach(page, title) {
  await page.locator('.first-battle-coach h3').filter({ hasText:title }).waitFor({ state:'visible', timeout:10000 });
}

async function nextInfo(page, expectedTitle) {
  await waitCoach(page, expectedTitle);
  await page.waitForFunction(() => document.activeElement?.dataset?.action === 'ritual-first-tutorial-next', null, { timeout:1500 });
  const active = await page.evaluate(() => document.activeElement?.dataset?.action || '');
  if (active !== 'ritual-first-tutorial-next') {
    throw new Error(`Le focus clavier n'est pas sur le CTA du coach (${expectedTitle}).`);
  }
  await page.keyboard.press('Enter');
}

async function assertTutorialLayout(page, viewport, label) {
  await page.setViewportSize(viewport);
  await page.waitForTimeout(140);
  const result = await page.evaluate(label => {
    const rect = element => {
      const box = element?.getBoundingClientRect();
      return box ? { left:box.left, top:box.top, right:box.right, bottom:box.bottom, width:box.width, height:box.height } : null;
    };
    const intersects = (a, b) => a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const coach = document.querySelector('.first-battle-coach');
    const target = document.querySelector('[data-first-tutorial-described]');
    const table = document.querySelector('#screen-ritual-battle .ritual-table');
    const coachBox = rect(coach);
    const targetBox = rect(target);
    const tableBox = rect(table);
    const handCopies = [...document.querySelectorAll('#ritual-hand .ritual-card-frame>p')]
      .map(element => Number.parseFloat(getComputedStyle(element).fontSize));
    return {
      label,
      coachBox,
      targetBox,
      tableBox,
      overlap:intersects(coachBox, targetBox),
      coachFont:coach ? Number.parseFloat(getComputedStyle(coach.querySelector('p')).fontSize) : 0,
      handCopyMin:handCopies.length ? Math.min(...handCopies) : 0,
      zoom:table ? getComputedStyle(table).zoom : '',
      viewport:{ width:innerWidth, height:innerHeight }
    };
  }, label);
  for (const [name, box] of [['coach',result.coachBox],['cible',result.targetBox],['table',result.tableBox]]) {
    if (!box) throw new Error(`${label}: ${name} absent.`);
    if (box.left < -2 || box.top < -2 || box.right > result.viewport.width + 2 || box.bottom > result.viewport.height + 2) {
      throw new Error(`${label}: ${name} hors écran ${JSON.stringify(box)}.`);
    }
  }
  if (result.overlap) throw new Error(`${label}: le coach masque sa cible.`);
  if (result.coachFont < 12.5) throw new Error(`${label}: texte du coach trop petit (${result.coachFont}px).`);
  if (result.handCopyMin < 9.1) throw new Error(`${label}: texte de main trop petit (${result.handCopyMin}px).`);
  if (result.zoom !== '1') throw new Error(`${label}: zoom CSS global encore actif (${result.zoom}).`);
}

async function forceReloadCheckpoint(page, checkpoint, expectedTitle) {
  await page.evaluate(step => {
    const key = 'moonrail.ritual.run.v1';
    const run = JSON.parse(localStorage.getItem(key));
    run.battle.tutorial.step = step;
    run.battle.resolving = true;
    localStorage.setItem(key, JSON.stringify(run));
  }, checkpoint);
  await page.reload({ waitUntil:'load' });
  await waitCoach(page, expectedTitle);
}

async function main() {
  fs.mkdirSync(outputDir, { recursive:true });
  const browser = await chromium.launch({ headless:true, executablePath:chromeCandidates[0], args:['--hide-scrollbars'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport:{ width:1280, height:720 } });
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(baseUrl, { waitUntil:'load', timeout:15000 });
    await page.evaluate(() => {
      for (const key of Object.keys(localStorage)) if (key.startsWith('moonrail.')) localStorage.removeItem(key);
    });
    await page.reload({ waitUntil:'load' });

    await click(page, '[data-action="ritual-new"]');
    await page.locator('[data-action="ritual-start-first-night"]').waitFor({ state:'visible' });
    if (await page.locator('[data-action="ritual-choose-guardian"]').count()) {
      throw new Error('La sélection de conductrice est visible pendant la première nuit.');
    }
    await page.locator('[data-action="ritual-start-first-night"]').evaluate(button => {
      button.click();
      button.click();
    });
    await page.locator('#screen-ritual-battle.active').waitFor({ state:'visible', timeout:15000 });
    await waitCoach(page, 'Une seule course, deux jauges');
    let profile = await page.evaluate(() => JSON.parse(localStorage.getItem('moonrail.ritual.profile.v1')));
    if (profile?.attempts !== 1) throw new Error(`Double lancement non verrouillé : ${profile?.attempts} tentatives.`);

    await click(page, '#run-abandon-button');
    await page.locator('.first-tutorial-restart-modal').waitFor({ state:'visible' });
    if (await page.locator('[data-action="ritual-open-run-gacha"]').count()) {
      throw new Error("Le gacha est accessible depuis l'abandon du tutoriel.");
    }
    await click(page, '[data-action="ritual-first-tutorial-restart"]');
    await waitCoach(page, 'Une seule course, deux jauges');
    const restarted = await page.evaluate(() => ({
      profile:JSON.parse(localStorage.getItem('moonrail.ritual.profile.v1')),
      run:JSON.parse(localStorage.getItem('moonrail.ritual.run.v1')),
    }));
    if (restarted.profile?.attempts !== 1) throw new Error(`Le redémarrage a compté une nouvelle tentative (${restarted.profile?.attempts}).`);
    if (restarted.profile?.lifetimeStokes !== 0 || restarted.profile?.truths?.length || restarted.profile?.ritualGachaHistory?.length) {
      throw new Error('Le redémarrage de la leçon a accordé une progression permanente.');
    }
    if (
      !restarted.run?.firstBattleTutorial ||
      restarted.run?.firstTutorialPhase !== 'battle' ||
      restarted.run?.battle?.tutorial?.step !== 'welcome' ||
      restarted.run?.stokes !== 0
    ) {
      throw new Error(`Le redémarrage n'a pas restauré le checkpoint initial : ${JSON.stringify(restarted.run?.battle?.tutorial)}.`);
    }

    for (const [label, viewport] of [
      ['1280x600',{ width:1280, height:600 }],
      ['1024x768',{ width:1024, height:768 }],
      ['1366x768',{ width:1366, height:768 }],
      ['1920x1080',{ width:1920, height:1080 }],
    ]) await assertTutorialLayout(page, viewport, label);
    await page.setViewportSize({ width:1280, height:720 });
    await page.waitForTimeout(140);
    await page.screenshot({ path:path.join(outputDir, 'first_tutorial_01_welcome.png'), animations:'disabled' });

    await nextInfo(page, 'Une seule course, deux jauges');
    await nextInfo(page, 'Le danger est annoncé par wagon');
    await nextInfo(page, 'Une carte se lit en quatre endroits');
    await nextInfo(page, 'Lueur, Cendres, chaudière et départ');

    await click(page, '[data-ritual-card-id="paper_crane"]');
    await waitCoach(page, 'Ogre des nuages');
    await page.locator('[data-ritual-card-id="cloud_oni"]').dragTo(page.locator('#ritual-balance'));
    await waitCoach(page, 'Ogre des nuages');
    await assertTutorialLayout(page, { width:1280, height:600 }, '1280x600 · carte ciblée');
    await page.setViewportSize({ width:1280, height:720 });
    await click(page, '[data-ritual-card-id="cloud_oni"]');
    await assertTutorialLayout(page, { width:1024, height:768 }, '1024x768 · wagon ciblé');
    await page.setViewportSize({ width:1280, height:720 });
    await page.locator('[data-ritual-card-id="cloud_oni"]').dragTo(page.locator('[data-ritual-player-slot="0"]'));
    await waitCoach(page, 'Sélectionnez la Grue talisman');
    await click(page, '[data-ritual-card-id="paper_crane"]');
    await click(page, '[data-ritual-player-slot="1"]');
    await page.setViewportSize({ width:1280, height:600 });
    await page.waitForTimeout(140);
    const compactSigilsVisible = await page.evaluate(() => [...document.querySelectorAll('.player-board .ritual-card-sigils')]
      .some(element => element.children.length && getComputedStyle(element).display !== 'none' && element.getBoundingClientRect().width > 0));
    if (!compactSigilsVisible) throw new Error('1280x600 : les sigils tactiques du plateau sont masqués.');
    await page.setViewportSize({ width:1280, height:720 });
    await page.screenshot({ path:path.join(outputDir, 'first_tutorial_02_first_departure.png'), animations:'disabled' });
    await forceReloadCheckpoint(page, 'resolving_one', 'Faites partir le convoi');
    await click(page, '#ritual-bell');
    await waitCoach(page, 'Le plateau reste, la main change');

    await nextInfo(page, 'Le plateau reste, la main change');
    await click(page, '[data-ritual-card-id="wisp_scribe"]');
    await assertTutorialLayout(page, { width:1280, height:600 }, '1280x600 · chaudière ciblée');
    await page.setViewportSize({ width:1280, height:720 });
    await click(page, '[data-action="ritual-stoke"]');
    await click(page, '[data-ritual-card-id="shrine_fox"]');
    await click(page, '[data-ritual-player-slot="2"]');
    await forceReloadCheckpoint(page, 'resolving_two', 'Confirmez votre défense');
    await click(page, '#ritual-bell');
    await waitCoach(page, 'Un passager posé agit à chaque départ');

    await nextInfo(page, 'Un passager posé agit à chaque départ');
    await forceReloadCheckpoint(page, 'resolving_final', 'Donnez le dernier départ');
    await click(page, '#ritual-bell');
    try {
      await page.locator('.first-tutorial-victory-modal').waitFor({ state:'visible', timeout:10000 });
    } catch (error) {
      const state = await page.evaluate(() => ({
        run:JSON.parse(localStorage.getItem('moonrail.ritual.run.v1')),
        modal:document.querySelector('#modal-layer')?.textContent?.trim(),
        coach:document.querySelector('.first-battle-coach h3')?.textContent
      }));
      throw new Error(`Victoire tutorielle absente : ${JSON.stringify(state)} · ${error.message}`);
    }
    if (!(await page.locator('.first-wound-proof').count())) throw new Error("La blessure persistante n'est pas démontrée.");
    await page.screenshot({ path:path.join(outputDir, 'first_tutorial_03_victory.png'), animations:'disabled' });

    await click(page, '[data-action="ritual-first-tutorial-reward"]');
    await page.locator('.first-tutorial-reward-modal').waitFor({ state:'visible' });
    const rewardIds = await page.locator('[data-ritual-reward]').evaluateAll(cards => cards.map(card => card.dataset.ritualReward));
    if (!rewardIds.length || new Set(rewardIds).size !== rewardIds.length) {
      throw new Error(`Récompenses absentes ou dupliquées : ${rewardIds.join(', ')}`);
    }
    const chosenReward = rewardIds[0];
    await click(page, `[data-ritual-reward="${chosenReward}"]`);
    await page.locator('.first-tutorial-map-modal').waitFor({ state:'visible' });
    await page.reload({ waitUntil:'load' });
    await page.locator('.first-tutorial-map-modal').waitFor({ state:'visible' });
    const rewardState = await page.evaluate(id => {
      const run = JSON.parse(localStorage.getItem('moonrail.ritual.run.v1'));
      return { inDeck:run.deck.includes(id), pending:run.pendingAfterReward, phase:run.firstTutorialPhase };
    }, chosenReward);
    if (!rewardState.inDeck || rewardState.pending !== null || rewardState.phase !== 'map') {
      throw new Error(`Récompense non persistée atomiquement : ${JSON.stringify(rewardState)}`);
    }
    await click(page, '[data-action="ritual-first-tutorial-map"]');

    profile = await page.evaluate(() => JSON.parse(localStorage.getItem('moonrail.ritual.profile.v1')));
    if (!profile?.firstBattleTutorialCompleted) throw new Error("Le tutoriel terminé n'est pas persisté.");
    if (profile?.attempts !== 1) throw new Error(`Le nombre de tentatives attendu est 1, reçu ${profile?.attempts}.`);
    await page.locator('#screen-ritual-map.active').waitFor({ state:'visible' });
    await page.screenshot({ path:path.join(outputDir, 'first_tutorial_04_map.png'), animations:'disabled' });

    await page.evaluate(() => {
      localStorage.removeItem('moonrail.ritual.run.v1');
      const key = 'moonrail.ritual.profile.v1';
      const legacyProfile = JSON.parse(localStorage.getItem(key));
      delete legacyProfile.firstBattleTutorialCompleted;
      localStorage.setItem(key, JSON.stringify(legacyProfile));
    });
    await page.reload({ waitUntil:'load' });
    await click(page, '[data-action="ritual-new"]');
    await page.locator('[data-action="ritual-choose-guardian"]').waitFor({ state:'visible' });
    if (errors.length) throw new Error(`Erreurs navigateur : ${errors.join(' | ')}`);
    console.log('FIRST TUTORIAL SMOKE: OK');
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
