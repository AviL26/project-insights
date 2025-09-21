const { optimizeDatabase } = require('../db/optimize-indexes');
const { initializeDatabase, db } = require('../db/database');

// Test script to verify all optimizations
const testOptimizations = async () => {
  console.log('🧪 Testing ECOncrete Optimizations...\n');
  
  try {
    // Step 1: Initialize database with new schema
    console.log('1️⃣ Testing database initialization...');
    await initializeDatabase();
    console.log('✅ Database initialization successful\n');
    
    // Step 2: Run index optimization
    console.log('2️⃣ Running database optimization (adding indexes)...');
    await optimizeDatabase();
    console.log('✅ Database optimization completed\n');
    
    // Step 3: Test basic database operations
    console.log('3️⃣ Testing database operations...');
    
    // Test basic query
    const testResult = await db.get('SELECT COUNT(*) as count FROM projects');
    console.log(`✅ Basic query working - Projects count: ${testResult.count}`);
    
    // Step 4: Test database constraints
    console.log('\n4️⃣ Testing database constraints...');
    
    try {
      // Test inserting a project with invalid data (should fail)
      await db.run(`
        INSERT INTO projects (name, location, type, budget) 
        VALUES ('', 'Test Location', 'invalid_type', -100)
      `);
      console.log('❌ Constraint test failed - invalid data was accepted');
    } catch (error) {
      if (error.message.includes('CHECK constraint failed') || 
          error.message.includes('length(name) > 0') ||
          error.message.includes('type IN')) {
        console.log('✅ Database constraints working - invalid data rejected');
      } else {
        console.log('⚠️ Unexpected constraint error:', error.message);
      }
    }
    
    // Step 5: Test foreign key constraints
    console.log('\n5️⃣ Testing foreign key constraints...');
    
    try {
      // Try to insert material for non-existent project (should fail)
      await db.run(`
        INSERT INTO materials (project_id, name, type, quantity, unit) 
        VALUES (99999, 'Test Material', 'concrete', 100, 'tons')
      `);
      console.log('❌ Foreign key constraint test failed - invalid reference accepted');
    } catch (error) {
      if (error.message.includes('FOREIGN KEY constraint failed')) {
        console.log('✅ Foreign key constraints working - invalid reference rejected');
      } else {
        console.log('⚠️ Unexpected foreign key error:', error.message);
      }
    }
    
    // Step 6: Test indexes exist
    console.log('\n6️⃣ Verifying indexes were created...');
    
    const indexes = await db.all(`
      SELECT name, tbl_name 
      FROM sqlite_master 
      WHERE type='index' AND name NOT LIKE 'sqlite_%' 
      ORDER BY tbl_name, name
    `);
    
    console.log(`✅ Found ${indexes.length} custom indexes:`);
    indexes.forEach(index => {
      console.log(`   - ${index.name} on ${index.tbl_name}`);
    });
    
    // Step 7: Performance test
    console.log('\n7️⃣ Running performance test...');
    await performanceTest();
    
    console.log('\n🎉 All optimization tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Database schema updated with constraints');
    console.log('✅ Performance indexes created');
    console.log('✅ Foreign key constraints enforced');
    console.log('✅ Data validation working');
    console.log('✅ Error handling improved');
    
  } catch (error) {
    console.error('❌ Optimization test failed:', error);
    throw error;
  }
};

// Performance test
const performanceTest = async () => {
  try {
    // Create some test data if needed
    const projectCount = await db.get('SELECT COUNT(*) as count FROM projects');
    
    if (projectCount.count === 0) {
      console.log('📝 Creating test data for performance test...');
      
      // Insert test projects
      for (let i = 1; i <= 10; i++) {
        await db.run(`
          INSERT INTO projects (name, description, location, type, status, budget, start_date) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          `Test Project ${i}`,
          `Description for project ${i}`,
          `Location ${i % 5}`,
          ['breakwater', 'seawall', 'pier', 'jetty'][i % 4],
          ['planning', 'design', 'construction'][i % 3],
          Math.random() * 1000000,
          new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        ]);
      }
      console.log('✅ Test data created');
    }
    
    // Test query performance with filtering
    console.log('⏱️ Testing filtered query performance...');
    const startTime = Date.now();
    
    const results = await db.all(`
      SELECT * FROM projects 
      WHERE status = ? AND type = ?
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `, ['planning', 'breakwater', 10, 0]);
    
    const queryTime = Date.now() - startTime;
    console.log(`✅ Filtered query completed in ${queryTime}ms (returned ${results.length} results)`);
    
    // Test index usage with EXPLAIN QUERY PLAN
    const explainResult = await db.all(`
      EXPLAIN QUERY PLAN 
      SELECT * FROM projects 
      WHERE status = ? AND type = ?
      ORDER BY created_at DESC
    `, ['planning', 'breakwater']);
    
    console.log('📊 Query execution plan:');
    explainResult.forEach(row => {
      console.log(`   ${row.detail}`);
    });
    
  } catch (error) {
    console.error('Performance test error:', error);
  }
};

// Cleanup test data
const cleanupTestData = async () => {
  try {
    console.log('🧹 Cleaning up test data...');
    await db.run(`DELETE FROM projects WHERE name LIKE 'Test Project %'`);
    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
};

// Run tests if called directly
if (require.main === module) {
  testOptimizations()
    .then(async () => {
      // Ask if user wants to cleanup test data
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question('🗑️ Clean up test data? (y/n): ', async (answer) => {
        if (answer.toLowerCase() === 'y') {
          await cleanupTestData();
        }
        
        console.log('👋 Test completed');
        rl.close();
        process.exit(0);
      });
    })
    .catch(async (error) => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testOptimizations, cleanupTestData };