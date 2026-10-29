import { rateLimit } from 'express-rate-limit';
export function createLimiter(limit, windowMs = 15 * 60 * 1000) {
  return rateLimit({
    windowMs, limit, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { erro: { codigo: 'RATE_LIMIT', mensagem: 'Muitas tentativas. Aguarde e tente novamente.' } },
  });
}
