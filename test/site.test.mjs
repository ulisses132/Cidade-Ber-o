import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, copyFile, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { randomBytes, scryptSync } from 'node:crypto';
import { renderPage } from '../lib/render.mjs';
import { validate } from '../lib/store.mjs';

const original = JSON.parse(await readFile(new URL('../data/content.json', import.meta.url), 'utf8'));

test('all public pages and edition details render with the confirmed dates', () => {
  for (const path of ['/', '/festival', '/programa', '/tunas', '/bilhetes', '/edicoes', '/contactos', ...original.editions.map(edition => `/edicoes/${edition.id}`)]) {
    assert.match(renderPage(original, path), /<!doctype html>/);
  }
  assert.match(renderPage(original, '/'), /26 a 28 de fevereiro · 2027/);
  assert.equal(renderPage(original, '/missing'), null);
  assert.equal(original.editions.length, 21);
  assert.equal(new Set(original.editions.slice(0, 20).map(edition => edition.poster)).size, 20);
});

test('content validation rejects executable links and duplicate edition IDs', () => {
  validate(original);
  const bad = structuredClone(original);
  bad.editions[0].video = 'javascript:alert(1)';
  assert.throws(() => validate(bad));
  bad.editions[0].video = '';
  bad.editions[1].id = bad.editions[0].id;
  assert.throws(() => validate(bad));
});

test('admin authentication, CSRF protection, revision conflicts and durable writes', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'cidade-test-'));
  await copyFile(new URL('../data/content.json', import.meta.url), join(directory, 'content.json'));
  const password = randomBytes(20).toString('hex');
  const salt = randomBytes(16).toString('hex');
  await writeFile(join(directory, 'admin.json'), JSON.stringify({ salt, hash: scryptSync(password, salt, 64).toString('hex') }));
  const child = spawn(process.execPath, ['server.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, DATA_DIR: directory, PORT: '4199' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  t.after(async () => { child.kill(); await rm(directory, { recursive: true, force: true }); });
  await new Promise((resolve, reject) => {
    child.stdout.once('data', resolve);
    child.once('error', reject);
    child.once('exit', code => reject(new Error(`Server exited: ${code}`)));
  });
  const base = 'http://127.0.0.1:4199';
  const post = (path, body, headers = {}) => fetch(`${base}${path}`, {
    method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body)
  });
  assert.equal((await fetch(`${base}/missing`)).status, 404);
  assert.equal((await fetch(`${base}/data/admin.json`)).status, 404);
  assert.equal((await fetch(`${base}/api/content`)).status, 401);
  assert.equal((await post('/api/content', original)).status, 403);
  assert.equal((await post('/api/login', { password: 'wrong' })).status, 401);
  const auth = await post('/api/login', { password });
  assert.equal(auth.status, 200);
  const cookie = auth.headers.get('set-cookie').split(';')[0];
  const html = await (await fetch(`${base}/admin`, { headers: { Cookie: cookie } })).text();
  const csrf = /name="csrf-token" content="([a-f0-9]+)"/.exec(html)[1];
  const headers = { Cookie: cookie, 'X-CSRF-Token': csrf };
  assert.equal((await post('/api/content', original, { Cookie: cookie })).status, 403);
  const changed = structuredClone(original);
  changed.editions.at(-1).venue = 'Local de teste';
  assert.equal((await post('/api/content', changed, headers)).status, 200);
  assert.match(await (await fetch(base)).text(), /Local de teste/);
  const persisted = JSON.parse(await readFile(join(directory, 'content.json'), 'utf8'));
  assert.equal(persisted.revision, original.revision + 1);
  assert.equal(persisted.editions.at(-1).venue, 'Local de teste');
  assert.equal((await post('/api/content', changed, headers)).status, 409);
  assert.equal((await post('/api/logout', {}, headers)).status, 200);
  assert.equal((await fetch(`${base}/api/content`, { headers })).status, 401);
});
