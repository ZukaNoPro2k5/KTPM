const mysql = require('mysql2');

console.log('🔍 Testing different password formats...\n');

// Test 1: Password with exclamation mark
console.log('Test 1: Password = DevPass123!');
const connection1 = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'dev',
  password: 'DevPass123!',
  database: 'QAirline'
});

connection1.connect((err) => {
  if (err) {
    console.log('❌ Failed with DevPass123!');
    console.log('   Error:', err.code, '-', err.message);
  } else {
    console.log('✅ Success with DevPass123!');
    connection1.end();
    process.exit(0);
  }
  
  // Test 2: Password without exclamation mark
  console.log('\nTest 2: Password = DevPass123');
  const connection2 = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'dev',
    password: 'DevPass123',
    database: 'QAirline'
  });
  
  connection2.connect((err2) => {
    if (err2) {
      console.log('❌ Failed with DevPass123');
      console.log('   Error:', err2.code, '-', err2.message);
    } else {
      console.log('✅ Success with DevPass123');
      connection2.end();
      process.exit(0);
    }
    
    // Test 3: Try with root user
    console.log('\nTest 3: Trying with root user...');
    const connection3 = mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'QAirline'
    });
    
    connection3.connect((err3) => {
      if (err3) {
        console.log('❌ Failed with root (empty password)');
        console.log('   Error:', err3.code, '-', err3.message);
        console.log('\n💡 SOLUTIONS:');
        console.log('   1. User "dev" chưa được tạo trong MySQL');
        console.log('   2. Hoặc password sai');
        console.log('   3. Hãy mở DataGrip/phpMyAdmin và:');
        console.log('      - Check user "dev" có tồn tại không');
        console.log('      - Nếu chưa có, tạo user mới với password chính xác');
        console.log('      - Hoặc dùng user "root" trong file .env');
      } else {
        console.log('✅ Success with root!');
        console.log('💡 Root user works, but "dev" user has issues.');
        console.log('   → You can use root in .env files temporarily');
        console.log('   → Or create "dev" user in MySQL');
        connection3.end();
      }
    });
  });
});
