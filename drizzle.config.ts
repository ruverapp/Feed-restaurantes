import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.DB_HOST || 'focooffroad.com.br',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'cardapio',
    password: process.env.DB_PASSWORD || 'xX83k1YtsGaZt7LJS6ri',
    database: process.env.DB_NAME || 'cardapio',
    ssl: process.env.DB_SSL === 'true',
  },
});
