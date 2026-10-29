import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import { Usuario } from './usuario.model.js';
export const Sessao = sequelize.define('Sessao', {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  usuario_id: { type: DataTypes.UUID, allowNull: false },
  expira_em: { type: DataTypes.DATE, allowNull: false },
  revogada_em: { type: DataTypes.DATE, allowNull: true },
  criado_em: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { tableName: 'sessoes', timestamps: false });
Sessao.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(Sessao, { foreignKey: 'usuario_id', as: 'sessoes' });
