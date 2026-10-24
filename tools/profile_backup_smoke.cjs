const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('app/ritual.js', 'utf8');
const start = source.indexOf('  function exportRitualProfile()');
const end = source.indexOf('  function persist() {', start);
assert(start > 0 && end > start, 'Missing backup functions');
const html = fs.readFileSync('app/index.html', 'utf8');
assert(html.includes('data-action="ritual-export-profile"'));
assert(html.includes('data-action="ritual-import-profile"'));
assert(html.includes('id="ritual-backup-import"'));

async function scenario(serialized, busy = false) {
  const notices = [];
  const context = {
    profile: { unlockedCards: ['initial'], truths: [] },
    run: busy ? { deck: ['active'] } : null,
    window: { confirm: () => true },
    structuredClone: global.structuredClone,
    Date, JSON, Blob,
    esc: String,
    normalizeProfile: raw => structuredClone(raw),
    persist: () => { context.saved = structuredClone(context.profile); },
    showRitualScreen: name => notices.push(name),
    openRitualModal: message => notices.push(message),
    document: { body: { appendChild(){} }, createElement(){return {click(){},remove(){}}} },
    URL: { createObjectURL(){return 'blob:mock'},revokeObjectURL(){} },
    setTimeout() {},
    $: () => ({click(){}}),
  };
  vm.createContext(context);
  vm.runInContext(source.slice(start, end), context);
  const target = { files: [{size: 256, text: async () => serialized}], value: 'selected' };
  await vm.runInContext('importRitualProfileFile({target: upload})', Object.assign(context, {upload: target}));
  return { profile: context.profile, notices, target, saved: context.saved };
}
(async () => {
  const valid = JSON.stringify({format:'moonrail-profile-v1', profile: {unlockedCards:['paper_crane'], truths:['secret']}});
  const imported = await scenario(valid);
  assert.deepEqual(Array.from(imported.profile.unlockedCards), ['paper_crane']);
  assert(imported.saved);
  assert(imported.notices.includes('menu'));
  assert.equal(imported.target.value, '');

  const corrupt = await scenario('not json');
  assert.deepEqual(Array.from(corrupt.profile.unlockedCards), ['initial']);
  assert(corrupt.notices.some(n => String(n).includes('Import impossible')));

  const busy = await scenario(valid, true);
  assert.deepEqual(Array.from(busy.profile.unlockedCards), ['initial']);
  assert(!busy.saved);
  console.log('OK: profile import, rejection, active-run safety');
})().catch(e => { console.error(e); process.exitCode = 1; });
