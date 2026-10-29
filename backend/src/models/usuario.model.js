import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
export const Usuario = sequelize.define('Usuario', {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  nome: { type: DataTypes.STRING(120), allowNull: false },
  email: { type: DataTypes.STRING(254), allowNull: false },
  senha_hash: { type: DataTypes.STRING(60), allowNull: false },
  telefone: { type: DataTypes.STRING(16), allowNull: true },
  papel: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'cliente' },
  ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: 'usuarios',
  defaultScope: { attributes: { exclude: ['senha_hash'] } },
  scopes: { autenticacao: { attributes: ['id', 'nome', 'email', 'senha_hash', 'telefone', 'papel', 'ativo'] } },
});
