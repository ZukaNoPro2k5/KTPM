/**
 * TEST REAL MICROSERVICES - Flight Service Performance
 * Đo hiệu năng thật của flight-service
 */

const autocannon = require('autocannon');

console.log('🔥 TESTING REAL FLIGHT SERVICE\n');

async function testFlightService() {
  console.log('🎯 Testing Flight Service');
  console.log('URL: http://localhost:3002/api/Flights/GetAllFlights');
  console.log('Duration: 10s, Connections: 10\n');
  
  const result = await new Promise(resolve => {
    const instance = autocannon({
      url: 'http://localhost:3002/api/Flights/GetAllFlights',
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
    const result = await testFlightService();
    
    console.log('\n📊 FLIGHT SERVICE PERFORMANCE:');
    console.log(`   Average RPS: ${result.requests.average.toFixed(2)}`);
    console.log(`   Throughput: ${(result.throughput.average / 1024 / 1024).toFixed(2)} MB/s`);
    
    if (result.latency) {
      console.log(`   Mean latency: ${result.latency.mean.toFixed(2)}ms`);
      if (result.latency.p50) console.log(`   p50 latency: ${result.latency.p50.toFixed(2)}ms`);
      if (result.latency.p95) console.log(`   p95 latency: ${result.latency.p95.toFixed(2)}ms`);
      if (result.latency.p99) console.log(`   p99 latency: ${result.latency.p99.toFixed(2)}ms`);
    }
    
    // Tính toán scaling
    const searchRPS = 200;  // Target search traffic
    const replicasNeeded = Math.ceil(searchRPS / result.requests.average);
    
    console.log(`\n💡 SCALING ANALYSIS FOR SEARCH SERVICE:`);
    console.log(`   1 flight-service replica handles: ~${result.requests.average.toFixed(0)} RPS`);
    console.log(`   Target search load: ${searchRPS} RPS`);
    console.log(`   Flight service replicas needed: ${replicasNeeded}`);
    
    console.log(`\n📦 MICROSERVICES ARCHITECTURE:`);
    console.log(`   Flight Service (search): ${replicasNeeded} replicas`);
    console.log(`   Booking Service: 1 replica (handles 20 RPS easily)`);
    console.log(`   Total: ${replicasNeeded + 1} replicas`);
    
    console.log(`\n💡 Next: Test booking service with:`);
    console.log(`   docker-compose up -d booking-service`);
    console.log(`   node test-booking-service.js`);
    
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.log('\n💡 Make sure flight-service is running:');
    console.log('   docker-compose up -d flight-service');
  }
}

main();
