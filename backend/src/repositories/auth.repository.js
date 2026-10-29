import { sequelize } from '../config/database.js';
import { Usuario } from '../models/usuario.model.js';
import { Sessao } from '../models/sessao.model.js';

export const authRepository = {
  transaction: callback => sequelize.transaction(callback),
  findUserByEmail: email => Usuario.scope('autenticacao').findOne({ where: { email } }),
  createUser: data => Usuario.create(data),
  lockUser: (id, transaction) => Usuario.scope('autenticacao').findByPk(id, {
    transaction, lock: transaction.LOCK.UPDATE,
  }),
  createSession: (data, transaction) => Sessao.create(data, { transaction }),
  findSession: id => Sessao.findByPk(id, { include: [{ model: Usuario, as: 'usuario' }] }),
  revokeSession: (id, usuarioId, now) => Sessao.update({ revogada_em: now }, {
    where: { id, usuario_id: usuarioId, revogada_em: null },
  }),
};
