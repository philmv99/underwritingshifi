const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const scoringService = require('../services/scoring');

// Validation middleware
const validateJsonData = (req, res, next) => {
  try {
    const { prefi, plaid } = req.body;
    
    if (!prefi || !plaid) {
      return res.status(400).json({ error: 'Missing data', message: 'Both prefi and plaid data are required' });
    }
    
    // Basic validation for prefi data
    if (!prefi.DataPerfection && !prefi.DataEnhance && !prefi.Offers) {
      return res.status(400).json({ 
        error: 'Invalid prefi data', 
        message: 'The prefi data appears to be missing required fields (DataPerfection, DataEnhance, or Offers)' 
      });
    }
    
    // Basic validation for plaid data
    const items = (plaid.report?.items) || plaid.items || [];
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid plaid data', 
        message: 'The plaid data appears to be missing required fields (items or report.items)' 
      });
    }
    
    next();
  } catch (error) {
    return res.status(400).json({ 
      error: 'Validation error', 
      message: error.message || 'Error validating input data' 
    });
  }
};

// Set up multer for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Accept only JSON files
    if (path.extname(file.originalname).toLowerCase() !== '.json') {
      return cb(new Error('Only JSON files are allowed'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
}).fields([
  { name: 'prefi', maxCount: 1 },
  { name: 'plaid', maxCount: 1 }
]);

// Error handling middleware for multer
const handleFileUploadErrors = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          error: 'File too large', 
          message: 'File size exceeds the 10MB limit' 
        });
      }
      return res.status(400).json({ 
        error: 'Upload error', 
        message: err.message 
      });
    } else if (err) {
      // An unknown error occurred
      return res.status(400).json({ 
        error: 'Upload error', 
        message: err.message 
      });
    }
    
    // Everything went fine
    next();
  });
};

// POST /api/score - Process JSON data directly
router.post('/score', validateJsonData, async (req, res) => {
  try {
    const { prefi, plaid } = req.body;
    
    // Calculate scores
    const result = scoringService.calculateScores(prefi, plaid);
    
    // Save to database
    const db = req.app.locals.db;
    const { coreScore, bayesianScore, totalScore, simpleMonthlyIncome, name, emails, phones, details } = result;
    
    db.run(
      `INSERT INTO score_history (
        core_score, bayesian_score, total_score, simple_monthly_income, 
        name, emails, phones, details, request_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        coreScore, 
        bayesianScore, 
        totalScore, 
        simpleMonthlyIncome,
        name,
        JSON.stringify(emails || []),
        JSON.stringify(phones || []),
        JSON.stringify(details || {}),
        JSON.stringify({ prefi, plaid })
      ],
      function(err) {
        if (err) {
          console.error('Error saving to database:', err);
          // Continue with the response even if DB save fails
        }
      }
    );
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error processing score:', error);
    return res.status(500).json({ 
      error: 'Processing error', 
      message: error.message || 'Error processing score calculation' 
    });
  }
});

// POST /api/score/files - Process uploaded JSON files
router.post('/score/files', handleFileUploadErrors, async (req, res) => {
  try {
    if (!req.files || !req.files.prefi || !req.files.plaid) {
      return res.status(400).json({ 
        error: 'Missing files', 
        message: 'Both prefi and plaid files are required' 
      });
    }
    
    // Read uploaded files
    const prefiPath = req.files.prefi[0].path;
    const plaidPath = req.files.plaid[0].path;
    
    let prefiData, plaidData;
    
    try {
      prefiData = JSON.parse(fs.readFileSync(prefiPath, 'utf8'));
    } catch (error) {
      return res.status(400).json({ 
        error: 'Invalid prefi JSON', 
        message: 'The prefi file contains invalid JSON data' 
      });
    }
    
    try {
      plaidData = JSON.parse(fs.readFileSync(plaidPath, 'utf8'));
    } catch (error) {
      return res.status(400).json({ 
        error: 'Invalid plaid JSON', 
        message: 'The plaid file contains invalid JSON data' 
      });
    }
    
    // Basic validation
    if (!prefiData.DataPerfection && !prefiData.DataEnhance && !prefiData.Offers) {
      return res.status(400).json({ 
        error: 'Invalid prefi data', 
        message: 'The prefi data appears to be missing required fields (DataPerfection, DataEnhance, or Offers)' 
      });
    }
    
    const items = (plaidData.report?.items) || plaidData.items || [];
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid plaid data', 
        message: 'The plaid data appears to be missing required fields (items or report.items)' 
      });
    }
    
    // Calculate scores
    const result = scoringService.calculateScores(prefiData, plaidData);
    
    // Save to database
    const db = req.app.locals.db;
    const { coreScore, bayesianScore, totalScore, simpleMonthlyIncome, name, emails, phones, details } = result;
    
    db.run(
      `INSERT INTO score_history (
        core_score, bayesian_score, total_score, simple_monthly_income, 
        name, emails, phones, details, request_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        coreScore, 
        bayesianScore, 
        totalScore, 
        simpleMonthlyIncome,
        name,
        JSON.stringify(emails || []),
        JSON.stringify(phones || []),
        JSON.stringify(details || {}),
        JSON.stringify({ prefi: prefiData, plaid: plaidData })
      ],
      function(err) {
        if (err) {
          console.error('Error saving to database:', err);
          // Continue with the response even if DB save fails
        }
      }
    );
    
    // Clean up uploaded files
    try {
      fs.unlinkSync(prefiPath);
      fs.unlinkSync(plaidPath);
    } catch (error) {
      console.error('Error cleaning up files:', error);
      // Continue with the response even if cleanup fails
    }
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error processing score from files:', error);
    return res.status(500).json({ 
      error: 'Processing error', 
      message: error.message || 'Error processing score calculation from files' 
    });
  }
});

// GET /api/history - Get score calculation history
router.get('/history', (req, res) => {
  const db = req.app.locals.db;
  
  db.all(`SELECT 
    id, timestamp, core_score, bayesian_score, total_score, 
    simple_monthly_income, name, emails, phones, details 
    FROM score_history ORDER BY timestamp DESC`, [], (err, rows) => {
    if (err) {
      console.error('Error fetching history:', err);
      return res.status(500).json({ 
        error: 'Database error', 
        message: err.message || 'Error fetching calculation history' 
      });
    }
    
    try {
      // Parse JSON strings back to objects
      const history = rows.map(row => ({
        ...row,
        emails: JSON.parse(row.emails || '[]'),
        phones: JSON.parse(row.phones || '[]'),
        details: JSON.parse(row.details || '{}')
      }));
      
      return res.status(200).json(history);
    } catch (error) {
      console.error('Error parsing history data:', error);
      return res.status(500).json({ 
        error: 'Data parsing error', 
        message: 'Error parsing history data' 
      });
    }
  });
});

module.exports = router;
