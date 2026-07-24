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

async function nextInfo(page, expectedTitle) {
  await page.locator('.first-battle-coach h3').filter({ hasText:expectedTitle }).waitFor({ state:'visible' });
  await click(page, '[data-action="ritual-first-tutorial-next"]');
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
    if (await page.locator('[data-action="ritual-choose-guardian"]').count()) throw new Error('La sélection de conductrice est visible pendant la première nuit.');
    await click(page, '[data-action="ritual-start-first-night"]');
    await page.locator('#screen-ritual-battle.active').waitFor({ state:'visible', timeout:15000 });
    await page.locator('.first-battle-coach h3').filter({ hasText:'Le Moonrail vous montre ses commandes' }).waitFor({ state:'visible' });
    await page.screenshot({ path:path.join(outputDir, 'first_tutorial_01_welcome.png'), animations:'disabled' });

    await nextInfo(page, 'Le Moonrail vous montre ses commandes');
    await nextInfo(page, 'Deux jauges, une seule course');
    await nextInfo(page, 'Le danger est annoncé');
    await nextInfo(page, 'Chaque colonne est un duel');
    await nextInfo(page, 'Une carte se lit en quatre endroits');
    await nextInfo(page, 'Lueur, Cendres et chaudière');

    await click(page, '[data-ritual-card-id="paper_crane"]');
    await page.locator('.first-battle-coach h3').filter({ hasText:'Choisissez l’Ogre des nuages' }).waitFor({ state:'visible' });
    await page.locator('[data-ritual-card-id="cloud_oni"]').dragTo(page.locator('[data-ritual-player-slot="0"]'));
    await page.locator('.first-battle-coach h3').filter({ hasText:'Sélectionnez la Grue talisman' }).waitFor({ state:'visible' });
    await page.waitForTimeout(180);
    await click(page, '[data-ritual-card-id="paper_crane"]');
    await click(page, '[data-ritual-player-slot="1"]');
    await page.screenshot({ path:path.join(outputDir, 'first_tutorial_02_first_departure.png'), animations:'disabled' });
    await click(page, '#ritual-bell');
    await page.locator('.first-battle-coach h3').filter({ hasText:'Le plateau reste, la main change' }).waitFor({ state:'visible', timeout:10000 });

    await nextInfo(page, 'Le plateau reste, la main change');
    await click(page, '[data-ritual-card-id="wisp_scribe"]');
    await click(page, '[data-action="ritual-stoke"]');
    await click(page, '[data-ritual-card-id="shrine_fox"]');
    await click(page, '[data-ritual-player-slot="2"]');
    await click(page, '#ritual-bell');
    await page.locator('.first-battle-coach h3').filter({ hasText:'Un passager posé agit à chaque départ' }).waitFor({ state:'visible', timeout:10000 });

    await nextInfo(page, 'Un passager posé agit à chaque départ');
    await click(page, '#ritual-bell');
    await page.locator('.first-tutorial-victory-modal').waitFor({ state:'visible', timeout:10000 });
    await page.screenshot({ path:path.join(outputDir, 'first_tutorial_03_victory.png'), animations:'disabled' });
    await click(page, '[data-action="ritual-first-tutorial-reward"]');
    await page.locator('.first-tutorial-reward-modal').waitFor({ state:'visible' });
    await click(page, '[data-action="ritual-skip-reward"]');
    await page.locator('.first-tutorial-map-modal').waitFor({ state:'visible' });
    await click(page, '[data-action="ritual-first-tutorial-map"]');

    const profile = await page.evaluate(() => JSON.parse(localStorage.getItem('moonrail.ritual.profile.v1')));
    if (!profile?.firstBattleTutorialCompleted) throw new Error('Le tutoriel terminé n’est pas persisté.');
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
