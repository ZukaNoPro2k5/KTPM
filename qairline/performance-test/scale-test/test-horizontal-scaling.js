const axios = require('axios');
const { execSync } = require('child_process');

/**
 * Test Horizontal Scaling & Cost Comparison
 * So sánh chi phí scale giữa Monolithic vs Microservices
 */

const DOCKER_COMPOSE_MONOLITHIC = '../docker-compose-old.yml';
const DOCKER_COMPOSE_MICROSERVICES = '../docker-compose.yml';

// Cost per instance per month (example - AWS t3.small)
const COST_PER_INSTANCE = {
  '512MB': 10,   // $10/month
  '1GB': 20,     // $20/month
  '2GB': 40,     // $40/month
};

const scenarios = {
  normal: {
    searchRPS: 100,
    bookingRPS: 20,
  },
  peakSearch: {
    searchRPS: 500,  // 5x normal - Black Friday search
    bookingRPS: 50,  // 2.5x normal
  },
  peakBooking: {
    searchRPS: 150,  // 1.5x normal
    bookingRPS: 100, // 5x normal - Flash sale booking
  },
};

/**
 * Calculate scaling requirements for Monolithic
 */
function calculateMonolithicScaling(scenario) {
  const { searchRPS, bookingRPS } = scenario;
  const totalRPS = searchRPS + bookingRPS;
  
  // Monolithic: 1 instance handles ~150 RPS with 2GB RAM
  const instancesNeeded = Math.ceil(totalRPS / 150);
  const cost = instancesNeeded * COST_PER_INSTANCE['2GB'];
  
  return {
    architecture: 'Monolithic',
    instances: instancesNeeded,
    ramPerInstance: '2GB',
    totalCost: cost,
    details: {
      backendInstances: instancesNeeded,
    },
  };
}

/**
 * Calculate scaling requirements for Microservices
 */
function calculateMicroservicesScaling(scenario) {
  const { searchRPS, bookingRPS } = scenario;
  
  // Flight Service: 1 instance handles ~200 RPS with 1GB RAM
  const flightInstances = Math.ceil(searchRPS / 200);
  
  // Booking Service: 1 instance handles ~50 RPS with 1GB RAM (more CPU intensive)
  const bookingInstances = Math.ceil(bookingRPS / 50);
  
  // API Gateway: 1 instance (lightweight)
  const gatewayInstances = 1;
  
  // User Service: 1 instance (low traffic)
  const userInstances = 1;
  
  // Offer Service: 1 instance (low traffic)
  const offerInstances = 1;
  
  const totalCost = 
    (flightInstances * COST_PER_INSTANCE['1GB']) +
    (bookingInstances * COST_PER_INSTANCE['1GB']) +
    (gatewayInstances * COST_PER_INSTANCE['512MB']) +
    (userInstances * COST_PER_INSTANCE['512MB']) +
    (offerInstances * COST_PER_INSTANCE['512MB']);
  
  return {
    architecture: 'Microservices',
    instances: flightInstances + bookingInstances + gatewayInstances + userInstances + offerInstances,
    totalCost: totalCost,
    details: {
      flightInstances,
      bookingInstances,
      gatewayInstances,
      userInstances,
      offerInstances,
    },
  };
}

/**
 * Run performance test and measure actual scaling
 */
async function runPerformanceTest(architecture, scenario, scenarioName) {
  console.log(`\n🧪 Testing ${architecture} - ${scenarioName} scenario...`);
  
  const baseUrl = architecture === 'Monolithic' 
    ? 'http://localhost:5000'
    : 'http://localhost:3000';
  
  const startTime = Date.now();
  let successCount = 0;
  let errorCount = 0;
  let totalResponseTime = 0;
  
  const { searchRPS, bookingRPS } = scenario;
  const duration = 60; // 60 seconds test
  const totalRequests = (searchRPS + bookingRPS) * duration;
  
  console.log(`  Target: ${searchRPS} search RPS + ${bookingRPS} booking RPS`);
  console.log(`  Total requests: ${totalRequests}`);
  
  // Simplified test - in real world, use k6 or artillery
  for (let i = 0; i < Math.min(totalRequests, 1000); i++) {
    try {
      const isSearch = Math.random() < (searchRPS / (searchRPS + bookingRPS));
      const reqStart = Date.now();
      
      if (isSearch) {
        const endpoint = architecture === 'Monolithic'
          ? `${baseUrl}/api/flights/search`
          : `${baseUrl}/api/flights/search`;
        
        await axios.post(endpoint, {
          departure: 'HAN',
          arrival: 'SGN',
          date: '2025-12-25',
        }, { timeout: 5000 });
      } else {
        const endpoint = architecture === 'Monolithic'
          ? `${baseUrl}/api/bookings`
          : `${baseUrl}/api/bookings`;
        
        await axios.post(endpoint, {
          flightId: Math.floor(Math.random() * 100) + 1,
          userId: 1,
          passengers: [{ firstName: 'Test', lastName: 'User', email: 'test@example.com' }],
        }, { timeout: 5000 });
      }
      
      totalResponseTime += (Date.now() - reqStart);
      successCount++;
    } catch (error) {
      errorCount++;
    }
  }
  
  const duration_ms = Date.now() - startTime;
  const avgResponseTime = totalResponseTime / successCount;
  const actualRPS = (successCount / duration_ms) * 1000;
  const errorRate = (errorCount / (successCount + errorCount)) * 100;
  
  return {
    successCount,
    errorCount,
    avgResponseTime: avgResponseTime.toFixed(2),
    actualRPS: actualRPS.toFixed(2),
    errorRate: errorRate.toFixed(2),
  };
}

/**
 * Generate comparison report
 */
function generateReport(results) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 SCALABILITY & COST COMPARISON REPORT');
  console.log('='.repeat(80));
  
  for (const scenarioName in results) {
    const scenario = results[scenarioName];
    
    console.log(`\n🎯 Scenario: ${scenarioName.toUpperCase()}`);
    console.log(`   Load: ${scenarios[scenarioName].searchRPS} search RPS + ${scenarios[scenarioName].bookingRPS} booking RPS\n`);
    
    const mono = scenario.monolithic;
    const micro = scenario.microservices;
    
    // Monolithic
    console.log(`   ❌ MONOLITHIC:`);
    console.log(`      Instances: ${mono.scaling.instances}x backend (${mono.scaling.ramPerInstance} each)`);
    console.log(`      Monthly Cost: $${mono.scaling.totalCost}`);
    if (mono.performance) {
      console.log(`      Performance: ${mono.performance.actualRPS} RPS, ${mono.performance.avgResponseTime}ms avg`);
      console.log(`      Error Rate: ${mono.performance.errorRate}%`);
    }
    
    // Microservices
    console.log(`\n   ✅ MICROSERVICES:`);
    console.log(`      Instances:`);
    console.log(`         - Flight Service: ${micro.scaling.details.flightInstances}x (1GB)`);
    console.log(`         - Booking Service: ${micro.scaling.details.bookingInstances}x (1GB)`);
    console.log(`         - API Gateway: ${micro.scaling.details.gatewayInstances}x (512MB)`);
    console.log(`         - User Service: ${micro.scaling.details.userInstances}x (512MB)`);
    console.log(`         - Offer Service: ${micro.scaling.details.offerInstances}x (512MB)`);
    console.log(`      Monthly Cost: $${micro.scaling.totalCost}`);
    if (micro.performance) {
      console.log(`      Performance: ${micro.performance.actualRPS} RPS, ${micro.performance.avgResponseTime}ms avg`);
      console.log(`      Error Rate: ${micro.performance.errorRate}%`);
    }
    
    // Savings
    const savings = mono.scaling.totalCost - micro.scaling.totalCost;
    const savingsPercent = (savings / mono.scaling.totalCost * 100).toFixed(1);
    
    console.log(`\n   💰 COST SAVINGS:`);
    if (savings > 0) {
      console.log(`      Microservices saves $${savings}/month (${savingsPercent}%)`);
      console.log(`      Annual savings: $${savings * 12}`);
    } else {
      console.log(`      Monolithic is cheaper by $${Math.abs(savings)}/month`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🎓 KEY INSIGHTS:');
  console.log('   • Microservices shine during UNEVEN load (peak search, low booking)');
  console.log('   • Can scale specific services → Lower cost');
  console.log('   • Better fault isolation → Higher availability');
  console.log('   • More complexity → Higher ops cost (consider this too!)');
  console.log('='.repeat(80) + '\n');
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting Scalability & Cost Analysis...\n');
  
  const results = {};
  
  for (const scenarioName in scenarios) {
    const scenario = scenarios[scenarioName];
    
    results[scenarioName] = {
      monolithic: {
        scaling: calculateMonolithicScaling(scenario),
        // performance: await runPerformanceTest('Monolithic', scenario, scenarioName),
      },
      microservices: {
        scaling: calculateMicroservicesScaling(scenario),
        // performance: await runPerformanceTest('Microservices', scenario, scenarioName),
      },
    };
  }
  
  generateReport(results);
  
  // Save to file
  const fs = require('fs');
  fs.writeFileSync(
    'results/scalability-report.json',
    JSON.stringify(results, null, 2)
  );
  
  console.log('✅ Report saved to results/scalability-report.json');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { calculateMonolithicScaling, calculateMicroservicesScaling };
