// standalone-migrate.js
// Place this in your econcrete folder and run: node standalone-migrate.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path to your database file
const dbPath = path.join(__dirname, 'backend', 'db', 'projects.db');

console.log('Looking for database at:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    console.log('Please check that the database file exists at:', dbPath);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
});

console.log('Running database migration...');

// Check current table structure first
db.all("PRAGMA table_info(projects)", (err, columns) => {
  if (err) {
    console.error('Error checking table structure:', err.message);
    db.close();
    return;
  }

  const columnNames = columns.map(col => col.name);
  console.log('Current columns:', columnNames);

  // Add deleted_at column if it doesn't exist
  if (!columnNames.includes('deleted_at')) {
    db.run('ALTER TABLE projects ADD COLUMN deleted_at TEXT', (err) => {
      if (err) {
        console.error('Error adding deleted_at:', err.message);
      } else {
        console.log('✓ Added deleted_at column');
      }
      
      addUpdatedAtColumn();
    });
  } else {
    console.log('✓ deleted_at column already exists');
    addUpdatedAtColumn();
  }
});

function addUpdatedAtColumn() {
  // Check again for updated_at column
  db.all("PRAGMA table_info(projects)", (err, columns) => {
    if (err) {
      console.error('Error checking table structure:', err.message);
      db.close();
      return;
    }

    const columnNames = columns.map(col => col.name);

    if (!columnNames.includes('updated_at')) {
      db.run('ALTER TABLE projects ADD COLUMN updated_at TEXT DEFAULT (datetime("now"))', (err) => {
        if (err) {
          console.error('Error adding updated_at:', err.message);
        } else {
          console.log('✓ Added updated_at column');
        }
        
        createIndexes();
      });
    } else {
      console.log('✓ updated_at column already exists');
      createIndexes();
    }
  });
}

function createIndexes() {
  // Create indexes
  db.run('CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at)', (err) => {
    if (err) {
      console.error('Error creating deleted_at index:', err.message);
    } else {
      console.log('✓ Created deleted_at index');
    }
    
    db.run('CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at)', (err) => {
      if (err) {
        console.error('Error creating updated_at index:', err.message);
      } else {
        console.log('✓ Created updated_at index');
      }
      
      console.log('\nMigration completed successfully!');
      console.log('You can now use the delete functionality in your app.');
      
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
        }
        process.exit(0);
      });
    });
  });
}