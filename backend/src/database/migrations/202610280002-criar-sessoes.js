export async function up({ context: queryInterface }) {
  await queryInterface.sequelize.transaction(async transaction => {
    await queryInterface.sequelize.query(`
      CREATE TABLE sessoes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
        expira_em TIMESTAMPTZ NOT NULL,
        revogada_em TIMESTAMPTZ,
        criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT sessoes_expiracao_valida CHECK (expira_em > criado_em)
      );
      CREATE INDEX sessoes_usuario_idx ON sessoes (usuario_id);
      CREATE INDEX sessoes_expiracao_idx ON sessoes (expira_em);
    `, { transaction });
  });
}
export async function down({ context: queryInterface }) {
  await queryInterface.sequelize.transaction(async transaction => {
    await queryInterface.dropTable('sessoes', { transaction });
  });
}
