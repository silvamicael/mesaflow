import { Router } from 'express';
import { createAuthController } from '../controllers/auth.controller.js';
import { cadastroSchema, loginSchema } from '../schemas/auth.schema.js';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/auth.js';
import { createLimiter } from '../middlewares/rate-limit.js';
export function createAuthRouter(service) {
  const router = Router();
  const controller = createAuthController(service);
  router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  router.post('/register', createLimiter(10), validate(cadastroSchema), controller.register);
  router.post('/login', createLimiter(20), validate(loginSchema), controller.login);
  router.get('/me', authenticate(service), controller.me);
  router.post('/logout', authenticate(service), controller.logout);
  return router;
}
