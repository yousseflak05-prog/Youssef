import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

/** Erreur métier portant un code HTTP explicite. */
export class ApiError extends Error {
  constructor(status, message, details = undefined) {
    super(message);
    this.status = status;
    this.details = details;
  }

  static badRequest(message, details) {
    return new ApiError(400, message, details);
  }
  static unauthorized(message = 'Authentification requise') {
    return new ApiError(401, message);
  }
  static forbidden(message = 'Accès refusé') {
    return new ApiError(403, message);
  }
  static notFound(message = 'Ressource introuvable') {
    return new ApiError(404, message);
  }
  static conflict(message, details) {
    return new ApiError(409, message, details);
  }
}

/** Évite un try/catch dans chaque handler asynchrone. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route inconnue : ${req.method} ${req.originalUrl}` });
}

/* eslint-disable no-unused-vars */
export function errorHandler(err, req, res, next) {
  // Validation de payload
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Données invalides',
      details: err.errors.map((e) => ({ champ: e.path.join('.'), message: e.message })),
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Violation de contrainte d'unicité
    if (err.code === 'P2002') {
      const champs = err.meta?.target?.join(', ') ?? 'champ';
      return res.status(409).json({ error: `Cette valeur existe déjà (${champs})` });
    }
    // Enregistrement introuvable
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Ressource introuvable' });
    }
    // Violation de clé étrangère
    if (err.code === 'P2003') {
      return res.status(409).json({
        error: "Suppression impossible : cet enregistrement est référencé ailleurs",
      });
    }
  }

  console.error('[erreur non gérée]', err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
}
