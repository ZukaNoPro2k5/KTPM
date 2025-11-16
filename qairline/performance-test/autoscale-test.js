/**
 * AUTO-SCALING TEST
 * Tìm số replica cần thiết để đạt 200 RPS search + 20 RPS booking với p95 < 500ms
 */

const autocannon = require('autocannon');
const { spawn } = require('child_process');

const TARGET_SEARCH_RPS = 200;
const TARGET_BOOKING_RPS = 20;
const TARGET_P95_MS = 500;

let monolithProcesses = [];
let searchProcesses = [];
let bookingProcesses = [];

// Start server process
function startServer(script, port) {
  const proc = spawn('node', [script, port], {
    stdio: 'inherit'
  });
  return proc;
}

// Wait for server to be ready
async function waitForServer(url, maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const http = require('http');
      await new Promise((resolve, reject) => {
        http.get(url + '/health', (res) => {
          if (res.statusCode === 200) resolve();
          else reject();
        }).on('error', reject);
      });
      return true;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  return false;
}

// Run load test
async function runLoadTest(urls, endpoint, method, body, duration, connections) {
  const url = urls[Math.floor(Math.random() * urls.length)]; // Random load balancing
  
  const result = await new Promise((resolve) => {
    const instance = autocannon({
      url: url + endpoint,
      connections,
      duration,
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    
    instance.on('done', resolve);
  });
  
  return {
    rps: result.requests.average,
    p50: result.latency.p50,
    p95: result.latency.p95,
    p99: result.latency.p99,
    errors: result.errors
  };
}

// Test with N replicas
async function testMonolithWithReplicas(numReplicas) {
  console.log(`\n\n${'='.repeat(80)}`);
  console.log(`🧪 Testing MONOLITH with ${numReplicas} replicas`);
  console.log('='.repeat(80));
  
  // Start replicas
  const basePort = 3100;
  const urls = [];
  
  for (let i = 0; i < numReplicas; i++) {
    const port = basePort + i;
    console.log(`   Starting replica ${i + 1} on port ${port}...`);
    const proc = startServer('mock-monolith.js', port);
    monolithProcesses.push(proc);
    urls.push(`http://localhost:${port}`);
  }
  
  // Wait for all to be ready
  console.log('   Waiting for replicas to be ready...');
  for (const url of urls) {
    const ready = await waitForServer(url);
    if (!ready) {
      console.log(`   ❌ Failed to start ${url}`);
      return null;
    }
  }
  console.log('   ✅ All replicas ready!\n');
  
  // Test Search: 200 RPS target
  console.log('   📊 Testing SEARCH load (target: 200 RPS)...');
  const searchResult = await runLoadTest(
    urls,
    '/api/flights/search',
    'POST',
    { departure: 'HAN', arrival: 'SGN' },
    10, // 10 seconds
    TARGET_SEARCH_RPS
  );
  
  console.log(`      Actual RPS: ${searchResult.rps.toFixed(2)}`);
  console.log(`      p50: ${(searchResult.p50 || 0).toFixed(2)}ms`);
  console.log(`      p95: ${(searchResult.p95 || 0).toFixed(2)}ms`);
  console.log(`      p99: ${(searchResult.p99 || 0).toFixed(2)}ms`);
  console.log(`      Errors: ${searchResult.errors}`);
  
  // Test Booking: 20 RPS target
  console.log(`\n   📊 Testing BOOKING load (target: 20 RPS)...`);
  const bookingResult = await runLoadTest(
    urls,
    '/api/bookings',
    'POST',
    { flightId: 1, userId: 1 },
    10,
    TARGET_BOOKING_RPS
  );
  
  console.log(`      Actual RPS: ${bookingResult.rps.toFixed(2)}`);
  console.log(`      p50: ${(bookingResult.p50 || 0).toFixed(2)}ms`);
  console.log(`      p95: ${(bookingResult.p95 || 0).toFixed(2)}ms`);
  console.log(`      p99: ${(bookingResult.p99 || 0).toFixed(2)}ms`);
  console.log(`      Errors: ${bookingResult.errors}`);
  
  const success = searchResult.p95 < TARGET_P95_MS && bookingResult.p95 < TARGET_P95_MS;
  
  if (success) {
    console.log(`\n   ✅ SUCCESS with ${numReplicas} replicas!`);
  } else {
    console.log(`\n   ❌ FAILED - p95 too high, need more replicas`);
  }
  
  return { numReplicas, searchResult, bookingResult, success };
}

// Test microservices
async function testMicroservices(searchReplicas, bookingReplicas) {
  console.log(`\n\n${'='.repeat(80)}`);
  console.log(`🧪 Testing MICROSERVICES: ${searchReplicas} search + ${bookingReplicas} booking`);
  console.log('='.repeat(80));
  
  const searchUrls = [];
  const bookingUrls = [];
  
  // Start search replicas
  for (let i = 0; i < searchReplicas; i++) {
    const port = 3200 + i;
    console.log(`   Starting search replica ${i + 1} on port ${port}...`);
    const proc = startServer('mock-search.js', port);
    searchProcesses.push(proc);
    searchUrls.push(`http://localhost:${port}`);
  }
  
  // Start booking replicas
  for (let i = 0; i < bookingReplicas; i++) {
    const port = 3300 + i;
    console.log(`   Starting booking replica ${i + 1} on port ${port}...`);
    const proc = startServer('mock-booking.js', port);
    bookingProcesses.push(proc);
    bookingUrls.push(`http://localhost:${port}`);
  }
  
  console.log('   Waiting for services to be ready...');
  for (const url of [...searchUrls, ...bookingUrls]) {
    const ready = await waitForServer(url);
    if (!ready) {
      console.log(`   ❌ Failed to start ${url}`);
      return null;
    }
  }
  console.log('   ✅ All services ready!\n');
  
  // Test Search
  console.log('   📊 Testing SEARCH load (target: 200 RPS)...');
  const searchResult = await runLoadTest(
    searchUrls,
    '/api/flights/search',
    'POST',
    { departure: 'HAN', arrival: 'SGN' },
    10,
    TARGET_SEARCH_RPS
  );
  
  console.log(`      Actual RPS: ${searchResult.rps.toFixed(2)}`);
  console.log(`      p95: ${searchResult.p95.toFixed(2)}ms`);
  
  // Test Booking
  console.log('\n   📊 Testing BOOKING load (target: 20 RPS)...');
  const bookingResult = await runLoadTest(
    bookingUrls,
    '/api/bookings',
    'POST',
    { flightId: 1, userId: 1 },
    10,
    TARGET_BOOKING_RPS
  );
  
  console.log(`      Actual RPS: ${bookingResult.rps.toFixed(2)}`);
  console.log(`      p95: ${bookingResult.p95.toFixed(2)}ms`);
  
  const success = searchResult.p95 < TARGET_P95_MS && bookingResult.p95 < TARGET_P95_MS;
  const totalReplicas = searchReplicas + bookingReplicas;
  
  if (success) {
    console.log(`\n   ✅ SUCCESS with ${totalReplicas} total replicas!`);
  } else {
    console.log(`\n   ❌ FAILED - need more replicas`);
  }
  
  return { searchReplicas, bookingReplicas, totalReplicas, searchResult, bookingResult, success };
}

// Cleanup
function cleanup() {
  console.log('\n\n🧹 Cleaning up processes...');
  [...monolithProcesses, ...searchProcesses, ...bookingProcesses].forEach(proc => {
    try { proc.kill(); } catch {}
  });
}

// Main
async function main() {
  console.log('🚀 AUTOSCALING TEST - Find minimum replicas needed');
  console.log(`Target: ${TARGET_SEARCH_RPS} RPS search + ${TARGET_BOOKING_RPS} RPS booking`);
  console.log(`Goal: p95 latency < ${TARGET_P95_MS}ms\n`);
  
  // Case A: Monolith
  let monoResult = null;
  for (let replicas = 1; replicas <= 10; replicas++) {
    const result = await testMonolithWithReplicas(replicas);
    if (result && result.success) {
      monoResult = result;
      break;
    }
    cleanup();
    monolithProcesses = [];
    await new Promise(r => setTimeout(r, 2000));
  }
  
  cleanup();
  await new Promise(r => setTimeout(r, 3000));
  
  // Case B: Microservices
  let microResult = null;
  // Try different combinations
  const combos = [
    [3, 1], // 3 search, 1 booking
    [4, 1],
    [5, 1],
    [4, 2],
  ];
  
  for (const [search, booking] of combos) {
    const result = await testMicroservices(search, booking);
    if (result && result.success) {
      microResult = result;
      break;
    }
    cleanup();
    searchProcesses = [];
    bookingProcesses = [];
    await new Promise(r => setTimeout(r, 2000));
  }
  
  cleanup();
  
  // Final Report
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 FINAL RESULTS');
  console.log('='.repeat(80));
  
  if (monoResult) {
    console.log(`\n📦 MONOLITH:`);
    console.log(`   Replicas needed: ${monoResult.numReplicas}`);
    console.log(`   Cost: ${monoResult.numReplicas} units`);
  }
  
  if (microResult) {
    console.log(`\n🎯 MICROSERVICES:`);
    console.log(`   Search replicas: ${microResult.searchReplicas}`);
    console.log(`   Booking replicas: ${microResult.bookingReplicas}`);
    console.log(`   Total replicas: ${microResult.totalReplicas}`);
    console.log(`   Cost: ${microResult.totalReplicas} units`);
  }
  
  if (monoResult && microResult) {
    const savings = monoResult.numReplicas - microResult.totalReplicas;
    const savingsPercent = (savings / monoResult.numReplicas * 100).toFixed(1);
    
    console.log(`\n💰 SAVINGS:`);
    console.log(`   Replicas reduced: ${monoResult.numReplicas} → ${microResult.totalReplicas} (${savings} fewer)`);
    console.log(`   Cost savings: ${savingsPercent}%`);
    console.log(`\n🎓 CONCLUSION:`);
    if (savings > 0) {
      console.log(`   ✅ Microservices saves ${savingsPercent}% by scaling services independently!`);
    } else {
      console.log(`   ⚠️  For this load pattern, monolith is more efficient`);
    }
  }
  
  console.log('\n');
  process.exit(0);
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});

main().catch(err => {
  console.error(err);
  cleanup();
  process.exit(1);
});
