import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% requests must complete below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate must be below 1%
    errors: ['rate<0.01'],
  },
};

// Base URL (có thể override bằng env var)
const BASE_URL = __ENV.API_GATEWAY || 'http://localhost:3000';

export default function () {
  // Scenario 1: Search flights (most common operation - 60% traffic)
  if (Math.random() < 0.6) {
    const searchPayload = JSON.stringify({
      departure: 'HAN',
      arrival: 'SGN',
      date: '2025-12-25',
      passengers: 1,
    });

    const searchRes = http.post(`${BASE_URL}/api/flights/search`, searchPayload, {
      headers: { 'Content-Type': 'application/json' },
    });

    const searchSuccess = check(searchRes, {
      'search status is 200': (r) => r.status === 200,
      'search response time < 500ms': (r) => r.timings.duration < 500,
      'search returns flights': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.flights && body.flights.length > 0;
        } catch {
          return false;
        }
      },
    });

    errorRate.add(!searchSuccess);
  }

  // Scenario 2: Get flight details (30% traffic)
  else if (Math.random() < 0.9) {
    const flightId = Math.floor(Math.random() * 100) + 1;
    const detailRes = http.get(`${BASE_URL}/api/flights/${flightId}`);

    const detailSuccess = check(detailRes, {
      'detail status is 200': (r) => r.status === 200,
      'detail response time < 300ms': (r) => r.timings.duration < 300,
    });

    errorRate.add(!detailSuccess);
  }

  // Scenario 3: Create booking (10% traffic)
  else {
    const bookingPayload = JSON.stringify({
      flightId: Math.floor(Math.random() * 100) + 1,
      userId: Math.floor(Math.random() * 1000) + 1,
      passengers: [
        {
          firstName: 'Test',
          lastName: 'User',
          email: `test${Date.now()}@example.com`,
        },
      ],
    });

    const bookingRes = http.post(`${BASE_URL}/api/bookings`, bookingPayload, {
      headers: { 'Content-Type': 'application/json' },
    });

    const bookingSuccess = check(bookingRes, {
      'booking status is 200 or 201': (r) => r.status === 200 || r.status === 201,
      'booking response time < 1000ms': (r) => r.timings.duration < 1000,
    });

    errorRate.add(!bookingSuccess);
  }

  // Think time: simulate user reading/thinking
  sleep(Math.random() * 3 + 1); // 1-4 seconds
}

// Summary at the end
export function handleSummary(data) {
  return {
    'results/load-test-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options?.indent || '';
  const enableColors = options?.enableColors || false;

  let summary = '\n' + indent + '📊 Load Test Summary\n';
  summary += indent + '='.repeat(50) + '\n\n';

  // Metrics
  const metrics = data.metrics;
  
  summary += indent + '🚀 HTTP Requests:\n';
  summary += indent + `  Total: ${metrics.http_reqs.values.count}\n`;
  summary += indent + `  Rate: ${metrics.http_reqs.values.rate.toFixed(2)} req/s\n\n`;

  summary += indent + '⏱️  Response Times:\n';
  summary += indent + `  Avg: ${metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += indent + `  p50: ${metrics.http_req_duration.values.p50.toFixed(2)}ms\n`;
  summary += indent + `  p95: ${metrics.http_req_duration.values.p95.toFixed(2)}ms\n`;
  summary += indent + `  p99: ${metrics.http_req_duration.values.p99.toFixed(2)}ms\n\n`;

  summary += indent + '❌ Errors:\n';
  summary += indent + `  Rate: ${(metrics.errors.values.rate * 100).toFixed(2)}%\n`;
  summary += indent + `  Failed: ${metrics.http_req_failed.values.passes || 0}\n\n`;

  summary += indent + '✅ Success:\n';
  const successRate = (1 - metrics.http_req_failed.values.rate) * 100;
  summary += indent + `  Rate: ${successRate.toFixed(2)}%\n\n`;

  return summary;
}
