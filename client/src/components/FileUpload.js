import React, { useState, useRef } from 'react';
import styled from 'styled-components';

const UploadSection = styled.div`
  flex: 1;
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

const FileTypeTitle = styled.h3`
  color: #2c3e50;
`;

const FileDrop = styled.div`
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: background 0.3s;
  margin-bottom: 15px;
  
  &:hover, &.highlight {
    border-color: #3498db;
    background: #ecf0f1;
  }
`;

const FileStatus = styled.div`
  margin-top: 10px;
  font-style: italic;
  color: #7f8c8d;
  
  &.uploaded {
    color: #27ae60;
    font-weight: bold;
  }
`;

const CalculateButton = styled.button`
  background: #3498db;
  color: #fff;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.3s;
  width: 100%;
  margin-top: 20px;
  
  &:hover {
    background: #2980b9;
  }
  
  &:disabled {
    background: #95a5a6;
    cursor: not-allowed;
  }
`;

const FileUpload = ({ onCalculate, loading }) => {
  const [prefiFile, setPrefiFile] = useState(null);
  const [plaidFile, setPlaidFile] = useState(null);
  const [prefiDragActive, setPrefiDragActive] = useState(false);
  const [plaidDragActive, setPlaidDragActive] = useState(false);
  
  const prefiInputRef = useRef(null);
  const plaidInputRef = useRef(null);
  
  const handlePrefiClick = () => {
    prefiInputRef.current.click();
  };
  
  const handlePlaidClick = () => {
    plaidInputRef.current.click();
  };
  
  const handlePrefiChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPrefiFile(e.target.files[0]);
    }
  };
  
  const handlePlaidChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPlaidFile(e.target.files[0]);
    }
  };
  
  const handleDragOver = (e, setDragActive) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  
  const handleDragLeave = (e, setDragActive) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  
  const handlePrefiDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setPrefiDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setPrefiFile(e.dataTransfer.files[0]);
    }
  };
  
  const handlePlaidDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setPlaidDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setPlaidFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleCalculate = () => {
    if (prefiFile && plaidFile) {
      onCalculate(prefiFile, plaidFile);
    }
  };
  
  return (
    <UploadSection>
      <SectionTitle>Upload Files</SectionTitle>
      
      <FileTypeTitle>Prefi JSON</FileTypeTitle>
      <FileDrop 
        className={prefiDragActive ? 'highlight' : ''}
        onClick={handlePrefiClick}
        onDragOver={(e) => handleDragOver(e, setPrefiDragActive)}
        onDragLeave={(e) => handleDragLeave(e, setPrefiDragActive)}
        onDrop={handlePrefiDrop}
      >
        <p>
          Drag &amp; drop your <strong>prefi.json</strong><br />
          or click to select
        </p>
        <input 
          type="file" 
          ref={prefiInputRef}
          onChange={handlePrefiChange}
          accept=".json"
          style={{ display: 'none' }}
        />
      </FileDrop>
      <FileStatus className={prefiFile ? 'uploaded' : ''}>
        {prefiFile ? `File uploaded: ${prefiFile.name}` : 'No file uploaded'}
      </FileStatus>
      
      <FileTypeTitle>Plaid Assets JSON</FileTypeTitle>
      <FileDrop 
        className={plaidDragActive ? 'highlight' : ''}
        onClick={handlePlaidClick}
        onDragOver={(e) => handleDragOver(e, setPlaidDragActive)}
        onDragLeave={(e) => handleDragLeave(e, setPlaidDragActive)}
        onDrop={handlePlaidDrop}
      >
        <p>
          Drag &amp; drop your <strong>Plaid assets JSON</strong><br />
          or click to select
        </p>
        <input 
          type="file" 
          ref={plaidInputRef}
          onChange={handlePlaidChange}
          accept=".json"
          style={{ display: 'none' }}
        />
      </FileDrop>
      <FileStatus className={plaidFile ? 'uploaded' : ''}>
        {plaidFile ? `File uploaded: ${plaidFile.name}` : 'No file uploaded'}
      </FileStatus>
      
      <CalculateButton 
        onClick={handleCalculate} 
        disabled={!prefiFile || !plaidFile || loading}
      >
        {loading ? 'Calculating...' : 'Calculate Score'}
      </CalculateButton>
    </UploadSection>
  );
};

export default FileUpload;
