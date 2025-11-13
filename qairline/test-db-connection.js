const mysql = require('mysql2');

console.log('🔍 Testing MySQL connection...\n');

const connection = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'dev',
  password: 'DevPass123!',
  database: 'QAirline'
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Lỗi kết nối MySQL:', err.message);
    console.error('📋 Error code:', err.code);
    console.error('📋 Error errno:', err.errno);
    console.error('');
    
    if (err.code === 'ECONNREFUSED') {
      console.log('💡 FIX: MySQL chưa chạy!');
      console.log('   → Mở XAMPP Control Panel và Start MySQL');
    }
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 FIX: Sai username hoặc password!');
      console.log('   → Username: dev');
      console.log('   → Password: DevPass123!');
      console.log('   → Chạy lệnh sau trong MySQL:');
      console.log('      CREATE USER \'dev\'@\'localhost\' IDENTIFIED BY \'DevPass123!\';');
      console.log('      GRANT ALL PRIVILEGES ON QAirline.* TO \'dev\'@\'localhost\';');
      console.log('      FLUSH PRIVILEGES;');
    }
    if (err.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 FIX: Database QAirline chưa tạo!');
      console.log('   → Mở DataGrip/phpMyAdmin và tạo database QAirline');
      console.log('   → Hoặc chạy: CREATE DATABASE QAirline;');
    }
    
    process.exit(1);
  }
  
  console.log('✅ Kết nối MySQL thành công!');
  console.log('👤 User:', connection.config.user);
  console.log('🏠 Host:', connection.config.host);
  console.log('📊 Database:', connection.config.database);
  console.log('');
  
  // Test query để đếm số users
  console.log('🔍 Testing query: SELECT COUNT(*) FROM Users...');
  connection.query('SELECT COUNT(*) as total FROM Users', (err, results) => {
    if (err) {
      console.error('❌ Lỗi khi query:', err.message);
      console.log('💡 FIX: Có thể bảng Users chưa tồn tại. Import SQL file trước!');
    } else {
      console.log('✅ Query thành công!');
      console.log('📊 Total users in database:', results[0].total);
      console.log('');
      console.log('🎉 Database connection is working perfectly!');
      console.log('🚀 You can now run: npm run dev');
    }
    connection.end();
  });
});
