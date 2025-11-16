/**
 * QUICK PERFORMANCE TEST
 * Test thật hiệu năng của microservices bằng Autocannon (Node.js native)
 */

const autocannon = require('autocannon');
const http = require('http');

// Configuration
const API_GATEWAY_URL = 'http://localhost:3006';
const FLIGHT_SERVICE_URL = 'http://localhost:3002';

// Check if service is running
async function checkService(url) {
  return new Promise((resolve) => {
    http.get(url + '/health', (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false));
  });
}

// Run load test
async function runLoadTest(url, endpoint, duration = 10, connections = 10) {
  console.log(`\n🚀 Testing: ${url}${endpoint}`);
  console.log(`   Duration: ${duration}s, Connections: ${connections}`);
  console.log('   ' + '-'.repeat(50));
  
  const instance = autocannon({
    url: url + endpoint,
    connections: connections,
    duration: duration,
    pipelining: 1,
    method: 'GET',
  });

  autocannon.track(instance, { renderProgressBar: true });

  return new Promise((resolve) => {
    instance.on('done', (result) => {
      console.log(`\n   ✅ Results:`);
      console.log(`      Requests:       ${result.requests.total}`);
      console.log(`      Throughput:     ${result.throughput.total} bytes`);
      console.log(`      RPS (avg):      ${result.requests.average.toFixed(2)}`);
      console.log(`      Latency (avg):  ${result.latency.mean.toFixed(2)}ms`);
      console.log(`      Latency (p99):  ${result.latency.p99.toFixed(2)}ms`);
      console.log(`      Errors:         ${result.errors}`);
      resolve(result);
    });
  });
}

// Main test suite
async function main() {
  console.log('=' .repeat(80));
  console.log('🧪 QAIRLINE MICROSERVICES PERFORMANCE TEST');
  console.log('='.repeat(80));

  // Check services
  console.log('\n📡 Checking services...');
  const gatewayRunning = await checkService(API_GATEWAY_URL);
  const flightRunning = await checkService(FLIGHT_SERVICE_URL);

  if (!gatewayRunning && !flightRunning) {
    console.log('\n❌ ERROR: No services running!');
    console.log('   Start services with: docker-compose up -d');
    process.exit(1);
  }

  console.log(`   API Gateway:    ${gatewayRunning ? '✅ Running' : '❌ Not running'}`);
  console.log(`   Flight Service: ${flightRunning ? '✅ Running' : '❌ Not running'}`);

  const results = {};

  // Test scenarios
  const scenarios = [
    {
      name: 'Light Load',
      duration: 10,
      connections: 10,
      description: 'Normal traffic'
    },
    {
      name: 'Medium Load',
      duration: 10,
      connections: 50,
      description: 'Moderate traffic'
    },
    {
      name: 'Heavy Load',
      duration: 10,
      connections: 100,
      description: 'High traffic'
    },
  ];

  for (const scenario of scenarios) {
    console.log(`\n\n${'='.repeat(80)}`);
    console.log(`📊 SCENARIO: ${scenario.name} (${scenario.description})`);
    console.log('='.repeat(80));

    if (flightRunning) {
      const result = await runLoadTest(
        FLIGHT_SERVICE_URL,
        '/api/flights',
        scenario.duration,
        scenario.connections
      );
      
      results[scenario.name] = {
        rps: result.requests.average,
        latencyAvg: result.latency.mean,
        latencyP99: result.latency.p99,
        errors: result.errors,
      };
    }
  }

  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📈 PERFORMANCE SUMMARY');
  console.log('='.repeat(80));
  
  console.log('\nScenario'.padEnd(20) + 'RPS'.padEnd(15) + 'Latency (avg)'.padEnd(18) + 'Latency (p99)'.padEnd(18) + 'Errors');
  console.log('-'.repeat(80));
  
  for (const [name, data] of Object.entries(results)) {
    console.log(
      name.padEnd(20) +
      data.rps.toFixed(2).padEnd(15) +
      `${data.latencyAvg.toFixed(2)}ms`.padEnd(18) +
      `${data.latencyP99.toFixed(2)}ms`.padEnd(18) +
      data.errors
    );
  }

  console.log('\n🎯 CONCLUSION:');
  const heavyLoad = results['Heavy Load'];
  if (heavyLoad) {
    if (heavyLoad.rps > 100 && heavyLoad.latencyP99 < 500) {
      console.log('   ✅ System performs well under heavy load!');
    } else if (heavyLoad.rps > 50) {
      console.log('   ⚠️  System handles load but may need optimization');
    } else {
      console.log('   ❌ System struggles under heavy load - scaling needed');
    }
  }

  console.log('\n💾 Results saved to results/real-performance-test.json\n');
  
  const fs = require('fs');
  fs.writeFileSync(
    'results/real-performance-test.json',
    JSON.stringify({ scenarios: results, timestamp: new Date().toISOString() }, null, 2)
  );
}

// Run
main().catch(console.error);
