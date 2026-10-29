import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { sequelize } from '../src/config/database.js';
import { env } from '../src/config/env.js';
import { Usuario } from '../src/models/usuario.model.js';
import { Sessao } from '../src/models/sessao.model.js';

if (process.env.MESAFLOW_INTEGRATION_ISOLATED !== '1' || !env.db.name.startsWith('mesaflow_test_')) {
  throw new Error('Execute npm run test:integration; não execute este arquivo no banco da aplicação.');
}
const senha = 'SenhaFicticia!123';
const hash = await bcrypt.hash(senha, 12);
const email = () => `${randomUUID()}@example.com`;
let server;
let url;
async function request(path, method = 'GET', body, token) {
  const response = await fetch(`${url}${path}`, {
    method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, body: response.status === 204 ? null : await response.json() };
}
async function user(papel = 'cliente') {
  return Usuario.create({ nome: 'Usuário de teste', email: email(), senha_hash: hash, papel, ativo: true });
}
async function login(u) {
  const result = await request('/api/auth/login', 'POST', { email: u.email, senha });
  assert.equal(result.status, 200, JSON.stringify(result.body)); return result.body.token;
}

test('integração HTTP + Sequelize + banco isolado', async t => {
  await sequelize.authenticate();
  server = await new Promise((resolve, reject) => {
    const s = createApp().listen(0, '127.0.0.1', () => resolve(s)); s.on('error', reject);
  });
  url = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    await new Promise(resolve => server.close(resolve)); await sequelize.close();
  });

  await t.test('migrations registradas e não reaplicadas', async () => {
    const [rows] = await sequelize.query('SELECT name FROM sequelize_meta ORDER BY name');
    assert.equal(rows.length, 2);
  });
  await t.test('cadastro persiste hash e login consulta o mesmo usuário', async () => {
    const mail = email();
    const result = await request('/api/auth/register','POST',{nome:'Cliente Novo',email:mail.toUpperCase(),senha});
    assert.equal(result.status,201,JSON.stringify(result.body));
    const stored = await Usuario.scope('autenticacao').findByPk(result.body.usuario.id);
    assert.equal(stored.email,mail); assert.equal(stored.papel,'cliente');
    assert.equal(await bcrypt.compare(senha,stored.senha_hash),true);
    assert.equal('senha_hash' in result.body.usuario,false);
    const token = await login(stored);
    const me = await request('/api/auth/me','GET',undefined,token);
    assert.equal(me.status,200); assert.equal(me.body.usuario.id,stored.id);
    assert.equal(await Sessao.count({where:{usuario_id:stored.id}}),1);
  });
  await t.test('cadastro rejeita promoção e campos desconhecidos', async () => {
    const result = await request('/api/auth/register','POST',{nome:'Cliente',email:email(),senha,papel:'admin'});
    assert.equal(result.status,400);
  });
  await t.test('cadastros simultâneos com o mesmo e-mail produzem 201 e 409', async () => {
    const mail = email(); const body={nome:'Concorrência',email:mail,senha};
    const result = await Promise.all([request('/api/auth/register','POST',body),request('/api/auth/register','POST',body)]);
    assert.deepEqual(result.map(r=>r.status).sort(),[201,409]);
    assert.equal(await Usuario.count({where:{email:mail}}),1);
  });
  await t.test('logout revoga sessão persistida e impede reuso do token', async () => {
    const u=await user();const token=await login(u);
    assert.equal((await request('/api/auth/logout','POST',undefined,token)).status,204);
    assert.equal((await request('/api/auth/me','GET',undefined,token)).status,401);
    const session=await Sessao.findOne({where:{usuario_id:u.id}});assert.ok(session.revogada_em);
  });
  await t.test('conta inativa perde sessão e não faz novo login', async () => {
    const u=await user();const token=await login(u);await u.update({ativo:false});
    assert.equal((await request('/api/auth/me','GET',undefined,token)).status,401);
    const failed=await request('/api/auth/login','POST',{email:u.email,senha});assert.equal(failed.status,401);
  });
  await t.test('RBAC retorna 403 para cliente/funcionário e 200 para admin', async () => {
    for(const papel of ['cliente','funcionario','admin']) {
      const u=await user(papel);const token=await login(u);
      assert.equal((await request('/api/admin/status','GET',undefined,token)).status,papel==='admin'?200:403);
    }
  });
  await t.test('alteração de papel no banco reflete sem emitir novo token', async () => {
    const u=await user('admin');const token=await login(u);await u.update({papel:'cliente'});
    assert.equal((await request('/api/admin/status','GET',undefined,token)).status,403);
  });
  await t.test('sessão vencida no banco retorna 401', async () => {
    const u=await user();const token=await login(u);const c=jwt.decode(token);
    await Sessao.update({criado_em:new Date(Date.now()-120000),expira_em:new Date(Date.now()-60000)},{where:{id:c.sid}});
    assert.equal((await request('/api/auth/me','GET',undefined,token)).status,401);
  });
  await t.test('restrições do banco rejeitam papel e FK inválidos', async () => {
    await assert.rejects(Usuario.create({nome:'Inválido',email:email(),senha_hash:hash,papel:'superadmin',ativo:true}));
    await assert.rejects(Sessao.create({usuario_id:randomUUID(),expira_em:new Date(Date.now()+60000)}));
  });
  await t.test('rollback não deixa usuário parcialmente gravado', async () => {
    const mail=email();
    await assert.rejects(sequelize.transaction(async transaction=>{
      await Usuario.create({nome:'Rollback',email:mail,senha_hash:hash,papel:'cliente',ativo:true},{transaction});
      throw new Error('Falha simulada');
    }));
    assert.equal(await Usuario.count({where:{email:mail}}),0);
  });
  await t.test('Swagger contém todas as rotas de autenticação',async()=>{
    const result=await request('/api/docs.json');assert.equal(result.status,200);
    for(const path of ['/api/auth/register','/api/auth/login','/api/auth/me','/api/auth/logout']) assert.ok(result.body.paths[path]);
  });
  await t.test('comando administrativo cria conta sem senha padrão e é repetível', async () => {
    const mail=email();
    const runAdmin = () => new Promise((resolve,reject)=>{
      const child=spawn(process.execPath,[fileURLToPath(new URL('../scripts/create-admin.js',import.meta.url))],{
        env:{...process.env,ADMIN_NOME:'Admin Teste',ADMIN_EMAIL:mail,ADMIN_SENHA:senha},stdio:['ignore','pipe','pipe'],
      });
      child.once('error',reject); child.once('exit',code=>resolve(code));
      child.stdout.resume();child.stderr.resume();
    });
    assert.equal(await runAdmin(),0);
    const first=await Usuario.scope('autenticacao').findOne({where:{email:mail}});
    assert.equal(first.papel,'admin');assert.equal(await bcrypt.compare(senha,first.senha_hash),true);
    assert.equal(await runAdmin(),0);
    const second=await Usuario.scope('autenticacao').findByPk(first.id);
    assert.equal(second.senha_hash,first.senha_hash);
    await second.update({papel:'cliente'});
    assert.equal(await runAdmin(),1);
    assert.equal((await Usuario.findByPk(first.id)).papel,'cliente');
  });

});
