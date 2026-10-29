import { z } from 'zod';
export const emailSchema = z.string().trim().toLowerCase().max(254).email('E-mail inválido.');
export const senhaSchema = z.string().min(10, 'A senha deve ter pelo menos 10 caracteres.')
  .max(72, 'A senha deve ter no máximo 72 bytes.')
  .refine(value => Buffer.byteLength(value, 'utf8') <= 72, 'A senha deve ter no máximo 72 bytes.')
  .refine(value => !value.includes('\0'), 'Senha contém caractere inválido.');
export const cadastroSchema = z.strictObject({
  nome: z.string().trim().min(2).max(120),
  email: emailSchema,
  senha: senhaSchema,
  telefone: z.string().trim().regex(/^\+?[0-9]{10,15}$/, 'Use apenas dígitos, com DDD; + é permitido no início.').optional(),
});
export const loginSchema = z.strictObject({ email: emailSchema, senha: senhaSchema });
export const claimsSchema = z.object({
  sub: z.string().uuid(), sid: z.string().uuid(),
  iat: z.number().int(), exp: z.number().int(),
});
