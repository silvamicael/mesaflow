import { fileURLToPath, pathToFileURL } from 'node:url';
import { Umzug, SequelizeStorage } from 'umzug';
import { sequelize } from '../src/config/database.js';

const command = process.argv[2];
if (!['status', 'up'].includes(command)) {
  console.error('Comando inválido. Use npm run db:status ou npm run db:migrate.');
  process.exitCode = 1;
} else {
  const migrator = new Umzug({
    migrations: {
      glob: ['*.js', { cwd: fileURLToPath(new URL('../src/database/migrations/', import.meta.url)) }],
      resolve: ({ name, path, context }) => ({
        name,
        up: async () => (await import(pathToFileURL(path).href)).up({ context }),
        down: async () => (await import(pathToFileURL(path).href)).down({ context }),
      }),
    },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize, tableName: 'sequelize_meta' }),
    logger: console,
  });
  try {
    await sequelize.authenticate();
    if (command === 'status') {
      const executed = await migrator.executed();
      const pending = await migrator.pending();
      console.log(`Executadas: ${executed.length} | Pendentes: ${pending.length}`);
      for (const migration of pending) console.log(`Pendente: ${migration.name}`);
    } else {
      const applied = await migrator.up();
      console.log(`Migrations aplicadas: ${applied.length}`);
    }
  } catch {
    console.error('Falha nas migrations. Confira a conexão e os arquivos da migration.');
    process.exitCode = 1;
  } finally { await sequelize.close(); }
}
