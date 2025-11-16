import http from 'k6/http';
import { check, sleep } from 'k6';

// Spike Test: Mô phỏng Black Friday / Flash Sale
export const options = {
  stages: [
    { duration: '10s', target: 0 },     // Calm before the storm
    { duration: '30s', target: 1000 },  // SPIKE! 0 → 1000 users in 30s
    { duration: '3m', target: 1000 },   // Stay at peak
    { duration: '30s', target: 500 },   // Gradual recovery
    { duration: '1m', target: 100 },    
    { duration: '30s', target: 0 },     // Back to normal
  ],
  thresholds: {
    http_req_duration: ['p(99)<5000'], // Very lenient
    http_req_failed: ['rate<0.1'],      // Allow 10% failure during spike
  },
};

const BASE_URL = __ENV.API_GATEWAY || 'http://localhost:3000';

// Flash sale flight
const FLASH_SALE_FLIGHT_ID = 42;

export default function () {
  // Everyone searching for flash sale flight
  const searchRes = http.get(
    `${BASE_URL}/api/flights/${FLASH_SALE_FLIGHT_ID}`,
    { timeout: '30s' }
  );

  check(searchRes, {
    'search survived spike': (r) => r.status === 200 || r.status === 429, // 429 = rate limited
    'response received': (r) => r.status !== 0,
  });

  sleep(0.5); // Very short think time - users are impatient!

  // 30% try to book immediately
  if (Math.random() < 0.3) {
    const bookingPayload = JSON.stringify({
      flightId: FLASH_SALE_FLIGHT_ID,
      userId: Math.floor(Math.random() * 10000) + 1,
      passengers: [{ firstName: 'Flash', lastName: 'Sale', email: `sale${Date.now()}@example.com` }],
    });

    const bookRes = http.post(`${BASE_URL}/api/bookings`, bookingPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: '30s',
    });

    check(bookRes, {
      'booking attempted': (r) => r.status !== 0,
      'no crash': (r) => r.status < 500 || r.status === 503, // 503 = service unavailable is OK
    });
  }

  sleep(0.5);
}

export function handleSummary(data) {
  console.log('\n⚡ SPIKE TEST COMPLETED ⚡\n');
  console.log('Flash Sale Simulation Results:');
  
  const totalReqs = data.metrics.http_reqs.values.count;
  const failedReqs = data.metrics.http_req_failed.values.passes || 0;
  const successRate = ((totalReqs - failedReqs) / totalReqs * 100).toFixed(2);
  
  console.log(`- Total requests: ${totalReqs}`);
  console.log(`- Success rate: ${successRate}%`);
  console.log(`- Peak RPS: ${data.metrics.http_reqs.values.rate.toFixed(2)}`);
  
  if (successRate > 80) {
    console.log('\n✅ System survived flash sale spike!');
  } else {
    console.log('\n❌ System struggled with spike traffic');
    console.log('Recommendations:');
    console.log('  - Add rate limiting');
    console.log('  - Implement queue system');
    console.log('  - Add caching layer');
  }

  return {
    'results/spike-test-summary.json': JSON.stringify(data, null, 2),
  };
}
