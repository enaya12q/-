DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS ad_clicks;

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    balance REAL DEFAULT 0.0,
    referrer_id INTEGER,
    verification_token TEXT,
    is_verified INTEGER DEFAULT 0,
    FOREIGN KEY (referrer_id) REFERENCES users (id)
);

CREATE TABLE ad_clicks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    ad_type TEXT NOT NULL,
    date TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
);