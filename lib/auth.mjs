import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { dataDir } from './store.mjs';

const sessions = new Map();
const attempts = new Map();
export const token = () => randomBytes(32).toString('hex');

export function session(req) {
  const id = /(?:^|;\s*)cb_session=([a-f0-9]+)/.exec(req.headers.cookie || '')?.[1];
  const value = sessions.get(id);
  if (!value || value.expires < Date.now()) {
    sessions.delete(id);
    return null;
  }
  return value;
}

export async function login(password, address) {
  const attempt = attempts.get(address);
  if (attempt?.count >= 5 && attempt.until > Date.now()) {
    throw Object.assign(new Error('Demasiadas tentativas. Volte a tentar dentro de 15 minutos.'), { status: 429 });
  }
  let config;
  try {
    config = JSON.parse(await readFile(resolve(dataDir, 'admin.json'), 'utf8'));
  } catch {
    throw Object.assign(new Error('Execute npm run setup no terminal do projeto para definir a palavra-passe.'), { status: 503 });
  }
  const supplied = scryptSync(String(password), config.salt, 64);
  const expected = Buffer.from(config.hash, 'hex');
  if (!timingSafeEqual(supplied, expected)) {
    attempts.set(address, { count: attempt?.until > Date.now() ? attempt.count + 1 : 1, until: Date.now() + 900000 });
    throw Object.assign(new Error('Palavra-passe incorreta.'), { status: 401 });
  }
  attempts.delete(address);
  for (const [id, value] of sessions) if (value.expires < Date.now()) sessions.delete(id);
  const id = token();
  sessions.set(id, { id, csrf: token(), expires: Date.now() + 8 * 60 * 60 * 1000 });
  return sessions.get(id);
}

export function logout(req) {
  const value = session(req);
  if (value) sessions.delete(value.id);
}
