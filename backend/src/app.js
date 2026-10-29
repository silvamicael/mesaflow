import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { sequelize } from './config/database.js';
import swaggerUi from 'swagger-ui-express';
import { openapi } from './docs/openapi.js';
import { createAuthService } from './services/auth.service.js';
import { createAuthRouter } from './routes/auth.routes.js';
import { authenticate, requireRole } from './middlewares/auth.js';
import { createLimiter } from './middlewares/rate-limit.js';
import { AppError } from './utils/app-error.js';

export function createApp(database = sequelize, { authService = createAuthService() } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.clientOrigin }));
  app.use('/api', createLimiter(1000));
  app.use(express.json({ limit: '100kb' }));
  app.get('/api/docs.json', (_req, res) => res.json(openapi));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi, {
    swaggerOptions: { persistAuthorization: false },
  }));
  app.use('/api/auth', createAuthRouter(authService));
  // Rota mínima para verificar RBAC. Gestão de usuários será implementada separadamente.
  app.get('/api/admin/status', authenticate(authService), requireRole('admin'), (_req, res) => {
    res.set('Cache-Control', 'no-store').json({ status: 'ok', acesso: 'administrador' });
  });

  app.get('/api/health', async (_req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      await database.authenticate();
      res.status(200).json({ status: 'ok', database: 'connected' });
    } catch {
      res.status(503).json({ erro: { codigo: 'DATABASE_UNAVAILABLE', mensagem: 'Banco de dados indisponível.' } });
    }
  });

  app.use((_req, res) => {
    res.status(404).json({ erro: { codigo: 'NOT_FOUND', mensagem: 'Rota não encontrada.' } });
  });

  app.use((error, _req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof AppError) {
      if (error.status === 401) res.set('WWW-Authenticate', 'Bearer');
      return res.status(error.status).json({ erro: {
        codigo: error.codigo, mensagem: error.message,
        ...(error.detalhes ? { detalhes: error.detalhes } : {}),
      } });
    }
    if (/^Sequelize(Connection|Host|ConnectionAcquire)/.test(error.name ?? '')) {
      return res.status(503).json({ erro: { codigo: 'DATABASE_UNAVAILABLE', mensagem: 'Banco de dados indisponível.' } });
    }
    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({ erro: { codigo: 'INVALID_JSON', mensagem: 'JSON inválido.' } });
    }
    if (error.type === 'entity.too.large') {
      return res.status(413).json({ erro: { codigo: 'PAYLOAD_TOO_LARGE', mensagem: 'Corpo da requisição excede o limite.' } });
    }
    // Não registrar o objeto de erro: pode incluir SQL, credenciais ou dados pessoais.
    console.error('[API] Falha interna não esperada.');
    return res.status(500).json({ erro: { codigo: 'INTERNAL_ERROR', mensagem: 'Erro interno do servidor.' } });
  });
  return app;
}
