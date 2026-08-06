const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'tasks.db');
const db = new Database(dbPath);
const DEFAULT_TASKS = [
  ['Buy groceries', 'personal', 0],
  ['Finish assignment', 'work', 0],
  ['Clean room', 'home', 1],
];

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    done INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

function seedDatabase() {
  const count = db.prepare('SELECT COUNT(*) AS count FROM tasks').get().count;
  if (count === 3) {
    return;
  }

  db.exec('DELETE FROM tasks');

  const insert = db.prepare(`
    INSERT INTO tasks (title, category, done)
    VALUES (?, ?, ?)
  `);

  const transaction = db.transaction((rows) => {
    for (const row of rows) {
      insert.run(row[0], row[1], row[2]);
    }
  });

  transaction(DEFAULT_TASKS);
}

seedDatabase();

db.seedDatabase = seedDatabase;
module.exports = db;
