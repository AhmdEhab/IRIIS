/* P65 — lazyWithRecovery: stale-chunk self-healing semantics. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { importWithRecovery } from '../src/App/lazyWithRecovery.ts';

const mod = { default: 'X', Other: 'Y' };

test('resolves on the first good import', async () => {
  let reloads = 0;
  const out = await importWithRecovery(async () => mod, 'Other', {
    reload: () => { reloads++; },
    wait: async () => {},
  });
  assert.equal(out.default, 'Y');
  assert.equal(reloads, 0);
});

test('one transient failure recovers in place — no reload', async () => {
  let n = 0;
  let reloads = 0;
  const out = await importWithRecovery(async () => {
    n += 1;
    if (n === 1) throw new Error('chunk load error');
    return mod;
  }, 'Other', { reload: () => { reloads++; }, wait: async () => {} });
  assert.equal(out.default, 'Y');
  assert.equal(n, 2);
  assert.equal(reloads, 0);
});

test('persistent failure with fresh tab → exactly ONE hard reload, guarded', async () => {
  let reloads = 0;
  let guard = null;
  const loader = async () => { throw new Error('Failed to fetch dynamically imported module'); };
  const p = importWithRecovery(loader, 'Other', {
    reload: () => { reloads++; },
    wait: async () => {},
    readGuard: () => guard === '1',
    writeGuard: () => { guard = '1'; },
    clearGuard: () => { guard = null; },
  });
  // The promise must never resolve while the document is navigating.
  const raced = await Promise.race([p, new Promise((r) => setTimeout(() => r('PENDING'), 50))]);
  assert.equal(raced, 'PENDING');
  assert.equal(reloads, 1);
  assert.equal(guard, '1');
});

test('persistent failure AFTER a reload already happened → rethrows (card shows)', async () => {
  let reloads = 0;
  const loader = async () => { throw new Error('offline'); };
  await assert.rejects(
    importWithRecovery(loader, 'Other', {
      reload: () => { reloads++; },
      wait: async () => {},
      readGuard: () => true, // guard already set by the first healing reload
      writeGuard: () => {},
      clearGuard: () => {},
    }),
    /offline/,
  );
  assert.equal(reloads, 0);
});

test('a later success clears the guard so future deploys can heal again', async () => {
  let guard = '1';
  await importWithRecovery(async () => mod, 'Other', {
    reload: () => {},
    wait: async () => {},
    readGuard: () => guard === '1',
    writeGuard: () => { guard = '1'; },
    clearGuard: () => { guard = null; },
  });
  assert.equal(guard, null);
});
