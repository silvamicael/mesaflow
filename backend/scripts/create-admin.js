import bcrypt from 'bcrypt';
import { sequelize } from '../src/config/database.js';
import { Usuario } from '../src/models/usuario.model.js';
import { cadastroSchema } from '../src/schemas/auth.schema.js';

try {
  const parsed = cadastroSchema.safeParse({
    nome: process.env.ADMIN_NOME, email: process.env.ADMIN_EMAIL, senha: process.env.ADMIN_SENHA,
  });
  if (!parsed.success) {
    console.error('Defina ADMIN_NOME, ADMIN_EMAIL e ADMIN_SENHA válidos em backend/.env. Senha: mínimo 10 caracteres e máximo 72 bytes.');
    process.exitCode = 1;
  } else {
    await sequelize.authenticate();
    const { nome, email, senha } = parsed.data;
    const existing = await Usuario.findOne({ where: { email } });
    if (existing) {
      if (existing.papel !== 'admin' || !existing.ativo) {
        console.error('O e-mail já pertence a uma conta não administrativa ou inativa. Nenhuma conta foi alterada.');
        process.exitCode = 1;
      } else console.log('Administrador já existe. Senha e dados foram preservados.');
    } else {
      await Usuario.create({ nome, email, senha_hash: await bcrypt.hash(senha, 12), papel: 'admin', ativo: true });
      console.log('Administrador criado. Remova ADMIN_SENHA do arquivo .env após o uso.');
    }
  }
} catch (error) {
  console.error(error.name === 'SequelizeUniqueConstraintError' ? 'O e-mail já foi cadastrado; nenhuma conta foi promovida.' : 'Não foi possível criar o administrador. Confira as migrations e a conexão.');
  process.exitCode = 1;
} finally { await sequelize.close(); }
