const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`User: ${process.env.DB_USER}`);
    console.log(`Database: ${process.env.DB_NAME}`);
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('\n✅ Connection successful!');

    // Test query
    const [tables] = await connection.query('SHOW TABLES');
    console.log('\n📋 Tables in database:');
    tables.forEach(table => {
      console.log(`  - ${Object.values(table)[0]}`);
    });

    // Test users table
    const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
    console.log(`\n👥 Users count: ${users[0].count}`);

    const [lostItems] = await connection.query('SELECT COUNT(*) as count FROM lost_items');
    console.log(`🔍 Lost items count: ${lostItems[0].count}`);

    const [foundItems] = await connection.query('SELECT COUNT(*) as count FROM found_items');
    console.log(`✨ Found items count: ${foundItems[0].count}`);

    await connection.end();
    console.log('\n✅ Database connection test completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Database connection failed:');
    console.error(error.message);
    process.exit(1);
  }
}

testConnection();
