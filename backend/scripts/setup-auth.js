import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
const path = fileURLToPath(new URL('../.env', import.meta.url));
try {
  let text = await readFile(path, 'utf8');
  const secretLine = /^JWT_SECRET=.*$/m;
  const found = text.match(secretLine)?.[0];
  if (!found || /^JWT_SECRET=\s*$/.test(found)) {
    const value = `JWT_SECRET=${randomBytes(32).toString('hex')}`;
    text = found ? text.replace(secretLine, value) : `${text.trimEnd()}\n\n${value}\n`;
  }
  if (!/^JWT_EXPIRES_SECONDS=/m.test(text)) text += '\nJWT_EXPIRES_SECONDS=3600\n';
  await writeFile(path, text, { mode: 0o600 });
  console.log('Configuração JWT preparada em backend/.env. Um segredo existente foi preservado.');
} catch {
  console.error('Não foi possível preparar JWT. Verifique se backend/.env existe e é gravável.');
  process.exitCode = 1;
}
