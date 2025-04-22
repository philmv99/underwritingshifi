const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Load the sample JSON files
const prefiData = JSON.parse(fs.readFileSync(path.join(__dirname, 'uploads', 'prefi_elaina.json'), 'utf8'));
const plaidData = JSON.parse(fs.readFileSync(path.join(__dirname, 'uploads', 'plaidassets_elaina.json'), 'utf8'));

// Test the direct JSON API endpoint
async function testDirectJsonEndpoint() {
  console.log('Testing POST /api/score endpoint with direct JSON data...');
  
  try {
    const response = await axios.post('http://localhost:3001/api/score', {
      prefi: prefiData,
      plaid: plaidData
    });
    
    console.log('API Response Status:', response.status);
    console.log('API Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Error testing API:', error.response ? error.response.data : error.message);
    throw error;
  }
}

// Test the history endpoint
async function testHistoryEndpoint() {
  console.log('\nTesting GET /api/history endpoint...');
  
  try {
    const response = await axios.get('http://localhost:3001/api/history');
    
    console.log('API Response Status:', response.status);
    console.log('API Response Data (first entry):');
    if (response.data && response.data.length > 0) {
      console.log(JSON.stringify(response.data[0], null, 2));
      console.log(`Total history entries: ${response.data.length}`);
    } else {
      console.log('No history entries found');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error testing history API:', error.response ? error.response.data : error.message);
    throw error;
  }
}

// Run the tests
async function runTests() {
  try {
    console.log('Starting API tests...\n');
    
    // Test direct JSON endpoint
    const scoreResult = await testDirectJsonEndpoint();
    
    // Test history endpoint
    const historyResult = await testHistoryEndpoint();
    
    console.log('\nAPI tests completed successfully!');
    
    // Validate the results
    if (scoreResult && scoreResult.totalScore) {
      console.log('\nValidation:');
      console.log(`- Total Score: ${scoreResult.totalScore}/45`);
      console.log(`- Core Score: ${scoreResult.coreScore}/30`);
      console.log(`- Bayesian Score: ${scoreResult.bayesianScore}/15`);
      console.log(`- Simple Monthly Income: $${scoreResult.simpleMonthlyIncome.toFixed(2)}`);
      
      if (scoreResult.details) {
        console.log('- Details included: Yes');
      }
      
      console.log('\nAPI functionality is working correctly!');
    } else {
      console.error('\nValidation failed: Score result is incomplete or invalid');
    }
  } catch (error) {
    console.error('\nAPI tests failed:', error.message);
  }
}

// Run the tests
runTests();
