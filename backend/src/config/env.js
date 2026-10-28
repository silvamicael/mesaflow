import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { parseEnv } from './parse-env.js';

// Caminho independente da pasta de onde o comando foi executado.
dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });
export const env = parseEnv(process.env);
