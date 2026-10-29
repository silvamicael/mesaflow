import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { env } from '../src/config/env.js';

// Banco descartável exclusivo deste processo; nunca reutiliza nem limpa o banco da aplicação.
const database = `mesaflow_test_${randomUUID().replaceAll('-', '')}`;
const connection = new pg.Client({
  host: env.db.host, port: env.db.port, database: env.db.name,
  user: env.db.user, password: env.db.password, connectionTimeoutMillis: 5000,
});
const cwd = fileURLToPath(new URL('../', import.meta.url));
const childEnv = { ...process.env, NODE_ENV: 'test', DB_NAME: database, MESAFLOW_INTEGRATION_ISOLATED: '1' };
function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd, env: childEnv, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve() : reject(new Error('Falha na validação.')));
  });
}
let created = false;
try {
  await connection.connect();
  await connection.query(`CREATE DATABASE "${database}"`);
  created = true;
  console.log('Banco temporário criado para testes. O banco da aplicação será preservado.');
  await run(['scripts/migrate.js', 'up']);
  await run(['scripts/migrate.js', 'up']);
  await run(['--test', 'integration/auth-flow.js']);
} catch {
  console.error('Teste de integração falhou. Confira o resultado acima, a conexão e a permissão CREATEDB do usuário local.');
  process.exitCode = 1;
} finally {
  if (created) {
    try {
      await connection.query(`DROP DATABASE "${database}" WITH (FORCE)`);
      console.log('Banco temporário removido.');
    } catch {
      console.error(`Não foi possível remover o banco temporário ${database}.`);
      process.exitCode = 1;
    }
  }
  await connection.end();
}
