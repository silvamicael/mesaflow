import { createApp } from './app.js';
import { env } from './config/env.js';
import { sequelize } from './config/database.js';

let server;
let stopping = false;
async function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  const timer = setTimeout(() => process.exit(1), 10000);
  timer.unref();
  try {
    if (server?.listening) {
      await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
    await sequelize.close();
    process.exitCode = code;
  } catch {
    process.exitCode = 1;
  } finally { clearTimeout(timer); }
}

try {
  await sequelize.authenticate();
  console.log('Banco de dados conectado.');
  server = createApp().listen(env.port, env.host);
  server.once('listening', () => console.log(`MesaFlow API: http://${env.host}:${env.port}`));
  server.once('error', async error => {
    console.error(error.code === 'EADDRINUSE' ? 'Porta da API já está em uso.' : 'Não foi possível iniciar a API.');
    await shutdown(1);
  });
} catch {
  console.error('Falha ao conectar ao PostgreSQL. Confira o Docker e backend/.env.');
  await shutdown(1);
}
process.on('SIGINT', () => shutdown());
process.on('SIGTERM', () => shutdown());
