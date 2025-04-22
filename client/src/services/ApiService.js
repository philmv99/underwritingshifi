import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000';

const ApiService = {
  calculateScoreFromFiles: (formData) => {
    return axios.post(`${API_URL}/api/score/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  calculateScore: (prefiData, plaidData) => {
    return axios.post(`${API_URL}/api/score`, {
      prefi: prefiData,
      plaid: plaidData
    });
  },
  
  getHistory: () => {
    return axios.get(`${API_URL}/api/history`);
  }
};

export default ApiService;
