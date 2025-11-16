import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

// Stress Test: Tăng dần tải để tìm breaking point
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Warm up
    { duration: '5m', target: 100 },   // Normal load
    { duration: '2m', target: 200 },   // Scale up
    { duration: '5m', target: 200 },   
    { duration: '2m', target: 300 },   // More stress
    { duration: '5m', target: 300 },   
    { duration: '2m', target: 400 },   // Heavy stress
    { duration: '5m', target: 400 },   
    { duration: '2m', target: 500 },   // Breaking point?
    { duration: '5m', target: 500 },   
    { duration: '5m', target: 0 },     // Recovery
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // More lenient for stress test
    errors: ['rate<0.05'],              // Allow 5% error rate
  },
};

const BASE_URL = __ENV.API_GATEWAY || 'http://localhost:3000';

export default function () {
  // Stress test focuses on booking (most resource-intensive)
  const bookingPayload = JSON.stringify({
    flightId: Math.floor(Math.random() * 100) + 1,
    userId: Math.floor(Math.random() * 1000) + 1,
    passengers: [
      {
        firstName: `Stress${Math.floor(Math.random() * 1000)}`,
        lastName: 'Test',
        email: `stress${Date.now()}${Math.random()}@example.com`,
      },
    ],
    payment: {
      method: 'credit_card',
      amount: Math.floor(Math.random() * 500) + 100,
    },
  });

  const res = http.post(`${BASE_URL}/api/bookings`, bookingPayload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: '30s',
  });

  const success = check(res, {
    'status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
    'no server error': (r) => r.status < 500,
  });

  errorRate.add(!success);

  sleep(1); // Shorter think time for stress test
}

export function handleSummary(data) {
  console.log('\n🔥 STRESS TEST COMPLETED 🔥\n');
  console.log('Breaking point analysis:');
  
  const p95 = data.metrics.http_req_duration.values.p95;
  const errorRate = data.metrics.errors.values.rate * 100;
  
  console.log(`- p95 response time: ${p95.toFixed(2)}ms`);
  console.log(`- Error rate: ${errorRate.toFixed(2)}%`);
  
  if (p95 > 2000 || errorRate > 5) {
    console.log('\n❌ System reached breaking point!');
    console.log('Recommendation: Scale up resources or optimize code');
  } else {
    console.log('\n✅ System handled stress test well!');
  }

  return {
    'results/stress-test-summary.json': JSON.stringify(data, null, 2),
  };
}
