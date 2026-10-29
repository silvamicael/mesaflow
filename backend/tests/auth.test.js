import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
Object.assign(process.env, {
  NODE_ENV: 'test', JWT_SECRET: 'a'.repeat(64), JWT_EXPIRES_SECONDS: '3600',
  DB_NAME: 'test', DB_USER: 'test', DB_PASSWORD: 'senha_ficticia',
});
const { createAuthService } = await import('../src/services/auth.service.js');
const { cadastroSchema, loginSchema } = await import('../src/schemas/auth.schema.js');
const { requireRole } = await import('../src/middlewares/auth.js');
const { createLimiter } = await import('../src/middlewares/rate-limit.js');
const { createApp } = await import('../src/app.js');
const { default: express } = await import('express');
const { parseEnv } = await import('../src/config/parse-env.js');
const config = { jwtSecret: 'a'.repeat(64), jwtExpiresSeconds: 3600 };
const password = 'SenhaDeTeste!123';
const hash = await bcrypt.hash(password, 12);

function fixture() {
  const users = new Map(); const sessions = new Map();
  const repository = {
    transaction: fn => fn({}),
    findUserByEmail: async email => [...users.values()].find(u => u.email === email),
    createUser: async data => {
      if ([...users.values()].some(u => u.email === data.email)) {
        const e = new Error(); e.name = 'SequelizeUniqueConstraintError'; throw e;
      }
      const u = { id: randomUUID(), ...data }; users.set(u.id, u); return u;
    },
    lockUser: async id => users.get(id),
    createSession: async data => { sessions.set(data.id, { ...data, revogada_em: null }); },
    findSession: async id => { const s = sessions.get(id); return s && { ...s, usuario: users.get(s.usuario_id) }; },
    revokeSession: async id => { sessions.get(id).revogada_em = new Date(); },
  };
  const user = { id: randomUUID(), nome: 'Cliente Teste', email: 'cliente@example.com', senha_hash: hash, papel: 'cliente', ativo: true };
  users.set(user.id, user);
  return { users, sessions, user, repository, service: createAuthService(repository, config) };
}
async function serve(t, app) {
  const server = await new Promise((resolve, reject) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s)); s.on('error', reject);
  });
  t.after(() => new Promise(resolve => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}
function signed(sub, sid, extra = {}, options = {}) {
  return jwt.sign({ sid, exp: Math.floor(Date.now()/1000)+3600, ...extra }, config.jwtSecret,
    { algorithm: 'HS256', subject: sub, issuer: 'mesaflow-api', audience: 'mesaflow-client', ...options });
}

test('cadastro rejeita tentativa de definir papel e ativo', () => {
  for (const field of [{ papel: 'admin' }, { ativo: true }, { role: 'admin' }]) {
    assert.equal(cadastroSchema.safeParse({ nome: 'Teste', email: 'teste@example.com', senha: password, ...field }).success, false);
  }
});
test('e-mail normalizado; senha preservada; limite bcrypt validado em bytes', () => {
  const result = cadastroSchema.parse({ nome: ' Cliente ', email: ' CLIENTE@EXAMPLE.COM ', senha: '  MinhaSenha!123  ' });
  assert.equal(result.email, 'cliente@example.com'); assert.equal(result.senha, '  MinhaSenha!123  ');
  assert.equal(loginSchema.safeParse({ email: result.email, senha: 'á'.repeat(37) }).success, false);
  assert.equal(loginSchema.safeParse({ email: result.email, senha: 'senha-valida\0' }).success, false);
});
test('cadastro guarda hash e fixa cliente mesmo se service receber papel', async () => {
  const f = fixture();
  const user = await f.service.register({ nome: 'Novo', email: 'novo@example.com', senha: password, papel: 'admin' });
  assert.equal(user.papel, 'cliente'); assert.equal('senha_hash' in user, false);
  const stored = f.users.get(user.id); assert.notEqual(stored.senha_hash, password);
  assert.equal(await bcrypt.compare(password, stored.senha_hash), true);
});
test('duplicidade vira 409 sem detalhes do banco', async () => {
  const f = fixture();
  await assert.rejects(f.service.register({ nome: 'Novo', email: f.user.email, senha: password }), e => e.status === 409);
});
test('login cria sessão e JWT; logout revoga somente sessão atual', async () => {
  const f = fixture(); const data = { email: f.user.email, senha: password };
  const first = await f.service.login(data); const second = await f.service.login(data);
  assert.equal('senha_hash' in first.usuario, false);
  const auth = await f.service.authenticate(first.token); await f.service.logout(auth);
  await assert.rejects(f.service.authenticate(first.token), e => e.status === 401);
  assert.equal((await f.service.authenticate(second.token)).usuario.id, f.user.id);
});
test('login inválido tem mesma resposta para e-mail ausente, senha errada e conta inativa', async () => {
  const f = fixture(); const messages = [];
  for (const data of [{ email: 'ausente@example.com', senha: password }, { email: f.user.email, senha: 'SenhaErrada123' }]) {
    await assert.rejects(f.service.login(data), e => { messages.push(e.message); return e.status === 401; });
  }
  f.user.ativo = false;
  await assert.rejects(f.service.login({ email: f.user.email, senha: password }), e => { messages.push(e.message); return e.status === 401; });
  assert.equal(new Set(messages).size, 1); assert.equal(f.sessions.size, 0);
});
test('conta inativa perde acesso mesmo com token válido', async () => {
  const f = fixture(); const { token } = await f.service.login({ email: f.user.email, senha: password });
  f.user.ativo = false; await assert.rejects(f.service.authenticate(token), e => e.status === 401);
});
test('sessão expirada ou ausente invalida token assinado', async () => {
  const f = fixture(); const { token } = await f.service.login({ email: f.user.email, senha: password });
  const claims = jwt.decode(token); f.sessions.get(claims.sid).expira_em = new Date(0);
  await assert.rejects(f.service.authenticate(token), e => e.status === 401);
  f.sessions.delete(claims.sid); await assert.rejects(f.service.authenticate(token), e => e.status === 401);
});
test('JWT recusa expiração, assinatura alterada, algoritmo, emissor e destinatário incorretos', async () => {
  const f = fixture(); const { token } = await f.service.login({ email: f.user.email, senha: password });
  const c = jwt.decode(token);
  const tokens = [
    token.slice(0, -8)+'aaaaaaaa', signed(c.sub,c.sid,{exp:1}),
    signed(c.sub,c.sid,{}, {algorithm:'HS384'}),
    signed(c.sub,c.sid,{}, {issuer:'outro'}), signed(c.sub,c.sid,{}, {audience:'outro'}),
    jwt.sign({ sid:c.sid }, config.jwtSecret, { algorithm:'HS256', subject:c.sub, issuer:'mesaflow-api', audience:'mesaflow-client' }),
  ];
  for (const value of tokens) await assert.rejects(f.service.authenticate(value), e => e.status === 401);
});
test('token de um usuário não pode reutilizar sessão de outro', async () => {
  const f = fixture(); const { token } = await f.service.login({ email: f.user.email, senha: password });
  const c = jwt.decode(token);
  await assert.rejects(f.service.authenticate(signed(randomUUID(),c.sid)), e => e.status === 401);
});
test('papel é consultado no banco, não confiado ao JWT', async () => {
  const f = fixture(); const { token } = await f.service.login({ email: f.user.email, senha: password });
  f.user.papel = 'funcionario'; assert.equal((await f.service.authenticate(token)).usuario.papel, 'funcionario');
});
test('RBAC permite admin e rejeita cliente e funcionário', () => {
  for (const papel of ['admin','cliente','funcionario']) {
    let result; requireRole('admin')({ auth: { usuario: { papel } } }, {}, e => { result = e; });
    if (papel === 'admin') assert.equal(result, undefined); else assert.equal(result.status, 403);
  }
});
test('HTTP exige Bearer e documenta Swagger', async t => {
  const f = fixture(); const url = await serve(t, createApp({ authenticate: async()=>{} }, { authService:f.service }));
  const noToken = await fetch(`${url}/api/auth/me`); assert.equal(noToken.status, 401);
  const docs = await fetch(`${url}/api/docs.json`); const schema = await docs.json();
  assert.ok(schema.paths['/api/auth/login']); assert.ok(schema.components.securitySchemes.bearerAuth);
  assert.equal((await fetch(`${url}/api/docs/`)).status, 200);
});
test('rate limiter retorna 429 com resposta padronizada', async t => {
  const app = express(); app.get('/',createLimiter(2),(_req,res)=>res.json({ok:true}));
  const url=await serve(t,app); await fetch(url); await fetch(url);
  const res=await fetch(url); assert.equal(res.status,429); assert.equal((await res.json()).erro.codigo,'RATE_LIMIT');
});
test('JWT_SECRET fraco e expiração fora do intervalo são rejeitados', () => {
  const base = { DB_NAME:'test', DB_USER:'test', DB_PASSWORD:'ficticio', JWT_SECRET:'a'.repeat(64) };
  assert.throws(()=>parseEnv({...base,JWT_SECRET:'segredo'}),/JWT_SECRET/);
  assert.throws(()=>parseEnv({...base,JWT_EXPIRES_SECONDS:'0'}),/JWT_EXPIRES_SECONDS/);
});

test('login revalida usuário após bloqueio antes de criar sessão', async () => {
  const f = fixture();
  f.repository.lockUser = async () => ({ ...f.user, ativo: false });
  await assert.rejects(f.service.login({ email:f.user.email, senha:password }), e=>e.status===401);
  assert.equal(f.sessions.size,0);
});
