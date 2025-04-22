# Underwriting Score Calculator API Documentation

## Overview

The Underwriting Score Calculator API provides endpoints for calculating underwriting scores based on Prefi and Plaid data. It processes financial information to generate core scores, Bayesian scores, and total scores that can be used for underwriting decisions.

## Base URL

When running locally, the API is available at:
```
http://localhost:3001
```

## Authentication

Currently, the API does not require authentication. This is suitable for development and testing purposes. For production deployment, appropriate authentication mechanisms should be implemented.

## Endpoints

### Calculate Score

**Endpoint:** `POST /api/score`

**Description:** Calculates underwriting scores based on provided Prefi and Plaid JSON data.

**Request Body:**
```json
{
  "prefi": { /* full prefi.json data */ },
  "plaid": { /* full Plaid Assets or Asset-Report JSON */ }
}
```

**Response:**
```json
{
  "coreScore": 27,
  "bayesianScore": 12,
  "totalScore": 39,
  "simpleMonthlyIncome": 12000.50,
  "name": "Jane Doe",
  "emails": ["jane@example.com"],
  "phones": ["555-1234"],
  "details": {
    "rawCreditScore": 725,
    "dti": 0.18,
    "employmentYears": 3.2,
    "lateCountLast2Years": 2,
    "hasMajorDelinquency": false,
    "creditScore": 4,
    "incomeScore": 5,
    "employmentScore": 4,
    "dtiScore": 4,
    "adverseScore": 5,
    "housingScore": 5,
    "spendingScore": 4,
    "repaymentScore": 4,
    "behavioralScore": 4,
    "monthlyIncome": 12000.50,
    "staticAnnual": 144000,
    "heuristicMonthlyIncome": 12000.50
  }
}
```

### Calculate Score from Files

**Endpoint:** `POST /api/score/files`

**Description:** Calculates underwriting scores based on uploaded Prefi and Plaid JSON files.

**Request:**
- Content-Type: `multipart/form-data`
- Form fields:
  - `prefi`: File upload for prefi.json
  - `plaid`: File upload for Plaid Assets JSON

**Response:** Same as the `/api/score` endpoint.

### Get Calculation History

**Endpoint:** `GET /api/history`

**Description:** Retrieves the history of all score calculations.

**Response:**
```json
[
  {
    "id": 1,
    "timestamp": "2025-04-22T09:30:00.000Z",
    "core_score": 27,
    "bayesian_score": 12,
    "total_score": 39,
    "simple_monthly_income": 12000.50,
    "name": "Jane Doe",
    "emails": ["jane@example.com"],
    "phones": ["555-1234"],
    "details": {
      "rawCreditScore": 725,
      "dti": 0.18,
      "employmentYears": 3.2,
      "lateCountLast2Years": 2,
      "hasMajorDelinquency": false,
      "creditScore": 4,
      "incomeScore": 5,
      "employmentScore": 4,
      "dtiScore": 4,
      "adverseScore": 5,
      "housingScore": 5,
      "spendingScore": 4,
      "repaymentScore": 4,
      "behavioralScore": 4,
      "monthlyIncome": 12000.50,
      "staticAnnual": 144000,
      "heuristicMonthlyIncome": 12000.50
    }
  },
  // Additional history entries...
]
```

## Scoring Algorithm

The API calculates three main scores:

1. **Core Score (0-30)**: Based on traditional underwriting factors
   - Credit Score (0-5): Based on the maximum credit score from Prefi Offers
   - Income (0-5): Based on monthly income from Plaid transactions or Prefi data
   - Employment (0-5): Based on employment history from Plaid transactions
   - DTI (0-5): Based on debt-to-income ratio from Prefi data
   - Adverse History (0-5): Based on late payments and major delinquencies
   - Housing (0-5): Based on rent/mortgage payment consistency

2. **Bayesian Score (0-15)**: Based on behavioral factors
   - Spending Behavior (0-5): Based on discretionary spending patterns
   - Repayment Behavior (0-5): Based on late payment history
   - Behavioral Indicators (0-5): Based on potentially wasteful spending

3. **Total Score (0-45)**: Sum of Core Score and Bayesian Score

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `200 OK`: Successful request
- `400 Bad Request`: Invalid input data
- `500 Internal Server Error`: Server-side error

Error responses include a descriptive message:

```json
{
  "error": "Invalid prefi data",
  "message": "The prefi data appears to be missing required fields"
}
```

## Code Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

// Example: Calculate score from JSON data
async function calculateScore(prefiData, plaidData) {
  try {
    const response = await axios.post('http://localhost:3001/api/score', {
      prefi: prefiData,
      plaid: plaidData
    });
    return response.data;
  } catch (error) {
    console.error('Error calculating score:', error.response?.data || error.message);
    throw error;
  }
}

// Example: Upload JSON files
async function calculateScoreFromFiles(prefiFile, plaidFile) {
  try {
    const formData = new FormData();
    formData.append('prefi', prefiFile);
    formData.append('plaid', plaidFile);
    
    const response = await axios.post('http://localhost:3001/api/score/files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error calculating score from files:', error.response?.data || error.message);
    throw error;
  }
}

// Example: Get calculation history
async function getHistory() {
  try {
    const response = await axios.get('http://localhost:3001/api/history');
    return response.data;
  } catch (error) {
    console.error('Error fetching history:', error.response?.data || error.message);
    throw error;
  }
}
```

### Python

```python
import requests
import json

# Example: Calculate score from JSON data
def calculate_score(prefi_data, plaid_data):
    try:
        response = requests.post(
            'http://localhost:3001/api/score',
            json={
                'prefi': prefi_data,
                'plaid': plaid_data
            }
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error calculating score: {e}")
        raise

# Example: Upload JSON files
def calculate_score_from_files(prefi_file_path, plaid_file_path):
    try:
        files = {
            'prefi': open(prefi_file_path, 'rb'),
            'plaid': open(plaid_file_path, 'rb')
        }
        response = requests.post(
            'http://localhost:3001/api/score/files',
            files=files
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error calculating score from files: {e}")
        raise
    finally:
        files['prefi'].close()
        files['plaid'].close()

# Example: Get calculation history
def get_history():
    try:
        response = requests.get('http://localhost:3001/api/history')
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching history: {e}")
        raise
```

## Rate Limiting

Currently, there are no rate limits implemented. For production use, consider implementing appropriate rate limiting to prevent abuse.

## Data Requirements

### Prefi JSON

The Prefi JSON should contain:
- `Offers`: Array of credit offers with `Score` field
- `DataEnhance`: Object containing `DebtToIncome` field
- `DataPerfection`: Object containing personal information, income, and assets

### Plaid JSON

The Plaid JSON should contain:
- `items` or `report.items`: Array of account items
- Each item should have `accounts` array
- Each account should have `transactions` array
- Transactions should include fields like `date`, `amount`, `category`, etc.

## Limitations

- The API is designed for development and testing purposes
- Large JSON files may impact performance
- No authentication or authorization mechanisms are currently implemented
