import React from 'react';
import styled from 'styled-components';

const ResultsSection = styled.div`
  flex: 2;
  min-width: 300px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  color: #2c3e50;
  margin-top: 0;
`;

const Placeholder = styled.p`
  color: #7f8c8d;
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  padding: 10px;
  background-color: #fadbd8;
  border-radius: 4px;
  margin-bottom: 15px;
`;

const TotalScore = styled.div`
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  padding: 15px;
  margin: 20px 0;
  border-radius: 8px;
  background: #2c3e50;
  color: #fff;
`;

const ProgressContainer = styled.div`
  background: #eee;
  border-radius: 10px;
  height: 20px;
  width: 100%;
  margin: 10px 0;
`;

const ProgressBar = styled.div`
  background: #3498db;
  height: 100%;
  border-radius: 10px;
  transition: width 0.5s;
  width: ${props => props.percentage}%;
`;

const ScoreCategory = styled.div`
  margin-top: 15px;
  padding: 10px;
  border-left: 4px solid #3498db;
  background: #f8f9fa;
`;

const CategoryTitle = styled.h3`
  color: #2c3e50;
  margin-top: 0;
`;

const ScoreCard = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  padding: 8px;
  border-radius: 4px;
  background: ${props => props.index % 2 === 0 ? '#f2f2f2' : 'transparent'};
`;

const ScoreLabel = styled.span`
  font-weight: 600;
`;

const ScoreValue = styled.span`
  font-weight: bold;
  margin-left: 4px;
`;

const ScoreRaw = styled.span`
  color: #555;
  margin-left: 8px;
  font-size: 0.9em;
`;

const DetailsSection = styled.div`
  margin-top: 20px;
`;

const DetailsTitle = styled.h3`
  color: #2c3e50;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
`;

const TableHeader = styled.th`
  padding: 0.6rem 1rem;
  text-align: left;
  white-space: nowrap;
  background: #f8f9fa;
  position: sticky;
  top: 0;
  cursor: pointer;
`;

const TableRow = styled.tr`
  &:nth-child(odd) {
    background: #fff;
  }
  
  &:nth-child(even) {
    background: #f9f9f9;
  }
`;

const TableCell = styled.td`
  padding: 0.6rem 1rem;
  text-align: left;
  white-space: nowrap;
`;

const LoadingIndicator = styled.div`
  text-align: center;
  padding: 20px;
  color: #3498db;
  font-weight: bold;
`;

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

const Results = ({ results, loading, error }) => {
  if (loading) {
    return (
      <ResultsSection>
        <SectionTitle>Results</SectionTitle>
        <LoadingIndicator>Calculating scores...</LoadingIndicator>
      </ResultsSection>
    );
  }
  
  if (error) {
    return (
      <ResultsSection>
        <SectionTitle>Results</SectionTitle>
        <ErrorMessage>{error}</ErrorMessage>
        <Placeholder>Please check your JSON files and try again.</Placeholder>
      </ResultsSection>
    );
  }
  
  if (!results) {
    return (
      <ResultsSection>
        <SectionTitle>Results</SectionTitle>
        <Placeholder>Upload both files and click "Calculate Score" to display results.</Placeholder>
      </ResultsSection>
    );
  }
  
  const { 
    coreScore, 
    bayesianScore, 
    totalScore, 
    simpleMonthlyIncome,
    details 
  } = results;
  
  return (
    <ResultsSection>
      <SectionTitle>Results</SectionTitle>
      
      <TotalScore>
        Total Score: {totalScore}/45
        <ProgressContainer>
          <ProgressBar percentage={(totalScore / 45) * 100} />
        </ProgressContainer>
      </TotalScore>
      
      <ScoreCategory>
        <CategoryTitle>Core Score: {coreScore}/30</CategoryTitle>
        <ProgressContainer>
          <ProgressBar percentage={(coreScore / 30) * 100} />
        </ProgressContainer>
        
        <ScoreCard index={0}>
          <ScoreLabel>Credit Score:</ScoreLabel>
          <div>
            <ScoreValue>{details.creditScore}/5</ScoreValue>
            <ScoreRaw>Raw: {details.rawCreditScore}</ScoreRaw>
          </div>
        </ScoreCard>
        
        <ScoreCard index={1}>
          <ScoreLabel>Income:</ScoreLabel>
          <div>
            <ScoreValue>{details.incomeScore}/5</ScoreValue>
            <ScoreRaw>Raw: {formatCurrency(details.monthlyIncome * 12)}/year</ScoreRaw>
          </div>
        </ScoreCard>
        
        <ScoreCard index={2}>
          <ScoreLabel>Employment:</ScoreLabel>
          <div>
            <ScoreValue>{details.employmentScore}/5</ScoreValue>
            <ScoreRaw>Raw: {details.employmentYears.toFixed(1)} years</ScoreRaw>
          </div>
        </ScoreCard>
        
        <ScoreCard index={3}>
          <ScoreLabel>DTI:</ScoreLabel>
          <div>
            <ScoreValue>{details.dtiScore}/5</ScoreValue>
            <ScoreRaw>Raw: {(details.dti * 100).toFixed(1)}%</ScoreRaw>
          </div>
        </ScoreCard>
        
        <ScoreCard index={4}>
          <ScoreLabel>Adverse History:</ScoreLabel>
          <div>
            <ScoreValue>{details.adverseScore}/5</ScoreValue>
            <ScoreRaw>Raw lates: {details.lateCountLast2Years}{details.hasMajorDelinquency ? ', major' : ''}</ScoreRaw>
          </div>
        </ScoreCard>
        
        <ScoreCard index={5}>
          <ScoreLabel>Housing:</ScoreLabel>
          <div>
            <ScoreValue>{details.housingScore}/5</ScoreValue>
          </div>
        </ScoreCard>
      </ScoreCategory>
      
      <ScoreCategory>
        <CategoryTitle>Bayesian Score: {bayesianScore}/15</CategoryTitle>
        <ProgressContainer>
          <ProgressBar percentage={(bayesianScore / 15) * 100} />
        </ProgressContainer>
        
        <ScoreCard index={0}>
          <ScoreLabel>Spending:</ScoreLabel>
          <ScoreValue>{details.spendingScore}/5</ScoreValue>
        </ScoreCard>
        
        <ScoreCard index={1}>
          <ScoreLabel>Repayment:</ScoreLabel>
          <ScoreValue>{details.repaymentScore}/5</ScoreValue>
        </ScoreCard>
        
        <ScoreCard index={2}>
          <ScoreLabel>Behavioral:</ScoreLabel>
          <ScoreValue>{details.behavioralScore}/5</ScoreValue>
        </ScoreCard>
      </ScoreCategory>
      
      <DetailsSection>
        <DetailsTitle>Data Details</DetailsTitle>
        
        <ScoreCard index={0}>
          <ScoreLabel>Heuristic Monthly Income:</ScoreLabel>
          <ScoreValue>{formatCurrency(details.heuristicMonthlyIncome || 0)}</ScoreValue>
        </ScoreCard>
        
        <ScoreCard index={1}>
          <ScoreLabel>Simple Monthly Income:</ScoreLabel>
          <ScoreValue>{formatCurrency(simpleMonthlyIncome)}</ScoreValue>
        </ScoreCard>
        
        <ScoreCard index={2}>
          <ScoreLabel>Name:</ScoreLabel>
          <ScoreValue>{results.name || 'Not provided'}</ScoreValue>
        </ScoreCard>
        
        {results.emails && results.emails.length > 0 && (
          <ScoreCard index={3}>
            <ScoreLabel>Email:</ScoreLabel>
            <ScoreValue>{results.emails[0]}</ScoreValue>
          </ScoreCard>
        )}
        
        {results.phones && results.phones.length > 0 && (
          <ScoreCard index={4}>
            <ScoreLabel>Phone:</ScoreLabel>
            <ScoreValue>{results.phones[0]}</ScoreValue>
          </ScoreCard>
        )}
      </DetailsSection>
    </ResultsSection>
  );
};

export default Results;
