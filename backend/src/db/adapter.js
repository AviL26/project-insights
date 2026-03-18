const Database = require('better-sqlite3');
const path = require('path');

let db;

function getDb() {
  if (!db) {
    const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'econcrete.sqlite');
    const dir = path.dirname(dbPath);
    require('fs').mkdirSync(dir, { recursive: true });
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function query(sql, params = []) {
  return getDb().prepare(sql).all(...(Array.isArray(params) ? params : [params]));
}

function queryOne(sql, params = []) {
  return getDb().prepare(sql).get(...(Array.isArray(params) ? params : [params]));
}

function run(sql, params = []) {
  return getDb().prepare(sql).run(...(Array.isArray(params) ? params : [params]));
}

function transaction(fn) {
  return getDb().transaction(fn)();
}

function close() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, query, queryOne, run, transaction, close };
