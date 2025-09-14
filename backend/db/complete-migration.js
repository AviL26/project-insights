// backend/db/complete-migration.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'projects.db');
const db = new sqlite3.Database(dbPath);

console.log('Running complete database migration...\n');

async function runCompleteMigration() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Step 1: Add status column for archive system
      db.run(`ALTER TABLE projects ADD COLUMN status TEXT DEFAULT 'active' CHECK(status IN ('active', 'archived'))`, (err) => {
        if (err && !err.message.includes('duplicate column')) {
          console.error('Error adding status column:', err);
          return reject(err);
        }
        console.log(err ? 'ℹ️ Status column already exists' : '✅ Added status column');
      });

      // Step 2: Add coordinate columns
      db.run(`ALTER TABLE projects ADD COLUMN lat REAL DEFAULT 0`, (err) => {
        if (err && !err.message.includes('duplicate column')) {
          console.error('Error adding lat column:', err);
          return reject(err);
        }
        console.log(err ? 'ℹ️ Lat column already exists' : '✅ Added lat column');
      });

      db.run(`ALTER TABLE projects ADD COLUMN lon REAL DEFAULT 0`, (err) => {
        if (err && !err.message.includes('duplicate column')) {
          console.error('Error adding lon column:', err);
          return reject(err);
        }
        console.log(err ? 'ℹ️ Lon column already exists' : '✅ Added lon column');
      });

      // Step 3: Create compliance_deadlines table
      db.run(`CREATE TABLE IF NOT EXISTS compliance_deadlines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        task TEXT NOT NULL,
        due_date DATE NOT NULL,
        framework TEXT,
        priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in-progress', 'completed', 'overdue')),
        description TEXT,
        responsible_party TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
      )`, (err) => {
        if (err) {
          console.error('Error creating compliance_deadlines table:', err);
          return reject(err);
        }
        console.log('✅ Created compliance_deadlines table');
      });

      // Step 4: Migrate any existing soft-deleted projects
      db.run(`UPDATE projects SET status = 'archived' WHERE deleted_at IS NOT NULL`, function(err) {
        if (err && !err.message.includes('no such column')) {
          console.error('Error migrating soft-deleted projects:', err);
          return reject(err);
        }
        if (this.changes > 0) {
          console.log(`✅ Migrated ${this.changes} soft-deleted projects to archived`);
        }
      });

      // Step 5: Ensure all projects have active status
      db.run(`UPDATE projects SET status = 'active' WHERE status IS NULL`, function(err) {
        if (err) {
          console.error('Error setting active status:', err);
          return reject(err);
        }
        if (this.changes > 0) {
          console.log(`✅ Set active status for ${this.changes} projects`);
        }
      });

      // Step 6: Create indices for performance
      const indices = [
        'CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)',
        'CREATE INDEX IF NOT EXISTS idx_compliance_deadlines_project_id ON compliance_deadlines(project_id)',
        'CREATE INDEX IF NOT EXISTS idx_compliance_deadlines_due_date ON compliance_deadlines(due_date)'
      ];

      indices.forEach((indexSql, i) => {
        db.run(indexSql, (err) => {
          if (err) {
            console.error(`Error creating index ${i + 1}:`, err);
          } else {
            console.log(`✅ Created index ${i + 1}`);
          }
        });
      });

      // Step 7: Verify migration
      db.all(`SELECT status, COUNT(*) as count FROM projects GROUP BY status`, (err, results) => {
        if (err) {
          console.error('Error verifying migration:', err);
          return reject(err);
        }

        console.log('\n📊 Migration Results:');
        results.forEach(row => {
          console.log(`  - ${row.status || 'null'}: ${row.count} projects`);
        });

        // Check table structure
        db.all("PRAGMA table_info(projects)", (err, columns) => {
          if (err) {
            return reject(err);
          }

          const columnNames = columns.map(col => col.name);
          const requiredColumns = ['status', 'lat', 'lon'];
          const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));

          if (missingColumns.length > 0) {
            console.error(`❌ Missing columns: ${missingColumns.join(', ')}`);
            return reject(new Error(`Migration incomplete: missing ${missingColumns.join(', ')}`));
          }

          console.log('✅ All required columns present');
          console.log('\n🎉 Migration completed successfully!');
          resolve();
        });
      });
    });
  });
}

// Run migration if called directly
if (require.main === module) {
  runCompleteMigration()
    .then(() => {
      console.log('\n✅ Database is ready for archive system!');
      db.close();
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error.message);
      db.close();
      process.exit(1);
    });
}

module.exports = { runCompleteMigration };