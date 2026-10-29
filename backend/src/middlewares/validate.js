import { AppError } from '../utils/app-error.js';
export function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(new AppError(400, 'VALIDATION_ERROR', 'Dados inválidos.',
        result.error.issues.map(issue => ({ campo: issue.path.join('.') || 'body', mensagem: issue.message }))));
    }
    req.validatedBody = result.data;
    next();
  };
}
