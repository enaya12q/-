DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS ad_clicks CASCADE;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    balance REAL DEFAULT 0.0,
    referrer_id INTEGER,
    verification_token TEXT,
    is_verified INTEGER DEFAULT 0,
    FOREIGN KEY (referrer_id) REFERENCES users (id)
);

CREATE TABLE ad_clicks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    ad_type TEXT NOT NULL,
    date TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
);