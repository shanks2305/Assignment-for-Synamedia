const sqlite3 = require('sqlite3').verbose();

// Connect to SQLite database
const db = new sqlite3.Database('./database/parking.db', (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});

// Create tables if they do not exist
db.serialize(() => {
    db.run(
        `CREATE TABLE IF NOT EXISTS reservations (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            vehicle TEXT NOT NULL,
            spot INTEGER NOT NULL UNIQUE
        )`
    );

    db.run(
        `CREATE TABLE IF NOT EXISTS parking_spots (
            spot INTEGER PRIMARY KEY,
            status TEXT NOT NULL DEFAULT 'available'
        )`
    );

    // Initialize parking spots (100 spots)
    for (let i = 1; i <= 100; i++) {
        db.run(
            `INSERT OR IGNORE INTO parking_spots (spot, status) VALUES (?, 'available')`,
            i
        );
    }
});

module.exports = db;
