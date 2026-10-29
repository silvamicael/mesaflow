import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { authRepository } from '../repositories/auth.repository.js';
import { env } from '../config/env.js';
import { claimsSchema } from '../schemas/auth.schema.js';
import { AppError, unauthorized } from '../utils/app-error.js';

const ISSUER = 'mesaflow-api';
const AUDIENCE = 'mesaflow-client';
const COST = 12;
// Mesmo custo de comparação para e-mail inexistente. Não é credencial de usuário.
const dummyHash = bcrypt.hash('dummy-value-not-a-user-password', COST);
export function publicUser(user) {
  return { id: user.id, nome: user.nome, email: user.email, telefone: user.telefone ?? null, papel: user.papel };
}
export function createAuthService(repository = authRepository, config = env) {
  return {
    async register(data) {
      const senha_hash = await bcrypt.hash(data.senha, COST);
      try {
        const user = await repository.createUser({
          nome: data.nome, email: data.email, telefone: data.telefone ?? null,
          senha_hash, papel: 'cliente', ativo: true,
        });
        return publicUser(user);
      } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
          throw new AppError(409, 'EMAIL_IN_USE', 'Não foi possível cadastrar este e-mail.');
        }
        throw error;
      }
    },
    async login(data) {
      const candidate = await repository.findUserByEmail(data.email);
      const correct = await bcrypt.compare(data.senha, candidate?.senha_hash ?? await dummyHash);
      if (!candidate || !correct || !candidate.ativo) {
        throw new AppError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha inválidos.');
      }
      return repository.transaction(async transaction => {
        const user = await repository.lockUser(candidate.id, transaction);
        if (!user || !user.ativo || user.senha_hash !== candidate.senha_hash) {
          throw new AppError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha inválidos.');
        }
        const now = Math.floor(Date.now() / 1000);
        const exp = now + config.jwtExpiresSeconds;
        const sessionId = randomUUID();
        const token = jwt.sign({ sid: sessionId, iat: now, exp }, config.jwtSecret, {
          algorithm: 'HS256', subject: user.id, issuer: ISSUER, audience: AUDIENCE,
        });
        await repository.createSession({
          id: sessionId, usuario_id: user.id, criado_em: new Date(now * 1000),
          expira_em: new Date(exp * 1000),
        }, transaction);
        return { token, token_type: 'Bearer', expires_in: config.jwtExpiresSeconds, usuario: publicUser(user) };
      });
    },
    async authenticate(token) {
      let claims;
      try {
        const decoded = jwt.verify(token, config.jwtSecret, {
          algorithms: ['HS256'], issuer: ISSUER, audience: AUDIENCE,
        });
        claims = claimsSchema.parse(decoded);
      } catch { throw unauthorized(); }
      // Falhas do banco não são convertidas em credenciais inválidas.
      const session = await repository.findSession(claims.sid);
      if (!session || session.usuario_id !== claims.sub || session.revogada_em
        || new Date(session.expira_em).getTime() <= Date.now() || !session.usuario?.ativo) {
        throw unauthorized();
      }
      return { usuario: publicUser(session.usuario), sessaoId: session.id };
    },
    async logout(auth) {
      await repository.revokeSession(auth.sessaoId, auth.usuario.id, new Date());
    },
  };
}
