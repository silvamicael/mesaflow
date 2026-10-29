export class AppError extends Error {
  constructor(status, codigo, mensagem, detalhes) {
    super(mensagem);
    Object.assign(this, { status, codigo, detalhes });
  }
}
export const unauthorized = () => new AppError(401, 'UNAUTHORIZED', 'Autenticação inválida ou sessão expirada.');
