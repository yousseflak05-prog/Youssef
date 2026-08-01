import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import prisma from '../lib/prisma.js';
import config from '../lib/config.js';
import { asyncHandler, ApiError } from '../middleware/errors.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const loginSchema = z.object({
  username: z.string().trim().min(1, "Nom d'utilisateur requis"),
  password: z.string().min(1, 'Mot de passe requis'),
});

/** POST /api/auth/login — échange identifiants contre un JWT. */
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { username, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { username } });

    // Message volontairement identique dans les deux cas : ne pas révéler
    // si le nom d'utilisateur existe.
    const invalide = ApiError.unauthorized('Identifiants incorrects');
    if (!user) {
      // Coût de hachage consommé quand même, pour ne pas laisser fuiter
      // l'existence du compte via le temps de réponse.
      await bcrypt.compare(password, '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv');
      throw invalide;
    }

    const motDePasseValide = await bcrypt.compare(password, user.passwordHash);
    if (!motDePasseValide) throw invalide;

    const token = jwt.sign({ sub: user.id, username: user.username, role: user.role }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });

    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role },
    });
  })
);

/** GET /api/auth/me — profil courant, sert aussi à valider un jeton stocké. */
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { id: true, username: true, role: true, createdAt: true },
    });
    if (!user) throw ApiError.unauthorized('Compte introuvable');
    res.json(user);
  })
);

export default router;
