export async function up({ context: queryInterface }) {
  await queryInterface.sequelize.transaction(async transaction => {
    await queryInterface.sequelize.query(`
      CREATE TABLE usuarios (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome VARCHAR(120) NOT NULL CHECK (char_length(btrim(nome)) >= 2),
        email VARCHAR(254) NOT NULL CHECK (email = lower(btrim(email)) AND char_length(email) > 3),
        senha_hash VARCHAR(60) NOT NULL CHECK (char_length(senha_hash) = 60),
        telefone VARCHAR(16),
        papel VARCHAR(20) NOT NULL DEFAULT 'cliente' CHECK (papel IN ('admin', 'funcionario', 'cliente')),
        ativo BOOLEAN NOT NULL DEFAULT TRUE,
        criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE UNIQUE INDEX usuarios_email_unico ON usuarios (lower(email));
    `, { transaction });
  });
}
export async function down({ context: queryInterface }) {
  await queryInterface.sequelize.transaction(async transaction => {
    await queryInterface.dropTable('usuarios', { transaction });
  });
}
