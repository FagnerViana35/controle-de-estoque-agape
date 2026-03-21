import knex from 'knex';
import 'dotenv/config';

async function createDatabase() {
  const db = knex({
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: 'postgres'
    }
  });

  try {
    const dbName = process.env.DB_NAME || 'estoque_agape';
    const exists = await db.raw(`SELECT 1 FROM pg_database WHERE datname = ?`, [dbName]);
    
    if (exists.rowCount === 0) {
      console.log(`Criando banco de dados: ${dbName}...`);
      await db.raw(`CREATE DATABASE ${dbName}`);
      console.log('Banco de dados criado com sucesso!');
    } else {
      console.log(`O banco de dados ${dbName} já existe.`);
    }
  } catch (error) {
    console.error('Erro ao criar banco de dados:', error);
  } finally {
    await db.destroy();
  }
}

createDatabase();
