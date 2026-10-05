CREATE TABLE IF NOT EXISTS content (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  revision INTEGER NOT NULL,
  document TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS backups (
  revision INTEGER PRIMARY KEY,
  document TEXT NOT NULL,
  saved_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE TRIGGER IF NOT EXISTS backup_content BEFORE UPDATE ON content
BEGIN
  INSERT OR IGNORE INTO backups (revision, document) VALUES (OLD.revision, OLD.document);
  DELETE FROM backups WHERE revision NOT IN (
    SELECT revision FROM backups ORDER BY revision DESC LIMIT 30
  );
END;
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  csrf TEXT NOT NULL,
  expires INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions (expires);
CREATE TABLE IF NOT EXISTS login_attempts (
  address TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  expires INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS attempts_expiry ON login_attempts (expires);
