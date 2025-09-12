const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'projects.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Add permits table
  db.run(`CREATE TABLE IF NOT EXISTS permits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    name TEXT NOT NULL,
    status TEXT,
    issue_date DATE,
    expiry_date DATE,
    submission_date DATE,
    expected_decision DATE,
    authority TEXT,
    conditions INTEGER DEFAULT 0,
    FOREIGN KEY (project_id) REFERENCES projects (id)
  )`);

  // Add compliance deadlines table
  db.run(`CREATE TABLE IF NOT EXISTS compliance_deadlines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    task TEXT NOT NULL,
    due_date DATE,
    framework TEXT,
    priority TEXT,
    status TEXT DEFAULT 'pending',
    FOREIGN KEY (project_id) REFERENCES projects (id)
  )`);

  console.log('Compliance tables created successfully');
});

db.close();
