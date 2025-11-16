const { calculateMonolithicScaling, calculateMicroservicesScaling } = require('./test-horizontal-scaling');

/**
 * Extended scenarios for more comprehensive testing
 */

const extendedScenarios = {
  // Existing scenarios
  normal: { searchRPS: 100, bookingRPS: 20 },
  peakSearch: { searchRPS: 500, bookingRPS: 50 },
  peakBooking: { searchRPS: 150, bookingRPS: 100 },
  
  // NEW: Real-world scenarios
  morningRush: {
    name: 'Morning Rush (8-9 AM)',
    searchRPS: 300,
    bookingRPS: 60,
    description: 'Người đi làm tìm vé buổi sáng'
  },
  
  lunchtime: {
    name: 'Lunchtime (12-1 PM)',
    searchRPS: 150,
    bookingRPS: 30,
    description: 'Tải trung bình giờ trưa'
  },
  
  eveningPeak: {
    name: 'Evening Peak (6-8 PM)',
    searchRPS: 400,
    bookingRPS: 80,
    description: 'Sau giờ làm, người dùng đặt vé cho chuyến công tác'
  },
  
  tetHoliday: {
    name: 'Tet Holiday Rush',
    searchRPS: 800,
    bookingRPS: 200,
    description: 'Cao điểm Tết - tất cả services đều cao'
  },
  
  blackFriday: {
    name: 'Black Friday Flash Sale',
    searchRPS: 1000,
    bookingRPS: 150,
    description: 'Flash sale - search khủng, booking trung bình'
  },
  
  nighttime: {
    name: 'Night (12 AM - 6 AM)',
    searchRPS: 20,
    bookingRPS: 5,
    description: 'Tải thấp nhất - có thể scale down để tiết kiệm'
  },
  
  summerVacation: {
    name: 'Summer Vacation Peak',
    searchRPS: 600,
    bookingRPS: 120,
    description: 'Mùa du lịch hè'
  },
};

/**
 * Run comprehensive analysis
 */
function runComprehensiveAnalysis() {
  console.log('🔬 COMPREHENSIVE SCALABILITY ANALYSIS');
  console.log('=' .repeat(80) + '\n');
  
  let totalMonolithicCost = 0;
  let totalMicroservicesCost = 0;
  let scenariosWhereMicroWins = 0;
  let totalScenarios = 0;
  
  const results = [];
  
  for (const [key, scenario] of Object.entries(extendedScenarios)) {
    if (typeof scenario.searchRPS === 'undefined') continue;
    
    totalScenarios++;
    
    const mono = calculateMonolithicScaling(scenario);
    const micro = calculateMicroservicesScaling(scenario);
    
    const savings = mono.totalCost - micro.totalCost;
    const savingsPercent = (savings / mono.totalCost * 100).toFixed(1);
    
    totalMonolithicCost += mono.totalCost;
    totalMicroservicesCost += micro.totalCost;
    
    if (savings > 0) scenariosWhereMicroWins++;
    
    results.push({
      scenario: scenario.name || key,
      description: scenario.description || '',
      searchRPS: scenario.searchRPS,
      bookingRPS: scenario.bookingRPS,
      monolithicCost: mono.totalCost,
      microservicesCost: micro.totalCost,
      savings: savings,
      savingsPercent: savingsPercent,
      winner: savings > 0 ? 'Microservices' : savings < 0 ? 'Monolithic' : 'Tie',
    });
  }
  
  // Sort by savings (highest to lowest)
  results.sort((a, b) => b.savings - a.savings);
  
  // Print results
  console.log('📊 SCENARIO COMPARISON:\n');
  console.log('Scenario'.padEnd(30) + 'Load'.padEnd(20) + 'Mono'.padEnd(12) + 'Micro'.padEnd(12) + 'Savings'.padEnd(15) + 'Winner');
  console.log('-'.repeat(100));
  
  results.forEach(r => {
    const load = `${r.searchRPS}S + ${r.bookingRPS}B`;
    const savingsStr = r.savings > 0 
      ? `+$${r.savings} (${r.savingsPercent}%)`
      : r.savings < 0 
      ? `-$${Math.abs(r.savings)}`
      : '$0';
    
    console.log(
      r.scenario.padEnd(30) +
      load.padEnd(20) +
      `$${r.monolithicCost}`.padEnd(12) +
      `$${r.microservicesCost}`.padEnd(12) +
      savingsStr.padEnd(15) +
      (r.winner === 'Microservices' ? '✅ Micro' : r.winner === 'Monolithic' ? '❌ Mono' : '⚖️ Tie')
    );
  });
  
  console.log('-'.repeat(100));
  
  // Summary statistics
  const avgMonoCost = (totalMonolithicCost / totalScenarios).toFixed(2);
  const avgMicroCost = (totalMicroservicesCost / totalScenarios).toFixed(2);
  const totalSavings = totalMonolithicCost - totalMicroservicesCost;
  const microWinRate = (scenariosWhereMicroWins / totalScenarios * 100).toFixed(1);
  
  console.log('\n📈 SUMMARY STATISTICS:\n');
  console.log(`Total Scenarios Analyzed: ${totalScenarios}`);
  console.log(`Microservices Wins: ${scenariosWhereMicroWins} (${microWinRate}%)`);
  console.log(`\nAverage Monthly Cost:`);
  console.log(`  Monolithic:    $${avgMonoCost}`);
  console.log(`  Microservices: $${avgMicroCost}`);
  console.log(`\nTotal Monthly Savings: $${totalSavings}`);
  console.log(`Annual Savings: $${totalSavings * 12}`);
  
  console.log('\n🎓 KEY FINDINGS:\n');
  
  const highLoadScenarios = results.filter(r => r.searchRPS > 400);
  const avgSavingsHighLoad = highLoadScenarios.reduce((sum, r) => sum + r.savings, 0) / highLoadScenarios.length;
  
  console.log(`1. High Load (>400 RPS): Microservices saves avg $${avgSavingsHighLoad.toFixed(2)}/month`);
  console.log(`2. Microservices wins in ${microWinRate}% of scenarios`);
  console.log(`3. Best scenario for Microservices: ${results[0].scenario} (saves $${results[0].savings})`);
  console.log(`4. Worst scenario for Microservices: ${results[results.length - 1].scenario} (costs $${Math.abs(results[results.length - 1].savings)} more)`);
  
  console.log('\n💡 RECOMMENDATION:\n');
  if (totalSavings > 0) {
    console.log(`✅ Use Microservices - saves $${totalSavings * 12}/year across all scenarios`);
    console.log(`   Especially beneficial for uneven/high load scenarios`);
  } else {
    console.log(`⚠️ Microservices has higher overhead for your load patterns`);
    console.log(`   Consider if other benefits (scalability, fault isolation) justify the cost`);
  }
  
  // Save to file
  const fs = require('fs');
  fs.writeFileSync(
    '../results/comprehensive-analysis.json',
    JSON.stringify({ results, summary: { 
      totalScenarios,
      scenariosWhereMicroWins,
      microWinRate,
      avgMonoCost,
      avgMicroCost,
      totalSavings,
      annualSavings: totalSavings * 12
    }}, null, 2)
  );
  
  console.log('\n✅ Detailed results saved to results/comprehensive-analysis.json\n');
}

// Run if called directly
if (require.main === module) {
  runComprehensiveAnalysis();
}

module.exports = { runComprehensiveAnalysis };
