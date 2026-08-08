const { Pool } = require('pg');
require('dotenv').config();


const connectionString = process.env.DATABASE_URL
const db = new Pool({
    connectionString: connectionString,
});

const MAX_DB_RETRIES = 15;
const DB_RETRY_DELAY_MS = 2000;

async function waitForPostgres() {
    let attempt = 0;
    while (attempt < MAX_DB_RETRIES) {
        try {
            await db.query('SELECT 1');
            return;
        } catch (err) {
            attempt += 1;
            if (attempt >= MAX_DB_RETRIES) {
                throw err;
            }
            console.log(`Waiting for Postgres to become available (${attempt}/${MAX_DB_RETRIES})...`);
            await new Promise(resolve => setTimeout(resolve, DB_RETRY_DELAY_MS));
        }
    }
}

async function ensureDatabaseExists() {
    const result = await db.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        ['tasks']
    );

    if (result.rowCount === 0) {
        await db.query(`CREATE DATABASE tasks`);
    }
}

async function initDb() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            done BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    const countResult = await db.query('SELECT COUNT(*) AS count FROM tasks');
    const count = Number(countResult.rows[0].count);
    if (count === 0) {
        await db.query('INSERT INTO tasks (title, done) VALUES ($1, $2)', ['Buy groceries', false]);
        await db.query('INSERT INTO tasks (title, done) VALUES ($1, $2)', ['Finish assignment', false]);
        await db.query('INSERT INTO tasks (title, done) VALUES ($1, $2)', ['Clean room', true]);
    }
}

async function initializeDatabase() {
    try {
        await waitForPostgres();
        await ensureDatabaseExists();
        const tableExists = await db.query("SELECT to_regclass('public.tasks') AS table_exists");
        if (!tableExists.rows[0].table_exists) {
            await initDb();
        }
    } catch (err) {
        console.error('Database connection error:', err.message);
    }
}

const initializationPromise = initializeDatabase();
db.initializationPromise = initializationPromise;

module.exports = db;