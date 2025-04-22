import React, { useState } from 'react';
import styled from 'styled-components';
import FileUpload from './components/FileUpload';
import Results from './components/Results';
import ApiTest from './components/ApiTest';
import ApiService from './services/ApiService';

const AppContainer = styled.div`
  font-family: 'Segoe UI', sans-serif;
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  color: #333;
`;

const Title = styled.h1`
  color: #2c3e50;
`;

const Description = styled.p`
  margin-bottom: 20px;
`;

const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
`;

const ErrorBanner = styled.div`
  background-color: #f8d7da;
  color: #721c24;
  padding: 10px 15px;
  margin-bottom: 20px;
  border-radius: 4px;
  border: 1px solid #f5c6cb;
`;

const App = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleCalculate = async (prefiFile, plaidFile) => {
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('prefi', prefiFile);
      formData.append('plaid', plaidFile);
      
      const response = await ApiService.calculateScoreFromFiles(formData);
      setResults(response.data);
    } catch (err) {
      console.error('Error calculating score:', err);
      setError(err.response?.data?.message || err.message || 'An error occurred while calculating the score');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppContainer>
      <Title>Underwriting Score & Debit Summary</Title>
      <Description>
        Upload your <code>prefi.json</code> and a Plaid Assets JSON to calculate underwriting scores and view debit transactions.
      </Description>
      
      {error && <ErrorBanner>{error}</ErrorBanner>}
      
      <Container>
        <FileUpload onCalculate={handleCalculate} loading={loading} />
        <Results results={results} loading={loading} error={error} />
      </Container>
      
      <ApiTest />
    </AppContainer>
  );
};

export default App;
