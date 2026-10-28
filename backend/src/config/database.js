import { Sequelize } from 'sequelize';
import { env } from './env.js';

export const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  dialect: 'postgres', host: env.db.host, port: env.db.port,
  logging: false,
  pool: { max: 5, min: 0, acquire: 10000, idle: 10000 },
  dialectOptions: { connectionTimeoutMillis: 5000, statement_timeout: 5000 },
  define: { underscored: true, createdAt: 'criado_em', updatedAt: 'atualizado_em' },
});
