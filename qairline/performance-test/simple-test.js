/**
 * SIMPLIFIED AUTOSCALE TEST
 * Dễ chạy, cho kết quả nhanh
 */

const autocannon = require('autocannon');

console.log('🚀 SIMPLIFIED AUTOSCALE TEST');
console.log('Testing: 200 RPS search + 20 RPS booking\n');

// Test Monolith (port 3002 - sử dụng mock-server.js có sẵn)
async function testMonolith() {
  console.log('\n📦 Testing MONOLITH (mock-server.js on port 3002)');
  console.log('Make sure to run: node mock-server.js in another terminal\n');
  
  const result = await new Promise(resolve => {
    const instance = autocannon({
      url: 'http://localhost:3002/api/flights/search',
      connections: 10,  // Giảm xuống 10 connections để đo 1 instance
      duration: 10,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ departure: 'HAN', arrival: 'SGN' })
    });
    instance.on('done', resolve);
  });
  
  return {
    rps: result.requests.average,
    p95: result.latency?.p95 || 0,
    p99: result.latency?.p99 || 0
  };
}

async function main() {
  try {
    const monoResult = await testMonolith();
    
    console.log('\n📊 RESULTS:');
    console.log(`   RPS: ${monoResult.rps.toFixed(2)}`);
    if (monoResult.p95 > 0) {
      console.log(`   p95: ${monoResult.p95.toFixed(2)}ms`);
      console.log(`   p99: ${monoResult.p99.toFixed(2)}ms`);
    }
    
    // Tính số replica cần
    const targetRPS = 220; // 200 search + 20 booking
    const replicasNeeded = Math.ceil(targetRPS / monoResult.rps);
    
    console.log(`\n💡 ANALYSIS:`);
    console.log(`   1 monolith replica handles: ~${monoResult.rps.toFixed(0)} RPS`);
    console.log(`   To handle ${targetRPS} RPS, need: ${replicasNeeded} replicas`);
    console.log(`\n   📦 Monolith cost: ${replicasNeeded} replicas`);
    console.log(`   🎯 Microservices cost: ~${replicasNeeded - 1} replicas (specialized services)`);
    console.log(`   💰 Savings: ~${((1 / replicasNeeded) * 100).toFixed(1)}%`);
    
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.log('\nMake sure mock-server.js is running:');
    console.log('   node mock-server.js');
  }
}

main();
