/**
 * TEST REAL BACKEND PERFORMANCE
 * Đo performance backend THẬT của bạn
 * 
 * Hướng dẫn:
 * 1. Start backend: cd C:\Workspace\QAirLine_Web_B\backend && npm run dev
 * 2. Run test: node test-real-backend.js
 * 
 * Hoặc test microservices:
 * 1. Start services: cd C:\Workspace\QAirLine_Web_B\qairline && docker-compose up
 * 2. Run test: node test-real-backend.js --micro
 */

const autocannon = require('autocannon');

const isMicro = process.argv.includes('--micro');

console.log('🔥 TESTING REAL PERFORMANCE\n');

async function testMonolith() {
  console.log('📦 Testing MONOLITH backend');
  console.log('URL: http://localhost:3001/health\n');
  
  const result = await new Promise(resolve => {
    const instance = autocannon({
      url: 'http://localhost:3001/health',
      connections: 10,
      duration: 10,
      method: 'GET'
    });
    
    autocannon.track(instance, { renderProgressBar: true });
    instance.on('done', resolve);
  });
  
  return result;
}

async function testMicroservices() {
  console.log('🎯 Testing MICROSERVICES');
  console.log('Testing flight-service: http://localhost:3002/health\n');
  
  const result = await new Promise(resolve => {
    const instance = autocannon({
      url: 'http://localhost:3002/health',
      connections: 10,
      duration: 10,
      method: 'GET'
    });
    
    autocannon.track(instance, { renderProgressBar: true });
    instance.on('done', resolve);
  });
  
  return result;
}

async function main() {
  try {
    const result = isMicro ? await testMicroservices() : await testMonolith();
    
    console.log('\n📊 RESULTS:');
    console.log(`   Average RPS: ${result.requests.average.toFixed(2)}`);
    console.log(`   Throughput: ${(result.throughput.average / 1024 / 1024).toFixed(2)} MB/s`);
    
    if (result.latency) {
      console.log(`   Mean latency: ${result.latency.mean.toFixed(2)}ms`);
      if (result.latency.p95) console.log(`   p95 latency: ${result.latency.p95.toFixed(2)}ms`);
      if (result.latency.p99) console.log(`   p99 latency: ${result.latency.p99.toFixed(2)}ms`);
    }
    
    // Tính số replica cần
    const targetRPS = 220; // 200 search + 20 booking
    const replicasNeeded = Math.ceil(targetRPS / result.requests.average);
    
    console.log(`\n💡 SCALING ANALYSIS:`);
    console.log(`   1 replica handles: ~${result.requests.average.toFixed(0)} RPS`);
    console.log(`   Target load: ${targetRPS} RPS (200 search + 20 booking)`);
    console.log(`   Replicas needed: ${replicasNeeded}`);
    
    if (!isMicro) {
      console.log(`\n   📦 Monolith cost: ${replicasNeeded} replicas`);
      console.log(`   💡 Tip: Run with --micro flag to test microservices`);
    }
    
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    
    if (isMicro) {
      console.log('\n💡 Start microservices first:');
      console.log('   cd C:\\Workspace\\QAirLine_Web_B\\qairline');
      console.log('   docker-compose up');
    } else {
      console.log('\n💡 Start backend first:');
      console.log('   cd C:\\Workspace\\QAirLine_Web_B\\backend');
      console.log('   npm run dev');
    }
  }
}

main();
