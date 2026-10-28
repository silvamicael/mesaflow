import test from 'node:test';
import assert from 'node:assert/strict';

// Configuração fictícia: estes testes nunca abrem conexão real com PostgreSQL.
Object.assign(process.env, {
  NODE_ENV: 'test', HOST: '127.0.0.1', PORT: '3001',
  CLIENT_ORIGIN: 'http://localhost:5173',
  DB_NAME: 'test', DB_USER: 'test', DB_PASSWORD: 'senha_ficticia',
});
const { createApp } = await import('../src/app.js');

async function serve(t, database) {
  const app = createApp(database);
  const server = await new Promise((resolve, reject) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
    instance.on('error', reject);
  });
  t.after(() => new Promise(resolve => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}

test('health retorna 200 quando o banco responde', async t => {
  const url = await serve(t, { authenticate: async () => {} });
  const response = await fetch(`${url}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok', database: 'connected' });
});
test('health retorna 503 sem expor detalhes internos', async t => {
  const url = await serve(t, { authenticate: async () => { throw new Error('segredo-interno'); } });
  const response = await fetch(`${url}/api/health`);
  assert.equal(response.status, 503);
  const body = await response.text();
  assert.ok(!body.includes('segredo-interno'));
  assert.equal(JSON.parse(body).erro.codigo, 'DATABASE_UNAVAILABLE');
});
test('rota inexistente retorna erro padronizado', async t => {
  const url = await serve(t, { authenticate: async () => {} });
  const response = await fetch(`${url}/inexistente`);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).erro.codigo, 'NOT_FOUND');
});
test('JSON malformado retorna 400', async t => {
  const url = await serve(t, { authenticate: async () => {} });
  const response = await fetch(`${url}/inexistente`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{invalido',
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).erro.codigo, 'INVALID_JSON');
});
test('corpo acima do limite retorna 413', async t => {
  const url = await serve(t, { authenticate: async () => {} });
  const response = await fetch(`${url}/inexistente`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto: 'a'.repeat(110000) }),
  });
  assert.equal(response.status, 413);
  assert.equal((await response.json()).erro.codigo, 'PAYLOAD_TOO_LARGE');
});
