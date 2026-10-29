import { AppError, unauthorized } from '../utils/app-error.js';
export function authenticate(service) {
  return async (req, _res, next) => {
    const authorization = req.get('authorization');
    const match = typeof authorization === 'string' && /^Bearer ([^\s]+)$/i.exec(authorization);
    if (!match || match[1].length > 4096) throw unauthorized();
    req.auth = await service.authenticate(match[1]);
    next();
  };
}
export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.auth) return next(unauthorized());
    if (!roles.includes(req.auth.usuario.papel)) {
      return next(new AppError(403, 'FORBIDDEN', 'Você não tem permissão para esta operação.'));
    }
    next();
  };
}
