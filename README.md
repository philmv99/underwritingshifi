# Underwriting Score Calculator

A full stack application that calculates underwriting scores based on Prefi and Plaid JSON data.

## Features

- Upload Prefi and Plaid JSON files via a user-friendly interface
- Calculate underwriting scores based on financial data
- View detailed score breakdowns with progress bars
- Access the functionality via REST API
- Store calculation history in a database

## Architecture

- **Backend**: Node.js with Express
- **Frontend**: React with styled-components
- **Database**: SQLite for storing calculation history
- **API**: RESTful endpoints for score calculation and history retrieval

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Setup

1. Clone the repository:
```
git clone https://github.com/yourusername/underwriting-score-calculator.git
cd underwriting-score-calculator
```

2. Install backend dependencies:
```
cd server
npm install
```

3. Install frontend dependencies:
```
cd ../client
npm install
```

## Running the Application

### Development Mode

1. Start the backend server (from the server directory):
```
npm start
```
The server will run on http://localhost:3001

2. Start the frontend development server (from the client directory):
```
npm start
```
The frontend will run on http://localhost:3002

### Production Mode

1. Build the frontend:
```
cd client
npm run build
```

2. Copy the build files to the server's public directory:
```
mkdir -p ../server/public
cp -r build/* ../server/public/
```

3. Start the server in production mode:
```
cd ../server
NODE_ENV=production npm start
```

The application will be available at http://localhost:3001

## API Usage

The application provides a REST API for calculating underwriting scores. See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed information.

### Quick Example

```javascript
// Calculate score from JSON data
fetch('http://localhost:3001/api/score', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prefi: prefiData,
    plaid: plaidData
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

## Scoring Algorithm

The application calculates three main scores:

1. **Core Score (0-30)**: Based on traditional underwriting factors
   - Credit Score (0-5)
   - Income (0-5)
   - Employment (0-5)
   - DTI (0-5)
   - Adverse History (0-5)
   - Housing (0-5)

2. **Bayesian Score (0-15)**: Based on behavioral factors
   - Spending Behavior (0-5)
   - Repayment Behavior (0-5)
   - Behavioral Indicators (0-5)

3. **Total Score (0-45)**: Sum of Core Score and Bayesian Score

## License

This project is licensed under the MIT License - see the LICENSE file for details.
