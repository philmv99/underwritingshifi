import React from 'react';
import styled from 'styled-components';
import axios from 'axios';

const ApiTestContainer = styled.div`
  margin-top: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
`;

const Title = styled.h3`
  color: #2c3e50;
  margin-top: 0;
`;

const Description = styled.p`
  margin-bottom: 15px;
`;

const CodeBlock = styled.pre`
  background-color: #2c3e50;
  color: #ecf0f1;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  font-family: monospace;
`;

const ApiTest = () => {
  return (
    <ApiTestContainer>
      <Title>API Usage</Title>
      <Description>
        This application also provides a REST API that can be used to calculate underwriting scores programmatically.
      </Description>
      
      <Title>POST /api/score</Title>
      <Description>
        Send a POST request with prefi and plaid JSON data to calculate scores.
      </Description>
      <CodeBlock>
{`// Example request
fetch('/api/score', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prefi: { /* prefi.json data */ },
    plaid: { /* plaid assets data */ }
  })
})
.then(response => response.json())
.then(data => console.log(data));

// Example response
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
    ...
  }
}`}
      </CodeBlock>
      
      <Title>GET /api/history</Title>
      <Description>
        Retrieve the history of all score calculations.
      </Description>
      <CodeBlock>
{`// Example request
fetch('/api/history')
.then(response => response.json())
.then(data => console.log(data));

// Example response
[
  {
    "id": 1,
    "timestamp": "2025-04-22T09:30:00.000Z",
    "coreScore": 27,
    "bayesianScore": 12,
    "totalScore": 39,
    "simpleMonthlyIncome": 12000.50,
    "name": "Jane Doe",
    "emails": ["jane@example.com"],
    "phones": ["555-1234"],
    "details": { ... }
  },
  ...
]`}
      </CodeBlock>
    </ApiTestContainer>
  );
};

export default ApiTest;
