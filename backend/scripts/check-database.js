import { sequelize } from '../src/config/database.js';
try {
  await sequelize.authenticate();
  console.log('Conexão com PostgreSQL validada.');
} catch {
  console.error('Falha na conexão. Confira o Docker, host, porta, banco, usuário e senha.');
  process.exitCode = 1;
} finally { await sequelize.close(); }
