import dotenv from 'dotenv';

dotenv.config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variable d'environnement manquante : ${name}. Copiez .env.example vers .env et renseignez-la.`
    );
  }
  return value;
}

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',

  admin: {
    username: process.env.ADMIN_USERNAME ?? 'admin',
    password: process.env.ADMIN_PASSWORD ?? 'admin123',
  },

  company: {
    name: process.env.COMPANY_NAME ?? 'Registre SARL',
    address: process.env.COMPANY_ADDRESS ?? '',
    phone: process.env.COMPANY_PHONE ?? '',
    email: process.env.COMPANY_EMAIL ?? '',
    ice: process.env.COMPANY_ICE ?? '',
  },

  currency: process.env.CURRENCY ?? 'MAD',
  tvaRate: Number(process.env.TVA_RATE ?? 0.2),
};

export default config;
