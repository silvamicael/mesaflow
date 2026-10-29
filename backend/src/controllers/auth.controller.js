export function createAuthController(service) {
  return {
    register: async (req, res) => res.status(201).json({ usuario: await service.register(req.validatedBody) }),
    login: async (req, res) => res.status(200).json(await service.login(req.validatedBody)),
    me: (req, res) => res.status(200).json({ usuario: req.auth.usuario }),
    logout: async (req, res) => { await service.logout(req.auth); res.status(204).end(); },
  };
}
