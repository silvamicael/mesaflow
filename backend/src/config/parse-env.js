export function parseEnv(source) {
  function required(name) {
    const value = source[name];
    if (typeof value !== 'string' || !value.trim()) {
      throw new Error(`Variável obrigatória ausente: ${name}`);
    }
    return value;
  }
  function port(name, fallback) {
    const value = source[name] ?? fallback;
    if (!/^\d+$/.test(String(value))) throw new Error(`Porta inválida: ${name}`);
    const result = Number(value);
    if (!Number.isInteger(result) || result < 1 || result > 65535) {
      throw new Error(`Porta inválida: ${name}`);
    }
    return result;
  }
  const nodeEnv = source.NODE_ENV ?? 'development';
  if (!['development', 'test'].includes(nodeEnv)) {
    throw new Error('Esta base está configurada somente para desenvolvimento e testes locais.');
  }
  const jwtSecret = required('JWT_SECRET');
  if (!/^[a-f0-9]{64}$/i.test(jwtSecret)) throw new Error('JWT_SECRET deve ser gerado por npm run auth:setup.');
  const jwtExpiresSeconds = Number(source.JWT_EXPIRES_SECONDS ?? 3600);
  if (!Number.isInteger(jwtExpiresSeconds) || jwtExpiresSeconds < 60 || jwtExpiresSeconds > 86400) {
    throw new Error('JWT_EXPIRES_SECONDS deve ser um inteiro entre 60 e 86400.');
  }
  const origin = source.CLIENT_ORIGIN ?? 'http://localhost:5173';
  let url;
  try { url = new URL(origin); } catch { throw new Error('CLIENT_ORIGIN inválida.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin) {
    throw new Error('CLIENT_ORIGIN deve conter apenas protocolo, host e porta, sem caminho.');
  }
  return Object.freeze({
    nodeEnv, host: source.HOST ?? '127.0.0.1', port: port('PORT', 3001),
    clientOrigin: origin, jwtSecret, jwtExpiresSeconds,
    db: Object.freeze({
      host: source.DB_HOST ?? '127.0.0.1', port: port('DB_PORT', 5433),
      name: required('DB_NAME'), user: required('DB_USER'), password: required('DB_PASSWORD'),
    }),
  });
}
