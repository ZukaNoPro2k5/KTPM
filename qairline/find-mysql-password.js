const mysql = require('mysql2');

console.log('🔍 Testing common XAMPP passwords...\n');

const passwords = ['', 'root', 'password', 'admin', 'DevPass123!', 'DevPass123'];

let testIndex = 0;

function testPassword(pass) {
  console.log(`Test ${testIndex + 1}: root with password = "${pass || '(empty)'}"`);
  
  const conn = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: pass,
    database: 'QAirline'
  });
  
  conn.connect((err) => {
    if (err) {
      console.log(`   ❌ Failed: ${err.code}`);
      testIndex++;
      if (testIndex < passwords.length) {
        testPassword(passwords[testIndex]);
      } else {
        console.log('\n💡 SOLUTION:');
        console.log('   Không tìm thấy password đúng!');
        console.log('   Hãy:');
        console.log('   1. Mở DataGrip');
        console.log('   2. Click "Data Source" → "MySQL"');
        console.log('   3. Nhập user/password mà bạn biết');
        console.log('   4. Test Connection');
        console.log('   5. Sau khi connect được, chạy SQL:');
        console.log('      CREATE USER \'dev\'@\'localhost\' IDENTIFIED BY \'DevPass123!\';');
        console.log('      GRANT ALL PRIVILEGES ON QAirline.* TO \'dev\'@\'localhost\';');
        console.log('      FLUSH PRIVILEGES;');
      }
    } else {
      console.log(`   ✅ SUCCESS! Root password is: "${pass || '(empty)'}"`);
      console.log('\n🎉 Found working credentials!');
      console.log(`   User: root`);
      console.log(`   Password: ${pass || '(empty)'}`);
      console.log('\nNow creating user "dev"...');
      
      // Tạo user dev
      const createUserSQL = `
        CREATE USER IF NOT EXISTS 'dev'@'localhost' IDENTIFIED BY 'DevPass123!';
        GRANT ALL PRIVILEGES ON QAirline.* TO 'dev'@'localhost';
        FLUSH PRIVILEGES;
      `;
      
      conn.query(createUserSQL, (err2) => {
        if (err2) {
          console.log('❌ Error creating dev user:', err2.message);
          console.log('\nManually run this in DataGrip:');
          console.log('   CREATE USER \'dev\'@\'localhost\' IDENTIFIED BY \'DevPass123!\';');
          console.log('   GRANT ALL PRIVILEGES ON QAirline.* TO \'dev\'@\'localhost\';');
          console.log('   FLUSH PRIVILEGES;');
        } else {
          console.log('✅ User "dev" created successfully!');
          console.log('\n🚀 Now you can run: npm run dev');
        }
        conn.end();
      });
    }
  });
}

testPassword(passwords[0]);
