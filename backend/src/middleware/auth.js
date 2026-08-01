import jwt from 'jsonwebtoken';
import config from '../lib/config.js';
import { ApiError } from './errors.js';

/**
 * Vérifie le jeton JWT porté par l'en-tête `Authorization: Bearer <token>`
 * et attache l'utilisateur décodé à `req.user`.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(ApiError.unauthorized('Jeton manquant'));
  }

  try {
    req.user = jwt.verify(token, config.jwtSecret);
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Session expirée, reconnectez-vous'));
    }
    next(ApiError.unauthorized('Jeton invalide'));
  }
}

/** Restreint une route à certains rôles. Prévu pour l'après-MVP. */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
    next();
  };
}
