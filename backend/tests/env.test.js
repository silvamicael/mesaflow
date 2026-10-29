import test from 'node:test';
import assert from 'node:assert/strict';
import { parseEnv } from '../src/config/parse-env.js';
const base = { JWT_SECRET: 'a'.repeat(64), DB_NAME: 'test', DB_USER: 'test', DB_PASSWORD: 'senha_ficticia' };

test('carrega ambiente local e preserva senha sem alteração', () => {
  const env = parseEnv({ ...base, DB_PASSWORD: '  senha  ' });
  assert.equal(env.db.port, 5433);
  assert.equal(env.db.password, '  senha  ');
});
test('recusa senha ausente sem expor o valor de outras variáveis', () => {
  assert.throws(() => parseEnv({ ...base, DB_PASSWORD: '' }), /DB_PASSWORD/);
});
test('recusa portas inválidas antes de abrir conexão', () => {
  for (const port of ['0', '-1', '65536', 'abc', '1.5']) {
    assert.throws(() => parseEnv({ ...base, DB_PORT: port }), /DB_PORT/);
  }
});
test('recusa origem com caminho ou esquema inválido', () => {
  for (const origin of ['http://localhost:5173/pagina', 'file:///tmp/a', 'invalida']) {
    assert.throws(() => parseEnv({ ...base, CLIENT_ORIGIN: origin }), /CLIENT_ORIGIN/);
  }
});
test('não habilita configuração local como produção inadvertidamente', () => {
  assert.throws(() => parseEnv({ ...base, NODE_ENV: 'production' }), /somente/);
});
