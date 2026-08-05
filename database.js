const Database = require('better-sqlite3');
const db = new Database('tasks.db');
db.exec(`
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

//Add 3 rows to the table if it is empty
const count = db.prepare("SELECT COUNT(*) AS count FROM tasks").get();

if (count.count === 0) {
    const insert = db.prepare(`
        INSERT INTO tasks (title, done)
        VALUES (?, ?)
    `);

    insert.run("Laundry", 0);
    insert.run("Cooking", 0);
    insert.run("Cleaning", 0);

    console.log("Database seeded.");
}

module.exports = db;