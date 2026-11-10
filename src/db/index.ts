import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const { Pool } = pg;

// Connection config using user credentials
const connectionConfig = {
  host: process.env.DB_HOST || 'focooffroad.com.br',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'cardapio',
  password: process.env.DB_PASSWORD || 'xX83k1YtsGaZt7LJS6ri',
  database: process.env.DB_NAME || 'cardapio',
  ssl: process.env.DB_SSL === 'false' ? false : (process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined),
  connectionTimeoutMillis: 5000,
};

let pool: pg.Pool | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!dbInstance) {
    try {
      pool = new Pool(connectionConfig);
      dbInstance = drizzle(pool, { schema });
    } catch (err) {
      console.warn('[DB] Fallback: Database pool lazy initialization deferred:', err);
    }
  }
  return dbInstance;
}

export async function testConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const testPool = new Pool(connectionConfig);
    const client = await testPool.connect();
    const result = await client.query('SELECT NOW() as now, current_database() as db');
    client.release();
    await testPool.end();
    return {
      success: true,
      message: `Conectado com sucesso ao banco "${result.rows[0]?.db}"! (${result.rows[0]?.now})`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Aviso: Conexão PostgreSQL externa indisponível (${err.message}). Operando em modo sincronizado local.`,
    };
  }
}

export { schema };
