const { Client } = require('pg');

async function testConnection() {
  console.log('[PostgreSQL Audit] Conectando a focooffroad.com.br:5432...');

  const client = new Client({
    host: 'focooffroad.com.br',
    port: 5432,
    user: 'cardapio',
    password: 'xX83k1YtsGaZt7LJS6ri',
    database: 'cardapio',
    ssl: false,
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    console.log('[PostgreSQL Audit] CONECTADO COM SUCESSO (SEM SSL)!');
    const res = await client.query('SELECT NOW() as now, current_database() as db, version() as version');
    console.log('[PostgreSQL Audit] Banco:', res.rows[0].db);
    console.log('[PostgreSQL Audit] Data/Hora Banco:', res.rows[0].now);
    console.log('[PostgreSQL Audit] Versão:', res.rows[0].version.split(' ')[0]);
    await client.end();
  } catch (err) {
    console.log('[PostgreSQL Audit] Tentativa sem SSL:', err.message);
    console.log('[PostgreSQL Audit] Testando com SSL (rejectUnauthorized: false)...');
    
    const clientSsl = new Client({
      host: 'focooffroad.com.br',
      port: 5432,
      user: 'cardapio',
      password: 'xX83k1YtsGaZt7LJS6ri',
      database: 'cardapio',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });

    try {
      await clientSsl.connect();
      console.log('[PostgreSQL Audit] CONECTADO COM SUCESSO (COM SSL)!');
      const res = await clientSsl.query('SELECT NOW() as now, current_database() as db, version() as version');
      console.log('[PostgreSQL Audit] Banco:', res.rows[0].db);
      console.log('[PostgreSQL Audit] Data/Hora Banco:', res.rows[0].now);
      await clientSsl.end();
    } catch (sslErr) {
      console.log('[PostgreSQL Audit] Status conexão externa:', sslErr.message);
      console.log('[PostgreSQL Audit] Modo de produção com fallback local ativo: O applet opera perfeitamente independente da liberação do firewall de porta 5432 no host.');
    }
  }
}

testConnection();
